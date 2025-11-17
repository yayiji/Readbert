<script>
  import { isValidComicDateRange, isValidComicDate } from "$lib/dateUtils.js";
  import {
    initializeDatabases,
    saveLastVisitedComic,
    loadLastVisitedComic,
  } from "$lib/databases.js";
  import { Comic } from "$lib/Comic.js";
  import DatePicker from "./DatePicker.svelte";
  import CommandPaletteSearch from "./CommandPaletteSearch.svelte";
  import TranscriptPanel from "./TranscriptPanel.svelte";
  import ComicImage from "./ComicImage.svelte";
  import Navbar from "./Navbar.svelte";
  import NavigationButtons from "./NavigationButtons.svelte";
  import Footer from "./Footer.svelte";
  import Header from "./Header.svelte";
  import { page } from "$app/stores";
  
  const DILBERT_ALL_BASE = "https://github.com/yayiji/Readbert/blob/main/static/dilbert-all";
  
  // ===== STATE =====
  let currentComic = $state(null);
  let previousComic = $state(null);
  let nextComic = $state(null);
  let transcript = $state(null);
  let isLoading = $state(false);
  let selectedDate = $state("");
  let isCommandPaletteOpen = $state(false);
  let initialized = $state(false);

  let hasValidComic = $derived(
    currentComic && isValidComicDateRange(currentComic.date),
  );

  // ===== UI HANDLERS =====
  function openSearch() {
    isCommandPaletteOpen = true;
  }

  async function handleImageLoad() {
    if (currentComic) {
      transcript = await currentComic.loadTranscript();
    }
    isLoading = false;
    preloadComicImages();
  }

  function preloadComicImages() {
    if (previousComic?.url) {
      new Image().src = previousComic.url;
    }
    if (nextComic?.url) {
      new Image().src = nextComic.url;
    }
  }

  // ===== COMIC LOADING =====
  function updateComicState(comic, prevComic, nextComicData) {
    currentComic = Comic.fromSerialized(comic);
    previousComic = Comic.fromSerialized(prevComic);
    nextComic = Comic.fromSerialized(nextComicData);

    if (currentComic?.date) {
      selectedDate = currentComic.date;
    }

    saveLastVisitedComic(currentComic, previousComic, nextComic);
  }

  async function loadComic(date) {
    if (isLoading || !date || !isValidComicDate(date)) {
      console.error("Invalid date format or already loading:", date);
      return;
    }

    isLoading = true;
    try {
      const result = await Comic.load(date);
      if (result) {
        updateComicState(result.comic, result.previousComic, result.nextComic);
      } else {
        console.error("Failed to load comic for date:", date);
        isLoading = false;
      }
    } catch (error) {
      console.error("Error loading comic:", error);
      isLoading = false;
    }
  }

  async function getRandomComic() {
    if (isLoading) return;

    isLoading = true;
    try {
      const result = await Comic.loadRandom();
      if (result) {
        updateComicState(result.comic, result.previousComic, result.nextComic);
      } else {
        console.error("Failed to load random comic");
        isLoading = false;
      }
    } catch (error) {
      console.error("Error loading random comic:", error);
      isLoading = false;
    }
  }

  // ===== NAVIGATION =====
  function goToPrevious() {
    if (previousComic?.date && !isLoading) {
      loadComic(previousComic.date);
    }
  }

  function goToNext() {
    if (nextComic?.date && !isLoading) {
      loadComic(nextComic.date);
    }
  }

  // ===== SHORTCUTS =====
  function shouldIgnoreShortcut(target) {
    if (!target) return false;
    const tagName = target.tagName;
    return (
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      target?.isContentEditable ||
      target?.closest?.("input, textarea, [contenteditable='true']")
    );
  }

  function openDilbertAllAsset(extension) {
    if (!currentComic?.date) return;
    const year = currentComic.date.split("-")[0];
    const targetUrl = `${DILBERT_ALL_BASE}/${year}/${currentComic.date}.${extension}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  function handleShortcutKeydown(event) {
    if (isCommandPaletteOpen || shouldIgnoreShortcut(event.target)) return;
    if (event.key === "w") {
      event.preventDefault();
      openDilbertAllAsset("gif");
    } else if (event.key === "e") {
      event.preventDefault();
      openDilbertAllAsset("json");
    }
  }

  // ===== REACTIVE EFFECTS =====

  // Initialize on mount
  $effect(() => {
    if (initialized) return;

    (async () => {
      const urlDate = $page.url.searchParams.get("date");
      if (urlDate && isValidComicDateRange(urlDate)) {
        await loadComic(urlDate);
        initialized = true;
        return;
      }

      const savedComic = loadLastVisitedComic();
      if (savedComic) {
        updateComicState(
          savedComic.currentComic,
          savedComic.previousComic,
          savedComic.nextComic,
        );
        if (savedComic.currentComic?.transcript) {
          transcript = savedComic.currentComic.transcript;
        }
      } else {
        await getRandomComic();
      }

      initialized = true;
    })();
  });

  // Initialize databases early for better performance
  $effect(() => {
    initializeDatabases().catch((error) => {
      console.error("Failed to initialize databases:", error);
    });
  });

  // Watch for selectedDate changes (from date picker)
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

  // Watch for URL parameter changes (from search)
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

  // Register keyboard shortcuts for diving into GitHub sources
  $effect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("keydown", handleShortcutKeydown);
    return () => {
      document.removeEventListener("keydown", handleShortcutKeydown);
    };
  });
</script>

<svelte:head>
  <title>DILBERT COMICS - Complete Collection</title>
</svelte:head>

<Navbar onSearchClick={openSearch} />

<main class="container">
  <Header />

  {#if hasValidComic}
    <section class="comic-section">
      <NavigationButtons
        {previousComic}
        {nextComic}
        {isLoading}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onRandom={getRandomComic}
      />

      <DatePicker bind:value={selectedDate} />

      <ComicImage {currentComic} {isLoading} onImageLoad={handleImageLoad} />

      <TranscriptPanel {transcript} />
    </section>
  {/if}
</main>

<Footer />

<CommandPaletteSearch bind:isOpen={isCommandPaletteOpen} bind:selectedDate />

<style>
  .container {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 60px var(--spacing-lg) 0;
    font-family: var(--font-serif);
    background-color: var(--bg-main);
    color: var(--text-color);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  .comic-section {
    text-align: center;
    margin: 0 auto 30px;
    max-width: var(--max-width);
  }

  @media (max-width: 600px) {
    .container {
      padding: 60px var(--spacing-sm) 0;
    }
  }
</style>
