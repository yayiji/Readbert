/**
 * Centralized IndexedDB Manager for Dilbert Comics
 * Manages a single database with multiple stores for better organization
 */

import { openDB } from 'idb';

// Constants
const DB_NAME = 'DilbertDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  TRANSCRIPTS: 'transcripts',
  IMAGE_URLS: 'imageUrls',
  SEARCH_INDEX: 'searchIndex'
};

class IndexedDBManager {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  // ===== INITIALIZATION =====

  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._openDB();
    this.db = await this.initPromise;
    return this.db;
  }

  async _openDB() {
    if (!this._isSupported()) {
      console.warn('IndexedDB not supported');
      return null;
    }

    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.TRANSCRIPTS)) {
          db.createObjectStore(STORES.TRANSCRIPTS);
        }
        if (!db.objectStoreNames.contains(STORES.IMAGE_URLS)) {
          db.createObjectStore(STORES.IMAGE_URLS);
        }
        if (!db.objectStoreNames.contains(STORES.SEARCH_INDEX)) {
          db.createObjectStore(STORES.SEARCH_INDEX);
        }
      }
    });
  }

  _isSupported() {
    return typeof window !== 'undefined' && 'indexedDB' in window && indexedDB !== null;
  }

  // ===== STORE OPERATIONS =====

  async get(storeName, key) {
    const db = await this.init();
    if (!db) return null;
    return db.get(storeName, key);
  }

  async put(storeName, value, key) {
    const db = await this.init();
    if (!db) return;
    return db.put(storeName, value, key);
  }

  async delete(storeName, key) {
    const db = await this.init();
    if (!db) return;
    return db.delete(storeName, key);
  }

  async clear(storeName) {
    const db = await this.init();
    if (!db) return;
    return db.clear(storeName);
  }

  async getAllKeys(storeName) {
    const db = await this.init();
    if (!db) return [];
    return db.getAllKeys(storeName);
  }

  async getAll(storeName) {
    const db = await this.init();
    if (!db) return [];
    return db.getAll(storeName);
  }
}

// Export singleton instance
export const indexedDB = new IndexedDBManager();
