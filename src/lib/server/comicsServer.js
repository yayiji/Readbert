/**
 * Server-side utilities for reading comic files from the filesystem
 */
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { parseComicFilename, generateComicFilename, isValidComicDate, getAvailableYears as getAvailableYearsFromUtils } from '../comicsUtils.js';

const COMICS_BASE_PATH = 'static/dilbert-comics';

/**
 * Get all comics for a specific year
 * @param {string} year - Year to get comics for
 * @returns {Promise<Array>} Array of comic objects
 */
export async function getComicsForYear(year) {
  try {
    const yearPath = join(COMICS_BASE_PATH, year);
    const files = await readdir(yearPath);
    
    const comics = files
      .filter(file => file.endsWith('.gif'))
      .map(filename => {
        const comic = parseComicFilename(filename);
        return {
          ...comic,
          url: `/dilbert-comics/${year}/${filename}`
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    
    return comics;
  } catch (error) {
    console.error(`Error reading comics for year ${year}:`, error);
    return [];
  }
}

/**
 * Get all available years that have completed transcripts
 * This now delegates to the client utils to avoid duplication
 * 
 * 🔧 HOW TO ADD NEW YEARS:
 * Add new years in /src/lib/comicsUtils.js in the getAvailableYears() function
 * 
 * @returns {Promise<Array>} Array of year strings for years with completed transcripts
 */
export async function getAvailableYears() {
  // Delegate to the client utils function to avoid duplication
  return getAvailableYearsFromUtils();
}

/**
 * Get a random comic from a specific year
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
 * Search comics across all years by date
 * @param {string} searchTerm - Date term to search for (YYYY, YYYY-MM, or YYYY-MM-DD)
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array>} Array of matching comic objects
 */
export async function searchComics(searchTerm, limit = 50) {
  if (!searchTerm) return [];
  
  // If it's a complete date, try direct lookup
  if (/^\d{4}-\d{2}-\d{2}$/.test(searchTerm)) {
    const comic = await getComicByDate(searchTerm);
    return comic ? [comic] : [];
  }
  
  // For partial dates, fall back to scanning
  const years = await getAvailableYears();
  const allComics = [];
  
  for (const year of years) {
    const comics = await getComicsForYear(year);
    allComics.push(...comics);
  }
  
  const filteredComics = allComics
    .filter(comic => comic.date.includes(searchTerm))
    .slice(0, limit);
  
  return filteredComics;
}

/**
 * Get all comics sorted by date
 * @returns {Promise<Array>} Array of all comic objects sorted by date
 */
export async function getAllComicsSorted() {
  const years = await getAvailableYears();
  const allComics = [];
  
  for (const year of years) {
    const comics = await getComicsForYear(year);
    allComics.push(...comics);
  }
  
  return allComics.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get a comic by its date (optimized for simplified filenames)
 * @param {string} date - Date of the comic (YYYY-MM-DD format)
 * @returns {Promise<Object|null>} Comic object or null
 */
export async function getComicByDate(date) {
  if (!isValidComicDate(date)) {
    return null;
  }
  
  const year = date.split('-')[0];
  const filename = generateComicFilename(date);
  const filePath = join(COMICS_BASE_PATH, year, filename);
  
  try {
    await access(filePath);
    return {
      filename,
      date,
      tags: [],
      extension: 'gif',
      year,
      url: `/dilbert-comics/${year}/${filename}`
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get the comic before the given date (optimized)
 * @param {string} currentDate - Current comic date (YYYY-MM-DD format)
 * @returns {Promise<Object|null>} Previous comic object or null
 */
export async function getPreviousComic(currentDate) {
  const currentDateObj = new Date(currentDate);
  
  // Go back one day at a time until we find a comic (max 30 days to handle longer gaps)
  for (let i = 1; i <= 30; i++) {
    const prevDate = new Date(currentDateObj);
    prevDate.setDate(prevDate.getDate() - i);
    
    const dateString = prevDate.toISOString().split('T')[0];
    const comic = await getComicByDate(dateString);
    
    if (comic) {
      return comic;
    }
  }
  
  return null;
}

/**
 * Get the comic after the given date (optimized)
 * @param {string} currentDate - Current comic date (YYYY-MM-DD format)
 * @returns {Promise<Object|null>} Next comic object or null
 */
export async function getNextComic(currentDate) {
  const currentDateObj = new Date(currentDate);
  
  // Go forward one day at a time until we find a comic (max 30 days to handle longer gaps)
  for (let i = 1; i <= 30; i++) {
    const nextDate = new Date(currentDateObj);
    nextDate.setDate(nextDate.getDate() + i);
    
    const dateString = nextDate.toISOString().split('T')[0];
    const comic = await getComicByDate(dateString);
    
    if (comic) {
      return comic;
    }
  }
  
  return null;
}

/**
 * Get a random comic from all years (optimized)
 * @returns {Promise<Object|null>} Random comic object or null
 */
export async function getRandomComic() {
  const availableYears = await getAvailableYears();
  
  if (availableYears.length === 0) return null;
  
  // Generate random dates from available years until we find one that exists
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Random year from available years
    const randomYearIndex = Math.floor(Math.random() * availableYears.length);
    const year = parseInt(availableYears[randomYearIndex]);
    
    // Random month and day
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1; // Use 28 to avoid month length issues
    
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    const comic = await getComicByDate(dateString);
    if (comic) {
      return comic;
    }
  }
  
  // Fallback to the old method if random approach fails
  const allComics = await getAllComicsSorted();
  if (allComics.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * allComics.length);
  return allComics[randomIndex];
}

/**
 * Load transcript for a specific comic date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Transcript object or null if not found
 */
export async function getTranscriptByDate(date) {
  try {
    const year = date.split('-')[0];
    const transcriptPath = join('static/dilbert-transcripts', year, `${date}.json`);
    
    // Check if transcript file exists
    await access(transcriptPath);
    
    // Read and parse the transcript file
    const { readFile } = await import('fs/promises');
    const transcriptData = await readFile(transcriptPath, 'utf-8');
    return JSON.parse(transcriptData);
  } catch (error) {
    // File doesn't exist or can't be read
    return null;
  }
}
