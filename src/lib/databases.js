/**
 * Database Management for Dilbert Comics
 * Central access point for transcript and image URL databases
 */

import { transcriptDatabase } from './transcriptDatabase.js';
import { imageUrlDatabase } from './imageUrlDatabase.js';

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

/**
 * Initialize both transcript and image URL databases
 * Loads databases in parallel for better performance
 * @returns {Promise<void>}
 */
export async function initializeDatabases() {
  try {
    console.log("🚀 Initializing databases...");

    // Load both databases in parallel for better performance
    await Promise.all([
      transcriptDatabase.load(),
      imageUrlDatabase.load()
    ]);

    console.log("✅ Transcript database ready");
    console.log("✅ Image URL database ready");
  } catch (error) {
    console.error("❌ Failed to load databases:", error);
    throw error;
  }
}

// ============================================================================
// TRANSCRIPT DATABASE
// ============================================================================

/**
 * Load transcript for a given date
 * Automatically loads the transcript database if needed
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object|null>} Transcript object or null
 */
export async function loadTranscript(date) {
  if (!date) {
    return null;
  }
  return transcriptDatabase.getTranscript(date);
}

/**
 * Check if transcript database is loaded
 * @returns {boolean} True if loaded
 */
export function isTranscriptDatabaseLoaded() {
  return transcriptDatabase.isDatabaseLoaded();
}

/**
 * Get transcript database statistics
 * @returns {Object} Transcript database statistics
 */
export function getTranscriptStats() {
  return transcriptDatabase.getStats();
}

/**
 * Clear transcript database cache
 * @returns {Promise<void>}
 */
export async function clearTranscriptCache() {
  await transcriptDatabase.clearCache();
  console.log("🗑️ Transcript database cache cleared");
}

/**
 * Force refresh transcript database from server
 * @returns {Promise<void>}
 */
export async function refreshTranscriptDatabase() {
  await transcriptDatabase.forceRefresh();
  console.log("🔄 Transcript database refreshed from server");
}

// ============================================================================
// IMAGE URL DATABASE
// ============================================================================

/**
 * Check if image URL database is loaded
 * @returns {boolean} True if loaded
 */
export function isImageUrlDatabaseLoaded() {
  return imageUrlDatabase.isDatabaseLoaded();
}

/**
 * Get image URL database statistics
 * @returns {Object} Image URL database statistics
 */
export function getImageUrlStats() {
  return imageUrlDatabase.getStats();
}

/**
 * Clear image URL database cache
 * @returns {Promise<void>}
 */
export async function clearImageUrlCache() {
  await imageUrlDatabase.clearCache();
  console.log("🗑️ Image URL database cache cleared");
}

/**
 * Force refresh image URL database from server
 * @returns {Promise<void>}
 */
export async function refreshImageUrlDatabase() {
  await imageUrlDatabase.forceRefresh();
  console.log("🔄 Image URL database refreshed from server");
}

// ============================================================================
// COMBINED OPERATIONS
// ============================================================================

/**
 * Get statistics for all databases
 * @returns {Object} Statistics for both databases
 */
export function getDatabaseStats() {
  return {
    transcripts: transcriptDatabase.getStats(),
    imageUrls: imageUrlDatabase.getStats()
  };
}

/**
 * Clear all database caches
 * Useful for debugging or forcing a refresh
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
  await Promise.all([
    transcriptDatabase.clearCache(),
    imageUrlDatabase.clearCache()
  ]);
  console.log("🗑️ All database caches cleared");
}

/**
 * Force refresh both databases from server
 * @returns {Promise<void>}
 */
export async function refreshAllDatabases() {
  await Promise.all([
    transcriptDatabase.forceRefresh(),
    imageUrlDatabase.forceRefresh()
  ]);
  console.log("🔄 All databases refreshed from server");
}
