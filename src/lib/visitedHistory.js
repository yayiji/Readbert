import { isValidComicDateRange } from './dateUtils.js';
import { createStoredList } from './storedList.js';

const MAX_HISTORY_ENTRIES = 100;
const store = createStoredList('visited-history', 'visited history');

class VisitedHistory {
  addVisit(date) {
    if (!date) return;

    store.save(
      [{ date, visitedAt: Date.now() }, ...store.load().filter((item) => item.date !== date)].slice(
        0,
        MAX_HISTORY_ENTRIES
      )
    );
  }

  getRecent(limit = 10) {
    return store.load().slice(0, limit);
  }

  clear() {
    store.clear();
  }

  loadLastVisited() {
    const mostRecent = store.load()[0];
    return mostRecent?.date && isValidComicDateRange(mostRecent.date) ? mostRecent.date : null;
  }
}

export const visitedHistory = new VisitedHistory();
