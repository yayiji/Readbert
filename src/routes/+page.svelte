<script>
  import { formatDate, loadTranscriptIndependently } from "$lib/comicsUtils.js";
  import {
    loadRandomComicBrowser,
    loadComicBrowser,
  } from "$lib/browserLoader.js";
  import { isValidComicDateRange } from "$lib/comicsClient.js";
  import { onMount } from "svelte";
  import DatePicker from "$lib/DatePicker.svelte";

  // Browser-only state management
  let currentComic = $state(null);
  let previousComic = $state(null);
  let nextComic = $state(null);
  let transcript = $state(null);
  let isLoading = $state(false);
  let isLoadingTranscript = $state(false);
  let selectedDate = $state("");

  // Watch for selectedDate changes and load the comic
  let previousSelectedDate = "";
  $effect(() => {
    if (
      selectedDate &&
      selectedDate !== previousSelectedDate &&
      selectedDate !== currentComic?.date
    ) {
      previousSelectedDate = selectedDate;
      if (isValidComicDateRange(selectedDate)) {
        loadComic(selectedDate);
      }
    }
  });

  const STORAGE_KEY = "lastVisitedComic";
  const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Save comic data to localStorage
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

  // Load comic data from localStorage
  function loadComicFromStorage() {
    if (typeof localStorage === "undefined") return null;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const comicData = JSON.parse(saved);
      if (
        comicData.savedAt &&
        Date.now() - comicData.savedAt < STORAGE_EXPIRY
      ) {
        // Validate that the saved comic date is within valid range
        if (
          comicData.currentComic?.date &&
          isValidComicDateRange(comicData.currentComic.date)
        ) {
          return comicData;
        } else {
          // Clear invalid cached data
          localStorage.removeItem(STORAGE_KEY);
          console.log("Cleared invalid cached comic data");
        }
      }
    } catch (error) {
      console.error("Error parsing saved comic data:", error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
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

  // Update comic state with transcript loading
  async function updateComicStateWithTranscript(
    comic,
    prevComic,
    nextComicData
  ) {
    currentComic = comic;
    previousComic = prevComic;
    nextComic = nextComicData;

    // Set the selected date to the current comic date
    if (comic?.date) {
      selectedDate = comic.date;
      await loadTranscript(comic.date);
    }

    saveComicToStorage(comic, prevComic, nextComicData, transcript);
  }

  // Update comic state
  function updateComicState(comic, prevComic, nextComicData) {
    currentComic = comic;
    previousComic = prevComic;
    nextComic = nextComicData;

    // Set the selected date to the current comic date
    if (comic?.date) {
      selectedDate = comic.date;
    }

    saveComicToStorage(comic, prevComic, nextComicData);
  }

  // Initialize comic data on mount
  onMount(async () => {
    const savedComic = loadComicFromStorage();
    if (savedComic) {
      // Load saved comic state
      updateComicState(
        savedComic.currentComic,
        savedComic.previousComic,
        savedComic.nextComic
      );

      // Restore saved transcript if available
      if (savedComic.transcript) {
        transcript = savedComic.transcript;
      } else if (savedComic.currentComic?.date) {
        // Load transcript for saved comic
        await loadTranscript(savedComic.currentComic.date);
      }
    } else {
      // Load random comic using browser-only logic
      await getRandomComic();
    }
  });

  async function loadComic(date) {
    if (isLoading) return;

    // Validate the date before proceeding
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error("Invalid date format:", date);
      return;
    }

    isLoading = true;
    try {
      const result = await loadComicBrowser(date);
      if (result) {
        await updateComicStateWithTranscript(
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
        await updateComicStateWithTranscript(
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

  function goToPrevious() {
    if (previousComic && !isLoading) {
      // Additional validation to prevent unexpected jumps
      if (
        !previousComic.date ||
        !/^\d{4}-\d{2}-\d{2}$/.test(previousComic.date)
      ) {
        console.error("Invalid previous comic date:", previousComic);
        return;
      }
      loadComic(previousComic.date);
    }
  }

  function goToNext() {
    if (nextComic && !isLoading) {
      // Additional validation to prevent unexpected jumps
      if (!nextComic.date || !/^\d{4}-\d{2}-\d{2}$/.test(nextComic.date)) {
        console.error("Invalid next comic date:", nextComic);
        return;
      }
      loadComic(nextComic.date);
    }
  }

  function handleDateKeydown(event) {
    if (event.key === "Enter") {
      handleDateSubmit();
    }
  }

  function handleDateSubmit() {
    if (selectedDate && isValidComicDateRange(selectedDate)) {
      loadComic(selectedDate);
    } else {
      selectedDate = currentComic?.date || "";
    }
  }
</script>

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

  {#if currentComic}
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
          {isLoading ? "LOADING..." : "⚀ RANDOM"}
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
      {#if transcript}
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

  <footer class="footer">
    <div class="footer-content">
      <p class="copyright">Dilbert © Scott Adams</p>
      <p class="footer-note">
        All comics are displayed for educational and archival purposes
      </p>
    </div>
  </footer>
</main>

<style>
  :global(body) {
    background-color: #f5f4f0;
    margin: 0;
    padding: 0;
  }

  .container {
    --main-color: #333;
    --accent-color: #6d5f4d;
    --border-color: #8b7d6b;
    --bg-light: #f8f6f0;
    --bg-white: #fff;
    --shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    --max-width: 800px;
    --font-serif: "Times New Roman", Times, serif;
    --font-mono: "Courier New", "Courier", monospace;

    width: 100%;
    margin: 0;
    padding: 20px;
    font-family: var(--font-serif);
    background-color: #f5f4f0;
    min-height: 100vh;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .header {
    margin-top: 5px;
    margin-bottom: 15px;
    text-align: center;
    padding: 10px 0;
    max-width: var(--max-width);
    margin-left: auto;
    margin-right: auto;
  }

  .title {
    font-size: 32px;
    font-weight: bold;
    color: var(--main-color);
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
    margin-bottom: 15px;
    padding: 5px;
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

  .nav-btn {
    padding: 10px 16px;
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
    min-width: 80px;
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

  .transcript-container {
    margin: 20px auto 0;
    max-width: 600px;
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
    color: var(--main-color);
    word-wrap: break-word;
  }

  .dialogue-line:last-child {
    margin-bottom: 0;
  }

  .dialogue-line:first-child {
    margin-top: 0;
  }

  .footer {
    margin-top: auto;
    padding: 200px 0 20px 0;
    text-align: center;
  }

  .footer-content {
    max-width: var(--max-width);
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

  /* Date Picker Styles */

  @media (max-width: 600px) {
    .header {
      margin-top: 20px;
      margin-bottom: 25px;
    }
    .container {
      padding: 12px;
    }

    .title {
      font-size: 24px;
      letter-spacing: 1px;
    }

    .subtitle {
      font-size: 14px;
    }

    .navigation {
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

    .transcript-container {
      margin: 15px auto 0;
      max-width: calc(100% - 20px);
      padding: 0 10px;
    }

    .dialogue-line {
      font-size: 14px;
      margin: 2px 0;
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
