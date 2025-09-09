<script>
  import { searchIndex, highlightText } from "$lib/searchIndex.js";

  // Props
  let { 
    isOpen = $bindable(false),
    selectedDate = $bindable("")
  } = $props();

  // State variables
  let searchQuery = $state("");
  let searchResults = $state([]);
  let selectedIndex = $state(0);
  let isSearching = $state(false);
  let indexLoaded = $state(false);
  let searchInput = $state();
  let resultsContainer = $state();
  let searchTimeout;

  // Derived state
  let hasResults = $derived(searchResults.length > 0);
  let hasQuery = $derived(searchQuery.trim().length > 0);
  let showNoResults = $derived(hasQuery && !hasResults && !isSearching);
  let showEmptyState = $derived(!hasQuery);

  // Grid calculation utilities
  function calculateGridDimensions() {
    const containerWidth = resultsContainer?.offsetWidth || 900;
    const itemMinWidth = 350;
    const padding = 32;
    const gap = 16;
    const availableWidth = containerWidth - padding;
    return Math.max(1, Math.floor((availableWidth + gap) / (itemMinWidth + gap)));
  }

  // Keyboard handlers
  function handleKeydown(event) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      isOpen = !isOpen;
      if (isOpen) {
        setTimeout(() => searchInput?.focus(), 10);
      }
    }

    if (event.key === "Escape") {
      closeModal();
    }
  }

  function handleResultsKeydown(event) {
    if (!isOpen || !hasResults) return;

    const columnsPerRow = calculateGridDimensions();
    
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        const nextRowIndex = selectedIndex + columnsPerRow;
        if (nextRowIndex < searchResults.length) {
          selectedIndex = nextRowIndex;
          scrollToSelected();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        const prevRowIndex = selectedIndex - columnsPerRow;
        if (prevRowIndex >= 0) {
          selectedIndex = prevRowIndex;
          scrollToSelected();
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        if (selectedIndex < searchResults.length - 1) {
          selectedIndex++;
          scrollToSelected();
        }
        break;
      case "ArrowLeft":
        event.preventDefault();
        if (selectedIndex > 0) {
          selectedIndex--;
          scrollToSelected();
        }
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
      selectedElement?.scrollIntoView({ 
        block: "nearest", 
        inline: "nearest",
        behavior: "smooth"
      });
    }, 0);
  }

  // Modal control
  function closeModal() {
    isOpen = false;
    searchQuery = "";
    searchResults = [];
    selectedIndex = 0;
  }

  function selectResult(result) {
    selectedDate = result.date;
    closeModal();
  }

  // Utility functions
  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getComicImageUrl(date) {
    const year = date.split("-")[0];
    return `/dilbert-comics/${year}/${date}.gif`;
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  // Perform search with debouncing
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
          await searchIndex.load();
          indexLoaded = true;
        }

        // Use the search index to find matching comics
        searchResults = searchIndex.search(query, 10); // Limit to 10 results for performance
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

  // Setup keyboard listeners and preload search index using effects
  // Setup and cleanup effect
  $effect(() => {
    document.addEventListener("keydown", handleKeydown);
    
    // Preload the search index in the background
    searchIndex.load().then(() => {
      indexLoaded = true;
    }).catch(error => {
      console.error("Failed to preload search index:", error);
    });
    
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      clearTimeout(searchTimeout);
    };
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
        {#if showNoResults}
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
        {:else if hasResults}
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
                <div class="result-content">
                  <div class="result-date">{formatDate(result.date)}</div>
                </div>
                <div class="result-preview">
                  <div class="comic-container">
                    <img
                      src={getComicImageUrl(result.date)}
                      alt={`Dilbert comic from ${formatDate(result.date)}`}
                      class="comic-image"
                      loading="lazy"
                    />
                  </div>
                </div>
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
              </button>
            {/each}
          </div>
        {:else if showEmptyState}
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
            <kbd>↑</kbd><kbd>↓</kbd> rows
          </span>
          <span class="shortcut">
            <kbd>←</kbd><kbd>→</kbd> columns
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
    /* background: rgba(0, 0, 0, 0.1); */
    z-index: 1000;
    animation: backdrop-fade-in 0.15s ease-out;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
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
    background: rgba(248, 246, 240, 0.7);
    border-radius: 12px;
    /* border-radius: 0px; */
    border: 1px solid rgba(139, 125, 107, 0.3);
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    max-width: 800px;
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
    padding: 4px 8px;
    border-bottom: 1px solid rgba(139, 125, 107, 0.3);
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    height: 48px;
    padding: 0 48px 0 12px;
    border: none;
    outline: none;
    font-size: 16px;
    background: transparent;
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
    width: 100%;
    box-sizing: border-box;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0;
    border: 2px solid transparent;
    /* background: #f9fafb; */
    background: white;
    /* background: rgba(248, 246, 240, 0.5); */
    text-align: left;
    width: 100%;
    font-family: inherit;
    font-size: inherit;
    height: auto;
    min-height: 180px;
    box-sizing: border-box;
  }

  .result-item:hover,
  .result-item.selected {
    background: white;
    border-color: #667eea;
    border: 2px solid #667eea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .result-preview {
    flex-shrink: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  /* Comic Container - matching search page */
  .comic-container {
    display: inline-block;
    background-color: #fff;
    padding: 10px;
    border: 1px solid #d4c5a9;
    margin-bottom: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    border: 1px solid #ccc;
  }

  .result-content {
    flex-shrink: 0;
    min-width: 0;
    text-align: center;
    margin-bottom: 4px;
  }

  .result-date {
    font-weight: 600;
    color: #374151;
    font-size: 12px;
    margin-bottom: 0;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
  }

  .result-text {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.5;
    word-break: break-word;
    text-align: left;
    background: transparent;
    padding: 12px 8px 8px 8px;
    border-radius: 4px;
    max-height: 100px;
    overflow-y: auto;
    flex: 1;
  }

  .dialogue-excerpt {
    font-family: "Courier New", monospace;
  }

  :global(.result-text mark) {
    background: #fbbf24;
    color: #000000;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: bold;
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
    display: none;
    padding: 9px 16px;
    border-top: 1px solid #e5e7eb;
    /* background: var(--bg-light); */
    background: #F8F7F5;
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

    .shortcuts {
      flex-wrap: wrap;
      gap: 8px;
    }
  }
</style>
