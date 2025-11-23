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
    border: 3px solid transparent;
    background: rgba(255, 255, 255, 0.6);
    text-align: left;
    width: 100%;
    font-family: var(--font-sans);
    font-size: inherit;
    font-size: 0.9rem;
    color: rgba(0, 0, 0, 0.75);
    height: auto;
    min-height: 180px;
    box-sizing: border-box;
  }

  .result-item:hover,
  .result-item.selected {
    background: rgba(255, 255, 255, 1);
    border: 3px solid rgba(139, 125, 107, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .result-item:hover {
    border: 3px solid rgba(139, 125, 107, 0.4);
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
    background-color: #fff;
    padding: 0.4rem;
    border: 1px solid #d4c5a9;
    margin-bottom: 0;
    width: 100%;
    box-sizing: border-box;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    border: 1px solid #ccc;
  }

  .result-content {
    flex-shrink: 0;
    min-width: 0;
    text-align: center;
    margin-bottom: 4px;
  }

  .result-date {
    font-weight: bold;
    margin-bottom: 0;
  }

  .result-text {
    line-height: 1.5;
    word-break: break-word;
    text-align: left;
    background: transparent;
    padding: 12px 8px 8px 8px;
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
    background: yellowgreen;
    background: gold;
    padding: 2px 4px;
    border-radius: 5px;
    font-weight: 500;
  }
</style>
