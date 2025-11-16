/**
 * Transcript Database Manager for Dilbert Comics
 * Manages preloaded transcripts with smart caching (IndexedDB + localStorage)
 */

import { indexedDB, STORES } from './indexedDBManager.js';

// Constants
const CDN_URL = "https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-index/transcript-index.min.json";
const LOCAL_URL = "/dilbert-index/transcript-index.min.json";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

class TranscriptDatabase {
  constructor() {
    this.transcripts = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = "dilbert-transcripts-db";
    this.metaCacheKey = "dilbert-transcripts-meta";
  }

  // ===== PUBLIC API =====

  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this._loadDatabase();
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
      isLoaded: this.isLoaded,
      cache: this._getCacheInfo(),
    };
  }

  async clearCache() {
    try {
      localStorage.removeItem(this.metaCacheKey);
      await indexedDB.delete(STORES.TRANSCRIPTS, this.cacheKey);
      console.log("🗑️ Transcript database cache cleared");
    } catch (error) {
      console.warn("Error clearing transcript database cache:", error);
    }
  }

  async forceRefresh() {
    await this.clearCache();
    this.isLoaded = false;
    this.loadPromise = null;
    this.transcripts.clear();
    return this.load();
  }

  // ===== LOADING =====

  async _loadDatabase() {
    if (this.isLoaded) return;

    console.log("Loading transcript database...");
    const startTime = Date.now();

    const data = await this._loadPregeneratedDatabase();
    if (!data) {
      throw new Error("Transcript database not available");
    }

    this._loadFromPregenerated(data);
    console.log(`✅ Transcript database loaded in ${Date.now() - startTime}ms`);
    console.log(`📊 ${this.transcripts.size} transcripts loaded`);
    this.isLoaded = true;
  }

  async _loadPregeneratedDatabase() {
    try {
      // Try cache first
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log(`✅ Loaded transcript database from cache (v${cachedData.version})`);
        return cachedData;
      }

      // Fetch from server
      console.log("📥 Fetching transcript database from server...");
      const response = await this._fetchWithFallback();
      if (!response) return null;

      const data = await response.data;
      console.log(`📦 Downloaded transcript database (v${data.version}) from ${response.source} (generated ${data.generatedAt})`);

      await this._saveToCache(data);
      return data;
    } catch (error) {
      console.warn("Failed to load pregenerated transcript database:", error);

      // Fallback to stale cache
      const cachedData = await this._loadFromCache(true);
      if (cachedData) {
        console.log("⚠️ Using stale cached transcript database due to server error");
        return cachedData;
      }

      throw new Error("Transcript database unavailable and no cached version found");
    }
  }

  async _fetchWithFallback() {
    // Try CDN first
    try {
      const response = await fetch(CDN_URL);
      if (response.ok) {
        return { data: await response.json(), source: "CDN" };
      }
    } catch (error) {
      console.warn("CDN fetch failed, trying local URL:", error.message);
    }

    // Fallback to local
    try {
      const response = await fetch(LOCAL_URL);
      if (response.ok) {
        return { data: await response.json(), source: "local" };
      }
    } catch (error) {
      console.warn("Local fetch also failed:", error.message);
    }

    return null;
  }

  _loadFromPregenerated(data) {
    this.transcripts.clear();
    for (const [date, transcript] of Object.entries(data.transcripts)) {
      this.transcripts.set(date, transcript);
    }
  }

  // ===== CACHE MANAGEMENT =====

  async _loadFromCache(ignoreValidation = false) {
    try {
      const cachedMeta = localStorage.getItem(this.metaCacheKey);
      if (!cachedMeta) return null;

      const meta = JSON.parse(cachedMeta);

      if (!ignoreValidation && !(await this._isCacheValid(meta))) {
        console.log("🔄 Transcript database cache is outdated, will fetch from server");
        return null;
      }

      const cachedData = await indexedDB.get(STORES.TRANSCRIPTS, this.cacheKey);
      if (cachedData) {
        console.log(`💾 Found cached transcript database: ${meta.totalTranscripts} transcripts`);
      }

      return cachedData;
    } catch (error) {
      console.warn("Error loading transcript database from cache:", error);
      return null;
    }
  }

  async _saveToCache(data) {
    try {
      const meta = {
        version: data.version,
        generatedAt: data.generatedAt,
        totalTranscripts: data.stats.totalTranscripts,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.metaCacheKey, JSON.stringify(meta));

      await indexedDB.put(STORES.TRANSCRIPTS, data, this.cacheKey);

      const sizeMB = (JSON.stringify(data).length / 1024 / 1024).toFixed(2);
      console.log(`💾 Transcript database cached successfully (${sizeMB} MB)`);
    } catch (error) {
      console.warn("Failed to cache transcript database:", error);
    }
  }

  async _isCacheValid(meta) {
    try {
      const response = await fetch(LOCAL_URL, { method: "HEAD" });
      if (!response.ok) return true; // Server error, use cache

      // Check Last-Modified header
      const lastModified = response.headers.get("Last-Modified");
      if (lastModified) {
        return new Date(lastModified) <= new Date(meta.cachedAt);
      }

      // Fallback: 24-hour expiry
      const cacheAge = Date.now() - new Date(meta.cachedAt).getTime();
      return cacheAge < CACHE_MAX_AGE;
    } catch (error) {
      return true; // Network error, assume cache is valid
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
          generatedAt: meta.generatedAt,
        };
      }
    } catch (error) {
      // Ignore
    }
    return { hasCachedData: false };
  }

}

// Export singleton instance
export const transcriptDatabase = new TranscriptDatabase();
