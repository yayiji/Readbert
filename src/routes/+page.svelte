<script>
  import { isValidComicDateRange, isValidComicDate } from "$lib/dateUtils.js";
  import { loadRandomComic, loadComicBrowser } from "$lib/comicsClient.js";
  import { loadTranscript, initializeDatabases } from "$lib/databases.js";
  import { Comic } from "$lib/Comic.js";
  import { saveLastVisitedComic, loadLastVisitedComic } from "$lib/comicStorage.js";
  import DatePicker from "./DatePicker.svelte";
  import CommandPaletteSearch from "./CommandPaletteSearch.svelte";
  import TranscriptPanel from "./TranscriptPanel.svelte";
  import ComicImage from "./ComicImage.svelte";
  import Navbar from "./Navbar.svelte";
  import NavigationButtons from "./NavigationButtons.svelte";
  import Footer from "./Footer.svelte";
  import Header from "./Header.svelte";
  import { page } from "$app/stores";

  // State management using $state rune
  let currentComic = $state(null);
  let previousComic = $state(null);
  let nextComic = $state(null);
  let transcript = $state(null);
  let isLoading = $state(false);
  let selectedDate = $state("");
  let isCommandPaletteOpen = $state(false);
  let initialized = $state(false);

  // Derived state
  let hasValidComic = $derived(
    currentComic && isValidComicDateRange(currentComic.date)
  );

  function openSearch() {
    isCommandPaletteOpen = true;
  }

  // Helper function to hydrate comic instances
  function hydrateComic(comic) {
    return Comic.fromSerialized(comic);
  }

  // Load transcript for a given date
  async function loadTranscriptForComic(date) {
    if (!date) {
      transcript = null;
      return null;
    }

    const transcriptData = await loadTranscript(date);
    transcript = transcriptData;
    return transcriptData;
  }

  // Preload comic images for faster navigation
  async function preloadComicImages() {
    // Preload previous comic image
    if (previousComic?.url) {
      const prevImg = new Image();
      prevImg.src = previousComic.url;
    }

    // Preload next comic image
    if (nextComic?.url) {
      const nextImg = new Image();
      nextImg.src = nextComic.url;
    }
  }

  // Handler for when comic image loads successfully
  function handleImageLoad() {
    if (currentComic?.date) {
      // Load transcript immediately when image is ready
      loadTranscriptForComic(currentComic.date);
    }

    // Clear loading state now that image has loaded
    isLoading = false;

    // Preload adjacent comic images for instant navigation
    preloadComicImages();
  }

  // Update comic state and save to storage
  async function updateComicState(
    comic,
    prevComic,
    nextComicData,
    shouldLoadTranscript = true
  ) {
    const normalizedCurrent = hydrateComic(comic);
    const normalizedPrevious = hydrateComic(prevComic);
    const normalizedNext = hydrateComic(nextComicData);

    currentComic = normalizedCurrent;
    previousComic = normalizedPrevious;
    nextComic = normalizedNext;

    // Don't clear previous transcript - keep it visible until new one loads
    // This provides a better user experience with no blank state

    if (normalizedCurrent?.date) {
      selectedDate = normalizedCurrent.date;
      // Don't load transcript here - wait for image to load successfully
      // The image onload handler will trigger transcript loading
    }

    saveLastVisitedComic(
      normalizedCurrent,
      normalizedPrevious,
      normalizedNext,
      transcript
    );
  }

  async function loadComic(date) {
    if (isLoading || !date || !isValidComicDate(date)) {
      console.error("Invalid date format or already loading:", date);
      return;
    }

    isLoading = true;
    try {
      // Add artificial delay for local testing to see loading effect
      const TESTING_DELAY = 0; // milliseconds

      if (TESTING_DELAY > 0) {
        await new Promise((resolve) => setTimeout(resolve, TESTING_DELAY));
      }

      const result = await loadComicBrowser(date);
      if (result) {
        await updateComicState(
          result.comic,
          result.previousComic,
          result.nextComic
        );
      } else {
        console.error("Failed to load comic for date:", date);
        isLoading = false; // Only clear on error
      }
    } catch (error) {
      console.error("Error loading comic:", error);
      isLoading = false; // Only clear on error
    }
    // Don't set isLoading = false here - let handleImageLoad do it when image actually loads
  }

  async function getRandomComic() {
    if (isLoading) return;

    isLoading = true;
    try {
      const result = await loadRandomComic();
      if (result) {
        await updateComicState(
          result.comic,
          result.previousComic,
          result.nextComic
        );
      } else {
        console.error("Failed to load random comic");
        isLoading = false; // Only clear on error
      }
    } catch (error) {
      console.error("Error loading random comic:", error);
      isLoading = false; // Only clear on error
    }
    // Don't set isLoading = false here - let handleImageLoad do it
  }

  // Navigation functions
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

      const savedComic = loadLastVisitedComic();
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
          await loadTranscriptForComic(savedComic.currentComic.date);
        }
      } else {
        // Load random comic if no saved data
        await getRandomComic();
      }

      initialized = true;
    };

    initializeComic();
  });

  // Initialize databases early for better performance (optional but recommended)
  $effect(() => {
    initializeDatabases().catch(error => {
      console.error("Failed to initialize databases:", error);
    });
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
      <!-- Navigation buttons -->
      <NavigationButtons
        {previousComic}
        {nextComic}
        {isLoading}
        onPrevious={goToPrevious}
        onNext={goToNext}
        onRandom={getRandomComic}
      />

      <DatePicker bind:value={selectedDate} min="1989-04-16" max="2023-03-12" />

      <!-- Comic image section -->
      <ComicImage {currentComic} {isLoading} onImageLoad={handleImageLoad} />

      <!-- Transcript section -->
      <TranscriptPanel {transcript} />
    </section>
  {/if}
</main>

<Footer />

<!-- Command Palette -->
<CommandPaletteSearch bind:isOpen={isCommandPaletteOpen} bind:selectedDate />

<style>
  /* ===== LAYOUT STYLES ===== */
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

  /* ===== COMIC SECTION STYLES ===== */
  .comic-section {
    text-align: center;
    margin: 0 auto 30px;
    max-width: var(--max-width);
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .container {
      padding: 60px var(--spacing-sm) 0;
    }
  }
</style>
