<script>
  import { transcribeComicInBrowser } from "$lib/browserTranscriber.js";

  let { currentComic = null } = $props();

  let isOpen = $state(false);
  let transcript = $state(null);
  let isLoading = $state(false);
  let error = $state("");

  const date = $derived(currentComic?.date ?? "");

  const prettyJson = $derived(
    transcript ? JSON.stringify(transcript, null, 2) : "",
  );

  let copyStatus = $state("COPY");

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

  async function handleCopyJson() {
    if (!prettyJson) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) return;
      await navigator.clipboard.writeText(prettyJson);
      copyStatus = "COPIED";
      setTimeout(() => {
        copyStatus = "COPY";
      }, 1500);
    } catch (error) {
      console.error("Failed to copy transcript JSON:", error);
    }
  }

  async function regenerateViaServer() {
    if (!currentComic?.date || isLoading) return;

    isOpen = true;
    isLoading = true;
    error = "";
    transcript = null;
    copyStatus = "COPY";

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
    } catch (err) {
      console.error("Error regenerating transcript (server):", err);
      error =
        err?.message || "Unexpected error while regenerating transcript (server).";
    } finally {
      isLoading = false;
    }
  }

  async function regenerateViaBrowser() {
    if (!currentComic?.url || isLoading) return;

    isOpen = true;
    isLoading = true;
    error = "";
    transcript = null;
    copyStatus = "COPY";

    try {
      transcript = await transcribeComicInBrowser(currentComic.url);
    } catch (err) {
      console.error("Error regenerating transcript (browser):", err);
      error =
        err?.message ||
        "Unexpected error while regenerating transcript (browser).";
    } finally {
      isLoading = false;
    }
  }

  function handleGlobalKeydown(event) {
    if (!currentComic) return;
    if (event.key === "g") {
      event.preventDefault();
      regenerateViaServer();
    } else if (event.key === "G") {
      event.preventDefault();
      regenerateViaBrowser();
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
              <button
                class="copy-btn"
                type="button"
                onclick={handleCopyJson}
                disabled={!prettyJson}
                title="Copy JSON to clipboard"
              >
                {copyStatus}
              </button>
            </div>
            <div class="column-content">
              {#if isLoading}
                <div class="placeholder">Regenerating transcript...</div>
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
            <div class="column-header">Human</div>
            <div class="column-content readable">
              {#if isLoading}
                <div class="placeholder">Regenerating transcript...</div>
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
    border-radius: 16px;
    border: 3px solid rgba(139, 125, 107, 0.5);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.3),
      0 10px 10px -5px rgba(0, 0, 0, 0.3);
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
    gap: 0.5rem;
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
    padding: 0.7rem 0.8rem 0.6rem;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid rgba(139, 125, 107, 0.3);
  }

  .copy-btn {
    background: transparent;
    border: 1px solid rgba(139, 125, 107, 0.6);
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
    font-size: 0.7rem;
    font-weight: 500;
    text-transform: none;
    letter-spacing: 0;
    cursor: pointer;
    color: var(--text-color);
    font-family: var(--font-mono);
  }

  .copy-btn:disabled {
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
    gap: 0.5rem;
  }

  .panel-block {
    padding: 0rem 0.6rem;
  }

  .dialogue-line {
    margin: 0.5rem 0;
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
