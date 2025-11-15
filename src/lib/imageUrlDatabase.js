/**
 * Image URL Database Manager for Dilbert Comics
 * Manages preloaded image URLs for all comics
 */

import { openDB } from 'idb';

class ImageUrlDatabase {
  constructor() {
    this.imageUrls = new Map(); // date -> { imageUrl, archiveUrl }
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = "dilbert-image-urls-db";
    this.metaCacheKey = "dilbert-image-urls-meta";
    this.dbName = "DilbertImageUrlDB";
    this.dbVersion = 1;
    this.storeName = "imageUrls";
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
   * Load all image URLs from the pregenerated database
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

    console.log("Loading image URL database...");
    const startTime = Date.now();

    // Load pregenerated image URL database
    const pregenerated = await this._loadPregeneratedDatabase();
    if (pregenerated) {
      this._loadFromPregenerated(pregenerated);
      const duration = Date.now() - startTime;
      console.log(`✅ Image URL database loaded in ${duration}ms`);
      console.log(`📊 ${this.imageUrls.size} image URLs loaded`);
      this.isLoaded = true;
      return;
    }

    // No pregenerated database available
    throw new Error(
      "Image URL database not available. Please generate the image URL database first."
    );
  }

  /**
   * Get URLs for loading the image URL database
   * @returns {Object} Object with cdnUrl and localUrl
   */
  _getLoadingUrl() {
    return {
      cdnUrl: "https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-index/image-url-index.json",
      localUrl: "/dilbert-index/image-url-index.json"
    };
  }

  /**
   * Try to load pregenerated image URL database with smart caching
   */
  async _loadPregeneratedDatabase() {
    try {
      // First, check if we have a cached version
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log(`✅ Loaded image URL database from cache`);
        return cachedData;
      }

      // No cache or cache is stale, fetch from server
      console.log("📥 Fetching image URL database from server...");

      // Try CDN first, fallback to local
      const response = await this._fetchWithFallback();
      if (!response) {
        console.log("Pregenerated image URL database file not found");
        return null;
      }

      const data = await response.data;
      console.log(`📦 Downloaded image URL database from ${response.source}`);

      // Cache the new data
      await this._saveToCache(data);

      return data;
    } catch (error) {
      console.warn("Failed to load pregenerated image URL database:", error);
      // Try to load from cache even if server fetch failed
      const cachedData = await this._loadFromCache(true);
      if (cachedData) {
        console.log("⚠️ Using stale cached image URL database due to server error");
        return cachedData;
      }
      // No fallback available
      throw new Error("Image URL database unavailable and no cached version found");
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
   * Load image URL database from browser cache (IndexedDB)
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
          console.log("🔄 Image URL database cache is outdated, will fetch from server");
          return null;
        }
      }

      // Load the actual data from IndexedDB
      const cachedData = await this._getFromIndexedDB();
      if (cachedData) {
        console.log(
          `💾 Found cached image URL database: ${meta.totalUrls} image URLs`
        );
        return cachedData;
      }

      return null;
    } catch (error) {
      console.warn("Error loading image URL database from cache:", error);
      return null;
    }
  }

  /**
   * Save image URL database to browser cache
   */
  async _saveToCache(data) {
    try {
      if (!this._isIndexedDBSupported()) {
        console.log("IndexedDB not supported, skipping image URL database cache");
        return;
      }

      // Count total URLs
      const totalUrls = Object.keys(data).length;

      // Save metadata to localStorage for quick access
      const meta = {
        totalUrls: totalUrls,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem(this.metaCacheKey, JSON.stringify(meta));

      // Save full data to IndexedDB
      await this._saveToIndexedDB(data);

      console.log(
        `💾 Image URL database cached successfully (${(
          JSON.stringify(data).length /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );
    } catch (error) {
      console.warn("Failed to cache image URL database:", error);
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
      console.warn('Failed to save image URL database to IndexedDB:', error);
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
      console.warn('Failed to get image URL database from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Load image URLs from pregenerated data
   */
  _loadFromPregenerated(data) {
    // Load image URLs: Object<date, {imageUrl, archiveUrl}> -> Map<date, {imageUrl, archiveUrl}>
    this.imageUrls.clear();
    for (const [date, urlData] of Object.entries(data)) {
      this.imageUrls.set(date, urlData);
    }
  }

  /**
   * Get image URL data by date
   */
  getImageUrl(date) {
    if (!this.isLoaded) {
      this.load();
      return null;
    }
    return this.imageUrls.get(date) || null;
  }

  /**
   * Check if an image URL exists for the given date
   */
  hasImageUrl(date) {
    if (!this.isLoaded) {
      return false;
    }
    return this.imageUrls.has(date);
  }

  /**
   * Get all available image URL dates
   */
  getAvailableDates() {
    if (!this.isLoaded) {
      return [];
    }
    return Array.from(this.imageUrls.keys()).sort();
  }

  /**
   * Check if the database is loaded
   */
  isDatabaseLoaded() {
    return this.isLoaded;
  }

  /**
   * Get image URL database statistics
   */
  getStats() {
    const cacheInfo = this._getCacheInfo();
    return {
      totalUrls: this.imageUrls.size,
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
          cachedAt: meta.cachedAt,
          totalUrls: meta.totalUrls,
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
   * Clear cached image URL database (for debugging or manual refresh)
   */
  async clearCache() {
    try {
      // Clear localStorage metadata
      localStorage.removeItem(this.metaCacheKey);

      // Clear IndexedDB data
      if (this._isIndexedDBSupported()) {
        await this._clearIndexedDB();
      }

      console.log("🗑️ Image URL database cache cleared");
    } catch (error) {
      console.warn("Error clearing image URL database cache:", error);
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
      console.warn('Failed to clear image URL database from IndexedDB:', error);
      throw error;
    }
  }

  /**
   * Force refresh the image URL database from server
   */
  async forceRefresh() {
    await this.clearCache();
    this.isLoaded = false;
    this.loadPromise = null;
    this.imageUrls.clear();
    return this.load();
  }
}

// Create and export a singleton instance
export const imageUrlDatabase = new ImageUrlDatabase();
