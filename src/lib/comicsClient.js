/**
 * Comic data fetching and navigation
 * Browser-side comic utilities - No file system dependencies
 * Perfect for Vercel and static deployment
 */

import {
  isValidComicDate,
  isValidComicDateRange,
  getFirstComicDate,
  getLastComicDate
} from './dateUtils.js';
import {
  parseComicFilename,
  getComicImageUrl
} from './comicsUtils.js';

// ============================================================================
// COMIC RETRIEVAL BY DATE
// ============================================================================

/**
 * Get comic by specific date (browser-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Comic object or null
 */
export async function getComicByDate(date) {
  // Early validation to prevent invalid HTTP requests
  if (!date || !isValidComicDate(date)) {
    console.warn('getComicByDate: Invalid date format:', date);
    return null;
  }

  if (!isValidComicDateRange(date)) {
    console.warn('getComicByDate: Date outside valid range:', date);
    return null;
  }

  const year = date.split('-')[0];
  const filename = `${date}.gif`;
  const comic = parseComicFilename(filename);

  if (!comic) {
    console.warn('getComicByDate: Could not parse comic filename for date:', date);
    return null;
  }

  return {
    ...comic,
    url: getComicImageUrl(year, date)
  };
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
    const firstDate = getFirstComicDate();
    if (!firstDate || currentDate <= firstDate) {
      return null; // Already at the first comic
    }

    const current = new Date(currentDate);
    const previous = new Date(current);
    previous.setDate(previous.getDate() - 1);

    const previousDateString = previous.toISOString().split('T')[0];

    // Ensure we don't go before the first comic date
    if (previousDateString < firstDate) {
      return null;
    }

    return await getComicByDate(previousDateString);
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
    const lastDate = getLastComicDate();
    if (!lastDate || currentDate >= lastDate) {
      return null; // Already at the last comic
    }

    const current = new Date(currentDate);
    const next = new Date(current);
    next.setDate(next.getDate() + 1);

    const nextDateString = next.toISOString().split('T')[0];

    // Ensure we don't go beyond the last comic date
    if (nextDateString > lastDate) {
      return null;
    }

    return await getComicByDate(nextDateString);
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
    const comic = await getComicByDate(date);

    if (!comic) {
      throw new Error('Comic not found');
    }

    const [previousComic, nextComic] = await Promise.all([
      getPreviousComic(date),
      getNextComic(date)
    ]);

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
    // Get date range boundaries
    const firstDate = getFirstComicDate();
    const lastDate = getLastComicDate();

    if (!firstDate || !lastDate) {
      throw new Error('No comics available');
    }

    // Pick a random date between first and last comic
    const firstTimestamp = new Date(firstDate).getTime();
    const lastTimestamp = new Date(lastDate).getTime();
    const randomTimestamp = firstTimestamp + Math.random() * (lastTimestamp - firstTimestamp);
    const randomDate = new Date(randomTimestamp).toISOString().split('T')[0];

    // Get the comic for this random date
    const comic = await getComicByDate(randomDate);

    if (!comic) {
      throw new Error('No comics found');
    }

    const [previousComic, nextComic] = await Promise.all([
      getPreviousComic(comic.date),
      getNextComic(comic.date)
    ]);

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
