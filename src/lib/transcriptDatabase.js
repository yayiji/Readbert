/**
 * Transcript Database Manager for Dilbert Comics
 * Manages preloaded transcripts for all comics
 */

import { openDB } from 'idb';

class TranscriptDatabase {
  constructor() {
    this.transcripts = new Map(); // date -> transcript data
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = "dilbert-transcripts-db";
    this.metaCacheKey = "dilbert-transcripts-meta";
    this.dbName = "DilbertTranscriptDB";
    this.dbVersion = 1;
    this.storeName = "transcripts";
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
   * Load all transcripts from the pregenerated database
   */
  async load() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadDatabase();
    return this.loadPromise;
  }

  async _loadDatabase() {
    if (this.isLoaded) return;

    console.log("Loading transcript database...");
    const startTime = Date.now();

    // Load pregenerated transcript database
    const pregenerated = await this._loadPregeneratedDatabase();
    if (pregenerated) {
      this._loadFromPregenerated(pregenerated);
      const duration = Date.now() - startTime;
      console.log(`✅ Transcript database loaded in ${duration}ms`);
      console.log(`📊 ${this.transcripts.size} transcripts loaded`);
      this.isLoaded = true;
      return;
    }

    // No pregenerated database available
    throw new Error(
      "Transcript database not available. Please generate the transcript database first."
    );
  }

  /**
   * Get URLs for loading the transcript database
   * @returns {Object} Object with cdnUrl and localUrl
   */
  _getLoadingUrl() {
    return {
      cdnUrl: "https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-index/transcript-index.min.json",
      localUrl: "/dilbert-index/transcript-index.min.json"
    };
  }

  /**
   * Try to load pregenerated transcript database with smart caching
   */
  async _loadPregeneratedDatabase() {
    try {
      // First, check if we have a cached version
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log(
          `✅ Loaded transcript database from cache (v${cachedData.version})`
        );
        return cachedData;
      }

      // No cache or cache is stale, fetch from server
      console.log("📥 Fetching transcript database from server...");

      // Try CDN first, fallback to local
      const response = await this._fetchWithFallback();
      if (!response) {
        console.log("Pregenerated transcript database file not found");
        return null;
      }

      const data = await response.data;
      console.log(
        `📦 Downloaded transcript database (v${data.version}) from ${response.source} (generated ${data.generatedAt})`
      );

      // Cache the new data
      await this._saveToCache(data);

      return data;
    } catch (error) {
      console.warn("Failed to load pregenerated transcript database:", error);
      // Try to load from cache even if server fetch failed
      const cachedData = await this._loadFromCache(true);
      if (cachedData) {
        console.log("⚠️ Using stale cached transcript database due to server error");
        return cachedData;
      }
      // No fallback available
      throw new Error("Transcript database unavailable and no cached version found");
    }
  }

  /**
   * Fetch from CDN with fallback to local
   * Gets URLs from _getLoadingUrl() internally
   * @returns {Promise<{data: any, source: string}|null>} Response data and source, or null if both fail
   */
  async _fetchWithFallback() {
    const { cdnUrl, localUrl } = this._getLoadingUrl();

    // Try CDN first
    try {
      const response = await fetch(cdnUrl);
      if (response.ok) {
        return { data: await response.json(), source: "CDN" };
      }
      throw new Error(`CDN fetch failed with status ${response.status}`);
    } catch (cdnError) {
      console.warn("CDN fetch failed, trying local URL:", cdnError.message);
    }

    // Fall back to local URL
    try {
      const response = await fetch(localUrl);
      if (response.ok) {
        return { data: await response.json(), source: "local" };
      }
      throw new Error(`Local fetch failed with status ${response.status}`);
    } catch (localError) {
      console.warn("Local fetch also failed:", localError.message);
      return null;
    }
  }

  /**
   * Load transcript database from browser cache (IndexedDB)
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
          console.log("🔄 Transcript database cache is outdated, will fetch from server");
          return null;
        }
      }

      // Load the actual data from IndexedDB
      const cachedData = await this._getFromIndexedDB();
      if (cachedData) {
        console.log(
          `💾 Found cached transcript database: ${meta.totalTranscripts} transcripts`
        );
        return cachedData;
      }

      return null;
    } catch (error) {
      console.warn("Error loading transcript database from cache:", error);
      return null;
    }
  }

  /**
   * Save transcript database to browser cache
   */
  async _saveToCache(data) {
    try {
      if (!this._isIndexedDBSupported()) {
        console.log("IndexedDB not supported, skipping transcript database cache");
        return;
      }

      // Save metadata to localStorage for quick access
      const meta = {
        version: data.version,
        generatedAt: data.generatedAt,
        totalTranscripts: data.stats.totalTranscripts,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.metaCacheKey, JSON.stringify(meta));

      // Save full data to IndexedDB
      await this._saveToIndexedDB(data);

      console.log(
        `💾 Transcript database cached successfully (${(
          JSON.stringify(data).length /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
    } catch (error) {
      console.warn("Failed to cache transcript database:", error);
    }
  }

  /**
   * Check if cached version is still valid
   */
  async _isCacheValid(meta) {
    try {
      const { localUrl } = this._getLoadingUrl();

      // Check server for metadata without downloading full database
      const response = await fetch(localUrl, {
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
      console.warn('Failed to save transcript database to IndexedDB:', error);
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
      console.warn('Failed to get transcript database from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Load transcripts from pregenerated data
   */
  _loadFromPregenerated(data) {
    // Load transcripts: Object<date, transcript> -> Map<date, transcript>
    this.transcripts.clear();
    for (const [date, transcript] of Object.entries(data.transcripts)) {
      this.transcripts.set(date, transcript);
    }
  }

  /**
   * Get a transcript by date
   */
  getTranscript(date) {
    if (!this.isLoaded) {
      this.load();
      return null;
    }
    return this.transcripts.get(date) || null;
  }

  /**
   * Check if a transcript exists for the given date
   */
  hasTranscript(date) {
    if (!this.isLoaded) {
      return false;
    }
    return this.transcripts.has(date);
  }

  /**
   * Get all available transcript dates
   */
  getAvailableDates() {
    if (!this.isLoaded) {
      return [];
    }
    return Array.from(this.transcripts.keys()).sort();
  }

  /**
   * Check if the database is loaded
   */
  isDatabaseLoaded() {
    return this.isLoaded;
  }

  /**
   * Get transcript database statistics
   */
  getStats() {
    const cacheInfo = this._getCacheInfo();
    return {
      totalTranscripts: this.transcripts.size,
      isLoaded: this.isLoaded,
      cache: cacheInfo,
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
   * Clear cached transcript database (for debugging or manual refresh)
   */
  async clearCache() {
    try {
      // Clear localStorage metadata
      localStorage.removeItem(this.metaCacheKey);

      // Clear IndexedDB data
      if (this._isIndexedDBSupported()) {
        await this._clearIndexedDB();
      }

      console.log("🗑️ Transcript database cache cleared");
    } catch (error) {
      console.warn("Error clearing transcript database cache:", error);
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
      console.warn('Failed to clear transcript database from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Force refresh the transcript database from server
   */
  async forceRefresh() {
    await this.clearCache();
    this.isLoaded = false;
    this.loadPromise = null;
    this.transcripts.clear();
    return this.load();
  }
}

// Create and export a singleton instance
export const transcriptDatabase = new TranscriptDatabase();