/**
 * Comic data fetching and navigation
 * Browser-side comic utilities - No file system dependencies
 * Perfect for Vercel and static deployment
 */

import {
  isValidComicDate,
  isValidComicDateRange,
  getFirstComicDate,
  getLastComicDate,
  generateComicDatesForYear
} from './dateUtils.js';
import {
  parseComicFilename,
  getComicImageUrl,
  getAvailableYears
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
// COMICS BY YEAR
// ============================================================================

/**
 * Get all comics for a specific year (browser-side)
 * @param {string} year - Year to get comics for
 * @returns {Promise<Array>} Array of comic objects
 */
export async function getComicsForYear(year) {
  try {
    // Generate all possible dates for the year
    const allDates = generateComicDatesForYear(year);

    // Create comic objects for all dates
    const comics = allDates.map(date => {
      const filename = `${date}.gif`;
      const comic = parseComicFilename(filename);
      return {
        ...comic,
        url: `/dilbert-comics/${year}/${filename}`
      };
    }).filter(comic => comic !== null);

    return comics;
  } catch (error) {
    console.error(`Error generating comics for year ${year}:`, error);
    return [];
  }
}

/**
 * Get all available years (browser-side)
 * @returns {Promise<Array>} Array of year strings
 */
export async function getAvailableYearsBrowser() {
  return getAvailableYears();
}

// ============================================================================
// RANDOM COMICS
// ============================================================================

/**
 * Get a random comic from a specific year (browser-side)
 * @param {string} year - Year to get random comic from
 * @returns {Promise<Object|null>} Random comic object or null
 */
export async function getRandomComicFromYear(year) {
  const comics = await getComicsForYear(year);
  if (comics.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * comics.length);
  return comics[randomIndex];
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Get all comics sorted by date (browser-side)
 * @returns {Promise<Array>} Array of all comic objects sorted by date
 */
export async function getAllComicsSorted() {
  const availableYears = await getAvailableYearsBrowser();
  const allComics = [];

  for (const year of availableYears) {
    const yearComics = await getComicsForYear(year);
    allComics.push(...yearComics);
  }

  return allComics.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================================================
// SEARCH
// ============================================================================

/**
 * Search comics by date pattern (browser-side)
 * @param {string} searchTerm - Date pattern to search for
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} Array of matching comics
 */
export async function searchComics(searchTerm, limit = 50) {
  if (!searchTerm) return [];

  // If it's a complete date, try direct lookup
  if (/^\d{4}-\d{2}-\d{2}$/.test(searchTerm)) {
    const comic = await getComicByDate(searchTerm);
    return comic ? [comic] : [];
  }

  // For partial dates, search all comics
  const allComics = await getAllComicsSorted();
  const filteredComics = allComics
    .filter(comic => comic.date.includes(searchTerm))
    .slice(0, limit);

  return filteredComics;
}
