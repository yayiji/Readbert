<script>
  import { highlightText } from "$lib/searchIndex.js";

  let {
    result,
    index,
    isSelected = false,
    searchQuery,
    onSelect,
    onKeydown
  } = $props();

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
</script>

<button
  class="result-item"
  class:selected={isSelected}
  data-index={index}
  onclick={() => onSelect?.(result)}
  onkeydown={onKeydown}
  role="option"
  aria-selected={isSelected}
  tabindex="0"
>
  <div class="result-content">
    <div class="result-date">{formatDate(result.date)}</div>
  </div>
  <div class="result-preview">
    <div class="comic-container">
      <img
        src={result.comicEntity?.url ?? ""}
        alt={`Dilbert comic from ${formatDate(result.date)}`}
        class="comic-image"
        loading="lazy"
      />
    </div>
  </div>
  <div class="result-text">
    {#each result.comic.panels as panel, panelIndex}
      {#each panel.dialogue as dialogue, dialogueIndex}
        {@const hasMatch = result.matches.some(
          (m) => m.panelIndex === panelIndex && m.dialogueIndex === dialogueIndex
        )}
        {#if hasMatch}
          <span class="dialogue-excerpt">
            {@html highlightText(
              dialogue.slice(0, 120) + (dialogue.length > 120 ? "..." : ""),
              searchQuery
            )}
          </span>
        {/if}
      {/each}
    {/each}
  </div>
</button>

<style>
  .result-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 0;
    border: 3px solid var(--color-transparent);
    background: var(--color-surface-faded);
    text-align: left;
    width: 100%;
    font-family: var(--font-sans);
    /* font-family: var(--font-mono2); */
    font-size: inherit;
    font-size: 0.85rem;
    color: var(--color-text-overlay);
    height: auto;
    min-height: 180px;
    box-sizing: border-box;
  }

  .result-item:hover {
    border: 3px solid var(--color-border-medium);
    background: var(--color-surface-strong);
  }

  /* .result-item:hover, */
  .result-item.selected {
    background: var(--color-surface-strong);
    border: 3px solid var(--color-border);
    box-shadow: 0 0 16px var(--color-shadow);
  }

  .result-preview {
    flex-shrink: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .comic-container {
    display: inline-block;
    background-color: var(--color-surface-strong);
    padding: 0.4rem;
    border: 1px solid var(--color-border-medium);
    border-radius: 8px;
    margin-bottom: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    border: 1px solid var(--color-border-light);
  }

  .result-content {
    flex-shrink: 0;
    min-width: 0;
    text-align: center;
    margin-bottom: 4px;
  }

  .result-date {
    font-weight: bold;
    font-weight: 500;
    margin-bottom: 0;
  }

  .result-text {
    line-height: 1.5;
    word-break: break-word;
    text-align: left;
    background: var(--color-transparent);
    padding: 0.2rem 1rem 0.5rem;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    flex: 1;
  }

  .dialogue-excerpt {
    /* font-family: var(--font-mono); */
    display: block;
  }

  .dialogue-excerpt:not(:last-child) {
    margin-bottom: 0.5rem;
  }

  :global(.result-text mark) {
    background: var(--color-highlight);
    padding: 2px 4px;
    font-size: 1em;
    border-radius: 5px;
    color: var(--color-text);
  }
</style>
