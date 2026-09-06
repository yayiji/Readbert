import { openDB } from 'idb';

const DB_NAME = 'DilbertDB-v3';
const DB_VERSION = 1;

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

  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.#openDB();
    this.db = await this.initPromise;
    return this.db;
  }

  async #openDB() {
    if (typeof window === 'undefined' || !('indexedDB' in window) || indexedDB === null) {
      console.warn('IndexedDB not supported');
      return null;
    }

    return openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const storeName of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        }
      }
    });
  }

  async get(storeName, key) {
    const db = await this.init();
    return db ? db.get(storeName, key) : null;
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
    return db ? db.getAllKeys(storeName) : [];
  }

  async getAll(storeName) {
    const db = await this.init();
    return db ? db.getAll(storeName) : [];
  }
}

export const indexedDB = new IndexedDBManager();
