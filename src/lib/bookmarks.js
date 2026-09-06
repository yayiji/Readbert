import { createStoredList } from './storedList.js';

const store = createStoredList('comic-bookmarks', 'bookmarks');

class Bookmarks {
  toggleBookmark(date) {
    if (!date) return false;

    const entries = store.load();
    const existingIndex = entries.findIndex((item) => item.date === date);

    if (existingIndex !== -1) {
      entries.splice(existingIndex, 1);
      store.save(entries);
      return false;
    }

    store.save([{ date, bookmarkedAt: Date.now() }, ...entries]);
    return true;
  }

  isBookmarked(date) {
    if (!date) return false;
    return store.load().some((item) => item.date === date);
  }

  getAll() {
    return [...store.load()];
  }

  clear() {
    store.clear();
  }
}

export const bookmarks = new Bookmarks();
