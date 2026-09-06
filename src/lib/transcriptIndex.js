import { indexedDB, STORES } from './indexedDBManager.js';

const CDN_URL = 'https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-index/transcript-index.min.json';
const LOCAL_URL = '/dilbert-index/transcript-index.min.json';

class TranscriptIndex {
  constructor() {
    this.transcripts = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = 'dilbert-transcripts';
  }

  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this.#loadDatabase();
    return this.loadPromise;
  }

  getTranscript(date) {
    if (!this.isLoaded) {
      this.load();
      return null;
    }
    return this.transcripts.get(date) || null;
  }

  hasTranscript(date) {
    return this.isLoaded && this.transcripts.has(date);
  }

  getAvailableDates() {
    return this.isLoaded ? Array.from(this.transcripts.keys()).sort() : [];
  }

  isDatabaseLoaded() {
    return this.isLoaded;
  }

  getStats() {
    return {
      totalTranscripts: this.transcripts.size,
      isLoaded: this.isLoaded
    };
  }

  async clearCache() {
    try {
      await indexedDB.delete(STORES.TRANSCRIPTS, this.cacheKey);
      console.log('🗑️ Transcript index cache cleared');
    } catch (error) {
      console.warn('Error clearing transcript index cache:', error);
    }
  }

  async forceRefresh() {
    await this.clearCache();
    this.isLoaded = false;
    this.loadPromise = null;
    this.transcripts.clear();
    return this.load();
  }

  async #loadDatabase() {
    if (this.isLoaded) return;

    console.log('Loading transcript index...');
    const startTime = Date.now();

    const data = await this.#loadPregeneratedDatabase();
    if (!data) throw new Error('Transcript index not available');

    this.transcripts = new Map(Object.entries(data.transcripts));
    console.log(`✅ Transcript index loaded in ${Date.now() - startTime}ms`);
    console.log(`📊 ${this.transcripts.size} transcripts loaded`);
    this.isLoaded = true;
  }

  async #loadPregeneratedDatabase() {
    try {
      const cachedData = await this.#loadFromCache();
      if (cachedData) {
        console.log(`✅ Loaded transcript index from cache (v${cachedData.version})`);
        return cachedData;
      }

      console.log('📥 Fetching transcript index from server...');
      const response = await this.#fetchWithFallback();
      if (!response) return null;

      const data = await response.data;
      console.log(`📦 Downloaded transcript index (v${data.version}) from ${response.source} (generated ${data.generatedAt})`);

      await this.#saveToCache(data);
      return data;
    } catch (error) {
      console.warn('Failed to load pregenerated transcript index:', error);

      const cachedData = await this.#loadFromCache();
      if (cachedData) {
        console.log('⚠️ Using stale cached transcript index due to server error');
        return cachedData;
      }

      throw new Error('Transcript index unavailable and no cached version found');
    }
  }

  async #fetchWithFallback() {
    try {
      const response = await fetch(CDN_URL);
      if (response.ok) return { data: await response.json(), source: 'CDN' };
    } catch (error) {
      console.warn('CDN fetch failed, trying local URL:', error.message);
    }

    try {
      const response = await fetch(LOCAL_URL);
      if (response.ok) return { data: await response.json(), source: 'local' };
    } catch (error) {
      console.warn('Local fetch also failed:', error.message);
    }

    return null;
  }

  async #loadFromCache() {
    try {
      const cachedData = await indexedDB.get(STORES.TRANSCRIPTS, this.cacheKey);
      if (cachedData) {
        const totalTranscripts = cachedData.stats?.totalTranscripts ?? Object.keys(cachedData.transcripts || {}).length;
        console.log(`💾 Found cached transcript index: ${totalTranscripts} transcripts`);
      }
      return cachedData;
    } catch (error) {
      console.warn('Error loading transcript index from cache:', error);
      return null;
    }
  }

  async #saveToCache(data) {
    try {
      await indexedDB.put(STORES.TRANSCRIPTS, data, this.cacheKey);
      const sizeMB = (JSON.stringify(data).length / 1024 / 1024).toFixed(2);
      console.log(`💾 Transcript index cached successfully (${sizeMB} MB)`);
    } catch (error) {
      console.warn('Failed to cache transcript index:', error);
    }
  }
}

export const transcriptIndex = new TranscriptIndex();
