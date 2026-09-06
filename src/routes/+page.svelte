<script>
  import { isValidComicDateRange, isValidComicDate } from "$lib/dateUtils.js";
  import { initializeDatabases } from "$lib/databases.js";
  import { Comic } from "$lib/Comic.js";
  import { visitedHistory } from "$lib/visitedHistory.js";
  import DatePicker from "./picker/DatePicker.svelte";
  import CommandPaletteSearch from "./search/CommandPaletteSearch.svelte";
  import TranscriptPanel from "./TranscriptPanel.svelte";
  import ComicImage from "./ComicImage.svelte";
  import Navbar from "./Navbar.svelte";
  import NavigationButtons from "./NavigationButtons.svelte";
  import Footer from "./Footer.svelte";
  import Header from "./Header.svelte";
  import TranscriptDebugPopup from "./TranscriptDebugPopup.svelte";
  import { page } from "$app/stores";
  import { dev } from "$app/environment";

  let currentComic = $state(null);
  let previousComic = $state(null);
  let nextComic = $state(null);
  let nextRandomComic = $state(null);

  let transcript = $state(null);
  let isLoading = $state(false);
  let selectedDate = $state("");
  let isCommandPaletteOpen = $state(false);
  let initialized = $state(false);

  let hasValidComic = $derived(
    currentComic && isValidComicDateRange(currentComic.date),
  );

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
    for (const comic of [previousComic, nextComic, nextRandomComic]) {
      if (comic?.url) new Image().src = comic.url;
    }
  }

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

    Comic.loadRandom().then((result) => {
      if (result?.comic) {
        nextRandomComic = Comic.fromSerialized(result.comic);
      }
    });
  }

  function applyLoadResult(result, ...failArgs) {
    if (result) {
      updateComicState(result.comic, result.previousComic, result.nextComic);
    } else {
      console.error(...failArgs);
      isLoading = false;
    }
  }

  async function loadComic(date) {
    if (isLoading || !date || !isValidComicDate(date)) {
      console.error("Invalid date format or already loading:", date);
      return;
    }

    isLoading = true;
    try {
      applyLoadResult(
        await Comic.load(date),
        "Failed to load comic for date:",
        date,
      );
    } catch (error) {
      console.error("Error loading comic:", error);
      isLoading = false;
    }
  }

  async function getRandomComic() {
    if (isLoading) return;

    if (nextRandomComic?.date) {
      loadComic(nextRandomComic.date);
      return;
    }

    isLoading = true;
    try {
      applyLoadResult(await Comic.loadRandom(), "Failed to load random comic");
    } catch (error) {
      console.error("Error loading random comic:", error);
      isLoading = false;
    }
  }

  function goToPrevious() {
    if (previousComic?.date && !isLoading) loadComic(previousComic.date);
  }

  function goToNext() {
    if (nextComic?.date && !isLoading) loadComic(nextComic.date);
  }

  $effect(() => {
    if (initialized) return;

    (async () => {
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
      initializeDatabases();
    })();
  });

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
  <title>Dilbert Comics</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
</svelte:head>

<Navbar onSearchClick={openSearch} />

<div class="page-body">
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
          shortcutsDisabled={isCommandPaletteOpen}
        />

        <DatePicker bind:selectedDate />

        <ComicImage
          {currentComic}
          {isLoading}
          onImageLoad={handleImageLoad}
          shortcutsDisabled={isCommandPaletteOpen}
        />

        <TranscriptPanel {transcript} />
      </section>
    {/if}
  </main>

  <Footer />
</div>

<CommandPaletteSearch bind:isOpen={isCommandPaletteOpen} bind:selectedDate />

{#if dev}
  <TranscriptDebugPopup {currentComic} shortcutsDisabled={isCommandPaletteOpen} />
{/if}

<style>
  .page-body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main {
    flex: 1;
    width: 100%;
    margin: 0;
    padding: 60px var(--spacing-lg) 0;
    background-color: var(--color-bg);
    color: var(--color-text);
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
      padding: 60px var(--spacing-2) 0;
    }
  }
</style>
