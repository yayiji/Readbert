/**
 * Script to generate the transcript index
 *
 * This script creates the transcript index file:
 * - static/dilbert-index/transcript-index.min.json - Complete transcript index for instant access
 *
 * Usage:
 * npm run generate-transcript-index
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TranscriptIndexGenerator {
	constructor() {
		this.transcripts = new Map(); // date -> transcript data
		this.transcriptsPath = path.join(__dirname, '../static/dilbert-transcripts');
		this.outputPath = path.join(__dirname, '../static/dilbert-index/transcript-index.json');
	}

	/**
	 * Main entry point: Generate transcript index
	 */
	async generate() {
		console.log('🚀 Generating transcript index...\n');
		const startTime = Date.now();

		// Step 1: Load all transcripts
		await this._loadAllTranscripts();

		// Step 2: Generate and save index
		await this._saveIndex();

		const duration = Date.now() - startTime;
		console.log(`✅ Transcript index generated successfully in ${duration}ms\n`);
	}

	/**
	 * Load all transcripts from disk
	 */
	async _loadAllTranscripts() {
		console.log('📂 Loading transcripts...');
		const startTime = Date.now();

		// Years from 1989 to 2023
		const years = Array.from({ length: 2023 - 1989 + 1 }, (_, i) => 1989 + i);

		let totalLoaded = 0;

		for (const year of years) {
			try {
				const comics = await this._loadYear(year);
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

	/**
	 * Generate and save the index
	 */
	async _saveIndex() {
		console.log('💾 Saving transcript index...');
		const startTime = Date.now();

		const index = {
			version: '1.0',
			generatedAt: new Date().toISOString(),
			stats: {
				totalTranscripts: this.transcripts.size,
			},
			transcripts: {}
		};

		// Convert Map to object
		for (const [date, transcript] of this.transcripts) {
			index.transcripts[date] = transcript;
		}

		// Ensure output directory exists
		const outputDir = path.dirname(this.outputPath);
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		// Save formatted version
		const json = JSON.stringify(index, null, 2);
		fs.writeFileSync(this.outputPath, json, 'utf8');

		// Save minified version
		const compressedJson = JSON.stringify(index);
		const compressedPath = this.outputPath.replace('.json', '.min.json');
		fs.writeFileSync(compressedPath, compressedJson, 'utf8');

		// Log file sizes
		const originalSize = (fs.statSync(this.outputPath).size / 1024 / 1024).toFixed(2);
		const compressedSize = (fs.statSync(compressedPath).size / 1024 / 1024).toFixed(2);

		console.log(`   📁 Formatted: ${originalSize} MB`);
		console.log(`   📁 Minified: ${compressedSize} MB`);

		const duration = Date.now() - startTime;
		console.log(`   ✅ Saved in ${duration}ms\n`);
	}

	/**
	 * Load all comics for a specific year
	 */
	async _loadYear(year) {
		const comics = [];
		const yearPath = path.join(this.transcriptsPath, year.toString());

		const files = fs.readdirSync(yearPath);
		const jsonFiles = files.filter(file => file.endsWith('.json'));

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
}

// Run the generator
const generator = new TranscriptIndexGenerator();
generator.generate().catch(error => {
	console.error('❌ Failed to generate transcript index:', error);
	process.exit(1);
});
