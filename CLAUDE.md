# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS-Dilbert is a SvelteKit-based web application for browsing the complete Dilbert comic archive (1989-2023) with AI-generated transcriptions. The app is designed for static deployment (Vercel) and uses client-side data management with smart caching via IndexedDB.


## Svelte 5 + SvelteKit Notes (Important)
- Always consult `svelte5-llms.txt` at the repo root before modifying Svelte files. It documents current Svelte 5/SvelteKit conventions used in this codebase.
- Use Svelte 5 runes where appropriate (e.g., `$state`, `$derived`, `$effect`) for component state/derived state/effects.
- DOM event bindings should use standard HTML event attributes (e.g., `onclick`, `onsubmit`, `onkeydown`) — not `on:` — to avoid deprecation warnings. Custom component events still use `on:<event>`.
- SvelteKit directives that previously used `sveltekit:*` may have updated forms (e.g., data- attributes). Follow the patterns described in `svelte5-llms.txt` when adding prefetch/preload/navigation behaviors.

## Development Commands

### Essential Commands
```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install

# Sync SvelteKit types (runs automatically with prepare hook)
npm run prepare
```

### Data Generation Scripts
```bash
# Generate AI transcriptions using Google Generative AI
npm run transcribe:gemini

# Generate both database indexes (transcript + search)
npm run generate-databases

# Generate transcript index only (creates static/dilbert-index/transcript-index.min.json)
npm run generate-transcript-index

# Generate search index only (creates static/dilbert-index/search-index.min.json)
npm run generate-search-index
```

## Architecture Overview

### Client-Side Data Loading Strategy

The application uses a **fully client-side data management** approach optimized for static deployment:

1. **Comic Images**: Loaded from CDN (jsdelivr) or static directory at `/dilbert-comics/{year}/{date}.gif`
2. **Transcript Database**: Pregenerated JSON file loaded into memory via IndexedDB cache (`transcriptDatabase.js`)
3. **Search Index**: Pregenerated word-to-date mapping loaded into memory via IndexedDB cache (`searchIndex.js`)

**Critical Design Principle**: No server-side APIs. All data is either static files or pregenerated indexes that are lazily loaded and cached client-side.

### Key Architectural Components

#### Data Layer (`src/lib/`)

**comicsClient.js** - Core comic data operations
- Generates comic metadata from date ranges (no filesystem access)
- Handles navigation between comics (previous/next/random)
- Validates date ranges (1989-04-16 to 2023-03-12)
- Returns comic objects with CDN URLs

**browserLoader.js** - Client-side comic loading orchestration
- Wraps `comicsClient.js` functions with loading states
- Loads comics with navigation data (previous/next)
- Integrates transcript loading via `comicsUtils.js`

**transcriptDatabase.js** - Transcript management singleton
- Loads pregenerated transcript index (`transcript-index.min.json`) from CDN
- Caches transcripts in IndexedDB for offline access
- Provides cache invalidation and force refresh mechanisms
- Auto-detects stale cache via Last-Modified headers

**searchIndex.js** - Search functionality
- Loads pregenerated search index (`search-index.min.json`) from CDN
- Builds inverted index (word → comic dates) in memory
- Caches in IndexedDB for performance
- Falls back to building from transcript database if pregenerated index unavailable

**comicsUtils.js** - Shared utilities
- Date formatting and validation
- Comic filename parsing (YYYY-MM-DD.gif format)
- Transcript loading helper (`loadTranscriptIndependently`)

#### Build-Time Data Generation (`scripts/`)

**generateDatabases.js** - Orchestrator script
- Runs both index generation scripts in sequence
- Used before deployment to prepare static data files

**generateTranscriptIndex.js** - Transcript index builder
- Scans `static/dilbert-transcripts/` directory
- Consolidates all individual transcript JSON files into single index
- Outputs minified `transcript-index.min.json` (~2-5 MB)

**generateSearchIndex.js** - Search index builder
- Tokenizes all transcript text
- Builds word-to-date inverted index
- Outputs minified `search-index.min.json` for fast client-side search

**transcribe-comics-gemini.js** - AI transcription generator
- Uses Google Generative AI to analyze comic images
- Generates transcript JSON files in `static/dilbert-transcripts/{year}/`
- Requires `GOOGLE_API_KEY` environment variable

#### UI Components (`src/lib/`)

**DatePicker.svelte** - Calendar-based date selection component
- Respects comic date ranges
- Handles weekend/missing comic validation

**CommandPaletteSearch.svelte** - Search interface
- Uses `searchIndex.js` for full-text search across transcripts
- Keyboard-driven command palette UI

