<footer class="footer">
  <div class="footer-inner">
    <nav class="footer-links" aria-label="External links">
      <a
        class="footer-link"
        href="https://dilbert.com/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Dilbert official site"
      >
        <img src="/icons/dilbert.webp" alt="" class="footer-avatar" />
      </a>
      <a
        class="footer-link"
        href="https://github.com/yayiji/Readbert"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Readbert on GitHub"
      >
        <svg class="footer-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M12 0c6.63 0 12 5.276 12 11.79-.001 5.067-3.29 9.567-8.175 11.187-.6.118-.825-.25-.825-.56 0-.398.015-1.665.015-3.242 0-1.105-.375-1.813-.81-2.181 2.67-.295 5.475-1.297 5.475-5.822 0-1.297-.465-2.344-1.23-3.169.12-.295.54-1.503-.12-3.125 0 0-1.005-.324-3.3 1.209a11.32 11.32 0 00-3-.398c-1.02 0-2.04.133-3 .398-2.295-1.518-3.3-1.209-3.3-1.209-.66 1.622-.24 2.83-.12 3.125-.765.825-1.23 1.887-1.23 3.169 0 4.51 2.79 5.527 5.46 5.822-.345.294-.66.81-.765 1.577-.69.31-2.415.81-3.495-.973-.225-.354-.9-1.223-1.845-1.209-1.005.015-.405.56.015.781.51.28 1.095 1.327 1.23 1.666.24.663 1.02 1.93 4.035 1.385 0 .988.015 1.916.015 2.196 0 .31-.225.664-.825.56C3.303 21.374-.003 16.867 0 11.791 0 5.276 5.37 0 12 0z"
          />
        </svg>
      </a>
      <a
        class="footer-link"
        href="https://x.com/ya_yiji"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Yayiji on X"
      >
        <svg class="footer-icon footer-icon-x" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.851L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      </a>
    </nav>
    <p class="copyright">Dilbert © Scott Adams</p>
  </div>
</footer>

<style>
  .footer {
    margin-top: 300px;
    padding: 1.5rem 0 2rem;
  }

  .footer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .footer-links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.1rem;
  }

  .footer-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-ink);
    text-decoration: none;
    transition: color 0.2s ease, opacity 0.2s ease;
  }

  .footer-avatar {
    width: 1.5rem;
    height: 1.5rem;
    object-fit: cover;
  }

  .footer-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .footer-icon-x {
    width: 1.1rem;
    height: 1.1rem;
  }

  @media (hover: hover) and (pointer: fine) {
    .footer-link:hover {
      color: var(--color-accent);
    }

    .footer-link:hover .footer-avatar {
      opacity: 0.75;
    }
  }

  .footer-link:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 3px;
  }

  .copyright {
    margin: 0;
    font-size: 0.95rem;
    font-style: italic;
    color: var(--color-ink-soft);
  }

  @media (max-width: 600px) {
    .footer {
      padding: 1.25rem 0 1.6rem;
    }

    .copyright {
      font-size: 0.85rem;
    }
  }
</style>
