/**
 * Search Index for Dilbert Comics
 * Builds and manages searchable index using transcript database
 */

import { openDB } from 'idb';
import { transcriptDatabase } from './transcriptDatabase.js';

// Constants
const INDEX_URL = '/dilbert-index/search-index.min.json';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

class SearchIndex {
  constructor() {
    this.index = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = 'dilbert-search-index';
    this.metaCacheKey = 'dilbert-search-index-meta';
    this.dbName = 'DilbertSearchDB';
    this.dbVersion = 1;
    this.storeName = 'searchIndex';
  }

  // ===== PUBLIC API =====

  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this._buildIndex();
    return this.loadPromise;
  }

  search(query, maxResults = 50) {
    if (!this.isLoaded) {
      throw new Error('Search index not loaded');
    }
    if (!transcriptDatabase.isDatabaseLoaded()) {
      throw new Error('Transcript database not loaded');
    }
    if (!query?.trim()) return [];

    const queryLower = query.toLowerCase();
    const queryWords = this._extractWords(queryLower);
    if (queryWords.length === 0) return [];

    const candidateComics = new Set();
    for (const word of queryWords) {
      const comicsWithWord = this.index.get(word);
      if (comicsWithWord) {
        for (const date of comicsWithWord) {
          candidateComics.add(date);
        }
      }
    }

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
          score: this._scoreComic(comic, queryLower, matches)
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  getComic(date) {
    return transcriptDatabase.getTranscript(date);
  }

  isIndexLoaded() {
    return this.isLoaded;
  }

  getStats() {
    const transcriptStats = transcriptDatabase.getStats();
    return {
      totalComics: transcriptStats.totalTranscripts,
      totalWords: this.index.size,
      isLoaded: this.isLoaded,
      cache: this._getCacheInfo(),
      transcriptDatabase: transcriptStats
    };
  }

  async clearCache() {
    try {
      localStorage.removeItem(this.metaCacheKey);
      if (this._isIndexedDBSupported()) {
        const db = await this._initDB();
        if (db) await db.delete(this.storeName, this.cacheKey);
      }
      console.log('🗑️ Search index cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  async forceRefresh() {
    await this.clearCache();
    await transcriptDatabase.forceRefresh();
    this.isLoaded = false;
    this.loadPromise = null;
    this.index.clear();
    return this.load();
  }

  // ===== LOADING =====

  async _buildIndex() {
    if (this.isLoaded) return;

    console.log('Loading search index...');
    const startTime = Date.now();
    await transcriptDatabase.load();

    const pregenerated = await this._loadPregeneratedIndex();
    if (pregenerated) {
      this._loadFromPregenerated(pregenerated);
    } else {
      console.log('📝 Building search index from transcript database...');
      this._buildFromTranscriptDatabase();
    }

    console.log(`✅ Search index loaded in ${Date.now() - startTime}ms`);
    console.log(`📊 ${transcriptDatabase.getStats().totalTranscripts} comics, ${this.index.size} words indexed`);
    this.isLoaded = true;
  }

  async _loadPregeneratedIndex() {
    try {
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log(`✅ Loaded search index from cache (v${cachedData.version})`);
        return cachedData;
      }

      console.log('📥 Fetching search index from server...');
      const response = await fetch(INDEX_URL);
      if (!response.ok) {
        console.log('Pregenerated index not found, will build from transcripts');
        return null;
      }

      const data = await response.json();
      console.log(`📦 Downloaded search index (v${data.version}) from ${data.generatedAt}`);
      await this._saveToCache(data);
      return data;
    } catch (error) {
      console.warn('Failed to load pregenerated index:', error);
      const cachedData = await this._loadFromCache(true);
      if (cachedData) {
        console.log('⚠️ Using stale cached index due to server error');
        return cachedData;
      }
      throw new Error('Search index unavailable and no cached version found');
    }
  }

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

  _indexTranscript(transcript) {
    const allText = [];
    for (const panel of transcript.panels) {
      for (const dialogue of panel.dialogue) {
        allText.push(dialogue);
      }
    }

    const text = allText.join(' ').toLowerCase();
    const words = this._extractWords(text);

    for (const word of words) {
      if (!this.index.has(word)) {
        this.index.set(word, new Set());
      }
      this.index.get(word).add(transcript.date);
    }
  }

  _loadFromPregenerated(data) {
    this.index.clear();
    for (const [word, dates] of Object.entries(data.wordIndex)) {
      this.index.set(word, new Set(dates));
    }
  }

  // ===== CACHE MANAGEMENT =====

  async _loadFromCache(ignoreValidation = false) {
    try {
      if (!this._isIndexedDBSupported()) return null;

      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (!cachedMeta) return null;

      const meta = JSON.parse(cachedMeta);

      if (!ignoreValidation && !(await this._isCacheValid(meta))) {
        console.log('🔄 Cache is outdated, will fetch from server');
        return null;
      }

      const db = await this._initDB();
      if (!db) return null;

      const cachedData = await db.get(this.storeName, this.cacheKey);
      if (cachedData) {
        console.log(`💾 Found cached index: ${meta.totalComics} comics, ${meta.totalWords} words`);
      }
      return cachedData;
    } catch (error) {
      console.warn('Error loading from cache:', error);
      return null;
    }
  }

  async _saveToCache(data) {
    try {
      if (!this._isIndexedDBSupported()) {
        console.log('IndexedDB not supported, skipping cache');
        return;
      }

      const meta = {
        version: data.version,
        generatedAt: data.generatedAt,
        totalComics: data.stats.totalComics,
        totalWords: data.stats.totalWords,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(this.metaCacheKey, JSON.stringify(meta));

      const db = await this._initDB();
      if (db) {
        await db.put(this.storeName, data, this.cacheKey);
      }

      const sizeMB = (JSON.stringify(data).length / 1024 / 1024).toFixed(2);
      console.log(`💾 Search index cached successfully (${sizeMB} MB)`);
    } catch (error) {
      console.warn('Failed to cache search index:', error);
    }
  }

  async _isCacheValid(meta) {
    try {
      const response = await fetch(INDEX_URL, { method: 'HEAD' });
      if (!response.ok) return true;

      const lastModified = response.headers.get('Last-Modified');
      if (lastModified) {
        return new Date(lastModified) <= new Date(meta.cachedAt);
      }

      const cacheAge = Date.now() - new Date(meta.cachedAt).getTime();
      return cacheAge < CACHE_MAX_AGE;
    } catch (error) {
      return true;
    }
  }

  _getCacheInfo() {
    try {
      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (cachedMeta) {
        const meta = JSON.parse(cachedMeta);
        return {
          hasCachedData: true,
          version: meta.version,
          cachedAt: meta.cachedAt,
          generatedAt: meta.generatedAt
        };
      }
    } catch (error) {}
    return { hasCachedData: false };
  }

  // ===== INDEXEDDB =====

  async _initDB() {
    if (!this._isIndexedDBSupported()) return null;

    return openDB(this.dbName, this.dbVersion, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('searchIndex')) {
          db.createObjectStore('searchIndex');
        }
      }
    });
  }

  _isIndexedDBSupported() {
    return typeof window !== 'undefined' && 'indexedDB' in window && indexedDB !== null;
  }

  // ===== SEARCH UTILITIES =====

  _extractWords(text) {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  _findMatches(comic, query) {
    const matches = [];

    for (let panelIndex = 0; panelIndex < comic.panels.length; panelIndex++) {
      const panel = comic.panels[panelIndex];

      for (let dialogueIndex = 0; dialogueIndex < panel.dialogue.length; dialogueIndex++) {
        const dialogue = panel.dialogue[dialogueIndex];
        const dialogueLower = dialogue.toLowerCase();

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
            matchText: dialogue.substring(index, index + query.length)
          });

          startIndex = index + 1;
        }
      }
    }

    return matches;
  }

  _scoreComic(comic, query, matches) {
    let score = matches.length * 10;

    const exactMatches = matches.filter((match) =>
      match.dialogue.toLowerCase().includes(query)
    );
    score += exactMatches.length * 20;

    for (const match of matches) {
      const dialogueLength = match.dialogue.length;
      if (dialogueLength < 50) score += 15;
      else if (dialogueLength < 100) score += 10;
      else score += 5;
    }

    return score;
  }
}

// ===== EXPORTS =====

export const searchIndex = new SearchIndex();

export function highlightText(text, query) {
  if (!query || !text) return text;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  let result = '';
  let lastIndex = 0;
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const index = textLower.indexOf(queryLower, currentIndex);
    if (index === -1) {
      result += text.substring(lastIndex);
      break;
    }

    result += text.substring(lastIndex, index);
    const match = text.substring(index, index + query.length);
    result += '<mark>' + match + '</mark>';

    lastIndex = index + query.length;
    currentIndex = index + query.length;
  }

  return result;
}
