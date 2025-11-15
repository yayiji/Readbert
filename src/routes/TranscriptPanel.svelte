<script>
  /**
   * TranscriptPanel component
   * Displays the AI-generated transcript for a comic with panels and dialogue
   */

  // Props using Svelte 5 $props rune
  let { transcript = null } = $props();
</script>

{#if transcript?.panels}
  <div class="transcript-container">
    <table class="transcript-table">
      <tbody>
        {#each transcript.panels as panel}
          <tr>
            <td class="dialogue-cell">
              {#each panel.dialogue as dialogue}
                <div class="dialogue-line">{dialogue}</div>
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  /* ===== TRANSCRIPT STYLES ===== */
  .transcript-container {
    margin: 10px auto 0;
    max-width: 550px;
    width: 100%;
    padding: 0 var(--spacing-lg);
    box-sizing: border-box;
  }

  .transcript-table {
    width: 100%;
    margin: 0 auto;
    border-collapse: collapse;
    background-color: transparent;
    font-family: var(--font-mono);
  }

  .transcript-table td {
    padding: 0.6rem 1rem;
    vertical-align: top;
    text-align: left;
  }

  .dialogue-cell {
    line-height: 1.4;
    text-align: left;
  }

  .dialogue-line {
    margin: var(--spacing-xs) 0;
    font-size: 16px;
    color: var(--text-color);
    word-wrap: break-word;
  }

  .dialogue-line:first-child {
    margin-top: 0;
  }

  .dialogue-line:last-child {
    margin-bottom: 0;
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .transcript-table td {
      padding: 0.6rem 0.5rem;
    }

    .dialogue-line {
      font-size: 15px;
    }
  }
</style>
