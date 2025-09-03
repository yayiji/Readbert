/**
 * Script to pregenerate the search index and save it to a JSON file
 * Run this script whenever transcripts are updated
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
		this.transcriptsPath = path.join(__dirname, '../static/dilbert-transcripts');
		this.outputPath = path.join(__dirname, '../static/search-index.json');
	}

	/**
	 * Generate the complete search index
	 */
	async generate() {
		console.log('🔍 Generating search index...');
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
					loadedComics++;
				}
				totalComics += comics.length;
				console.log(`   ✅ Loaded ${comics.length} comics for ${year}`);
			} catch (error) {
				console.warn(`   ⚠️ Failed to load comics for year ${year}:`, error.message);
			}
		}

		// Convert Maps to serializable format
		const serializedIndex = this._serializeIndex();
		
		// Save to file
		await this._saveIndex(serializedIndex);

		const duration = Date.now() - startTime;
		console.log(`🎉 Search index generated successfully!`);
		console.log(`   📊 ${loadedComics}/${totalComics} comics indexed`);
		console.log(`   🔤 ${this.index.size} unique words indexed`);
		console.log(`   ⏱️ Generated in ${duration}ms`);
		console.log(`   💾 Saved to: ${this.outputPath}`);
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
	 * Convert Maps and Sets to serializable format
	 */
	_serializeIndex() {
		const serializedIndex = {
			version: '1.0',
			generatedAt: new Date().toISOString(),
			stats: {
				totalComics: this.comics.size,
				totalWords: this.index.size
			},
			// Convert word index: Map<word, Set<dates>> -> Object<word, Array<dates>>
			wordIndex: {},
			// Convert comics: Map<date, comic> -> Object<date, comic>
			comics: {}
		};

		// Serialize word index
		for (const [word, dates] of this.index) {
			serializedIndex.wordIndex[word] = Array.from(dates);
		}

		// Serialize comics
		for (const [date, comic] of this.comics) {
			serializedIndex.comics[date] = comic;
		}

		return serializedIndex;
	}

	/**
	 * Save the serialized index to a JSON file
	 */
	async _saveIndex(serializedIndex) {
		const json = JSON.stringify(serializedIndex, null, 2);
		fs.writeFileSync(this.outputPath, json, 'utf8');
		
		// Also create a compressed version
		const compressedJson = JSON.stringify(serializedIndex);
		const compressedPath = this.outputPath.replace('.json', '.min.json');
		fs.writeFileSync(compressedPath, compressedJson, 'utf8');
		
		// Log file sizes
		const originalSize = (fs.statSync(this.outputPath).size / 1024 / 1024).toFixed(2);
		const compressedSize = (fs.statSync(compressedPath).size / 1024 / 1024).toFixed(2);
		
		console.log(`   📁 Index file: ${originalSize} MB (formatted)`);
		console.log(`   📁 Compressed: ${compressedSize} MB (minified)`);
	}
}

// Run the generator
const generator = new SearchIndexGenerator();
generator.generate().catch(error => {
	console.error('❌ Failed to generate search index:', error);
	process.exit(1);
});
