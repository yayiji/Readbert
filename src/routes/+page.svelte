<script>
  import { formatDate, fetchTranscriptByDate } from '$lib/comicsUtils.js';
  import { onMount } from 'svelte';
  
  let { data } = $props();
  let currentComic = $state(data.randomComic);
  let previousComic = $state(data.previousComic);
  let nextComic = $state(data.nextComic);
  let transcript = $state(null);
  let isLoading = $state(false);

  const STORAGE_KEY = 'lastVisitedComic';
  const STORAGE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Save comic data to localStorage
  function saveComicToStorage(comic, prevComic, nextComic, comicTranscript) {
    if (typeof localStorage === 'undefined') return;
    
    const comicData = {
      currentComic: comic,
      previousComic: prevComic,
      nextComic: nextComic,
      transcript: comicTranscript,
      savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comicData));
  }

  // Load comic data from localStorage
  function loadComicFromStorage() {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      
      const comicData = JSON.parse(saved);
      if (comicData.savedAt && Date.now() - comicData.savedAt < STORAGE_EXPIRY) {
        return comicData;
      }
    } catch (error) {
      console.error('Error parsing saved comic data:', error);
    }
    return null;
  }

  // Load transcript for a given date
  async function loadTranscript(date) {
    if (!date) return null;
    
    try {
      const transcriptData = await fetchTranscriptByDate(date);
      return transcriptData;
    } catch (error) {
      console.error('Error loading transcript:', error);
      return null;
    }
  }

  // Generic function to update comic state and save to storage
  async function updateComicState(comic, prevComic, nextComicData) {
    currentComic = comic;
    previousComic = prevComic;
    nextComic = nextComicData;
    
    // Load transcript for the current comic
    transcript = await loadTranscript(comic?.date);
    
    saveComicToStorage(comic, prevComic, nextComicData, transcript);
  }

  // Initialize comic data on mount
  onMount(async () => {
    const savedComic = loadComicFromStorage();
    if (savedComic) {
      await updateComicState(
        savedComic.currentComic,
        savedComic.previousComic,
        savedComic.nextComic
      );
    } else if (currentComic) {
      // Load transcript for initial comic from server
      transcript = await loadTranscript(currentComic.date);
    }
  });
  
  async function loadComic(date) {
    if (isLoading) return;
    
    // Validate the date before proceeding
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Invalid date format:', date);
      return;
    }
    
    isLoading = true;
    try {
      const response = await fetch(`/api/comic?date=${date}`);
      const result = await response.json();
      
      if (result.success) {
        await updateComicState(result.comic, result.previousComic, result.nextComic);
      } else {
        console.error('Failed to load comic:', result.error);
      }
    } catch (error) {
      console.error('Error loading comic:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function getRandomComic() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      const response = await fetch('/api/random');
      const result = await response.json();
      
      if (result.success) {
        await updateComicState(result.comic, result.previousComic, result.nextComic);
      }
    } catch (error) {
      console.error('Error loading random comic:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function goToPrevious() {
    if (previousComic && !isLoading) {
      // Additional validation to prevent unexpected jumps
      if (!previousComic.date || !/^\d{4}-\d{2}-\d{2}$/.test(previousComic.date)) {
        console.error('Invalid previous comic date:', previousComic);
        return;
      }
      loadComic(previousComic.date);
    }
  }
  
  function goToNext() {
    if (nextComic && !isLoading) {
      // Additional validation to prevent unexpected jumps
      if (!nextComic.date || !/^\d{4}-\d{2}-\d{2}$/.test(nextComic.date)) {
        console.error('Invalid next comic date:', nextComic);
        return;
      }
      loadComic(nextComic.date);
    }
  }
</script>

<svelte:head>
  <title>DILBERT COMICS - Complete Collection</title>
  <meta name="description" content="Browse the complete DILBERT COMICS with transcripts" />
</svelte:head>

<main class="container">
  <header class="header">
    <h1 class="title">DILBERT COMICS</h1>
    <p class="subtitle">The Complete Collection of Scott Adams' Dilbert Comics with Transcripts</p>
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
          {isLoading ? 'LOADING...' : '⚀ RANDOM'}
        </button>
        
        <button 
          class="nav-btn" 
          disabled={!nextComic || isLoading}
          onclick={goToNext}
        >
          NEXT ►
        </button>
      </div>
      
      <div class="comic-date">{formatDate(currentComic.date)}</div>
      
      <div class="comic-container">
        <img 
          src={currentComic.url} 
          alt="Dilbert comic from {currentComic.date}"
          class="comic-image"
        />
      </div>
      
      <!-- Transcript Section (automatically shown) -->
      {#if transcript}
        <ol class="simple-transcript">
          {#each transcript.panels as panel}
            {#each panel.dialogue as dialogue}
              <li>{dialogue}</li>
            {/each}
          {/each}
        </ol>
      {/if}
      
    </section>
  {/if}
  
  <footer class="footer">
    <div class="footer-content">
      <p class="copyright">Dilbert © Scott Adams</p>
      <p class="footer-note">All comics are displayed for educational and archival purposes</p>
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
    --font-mono: 'Courier New', 'Courier', monospace;

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
    text-align: center;
    margin-bottom: 40px;
    padding: 10px 0;
    max-width: var(--max-width);
    margin-left: auto;
    margin-right: auto;
  }

  .title {
    font-size: 32px;
    font-weight: bold;
    color: var(--main-color);
    margin: 0 0 10px 0;
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
    gap: 15px;
    margin-bottom: 20px;
    padding: 10px;
  }

  .comic-date {
    font-size: 14px;
    font-weight: bold;
    color: var(--accent-color);
    margin: 8px 0 5px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .comic-container {
    display: inline-block;
    background-color: var(--bg-white);
    padding: 15px;
    border: 2px solid #d4c5a9;
    box-shadow: var(--shadow);
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

  .nav-btn:hover:not(:disabled) {
    background-color: var(--border-color);
    color: var(--bg-light);
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

  .nav-btn.random:hover:not(:disabled) {
    background-color: var(--accent-color);
  }

  .simple-transcript {
    margin: 15px auto 0;
    max-width: 500px;
    width: 100%;
    padding: 0 20px;
    line-height: 1.6;
    text-align: left;
    box-sizing: border-box;
  }

  .simple-transcript li {
    margin: 8px 0;
    font-size: 14px;
    color: var(--main-color);
    font-family: var(--font-mono);
    word-wrap: break-word;
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

  @media (max-width: 600px) {
    .container {
      padding: 15px;
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
      margin-bottom: 15px;
      padding: 5px;
      flex-wrap: wrap;
    }

    .nav-btn {
      padding: 8px 12px;
      font-size: 11px;
      min-width: 70px;
    }

    .comic-date {
      font-size: 12px;
    }

    .comic-container {
      padding: 10px;
    }

    .simple-transcript {
      margin: 10px auto 0;
      max-width: 400px;
      width: calc(100% - 20px);
      padding: 0 10px;
    }

    .simple-transcript li {
      font-size: 13px;
      margin: 6px 0;
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
