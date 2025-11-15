/**
 * Comic-specific utility functions
 * Functions for parsing filenames, generating URLs, and getting available years
 */

import { formatDate } from './dateUtils.js';
import { TRANSCRIBED_YEARS } from './comicsConfig.js';
import { imageUrlDatabase } from './imageUrlDatabase.js';

// ============================================================================
// FILENAME UTILITIES
// ============================================================================

/**
 * Parse a comic filename to extract the date and format it
 * @param {string} filename - Comic filename (e.g., "2023-01-15.gif")
 * @returns {Object|null} Comic info with date and formatted date, or null if invalid
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
 * @returns {string} Comic filename (e.g., "2023-01-15.gif")
 */
export function generateComicFilename(date) {
  return `${date}.gif`;
}

// ============================================================================
// IMAGE URL UTILITIES
// ============================================================================

/**
 * Get the image URL for a comic
 * Tries to load from image URL database first, falls back to CDN
 * @param {string} year - Year folder
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Image URL
 */
export function getComicImageUrl(year, date) {
  const urlData = imageUrlDatabase.getImageUrl(date);
  if (urlData && urlData.imageUrl) {
    return urlData.imageUrl;
  }

  // Fallback to CDN URL
  const cdnUrl = `https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-comics/${year}/${date}.gif`;
  const localUrl = `/dilbert-comics/${year}/${date}.gif`;

  return cdnUrl;
}

// ============================================================================
// AVAILABLE YEARS
// ============================================================================

/**
 * Get all available years that have completed transcripts
 * @returns {string[]} Array of year strings (sorted chronologically)
 */
export function getAvailableYears() {
  return [...TRANSCRIBED_YEARS].sort(); // Return a sorted copy
}
