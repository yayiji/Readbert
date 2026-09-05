<script>
  import { transcribeComicInBrowser } from "$lib/browserTranscriber.js";
  import { generatedTranscriptCache } from "$lib/generatedTranscriptCache.js";

  // ========================================
  // Props
  // ========================================

  let { currentComic = null, shortcutsDisabled = false } = $props();

  // ========================================
  // State
  // ========================================

  let isOpen = $state(false);
  let transcript = $state(null);
  let isLoading = $state(false);
  let error = $state("");
  let lastRegenerationMethod = $state(null);
  let copyJsonStatus = $state("COPY JSON");
  let copyTextStatus = $state("COPY TEXT");

  // ========================================
  // Derived State
  // ========================================

  const prettyJson = $derived.by(() => {
    if (!transcript) return "";
    const payload = currentComic?.date
      ? { date: currentComic.date, ...transcript }
      : transcript;
    return JSON.stringify(payload, null, 2);
  });

  const transcriptText = $derived.by(() => {
    if (!transcript?.panels?.length) return "";

    const parts = [];

    // Add explanation if it exists
    if (transcript.explanation) {
      parts.push(`Explanation: ${transcript.explanation}`);
      parts.push(""); // Empty line separator
    }

    // Add panel dialogues
    const panelText = transcript.panels
      .map((panel, index) => {
        const lines = Array.isArray(panel?.dialogue) ? panel.dialogue : [];
        if (lines.length === 0) return `(Panel ${index + 1})`;
        return lines.join("\n");
      })
      .join("\n\n");

    parts.push(panelText);

    return parts.join("\n");
  });

  // ========================================
  // UI Helper Functions
  // ========================================

  function close() {
    isOpen = false;
  }

  function resetCopyStatuses() {
    copyJsonStatus = "COPY JSON";
    copyTextStatus = "COPY TEXT";
  }

  async function copyToClipboard(content, statusSetter, defaultLabel) {
    if (!content || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      statusSetter("COPIED");
      setTimeout(() => statusSetter(defaultLabel), 1500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  }

  // ========================================
  // Regeneration Helper Functions
  // ========================================

  function beginRegeneration(method) {
    lastRegenerationMethod = method;
    isOpen = true;
    isLoading = true;
    error = "";
    transcript = null;
    resetCopyStatuses();
  }

  function getCachedTranscript(date) {
    return generatedTranscriptCache.get(date);
  }

  function setCachedTranscript(date, transcriptData) {
    if (transcriptData && date) {
      generatedTranscriptCache.set(date, transcriptData);
    }
  }

  function handleRegenerationSuccess(transcriptData) {
    transcript = transcriptData;
    setCachedTranscript(currentComic?.date, transcriptData);
    error = "";
    isLoading = false;
  }

  function handleRegenerationError(err, method) {
    console.error(`Error regenerating transcript (${method}):`, err);
    error = err?.message || `Unexpected error while regenerating transcript (${method}).`;
    isLoading = false;
  }

  // ========================================
  // API Functions
  // ========================================

  async function regenerateViaServer({ skipCache = false } = {}) {
    if (!currentComic?.date || isLoading) return;

    // Check cache first
    if (!skipCache) {
      const cachedTranscript = getCachedTranscript(currentComic.date);
      if (cachedTranscript) {
        beginRegeneration("server");
        handleRegenerationSuccess(cachedTranscript);
        return;
      }
    }

    beginRegeneration("server");

    try {
      const response = await fetch("/api/regenerate-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: currentComic.date }),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            const errorDetail = typeof errorBody.error === "string"
              ? errorBody.error
              : JSON.stringify(errorBody.error);
            errorMessage += `: ${errorDetail}`;
          }
        } catch {
          // Ignore JSON parse errors
        }
        error = errorMessage;
        return;
      }

      const data = await response.json();
      handleRegenerationSuccess(data?.transcript ?? null);
    } catch (err) {
      handleRegenerationError(err, "server");
    }
  }

  async function regenerateViaBrowser({ skipCache = false } = {}) {
    if (!currentComic?.url || isLoading) return;

    // Check cache first
    if (!skipCache) {
      const cachedTranscript = getCachedTranscript(currentComic.date);
      if (cachedTranscript) {
        beginRegeneration("browser");
        handleRegenerationSuccess(cachedTranscript);
        return;
      }
    }

    beginRegeneration("browser");

    try {
      const transcriptData = await transcribeComicInBrowser(currentComic.url);
      handleRegenerationSuccess(transcriptData);
    } catch (err) {
      handleRegenerationError(err, "browser");
    }
  }

  function refreshTranscript() {
    if (!currentComic || isLoading) return;

    // Use the last method that was used, or fallback to appropriate method
    if (lastRegenerationMethod === "browser" && currentComic.url) {
      regenerateViaBrowser({ skipCache: true });
    } else if (currentComic.date) {
      regenerateViaServer({ skipCache: true });
    } else if (currentComic.url) {
      regenerateViaBrowser({ skipCache: true });
    }
  }

  // ========================================
  // Event Handlers
  // ========================================

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      close();
    }
  }

  function handleBackdropKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  function handleCopyJson() {
    copyToClipboard(prettyJson, (value) => (copyJsonStatus = value), "COPY JSON");
  }

  function handleCopyText() {
    copyToClipboard(transcriptText, (value) => (copyTextStatus = value), "COPY TEXT");
  }

  function handleGlobalKeydown(event) {
    if (!currentComic || shortcutsDisabled) return;

    if (event.key === "g") {
      event.preventDefault();
      regenerateViaServer();
    } else if (event.key === "b") {
      event.preventDefault();
      regenerateViaBrowser();
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close();
    }
  }

  // ========================================
  // Effects
  // ========================================

  $effect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  });
