<script>
  import { searchIndex, highlightText } from "$lib/searchIndex.js";
  import { Comic } from "$lib/Comic.js";
  import HistoryBookmarksPanel from "./HistoryBookmarksPanel.svelte";

  // ===== PROPS =====
  let { isOpen = $bindable(false), selectedDate = $bindable("") } = $props();

  // ===== STATE =====
  let searchQuery = $state("");
  let searchResults = $state([]);
  let selectedIndex = $state(0);
  let isSearching = $state(false);
  let indexLoaded = $state(false);
  let searchInput = $state();
  let resultsContainer = $state();
  let searchTimeout;
  let historyPanel = $state();

  let hasResults = $derived(searchResults.length > 0);
  let hasQuery = $derived(searchQuery.trim().length > 0);
  let queryTooShort = $derived(searchQuery.trim().length > 0 && searchQuery.trim().length < 3);
  let showNoResults = $derived(hasQuery && !hasResults && !isSearching && !queryTooShort);
  let showEmptyState = $derived(!hasQuery);
  let showHistoryView = $derived(queryTooShort || showEmptyState);

  // ===== GRID UTILITIES =====

  function calculateGridDimensions() {
    const containerWidth = resultsContainer?.offsetWidth || 900;
    const itemMinWidth = 350;
    const padding = 32;
    const gap = 16;
    const availableWidth = containerWidth - padding;
    return Math.max(1, Math.floor((availableWidth + gap) / (itemMinWidth + gap)));
  }

  function scrollToSelected() {
    setTimeout(() => {
      const columnsPerRow = calculateGridDimensions();
      const currentRow = Math.floor(selectedIndex / columnsPerRow);
      const totalRows = Math.ceil(searchResults.length / columnsPerRow);

      if (currentRow === 0) {
        resultsContainer?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (currentRow === totalRows - 1) {
        resultsContainer?.scrollTo({ top: resultsContainer.scrollHeight, behavior: "smooth" });
        return;
      }

      const selectedElement = resultsContainer?.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }, 0);
  }

  // ===== KEYBOARD HANDLERS =====

  function handleKeydown(event) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      isOpen = !isOpen;
      if (isOpen) setTimeout(() => searchInput?.focus(), 10);
    }
    if (event.key === "Escape") closeModal();
  }

  function handleResultsKeydown(event) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      closeModal();
      return;
    }

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
        if (searchResults[selectedIndex]) selectResult(searchResults[selectedIndex]);
        break;
    }
  }

  // ===== MODAL CONTROL =====

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

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeModal();
  }

  // ===== SEARCH =====

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
        if (!indexLoaded) {
          await searchIndex.load();
          indexLoaded = true;
        }

        searchResults = searchIndex.search(query, 10).map((result) => ({
          ...result,
          comicEntity: Comic.fromDate(result.date)
        }));
      } catch (error) {
        console.error("Search error:", error);
        searchResults = [];
      } finally {
        isSearching = false;
      }
    }, 150);
  }

  // ===== HISTORY & BOOKMARKS =====

  function handleHistorySelect(date) {
    selectedDate = date;
    closeModal();
  }

  // ===== UTILITIES =====

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // ===== EFFECTS =====

  $effect(() => {
    if (searchQuery !== undefined) performSearch(searchQuery);
  });

  $effect(() => {
    if (isOpen && searchInput) {
      setTimeout(() => searchInput.focus(), 10);
      if (historyPanel) {
        historyPanel.load();
      }
    }
  });

  $effect(() => {
    document.addEventListener("keydown", handleKeydown);

    searchIndex.load()
      .then(() => { indexLoaded = true; })
      .catch((error) => { console.error("Failed to preload search index:", error); });

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      clearTimeout(searchTimeout);
    };
  });
</script>

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
          {:else}
            <div class="keyboard-shortcut">
              <kbd>⌘</kbd><kbd>K</kbd>
            </div>
          {/if}
        </div>
      </div>

      <div class="results-section" bind:this={resultsContainer}>
        {#if showNoResults}
          <div class="no-results">
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
                      src={result.comicEntity?.url ?? ""}
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
                          {@html highlightText(
                            dialogue.slice(0, 120) + (dialogue.length > 120 ? "..." : ""),
                            searchQuery
                          )}
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
        {:else if showHistoryView}
          <HistoryBookmarksPanel
            bind:this={historyPanel}
            onSelectDate={handleHistorySelect}
          />
        {/if}
      </div>

      <div class="command-palette-footer">
        <div class="shortcuts">
          <span class="shortcut"><kbd>↑</kbd><kbd>↓</kbd> rows</span>
          <span class="shortcut"><kbd>←</kbd><kbd>→</kbd> columns</span>
          <span class="shortcut"><kbd>↵</kbd> to select</span>
          <span class="shortcut"><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ===== BACKDROP & PALETTE ===== */

  .command-palette-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: backdrop-fade-in 0.15s ease-out;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  }

  @keyframes backdrop-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .command-palette {
    background: rgba(248, 246, 240, 0.8);
    border-radius: 18px;
    border: 3px solid rgba(139, 125, 107, 0.4);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    max-width: 800px;
    width: 90vw;
    height: 550px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: palette-slide-in 0.15s ease-out;
  }

  @keyframes palette-slide-in {
    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  /* ===== SEARCH INPUT ===== */

  .search-section {
    padding: 4px 8px;
    border-bottom: 1px solid rgba(139, 125, 107, 0.2);
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
    font-size: 17px;
    background: transparent;
    border-radius: 8px;
    color: #111827;
  }

  .search-input::placeholder {
    color: #6b7280;
  }

  .keyboard-shortcut {
    position: absolute;
    right: 12px;
    display: flex;
    gap: 4px;
    align-items: center;
    pointer-events: none;
  }

  .keyboard-shortcut kbd {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(139, 125, 107, 0.3);
    border-radius: 8px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-family: var(--font-sans);
    color: #6b7280;
    box-shadow: 0 1px 0 rgba(139, 125, 107, 0.2);
    font-weight: 500;
    padding: 0;
    line-height: 1;
    text-align: center;
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
    to { transform: rotate(360deg); }
  }

  /* ===== RESULTS ===== */

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
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0;
    border: 3px solid transparent;
    background: rgba(255, 255, 255, 0.6);
    text-align: left;
    width: 100%;
    font-family: var(--font-sans);
    font-size: inherit;
    height: auto;
    min-height: 180px;
    box-sizing: border-box;
  }

  .result-item:hover,
  .result-item.selected {
    background: rgba(255, 255, 255, 1);
    border: 3px solid rgba(139, 125, 107, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .result-item:hover {
    border: 3px solid rgba(139, 125, 107, 0.4);
  }

  .result-preview {
    flex-shrink: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

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
    font-family: var(--font-mono);
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
    font-family: var(--font-mono);
  }

  :global(.result-text mark) {
    background: #fbbf24;
    color: #000000;
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: bold;
  }

  /* ===== NO RESULTS ===== */

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px 0px;
    text-align: center;
    font-family: var(--font-sans);
  }

  .no-results-text {
    font-size: 32px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .no-results-subtitle {
    font-size: 16px;
    color: #6b7280;
  }

  /* ===== FOOTER ===== */

  .command-palette-footer {
    display: none;
    padding: 9px 16px;
    border-top: 1px solid #e5e7eb;
    background: #f8f7f5;
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
    font-family: var(--font-sans);
    color: #374151;
    box-shadow: 0 1px 0 #d1d5db;
  }

  /* ===== RESPONSIVE ===== */

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
    }

    .keyboard-shortcut {
      display: none;
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
</style>
