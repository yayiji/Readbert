/**
 * Database and Storage Management for Dilbert Comics
 * Handles database initialization and cache management
 */

import { transcriptIndex } from './transcriptIndex.js';

// ===== DATABASE INITIALIZATION =====

export async function initializeDatabases() {
  try {
    console.log("🚀 Initializing databases...");
    await Promise.all([
      transcriptIndex.load()
    ]);
    console.log("✅ All databases ready");
  } catch (error) {
    console.error("❌ Failed to load databases:", error);
    throw error;
  }
}

// ===== DATABASE ACCESS =====

export { transcriptIndex } from './transcriptIndex.js';

// ===== DATABASE UTILITIES =====

export async function clearAllCaches() {
  await Promise.all([
    transcriptIndex.clearCache()
  ]);
  console.log("🗑️ All database caches cleared");
}

export async function refreshAllDatabases() {
  await Promise.all([
    transcriptIndex.forceRefresh()
  ]);
  console.log("🔄 All databases refreshed");
}

