<script>
  import { searchIndex } from "$lib/searchIndex.js";
  import { Comic } from "$lib/Comic.js";
  import HistoryBookmarksPanel from "./HistoryBookmarksPanel.svelte";
  import SearchResultItem from "./SearchResultItem.svelte";
  import SearchInput from "./SearchInput.svelte";

  // Props
  let { isOpen = $bindable(false), selectedDate = $bindable("") } = $props();

  // State
  let searchQuery = $state("");
  let searchResults = $state([]);
  let selectedIndex = $state(0);
  let isSearching = $state(false);
  let indexLoaded = $state(false);
  let searchInput = $state();
  let resultsContainer = $state();
  let historyPanel = $state();
  let searchTimeout;

  // Derived state
  const hasQuery = $derived(searchQuery.trim().length > 0);
  const queryTooShort = $derived(hasQuery && searchQuery.trim().length < 3);
  const hasResults = $derived(searchResults.length > 0);

  const showHistoryView = $derived(!hasQuery);
  const showTooShortMessage = $derived(queryTooShort);
  const showNoResults = $derived(
    hasQuery && !hasResults && !isSearching && !queryTooShort,
  );

  // Search
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
          comicEntity: Comic.fromDate(result.date),
        }));
      } catch (error) {
        console.error("Search error:", error);
        searchResults = [];
      } finally {
        isSearching = false;
      }
    }, 150);
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

  function handleHistorySelect(date) {
    selectedDate = date;
    closeModal();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeModal();
  }

  // Grid navigation
  function getColumnsPerRow() {
    const containerWidth = resultsContainer?.offsetWidth || 900;
    const itemMinWidth = 350;
    const gap = 16;
    const padding = 32;
    return Math.max(
      1,
      Math.floor((containerWidth - padding + gap) / (itemMinWidth + gap)),
    );
  }

  function scrollToSelected() {
    setTimeout(() => {
      const columnsPerRow = getColumnsPerRow();
      const currentRow = Math.floor(selectedIndex / columnsPerRow);
      const totalRows = Math.ceil(searchResults.length / columnsPerRow);

      if (currentRow === 0) {
        resultsContainer?.scrollTo({ top: 0, behavior: "smooth" });
      } else if (currentRow === totalRows - 1) {
        resultsContainer?.scrollTo({
          top: resultsContainer.scrollHeight,
          behavior: "smooth",
        });
      } else {
        const element = resultsContainer?.querySelector(
          `[data-index="${selectedIndex}"]`,
        );
        element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 0);
  }

  // Keyboard navigation
  function handleGlobalKeydown(event) {
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      isOpen = !isOpen;
      if (isOpen) setTimeout(() => searchInput?.focus(), 10);
    }
    if (event.key === "Escape") closeModal();
  }

  function handleResultsKeydown(event) {
    // Close on Cmd+K
    if (event.metaKey && event.key === "k") {
      event.preventDefault();
      closeModal();
      return;
    }

    // Only handle arrow keys when we have results
    if (!isOpen || !hasResults) return;

    const columnsPerRow = getColumnsPerRow();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (selectedIndex + columnsPerRow < searchResults.length) {
          selectedIndex += columnsPerRow;
          scrollToSelected();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (selectedIndex - columnsPerRow >= 0) {
          selectedIndex -= columnsPerRow;
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

  // Effects
  $effect(() => {
    if (searchQuery !== undefined) performSearch(searchQuery);
  });

  $effect(() => {
    if (isOpen && searchInput) {
      setTimeout(() => searchInput.focus(), 10);
      historyPanel?.load();
    }
  });

  $effect(() => {
    document.addEventListener("keydown", handleGlobalKeydown);

    searchIndex
      .load()
      .then(() => {
        indexLoaded = true;
      })
      .catch((error) =>
        console.error("Failed to preload search index:", error),
      );

    return () => {
      document.removeEventListener("keydown", handleGlobalKeydown);
      clearTimeout(searchTimeout);
    };
  });
</script>

{#if isOpen}
  <div
    class="backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleGlobalKeydown}
    role="dialog"
    aria-modal="true"
    aria-label="Command palette search"
    tabindex="-1"
  >
    <div class="palette">
      <SearchInput
        bind:searchQuery
        {indexLoaded}
        {isSearching}
        onKeydown={handleResultsKeydown}
        bind:inputRef={searchInput}
      />

      <div class="results" bind:this={resultsContainer}>
        {#if showNoResults}
          <div class="message">
            <div class="message-title">No Comics Found</div>
            <div class="message-subtitle">
              {#if !indexLoaded}
                Search index is still loading...
              {:else}
                Try different keywords or phrases
              {/if}
            </div>
          </div>
        {:else if hasResults}
          <div class="results-grid">
            {#each searchResults as result, index}
              <SearchResultItem
                {result}
                {index}
                {searchQuery}
                isSelected={index === selectedIndex}
                onSelect={selectResult}
                onKeydown={handleResultsKeydown}
              />
            {/each}
          </div>
        {:else if showTooShortMessage}
          <div class="message">
            <div class="message-title">Keep Typing...</div>
            <div class="message-subtitle">
              Type at least 3 characters to search
            </div>
          </div>
        {:else if showHistoryView}
          <HistoryBookmarksPanel
            bind:this={historyPanel}
            onSelectDate={handleHistorySelect}
          />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.1);
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    animation: fade-in 0.15s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .palette {
    background: rgba(248, 246, 240, 0.8);
    border-radius: 18px;
    border: 3px solid rgba(139, 125, 107, 0.4);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.3),
      0 10px 10px -5px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    max-width: 800px;
    width: 90vw;
    height: 550px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slide-in 0.15s ease-out;
    font-family: var(--font-sans);
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .results {
    flex: 1;
    overflow-y: auto;
  }

  .results-grid {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 16px;
    align-items: start;
  }

  .message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 1.5rem 0;
    text-align: center;
  }

  .message-title {
    font-size: 1.6rem;
    font-weight: bold;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .message-subtitle {
    font-size: 1rem;
    color: #6b7280;
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .results-grid {
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 12px;
    }
  }

  @media (max-width: 768px) {
    .palette {
      width: 95vw;
      height: 80vh;
    }

    .results-grid {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
  }
</style>
