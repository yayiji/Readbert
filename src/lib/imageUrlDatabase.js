/**
 * Image URL Database Manager for Dilbert Comics
 * Manages preloaded image URLs with smart caching (IndexedDB + localStorage)
 */

import { indexedDB, STORES } from './indexedDBManager.js';

// Constants
const CDN_URL = "https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-index/image-url-index.json";
const LOCAL_URL = "/dilbert-index/image-url-index.json";

class ImageUrlDatabase {
  constructor() {
    this.imageUrls = new Map();
    this.isLoaded = false;
    this.loadPromise = null;
    this.cacheKey = "dilbert-image-urls";
    this.cacheInfo = { hasCachedData: false };
  }

  // ===== PUBLIC API =====

  async load() {
    if (this.loadPromise) return this.loadPromise;
    this.loadPromise = this._loadDatabase();
    return this.loadPromise;
  }

  getImageUrl(date) {
    if (!this.isLoaded) {
      this.load();
      return null;
    }
    return this.imageUrls.get(date) || null;
  }

  hasImageUrl(date) {
    return this.isLoaded && this.imageUrls.has(date);
  }

  getAvailableDates() {
    return this.isLoaded ? Array.from(this.imageUrls.keys()).sort() : [];
  }

  isDatabaseLoaded() {
    return this.isLoaded;
  }

  getStats() {
    return {
      totalUrls: this.imageUrls.size,
      isLoaded: this.isLoaded,
      cache: this._getCacheInfo(),
    };
  }

  async clearCache() {
    try {
      await indexedDB.delete(STORES.IMAGE_URLS, this.cacheKey);
      this.cacheInfo = { hasCachedData: false };
      console.log("🗑️ Image URL database cache cleared");
    } catch (error) {
      console.warn("Error clearing image URL database cache:", error);
    }
  }

  async forceRefresh() {
    await this.clearCache();
    this.isLoaded = false;
    this.loadPromise = null;
    this.imageUrls.clear();
    return this.load();
  }

  // ===== LOADING =====

  async _loadDatabase() {
    if (this.isLoaded) return;

    console.log("Loading image URL database...");
    const startTime = Date.now();

    const data = await this._loadPregeneratedDatabase();
    if (!data) {
      throw new Error("Image URL database not available");
    }

    this._loadFromPregenerated(data);
    console.log(`✅ Image URL database loaded in ${Date.now() - startTime}ms`);
    console.log(`📊 ${this.imageUrls.size} image URLs loaded`);
    this.isLoaded = true;
  }

  async _loadPregeneratedDatabase() {
    try {
      // Try cache first
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log(`✅ Loaded image URL database from cache`);
        return cachedData;
      }

      // Fetch from server
      console.log("📥 Fetching image URL database from server...");
      const response = await this._fetchWithFallback();
      if (!response) return null;

      const data = await response.data;
      console.log(`📦 Downloaded image URL database from ${response.source}`);

      await this._saveToCache(data);
      return data;
    } catch (error) {
      console.warn("Failed to load pregenerated image URL database:", error);

      // Fallback to stale cache
      const cachedData = await this._loadFromCache();
      if (cachedData) {
        console.log("⚠️ Using stale cached image URL database due to server error");
        return cachedData;
      }

      throw new Error("Image URL database unavailable and no cached version found");
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
    this.imageUrls.clear();
    for (const [date, urlData] of Object.entries(data)) {
      this.imageUrls.set(date, urlData);
    }
  }

  // ===== CACHE MANAGEMENT =====

  async _loadFromCache() {
    try {
      const cachedData = await indexedDB.get(STORES.IMAGE_URLS, this.cacheKey);
      if (cachedData) {
        const totalUrls = Object.keys(cachedData).length;
        console.log(`💾 Found cached image URL database: ${totalUrls} image URLs`);
        this.cacheInfo = {
          hasCachedData: true,
          totalUrls
        };
      }

      return cachedData;
    } catch (error) {
      console.warn("Error loading image URL database from cache:", error);
      return null;
    }
  }

  async _saveToCache(data) {
    try {
      await indexedDB.put(STORES.IMAGE_URLS, data, this.cacheKey);

      const totalUrls = Object.keys(data).length;
      this.cacheInfo = {
        hasCachedData: true,
        totalUrls
      };

      const sizeMB = (JSON.stringify(data).length / 1024 / 1024).toFixed(2);
      console.log(`💾 Image URL database cached successfully (${sizeMB} MB)`);
    } catch (error) {
      console.warn("Failed to cache image URL database:", error);
    }
  }

  _getCacheInfo() {
    return { ...this.cacheInfo };
  }

}

// Export singleton instance
export const imageUrlDatabase = new ImageUrlDatabase();
