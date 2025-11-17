/**
 * This script creates the search index file:
 * Usage:
 * npm run generate-search-index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration constants
const ARCHIVE_START_YEAR = 1989;
const ARCHIVE_END_YEAR = 2023;
const MIN_WORD_LENGTH = 2;
const INDEX_VERSION = '1.0';

class SearchIndexGenerator {
	constructor() {
		this.transcripts = new Map(); // date -> transcript data
		this.searchIndex = new Map(); // word -> Set of comic dates
		this.transcriptsPath = path.join(__dirname, '../static/dilbert-transcripts');
		this.outputPath = path.join(__dirname, '../static/dilbert-index/search-index.json');
	}

	// Main entry point: Generate search index
	async generate() {
		console.log('🚀 Generating search index...\n');
		const startTime = Date.now();

		await this.loadAllTranscripts();
		await this.buildSearchIndex();
		await this.saveSearchIndex();

		const duration = Date.now() - startTime;
		console.log(`✅ Search index generated successfully in ${duration}ms\n`);
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

	// Build search index from loaded transcripts
	async buildSearchIndex() {
		console.log('🔍 Building search index...');
		const startTime = Date.now();

		for (const [date, comic] of this.transcripts) {
			const dialogueText = this.extractAllDialogue(comic);
			const words = this.extractWords(dialogueText);

			this.indexWords(words, date);
		}

		const duration = Date.now() - startTime;
		console.log(`   🔤 ${this.searchIndex.size} unique words indexed in ${duration}ms\n`);
	}

	// Save the search index to disk
	async saveSearchIndex() {
		console.log('💾 Saving search index...');
		const startTime = Date.now();

		const searchIndexData = this.buildIndexData();
		this.ensureOutputDirectory();

		const json = JSON.stringify(searchIndexData, null, 2);
		fs.writeFileSync(this.outputPath, json, 'utf8');

		const fileSizeMB = (fs.statSync(this.outputPath).size / 1024 / 1024).toFixed(2);
		console.log(`   📁 Saved: ${fileSizeMB} MB`);

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

	// Extract all dialogue text from a comic
	extractAllDialogue(comic) {
		const allDialogue = [];

		for (const panel of comic.panels) {
			for (const dialogue of panel.dialogue) {
				allDialogue.push(dialogue);
			}
		}

		return allDialogue.join(' ').toLowerCase();
	}

	// Extract searchable words from text
	extractWords(text) {
		return text
			.replace(/[^\w\s]/g, ' ')        // Remove punctuation
			.split(/\s+/)                    // Split on whitespace
			.filter(word => word.length > MIN_WORD_LENGTH)
			.map(word => word.toLowerCase());
	}

	// Add words to the search index for a given date
	indexWords(words, date) {
		for (const word of words) {
			if (!this.searchIndex.has(word)) {
				this.searchIndex.set(word, new Set());
			}
			this.searchIndex.get(word).add(date);
		}
	}

	// Build the final index data structure
	buildIndexData() {
		const wordIndex = {};

		for (const [word, dates] of this.searchIndex) {
			wordIndex[word] = Array.from(dates);
		}

		return {
			version: INDEX_VERSION,
			generatedAt: new Date().toISOString(),
			stats: {
				totalComics: this.transcripts.size,
				totalWords: this.searchIndex.size
			},
			wordIndex
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

const generator = new SearchIndexGenerator();
generator.generate().catch(error => {
	console.error('❌ Failed to generate search index:', error);
	process.exit(1);
});
