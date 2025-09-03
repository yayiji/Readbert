<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let searchQuery = $state('');
	let searchResults = $state([]);
	let isSearching = $state(false);
	let searchInput;

	// Get search query from URL parameters
	onMount(() => {
		const urlQuery = $page.url.searchParams.get('q');
		if (urlQuery) {
			searchQuery = urlQuery;
			performSearch(urlQuery);
		}
		
		// Focus the search input when the page loads
		if (searchInput) {
			searchInput.focus();
		}
	});

	// Watch for search query changes and update URL
	$effect(() => {
		if (searchQuery && searchResults.length > 0) {
			const url = new URL(window.location);
			url.searchParams.set('q', searchQuery);
			goto(url.toString(), { replaceState: true, noScroll: true });
		}
	});

	async function performSearch(query) {
		if (!query.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		
		try {
			// Check if the query is a date search
			const dateSearchResult = await searchByDate(query);
			if (dateSearchResult) {
				searchResults = [dateSearchResult];
				isSearching = false;
				// Restore focus after search
				setTimeout(() => {
					if (searchInput) {
						searchInput.focus();
					}
				}, 0);
				return;
			}

			// TODO: Implement text/content search functionality
			// This is a placeholder for content-based search
			await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
			
			// Mock search results for non-date searches - replace with actual search logic
			searchResults = [
				{
					date: '1989-04-16',
					title: 'First Dilbert Comic',
					snippet: 'The very first Dilbert comic strip...',
					imageUrl: '/dilbert-comics/1989/1989-04-16.gif'
				},
				{
					date: '1990-01-15',
					title: 'Office Meeting',
					snippet: 'Dilbert attends his first pointless meeting...',
					imageUrl: '/dilbert-comics/1990/1990-01-15.gif'
				}
			].filter(comic => 
				comic.title.toLowerCase().includes(query.toLowerCase()) ||
				comic.snippet.toLowerCase().includes(query.toLowerCase())
			);
		} catch (error) {
			console.error('Search error:', error);
			searchResults = [];
		} finally {
			isSearching = false;
			// Restore focus after search
			setTimeout(() => {
				if (searchInput) {
					searchInput.focus();
				}
			}, 0);
		}
	}

	async function searchByDate(query) {
		// Try to parse different date formats
		const dateFormats = [
			/^(\d{4})-(\d{1,2})-(\d{1,2})$/,  // YYYY-MM-DD or YYYY-M-D
			/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY or M/D/YYYY
			/^(\d{1,2})-(\d{1,2})-(\d{4})$/,  // MM-DD-YYYY or M-D-YYYY
			/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD or YYYY/M/D
		];

		let parsedDate = null;

		// Try YYYY-MM-DD format first (most common)
		const isoMatch = query.match(dateFormats[0]);
		if (isoMatch) {
			const year = parseInt(isoMatch[1]);
			const month = parseInt(isoMatch[2]);
			const day = parseInt(isoMatch[3]);
			parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
		}

		// Try MM/DD/YYYY format
		const usMatch = query.match(dateFormats[1]);
		if (usMatch && !parsedDate) {
			const month = parseInt(usMatch[1]);
			const day = parseInt(usMatch[2]);
			const year = parseInt(usMatch[3]);
			parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
		}

		// Try MM-DD-YYYY format
		const dashMatch = query.match(dateFormats[2]);
		if (dashMatch && !parsedDate) {
			const month = parseInt(dashMatch[1]);
			const day = parseInt(dashMatch[2]);
			const year = parseInt(dashMatch[3]);
			parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
		}

		// Try YYYY/MM/DD format
		const isoSlashMatch = query.match(dateFormats[3]);
		if (isoSlashMatch && !parsedDate) {
			const year = parseInt(isoSlashMatch[1]);
			const month = parseInt(isoSlashMatch[2]);
			const day = parseInt(isoSlashMatch[3]);
			parsedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
		}

		if (!parsedDate) {
			return null; // Not a valid date format
		}

		// Validate the date is within the comic range (1989-04-16 to 2023-03-12)
		const comicDate = new Date(parsedDate);
		const startDate = new Date('1989-04-16');
		const endDate = new Date('2023-03-12');

		if (comicDate < startDate || comicDate > endDate) {
			return null; // Date is outside the comic range
		}

		// Check if the comic file exists
		const year = comicDate.getFullYear();
		const imageUrl = `/dilbert-comics/${year}/${parsedDate}.gif`;
		
		try {
			// Try to load the image to see if it exists
			const img = new Image();
			await new Promise((resolve, reject) => {
				img.onload = resolve;
				img.onerror = reject;
				img.src = imageUrl;
			});

			// Format the date for display
			const options = { 
				weekday: 'long', 
				year: 'numeric', 
				month: 'long', 
				day: 'numeric' 
			};
			const formattedDate = comicDate.toLocaleDateString('en-US', options);

			return {
				date: parsedDate,
				title: `Dilbert Comic - ${formattedDate}`,
				snippet: `Comic strip from ${formattedDate}`,
				imageUrl: imageUrl
			};
		} catch (error) {
			// Comic doesn't exist for this date
			return null;
		}
	}

	function handleSearchSubmit(event) {
		event.preventDefault();
		if (searchQuery.trim()) {
			performSearch(searchQuery);
		}
	}

	function handleKeydown(event) {
		if (event.key === 'Enter') {
			handleSearchSubmit(event);
		}
	}

	function handleSearchInput(event) {
		searchQuery = event.target.value;
		// Remove automatic search to prevent focus loss
		// Search will only happen on form submit
	}

	function goToComic(date) {
		goto(`/?date=${date}`);
	}
</script>

<svelte:head>
	<title>Search Dilbert Comics</title>
	<meta name="description" content="Search through the complete Dilbert comics collection" />
</svelte:head>

<div class="search-page">
	<div class="search-header">
		<h1 class="page-title">Search Dilbert Comics</h1>
		<p class="page-subtitle">Find comics by date (e.g., "1990-05-20") or search content</p>
	</div>

	<form class="search-form" onsubmit={handleSearchSubmit}>
		<div class="search-input-container">
			<input
				bind:this={searchInput}
				type="text"
				placeholder="Search by date (1990-05-20, 5/20/1990) or keywords..."
				class="search-input"
				value={searchQuery}
				oninput={handleSearchInput}
				onkeydown={handleKeydown}
			/>
			<button type="submit" class="search-submit-btn" disabled={isSearching}>
				{#if isSearching}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spinner">
						<circle cx="12" cy="12" r="10"></circle>
					</svg>
				{:else}
					Search
				{/if}
			</button>
		</div>
	</form>

	<div class="search-results">
		{#if isSearching}
			<div class="loading">
				<p>Searching comics...</p>
			</div>
		{:else if searchQuery && searchResults.length === 0}
			<div class="no-results">
				<p>No comics found for "{searchQuery}"</p>
				<p class="no-results-help">
					Try different keywords or a date format like "1990-05-20" or "5/20/1990"
					<br>
					<small>Comic dates range from April 16, 1989 to March 12, 2023</small>
				</p>
			</div>
		{:else if searchResults.length > 0}
			<div class="results-header">
				<p class="results-count">{searchResults.length} comic{searchResults.length !== 1 ? 's' : ''} found</p>
			</div>
			
			<div class="results-grid">
				{#each searchResults as result}
					<button class="result-card" onclick={() => goToComic(result.date)} type="button">
						<div class="result-image">
							<img src={result.imageUrl} alt={result.title} loading="lazy" />
						</div>
						<div class="result-content">
							<h3 class="result-title">{result.title}</h3>
							<p class="result-date">{result.date}</p>
							<p class="result-snippet">{result.snippet}</p>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.search-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.search-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: bold;
		color: var(--accent-color, #6d5f4d);
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--main-color, #333);
		margin: 0;
	}

	.search-form {
		margin-bottom: 2rem;
	}

	.search-input-container {
		display: flex;
		max-width: 600px;
		margin: 0 auto;
		border: 2px solid var(--border-color, #8b7d6b);
		border-radius: 0.25rem;
		background: var(--bg-white, #fff);
		overflow: hidden;
	}

	.search-input {
		flex: 1;
		border: none;
		outline: none;
		padding: 1rem;
		font-size: 1.1rem;
		background: transparent;
		color: var(--main-color, #333);
	}

	.search-input::placeholder {
		color: var(--border-color, #8b7d6b);
	}

	.search-submit-btn {
		background: var(--accent-color, #6d5f4d);
		border: none;
		color: var(--bg-white, #fff);
		padding: 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-submit-btn:hover:not(:disabled) {
		background: var(--border-color, #8b7d6b);
	}

	.search-submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: var(--border-color, #8b7d6b);
	}

	.no-results {
		text-align: center;
		padding: 2rem;
	}

	.no-results p {
		color: var(--main-color, #333);
		margin: 0 0 0.5rem 0;
	}

	.no-results-help {
		color: var(--border-color, #8b7d6b);
		font-size: 0.9rem;
	}

	.results-header {
		margin-bottom: 1rem;
	}

	.results-count {
		color: var(--accent-color, #6d5f4d);
		font-weight: bold;
		margin: 0;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.result-card {
		background: var(--bg-white, #fff);
		border: 2px solid var(--border-color, #8b7d6b);
		border-radius: 0.25rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
		display: block;
		width: 100%;
		text-align: left;
		padding: 0;
	}

	.result-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.result-image {
		aspect-ratio: 16/9;
		overflow: hidden;
		background: var(--bg-light, #f8f6f0);
	}

	.result-image img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		background: white;
	}

	.result-content {
		padding: 1rem;
	}

	.result-title {
		font-size: 1.1rem;
		font-weight: bold;
		color: var(--main-color, #333);
		margin: 0 0 0.5rem 0;
	}

	.result-date {
		font-size: 0.9rem;
		color: var(--accent-color, #6d5f4d);
		margin: 0 0 0.5rem 0;
		font-weight: bold;
	}

	.result-snippet {
		font-size: 0.9rem;
		color: var(--border-color, #8b7d6b);
		margin: 0;
		line-height: 1.4;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.search-page {
			padding: 1rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.page-subtitle {
			font-size: 1rem;
		}

		.search-input {
			padding: 0.8rem;
			font-size: 1rem;
		}

		.search-submit-btn {
			padding: 0.8rem;
		}

		.results-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.result-content {
			padding: 0.8rem;
		}
	}
</style>
