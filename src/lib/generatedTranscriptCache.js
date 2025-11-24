/**
 * Lightweight cache for regenerated transcripts.
 * Stores recent transcripts in localStorage keyed by comic date.
 */

import { isValidComicDateRange } from "./dateUtils.js";

const STORAGE_KEY = "generated-transcripts";
class GeneratedTranscriptCache {
  constructor() {
    this.cache = null;
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

    this.#save();
  }

  #ensureLoaded() {
    if (this.cache) return;

    if (typeof localStorage === "undefined") {
      this.cache = {};
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
      } else {
        this.cache = {};
      }
    } catch (error) {
      console.warn("Failed to load generated transcript cache:", error);
      this.cache = {};
    }
  }

  #save() {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cache: this.cache }));
    } catch (error) {
      console.warn("Failed to save generated transcript cache:", error);
    }
  }
}

export const generatedTranscriptCache = new GeneratedTranscriptCache();
