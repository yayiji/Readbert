/**
 * Database and Storage Management for Dilbert Comics
 * Handles database initialization and cache management
 */

import { transcriptIndex } from './transcriptIndex.js';
import { imageUrlIndex } from './imageUrlIndex.js';

// ===== DATABASE INITIALIZATION =====

export async function initializeDatabases() {
  try {
    console.log("🚀 Initializing databases...");
    await Promise.all([
      transcriptIndex.load(),
      imageUrlIndex.load()
    ]);
    console.log("✅ All databases ready");
  } catch (error) {
    console.error("❌ Failed to load databases:", error);
    throw error;
  }
}

// ===== DATABASE ACCESS =====

export { transcriptIndex } from './transcriptIndex.js';
export { imageUrlIndex } from './imageUrlIndex.js';

// ===== DATABASE UTILITIES =====

export function getDatabaseStats() {
  return {
    transcripts: transcriptIndex.getStats(),
    imageUrls: imageUrlIndex.getStats()
  };
}

export async function clearAllCaches() {
  await Promise.all([
    transcriptIndex.clearCache(),
    imageUrlIndex.clearCache()
  ]);
  console.log("🗑️ All database caches cleared");
}

export async function refreshAllDatabases() {
  await Promise.all([
    transcriptIndex.forceRefresh(),
    imageUrlIndex.forceRefresh()
  ]);
  console.log("🔄 All databases refreshed");
}

