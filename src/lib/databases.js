/**
 * Database and Storage Management for Dilbert Comics
 * Handles database initialization, comic storage in localStorage, and cache management
 */

import { Comic } from './Comic.js';
import { isValidComicDateRange } from './dateUtils.js';
import { transcriptIndex } from './transcriptIndex.js';
import { imageUrlIndex } from './imageUrlIndex.js';

// Constants
const STORAGE_KEY = 'lastVisitedComic';
const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// ===== DATABASE INITIALIZATION =====

export async function initializeDatabases() {
  try {
    console.log("🚀 Initializing databases...");
    await Promise.all([
      transcriptIndex.load(),
      imageUrlIndex.load()
    ]);
    console.log("✅ All databases ready");
  } catch (error) {
    console.error("❌ Failed to load databases:", error);
    throw error;
  }
}

// ===== DATABASE ACCESS =====

export { transcriptIndex } from './transcriptIndex.js';
export { imageUrlIndex } from './imageUrlIndex.js';

// ===== DATABASE UTILITIES =====

export function getDatabaseStats() {
  return {
    transcripts: transcriptIndex.getStats(),
    imageUrls: imageUrlIndex.getStats()
  };
}

export async function clearAllCaches() {
  await Promise.all([
    transcriptIndex.clearCache(),
    imageUrlIndex.clearCache()
  ]);
  console.log("🗑️ All database caches cleared");
}

export async function refreshAllDatabases() {
  await Promise.all([
    transcriptIndex.forceRefresh(),
    imageUrlIndex.forceRefresh()
  ]);
  console.log("🔄 All databases refreshed");
}

// ===== COMIC STORAGE =====

function serializeComic(comic) {
  if (!comic) return null;
  return typeof comic.toJSON === 'function' ? comic.toJSON() : comic;
}

function hydrateComic(comic) {
  return Comic.fromSerialized(comic);
}

export function saveLastVisitedComic(comic, prevComic, nextComic) {
  if (typeof localStorage === 'undefined') return;

  const comicData = {
    currentComic: serializeComic(comic),
    previousComic: serializeComic(prevComic),
    nextComic: serializeComic(nextComic),
    savedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comicData));
}

export function loadLastVisitedComic() {
  if (typeof localStorage === 'undefined') return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const comicData = JSON.parse(saved);
    const isValid =
      comicData.savedAt &&
      Date.now() - comicData.savedAt < STORAGE_EXPIRY &&
      comicData.currentComic?.date &&
      isValidComicDateRange(comicData.currentComic.date);

    if (isValid) {
      const hydratedCurrent = hydrateComic(comicData.currentComic);
      if (!hydratedCurrent) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return {
        ...comicData,
        currentComic: hydratedCurrent,
        previousComic: hydrateComic(comicData.previousComic),
        nextComic: hydrateComic(comicData.nextComic),
      };
    } else {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  } catch (error) {
    console.error("Error parsing saved comic data:", error);
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}
