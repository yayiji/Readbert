/**
 * Convenience script to generate both indexes in sequence
 *
 * This script runs:
 * 1. generateTranscriptIndex.js - Creates static/dilbert-index/transcript-index.min.json
 * 2. generateSearchIndex.js - Creates static/dilbert-index/search-index.min.json
 *
 * Usage:
 * npm run generate-databases
 */

import { execSync } from 'child_process';

console.log('🚀 Generating all indexes...\n');
console.log('=' .repeat(60));
const startTime = Date.now();

try {
	// Step 1: Generate transcript index
	console.log('\n📊 Step 1/2: Generating transcript index...\n');
	execSync('node scripts/generateTranscriptIndex.js', { stdio: 'inherit' });

	// Step 2: Generate search index
	console.log('=' .repeat(60));
	console.log('\n📊 Step 2/2: Generating search index...\n');
	execSync('node scripts/generateSearchIndex.js', { stdio: 'inherit' });

	const duration = Date.now() - startTime;
	console.log('=' .repeat(60));
	console.log(`\n🎉 All indexes generated successfully in ${duration}ms\n`);
} catch (error) {
	console.error('\n❌ Failed to generate indexes:', error.message);
	process.exit(1);
}
