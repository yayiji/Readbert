/**
 * Script to generate the transcript index
 *
 * This script creates transcript index files:
 * - static/dilbert-index/transcript-index.json - Formatted version for development
 * - static/dilbert-index/transcript-index.min.json - Minified version for production
 *
 * Usage:
 * npm run generate-transcript-index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const ARCHIVE_START_YEAR = 1989;
const ARCHIVE_END_YEAR = 2023;
const INDEX_VERSION = '1.0';

class TranscriptIndexGenerator {
	constructor() {
		this.transcripts = new Map(); // date -> transcript data
		this.transcriptsPath = path.join(__dirname, '../static/dilbert-transcripts');
		this.outputPath = path.join(__dirname, '../static/dilbert-index/transcript-index.json');
	}

	// Main entry point: Generate transcript index
	async generate() {
		console.log('🚀 Generating transcript index...\n');
		const startTime = Date.now();

		await this.loadAllTranscripts();
		await this.saveTranscriptIndex();

		const duration = Date.now() - startTime;
		console.log(`✅ Transcript index generated successfully in ${duration}ms\n`);
	}

	// Load all transcripts from disk
	async loadAllTranscripts() {
		console.log('📂 Loading transcripts...');
		const startTime = Date.now();

		const years = this.getYearRange(ARCHIVE_START_YEAR, ARCHIVE_END_YEAR);
		let totalLoaded = 0;

		for (const year of years) {
			try {
				const comics = await this.loadComicsForYear(year);

				for (const comic of comics) {
					this.transcripts.set(comic.date, comic);
					totalLoaded++;
				}

				console.log(`   ✅ ${year}: ${comics.length} comics loaded`);
			} catch (error) {
				console.warn(`   ⚠️  ${year}: Failed to load - ${error.message}`);
			}
		}

		const duration = Date.now() - startTime;
		console.log(`   📊 Total: ${totalLoaded} transcripts loaded in ${duration}ms\n`);
	}

	// Save the transcript index to disk
	async saveTranscriptIndex() {
		console.log('💾 Saving transcript index...');
		const startTime = Date.now();

		const indexData = this.buildIndexData();
		this.ensureOutputDirectory();

		// Save formatted version
		const json = JSON.stringify(indexData, null, 2);
		fs.writeFileSync(this.outputPath, json, 'utf8');

		// Save minified version (used by runtime)
		const minifiedJson = JSON.stringify(indexData);
		const minifiedPath = this.outputPath.replace('.json', '.min.json');
		fs.writeFileSync(minifiedPath, minifiedJson, 'utf8');

		// Log file sizes
		const formattedSizeMB = (fs.statSync(this.outputPath).size / 1024 / 1024).toFixed(2);
		const minifiedSizeMB = (fs.statSync(minifiedPath).size / 1024 / 1024).toFixed(2);
		console.log(`   📁 Formatted: ${formattedSizeMB} MB`);
		console.log(`   📁 Minified: ${minifiedSizeMB} MB`);

		const duration = Date.now() - startTime;
		console.log(`   ✅ Completed in ${duration}ms\n`);
	}

	// ===== Helper Methods =====

	// Generate array of years from start to end (inclusive)
	getYearRange(startYear, endYear) {
		const length = endYear - startYear + 1;
		return Array.from({ length }, (_, i) => startYear + i);
	}

	// Load all comics for a specific year
	async loadComicsForYear(year) {
		const yearPath = path.join(this.transcriptsPath, year.toString());
		const files = fs.readdirSync(yearPath);
		const jsonFiles = files.filter(file => file.endsWith('.json'));

		const comics = [];
		for (const file of jsonFiles) {
			const filePath = path.join(yearPath, file);
			try {
				const content = fs.readFileSync(filePath, 'utf8');
				const comic = JSON.parse(content);
				comics.push(comic);
			} catch (error) {
				console.warn(`     ⚠️  Failed to load ${file}: ${error.message}`);
			}
		}

		return comics;
	}

	// Build the final index data structure
	buildIndexData() {
		const transcripts = {};

		for (const [date, transcript] of this.transcripts) {
			transcripts[date] = transcript;
		}

		return {
			version: INDEX_VERSION,
			generatedAt: new Date().toISOString(),
			stats: {
				totalTranscripts: this.transcripts.size
			},
			transcripts
		};
	}

	// Ensure the output directory exists
	ensureOutputDirectory() {
		const outputDir = path.dirname(this.outputPath);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}
	}
}

// ===== Run Generator =====

const generator = new TranscriptIndexGenerator();
generator.generate().catch(error => {
	console.error('❌ Failed to generate transcript index:', error);
	process.exit(1);
});
