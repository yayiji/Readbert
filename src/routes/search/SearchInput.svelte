<script>
  let {
    searchQuery = $bindable(""),
    indexLoaded = false,
    isSearching = false,
    onKeydown,
    inputRef = $bindable()
  } = $props();
</script>

<div class="search-section">
  <div class="search-input-wrapper">
    <input
      bind:this={inputRef}
      type="text"
      placeholder={indexLoaded ? "Search Dilbert comics..." : "Loading search index..."}
      class="search-input"
      bind:value={searchQuery}
      onkeydown={onKeydown}
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

<style>
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

  @media (max-width: 768px) {
    .keyboard-shortcut {
      display: none;
    }
  }
</style>
