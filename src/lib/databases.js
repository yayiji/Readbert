import { transcriptIndex } from './transcriptIndex.js';

export { transcriptIndex };

export async function initializeDatabases() {
  try {
    console.log('🚀 Initializing databases...');
    await transcriptIndex.load();
    console.log('✅ All databases ready');
  } catch (error) {
    console.error('❌ Failed to load databases:', error);
    throw error;
  }
}

export async function clearAllCaches() {
  await transcriptIndex.clearCache();
  console.log('🗑️ All database caches cleared');
}

export async function refreshAllDatabases() {
  await transcriptIndex.forceRefresh();
  console.log('🔄 All databases refreshed');
}