#### Main Application (`src/routes/`)

**+page.svelte** - Main comic viewer page
- Manages comic state using Svelte 5 runes ($state, $derived)
- Handles navigation (prev/next/random)
- Integrates date picker and search
- Persists last viewed comic in localStorage (7-day expiry)

**+layout.svelte** - Application layout wrapper

## Data Flow

### Loading a Comic
1. User selects date → `loadComicBrowser(date)` called
2. `getComicByDate()` constructs comic object with CDN URL
3. `getPreviousComic()` and `getNextComic()` fetch navigation metadata
4. `loadTranscriptIndependently()` fetches transcript from database
5. Component updates with comic data and transcript

### Search Flow
1. User opens search (Cmd/Ctrl+K) → `CommandPaletteSearch` component
2. User types query → `searchIndex.search(query)` called
3. Search index returns matching comic dates sorted by relevance
4. User selects result → navigate to comic date

## Important Constraints

### Date Range Boundaries
- **First comic**: April 16, 1989 (`1989-04-16`)
- **Last comic**: March 12, 2023 (`2023-03-12`)
- Navigation functions enforce these boundaries
- Date validation is critical to prevent invalid HTTP requests

### Static Deployment Requirements
- No server-side code (no API routes in `src/routes/`)
- All data must be pregenerated before build
- Comic images served from CDN or static directory
- Indexes must be generated before `npm run build`

### CDN Configuration
- Primary image source: `https://cdn.jsdelivr.net/gh/yayiji/readbert@main/static/dilbert-comics/{year}/{date}.gif`
- Fallback: `/dilbert-comics/{year}/{date}.gif` (local static)
- Transcript index: CDN-first, then local fallback
- Search index: Local-first (`/dilbert-index/search-index.min.json`)

## Deployment Workflow

1. Generate transcriptions (if needed): `npm run transcribe:gemini`
2. Generate database indexes: `npm run generate-databases`
3. Build application: `npm run build`
4. Deploy to Vercel (adapter-auto handles configuration)

## Technology Stack

- **Framework**: SvelteKit 2.x with Svelte 5 (runes API)
- **Build Tool**: Vite 7.x
- **Database**: IndexedDB (via `idb` library) for client-side caching
- **AI**: Google Generative AI (`@google/genai`) for transcriptions
- **Icons**: Lucide Svelte
- **Fonts**: Geist Sans, multiple monospace options
- **Deployment**: Adapter-auto (Vercel optimized)

## File Structure Patterns

```
static/
├── dilbert-comics/        # Comic images by year
│   └── {year}/
│       └── {date}.gif     # YYYY-MM-DD.gif format
├── dilbert-transcripts/   # Individual transcript JSON files
│   └── {year}/
│       └── {date}.json    # Transcript metadata + text
└── dilbert-index/         # Pregenerated indexes
    ├── transcript-index.min.json  # All transcripts consolidated
    └── search-index.min.json      # Word → dates mapping

src/lib/
├── browserLoader.js       # Client-side loading orchestration
├── comicsClient.js        # Core comic data operations
├── comicsUtils.js         # Shared utilities
├── transcriptDatabase.js  # Transcript caching layer
├── searchIndex.js         # Search functionality
├── DatePicker.svelte      # Date selection UI
└── CommandPaletteSearch.svelte  # Search UI

scripts/
├── generateDatabases.js   # Orchestrator
├── generateTranscriptIndex.js  # Build transcript index
├── generateSearchIndex.js      # Build search index
└── transcribe-comics-gemini.js # AI transcription generator
```

## Common Workflows

### Adding New Comic Data
1. Place GIF in `static/dilbert-comics/{year}/{date}.gif`
2. Optionally generate transcript: `npm run transcribe:gemini`
3. Regenerate indexes: `npm run generate-databases`
4. Rebuild and deploy

### Updating Date Range
1. Modify `COMIC_DATE_RANGES` in `src/lib/comicsClient.js`
2. Update README.md collection dates if needed
3. Regenerate indexes if transcripts exist

### Cache Management
The app uses aggressive client-side caching:
- Transcripts cached in IndexedDB (24-hour TTL)
- Search index cached in IndexedDB
- Last viewed comic cached in localStorage (7-day TTL)
- Clear cache: Use browser DevTools or `transcriptDatabase.clearCache()`

## Performance Considerations

- Transcript database is ~2-5 MB compressed
- Search index is ~1-3 MB compressed
- Indexes load lazily on first use
- IndexedDB prevents re-downloading on subsequent visits
- Comic images loaded on-demand via CDN
