<script>
  import { transcribeComicInBrowser } from "$lib/browserTranscriber.js";
  import { generatedTranscriptCache } from "$lib/generatedTranscriptCache.js";

  let { currentComic = null } = $props();

  let isOpen = $state(false);
  let transcript = $state(null);
  let isLoading = $state(false);
  let error = $state("");
  let lastRegenerationMethod = $state(null);

  const prettyJson = $derived.by(() => {
    if (!transcript) return "";
    const payload = currentComic?.date
      ? { date: currentComic.date, ...transcript }
      : transcript;
    return JSON.stringify(payload, null, 2);
  });

  const transcriptText = $derived.by(() => {
    if (!transcript?.panels || transcript.panels.length === 0) return "";
    return transcript.panels
      .map((panel, index) => {
        const lines = Array.isArray(panel?.dialogue) ? panel.dialogue : [];
        if (lines.length === 0) return `(Panel ${index + 1})`;
        return lines.join("\n");
      })
      .join("\n\n");
  });


  let copyJsonStatus = $state("COPY JSON");
  let copyTextStatus = $state("COPY TEXT");

  function close() {
    isOpen = false;
  }

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

  function resetCopyStatuses() {
    copyJsonStatus = "COPY JSON";
    copyTextStatus = "COPY TEXT";
  }

  async function copyWithStatus(content, setStatus, defaultLabel) {
    if (!content) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      await navigator.clipboard.writeText(content);
      setStatus("COPIED");
      setTimeout(() => {
        setStatus(defaultLabel);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy transcript content:", error);
    }
  }

  function handleCopyJson() {
    copyWithStatus(prettyJson, (value) => (copyJsonStatus = value), "COPY JSON");
  }

  async function handleCopyText() {
    copyWithStatus(transcriptText, (value) => (copyTextStatus = value), "COPY TEXT");
  }

  function beginRegeneration(method) {
    lastRegenerationMethod = method;
    isOpen = true;
    isLoading = true;
    error = "";
    transcript = null;
    resetCopyStatuses();
  }

  async function regenerateViaServer({ skipCache = false } = {}) {
    if (!currentComic?.date || isLoading) return;

    if (!skipCache) {
      const cachedTranscript = generatedTranscriptCache.get(currentComic.date);
      if (cachedTranscript) {
        beginRegeneration("server");
        transcript = cachedTranscript;
        error = "";
        isLoading = false;
        return;
      }
    }

    beginRegeneration("server");

    try {
      const response = await fetch("/api/regenerate-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: currentComic.date }),
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorBody = await response.json();
          if (errorBody?.error) {
            if (typeof errorBody.error === "string") {
              errorMessage += `: ${errorBody.error}`;
            } else {
              errorMessage += `: ${JSON.stringify(errorBody.error)}`;
            }
          }
        } catch {
          // ignore JSON parse errors
        }
        error = errorMessage;
        return;
      }

      const data = await response.json();
      transcript = data?.transcript ?? null;
      if (transcript) {
        generatedTranscriptCache.set(currentComic.date, transcript);
      }
    } catch (err) {
      console.error("Error regenerating transcript (server):", err);
      error =
        err?.message || "Unexpected error while regenerating transcript (server).";
    } finally {
      isLoading = false;
    }
  }

  async function regenerateViaBrowser({ skipCache = false } = {}) {
    if (!currentComic?.url || isLoading) return;

    if (!skipCache) {
      const cachedTranscript = generatedTranscriptCache.get(currentComic.date);
      if (cachedTranscript) {
        beginRegeneration("browser");
        transcript = cachedTranscript;
        error = "";
        isLoading = false;
        return;
      }
    }

    beginRegeneration("browser");

    try {
      transcript = await transcribeComicInBrowser(currentComic.url);
      if (transcript && currentComic?.date) {
        generatedTranscriptCache.set(currentComic.date, transcript);
      }
    } catch (err) {
      console.error("Error regenerating transcript (browser):", err);
      error =
        err?.message ||
        "Unexpected error while regenerating transcript (browser).";
    } finally {
      isLoading = false;
    }
  }

  function refreshTranscript() {
    if (!currentComic || isLoading) return;

    if (lastRegenerationMethod === "browser" && currentComic.url) {
      regenerateViaBrowser({ skipCache: true });
      return;
    }

    if (currentComic.date) {
      regenerateViaServer({ skipCache: true });
      return;
    }

    if (currentComic.url) {
      regenerateViaBrowser({ skipCache: true });
    }
  }

  function handleGlobalKeydown(event) {
    if (!currentComic) return;
    if (event.key === "g") {
      event.preventDefault();
      regenerateViaServer();
    } else if (event.key === "b") {
      event.preventDefault();
      // regenerateViaBrowser();
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close(); 
    }
  }

  $effect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  });
