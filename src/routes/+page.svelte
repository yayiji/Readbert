<script>
  import { isValidComicDateRange, isValidComicDate } from "$lib/dateUtils.js";
  import { initializeDatabases } from "$lib/databases.js";
  import { Comic } from "$lib/Comic.js";
  import { visitedHistory } from "$lib/visitedHistory.js";
  import DatePicker from "./DatePicker.svelte";
  import CommandPaletteSearch from "./search/CommandPaletteSearch.svelte";
  import TranscriptPanel from "./TranscriptPanel.svelte";
  import ComicImage from "./ComicImage.svelte";
  import Navbar from "./Navbar.svelte";
  import NavigationButtons from "./NavigationButtons.svelte";
  import Footer from "./Footer.svelte";
  import Header from "./Header.svelte";
  import TranscriptDebugPopup from "./TranscriptDebugPopup.svelte";
  import { page } from "$app/stores";
  
  
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
  function updateUrlPath(date) {
    if (typeof window === "undefined") return;

    try {
      const url = new URL(window.location.href);
      url.pathname = date ? `/${date}` : "/";
      window.history.replaceState(window.history.state, "", url);
    } catch (error) {
      console.error("Failed to update date URL:", error);
    }
  }

  function updateComicState(comic, prevComic, nextComicData) {
    currentComic = Comic.fromSerialized(comic);
    previousComic = Comic.fromSerialized(prevComic);
    nextComic = Comic.fromSerialized(nextComicData);

    if (currentComic?.date) {
      selectedDate = currentComic.date;
      updateUrlPath(currentComic.date);
      visitedHistory.addVisit(currentComic.date);
    } else {
      updateUrlPath(null);
    }
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

  // ===== REACTIVE EFFECTS =====

  // Initialize on mount
  $effect(() => {
    if (initialized) return;

    (async () => {
      // Prefer route param (e.g. /[date]) and fall back to URL pathname
      const paramDate = $page.params?.date;
      const segments = $page.url.pathname.split("/").filter(Boolean);
      const urlDate = paramDate ?? segments[0];

      console.log("init date param: ", {
        paramDate,
        pathname: $page.url.pathname,
        urlDate,
      });

      if (urlDate && isValidComicDateRange(urlDate)) {
        await loadComic(urlDate);
        initialized = true;
        return;
      }

      const lastVisitedDate = visitedHistory.loadLastVisited();
      if (lastVisitedDate) {
        await loadComic(lastVisitedDate);
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

  // Watch for selectedDate changes (from date picker or search palette)
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

</script>

<svelte:head>
  <title>DILBERT COMICS</title>
</svelte:head>

<Navbar onSearchClick={openSearch} />

<main>
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

      <DatePicker bind:selectedDate />

      <ComicImage
        {currentComic}
        {isLoading}
        onImageLoad={handleImageLoad}
        onSelectDate={(date) => (selectedDate = date)}
        shortcutsDisabled={isCommandPaletteOpen}
      />

      <TranscriptPanel {transcript} />
    </section>
  {/if}
</main>

<Footer />

<CommandPaletteSearch bind:isOpen={isCommandPaletteOpen} bind:selectedDate />

<TranscriptDebugPopup {currentComic} />

<style>
  main {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 60px var(--spacing-lg) 0;
    /* font-family: var(--font-serif); */
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
    main {
      padding: 60px var(--spacing-sm) 0;
    }
  }
</style>
