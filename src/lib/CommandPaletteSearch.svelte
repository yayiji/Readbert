<script>
  import { onMount, onDestroy } from "svelte";
  import { searchIndex, highlightText } from "$lib/searchIndex.js";
  import { goto } from "$app/navigation";

  // Props
  let { isOpen = $bindable(false) } = $props();

  // State variables
  let searchQuery = $state("");
  let searchResults = $state([]);
  let selectedIndex = $state(0);
  let isSearching = $state(false);
  let indexLoaded = $state(false);
  let searchInput = $state();
  let resultsContainer = $state();

  // Handle keyboard shortcuts
  function handleKeydown(event) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      isOpen = !isOpen;
      if (isOpen) {
        setTimeout(() => searchInput?.focus(), 10);
      }
    }

    if (event.key === "Escape") {
      isOpen = false;
      searchQuery = "";
      searchResults = [];
    }
  }

  // Handle navigation within results
  function handleResultsKeydown(event) {
    if (!isOpen || searchResults.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % searchResults.length;
        scrollToSelected();
        break;
      case "ArrowUp":
        event.preventDefault();
        selectedIndex = selectedIndex === 0 ? searchResults.length - 1 : selectedIndex - 1;
        scrollToSelected();
        break;
      case "Enter":
        event.preventDefault();
        if (searchResults[selectedIndex]) {
          selectResult(searchResults[selectedIndex]);
        }
        break;
    }
  }

  function scrollToSelected() {
    setTimeout(() => {
      const selectedElement = resultsContainer?.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }, 0);
  }

  // Perform search with debouncing
  let searchTimeout;
  async function performSearch(query) {
    clearTimeout(searchTimeout);
    
    if (!query.trim()) {
      searchResults = [];
      selectedIndex = 0;
      return;
    }

    searchTimeout = setTimeout(async () => {
      isSearching = true;
      selectedIndex = 0;

      try {
        // Ensure search index is loaded first
        if (!indexLoaded) {
          console.log("Loading search index...");
          await searchIndex.load();
          indexLoaded = true;
          console.log("Search index loaded successfully");
        }

        // Use the search index to find matching comics
        const results = searchIndex.search(query, 10); // Limit to 10 results for performance
        searchResults = results;
        console.log(`Found ${results.length} results for "${query}"`);
      } catch (error) {
        console.error("Search error:", error);
        searchResults = [];
      } finally {
        isSearching = false;
      }
    }, 150); // Debounce delay
  }

  // Handle search input changes
  $effect(() => {
    if (searchQuery !== undefined) {
      performSearch(searchQuery);
    }
  });

  // Select a result and navigate
  function selectResult(result) {
    isOpen = false;
    searchQuery = "";
    searchResults = [];
    goto(`/?date=${result.date}`);
  }

  // Format date for display
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Get the comic image URL
  function getComicImageUrl(date) {
    const year = date.split("-")[0];
    return `/dilbert-comics/${year}/${date}.gif`;
  }

  // Close on outside click
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      isOpen = false;
      searchQuery = "";
      searchResults = [];
    }
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeydown);
    
    // Preload the search index in the background
    searchIndex.load().then(() => {
      indexLoaded = true;
      console.log("Search index preloaded for command palette");
    }).catch(error => {
      console.error("Failed to preload search index:", error);
    });
    
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  });

  onDestroy(() => {
    clearTimeout(searchTimeout);
  });
</script>

