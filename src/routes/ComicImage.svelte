<script>
  import HistoryView from "./HistoryView.svelte";
  import BookmarksView from "./BookmarksView.svelte";
  import { bookmarks } from "$lib/bookmarks.js";

  let {
    currentComic,
    isLoading,
    onImageLoad,
    onSelectDate,
    shortcutsDisabled = false,
  } = $props();

  let isHistoryOpen = $state(false);
  let isBookmarksOpen = $state(false);
  let isBookmarked = $state(false);

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
    } else if (event.key === "m") {
      event.preventDefault();
      isBookmarksOpen = true;
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

  function handleToggleBookmark() {
    if (!currentComic?.date) return;
    const newState = bookmarks.toggleBookmark(currentComic.date);
    isBookmarked = newState;
  }

  function handleCloseBookmarks() {
    isBookmarksOpen = false;
  }

  function handleSelectBookmarkDate(date) {
    if (onSelectDate) {
      onSelectDate(date);
    }
  }

  function updateBookmarkState() {
    if (currentComic?.date) {
      isBookmarked = bookmarks.isBookmarked(currentComic.date);
    }
  }

  $effect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleShortcutKeydown);
    return () => document.removeEventListener("keydown", handleShortcutKeydown);
  });

  $effect(() => {
    updateBookmarkState();
  });
</script>

<HistoryView
  isOpen={isHistoryOpen}
  onClose={handleCloseHistory}
  onSelectDate={handleSelectHistoryDate}
/>

<BookmarksView
  isOpen={isBookmarksOpen}
  onClose={handleCloseBookmarks}
  onSelectDate={handleSelectBookmarkDate}
/>

<div class="comic-container-wrapper">
  <div class="comic-container">
    <button
      class="bookmark-toggle"
      type="button"
      onclick={handleToggleBookmark}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={isBookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    </button>
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

  .bookmark-toggle {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: rgba(248, 246, 240, 0.9);
    border: 1.5px solid rgba(139, 125, 107, 0.6);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--text-color);
    transition: all 0.2s ease;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: 3;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  .comic-container:hover .bookmark-toggle {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .bookmark-toggle:hover {
    transform: scale(1.1);
    background: rgba(248, 246, 240, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .bookmark-toggle svg {
    width: 18px;
    height: 18px;
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
    .comic-actions,
    .bookmark-toggle {
      display: none;
    }
  }
</style>
