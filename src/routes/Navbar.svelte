<script>
  let { onSearchClick = () => {} } = $props();
</script>

<nav class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
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
    z-index: 100;

    /* Appearance */
    background: rgba(248, 246, 240, 0.1);
    border-bottom: 0.1px solid rgba(139, 125, 107, 0.2);
    box-shadow: var(--navbar-shadow);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    /* max-width: 1200px; */
    margin: 0 auto;
    padding: var(--spacing-md) var(--spacing-xl);
  }

  .nav-brand h1 {
    margin: 0;
    padding: 0;
    padding-left: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-color);
  }

  .nav-buttons {
    display: flex;
    gap: var(--spacing-md);
  }

  .search-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .search-btn:hover {
    background: rgba(109, 95, 77, 0.1);
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .nav-container {
      padding: var(--spacing-sm) 16px;
    }

    .nav-brand h1 {
      font-size: 17px;
    }
  }
</style>
