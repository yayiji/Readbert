<script>
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { searchIndex, highlightText } from "$lib/searchIndex.js";

  // State variables
  let searchQuery = $state("");
  let searchResults = $state([]);
  let isSearching = $state(false);
  let isIndexLoading = $state(false);
  let indexLoaded = $state(false);
  let searchInput;
  let searchStats = $state({
    totalComics: 0,
    totalWords: 0,
    cache: { hasCachedData: false },
  });
  let isRefreshing = $state(false);

  // Initialize the search index and handle URL parameters
  onMount(async () => {
    // Start loading the search index
    isIndexLoading = true;
    try {
      await searchIndex.load();
      indexLoaded = true;
      searchStats = searchIndex.getStats();

      // Check for search query in URL
      const urlQuery = $page.url.searchParams.get("q");
      if (urlQuery) {
        searchQuery = urlQuery;
        await performSearch(urlQuery);
      }
    } catch (error) {
      console.error("Failed to load search index:", error);
      indexLoaded = false;
    } finally {
      isIndexLoading = false;
    }

    // Focus the search input
    if (searchInput) {
      searchInput.focus();
    }
  });

  /**
   * Perform search using the search index
   */
  async function performSearch(query) {
    if (!query.trim()) {
      searchResults = [];
      return;
    }

    if (!indexLoaded) {
      console.warn("Search index not loaded yet");
      return;
    }

    isSearching = true;

    try {
      // Use the search index to find matching comics
      const results = searchIndex.search(query, 20);
      searchResults = results;
    } catch (error) {
      console.error("Search error:", error);
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }

  /**
   * Handle search form submission
   */
  function handleSearchSubmit(event) {
    event.preventDefault();
    if (searchQuery.trim() && indexLoaded) {
      performSearch(searchQuery);
    }
  }

  /**
   * Navigate to a specific comic
   */
  function goToComic(date) {
    goto(`/?date=${date}`);
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Get the comic image URL
   */
  function getComicImageUrl(date) {
    const year = date.split("-")[0];
    return `/dilbert-comics/${year}/${date}.gif`;
  }

  /**
   * Force refresh the search index
   */
  async function refreshIndex() {
    if (isRefreshing) return;

    isRefreshing = true;
    try {
      await searchIndex.forceRefresh();
      searchStats = searchIndex.getStats();
      console.log("Search index refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh search index:", error);
    } finally {
      isRefreshing = false;
    }
  }

  /**
   * Format cache date for display
   */
  function formatCacheDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<svelte:head>
  <title>Search Dilbert Comics</title>
  <meta
    name="description"
    content="Search through the complete Dilbert comics collection"
  />
</svelte:head>

<div class="search-page">
  <div class="search-header">
    <h1 class="page-title">Search Dilbert Comics</h1>
    {#if isIndexLoading}
      <p class="page-subtitle">Loading search index...</p>
    {:else if indexLoaded}
      <p class="page-subtitle">
        Search through {searchStats.totalComics.toLocaleString()} comics by dialogue
        and text
        {#if searchStats.cache.hasCachedData}
          <br /><small class="cache-info">
            💾 Cached locally • Last updated: {formatCacheDate(
              searchStats.cache.cachedAt
            )}
            <button
              class="refresh-btn"
              onclick={refreshIndex}
              disabled={isRefreshing}
            >
              {isRefreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
            </button>
          </small>
        {/if}
      </p>
    {:else}
      <p class="page-subtitle error">
        Search index unavailable. Please run: <code
          >npm run generate-search-index</code
        >
      </p>
    {/if}
  </div>

  <form class="search-form" onsubmit={handleSearchSubmit}>
    <div class="search-input-container">
      <input
        bind:this={searchInput}
        type="text"
        placeholder={indexLoaded
          ? "Search for text in comics..."
          : "Loading search index..."}
        class="search-input"
        value={searchQuery}
        oninput={(e) => (searchQuery = e.target.value)}
        disabled={!indexLoaded}
      />
      <button
        type="submit"
        class="search-submit-btn"
        disabled={isSearching || !indexLoaded || !searchQuery.trim()}
      >
        {#if isSearching}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="spinner"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Searching...
        {:else}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Search
        {/if}
      </button>
    </div>
  </form>

  {#if isIndexLoading}
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Building search index... This may take a moment.</p>
    </div>
  {:else if isSearching}
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Searching comics...</p>
    </div>
  {:else if searchQuery && searchResults.length === 0 && indexLoaded}
    <div class="no-results">
      <p>No comics found for "{searchQuery}"</p>
      <p class="no-results-help">
        Try different keywords or check your spelling.
        <br />
        <small
          >Searching through {searchStats.totalComics.toLocaleString()} comics from
          1989-2023</small
        >
      </p>
    </div>
  {:else if searchResults.length > 0}
    <div class="search-results">
      <div class="results-header">
        <p class="results-count">
          Found {searchResults.length} comic{searchResults.length !== 1
            ? "s"
            : ""}
          matching "{searchQuery}"
        </p>
      </div>

      <div class="results-grid">
        {#each searchResults as result}
          <div class="result-card">
            <div class="comic-header">
              <span class="date-text">
                {formatDate(result.date)}
              </span>
            </div>
            <div class="comic-container">
              <img
                src={getComicImageUrl(result.date)}
                alt={`Dilbert comic from ${formatDate(result.date)}`}
                loading="lazy"
                class="comic-image"
              />
            </div>
            <div class="transcript-container">
              <div class="transcript-content">
                {#each result.comic.panels as panel, panelIndex}
                  <div class="panel">
                    {#each panel.dialogue as dialogue, dialogueIndex}
                      {@const hasMatch = result.matches.some(
                        (m) =>
                          m.panelIndex === panelIndex &&
                          m.dialogueIndex === dialogueIndex
                      )}
                      <div class="dialogue-line">
                        {#if hasMatch}
                          {@html highlightText(dialogue, searchQuery)}
                        {:else}
                          {dialogue}
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #f5f4f0;
    margin: 0;
    padding: 0;
  }

  .search-page {
    --main-color: #333;
    --accent-color: #6d5f4d;
    --border-color: #8b7d6b;
    --bg-light: #f8f6f0;
    --bg-white: #fff;
    --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --font-serif: "Times New Roman", Times, serif;
    --font-mono: "Courier New", "Courier", monospace;

    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: var(--font-serif);
    background-color: #f5f4f0;
    min-height: 100vh;
  }

  .search-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--main-color);
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: var(--font-serif);
  }

  .page-subtitle {
    font-size: 1.1rem;
    color: var(--main-color, #333);
    margin: 0;
  }

  .cache-info {
    color: var(--border-color, #8b7d6b);
    font-size: 0.9rem;
    display: block;
    margin-top: 0.5rem;
  }

  .refresh-btn {
    background: none;
    border: 1px solid var(--border-color, #8b7d6b);
    color: var(--border-color, #8b7d6b);
    padding: 0.2rem 0.5rem;
    margin-left: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--border-color, #8b7d6b);
    color: var(--bg-white, #fff);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error {
    color: #d32f2f;
  }

  .error code {
    background: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: "Monaco", "Consolas", monospace;
    font-size: 0.9em;
  }

  /* Search Form */
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

  .search-input:disabled {
    background: var(--bg-light, #f8f6f0);
    color: var(--border-color, #8b7d6b);
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
    gap: 0.5rem;
    white-space: nowrap;
    min-width: 120px;
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
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Loading States */
  .loading {
    text-align: center;
    padding: 3rem 2rem;
    color: var(--border-color, #8b7d6b);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--bg-light, #f8f6f0);
    border-top: 3px solid var(--accent-color, #6d5f4d);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  /* No Results */
  .no-results {
    text-align: center;
    padding: 3rem 2rem;
  }

  .no-results p {
    color: var(--main-color, #333);
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
  }

  .no-results-help {
    color: var(--border-color, #8b7d6b);
    font-size: 0.9rem;
  }

  /* Search Results */
  .search-results {
    margin-top: 2rem;
  }

  .results-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .results-count {
    color: var(--accent-color, #6d5f4d);
    font-weight: bold;
    margin: 0;
    font-size: 1.1rem;
  }

  .results-grid {
    column-count: 2;
    column-gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .result-card {
    background: var(--bg-white, #fff);
    text-align: center;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
    break-inside: avoid;
    margin-bottom: 1.5rem;
    display: inline-block;
    width: 100%;
    box-sizing: border-box;
  }

  /* Comic Header */
  .comic-header {
    margin-bottom: 0.5rem;
  }

  .date-text {
    color: var(--main-color, #333);
    font-size: 0.9rem;
    font-weight: bold;
    font-family: "Courier New", monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* Comic Container - matching main page */
  .comic-container {
    display: inline-block;
    background-color: var(--bg-white, #fff);
    padding: 10px;
    border: 1px solid #d4c5a9;
    margin-bottom: 1rem;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    border: 1px solid #ccc;
  }

  /* Transcript Container - matching main page */
  .transcript-container {
    margin: 0 auto;
    max-width: 550px;
    width: 100%;
    box-sizing: border-box;
  }

  .transcript-content {
    background-color: var(--bg-white, #fff);
    font-family: "Courier New", monospace;
    padding: 0px 20px;
    text-align: left;
    border-radius: 0.25rem;
  }

  .panel {
    margin-bottom: 1rem;
  }

  .dialogue-line {
    margin: 3px 0;
    font-size: 14px;
    color: var(--main-color, #333);
    word-wrap: break-word;
    line-height: 1.4;
  }

  .dialogue-line:last-child {
    margin-bottom: 0;
  }

  .dialogue-line:first-child {
    margin-top: 0;
  }

  /* Text highlighting */
  :global(.dialogue-line mark) {
    background: #ffeb3b;
    color: #000;
    padding: 0.1em 0.2em;
    border-radius: 0.2em;
    font-weight: bold;
  }

  /* Responsive design */
  @media (max-width: 1024px) {
    .results-grid {
      column-count: 2;
    }
  }

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
      min-width: 100px;
    }

    .results-grid {
      column-count: 1;
      column-gap: 0;
    }

    .result-card {
      margin-bottom: 1.5rem;
    }

    .comic-container {
      padding: 10px;
    }

    .transcript-container {
      max-width: calc(100% - 20px);
    }

    .dialogue-line {
      font-size: 13px;
      margin: 2px 0;
    }
  }

  @media (max-width: 480px) {
    .search-input-container {
      flex-direction: column;
    }

    .search-submit-btn {
      border-radius: 0;
    }
  }
</style>
