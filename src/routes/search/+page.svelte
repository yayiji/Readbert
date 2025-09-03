<script>
	// Clean search page - search logic to be implemented
</script>

<svelte:head>
	<title>Search Dilbert Comics</title>
	<meta name="description" content="Search through the complete Dilbert comics collection" />
</svelte:head>

<div class="search-page">
	<div class="search-header">
		<h1 class="page-title">Search Dilbert Comics</h1>
		<p class="page-subtitle">Search functionality coming soon...</p>
	</div>
</div>

<style>
	.search-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.search-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: bold;
		color: var(--accent-color, #6d5f4d);
		margin: 0 0 0.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--main-color, #333);
		margin: 0;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.search-page {
			padding: 1rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.page-subtitle {
			font-size: 1rem;
		}
	}
</style>
