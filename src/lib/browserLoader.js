/**
 * Browser-side comic loading utilities
 * Complete client-side comic management for Vercel deployment
 */
import { loadTranscriptIndependently } from './comicsUtils.js';
import { getComicByDate, getPreviousComic, getNextComic, getRandomComicFromYear, getAvailableYearsBrowser } from './browser/comicsClient.js';

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
    const availableYears = await getAvailableYearsBrowser();
    
    if (availableYears.length === 0) {
      throw new Error('No comics available');
    }
    
    const randomYear = availableYears[Math.floor(Math.random() * availableYears.length)];
    const comic = await getRandomComicFromYear(randomYear);
    
    if (!comic) {
      throw new Error('No comics found in selected year');
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

/**
 * Load comic with transcript (browser-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} Comic and transcript data
 */
export async function loadComicWithTranscriptBrowser(date) {
  try {
    const [comicResult, transcript] = await Promise.all([
      loadComicBrowser(date),
      loadTranscriptIndependently(date, 'direct')
    ]);

    if (!comicResult.success) {
      throw new Error(comicResult.error);
    }

    return {
      success: true,
      comic: comicResult.comic,
      previousComic: comicResult.previousComic,
      nextComic: comicResult.nextComic,
      transcript
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if comic exists (browser-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>} True if comic exists
 */
export async function comicExistsBrowser(date) {
  try {
    const comic = await getComicByDate(date);
    return comic !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Check if transcript exists (browser-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<boolean>} True if transcript exists
 */
export async function transcriptExistsBrowser(date) {
  try {
    const transcript = await loadTranscriptIndependently(date, 'direct');
    return transcript !== null;
  } catch (error) {
    return false;
  }
}
