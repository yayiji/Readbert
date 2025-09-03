<script>
	let { children } = $props();
</script>

<nav class="navbar">
	<div class="nav-container">
		<div class="nav-left">
			<a href="/" class="nav-title">DILBERT</a>
		</div>
		
		<div class="nav-right">
			<a href="/search" class="search-btn" aria-label="Search">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<path d="m21 21-4.35-4.35"></path>
				</svg>
			</a>
		</div>
	</div>
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
		--main-color: #000;
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
		border-bottom: 0.1px solid rgba(139, 125, 107, 0.2);
		box-shadow: 0 0px 0.1px rgba(0, 0, 0, 0.1);
	}
	
	.nav-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.8rem 1.5rem;
		max-width: 1000px;
		margin: 0 auto;
		height: 50px;
	}
	
	.nav-title {
		font-size: 1.2rem;
		font-weight: bold;
		color: #000;
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
		text-decoration: none;
	}
	
	.search-btn:hover {
		background-color: var(--border-color);
		color: var(--bg-light);
	}
	
	main {
		flex: 1;
		padding-top: 60px; /* Account for fixed navbar height */
	}

	.footer {
		margin-top: auto;
		padding: 250px 0 20px 0;
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
	@media (max-width: 600px) {
		.nav-container {
			padding: 1.5rem 1rem;
			height: 45px;
		}
		
		.nav-title {
			font-size: 1.1rem;
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