</script>

<!-- ========================================
     Snippets
     ======================================== -->

{#snippet loadingState()}
  <div class="placeholder">
    Regenerating transcript
    {#if lastRegenerationMethod}
      ({lastRegenerationMethod})
    {/if}
    ...
  </div>
{/snippet}

{#snippet emptyState(message)}
  <div class="placeholder">{message}</div>
{/snippet}

<!-- ========================================
     Modal UI
     ======================================== -->

{#if isOpen}
  <div
    class="debug-backdrop"
    onclick={handleBackdropClick}
    onkeydown={handleBackdropKeydown}
    role="dialog"
    aria-modal="true"
    aria-label="Regenerated transcript debug view"
    tabindex="-1"
  >
    <div class="debug-modal" role="document">
      <div class="debug-body">

        <!-- Two-column layout -->
        <div class="columns">

          <!-- JSON Column -->
          <div class="column json-column">
            <div class="column-header">
              <span>JSON</span>
            </div>
            <div class="column-content">
              {#if isLoading}
                {@render loadingState()}
              {:else if error}
                <pre class="json-content error">{error}</pre>
              {:else if prettyJson}
                <pre class="json-content">{prettyJson}</pre>
              {:else}
                {@render emptyState("No transcript data yet.")}
              {/if}
            </div>
          </div>

          <!-- Text Column -->
          <div class="column readable-column">
            <div class="column-header">
              <span>Text</span>
            </div>
            <div class="column-content readable">
              {#if isLoading}
                {@render loadingState()}
              {:else if error}
                <div class="placeholder error">{error}</div>
              {:else if transcript?.panels?.length > 0}
                {#if transcript.explanation}
                  <div class="explanation">
                    <div class="explanation-label">Explanation:</div>
                    <div class="explanation-text">{transcript.explanation}</div>
                  </div>
                {/if}
                <div class="panels">
                  {#each transcript.panels as panel}
                    <div class="panel-block">
                      {#if panel?.dialogue?.length > 0}
                        {#each panel.dialogue as line}
                          <div class="dialogue-line">{line}</div>
                        {/each}
                      {:else}
                        <div class="dialogue-line empty">(no text)</div>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                {@render emptyState("No panels in transcript.")}
              {/if}
            </div>
          </div>
        </div>

        <!-- Footer with action buttons -->
        <div class="debug-footer">
          <div class="footer-left">
            <button
              class="footer-btn copy-btn"
              type="button"
              onclick={handleCopyJson}
              disabled={!prettyJson}
              title="Copy JSON to clipboard"
            >
              {copyJsonStatus}
            </button>
            <button
              class="footer-btn copy-btn"
              type="button"
              onclick={handleCopyText}
              disabled={!transcriptText}
              title="Copy transcript text"
            >
              {copyTextStatus}
            </button>
          </div>
          <div class="footer-right">
            <button
              class="footer-btn refresh-btn"
              type="button"
              onclick={refreshTranscript}
              disabled={!currentComic || isLoading}
              title="Refetch transcript"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* ========================================
     Modal Backdrop & Container
     ======================================== */

  .debug-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 16px;
    background: var(--color-ink-18);
  }

  .debug-modal {
    width: 95vw;
    max-width: 900px;
    height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-glass-80);
    border: 3px solid var(--color-border-70);
    border-radius: 15px;
    box-shadow: 0 0 20px var(--color-ink-30);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    font-family: var(--font-mono);
  }

  .debug-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  /* ========================================
     Two-Column Layout
     ======================================== */

  .columns {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .column {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
    border-left: 1px solid var(--color-border-30);
  }

  .column:first-child {
    border-left: none;
  }

  .json-column {
    flex: 1.1;
  }

  .readable-column {
    flex: 1;
  }

  /* ========================================
     Column Header & Content
     ======================================== */

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem 0.4rem;
    border-bottom: 1px solid var(--color-border-30);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .column-content {
    flex: 1;
    min-height: 0;
    padding: 0.8rem;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* ========================================
     JSON Column Content
     ======================================== */

  .json-content {
    margin: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ========================================
     Text Column Content
     ======================================== */

  .readable {
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .explanation {
    margin-bottom: 0.5rem;
    padding: 1rem;
    background: var(--color-border-10);
    border-radius: 12px;
  }

  .explanation-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.7;
    margin-bottom: 0.3rem;
  }

  .explanation-text {
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--color-ink);
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  .panels {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .panel-block {
    padding: 0 0.6rem;
  }

  .dialogue-line {
    line-height: 1.4;
    margin: 0.2rem 0;
  }

  .dialogue-line.empty {
    opacity: 0.7;
    font-style: italic;
  }

  /* ========================================
     Shared States
     ======================================== */

  .placeholder {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .error {
    color: var(--color-error);
  }

  /* ========================================
     Footer
     ======================================== */

  .debug-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.1rem 0.5rem 0.2rem;
    background: var(--color-glass-90);
    border-top: 0.5px solid var(--color-border-30);
  }

  .footer-btn {
    padding: 0.2rem 0.5rem;
    background: var(--color-transparent);
    border: none;
    border-radius: 999px;
    font-family: var(--font-mono);
    font-size: 0.7rem;
    font-weight: 500;
    color: var(--color-ink);
    cursor: pointer;
  }

  .footer-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  /* ========================================
     Responsive Layout
     ======================================== */

  @media (max-width: 600px) {

    .json-column {
      display: none;
    }

    .readable-column {
      border-left: none;
    }
  }
</style>
