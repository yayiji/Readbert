/**
 * Database Management for Dilbert Comics
 * Central initialization point for transcript and image URL databases
 */

import { transcriptDatabase } from './transcriptDatabase.js';
import { imageUrlDatabase } from './imageUrlDatabase.js';

// ===== INITIALIZATION =====

/**
 * Initialize both databases in parallel
 */
export async function initializeDatabases() {
  try {
    console.log("🚀 Initializing databases...");
    await Promise.all([
      transcriptDatabase.load(),
      imageUrlDatabase.load()
    ]);
    console.log("✅ All databases ready");
  } catch (error) {
    console.error("❌ Failed to load databases:", error);
    throw error;
  }
}

// ===== DATABASE ACCESS =====

// Re-export database instances for direct access
export { transcriptDatabase } from './transcriptDatabase.js';
export { imageUrlDatabase } from './imageUrlDatabase.js';

// ===== UTILITIES =====

export function getDatabaseStats() {
  return {
    transcripts: transcriptDatabase.getStats(),
    imageUrls: imageUrlDatabase.getStats()
  };
}

export async function clearAllCaches() {
  await Promise.all([
    transcriptDatabase.clearCache(),
    imageUrlDatabase.clearCache()
  ]);
  console.log("🗑️ All database caches cleared");
}

export async function refreshAllDatabases() {
  await Promise.all([
    transcriptDatabase.forceRefresh(),
    imageUrlDatabase.forceRefresh()
  ]);
  console.log("🔄 All databases refreshed");
}
