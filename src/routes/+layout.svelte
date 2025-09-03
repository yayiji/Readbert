<script>
	let { children } = $props();
	
	let showSearch = $state(false);
	
	function toggleSearch() {
		showSearch = !showSearch;
	}
</script>

<nav class="navbar">
	<div class="nav-container">
		<div class="nav-left">
			<a href="/" class="nav-title">DILBERT</a>
		</div>
		
		<div class="nav-right">
			<button class="search-btn" onclick={toggleSearch} aria-label="Search">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
			</button>
		</div>
	</div>
	
	{#if showSearch}
		<div class="search-overlay">
			<div class="search-container">
				<input 
					type="text" 
					placeholder="Search Dilbert comics..." 
					class="search-input"
				/>
				<button class="close-search" onclick={toggleSearch} aria-label="Close search">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>
		</div>
	{/if}
</nav>

<main>
	{@render children()}
</main>

<footer class="footer">
	<div class="footer-content">
		<p class="copyright">Dilbert © Scott Adams</p>
		<p class="footer-note">
			All comics are displayed for educational and archival purposes
		</p>
	</div>
</footer>

<style>
	:global(:root) {
		--main-color: #333;
		--accent-color: #6d5f4d;
		--border-color: #8b7d6b;
		--bg-light: #f8f6f0;
		--bg-white: #fff;
	}

	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: var(--bg-light);
		color: var(--main-color);
		z-index: 100;
		border-bottom: 0.1px solid var(--border-color);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.nav-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.8rem 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		height: 50px;
	}
	
	.nav-title {
		font-size: 1.2rem;
		font-weight: bold;
		color: var(--accent-color);
		text-decoration: none;
		letter-spacing: 0.1em;
		transition: opacity 0.2s ease;
		text-transform: uppercase;
	}
	
	.nav-title:hover {
		opacity: 0.8;
	}
	
	.search-btn {
		background: none;
		border: none;
		color: var(--main-color);
		cursor: pointer;
		padding: 0.4rem;
		border-radius: 0.25rem;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: transparent;
	}
	
	.search-btn:hover {
		background-color: var(--border-color);
		color: var(--bg-light);
	}
	
	.search-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 4rem;
		z-index: 1000;
	}
	
	.search-container {
		background: var(--bg-white);
		border: 2px solid var(--border-color);
		border-radius: 0.25rem;
		padding: 1rem;
		width: 90%;
		max-width: 600px;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
	}
	
	.search-input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 1.1rem;
		padding: 0.5rem;
		background: transparent;
		color: var(--main-color);
	}
	
	.search-input::placeholder {
		color: var(--border-color);
	}
	
	.close-search {
		background: none;
		border: 2px solid var(--border-color);
		cursor: pointer;
		padding: 0.4rem;
		border-radius: 0.25rem;
		color: var(--main-color);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-light);
	}
	
	.close-search:hover {
		background-color: var(--border-color);
		color: var(--bg-light);
	}
	
	main {
		flex: 1;
		padding-top: 60px; /* Account for fixed navbar height */
	}

	.footer {
		margin-top: auto;
		padding: 200px 0 20px 0;
		text-align: center;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.copyright {
		font-size: 14px;
		font-weight: bold;
		color: var(--accent-color);
		margin: 0 0 8px 0;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.footer-note {
		font-size: 12px;
		color: var(--border-color);
		margin: 0;
		font-style: italic;
	}
	
	/* Responsive design */
	@media (max-width: 768px) {
		.nav-container {
			padding: 0.5rem 1rem;
			height: 45px;
		}
		
		.nav-title {
			font-size: 1.1rem;
		}
		
		.search-container {
			margin: 0 1rem;
			padding: 0.8rem;
		}
		
		.search-input {
			font-size: 1rem;
		}

		.footer {
			padding: 100px 0 20px 0;
		}

		.copyright {
			font-size: 13px;
		}

		.footer-note {
			font-size: 11px;
		}
	}
</style>
