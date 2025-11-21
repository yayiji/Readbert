<script>
  import { visitedHistory } from "$lib/visitedHistory.js";
  import { bookmarks } from "$lib/bookmarks.js";

  let { isOpen = false, onClose, onSelectDate } = $props();

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
    if (onClose) {
      onClose();
    }
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && onClose) {
      onClose();
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  }

  $effect(() => {
    if (isOpen) {
      loadHistory();
      loadBookmarks();
    }
  });
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="modal-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    aria-labelledby="history-title"
  >
    <div class="modal-content">
      <div class="modal-body">
        <div class="column">
          <h3 class="column-title">History</h3>
          <ul class="list">
            {#each historyEntries as entry (entry.date)}
              <li class="list-item">
                <button
                  class="list-btn"
                  type="button"
                  onclick={() => handleSelectDate(entry.date)}
                >
                  <span class="list-id">{entry.date}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>

        <div class="column">
          <h3 class="column-title">Bookmarks</h3>
          {#if bookmarkEntries.length === 0}
            <div class="empty-state">
              <p>No bookmarks</p>
            </div>
          {:else}
            <ul class="list">
              {#each bookmarkEntries as entry (entry.date)}
                <li class="list-item">
                  <button
                    class="list-btn"
                    type="button"
                    onclick={() => handleSelectDate(entry.date)}
                  >
                    <span class="list-id">{entry.date}</span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--border-color);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    width: 420px;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .modal-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    overflow: hidden;
    flex: 1;
  }

  .column {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0.5rem;
  }

  .column:first-child {
    border-right: 0.5px solid var(--border-color);
  }

  .column-title {
    font-family: var(--font-sans);
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.5rem 0;
    padding: 0.5rem 0.5rem;
    letter-spacing: -0.01em;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-muted, #999);
  }

  .empty-state p {
    margin: 0;
    font-size: 0.85rem;
  }

  .list {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex: 1;
  }

  .list-item {
    margin: 0;
    display: flex;
    justify-content: center;
  }

  .list-btn {
    font-size: 0.85rem;
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
  }

  .list-btn:hover,
  .list-btn:focus-visible {
    background: rgba(0, 0, 0, 0.04);
  }

  .list-id {
    color: var(--text-color);
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .modal-content {
      width: 80%;
    }

  }
</style>
