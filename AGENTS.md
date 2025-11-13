# Repository Guidelines

### Svelte 5 + SvelteKit Notes (Important)
- Always consult `svelte5-llms.txt` at the repo root before modifying Svelte files. It documents current Svelte 5/SvelteKit conventions used in this codebase.
- Use Svelte 5 runes where appropriate (e.g., `$state`, `$derived`, `$effect`) for component state/derived state/effects.
- DOM event bindings should use standard HTML event attributes (e.g., `onclick`, `onsubmit`, `onkeydown`) — not `on:` — to avoid deprecation warnings. Custom component events still use `on:<event>`.
- SvelteKit directives that previously used `sveltekit:*` may have updated forms (e.g., data- attributes). Follow the patterns described in `svelte5-llms.txt` when adding prefetch/preload/navigation behaviors.

