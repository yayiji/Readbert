<script>
  let { currentComic, isLoading, onImageLoad } = $props();
</script>

<!-- Comic image section -->
<div class="comic-container-wrapper">
  <div class="comic-container">
    <img
      src={currentComic.url}
      alt="Dilbert comic from {currentComic.date}"
      class="comic-image"
      class:loading={isLoading}
      onload={onImageLoad}
    />
  </div>
</div>

<style>
  /* Comic Container */
  .comic-container {
    display: inline-block;
    background-color: var(--bg-white);
    padding: 0.9rem;
    border: 2px solid var(--border-color);
    box-shadow: var(--shadow);
    margin-top: 0.5rem;
  }

  .comic-image {
    max-width: 100%;
    height: auto;
    display: block;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  .comic-image.loading {
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    .comic-container {
      padding: 0.8rem;
    }
  }

  @media (max-width: 600px) {
    .comic-container {
      padding: 0.6rem;
    }
  }
</style>
