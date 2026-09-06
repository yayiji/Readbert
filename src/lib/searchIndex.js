import { indexedDB, STORES } from './indexedDBManager.js';
import { transcriptIndex } from './transcriptIndex.js';

class SearchIndex {
  constructor() {
    this.index = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = 'dilbert-search-index';
  }

  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.#buildIndex();
    return this.loadPromise;
  }

  search(query, maxResults = 50) {
    if (!this.isLoaded) throw new Error('Search index not loaded');
    if (!transcriptIndex.isDatabaseLoaded()) throw new Error('Transcript index not loaded');
    if (!query?.trim()) return [];

    const queryLower = query.toLowerCase();
    const queryWords = this.#extractWords(queryLower);
    if (queryWords.length === 0) return [];

    const candidateComics = new Set();
    for (const word of queryWords) {
      const comicsWithWord = this.index.get(word);
      if (!comicsWithWord) continue;
      for (const date of comicsWithWord) candidateComics.add(date);
    }

    const results = [];
    for (const date of candidateComics) {
      const comic = transcriptIndex.getTranscript(date);
      if (!comic) continue;

      const matches = this.#findMatches(comic, queryLower);
      if (matches.length === 0) continue;

      results.push({
        date,
        comic,
        matches,
        score: this.#scoreComic(comic, queryLower, matches)
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, maxResults);
  }

  getComic(date) {
    return transcriptIndex.getTranscript(date);
  }

  isIndexLoaded() {
    return this.isLoaded;
  }

  getStats() {
    const transcriptStats = transcriptIndex.getStats();
    return {
      totalComics: transcriptStats.totalTranscripts,
      totalWords: this.index.size,
      isLoaded: this.isLoaded,
      transcriptIndex: transcriptStats
    };
  }

  async clearCache() {
    try {
      await indexedDB.delete(STORES.SEARCH_INDEX, this.cacheKey);
      console.log('🗑️ Search index cache cleared');
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }

  async forceRefresh() {
    await this.clearCache();
    await transcriptIndex.forceRefresh();
    this.isLoaded = false;
    this.loadPromise = null;
    this.index.clear();
    return this.load();
  }

  async #buildIndex() {
    if (this.isLoaded) return;

    console.log('Loading search index...');
    const startTime = Date.now();
    await transcriptIndex.load();

    const cachedIndex = await this.#loadFromCache();
    if (cachedIndex) {
      this.index = new Map(
        Object.entries(cachedIndex).map(([word, dates]) => [word, new Set(dates)])
      );
    } else {
      console.log('📝 Building search index from transcript index...');
      this.#buildFromTranscriptIndex();
      await this.#saveToCache();
    }

    console.log(`✅ Search index loaded in ${Date.now() - startTime}ms`);
    console.log(`📊 ${transcriptIndex.getStats().totalTranscripts} comics, ${this.index.size} words indexed`);
    this.isLoaded = true;
  }

  #buildFromTranscriptIndex() {
    this.index.clear();
    for (const date of transcriptIndex.getAvailableDates()) {
      const transcript = transcriptIndex.getTranscript(date);
      if (transcript) this.#indexTranscript(transcript);
    }
  }

  #indexTranscript(transcript) {
    const text = transcript.panels
      .flatMap((panel) => panel.dialogue)
      .join(' ')
      .toLowerCase();

    for (const word of this.#extractWords(text)) {
      if (!this.index.has(word)) this.index.set(word, new Set());
      this.index.get(word).add(transcript.date);
    }
  }

  async #loadFromCache() {
    try {
      const cachedData = await indexedDB.get(STORES.SEARCH_INDEX, this.cacheKey);
      if (cachedData) {
        console.log(`💾 Loaded search index from cache (${Object.keys(cachedData).length} words)`);
      }
      return cachedData;
    } catch (error) {
      console.warn('Error loading from cache:', error);
      return null;
    }
  }

  async #saveToCache() {
    try {
      const indexData = {};
      for (const [word, dates] of this.index.entries()) {
        indexData[word] = Array.from(dates);
      }

      await indexedDB.put(STORES.SEARCH_INDEX, indexData, this.cacheKey);
      const sizeMB = (JSON.stringify(indexData).length / 1024 / 1024).toFixed(2);
      console.log(`💾 Search index cached successfully (${sizeMB} MB)`);
    } catch (error) {
      console.warn('Failed to cache search index:', error);
    }
  }

  #extractWords(text) {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase());
  }

  #findMatches(comic, query) {
    const matches = [];

    comic.panels.forEach((panel, panelIndex) => {
      panel.dialogue.forEach((dialogue, dialogueIndex) => {
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
      });
    });

    return matches;
  }

  #scoreComic(comic, query, matches) {
    let score = matches.length * 10;

    score += matches.filter((match) => match.dialogue.toLowerCase().includes(query)).length * 20;

    for (const match of matches) {
      const dialogueLength = match.dialogue.length;
      if (dialogueLength < 50) score += 15;
      else if (dialogueLength < 100) score += 10;
      else score += 5;
    }

    return score;
  }
}

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
    result += `<mark>${text.substring(index, index + query.length)}</mark>`;
    lastIndex = index + query.length;
    currentIndex = index + query.length;
  }

  return result;
}
