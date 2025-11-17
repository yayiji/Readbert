<script>
  import { createEventDispatcher } from "svelte";

  let { currentComic, isLoading, onImageLoad } = $props();

  const dispatch = createEventDispatcher();

  function handleAssetSelect(extension) {
    dispatch("openAsset", { extension });
  }
</script>

<div class="comic-container-wrapper">
  <div class="comic-container">
    <div class="comic-actions" role="menu" aria-hidden="true">
      <button
        class="action-btn"
        type="button"
        onclick={() => handleAssetSelect("gif")}
        role="menuitem"
      >
        View GIF on Dilbert All
      </button>
      <button
        class="action-btn"
        type="button"
        onclick={() => handleAssetSelect("json")}
        role="menuitem"
      >
        View JSON on Dilbert All
      </button>
    </div>

    <img
      src={currentComic.url}
      alt="Dilbert comic from {currentComic.date}"
      class="comic-image"
      class:loading={isLoading}
      onload={onImageLoad}
    />
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
    top: -48px;
    left: 50%;
    transform: translate(-50%, -10px);
    background: rgba(248, 246, 240, 0.95);
    border: 1px solid rgba(139, 125, 107, 0.4);
    box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.15));
    padding: 0.3rem 0.6rem;
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    z-index: 2;
  }

  .comic-container:hover .comic-actions {
    opacity: 1;
    visibility: visible;
    transform: translate(-50%, -4px);
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
    background: var(--bg-light, #f8f6f0);
    outline: none;
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

    .comic-actions {
      flex-direction: column;
      top: -72px;
    }
  }

  @media (max-width: 600px) {
    .comic-container {
      padding: 0.5rem;
    }
  }
</style>
