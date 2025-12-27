<footer class="footer">
  <div class="footer-icons">
    <a
      class="footer-icon-link"
      href="https://dilbert.com/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Dilbert official site"
    >
      <img src="/icons/dilbert.webp" alt="" class="footer-icon" />
    </a>
    <a
      class="footer-icon-link"
      href="https://github.com/yayiji/Readbert"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Readbert on GitHub"
    >
      <img src="/icons/github.svg" alt="" class="footer-icon" />
    </a>
  </div>
  <div class="footer-content">
    <p class="copyright">Dilbert © Scott Adams</p>
  </div>
</footer>

<style>
  .footer {
    margin-top: auto;
    padding: 400px 0 var(--spacing-lg) 0;
    text-align: center;
    color: rgba(0, 0, 0, 0.75)
  }

  .footer-icons {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 0rem;
  }

  .footer-icon-link {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(139, 125, 107, 0.35);
    background: transparent;
    color: inherit;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }

  .footer-icon {
    width: 1.5rem;
    height: 1.5rem;
    object-fit: contain;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .copyright {
    margin-bottom: 0.2rem;
    font-size: 1rem;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .footer {
      padding: 50px 0 var(--spacing-lg) 0;
    }

    .footer-icons {
      margin-bottom: 0.5rem;
    }

    .footer-icon-link {
      width: 32px;
      height: 32px;
    }

    .footer-icon {
      width: 18px;
      height: 18px;
    }

    .copyright {
      font-size: 0.9rem;
    }
  }
</style>
