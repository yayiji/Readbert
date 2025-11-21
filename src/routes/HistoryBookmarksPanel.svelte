<script>
  import { visitedHistory } from "$lib/visitedHistory.js";
  import { bookmarks } from "$lib/bookmarks.js";

  let { onSelectDate } = $props();

  let historyEntries = $state([]);
  let bookmarkEntries = $state([]);

  async function loadHistory() {
    try {
      historyEntries = await visitedHistory.getRecent(10);
    } catch (error) {
      console.error("Failed to load history:", error);
      historyEntries = [];
    }
  }

  async function loadBookmarks() {
    try {
      bookmarkEntries = bookmarks.getAll();
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      bookmarkEntries = [];
    }
  }

  function handleSelectDate(date) {
    if (onSelectDate) {
      onSelectDate(date);
    }
  }

  export function load() {
    loadHistory();
    loadBookmarks();
  }

  $effect(() => {
    load();
  });
</script>

<div class="history-view">
  <div class="history-column">
    <h3 class="history-column-title">History</h3>
    <ul class="history-list">
      {#each historyEntries as entry (entry.date)}
        <li class="history-list-item">
          <button
            class="history-list-btn"
            type="button"
            onclick={() => handleSelectDate(entry.date)}
          >
            <span class="history-list-id">{entry.date}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="history-column">
    <h3 class="history-column-title">Bookmarks</h3>
    {#if bookmarkEntries.length === 0}
      <div class="history-empty-state">
        <p>No bookmarks</p>
      </div>
    {:else}
      <ul class="history-list">
        {#each bookmarkEntries as entry (entry.date)}
          <li class="history-list-item">
            <button
              class="history-list-btn"
              type="button"
              onclick={() => handleSelectDate(entry.date)}
            >
              <span class="history-list-id">{entry.date}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

<style>
  .history-view {
    font-family: var(--font-sans);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    height: 100%;
    padding: 16px 0;
  }

  .history-column {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 16px;
  }

  .history-column:first-child {
    border-right: 1px solid rgba(139, 125, 107, 0.2);
  }

  .history-column-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
    padding: 0.5rem;
    letter-spacing: -0.01em;
    text-align: center;
  }

  .history-empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: #6b7280;
  }

  .history-empty-state p {
    margin: 0;
    font-size: 0.85rem;
  }

  .history-list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }

  .history-list-item {
    margin: 0;
    display: flex;
    justify-content: center;
  }

  .history-list-btn {
    font-size: 0.9rem;
    width: auto;
    max-width: 100%;
    background: transparent;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    transition: background-color 0.15s ease;
    border-radius: 8px;
    margin: 2px auto;
    /* font-family: var(--font-mono); */
    /* font-weight: 500; */
  }

  .history-list-btn:hover,
  .history-list-btn:focus-visible {
    background: rgba(0, 0, 0, 0.04);
  }

  .history-list-id {
    color: #374151;
    white-space: nowrap;
  }
</style>
