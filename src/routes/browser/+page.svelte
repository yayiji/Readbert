<!-- 
  Browser-Only Dilbert Viewer
  This version works entirely in the browser with no API calls
  Perfect for Vercel static deployment
-->
<script>
  import { formatDate, loadTranscriptIndependently } from '$lib/comicsUtils.js';
  import { loadComicBrowser, loadRandomComicBrowser, loadComicWithTranscriptBrowser } from '$lib/browserLoader.js';
  import { onMount } from 'svelte';
  
  let currentComic = $state(null);
  let previousComic = $state(null);
  let nextComic = $state(null);
  let transcript = $state(null);
  let isLoading = $state(false);
  let isLoadingTranscript = $state(false);
  let mode = $state('browser'); // 'browser' for browser-only mode

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

  // Load transcript independently
  async function loadTranscript(date) {
    if (!date) {
      transcript = null;
      return null;
    }
    
    isLoadingTranscript = true;
    try {
      const transcriptData = await loadTranscriptIndependently(date, 'direct');
      transcript = transcriptData;
      return transcriptData;
    } catch (error) {
      console.error('Error loading transcript:', error);
      transcript = null;
      return null;
    } finally {
      isLoadingTranscript = false;
    }
  }

  // Update comic state
  function updateComicState(comic, prevComic, nextComicData) {
    currentComic = comic;
    previousComic = prevComic;
    nextComic = nextComicData;
    saveComicToStorage(comic, prevComic, nextComicData, transcript);
  }

  // Update comic state and load transcript
  async function updateComicStateWithTranscript(comic, prevComic, nextComicData) {
    updateComicState(comic, prevComic, nextComicData);
    await loadTranscript(comic?.date);
    saveComicToStorage(comic, prevComic, nextComicData, transcript);
  }

  // Initialize - browser-only mode
  onMount(async () => {
    console.log('🚀 Browser-only mode activated');
    
    const savedComic = loadComicFromStorage();
    if (savedComic) {
      updateComicState(
        savedComic.currentComic,
        savedComic.previousComic,
        savedComic.nextComic
      );
      
      if (savedComic.transcript) {
        transcript = savedComic.transcript;
      } else if (savedComic.currentComic?.date) {
        await loadTranscript(savedComic.currentComic.date);
      }
    } else {
      // Load a random comic to start
      await getRandomComic();
    }
  });
  
  // Load comic by date (browser-only)
  async function loadComic(date) {
    if (isLoading) return;
    
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error('Invalid date format:', date);
      return;
    }
    
    isLoading = true;
    try {
      const result = await loadComicBrowser(date);
      
      if (result.success) {
        await updateComicStateWithTranscript(result.comic, result.previousComic, result.nextComic);
      } else {
        console.error('Failed to load comic:', result.error);
      }
    } catch (error) {
      console.error('Error loading comic:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // Get random comic (browser-only)
  async function getRandomComic() {
    if (isLoading) return;
    
    isLoading = true;
    try {
      const result = await loadRandomComicBrowser();
      
      if (result.success) {
        await updateComicStateWithTranscript(result.comic, result.previousComic, result.nextComic);
      } else {
        console.error('Failed to load random comic:', result.error);
      }
    } catch (error) {
      console.error('Error loading random comic:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function goToPrevious() {
    if (previousComic && !isLoading) {
      if (!previousComic.date || !/^\d{4}-\d{2}-\d{2}$/.test(previousComic.date)) {
        console.error('Invalid previous comic date:', previousComic);
        return;
      }
      loadComic(previousComic.date);
    }
  }
  
  function goToNext() {
    if (nextComic && !isLoading) {
      if (!nextComic.date || !/^\d{4}-\d{2}-\d{2}$/.test(nextComic.date)) {
        console.error('Invalid next comic date:', nextComic);
        return;
      }
      loadComic(nextComic.date);
    }
  }
</script>

<svelte:head>
  <title>DILBERT COMICS - Browser Mode</title>
  <meta name="description" content="Browse DILBERT COMICS entirely in your browser - Perfect for Vercel deployment!" />
</svelte:head>

<main class="container">
  <header class="header">
    <h1 class="title">DILBERT COMICS</h1>
    <p class="subtitle">Browser-Only Mode - Perfect for Vercel! 🚀</p>
    <div class="mode-indicator">
      <span class="browser-mode">🌐 Browser Mode Active - No Server Calls!</span>
    </div>
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
          {isLoading ? 'LOADING...' : 'RANDOM'}
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
      
      <!-- Transcript Section with independent loading controls -->
      <div class="transcript-section">
        <div class="transcript-header">
          <h3>Transcript</h3>
          <div class="transcript-controls">
            {#if isLoadingTranscript}
              <span class="loading-indicator">Loading transcript...</span>
            {:else}
              <button 
                class="transcript-reload-btn"
                onclick={() => loadTranscript(currentComic.date)}
                title="Reload transcript independently"
              >
                🔄 Reload
              </button>
            {/if}
          </div>
        </div>
        
        {#if transcript}
          <ol class="simple-transcript">
            {#each transcript.panels as panel}
              {#each panel.dialogue as dialogue}
                <li>{dialogue}</li>
              {/each}
            {/each}
          </ol>
        {:else if !isLoadingTranscript}
          <p class="no-transcript">No transcript available for this comic.</p>
        {/if}
      </div>
      
    </section>
  {:else}
    <div class="loading-container">
      <p>Loading your first comic...</p>
    </div>
  {/if}
  
  <footer class="footer">
    <div class="footer-content">
      <p class="copyright">© Scott Adams - DILBERT</p>
      <p class="footer-note">
        This is a fan-made archive for educational and accessibility purposes.<br>
        All comics remain the intellectual property of Scott Adams.
      </p>
      <p class="tech-note">
        🚀 <strong>Browser-Only Mode:</strong> No server dependencies - Perfect for Vercel!
      </p>
    </div>
  </footer>
</main>

<style>
  /* All existing styles plus browser-mode specific styles */
  
  .mode-indicator {
    margin: 10px 0;
    text-align: center;
  }
  
  .browser-mode {
    background: linear-gradient(45deg, #28a745, #20c997);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: inline-block;
    box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
  }
  
  .tech-note {
    font-size: 12px;
    color: #28a745;
    font-weight: bold;
    margin-top: 10px;
    text-align: center;
  }
  
  .loading-container {
    text-align: center;
    padding: 50px 20px;
    color: #666;
  }

  /* Copy all styles from main page */
  :root {
    --main-color: #333;
    --bg-light: #fff;
    --border-color: #ddd;
    --accent-color: #666;
    --max-width: 800px;
    --font-mono: 'Courier New', monospace;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: var(--bg-light);
    color: var(--main-color);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 20px;
  }

  .header {
    text-align: center;
    padding: 40px 0 30px 0;
    border-bottom: 2px solid var(--border-color);
    margin-bottom: 30px;
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
    color: var(--accent-color);
    margin-bottom: 15px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .comic-container {
    margin: 0 auto 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    border: 1px solid var(--border-color);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    background-color: white;
  }

  .nav-btn {
    background-color: var(--main-color);
    color: var(--bg-light);
    border: none;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    min-width: 100px;
  }

  .nav-btn:hover:not(:disabled) {
    background-color: var(--accent-color);
    transform: translateY(-1px);
  }

  .nav-btn:disabled {
    background-color: var(--border-color);
    cursor: not-allowed;
    transform: none;
  }

  .nav-btn.random {
    background-color: var(--border-color);
    color: var(--bg-light);
  }

  .nav-btn.random:hover:not(:disabled) {
    background-color: var(--accent-color);
  }

  .transcript-section {
    margin: 20px auto 0;
    max-width: 500px;
    width: 100%;
    padding: 0 20px;
    box-sizing: border-box;
  }

  .transcript-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid var(--border-color);
  }

  .transcript-header h3 {
    margin: 0;
    font-size: 16px;
    color: var(--main-color);
    font-weight: bold;
  }

  .transcript-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .transcript-reload-btn {
    background: var(--border-color);
    color: var(--bg-light);
    border: none;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .transcript-reload-btn:hover {
    background: var(--accent-color);
  }

  .loading-indicator {
    font-size: 12px;
    color: var(--accent-color);
    font-style: italic;
  }

  .no-transcript {
    font-size: 14px;
    color: #666;
    font-style: italic;
    text-align: center;
    margin: 10px 0;
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
    color: #999;
    line-height: 1.4;
  }
</style>
