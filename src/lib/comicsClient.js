/**
 * Comic data fetching and navigation
 * Browser-side comic utilities - No file system dependencies
 * Perfect for Vercel and static deployment
 */

import { Comic } from './Comic.js';

// ============================================================================
// COMIC RETRIEVAL BY DATE
// ============================================================================

/**
 * Get comic by specific date (browser-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Comic object or null
 */
export async function getComicByDate(date) {
  const comic = Comic.fromDate(date);
  if (!comic) {
    console.warn('getComicByDate: Invalid or unavailable date:', date);
    return null;
  }
  return comic;
}

// ============================================================================
// COMIC NAVIGATION
// ============================================================================

/**
 * Get previous comic (browser-side)
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Previous comic object or null
 */
export async function getPreviousComic(currentDate) {
  try {
    const comic = Comic.fromDate(currentDate);
    if (!comic) {
      return null;
    }
    return comic.getPrevious();
  } catch (error) {
    console.error('Error getting previous comic:', error);
    return null;
  }
}

/**
 * Get next comic (browser-side)
 * @param {string} currentDate - Current date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Next comic object or null
 */
export async function getNextComic(currentDate) {
  try {
    const comic = Comic.fromDate(currentDate);
    if (!comic) {
      return null;
    }
    return comic.getNext();
  } catch (error) {
    console.error('Error getting next comic:', error);
    return null;
  }
}

// ============================================================================
// HIGH-LEVEL LOADERS (with navigation data)
// ============================================================================

/**
 * Load comic with navigation data (browser-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Comic data with navigation
 */
export async function loadComicBrowser(date) {
  try {
    const comic = Comic.fromDate(date);

    if (!comic) {
      throw new Error('Comic not found');
    }

    const previousComic = comic.getPrevious();
    const nextComic = comic.getNext();

    return {
      success: true,
      comic,
      previousComic,
      nextComic
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Load random comic (browser-side)
 * @returns {Promise<Object>} Random comic data with navigation
 */
export async function loadRandomComicBrowser() {
  try {
    const comic = Comic.random();
    if (!comic) {
      throw new Error('No comics available');
    }

    const previousComic = comic.getPrevious();
    const nextComic = comic.getNext();

    return {
      success: true,
      comic,
      previousComic,
      nextComic
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
