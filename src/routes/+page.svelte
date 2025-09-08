<script>
  import { formatDate, loadTranscriptIndependently } from "$lib/comicsUtils.js";
  import {
    loadRandomComicBrowser,
    loadComicBrowser,
  } from "$lib/browserLoader.js";
  import { isValidComicDateRange } from "$lib/comicsClient.js";
  import DatePicker from "$lib/DatePicker.svelte";
  import CommandPaletteSearch from "$lib/CommandPaletteSearch.svelte";
  import { page } from "$app/stores";

  // State management using $state rune
  let currentComic = $state(null);
  let previousComic = $state(null);
  let nextComic = $state(null);
  let transcript = $state(null);
  let isLoading = $state(false);
  let isLoadingTranscript = $state(false);
  let selectedDate = $state("");
  let isCommandPaletteOpen = $state(false);

  // Derived state
  let initialized = $state(false);
  let hasValidComic = $derived(
    currentComic && isValidComicDateRange(currentComic.date)
  );

  function openSearch() {
    isCommandPaletteOpen = true;
  }

  // Constants
  const STORAGE_KEY = "lastVisitedComic";
  const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Storage utilities
  function saveComicToStorage(comic, prevComic, nextComic, comicTranscript) {
    if (typeof localStorage === "undefined") return;

    const comicData = {
      currentComic: comic,
      previousComic: prevComic,
      nextComic: nextComic,
      transcript: comicTranscript,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comicData));
  }

  function loadComicFromStorage() {
    if (typeof localStorage === "undefined") return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const comicData = JSON.parse(saved);
      const isValid =
        comicData.savedAt &&
        Date.now() - comicData.savedAt < STORAGE_EXPIRY &&
        comicData.currentComic?.date &&
        isValidComicDateRange(comicData.currentComic.date);

      if (isValid) {
        return comicData;
      } else {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    } catch (error) {
      console.error("Error parsing saved comic data:", error);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  // Load transcript for a given date
  async function loadTranscript(date) {
    if (!date) {
      transcript = null;
      return null;
    }

    isLoadingTranscript = true;
    try {
      const transcriptData = await loadTranscriptIndependently(date);
      transcript = transcriptData;
      return transcriptData;
    } catch (error) {
      console.error("Error loading transcript:", error);
      transcript = null;
      return null;
    } finally {
      isLoadingTranscript = false;
    }
  }

  // Update comic state and save to storage
  async function updateComicState(
    comic,
    prevComic,
    nextComicData,
    shouldLoadTranscript = true
  ) {
    currentComic = comic;
    previousComic = prevComic;
    nextComic = nextComicData;

    if (comic?.date) {
      selectedDate = comic.date;
      if (shouldLoadTranscript) {
        await loadTranscript(comic.date);
      }
    }

    saveComicToStorage(comic, prevComic, nextComicData, transcript);
  }

  async function loadComic(date) {
    if (isLoading || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error("Invalid date format or already loading:", date);
      return;
    }

    isLoading = true;
    try {
      const result = await loadComicBrowser(date);
      if (result) {
        await updateComicState(
          result.comic,
          result.previousComic,
          result.nextComic
        );
      } else {
        console.error("Failed to load comic for date:", date);
      }
    } catch (error) {
      console.error("Error loading comic:", error);
    } finally {
      isLoading = false;
    }
  }

  async function getRandomComic() {
    if (isLoading) return;

    isLoading = true;
    try {
      const result = await loadRandomComicBrowser();
      if (result) {
        await updateComicState(
          result.comic,
          result.previousComic,
          result.nextComic
        );
      } else {
        console.error("Failed to load random comic");
      }
    } catch (error) {
      console.error("Error loading random comic:", error);
    } finally {
      isLoading = false;
    }
  }

  // Navigation functions
  function goToPrevious() {
    if (
      previousComic?.date &&
      !isLoading &&
      /^\d{4}-\d{2}-\d{2}$/.test(previousComic.date)
    ) {
      loadComic(previousComic.date);
    }
  }

  function goToNext() {
    if (
      nextComic?.date &&
      !isLoading &&
      /^\d{4}-\d{2}-\d{2}$/.test(nextComic.date)
    ) {
      loadComic(nextComic.date);
    }
  }

  // Effects for reactive behavior
  // Watch for selectedDate changes and load the comic (only after initialization)
  $effect(() => {
    if (
      initialized &&
      selectedDate &&
      selectedDate !== currentComic?.date &&
      isValidComicDateRange(selectedDate)
    ) {
      loadComic(selectedDate);
    }
  });

  // Watch for URL parameter changes (for search result navigation)
  $effect(() => {
    if (!initialized) return;

    const urlDate = $page.url.searchParams.get("date");
    if (
      urlDate &&
      isValidComicDateRange(urlDate) &&
      urlDate !== currentComic?.date
    ) {
      loadComic(urlDate);
    }
  });

  // Initialize comic data on mount (run once)
  $effect(() => {
    if (initialized) return;

    const initializeComic = async () => {
      // Check for date parameter in URL first
      const urlDate = $page.url.searchParams.get("date");
      if (urlDate && isValidComicDateRange(urlDate)) {
        await loadComic(urlDate);
        initialized = true;
        return;
      }

      const savedComic = loadComicFromStorage();
      if (savedComic) {
        // Load saved comic state
        await updateComicState(
          savedComic.currentComic,
          savedComic.previousComic,
          savedComic.nextComic,
          false // Don't load transcript yet
        );

        // Restore saved transcript if available, otherwise load it
        if (savedComic.transcript) {
          transcript = savedComic.transcript;
        } else if (savedComic.currentComic?.date) {
          await loadTranscript(savedComic.currentComic.date);
        }
      } else {
        // Load random comic if no saved data
        await getRandomComic();
      }

      initialized = true;
    };

    initializeComic();
  });
</script>

<nav class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
      <h1>READBERT</h1>
    </div>
    <div class="nav-buttons">
      <button onclick={openSearch} class="search-btn" aria-label="Search">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </button>
    </div>
  </div>
</nav>

<svelte:head>
  <title>DILBERT COMICS - Complete Collection</title>
  <meta
    name="description"
    content="Browse the complete DILBERT COMICS collection"
  />
</svelte:head>

<main class="container">
  <header class="header">
    <h1 class="title">DILBERT COMICS</h1>
    <p class="subtitle">
      The Complete Collection of Scott Adams' Dilbert Comics
    </p>
  </header>

  {#if hasValidComic}
    <section class="comic-section">
      <!-- Navigation buttons -->
      <div class="navigation">
        <button
          class="nav-btn"
          disabled={!previousComic || isLoading}
          onclick={goToPrevious}
        >
          ◄ PREV
        </button>

        <button
          class="nav-btn random"
          disabled={isLoading}
          onclick={getRandomComic}
        >
          {isLoading ? "LOADING..." : "RANDOM"}
        </button>

        <button
          class="nav-btn"
          disabled={!nextComic || isLoading}
          onclick={goToNext}
        >
          NEXT ►
        </button>
      </div>

      <DatePicker bind:value={selectedDate} min="1989-04-16" max="2023-03-12" />

      <div class="comic-container">
        <img
          src={currentComic.url}
          alt="Dilbert comic from {currentComic.date}"
          class="comic-image"
        />
      </div>

      <!-- Transcript table -->
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
    </section>
  {/if}
</main>

<footer class="footer">
  <div class="footer-content">
    <p class="copyright">Dilbert © Scott Adams</p>
    <p class="footer-note">
      All comics are displayed for educational and archival purposes
    </p>
  </div>
</footer>

<!-- Command Palette -->
<CommandPaletteSearch bind:isOpen={isCommandPaletteOpen} bind:selectedDate />

<style>
  /* ===== CSS VARIABLES ===== */
  :global(:root) {
    /* Colors */
    --main-color: #fafafa;
    --accent-color: #6d5f4d;
    --border-color: #8b7d6b;
    --text-color: #000;
    --text-muted: #666;
    
    /* Backgrounds */
    --bg-main: #fafafa;
    --bg-light: #f8f6f0;
    --bg-white: #fff;
    --bg-transcript: #f5f4f0;
    --bg-disabled: #ebe8e0;
    
    /* Layout */
    --max-width: 800px;
    --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --navbar-shadow: 0 0px 0px rgba(0, 0, 0, 0.1);
    --border-radius: 6px;
    
    /* Typography */
    --font-serif: "Times New Roman", Times, serif;
    --font-mono: "Courier New", monospace;
    
    /* Spacing */
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 20px;
    --spacing-xl: 24px;
  }

  /* ===== GLOBAL STYLES ===== */
  :global(body) {
    background-color: var(--bg-main);
    margin: 0;
    padding: 0;
  }

  /* ===== NAVBAR STYLES ===== */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    z-index: 100;
    
    /* Appearance */
    background: rgba(248, 246, 240, 0.1);
    border-bottom: 0.1px solid rgba(139, 125, 107, 0.2);
    box-shadow: var(--navbar-shadow);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    /* max-width: 1200px; */
    margin: 0 auto;
    padding: var(--spacing-md) var(--spacing-xl);
  }

  .nav-brand h1 {
    margin: 0;
    padding: 0;
    padding-left: 6px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }

  .nav-buttons {
    display: flex;
    gap: var(--spacing-md);
  }

  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .search-btn:hover {
    background: rgba(109, 95, 77, 0.1);
  }

  /* ===== LAYOUT STYLES ===== */
  .container {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 60px var(--spacing-lg) 0;
    font-family: var(--font-serif);
    background-color: var(--bg-main);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .header {
    margin: 40px auto 42px;
    text-align: center;
    max-width: var(--max-width);
  }

  .title {
    margin: 0;
    font-size: 32px;
    font-weight: bold;
    color: var(--text-color);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .subtitle {
    margin: 0;
    font-size: 16px;
    color: var(--text-muted);
    font-style: italic;
  }

  /* ===== COMIC SECTION STYLES ===== */
  .comic-section {
    text-align: center;
    margin: 0 auto 30px;
    max-width: var(--max-width);
  }

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
    font-size: 12px;
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

  /* Comic Container */
  .comic-container {
    display: inline-block;
    background-color: var(--bg-white);
    padding: 15px;
    border: 2px solid var(--border-color);
    box-shadow: var(--shadow);
    margin-top: 3px;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    border: 1px solid var(--border-color);
  }

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
    padding: 7px 16px;
    vertical-align: top;
    text-align: left;
  }

  .dialogue-cell {
    line-height: 1.4;
    text-align: left;
  }

  .dialogue-line {
    margin: var(--spacing-xs) 0;
    font-size: 15px;
    color: var(--text-color);
    word-wrap: break-word;
  }

  .dialogue-line:first-child {
    margin-top: 0;
  }

  .dialogue-line:last-child {
    margin-bottom: 0;
  }

  /* ===== FOOTER STYLES ===== */
  .footer {
    margin-top: auto;
    padding: 250px 0 var(--spacing-lg) 0;
    text-align: center;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .copyright {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 14px;
    font-weight: bold;
    color: var(--accent-color);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .footer-note {
    margin: 0;
    font-size: 12px;
    color: var(--border-color);
    font-style: italic;
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .container {
      padding: 60px var(--spacing-md) 0;
    }

    .header {
      margin: 25px auto 32px;
    }

    .title {
      font-size: 24px;
      letter-spacing: 1px;
    }

    .subtitle {
      font-size: 14px;
    }

    .navigation {
      margin-bottom: 25px;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .nav-btn {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: 11px;
      min-width: 70px;
    }

    .comic-container {
      padding: 10px;
    }

    .nav-container {
      padding: var(--spacing-sm) 16px;
    }

    .nav-brand h1 {
      font-size: 16px;
    }

    .footer {
      padding: 100px 0 var(--spacing-lg) 0;
    }

    .copyright {
      font-size: 13px;
    }

    .footer-note {
      font-size: 11px;
    }
  }
</style>
