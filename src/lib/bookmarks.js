/**
 * Bookmarks Manager for Dilbert Comics
 * Stores user's favorite/bookmarked comics in localStorage.
 */

const BOOKMARKS_KEY = 'comic-bookmarks';

class Bookmarks {
  constructor() {
    this.entries = null;
  }

  toggleBookmark(date) {
    if (!date) return false;

    this._ensureLoaded();

    const existingIndex = this.entries.findIndex((item) => item.date === date);

    if (existingIndex !== -1) {
      // Remove bookmark
      this.entries.splice(existingIndex, 1);
      this._save();
      return false;
    } else {
      // Add bookmark
      this.entries = [
        { date, bookmarkedAt: Date.now() },
        ...this.entries
      ];
      this._save();
      return true;
    }
  }

  isBookmarked(date) {
    if (!date) return false;
    this._ensureLoaded();
    return this.entries.some((item) => item.date === date);
  }

  getAll() {
    this._ensureLoaded();
    return [...this.entries];
  }

  clear() {
    this.entries = [];
    try {
      localStorage.removeItem(BOOKMARKS_KEY);
    } catch (error) {
      console.warn('Failed to clear bookmarks:', error);
    }
  }

  _ensureLoaded() {
    if (this.entries !== null) return;

    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.entries = Array.isArray(parsed)
          ? parsed.filter((entry) => typeof entry?.date === 'string')
          : [];
      } else {
        this.entries = [];
      }
    } catch (error) {
      console.warn('Failed to load bookmarks:', error);
      this.entries = [];
    }
  }

  _save() {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.warn('Failed to save bookmarks:', error);
    }
  }
}

export const bookmarks = new Bookmarks();
