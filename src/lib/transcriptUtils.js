/**
 * Transcript utilities for Dilbert comics
 * Functions for fetching and loading comic transcripts
 */

import { isValidComicDateRange } from './dateUtils.js';

// ============================================================================
// TRANSCRIPT FETCHING
// ============================================================================

/**
 * Fetch transcript for a comic by date (client-side, direct file access)
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

// ============================================================================
// TRANSCRIPT LOADING
// ============================================================================

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
