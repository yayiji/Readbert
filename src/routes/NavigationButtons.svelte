<script>
  import { isEditableTarget } from "$lib/keyboard.js";

  let {
    previousComic = null,
    nextComic = null,
    isLoading = false,
    onPrevious = () => {},
    onNext = () => {},
    onRandom = () => {},
    shortcutsDisabled = false
  } = $props();

  $effect(() => {
    function handleKeydown(event) {
      if (shortcutsDisabled || isEditableTarget(event.target, { includeSelect: true })) {
        return;
      }

      if (event.key === "ArrowLeft" && previousComic && !isLoading) {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight" && nextComic && !isLoading) {
        event.preventDefault();
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  });
</script>

<div class="navigation">
  <button class="nav-btn" disabled={!previousComic || isLoading} onclick={onPrevious}>
    ◄ PREV
  </button>
  <button class="nav-btn random" disabled={isLoading} onclick={onRandom}>
    RANDOM
  </button>
  <button class="nav-btn" disabled={!nextComic || isLoading} onclick={onNext}>
    NEXT ►
  </button>
</div>

<style>
  .navigation {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: 2rem;
  }

  .nav-btn {
    width: 85px;
    height: 36px;
    background-color: var(--color-surface);
    border: 2px solid var(--color-border);
    border-radius: 0px;
    font-family: inherit;
    font-size: 0.8rem;
    font-weight: bold;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (hover: hover) and (pointer: fine) {
    .nav-btn:hover:not(:disabled) {
      background-color: var(--nav-btn-hover-bg);
      border-color: var(--nav-btn-hover-bg);
      color: var(--nav-btn-hover-fg);
    }
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--color-surface);
    color: var(--color-muted);
  }

  .nav-btn.random {
    width: 100px;
    background-color: var(--nav-btn-random-bg);
    border-color: var(--nav-btn-random-bg);
    color: var(--nav-btn-random-fg);
  }

  @media (hover: hover) and (pointer: fine) {
    .nav-btn.random:hover:not(:disabled) {
      background-color: var(--nav-btn-random-hover-bg);
      border-color: var(--nav-btn-random-hover-bg);
      color: var(--nav-btn-random-hover-fg);
    }
  }

  @media (max-width: 600px) {
    .navigation {
      gap: var(--spacing-2);
      flex-wrap: wrap;
    }
  }
</style>
