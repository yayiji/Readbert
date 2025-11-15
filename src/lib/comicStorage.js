import { Comic } from "./Comic.js";
import { isValidComicDateRange } from "./dateUtils.js";

// Constants
const STORAGE_KEY = "lastVisitedComic";
const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Serializes a Comic instance to a plain object for storage
 */
function serializeComic(comic) {
  if (!comic) return null;
  return typeof comic.toJSON === "function" ? comic.toJSON() : comic;
}

/**
 * Hydrates a plain object back into a Comic instance
 */
function hydrateComic(comic) {
  return Comic.fromSerialized(comic);
}

/**
 * Saves the last visited comic data to localStorage
 * @param {Comic} comic - The current comic
 * @param {Comic} prevComic - The previous comic
 * @param {Comic} nextComic - The next comic
 * @param {Object} comicTranscript - The comic transcript data
 */
export function saveLastVisitedComic(comic, prevComic, nextComic, comicTranscript) {
  if (typeof localStorage === "undefined") return;

  const comicData = {
    currentComic: serializeComic(comic),
    previousComic: serializeComic(prevComic),
    nextComic: serializeComic(nextComic),
    transcript: comicTranscript,
    savedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comicData));
}

/**
 * Loads the last visited comic data from localStorage
 * @returns {Object|null} The saved comic data with hydrated Comic instances, or null if invalid/expired
 */
export function loadLastVisitedComic() {
  if (typeof localStorage === "undefined") return null;

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
