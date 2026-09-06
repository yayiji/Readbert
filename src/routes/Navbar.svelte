<script>
  let { onSearchClick = () => {} } = $props();

  const themeStorageKey = 'readbert-theme';
  const themeOptions = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' }
  ];

  let activeTheme = $state('light');
  let isThemeMenuOpen = $state(false);

  function isThemeId(value) {
    return themeOptions.some((theme) => theme.id === value);
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

  function selectTheme(themeId) {
    applyTheme(themeId);
    isThemeMenuOpen = false;
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

  $effect(() => {
    function handleWindowKeydown(event) {
      if (event.key === 'Escape') {
        isThemeMenuOpen = false;
      }
    }

    function handleWindowPointerdown(event) {
      if (event.target instanceof Element && !event.target.closest('.theme-control')) {
        isThemeMenuOpen = false;
      }
    }

    window.addEventListener('keydown', handleWindowKeydown);
    window.addEventListener('pointerdown', handleWindowPointerdown);

    return () => {
      window.removeEventListener('keydown', handleWindowKeydown);
      window.removeEventListener('pointerdown', handleWindowPointerdown);
    };
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
      <div class="theme-control">
        <button
          type="button"
          class="theme-btn"
          aria-label="Change theme"
          aria-haspopup="menu"
          aria-expanded={isThemeMenuOpen}
          aria-controls="theme-menu"
          title="Change theme"
          onclick={() => (isThemeMenuOpen = !isThemeMenuOpen)}
        >
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
        </button>

        {#if isThemeMenuOpen}
          <div class="theme-menu" id="theme-menu" role="menu" aria-label="Color theme">
            <p class="theme-menu-label">Choose a theme</p>
            {#each themeOptions as theme}
              <button
                type="button"
                class:active={activeTheme === theme.id}
                class="theme-option"
                role="menuitemradio"
                aria-checked={activeTheme === theme.id}
                onclick={() => selectTheme(theme.id)}
              >
                <span class="theme-option-mark" aria-hidden="true">
                  {activeTheme === theme.id ? '●' : '○'}
                </span>
                <span>{theme.label}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
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

  .theme-control {
    position: relative;
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
  .theme-btn:hover,
  .theme-btn[aria-expanded='true'] {
    background: var(--color-accent-subtle);
  }

  .theme-menu {
    position: absolute;
    top: calc(100% + var(--spacing-2));
    right: 0;
    z-index: 110;
    width: 176px;
    padding: var(--spacing-2);
    background: var(--color-surface-strong);
    border: 1px solid var(--color-border);
    border-radius: 14px;
    box-shadow: 0 10px 28px var(--color-shadow);
  }

  .theme-menu-label {
    margin: 0;
    padding: var(--spacing-1) var(--spacing-2) var(--spacing-2);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .theme-option {
    display: flex;
    align-items: center;
    width: 100%;
    gap: var(--spacing-2);
    padding: 0.45rem var(--spacing-2);
    border: 0;
    border-radius: 8px;
    background: var(--color-transparent);
    color: var(--color-text);
    font: inherit;
    font-size: 0.9rem;
    text-align: left;
    cursor: pointer;
  }

  .theme-option:hover,
  .theme-option.active {
    background: var(--color-accent-subtle);
    color: var(--color-accent);
  }

  .theme-option-mark {
    width: 1rem;
    color: currentColor;
    font-family: var(--font-sans);
    font-size: 0.7rem;
    text-align: center;
  }

  @media (max-width: 600px) {
    .nav-container {
      padding: 0 var(--spacing-md);
    }
  }
</style>
