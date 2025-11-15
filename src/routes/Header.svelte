<header class="header">
  <h1 class="title">Dilbert Comics Reader</h1>
  <p class="subtitle">
    The Complete Collection of Scott Adams' Dilbert Comics
  </p>
</header>

<style>
  .header {
    margin: 40px auto 42px;
    text-align: center;
    max-width: var(--max-width);
  }

  .title {
    margin: 0;
    font-size: 2rem;
    font-weight: 600;
    color: var(--text-color);
    letter-spacing: 0px;
    /* text-transform: uppercase; */
  }

  .subtitle {
    margin: 0;
    font-size: 16px;
    color: var(--text-muted);
    font-style: italic;
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .header {
      margin: 25px auto 32px;
    }

    .title {
      font-size: 24px;
      letter-spacing: 1px;
    }

    .subtitle {
      font-size: 14px;
    }
  }
</style>