</script>

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
        <div class="columns">
          <div class="column json-column">
            <div class="column-header">
              <span>JSON</span>
            </div>
            <div class="column-content">
              {#if isLoading}
                <div class="placeholder">
                  Regenerating transcript
                  {#if lastRegenerationMethod}
                    ({lastRegenerationMethod})
                  {/if}
                  ...
                </div>
              {:else if error}
                <pre class="json-content error">{error}</pre>
              {:else if prettyJson}
                <pre class="json-content">{prettyJson}</pre>
              {:else}
                <div class="placeholder">No transcript data yet.</div>
              {/if}
            </div>
          </div>

          <div class="column readable-column">
            <div class="column-header">
              <span>Text</span>
            </div>
            <div class="column-content readable">
              {#if isLoading}
                <div class="placeholder">
                  Regenerating transcript
                  {#if lastRegenerationMethod}
                    ({lastRegenerationMethod})
                  {/if}
                  ...
                </div>
              {:else if error}
                <div class="placeholder error">{error}</div>
              {:else if transcript?.panels && transcript.panels.length > 0}
                <div class="panels">
                  {#each transcript.panels as panel}
                    <div class="panel-block">
                      {#if panel?.dialogue && panel.dialogue.length > 0}
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
                <div class="placeholder">No panels in transcript.</div>
              {/if}
            </div>
          </div>
        </div>
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
  .debug-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.18);
    z-index: 1100;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 0 0 16px;
  }

  .debug-modal {
    background: rgba(248, 246, 240, 0.8);
    border-radius: 15px;
    border: 3px solid rgba(139, 125, 107, 0.7);
    box-shadow: 0 0px 20px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    max-width: 900px;
    width: 95vw;
    height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: var(--font-mono);
  }

  .debug-body {
    display: flex;
    flex-direction: column;
    gap: 0rem;
    flex: 1;
    min-height: 0;
  }

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
    border-left: 1px solid rgba(139, 125, 107, 0.3);
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

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem 0.4rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid rgba(139, 125, 107, 0.3);
  }

  .debug-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.1rem 0.5rem 0.2rem;
    border-top: 0.5px solid rgba(139, 125, 107, 0.3);
    background: rgba(248, 246, 240, 0.9);
  }

  .footer-btn {
    background: transparent;
    border: 0px solid rgba(139, 125, 107, 0.6);
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    cursor: pointer;
    color: var(--text-color);
    font-family: var(--font-mono);
  }

  .footer-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .column-content {
    flex: 1;
    min-height: 0;
    padding: 0.5rem;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .json-content {
    margin: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .readable {
    font-family: var(--font-mono);
    font-size: 0.85rem;
  }

  .panels {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .panel-block {
    padding: 0rem 0.6rem;
  }

  .dialogue-line {
    margin: 0.3rem 0;
  }

  .dialogue-line.empty {
    opacity: 0.7;
    font-style: italic;
  }

  .placeholder {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .error {
    color: #b00020;
  }

  @media (max-width: 600px) {
    .debug-modal {
      max-height: 85vh;
    }

    .columns {
      flex-direction: column;
    }

    .json-column {
      display: none;
      border-top: none;
    }

    .readable-column {
      border-left: none;
      border-top: none;
    }
  }
</style>
