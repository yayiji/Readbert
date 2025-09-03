/**
 * Search Index Builder and Manager for Dilbert Comics
 * Builds and manages a searchable index of all comic transcripts
 */

class SearchIndex {
	constructor() {
		this.index = new Map(); // word -> Set of comic dates
		this.comics = new Map(); // date -> comic data
		this.isLoaded = false;
		this.loadPromise = null;
	}

	/**
	 * Load and build the search index from all transcript files
	 */
	async load() {
		if (this.loadPromise) {
			return this.loadPromise;
		}

		this.loadPromise = this._buildIndex();
		return this.loadPromise;
	}

	async _buildIndex() {
		if (this.isLoaded) return;

		console.log('Building search index...');
		const startTime = Date.now();

		// Years from 1989 to 2023
		const years = Array.from({ length: 2023 - 1989 + 1 }, (_, i) => 1989 + i);
		
		let totalComics = 0;
		let loadedComics = 0;

		for (const year of years) {
			try {
				// Try to load comics for this year
				const comics = await this._loadYear(year);
				for (const comic of comics) {
					this._indexComic(comic);
					loadedComics++;
				}
				totalComics += comics.length;
			} catch (error) {
				console.warn(`Failed to load comics for year ${year}:`, error);
			}
		}

		this.isLoaded = true;
		const duration = Date.now() - startTime;
		console.log(`Search index built: ${loadedComics}/${totalComics} comics indexed in ${duration}ms`);
	}

	/**
	 * Load all comics for a specific year
	 */
	async _loadYear(year) {
		const comics = [];
		
		// Generate all possible dates for the year
		const dates = this._generateDatesForYear(year);
		
		// Load comics in smaller batches to avoid overwhelming the browser
		const batchSize = 20;
		for (let i = 0; i < dates.length; i += batchSize) {
			const batch = dates.slice(i, i + batchSize);
			const batchPromises = batch.map(date => this._loadComic(date));
			const batchResults = await Promise.allSettled(batchPromises);
			
			for (const result of batchResults) {
				if (result.status === 'fulfilled' && result.value) {
					comics.push(result.value);
				}
			}
			
			// Add a small delay between batches to prevent overwhelming the server
			if (i + batchSize < dates.length) {
				await new Promise(resolve => setTimeout(resolve, 50));
			}
		}
		
		return comics;
	}

	/**
	 * Generate all possible dates for a year (avoiding weekends for most years)
	 */
	_generateDatesForYear(year) {
		const dates = [];
		const startDate = year === 1989 ? new Date('1989-04-16') : new Date(`${year}-01-01`);
		const endDate = year === 2023 ? new Date('2023-03-12') : new Date(`${year}-12-31`);
		
		const currentDate = new Date(startDate);
		while (currentDate <= endDate) {
			// Most Dilbert comics are published Monday-Saturday
			const dayOfWeek = currentDate.getDay();
			if (dayOfWeek !== 0) { // Skip Sundays (0)
				const dateStr = currentDate.toISOString().split('T')[0];
				dates.push(dateStr);
			}
			currentDate.setDate(currentDate.getDate() + 1);
		}
		
		return dates;
	}

	/**
	 * Load a single comic transcript
	 */
	async _loadComic(date) {
		try {
			const year = date.split('-')[0];
			const response = await fetch(`/dilbert-transcripts/${year}/${date}.json`);
			if (!response.ok) return null;
			
			const comic = await response.json();
			return comic;
		} catch (error) {
			return null;
		}
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
	 * Search for comics containing the query text
	 */
	search(query, maxResults = 50) {
		if (!this.isLoaded) {
			throw new Error('Search index not loaded. Call load() first.');
		}

		if (!query || query.trim().length === 0) {
			return [];
		}

		const queryLower = query.toLowerCase();
		const queryWords = this._extractWords(queryLower);
		
		if (queryWords.length === 0) {
			return [];
		}

		// Find comics that contain any of the query words
		const candidateComics = new Set();
		
		for (const word of queryWords) {
			const comicsWithWord = this.index.get(word);
			if (comicsWithWord) {
				for (const date of comicsWithWord) {
					candidateComics.add(date);
				}
			}
		}

		// Score and filter results
		const results = [];
		for (const date of candidateComics) {
			const comic = this.comics.get(date);
			if (!comic) continue;

			const matches = this._findMatches(comic, queryLower);
			if (matches.length > 0) {
				results.push({
					date,
					comic,
					matches,
					score: this._scoreComic(comic, queryLower, matches)
				});
			}
		}

		// Sort by relevance score and return top results
		results.sort((a, b) => b.score - a.score);
		return results.slice(0, maxResults);
	}

	/**
	 * Find exact matches in a comic for highlighting
	 */
	_findMatches(comic, query) {
		const matches = [];
		
		for (let panelIndex = 0; panelIndex < comic.panels.length; panelIndex++) {
			const panel = comic.panels[panelIndex];
			
			for (let dialogueIndex = 0; dialogueIndex < panel.dialogue.length; dialogueIndex++) {
				const dialogue = panel.dialogue[dialogueIndex];
				const dialogueLower = dialogue.toLowerCase();
				
				// Find all occurrences of the query in this dialogue
				let startIndex = 0;
				while (true) {
					const index = dialogueLower.indexOf(query, startIndex);
					if (index === -1) break;
					
					matches.push({
						panelIndex,
						dialogueIndex,
						dialogue,
						matchStart: index,
						matchEnd: index + query.length,
						matchText: dialogue.substring(index, index + query.length)
					});
					
					startIndex = index + 1;
				}
			}
		}
		
		return matches;
	}

	/**
	 * Score a comic based on relevance to the query
	 */
	_scoreComic(comic, query, matches) {
		let score = 0;
		
		// Base score for each match
		score += matches.length * 10;
		
		// Bonus for exact phrase matches
		const exactMatches = matches.filter(match => 
			match.dialogue.toLowerCase().includes(query)
		);
		score += exactMatches.length * 20;
		
		// Bonus for matches in shorter dialogues (more specific)
		for (const match of matches) {
			const dialogueLength = match.dialogue.length;
			if (dialogueLength < 50) score += 15;
			else if (dialogueLength < 100) score += 10;
			else score += 5;
		}
		
		return score;
	}

	/**
	 * Get a comic by date
	 */
	getComic(date) {
		return this.comics.get(date);
	}

	/**
	 * Check if the index is loaded
	 */
	isIndexLoaded() {
		return this.isLoaded;
	}

	/**
	 * Get search statistics
	 */
	getStats() {
		return {
			totalComics: this.comics.size,
			totalWords: this.index.size,
			isLoaded: this.isLoaded
		};
	}
}

// Create and export a singleton instance
export const searchIndex = new SearchIndex();

// Helper function to highlight matches in text
export function highlightText(text, query) {
	if (!query || !text) return text;
	
	const queryLower = query.toLowerCase();
	const textLower = text.toLowerCase();
	
	let result = '';
	let lastIndex = 0;
	let currentIndex = 0;
	
	while (currentIndex < text.length) {
		const index = textLower.indexOf(queryLower, currentIndex);
		if (index === -1) {
			// No more matches, append the rest of the text
			result += text.substring(lastIndex);
			break;
		}
		
		// Add text before the match
		result += text.substring(lastIndex, index);
		
		// Add the highlighted match
		const match = text.substring(index, index + query.length);
		result += '<mark>' + match + '</mark>';
		
		// Update indices
		lastIndex = index + query.length;
		currentIndex = index + query.length;
	}
	
	return result;
}
