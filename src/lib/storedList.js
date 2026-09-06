/**
 * Lazy localStorage list of `{ date, ... }` entries.
 */
export function createStoredList(storageKey, label) {
  let entries = null;

  function load() {
    if (entries !== null) return entries;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        entries = Array.isArray(parsed)
          ? parsed.filter((entry) => typeof entry?.date === 'string')
          : [];
      } else {
        entries = [];
      }
    } catch (error) {
      console.warn(`Failed to load ${label}:`, error);
      entries = [];
    }

    return entries;
  }

  function save(nextEntries = entries) {
    entries = nextEntries;
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch (error) {
      console.warn(`Failed to save ${label}:`, error);
    }
  }

  function clear() {
    entries = [];
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear ${label}:`, error);
    }
  }

  return { load, save, clear };
}