<!-- Command Palette Modal -->
{#if isOpen}
  <div 
    class="command-palette-backdrop" 
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-label="Command palette search"
    tabindex="-1"
  >
    <div class="command-palette">
      <!-- Search Input -->
      <div class="search-section">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <input
            bind:this={searchInput}
            type="text"
            placeholder={indexLoaded ? "Search Dilbert comics..." : "Loading search index..."}
            class="search-input"
            bind:value={searchQuery}
            onkeydown={handleResultsKeydown}
            autocomplete="off"
            spellcheck="false"
            disabled={!indexLoaded}
          />
          {#if isSearching}
            <div class="loading-spinner"></div>
          {/if}
        </div>
      </div>

      <!-- Results Section -->
      <div class="results-section" bind:this={resultsContainer}>
        {#if searchQuery && searchResults.length === 0 && !isSearching}
          <div class="no-results">
            <div class="no-results-icon">🔍</div>
            <div class="no-results-text">No comics found</div>
            <div class="no-results-subtitle">
              {#if !indexLoaded}
                Search index is still loading...
              {:else}
                Try different keywords
              {/if}
            </div>
          </div>
        {:else if searchResults.length > 0}
          <div class="results-list">
            {#each searchResults as result, index}
              <button 
                class="result-item"
                class:selected={index === selectedIndex}
                data-index={index}
                onclick={() => selectResult(result)}
                onkeydown={handleResultsKeydown}
                role="option"
                aria-selected={index === selectedIndex}
                tabindex="0"
              >
                <div class="result-preview">
                  <img
                    src={getComicImageUrl(result.date)}
                    alt={`Dilbert comic from ${formatDate(result.date)}`}
                    class="result-thumbnail"
                    loading="lazy"
                  />
                </div>
                <div class="result-content">
                  <div class="result-date">{formatDate(result.date)}</div>
                  <div class="result-text">
                    {#each result.comic.panels as panel, panelIndex}
                      {#each panel.dialogue as dialogue, dialogueIndex}
                        {@const hasMatch = result.matches.some(
                          (m) => m.panelIndex === panelIndex && m.dialogueIndex === dialogueIndex
                        )}
                        {#if hasMatch}
                          <span class="dialogue-excerpt">
                            {@html highlightText(dialogue.slice(0, 120) + (dialogue.length > 120 ? "..." : ""), searchQuery)}
                          </span>
                          {#if panelIndex < result.comic.panels.length - 1 || dialogueIndex < panel.dialogue.length - 1}
                            <br />
                          {/if}
                        {/if}
                      {/each}
                    {/each}
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {:else if !searchQuery}
          <div class="empty-state">
            <div class="empty-state-icon">⌘K</div>
            <div class="empty-state-text">Search Dilbert Comics</div>
            <div class="empty-state-subtitle">
              {#if indexLoaded}
                Start typing to search through comics by dialogue and text
              {:else}
                Loading search index...
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <div class="command-palette-footer">
        <div class="shortcuts">
          <span class="shortcut">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
          </span>
          <span class="shortcut">
            <kbd>↵</kbd> to select
          </span>
          <span class="shortcut">
            <kbd>esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .command-palette-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    z-index: 1000;
    animation: backdrop-fade-in 0.15s ease-out;
  }

  @keyframes backdrop-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .command-palette {
    background: white;
    border-radius: 12px;
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 900px;
    width: 90vw;
    height: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: palette-slide-in 0.15s ease-out;
  }

  @keyframes palette-slide-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .search-section {
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    color: #6b7280;
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    height: 48px;
    padding: 0 48px 0 44px;
    border: none;
    outline: none;
    font-size: 16px;
    background: #f9fafb;
    border-radius: 8px;
    color: #111827;
  }

  .search-input::placeholder {
    color: #6b7280;
  }

  .loading-spinner {
    position: absolute;
    right: 12px;
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .results-section {
    flex: 1;
    overflow-y: auto;
    height: 480px;
  }

  .results-list {
    padding: 16px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 16px;
    align-items: start;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0;
    border: 2px solid transparent;
    background: #f9fafb;
    text-align: left;
    width: 100%;
    font-family: inherit;
    font-size: inherit;
    height: auto;
    min-height: 200px;
  }

  .result-item:hover,
  .result-item.selected {
    background: white;
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .result-preview {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    border-radius: 6px;
    padding: 8px;
    border: 1px solid #e5e7eb;
  }

  .result-thumbnail {
    width: 120px;
    height: auto;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
    object-fit: contain;
    max-height: 80px;
  }

  .result-content {
    flex: 1;
    min-width: 0;
    text-align: center;
  }

  .result-date {
    font-weight: 600;
    color: #374151;
    font-size: 15px;
    margin-bottom: 8px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
  }

  .result-text {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
    word-break: break-word;
    text-align: left;
    background: white;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #f3f4f6;
    max-height: 100px;
    overflow-y: auto;
  }

  .dialogue-excerpt {
    font-family: "Courier New", monospace;
  }

  :global(.result-text mark) {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 500;
  }

  .empty-state,
  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
  }

  .empty-state-icon,
  .no-results-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  .empty-state-text,
  .no-results-text {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .empty-state-subtitle,
  .no-results-subtitle {
    font-size: 14px;
    color: #6b7280;
    max-width: 300px;
  }

  .command-palette-footer {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .shortcuts {
    display: flex;
    gap: 16px;
    justify-content: center;
    font-size: 12px;
    color: #6b7280;
  }

  .shortcut {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  kbd {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 11px;
    font-family: inherit;
    color: #374151;
    box-shadow: 0 1px 0 #d1d5db;
  }

  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .results-list {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;
    }
  }

  @media (max-width: 768px) {
    .command-palette {
      width: 95vw;
      height: 80vh;
      max-height: 600px;
    }

    .results-list {
      grid-template-columns: 1fr;
      padding: 12px;
    }

    .result-item {
      min-height: 180px;
      padding: 12px;
    }

    .result-thumbnail {
      width: 100px;
      max-height: 70px;
    }
  }

  @media (max-width: 640px) {
    .command-palette {
      width: 95vw;
      margin: 0 auto;
      height: 85vh;
    }

    .search-input {
      font-size: 16px; /* Prevent zoom on iOS */
    }

    .result-item {
      padding: 8px;
      min-height: 160px;
    }

    .result-thumbnail {
      width: 80px;
      max-height: 60px;
    }

    .shortcuts {
      flex-wrap: wrap;
      gap: 8px;
    }
  }
</style>
