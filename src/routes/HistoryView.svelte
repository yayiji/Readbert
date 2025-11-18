<script>
  import { visitedHistory } from "$lib/visitedHistory.js";

  let { isOpen = false, onClose, onSelectDate } = $props();

  let historyEntries = $state([]);
  let isLoading = $state(false);

  async function loadHistory() {
    isLoading = true;
    try {
      historyEntries = await visitedHistory.getRecent(10);
    } catch (error) {
      console.error("Failed to load history:", error);
      historyEntries = [];
    } finally {
      isLoading = false;
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
      <div class="modal-header">
        <h2 id="history-title">Recent History</h2>
        <button
          class="close-btn"
          type="button"
          onclick={onClose}
          aria-label="Close history"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        {#if isLoading}
          <div class="loading">Loading history...</div>
        {:else if historyEntries.length === 0}
          <div class="empty">No history yet</div>
        {:else}
          <ul class="history-list">
            {#each historyEntries as entry (entry.date)}
              <li class="history-item">
                <button
                  class="history-btn"
                  type="button"
                  onclick={() => handleSelectDate(entry.date)}
                >
                  <span class="history-date">{entry.date}</span>
                  <span class="history-time">
                    {new Date(entry.visitedAt).toLocaleString()}
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
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  .modal-content {
    background: var(--bg-white);
    border: 2px solid var(--border-color);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    border-radius: 4px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--border-color);
  }

  .modal-header h2 {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-color);
    margin: 0;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 1.5rem;
    color: var(--text-color);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .close-btn:hover,
  .close-btn:focus-visible {
    color: var(--text-color);
    opacity: 0.7;
  }

  .modal-body {
    padding: 0.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .loading,
  .empty {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted, #666);
    font-family: var(--font-serif);
  }

  .history-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .history-item {
    border-bottom: 1px solid rgba(139, 125, 107, 0.2);
  }

  .history-item:last-child {
    border-bottom: none;
  }

  .history-btn {
    width: 100%;
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    font-family: var(--font-mono, "Courier New", monospace);
    transition: background-color 0.2s;
  }

  .history-btn:hover,
  .history-btn:focus-visible {
    background: rgba(139, 125, 107, 0.1);
  }

  .history-date {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-color);
  }

  .history-time {
    font-size: 0.75rem;
    color: var(--text-muted, #666);
  }

  @media (max-width: 600px) {
    .modal-content {
      max-width: 95%;
      max-height: 90vh;
    }

    .history-btn {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .history-time {
      font-size: 0.7rem;
    }
  }
</style>
