<footer class="footer">
  <div class="footer-content">
    <p class="copyright">Dilbert © Scott Adams</p>
    <p class="footer-note">
      All comics are displayed for educational and archival purposes
    </p>
  </div>
</footer>

<style>
  .footer {
    margin-top: auto;
    padding: 400px 0 var(--spacing-lg) 0;
    text-align: center;
    color: rgba(0, 0, 0, 0.75)
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

  .footer-note {
    margin: 0;
    font-size: 0.9rem;
    font-style: italic;
    color: var(--text-muted);
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .footer {
      padding: 50px 0 var(--spacing-lg) 0;
    }

    .copyright {
      font-size: 0.9rem;
    }

    .footer-note {
      font-size: 0.8rem;
    }
  }
</style>
