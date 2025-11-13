/**
 * Browser-side comic utilities - No file system dependencies
 * Perfect for Vercel and static deployment
 */
import { parseComicFilename, getAvailableYears, isValidComicDate,getComicImageUrl } from './comicsUtils.js';

/**
 * Define the actual date ranges for comics by year
 * This prevents generating invalid dates beyond the actual comic collection
 */
const COMIC_DATE_RANGES = {
  '1989': { start: '1989-04-16', end: '1989-12-31' }, // Dilbert started April 16, 1989
  '1990': { start: '1990-01-01', end: '1990-12-31' },
  '1991': { start: '1991-01-01', end: '1991-12-31' },
  '1992': { start: '1992-01-01', end: '1992-12-31' },
  '1993': { start: '1993-01-01', end: '1993-12-31' },
  '1994': { start: '1994-01-01', end: '1994-12-31' },
  '1995': { start: '1995-01-01', end: '1995-12-31' },
  '1996': { start: '1996-01-01', end: '1996-12-31' },
  '1997': { start: '1997-01-01', end: '1997-12-31' },
  '1998': { start: '1998-01-01', end: '1998-12-31' },
  '1999': { start: '1999-01-01', end: '1999-12-31' },
  '2000': { start: '2000-01-01', end: '2000-12-31' },
  '2001': { start: '2001-01-01', end: '2001-12-31' },
  '2002': { start: '2002-01-01', end: '2002-12-31' },
  '2003': { start: '2003-01-01', end: '2003-12-31' },
  '2004': { start: '2004-01-01', end: '2004-12-31' },
  '2005': { start: '2005-01-01', end: '2005-12-31' },
  '2006': { start: '2006-01-01', end: '2006-12-31' },
  '2007': { start: '2007-01-01', end: '2007-12-31' },
  '2008': { start: '2008-01-01', end: '2008-12-31' },
  '2009': { start: '2009-01-01', end: '2009-12-31' },
  '2010': { start: '2010-01-01', end: '2010-12-31' },
  '2011': { start: '2011-01-01', end: '2011-12-31' },
  '2012': { start: '2012-01-01', end: '2012-12-31' },
  '2013': { start: '2013-01-01', end: '2013-12-31' },
  '2014': { start: '2014-01-01', end: '2014-12-31' },
  '2015': { start: '2015-01-01', end: '2015-12-31' },
  '2016': { start: '2016-01-01', end: '2016-12-31' },
  '2017': { start: '2017-01-01', end: '2017-12-31' },
  '2018': { start: '2018-01-01', end: '2018-12-31' },
  '2019': { start: '2019-01-01', end: '2019-12-31' },
  '2020': { start: '2020-01-01', end: '2020-12-31' },
  '2021': { start: '2021-01-01', end: '2021-12-31' },
  '2022': { start: '2022-01-01', end: '2022-12-31' },
  '2023': { start: '2023-01-01', end: '2023-03-12' }  // Comics end on March 12, 2023
};

/**
 * Get the valid date range for a specific year
 * @param {string} year - Year to get range for
 * @returns {Object} Object with start and end dates
 */
function getDateRangeForYear(year) {
  return COMIC_DATE_RANGES[year] || null;
}

/**
 * Generate comic dates for a given year within the valid range
 * @param {string} year - Year to generate dates for
 * @returns {Array} Array of dates in YYYY-MM-DD format
 */
function generateComicDatesForYear(year) {
  const dateRange = getDateRangeForYear(year);
  if (!dateRange) {
    console.warn(`No date range defined for year ${year}`);
    return [];
  }

  const dates = [];
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateString = date.toISOString().split('T')[0];
    dates.push(dateString);
  }
  
  return dates;
}

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

/**
 * Get the absolute first comic date across all years
 * @returns {string} First comic date in YYYY-MM-DD format
 */
export function getFirstComicDate() {
  const years = Object.keys(COMIC_DATE_RANGES).sort();
  if (years.length === 0) return null;
  
  const firstYear = years[0];
  return COMIC_DATE_RANGES[firstYear].start;
}

/**
 * Get the absolute last comic date across all years
 * @returns {string} Last comic date in YYYY-MM-DD format
 */
export function getLastComicDate() {
  const years = Object.keys(COMIC_DATE_RANGES).sort();
  if (years.length === 0) return null;
  
  const lastYear = years[years.length - 1];
  return COMIC_DATE_RANGES[lastYear].end;
}

/**
 * Check if a date is within the valid comic date range
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is valid
 */
export function isValidComicDateRange(date) {
  const firstDate = getFirstComicDate();
  const lastDate = getLastComicDate();
  
  if (!firstDate || !lastDate) return false;
  
  return date >= firstDate && date <= lastDate;
}

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
    url: getComicImageUrl(year,filename)
  };
}

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
