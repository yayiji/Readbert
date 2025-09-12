/**
 * Script to pregenerate the search index and transcript database
 * 
 * This script creates two optimized files:
 * 1. search-index.min.json - Word-to-date mappings for search functionality
 * 2. transcript-database.min.json - Complete transcript database for instant access
 * 
 * Run this script whenever transcripts are updated:
 * npm run generate-search-index
 * OR
 * npm run generate-databases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SearchIndexGenerator {
	constructor() {
		this.index = new Map(); // word -> Set of comic dates
		this.comics = new Map(); // date -> comic data
		this.transcripts = new Map(); // date -> transcript data (full transcript objects)
		this.transcriptsPath = path.join(__dirname, '../static/dilbert-transcripts');
		this.searchIndexOutputPath = path.join(__dirname, '../static/search-index.json');
		this.transcriptDbOutputPath = path.join(__dirname, '../static/transcript-database.json');
	}

	/**
	 * Generate the complete search index and transcript database
	 */
	async generate() {
		console.log('🔍 Generating search index and transcript database...');
		const startTime = Date.now();

		// Years from 1989 to 2023
		const years = Array.from({ length: 2023 - 1989 + 1 }, (_, i) => 1989 + i);
		
		let totalComics = 0;
		let loadedComics = 0;

		for (const year of years) {
			console.log(`📅 Processing year ${year}...`);
			try {
				const comics = await this._loadYear(year);
				for (const comic of comics) {
					this._indexComic(comic);
					this.transcripts.set(comic.date, comic); // Store full transcript data
					loadedComics++;
				}
				totalComics += comics.length;
				console.log(`   ✅ Loaded ${comics.length} comics for ${year}`);
			} catch (error) {
				console.warn(`   ⚠️ Failed to load comics for year ${year}:`, error.message);
			}
		}

		// Convert Maps to serializable format and save both files
		const serializedSearchIndex = this._serializeSearchIndex();
		const serializedTranscriptDb = this._serializeTranscriptDatabase();
		
		// Save both files
		await this._saveSearchIndex(serializedSearchIndex);
		await this._saveTranscriptDatabase(serializedTranscriptDb);

		const duration = Date.now() - startTime;
		console.log(`🎉 Search index and transcript database generated successfully!`);
		console.log(`   📊 ${loadedComics}/${totalComics} comics indexed`);
		console.log(`   🔤 ${this.index.size} unique words indexed`);
		console.log(`   📄 ${this.transcripts.size} transcripts stored`);
		console.log(`   ⏱️ Generated in ${duration}ms`);
		console.log(`   💾 Search index saved to: ${this.searchIndexOutputPath}`);
		console.log(`   💾 Transcript database saved to: ${this.transcriptDbOutputPath}`);
	}

	/**
	 * Load all comics for a specific year
	 */
	async _loadYear(year) {
		const comics = [];
		const yearPath = path.join(this.transcriptsPath, year.toString());
		
		try {
			const files = fs.readdirSync(yearPath);
			const jsonFiles = files.filter(file => file.endsWith('.json'));
			
			for (const file of jsonFiles) {
				const filePath = path.join(yearPath, file);
				try {
					const content = fs.readFileSync(filePath, 'utf8');
					const comic = JSON.parse(content);
					comics.push(comic);
				} catch (error) {
					console.warn(`     ⚠️ Failed to load ${file}:`, error.message);
				}
			}
		} catch (error) {
			console.warn(`   ⚠️ Failed to read directory ${yearPath}:`, error.message);
		}
		
		return comics;
	}

	/**
	 * Add a comic to the search index
	 */
	_indexComic(comic) {
		this.comics.set(comic.date, comic);
		
		// Extract all text from the comic
		const allText = [];
		for (const panel of comic.panels) {
			for (const dialogue of panel.dialogue) {
				allText.push(dialogue);
			}
		}
		
		// Index all words
		const text = allText.join(' ').toLowerCase();
		const words = this._extractWords(text);
		
		for (const word of words) {
			if (!this.index.has(word)) {
				this.index.set(word, new Set());
			}
			this.index.get(word).add(comic.date);
		}
	}

	/**
	 * Extract searchable words from text
	 */
	_extractWords(text) {
		// Remove punctuation and split into words
		return text
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(word => word.length > 2) // Skip very short words
			.map(word => word.toLowerCase());
	}

	/**
	 * Convert Maps and Sets to serializable format for search index
	 */
	_serializeSearchIndex() {
		const serializedIndex = {
			version: '2.0', // Updated version to indicate new format
			generatedAt: new Date().toISOString(),
			stats: {
				totalComics: this.comics.size,
				totalWords: this.index.size
			},
			// Convert word index: Map<word, Set<dates>> -> Object<word, Array<dates>>
			wordIndex: {}
			// Note: comics are no longer included here, they're in the transcript database
		};

		// Serialize word index
		for (const [word, dates] of this.index) {
			serializedIndex.wordIndex[word] = Array.from(dates);
		}

		return serializedIndex;
	}

	/**
	 * Convert transcript Map to serializable format for transcript database
	 */
	_serializeTranscriptDatabase() {
		const serializedDatabase = {
			version: '1.0',
			generatedAt: new Date().toISOString(),
			stats: {
				totalTranscripts: this.transcripts.size,
			},
			// Convert transcripts: Map<date, transcript> -> Object<date, transcript>
			transcripts: {}
		};

		// Serialize transcripts
		for (const [date, transcript] of this.transcripts) {
			serializedDatabase.transcripts[date] = transcript;
		}

		return serializedDatabase;
	}

	/**
	 * Save the serialized search index to a JSON file
	 */
	async _saveSearchIndex(serializedIndex) {
		const json = JSON.stringify(serializedIndex, null, 2);
		fs.writeFileSync(this.searchIndexOutputPath, json, 'utf8');
		
		// Also create a compressed version
		const compressedJson = JSON.stringify(serializedIndex);
		const compressedPath = this.searchIndexOutputPath.replace('.json', '.min.json');
		fs.writeFileSync(compressedPath, compressedJson, 'utf8');
		
		// Log file sizes
		const originalSize = (fs.statSync(this.searchIndexOutputPath).size / 1024 / 1024).toFixed(2);
		const compressedSize = (fs.statSync(compressedPath).size / 1024 / 1024).toFixed(2);
		
		console.log(`   📁 Search index file: ${originalSize} MB (formatted)`);
		console.log(`   📁 Search index compressed: ${compressedSize} MB (minified)`);
	}

	/**
	 * Save the serialized transcript database to a JSON file
	 */
	async _saveTranscriptDatabase(serializedDatabase) {
		const json = JSON.stringify(serializedDatabase, null, 2);
		fs.writeFileSync(this.transcriptDbOutputPath, json, 'utf8');
		
		// Also create a compressed version
		const compressedJson = JSON.stringify(serializedDatabase);
		const compressedPath = this.transcriptDbOutputPath.replace('.json', '.min.json');
		fs.writeFileSync(compressedPath, compressedJson, 'utf8');
		
		// Log file sizes
		const originalSize = (fs.statSync(this.transcriptDbOutputPath).size / 1024 / 1024).toFixed(2);
		const compressedSize = (fs.statSync(compressedPath).size / 1024 / 1024).toFixed(2);
		
		console.log(`   📁 Transcript database file: ${originalSize} MB (formatted)`);
		console.log(`   📁 Transcript database compressed: ${compressedSize} MB (minified)`);
	}
}

// Run the generator
const generator = new SearchIndexGenerator();
generator.generate().catch(error => {
	console.error('❌ Failed to generate search index:', error);
	process.exit(1);
});
