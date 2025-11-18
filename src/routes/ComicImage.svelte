<script>
  import HistoryView from "./HistoryView.svelte";

  let {
    currentComic,
    isLoading,
    onImageLoad,
    onSelectDate,
    shortcutsDisabled = false,
  } = $props();

  let isHistoryOpen = $state(false);

  const DILBERT_ALL_BASE = "https://github.com/yayiji/Readbert/blob/main/static/dilbert-all";

  function shouldIgnoreShortcut(target) {
    if (!target) return false;
    const tagName = target.tagName;
    return (
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      target?.isContentEditable ||
      target?.closest?.("input, textarea, [contenteditable='true']")
    );
  }

  function openDilbertAsset(extension) {
    if (!currentComic?.date) return;
    const year = currentComic.date.split("-")[0];
    const targetUrl = `${DILBERT_ALL_BASE}/${year}/${currentComic.date}.${extension}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  function handleShortcutKeydown(event) {
    if (shortcutsDisabled || shouldIgnoreShortcut(event.target)) return;
    if (event.key === "w") {
      event.preventDefault();
      openDilbertAsset("gif");
    } else if (event.key === "e") {
      event.preventDefault();
      openDilbertAsset("json");
    } else if (event.key === "h") {
      event.preventDefault();
      isHistoryOpen = true;
    }
  }

  function handleCloseHistory() {
    isHistoryOpen = false;
  }

  function handleSelectHistoryDate(date) {
    if (onSelectDate) {
      onSelectDate(date);
    }
  }

  $effect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleShortcutKeydown);
    return () => document.removeEventListener("keydown", handleShortcutKeydown);
  });
</script>

<HistoryView
  isOpen={isHistoryOpen}
  onClose={handleCloseHistory}
  onSelectDate={handleSelectHistoryDate}
/>

<div class="comic-container-wrapper">
  <div class="comic-container">
    <img
      src={currentComic.url}
      alt="Dilbert comic from {currentComic.date}"
      class="comic-image"
      class:loading={isLoading}
      onload={onImageLoad}
    />

    <div class="comic-actions" role="menu" aria-hidden="true">
      <button
        class="action-btn"
        type="button"
        onclick={() => openDilbertAsset("gif")}
        role="menuitem"
      >
        Comic
      </button>
      <button
        class="action-btn"
        type="button"
        onclick={() => openDilbertAsset("json")}
        role="menuitem"
      >
        Transcript
      </button>
      <button
        class="action-btn"
        type="button"
        onclick={() => (isHistoryOpen = true)}
        role="menuitem"
      >
        History
      </button>
    </div>
  </div>
</div>

<style>
  .comic-container-wrapper {
    display: flex;
    justify-content: center;
  }

  .comic-container {
    position: relative;
    display: inline-block;
    background-color: var(--bg-white);
    padding: 0.9rem;
    border: 2px solid var(--border-color);
    box-shadow: var(--shadow);
    margin-top: 0rem;
  }

  .comic-actions {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%) translateY(-0.2rem);
    background: rgba(248, 246, 240, 0.8);
    border: 1.5px solid rgba(139, 125, 107, 0.6);
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.3);
    padding: 0.3rem 0.6rem;
    display: flex;
    gap: 0.5rem;
    visibility: hidden;
    pointer-events: none;
    z-index: 2;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .comic-container:hover .comic-actions {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .action-btn {
    background: transparent;
    border: none;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
    font-size: 0.8rem;
    color: var(--text-color);
    cursor: pointer;
    padding: 0.25rem 0.4rem;
    white-space: nowrap;
  }

  .action-btn:hover,
  .action-btn:focus-visible {
    font-weight: bold;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  .comic-image.loading {
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    .comic-container {
      padding: 0.8rem;
    }
  }

  @media (max-width: 600px) {
    .comic-container {
      padding: 0.5rem;
    }
    .comic-actions {
      display: none;
    }
  }
</style>
