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
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--spacing-lg);
  }

  .copyright {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 16px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .footer-note {
    margin: 0;
    font-size: 14px;
    font-style: italic;
  }

  /* ===== MOBILE RESPONSIVE STYLES ===== */
  @media (max-width: 600px) {
    .footer {
      padding: 50px 0 var(--spacing-lg) 0;
    }

    .copyright {
      font-size: 15px;
    }

    .footer-note {
      font-size: 13px;
    }
  }
</style>
