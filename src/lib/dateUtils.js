/**
 * Pure date utility functions for Dilbert comics
 * No external dependencies - can be used anywhere
 */

import { COMIC_DATE_RANGES } from './comicsConfig.js';

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Formatted date (e.g., "January 15, 2023")
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ============================================================================
// DATE VALIDATION
// ============================================================================

/**
 * Check if a date string is valid (proper format and valid calendar date)
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
  if (
    comicDate.getFullYear() !== year ||
    comicDate.getMonth() !== month - 1 ||
    comicDate.getDate() !== day
  ) {
    return false;
  }

  // Dilbert started in 1989
  if (year < 1989) {
    return false;
  }

  return true;
}

/**
 * Check if a date is within the valid comic date range
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is within the collection range
 */
export function isValidComicDateRange(date) {
  const firstDate = getFirstComicDate();
  const lastDate = getLastComicDate();

  if (!firstDate || !lastDate) return false;

  return date >= firstDate && date <= lastDate;
}

// ============================================================================
// DATE RANGE OPERATIONS
// ============================================================================

/**
 * Get the valid date range for a specific year
 * @param {string} year - Year to get range for
 * @returns {Object|null} Object with start and end dates, or null if not defined
 */
export function getDateRangeForYear(year) {
  return COMIC_DATE_RANGES[year] || null;
}

/**
 * Get the absolute first comic date across all years
 * @returns {string|null} First comic date in YYYY-MM-DD format
 */
export function getFirstComicDate() {
  const years = Object.keys(COMIC_DATE_RANGES).sort();
  if (years.length === 0) return null;

  const firstYear = years[0];
  return COMIC_DATE_RANGES[firstYear].start;
}

/**
 * Get the absolute last comic date across all years
 * @returns {string|null} Last comic date in YYYY-MM-DD format
 */
export function getLastComicDate() {
  const years = Object.keys(COMIC_DATE_RANGES).sort();
  if (years.length === 0) return null;

  const lastYear = years[years.length - 1];
  return COMIC_DATE_RANGES[lastYear].end;
}

// ============================================================================
// DATE GENERATION
// ============================================================================

/**
 * Generate all comic dates for a given year within the valid range
 * @param {string} year - Year to generate dates for
 * @returns {string[]} Array of dates in YYYY-MM-DD format
 */
export function generateComicDatesForYear(year) {
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
