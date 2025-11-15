<script>
  let {
    previousComic = null,
    nextComic = null,
    isLoading = false,
    onPrevious = () => {},
    onNext = () => {},
    onRandom = () => {}
  } = $props();
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
    margin-bottom: 27px;
  }

  .nav-btn {
    padding: 9px 14px;
    min-width: 74px;
    background-color: var(--bg-light);
    border: 2px solid var(--border-color);
    font-family: var(--font-serif);
    font-size: 13px;
    font-weight: bold;
    color: var(--text-color);
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
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
      margin-bottom: 25px;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .nav-btn {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: 13px;
      min-width: 70px;
    }
  }
</style>
