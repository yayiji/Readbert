<script>
  import { bookmarks } from "$lib/bookmarks.js";

  let { isOpen = false, onClose, onSelectDate } = $props();

  let bookmarkEntries = $state([]);

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

  function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString();
  }

  $effect(() => {
    if (isOpen) {
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
    aria-labelledby="bookmarks-title"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="bookmarks-title">Bookmarks</h2>
      </div>

      <div class="modal-body">
        {#if bookmarkEntries.length === 0}
          <div class="empty-state">
            <p>No bookmarks yet</p>
            <p class="empty-hint">Press the star icon to bookmark a comic</p>
          </div>
        {:else}
          <ul class="bookmarks-list">
            {#each bookmarkEntries as entry (entry.date)}
              <li class="bookmark-item">
                <button
                  class="bookmark-btn"
                  type="button"
                  onclick={() => handleSelectDate(entry.date)}
                >
                  <span class="bookmark-id">{entry.date}</span>
                  <span class="bookmark-time">
                    {formatDate(entry.bookmarkedAt)}
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
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
    max-width: 420px;
    width: 90%;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1.25rem;
    border-bottom: 0.5px solid var(--border-color);
  }

  .modal-header h2 {
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .modal-body {
    padding: 0.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-muted, #999);
  }

  .empty-state p {
    margin: 0.5rem 0;
  }

  .empty-hint {
    font-size: 0.85rem;
  }

  .bookmarks-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .bookmark-item {
    margin: 0;
  }

  .bookmark-btn {
    font-size: 0.9rem;
    width: 100%;
    background: transparent;
    border: none;
    padding: 0.7rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    text-align: left;
    transition: background-color 0.15s ease;
    border-radius: 12px;
    margin: 2px 0;
  }

  .bookmark-btn:hover,
  .bookmark-btn:focus-visible {
    background: rgba(0, 0, 0, 0.04);
  }

  .bookmark-id {
    color: var(--text-color);
  }

  .bookmark-time {
    color: var(--text-muted, #999);
    flex-shrink: 0;
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .modal-content {
      max-width: 95%;
      max-height: 80vh;
    }

    .bookmark-btn {
      padding: 0.75rem;
    }
  }
</style>
