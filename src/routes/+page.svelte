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
  :global(:root) {
    --main-color: #fafafa;
    --accent-color: #6d5f4d;
    --border-color: #8b7d6b;
    --bg-main: #fafafa;
    --bg-light: #f8f6f0;
    --bg-white: #fff;
  }

  :global(body) {
    background-color: #fafafa;
    margin: 0;
    padding: 0;
  }

  .navbar {
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(248, 246, 240, 0.5);
    /* border: 2px solid rgba(220, 215, 200, 1); */
    border: 2px solid rgba(139, 125, 107, 0.1);
    border-radius: 12px;
    box-shadow: 0 0px 0px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    z-index: 100;
    width: calc(100% - 40px);
    max-width: 750px;
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px 12px 24px;
    width: 100%;
  }

  .nav-brand h1 {
    margin: 0;
    font-size: 18px;
    color: black;
    padding: 0px 0px;
    font-weight: 600;
  }

  .nav-buttons {
    display: flex;
    gap: 12px;
  }

  .search-btn {
    background: transparent;
    border: 0px solid #ddd;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    color: #333;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-buttons button {
    padding: 8px;
  }

  .search-btn:hover {
    background: #e5e5e5;
    border-color: #ccc;
  }

  .footer {
    margin-top: auto;
    padding: 250px 0 20px 0;
    text-align: center;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .copyright {
    font-size: 14px;
    font-weight: bold;
    color: var(--accent-color);
    margin: 0 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .footer-note {
    font-size: 12px;
    color: var(--border-color);
    margin: 0;
    font-style: italic;
  }

  .container {
    --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --max-width: 800px;
    --font-serif: "Times New Roman", Times, serif;
    --font-mono: "Courier New", "Courier", monospace;

    width: 100%;
    margin: 0;
    padding: 82px 20px 0 20px; /* Account for fixed navbar with margin */
    font-family: var(--font-serif);
    background-color: #fafafa;
    min-height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .header {
    margin-top: 40px;
    margin-bottom: 42px;
    text-align: center;
    padding: 0px;
    max-width: var(--max-width);
    margin-left: auto;
    margin-right: auto;
  }

  .title {
    font-size: 32px;
    font-weight: bold;
    color: black;
    margin: 0 0 0px 0;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
    font-style: italic;
  }

  .comic-section {
    text-align: center;
    margin-bottom: 30px;
    max-width: var(--max-width);
    margin-left: auto;
    margin-right: auto;
  }

  .navigation {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 27px;
    padding: 0px;
  }

  .nav-btn {
    padding: 9px 14px;
    background-color: var(--bg-light);
    border: 2px solid var(--border-color);
    font-family: var(--font-serif);
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: all 0.2s ease;
    color: #3a3a3a;
    white-space: nowrap;
    min-width: 74px;
  }

  /* Apply hover styles only on hover-capable devices */
  @media (hover: hover) and (pointer: fine) {
    .nav-btn:hover:not(:disabled) {
      background-color: var(--border-color);
      color: var(--bg-light);
    }
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: #ebe8e0;
    color: #999;
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

  .comic-container {
    display: inline-block;
    background-color: var(--bg-white);
    padding: 15px;
    border: 2px solid #d4c5a9;
    box-shadow: var(--shadow);
    margin-top: 3px;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    border: 1px solid #ccc;
  }

  .transcript-container {
    margin: 10px auto 0;
    max-width: 550px;
    width: 100%;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .transcript-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #f5f4f0;
    border: 0px solid #ddd;
    /* font-family: "SF Mono","Courier New", monospace; */
    font-family: "Courier New", monospace;
    margin: 0 auto;
  }

  .transcript-table td {
    padding: 7px 16px;
    vertical-align: top;
    text-align: left;
  }

  .transcript-table tr:last-child td {
    border-bottom: none;
  }

  .dialogue-cell {
    line-height: 1.4;
    text-align: left;
  }

  .dialogue-line {
    margin: 4px 0;
    font-size: 15px;
    color: black;
    word-wrap: break-word;
  }

  .dialogue-line:last-child {
    margin-bottom: 0;
  }

  .dialogue-line:first-child {
    margin-top: 0;
  }

  /* Date Picker Styles */

  @media (max-width: 600px) {
    .container {
      padding: 0px 12px;
      padding: 72px 12px 0 12px;
    }

    .header {
      margin-top: 25px;
      margin-bottom: 32px;
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
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-btn {
      padding: 8px 12px;
      font-size: 11px;
      min-width: 70px;
    }

    .comic-container {
      padding: 10px;
    }

    .navbar {
      width: calc(100% - 30px);
      top: 12px;
    }

    .nav-container {
      padding: 8px 10px 8px 18px;
    }

    .nav-brand h1 {
      font-size: 16px;
    }

    .nav-buttons {
      gap: 8px;
    }

    .nav-buttons button {
      padding: 8px;
    }

    .footer {
      padding: 100px 0 20px 0;
    }

    .copyright {
      font-size: 13px;
    }

    .footer-note {
      font-size: 11px;
    }
  }
</style>
