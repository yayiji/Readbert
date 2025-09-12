/**
 * Search Index Builder and Manager for Dilbert Comics
 * Builds and manages a searchable index using the transcript database
 */

import { openDB } from 'idb';
import { transcriptDatabase } from './transcriptDatabase.js';

class SearchIndex {
  constructor() {
    this.index = new Map(); // word -> Set of comic dates
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = "dilbert-search-index";
    this.metaCacheKey = "dilbert-search-index-meta";
    this.dbName = "DilbertSearchDB";
    this.dbVersion = 1;
    this.storeName = "searchIndex";
  }

  /**
   * Initialize IndexedDB database
   */
  async _initDB() {
    if (!this._isIndexedDBSupported()) {
      return null;
    }
    
    return openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      },
    });
  }

  /**
   * Load the search index
   */
  async load() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._buildIndex();
    return this.loadPromise;
  }

  async _buildIndex() {
    if (this.isLoaded) return;

    console.log("Loading search index...");
    const startTime = Date.now();

    // Ensure transcript database is loaded first
    await transcriptDatabase.load();

    // Try to load pregenerated search index
    const pregenerated = await this._loadPregeneratedIndex();
    if (pregenerated) {
      this._loadFromPregenerated(pregenerated);
      const duration = Date.now() - startTime;
      console.log(`✅ Search index loaded in ${duration}ms`);
      console.log(
        `📊 ${transcriptDatabase.getStats().totalTranscripts} comics, ${this.index.size} words indexed`
      );
      this.isLoaded = true;
      return;
    }

    // Fallback: build index from transcript database
    console.log("📝 Building search index from transcript database...");
    this._buildFromTranscriptDatabase();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Search index built from transcript database in ${duration}ms`);
    console.log(
      `📊 ${transcriptDatabase.getStats().totalTranscripts} comics, ${this.index.size} words indexed`
    );
    this.isLoaded = true;
  }

  /**
   * Try to load pregenerated search index with smart caching
   */
  async _loadPregeneratedIndex() {
    try {
      // First, check if we have a cached version
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log(
          `✅ Loaded search index from cache (v${cachedData.version})`
        );
        return cachedData;
      }

      // No cache or cache is stale, fetch from server
      console.log("📥 Fetching search index from server...");
      const response = await fetch("/search-index.min.json");
      if (!response.ok) {
        console.log(
          "Pregenerated index file not found, will build from transcripts"
        );
        return null;
      }

      const data = await response.json();
      console.log(
        `📦 Downloaded search index (v${data.version}) from ${data.generatedAt}`
      );

      // Cache the new data
      await this._saveToCache(data);

      return data;
    } catch (error) {
      console.warn("Failed to load pregenerated index:", error);
      // Try to load from cache even if server fetch failed
      const cachedData = await this._loadFromCache(true);
      if (cachedData) {
        console.log("⚠️ Using stale cached index due to server error");
        return cachedData;
      }
      // No fallback available
      throw new Error("Search index unavailable and no cached version found");
    }
  }

  /**
   * Build search index from transcript database (fallback method)
   */
  _buildFromTranscriptDatabase() {
    this.index.clear();
    
    const availableDates = transcriptDatabase.getAvailableDates();
    
    for (const date of availableDates) {
      const transcript = transcriptDatabase.getTranscript(date);
      if (transcript) {
        this._indexTranscript(transcript);
      }
    }
  }

  /**
   * Add a transcript to the search index
   */
  _indexTranscript(transcript) {
    // Extract all text from the transcript
    const allText = [];
    for (const panel of transcript.panels) {
      for (const dialogue of panel.dialogue) {
        allText.push(dialogue);
      }
    }
    
    // Index all words
    const text = allText.join(' ').toLowerCase();
    const words = this._extractWords(text);
    
    for (const word of words) {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }
      this.index.get(word).add(transcript.date);
    }
  }

  /**
   * Load search index from browser cache (IndexedDB)
   */
  async _loadFromCache(ignoreVersion = false) {
    try {
      if (!this._isIndexedDBSupported()) {
        return null;
      }

      // Check cache metadata first
      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (!cachedMeta) {
        return null;
      }

      const meta = JSON.parse(cachedMeta);

      // Check if cache is still valid (unless ignoring version check)
      if (!ignoreVersion) {
        const isValid = await this._isCacheValid(meta);
        if (!isValid) {
          console.log("🔄 Cache is outdated, will fetch from server");
          return null;
        }
      }

      // Load the actual data from IndexedDB
      const cachedData = await this._getFromIndexedDB();
      if (cachedData) {
        console.log(
          `💾 Found cached index: ${meta.totalComics} comics, ${meta.totalWords} words`
        );
        return cachedData;
      }

      return null;
    } catch (error) {
      console.warn("Error loading from cache:", error);
      return null;
    }
  }

  /**
   * Save search index to browser cache
   */
  async _saveToCache(data) {
    try {
      if (!this._isIndexedDBSupported()) {
        console.log("IndexedDB not supported, skipping cache");
        return;
      }

      // Save metadata to localStorage for quick access
      const meta = {
        version: data.version,
        generatedAt: data.generatedAt,
        totalComics: data.stats.totalComics,
        totalWords: data.stats.totalWords,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.metaCacheKey, JSON.stringify(meta));

      // Save full data to IndexedDB
      await this._saveToIndexedDB(data);

      console.log(
        `💾 Search index cached successfully (${(
          JSON.stringify(data).length /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
    } catch (error) {
      console.warn("Failed to cache search index:", error);
    }
  }

  /**
   * Check if cached version is still valid
   */
  async _isCacheValid(meta) {
    try {
      // Check server for metadata without downloading full index
      const response = await fetch("/search-index.min.json", {
        method: "HEAD",
      });

      if (!response.ok) {
        // Server error, use cache if available
        return true;
      }

      // Check Last-Modified header
      const lastModified = response.headers.get("Last-Modified");
      if (lastModified) {
        const serverTime = new Date(lastModified);
        const cacheTime = new Date(meta.cachedAt);
        return serverTime <= cacheTime;
      }

      // Fallback: cache is valid for 24 hours
      const cacheAge = Date.now() - new Date(meta.cachedAt).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      return cacheAge < maxAge;
    } catch (error) {
      // Network error, assume cache is valid
      return true;
    }
  }

  /**
   * Check if IndexedDB is supported
   */
  _isIndexedDBSupported() {
    return (
      typeof window !== "undefined" &&
      "indexedDB" in window &&
      indexedDB !== null
    );
  }

  /**
   * Save data to IndexedDB using idb library
   */
  async _saveToIndexedDB(data) {
    try {
      const db = await this._initDB();
      if (!db) return;

      await db.put(this.storeName, data, this.cacheKey);
    } catch (error) {
      console.warn('Failed to save to IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Get data from IndexedDB using idb library
   */
  async _getFromIndexedDB() {
    try {
      const db = await this._initDB();
      if (!db) return null;

      return await db.get(this.storeName, this.cacheKey);
    } catch (error) {
      console.warn('Failed to get from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Clear cached search index (for debugging or manual refresh)
   */
  async clearCache() {
    try {
      // Clear localStorage metadata
      localStorage.removeItem(this.metaCacheKey);

      // Clear IndexedDB data
      if (this._isIndexedDBSupported()) {
        await this._clearIndexedDB();
      }

      console.log("🗑️ Search index cache cleared");
    } catch (error) {
      console.warn("Error clearing cache:", error);
    }
  }

  /**
   * Clear IndexedDB data using idb library
   */
  async _clearIndexedDB() {
    try {
      const db = await this._initDB();
      if (!db) return;

      await db.delete(this.storeName, this.cacheKey);
    } catch (error) {
      console.warn('Failed to clear IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Load index from pregenerated data (search index only, transcripts come from transcript database)
   */
  _loadFromPregenerated(data) {
    // Load word index: Object<word, Array<dates>> -> Map<word, Set<dates>>
    this.index.clear();
    for (const [word, dates] of Object.entries(data.wordIndex)) {
      this.index.set(word, new Set(dates));
    }
  }

  /**
   * Extract searchable words from text (used by search functionality)
   */
  _extractWords(text) {
    // Remove punctuation and split into words
    return text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2) // Skip very short words
      .map((word) => word.toLowerCase());
  }

  /**
   * Search for comics containing the query text
   */
  search(query, maxResults = 50) {
    if (!this.isLoaded) {
      throw new Error("Search index not loaded. Call load() first.");
    }

    if (!transcriptDatabase.isDatabaseLoaded()) {
      throw new Error("Transcript database not loaded. Please wait for it to load.");
    }

    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryWords = this._extractWords(queryLower);

    if (queryWords.length === 0) {
      return [];
    }

    // Find comics that contain any of the query words
    const candidateComics = new Set();

    for (const word of queryWords) {
      const comicsWithWord = this.index.get(word);
      if (comicsWithWord) {
        for (const date of comicsWithWord) {
          candidateComics.add(date);
        }
      }
    }

    // Score and filter results
    const results = [];
    for (const date of candidateComics) {
      const comic = transcriptDatabase.getTranscript(date);
      if (!comic) continue;

      const matches = this._findMatches(comic, queryLower);
      if (matches.length > 0) {
        results.push({
          date,
          comic,
          matches,
          score: this._scoreComic(comic, queryLower, matches),
        });
      }
    }

    // Sort by relevance score and return top results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  /**
   * Find exact matches in a comic for highlighting
   */
  _findMatches(comic, query) {
    const matches = [];

    for (let panelIndex = 0; panelIndex < comic.panels.length; panelIndex++) {
      const panel = comic.panels[panelIndex];

      for (
        let dialogueIndex = 0;
        dialogueIndex < panel.dialogue.length;
        dialogueIndex++
      ) {
        const dialogue = panel.dialogue[dialogueIndex];
        const dialogueLower = dialogue.toLowerCase();

        // Find all occurrences of the query in this dialogue
        let startIndex = 0;
        while (true) {
          const index = dialogueLower.indexOf(query, startIndex);
          if (index === -1) break;

          matches.push({
            panelIndex,
            dialogueIndex,
            dialogue,
            matchStart: index,
            matchEnd: index + query.length,
            matchText: dialogue.substring(index, index + query.length),
          });

          startIndex = index + 1;
        }
      }
    }

    return matches;
  }

  /**
   * Score a comic based on relevance to the query
   */
  _scoreComic(comic, query, matches) {
    let score = 0;

    // Base score for each match
    score += matches.length * 10;

    // Bonus for exact phrase matches
    const exactMatches = matches.filter((match) =>
      match.dialogue.toLowerCase().includes(query)
    );
    score += exactMatches.length * 20;

    // Bonus for matches in shorter dialogues (more specific)
    for (const match of matches) {
      const dialogueLength = match.dialogue.length;
      if (dialogueLength < 50) score += 15;
      else if (dialogueLength < 100) score += 10;
      else score += 5;
    }

    return score;
  }

  /**
   * Get a comic by date (uses transcript database)
   */
  getComic(date) {
    return transcriptDatabase.getTranscript(date);
  }

  /**
   * Check if the index is loaded
   */
  isIndexLoaded() {
    return this.isLoaded;
  }

  /**
   * Get search statistics including cache info
   */
  getStats() {
    const cacheInfo = this._getCacheInfo();
    const transcriptStats = transcriptDatabase.getStats();
    return {
      totalComics: transcriptStats.totalTranscripts,
      totalWords: this.index.size,
      isLoaded: this.isLoaded,
      cache: cacheInfo,
      transcriptDatabase: transcriptStats,
    };
  }

  /**
   * Get cache information
   */
  _getCacheInfo() {
    try {
      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (cachedMeta) {
        const meta = JSON.parse(cachedMeta);
        return {
          hasCachedData: true,
          version: meta.version,
          cachedAt: meta.cachedAt,
          generatedAt: meta.generatedAt,
        };
      }
    } catch (error) {
      // Ignore errors
    }
    return {
      hasCachedData: false,
    };
  }

  /**
   * Force refresh the search index from server
   */
  async forceRefresh() {
    await this.clearCache();
    await transcriptDatabase.forceRefresh();
    this.isLoaded = false;
    this.loadPromise = null;
    this.index.clear();
    return this.load();
  }
}

// Create and export a singleton instance
export const searchIndex = new SearchIndex();

// Helper function to highlight matches in text
export function highlightText(text, query) {
  if (!query || !text) return text;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let result = "";
  let lastIndex = 0;
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const index = textLower.indexOf(queryLower, currentIndex);
    if (index === -1) {
      // No more matches, append the rest of the text
      result += text.substring(lastIndex);
      break;
    }

    // Add text before the match
    result += text.substring(lastIndex, index);

    // Add the highlighted match
    const match = text.substring(index, index + query.length);
    result += "<mark>" + match + "</mark>";

    // Update indices
    lastIndex = index + query.length;
    currentIndex = index + query.length;
  }

  return result;
}
