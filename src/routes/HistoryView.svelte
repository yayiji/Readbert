<script>
  import { visitedHistory } from "$lib/visitedHistory.js";

  let { isOpen = false, onClose, onSelectDate } = $props();

  let historyEntries = $state([]);

  async function loadHistory() {
    try {
      historyEntries = await visitedHistory.getRecent(10);
    } catch (error) {
      console.error("Failed to load history:", error);
      historyEntries = [];
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

  function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
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
        <h2 id="history-title">Visited History</h2>
      </div>

      <div class="modal-body">
        <ul class="history-list">
          {#each historyEntries as entry (entry.date)}
            <li class="history-item">
              <button
                class="history-btn"
                type="button"
                onclick={() => handleSelectDate(entry.date)}
              >
                <span class="history-id">{entry.date}</span>
                <span class="history-time">
                  {formatRelativeTime(entry.visitedAt)}
                </span>
              </button>
            </li>
          {/each}
        </ul>
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
    /* backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px); */
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

  .history-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .history-item {
    margin: 0;
  }

  .history-btn {
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

  .history-btn:hover,
  .history-btn:focus-visible {
    background: rgba(0, 0, 0, 0.04);
  }

  .history-id {
    /* font-family: var(--font-mono, monospace); */
    color: var(--text-color);
  }

  .history-time {
    color: var(--text-muted, #999);
    flex-shrink: 0;
    white-space: nowrap;
  }

  @media (max-width: 600px) {
    .modal-content {
      max-width: 95%;
      max-height: 80vh;
    }

    .history-btn {
      padding: 0.75rem;
    }
  }
</style>
