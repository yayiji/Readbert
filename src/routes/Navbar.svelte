<script>
  let { onSearchClick = () => {} } = $props();

  const themeStorageKey = 'readbert-theme';

  let activeTheme = $state('light');

  function isThemeId(value) {
    return value === 'light' || value === 'dark';
  }

  function applyTheme(themeId, persist = true) {
    if (typeof document === 'undefined' || !isThemeId(themeId)) return;

    document.documentElement.dataset.colorScheme = themeId;
    activeTheme = themeId;

    if (persist) {
      try {
        window.localStorage.setItem(themeStorageKey, themeId);
      } catch {
        // The theme still applies when storage is unavailable.
      }
    }
  }

  function toggleTheme() {
    applyTheme(activeTheme === 'dark' ? 'light' : 'dark');
  }

  $effect(() => {
    if (typeof document === 'undefined') return;

    let savedTheme = null;
    try {
      savedTheme = window.localStorage.getItem(themeStorageKey);
    } catch {
      // Fall back to the scheme selected in app.html.
    }

    const documentTheme = document.documentElement.dataset.colorScheme;
    applyTheme(
      isThemeId(savedTheme)
        ? savedTheme
        : isThemeId(documentTheme)
          ? documentTheme
          : 'light',
      false
    );
  });

  function handleBrandClick() {
    window.location.href = '/';
  }
</script>

<nav class="navbar">
  <div class="nav-container">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="nav-brand" onclick={handleBrandClick}>
      <h1>READBERT</h1>
    </div>
    <div class="nav-buttons">
      <button onclick={onSearchClick} class="search-btn" aria-label="Search">
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
      <button
        type="button"
        class="theme-btn"
        aria-label={activeTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={activeTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        onclick={toggleTheme}
      >
        {#if activeTheme === 'dark'}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
        {:else}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        {/if}
      </button>
    </div>
  </div>
</nav>

<style>
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 3.7rem;
    z-index: 100;
    border-bottom: 0.1px solid var(--color-border-subtle);
    box-shadow: var(--navbar-shadow);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 var(--spacing-xl);
  }

  .nav-brand {
    cursor: pointer;
  }

  .nav-brand h1 {
    margin: 0;
    padding-left: 0.5rem;
    font-size: 1.05rem;
    font-weight: bold;
    letter-spacing: 0.5px;
    color: var(--color-text);
  }

  .nav-buttons {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
  }

  .search-btn,
  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-2);
    background: var(--color-transparent);
    border: none;
    border-radius: var(--border-radius);
    color: var(--color-text);
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .search-btn:hover,
  .theme-btn:hover {
    background: var(--color-accent-subtle);
  }

  @media (max-width: 600px) {
    .nav-container {
      padding: 0 var(--spacing-md);
    }
  }
</style>
