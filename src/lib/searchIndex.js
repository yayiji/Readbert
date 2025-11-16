/**
 * Search Index for Dilbert Comics
 * Builds and manages searchable index using transcript database
 */

import { indexedDB, STORES } from './indexedDBManager.js';
import { transcriptDatabase } from './transcriptDatabase.js';

// Constants
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

class SearchIndex {
  constructor() {
    this.index = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = 'dilbert-search-index';
    this.metaCacheKey = 'dilbert-search-index-meta';
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
      await indexedDB.delete(STORES.SEARCH_INDEX, this.cacheKey);
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

    const cachedIndex = await this._loadFromCache();
    if (cachedIndex) {
      this._loadCachedIndex(cachedIndex);
    } else {
      console.log('📝 Building search index from transcript database...');
      this._buildFromTranscriptDatabase();
      await this._saveToCache();
    }

    console.log(`✅ Search index loaded in ${Date.now() - startTime}ms`);
    console.log(`📊 ${transcriptDatabase.getStats().totalTranscripts} comics, ${this.index.size} words indexed`);
    this.isLoaded = true;
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

  _loadCachedIndex(indexData) {
    this.index.clear();
    for (const [word, dates] of Object.entries(indexData)) {
      this.index.set(word, new Set(dates));
    }
  }

  // ===== CACHE MANAGEMENT =====

  async _loadFromCache() {
    try {
      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (!cachedMeta) return null;

      const meta = JSON.parse(cachedMeta);
      const cacheAge = Date.now() - new Date(meta.cachedAt).getTime();

      if (cacheAge >= CACHE_MAX_AGE) {
        console.log('🔄 Cache is outdated, will rebuild index');
        return null;
      }

      const cachedData = await indexedDB.get(STORES.SEARCH_INDEX, this.cacheKey);
      if (cachedData) {
        console.log(`💾 Loaded search index from cache (${meta.totalWords} words)`);
      }
      return cachedData;
    } catch (error) {
      console.warn('Error loading from cache:', error);
      return null;
    }
  }

  async _saveToCache() {
    try {
      const indexData = {};
      for (const [word, dates] of this.index.entries()) {
        indexData[word] = Array.from(dates);
      }

      const meta = {
        totalWords: this.index.size,
        cachedAt: new Date().toISOString()
      };
      localStorage.setItem(this.metaCacheKey, JSON.stringify(meta));

      await indexedDB.put(STORES.SEARCH_INDEX, indexData, this.cacheKey);

      const sizeMB = (JSON.stringify(indexData).length / 1024 / 1024).toFixed(2);
      console.log(`💾 Search index cached successfully (${sizeMB} MB)`);
    } catch (error) {
      console.warn('Failed to cache search index:', error);
    }
  }

  _getCacheInfo() {
    try {
      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (cachedMeta) {
        const meta = JSON.parse(cachedMeta);
        return {
          hasCachedData: true,
          cachedAt: meta.cachedAt,
          totalWords: meta.totalWords
        };
      }
    } catch (error) {}
    return { hasCachedData: false };
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
