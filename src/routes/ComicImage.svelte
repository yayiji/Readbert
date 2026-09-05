<script>
  import { dev } from "$app/environment";
  import { bookmarks } from "$lib/bookmarks.js";

  let {
    currentComic,
    isLoading,
    onImageLoad,
    onSelectDate,
    shortcutsDisabled = false,
  } = $props();

  let isBookmarked = $state(false);
  let isTouchBookmarkVisible = $state(false);
  let touchBookmarkTimer;

  const DILBERT_ALL_BASE =
    "https://github.com/yayiji/Readbert/blob/main/static/dilbert-all";

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
    if (!dev || shortcutsDisabled || shouldIgnoreShortcut(event.target)) return;
    if (event.key === "w") {
      event.preventDefault();
      openDilbertAsset("gif");
    } else if (event.key === "e") {
      event.preventDefault();
      openDilbertAsset("json");
    }
  }

  function handleToggleBookmark() {
    if (!currentComic?.date) return;
    const newState = bookmarks.toggleBookmark(currentComic.date);
    isBookmarked = newState;
  }

  function clearTouchBookmarkTimer() {
    if (touchBookmarkTimer) {
      clearTimeout(touchBookmarkTimer);
      touchBookmarkTimer = undefined;
    }
  }

  function showTouchBookmark() {
    isTouchBookmarkVisible = true;
    clearTouchBookmarkTimer();
    touchBookmarkTimer = setTimeout(() => {
      isTouchBookmarkVisible = false;
      touchBookmarkTimer = undefined;
    }, 1000);
  }

  function handleComicPointerDown(event) {
    if (event.pointerType === "mouse") return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 600px)").matches) return;

    showTouchBookmark();
  }

  $effect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleShortcutKeydown);
    return () => document.removeEventListener("keydown", handleShortcutKeydown);
  });

  $effect(() => {
    if (currentComic?.date) {
      isBookmarked = bookmarks.isBookmarked(currentComic.date);
    } else {
      isBookmarked = false;
    }

    isTouchBookmarkVisible = false;
    clearTouchBookmarkTimer();
    return () => clearTouchBookmarkTimer();
  });
</script>

<div class="comic-container-wrapper">
  <div class="comic-container" class:touch-bookmark-visible={isTouchBookmarkVisible}>
    <button
      class="bookmark-toggle"
      type="button"
      onclick={handleToggleBookmark}
      onpointerdown={handleComicPointerDown}
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
        ><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    </button>
    <img
      src={currentComic.url}
      alt="Dilbert comic from {currentComic.date}"
      class="comic-image"
      class:loading={isLoading}
      onload={onImageLoad}
      onpointerdown={handleComicPointerDown}
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
    background-color: var(--color-paper-white);
    padding: 0.8rem;
    border: 2px solid var(--color-border);
    border-radius: 0px;
    box-shadow: var(--shadow);
    margin-top: 0rem;
  }

  .bookmark-toggle {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: var(--color-glass-70);
    border: 1px solid var(--color-border-60);
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--color-ink);
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
    /* transform: scale(1.1); */
    background: var(--color-glass-90);
    box-shadow: 0 0 8px var(--color-ink-20);
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
    background: var(--color-glass-80);
    border: 1.5px solid var(--color-border-60);
    box-shadow: 0 0 16px var(--color-ink-30);
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
    background: var(--color-transparent);
    border: none;
    font-family: var(--font-mono, "Courier New", "Courier", monospace);
    font-size: 0.8rem;
    color: var(--color-ink);
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

  .comic-actions {
    display: none;
  }

  @media (max-width: 768px) {
    .comic-container {
      padding: 0.6rem;
    }
  }

  @media (max-width: 600px) {
    .comic-container {
      padding: 0.5rem;
    }

    .comic-actions {
      display: none;
    }

    .bookmark-toggle {
      display: flex;
    }

    .comic-container:hover .bookmark-toggle {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .comic-container.touch-bookmark-visible .bookmark-toggle {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }
  }
</style>
