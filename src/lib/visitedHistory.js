/**
 * Visited History Manager for Dilbert Comics
 * Stores a small, local history of recently visited comics in localStorage.
 */

import { isValidComicDateRange } from './dateUtils.js';

const HISTORY_KEY = 'visited-history';
const MAX_HISTORY_ENTRIES = 100;

class VisitedHistory {
  constructor() {
    this.entries = null;
  }

  addVisit(date) {
    if (!date) return;

    this._ensureLoaded();

    // Remove existing entry for this date and add it to the front
    this.entries = [
      { date, visitedAt: Date.now() },
      ...this.entries.filter((item) => item.date !== date)
    ].slice(0, MAX_HISTORY_ENTRIES);

    this._save();
  }

  getRecent(limit = 10) {
    this._ensureLoaded();
    return this.entries.slice(0, limit);
  }

  clear() {
    this.entries = [];
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.warn('Failed to clear visited history:', error);
    }
  }

  _ensureLoaded() {
    if (this.entries !== null) return;

    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.entries = Array.isArray(parsed)
          ? parsed.filter((entry) => typeof entry?.date === 'string')
          : [];
      } else {
        this.entries = [];
      }
    } catch (error) {
      console.warn('Failed to load visited history:', error);
      this.entries = [];
    }
  }

  _save() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.warn('Failed to save visited history:', error);
    }
  }

  loadLastVisited() {
    this._ensureLoaded();

    if (this.entries.length === 0) return null;

    const mostRecent = this.entries[0];

    if (mostRecent.date && isValidComicDateRange(mostRecent.date)) {
      return mostRecent.date;
    }

    return null;
  }
}

export const visitedHistory = new VisitedHistory();
