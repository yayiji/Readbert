<script>
  import { searchIndex } from "$lib/searchIndex.js";
  import { Comic } from "$lib/Comic.js";
  import HistoryBookmarksPanel from "./HistoryBookmarksPanel.svelte";
  import SearchResultItem from "./SearchResultItem.svelte";
  import SearchInput from "./SearchInput.svelte";

  let { isOpen = $bindable(false), selectedDate = $bindable("") } = $props();

  let searchQuery = $state("");
  let searchResults = $state([]);
  let selectedIndex = $state(0);
  let isSearching = $state(false);
  let indexLoaded = $state(false);
  let searchInput = $state();
  let resultsContainer = $state();
  let historyPanel = $state();
  let searchTimeout;

  const hasQuery = $derived(searchQuery.trim().length > 0);
  const queryTooShort = $derived(hasQuery && searchQuery.trim().length < 3);
  const hasResults = $derived(searchResults.length > 0);
  const showHistoryView = $derived(!hasQuery);
  const showTooShortMessage = $derived(queryTooShort);
  const showNoResults = $derived(hasQuery && !hasResults && !isSearching && !queryTooShort);

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

  function closeModal() {
    isOpen = false;
    searchQuery = "";
    searchResults = [];
    selectedIndex = 0;
  }

  function selectDateAndClose(date) {
    selectedDate = date;
    closeModal();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeModal();
  }

  function getColumnsPerRow() {
    const containerWidth = resultsContainer?.offsetWidth || 900;
    const itemMinWidth = 350;
    const gap = 16;
    const padding = 32;
    return Math.max(1, Math.floor((containerWidth - padding + gap) / (itemMinWidth + gap)));
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
        resultsContainer
          ?.querySelector(`[data-index="${selectedIndex}"]`)
          ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 0);
  }

  function isCommandK(event) {
    return event.metaKey && event.key.toLowerCase() === "k";
  }

  function moveSelection(delta) {
    const nextIndex = selectedIndex + delta;
    if (nextIndex < 0 || nextIndex >= searchResults.length) return;
    selectedIndex = nextIndex;
    scrollToSelected();
  }

  function handleGlobalKeydown(event) {
    if (isCommandK(event)) {
      event.preventDefault();
      event.stopPropagation();
      isOpen = !isOpen;
      if (isOpen) setTimeout(() => searchInput?.focus(), 10);
      return;
    }

    if (!isOpen) return;

    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  }

  function handleResultsKeydown(event) {
    if (!isOpen) return;

    event.stopPropagation();

    if (isCommandK(event) || event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (!hasResults) return;

    const columnsPerRow = getColumnsPerRow();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveSelection(columnsPerRow);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveSelection(-columnsPerRow);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveSelection(1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveSelection(-1);
        break;
      case "Enter":
        event.preventDefault();
        if (searchResults[selectedIndex]) {
          selectDateAndClose(searchResults[selectedIndex].date);
        }
        break;
    }
  }

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
      .catch((error) => console.error("Failed to preload search index:", error));

    return () => {
      document.removeEventListener("keydown", handleGlobalKeydown);
      clearTimeout(searchTimeout);
    };
  });
</script>

{#snippet statusMessage(title, subtitle)}
  <div class="message">
    <div class="message-title">{title}</div>
    <div class="message-subtitle">{subtitle}</div>
  </div>
{/snippet}

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
          {@render statusMessage(
            "No Comics Found",
            indexLoaded ? "Try different keywords or phrases" : "Search index is still loading...",
          )}
        {:else if hasResults}
          <div class="results-grid">
            {#each searchResults as result, index}
              <SearchResultItem
                {result}
                {index}
                {searchQuery}
                isSelected={index === selectedIndex}
                onSelect={(item) => selectDateAndClose(item.date)}
                onKeydown={handleResultsKeydown}
              />
            {/each}
          </div>
        {:else if showTooShortMessage}
          {@render statusMessage("Keep Typing...", "Type at least 3 characters to search")}
        {:else if showHistoryView}
          <HistoryBookmarksPanel
            bind:this={historyPanel}
            onSelectDate={selectDateAndClose}
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
    background: var(--color-overlay);
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
    animation: fade-in 0.15s ease-out;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .palette {
    background: var(--color-glass);
    border-radius: 18px;
    border: 3px solid var(--color-border-medium);
    box-shadow: 0 0px 25px var(--color-shadow);
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
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }

  .message-subtitle {
    font-size: 1rem;
    color: var(--color-muted);
  }

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
