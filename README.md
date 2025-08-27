# DILBERT COMICS

A clean, minimal web application built with Svelte 5 for browsing the complete Dilbert comics collection (1989-2023) with AI-generated transcripts.

## Features

- 🎲 **Random Comic Discovery**: Browse comics with intelligent navigation
- 📖 **AI Transcriptions**: Every comic includes searchable text transcripts
- 💾 **Session Persistence**: Remembers your last viewed comic across page refreshes
- 📱 **Responsive Design**: Optimized for all devices
- ⚡ **Fast & Clean**: Minimal interface focused on content

## Quick Start

### Prerequisites
- Node.js 18+
- OpenRouter API key (for transcription features)

### Installation

1. Clone and setup:
```bash
git clone [repository-url]
cd VS-Dilbert
npm install
```

2. Create `.env` file:
```bash
OPENROUTER_API_KEY=your_api_key_here
```

3. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── lib/
│   ├── comicsUtils.js          # Date formatting utilities
│   └── server/
│       └── comicsServer.js     # Core comic data logic
├── routes/
│   ├── +layout.svelte          # Base layout
│   ├── +page.server.js         # Homepage data loader
│   ├── +page.svelte            # Main comic viewer
│   └── api/
│       ├── comic/+server.js    # Comic API endpoint
│       └── random/+server.js   # Random comic API
source-data/
└── dilbert-comics/             # Source comic images (not web accessible)
    ├── 1989/
    ├── 1990/
    └── ... (through 2023)
static/
└── dilbert-transcripts/        # AI-generated transcripts (web accessible)
```

## Transcription Tools

The project includes several scripts for generating AI-powered transcripts of comic images:

### 1. Test API Connection
```bash
npm run test:api
# Tests your OpenRouter API key and transcription setup
```

### 2. Bulk Transcription
```bash
npm run transcribe              # Transcribe all years
npm run transcribe:year 2023    # Transcribe specific year only
```

### 3. Retry Failed Transcriptions
```bash
npm run transcribe:retry        # Retry comics that failed previously
npm run transcribe:retry 2023   # Retry failed comics for specific year
```

### 4. Single Comic Transcription
```bash
npm run transcribe:specific 2023-01-15    # Transcribe one specific comic
```

### 5. Copy Comics to Static Folder
```bash
npm run copy:comics              # Copy all comics to static folder
npm run copy:comics 2023         # Copy specific year
npm run copy:comics 2023-01-15   # Copy specific comic
```

### Script Details

| Script | Purpose | Usage |
|--------|---------|-------|
| `test-transcription.js` | Test API connection | `npm run test:api` |
| `transcribe-comics.js` | Bulk transcribe all/year | `npm run transcribe [year]` |
| `transcribe-comics-retry.js` | Retry failed transcriptions | `npm run transcribe:retry [year]` |
| `transcribe-by-date.js` | Single comic by date | `npm run transcribe:specific YYYY-MM-DD` |

### Requirements for Transcription
- OpenRouter API key in `.env` file
- Comic images in `source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif` format
- Transcripts saved to `static/dilbert-transcripts/YYYY/YYYY-MM-DD.json`

### Workflow
1. **Source comics** are stored in `source-data/dilbert-comics/` (not web accessible)
2. **Transcription scripts** read from `source-data/` and write to `static/dilbert-transcripts/`
3. **Manually copy** needed comic images to `static/dilbert-comics/` for web access
4. **Web app** serves comics from `static/dilbert-comics/` and transcripts from `static/dilbert-transcripts/`

## Key Features Explained

**Smart Navigation**: Previous/Next buttons automatically handle chronological browsing across years.

**Persistent State**: Your last viewed comic is remembered using localStorage, surviving page refreshes until you navigate to a new comic.

**Clean Codebase**: Simplified from original complex routing to a single-page application with API endpoints.

## Development

The app uses:
- **Svelte 5** with modern reactivity
- **SvelteKit** for full-stack functionality  
- **Vite** for fast development
- **CSS Custom Properties** for maintainable theming

## API Endpoints

- `GET /api/random` - Returns random comic with navigation data
- `GET /api/comic?date=YYYY-MM-DD` - Returns specific comic with navigation data

## Contributing

This is a personal archive project. The codebase has been cleaned and optimized for maintainability and performance.
