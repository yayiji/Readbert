/**
 * Utility functions for handling Dilbert comics
 */

// Import validation function (note: this creates a circular import, but it should work in this case)
import { isValidComicDateRange } from './comicsClient.js';

/**
 * Parse a comic filename to extract the date and format it
 * @param {string} filename - Comic filename (e.g., "2023-01-15.gif")
 * @returns {Object} Comic info with date and formatted date
 */
export function parseComicFilename(filename) {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Date is now the full filename
  const date = nameWithoutExt;
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  
  return {
    date,
    formattedDate: formatDate(date),
    tags: [] // No longer used, but kept for compatibility
  };
}

/**
 * Generate comic filename from date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Comic filename
 */
export function generateComicFilename(date) {
  return `${date}.gif`;
}

/**
 * Check if a date is valid for comics
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is valid
 */
export function isValidComicDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  
  const [year, month, day] = date.split('-').map(Number);
  const comicDate = new Date(year, month - 1, day);
  
  // Check if the date is valid
  if (comicDate.getFullYear() !== year || 
      comicDate.getMonth() !== month - 1 || 
      comicDate.getDate() !== day) {
    return false;
  }
  
  // Dilbert started in 1989
  if (year < 1989) {
    return false;
  }
  
  return true;
}

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get comic image URL
 * @param {string} year - Year folder
 * @param {string} filename - Comic filename
 * @returns {string} Image URL
 */
export function getComicImageUrl(year, date) {
  const cdnUrl = `https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-comics/${year}/${date}.gif`
  const localUrl = `/dilbert-comics/${year}/${date}.gif`
  return cdnUrl; // Primary URL
}

/**
 * Get all available years that have completed transcripts
 * 
 * 🔧 HOW TO ADD NEW YEARS:
 * When you finish transcribing a new year, add it to the TRANSCRIBED_YEARS array below.
 * Example: After transcribing 2021, change the array to: ['2022', '2023', '2021']
 * 
 * @returns {string[]} Array of year strings for years with completed transcripts
 */
export function getAvailableYears() {
  // 📝 EDIT THIS ARRAY to add newly transcribed years
  const TRANSCRIBED_YEARS = [
    '1989', '1990', '1991', '1992', '1993',
    '1994', '1995', '1996', '1997', '1998',
    '1999', '2000', '2001', '2002', '2003',
    '2004', '2005', '2006', '2007', '2008',
    '2009', '2010', '2011', '2012', '2013',
    '2014', '2015', '2016', '2017', '2018',
    '2019', '2020', '2021', '2022', '2023'
  ];
  // const TRANSCRIBED_YEARS = ['2020'];
  
  return TRANSCRIBED_YEARS.sort(); // Keep them sorted chronologically
}

/**
 * Fetch transcript for a comic by date (client-side)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Transcript object or null if not found
 */
export async function fetchTranscriptByDate(date) {
  try {
    const year = date.split('-')[0];
    const transcriptUrl = `/dilbert-transcripts/${year}/${date}.json`;
    
    const response = await fetch(transcriptUrl);
    
    if (!response.ok) {
      // Transcript file doesn't exist or can't be accessed
      return null;
    }
    
    const transcript = await response.json();
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return null;
  }
}

/**
 * Fetch transcript using API endpoint (fallback method)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Transcript object or null if not found
 */
export async function fetchTranscriptViaAPI(date) {
  try {
    const response = await fetch(`/api/transcript?date=${date}`);
    const result = await response.json();
    
    if (result.success && result.transcriptUrl) {
      // API now returns URL for client-side fetching
      const transcriptResponse = await fetch(result.transcriptUrl);
      if (transcriptResponse.ok) {
        return await transcriptResponse.json();
      }
    }
    
    console.log(`Transcript not found for ${date}:`, result.error);
    return null;
  } catch (error) {
    console.error('Error fetching transcript via API:', error);
    return null;
  }
}

/**
 * Independent transcript loader with browser-first approach
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} method - Loading method: 'direct', 'api', or 'auto' (default)
 * @returns {Promise<Object|null>} Transcript object or null if not found
 */
export async function loadTranscriptIndependently(date, method = 'direct') {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('Invalid date format for transcript:', date);
    return null;
  }

  // Validate date is within valid comic range
  if (!isValidComicDateRange(date)) {
    console.warn('Transcript requested for date outside valid range:', date);
    return null;
  }

  switch (method) {
    case 'direct':
      return await fetchTranscriptByDate(date);
    
    case 'api':
      return await fetchTranscriptViaAPI(date);
    
    case 'auto':
      // Direct loading only for browser-first approach
      return await fetchTranscriptByDate(date);
    
    default:
      return await fetchTranscriptByDate(date);
  }
}
