<script>
  let {
    previousComic = null,
    nextComic = null,
    isLoading = false,
    onPrevious = () => {},
    onNext = () => {},
    onRandom = () => {}
  } = $props();

  // Keyboard shortcuts
  $effect(() => {
    function handleKeydown(event) {
      // Ignore if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === 'ArrowLeft' && previousComic && !isLoading) {
        event.preventDefault();
        onPrevious();
      } else if (event.key === 'ArrowRight' && nextComic && !isLoading) {
        event.preventDefault();
        onNext();
      }
    }

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<div class="navigation">
  <button
    class="nav-btn"
    disabled={!previousComic || isLoading}
    onclick={onPrevious}
  >
    ◄ PREV
  </button>

  <button
    class="nav-btn random"
    disabled={isLoading}
    onclick={onRandom}
  >
    {isLoading ? "LOADING..." : "RANDOM"}
  </button>

  <button
    class="nav-btn"
    disabled={!nextComic || isLoading}
    onclick={onNext}
  >
    NEXT ►
  </button>
</div>

<style>
  /* Navigation Buttons */
  .navigation {
    display: flex;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: 2rem;
  }

  .nav-btn {
    width: 85px;
    height: 36px;
    background-color: var(--bg-light);
    border: 2px solid var(--border-color);
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: bold;
    color: var(--text-color);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (hover: hover) and (pointer: fine) {
    .nav-btn:hover:not(:disabled) {
      background-color: var(--border-color);
      color: var(--bg-light);
    }
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: var(--bg-disabled);
    color: var(--text-muted);
  }

  .nav-btn.random {
    width: 100px;
    background-color: var(--border-color);
    color: var(--bg-light);
  }

  @media (hover: hover) and (pointer: fine) {
    .nav-btn.random:hover:not(:disabled) {
      background-color: var(--accent-color);
    }
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .navigation {
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }
  }
</style>
