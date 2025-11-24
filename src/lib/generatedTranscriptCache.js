/**
 * Lightweight cache for regenerated transcripts.
 * Stores recent transcripts in localStorage keyed by comic date.
 */

import { isValidComicDateRange } from "./dateUtils.js";

const STORAGE_KEY = "generated-transcripts";
const MAX_ENTRIES = 50;

class GeneratedTranscriptCache {
  constructor() {
    this.cache = null;
    this.order = null;
  }

  get(date) {
    if (!isValidComicDateRange(date)) return null;
    this.#ensureLoaded();
    return this.cache[date] ?? null;
  }

  set(date, transcript) {
    if (!isValidComicDateRange(date) || !transcript) return;
    this.#ensureLoaded();

    this.cache[date] = transcript;
    this.order = [date, ...this.order.filter((d) => d !== date)].slice(
      0,
      MAX_ENTRIES,
    );

    // Trim cache to max entries
    if (this.order.length > MAX_ENTRIES) {
      const excess = this.order.slice(MAX_ENTRIES);
      for (const d of excess) {
        delete this.cache[d];
      }
    }

    this.#save();
  }

  #ensureLoaded() {
    if (this.cache && this.order) return;

    if (typeof localStorage === "undefined") {
      this.cache = {};
      this.order = [];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache =
          parsed && typeof parsed === "object" && !Array.isArray(parsed.cache)
            ? parsed.cache ?? {}
            : {};
        this.order = Array.isArray(parsed?.order) ? parsed.order : [];
      } else {
        this.cache = {};
        this.order = [];
      }
    } catch (error) {
      console.warn("Failed to load generated transcript cache:", error);
      this.cache = {};
      this.order = [];
    }
  }

  #save() {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ cache: this.cache, order: this.order }),
      );
    } catch (error) {
      console.warn("Failed to save generated transcript cache:", error);
    }
  }
}

export const generatedTranscriptCache = new GeneratedTranscriptCache();
