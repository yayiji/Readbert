# DILBERT COMICS

A clean, minimal web application built with SvelteKit for browsing the complete Dilbert comics collection (1989-2023) with AI-generated transcripts.

## Features

- 🎲 **Random Comic Discovery**: Browse comics with intelligent navigation
- 📖 **AI Transcriptions**: Every comic includes searchable text transcripts
- 💾 **Session Persistence**: Remembers your last viewed comic across page refreshes
- 📱 **Responsive Design**: Optimized for all devices
- ⚡ **Fast & Clean**: Minimal interface focused on content
- 🌐 **Browser-Only**: No server-side dependencies, perfect for static hosting
- 🚀 **Vercel Ready**: Optimized for serverless deployment

## Architecture

This project has two parts:

### 1. Web Application (Browser-Only)
- Loads comics and transcripts directly from static files
- Uses client-side navigation and state management
- Requires no backend API or server-side processing
- Works perfectly with CDN and static hosting platforms

### 2. Transcription Tools (Node.js)
- Generate AI transcripts from comic images
- Support for OpenRouter and Google Gemini APIs
- Bulk processing with retry capabilities
- Rate limiting and progress tracking

## Quick Start

### Prerequisites
- Node.js 18+ 
- API key from OpenRouter or Google Gemini (for transcription only)

### Installation

1. Clone and setup:
```bash
git clone [repository-url]
cd VS-Dilbert
npm install
```

2. For transcription (optional), set up API keys in `.env`:
```bash
# Copy and edit the .env file
OPENROUTER_API_KEY=your_openrouter_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Transcription Tools

### Setup and Testing

1. **Test your API connection:**
```bash
npm run test:api
```

2. **Bulk transcription:**
```bash
npm run transcribe              # OpenRouter API for all years
npm run transcribe:gemini       # Gemini API for all years
npm run transcribe 2023         # Specific year with OpenRouter
npm run transcribe:gemini 2023  # Specific year with Gemini
```

3. **Retry failed transcriptions:**
```bash
npm run transcribe:retry        # Retry failed with OpenRouter
npm run transcribe:retry-gemini # Retry failed with Gemini
```

4. **Single comic transcription:**
```bash
npm run transcribe:specific 2023-01-15
```

### Requirements for Transcription
- Comic images in `source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif` format
- API key in `.env` file (OpenRouter or Gemini)
- Transcripts saved to `static/dilbert-transcripts/YYYY/YYYY-MM-DD.json`

### Transcription Scripts

| Script | Purpose | API | Usage |
|--------|---------|-----|-------|
| `transcribe-comics.js` | Bulk transcribe all/year | OpenRouter | `npm run transcribe [year]` |
| `transcribe-comics-gemini.js` | Bulk transcribe all/year | Gemini | `npm run transcribe:gemini [year]` |
| `transcribe-comics-retry.js` | Retry failed transcriptions | OpenRouter | `npm run transcribe:retry [year]` |
| `transcribe-comics-retry-gemini.js` | Retry failed transcriptions | Gemini | `npm run transcribe:retry-gemini [year]` |
| `transcribe-by-date.js` | Single comic by date | OpenRouter | `npm run transcribe:specific YYYY-MM-DD` |
| `test-api.js` | Test API connections | Both | `npm run test:api` |

## Project Structure

```
src/
├── lib/
│   ├── comicsClient.js      # Browser-only comic utilities
│   ├── comicsUtils.js       # Shared utilities
│   └── browserLoader.js     # Client-side loading logic
├── routes/
│   └── +page.svelte        # Main application page
└── app.html                # HTML template

static/
├── dilbert-comics/         # Comic images (1989-2023)
└── dilbert-transcripts/    # AI-generated transcripts

source-data/
└── dilbert-comics/         # Source images for transcription
    ├── 1989/
    ├── 1990/
    └── ... (through 2023)

# Transcription tools (Node.js)
transcribe-comics.js        # OpenRouter bulk transcription
transcribe-comics-gemini.js # Gemini bulk transcription
transcribe-comics-retry.js  # OpenRouter retry failed
transcribe-comics-retry-gemini.js # Gemini retry failed
transcribe-by-date.js       # Single comic transcription
test-api.js                 # API connection tester
```

## Workflow

1. **Source comics** are stored in `source-data/dilbert-comics/` (not web accessible)
2. **Transcription scripts** read from `source-data/` and generate transcripts in `static/dilbert-transcripts/`
3. **Copy** needed comic images to `static/dilbert-comics/` for web access
4. **Web app** serves comics from `static/dilbert-comics/` and transcripts from `static/dilbert-transcripts/`

## Features in Detail

### Comic Navigation
- **Random**: Discover comics from any year
- **Sequential**: Browse previous/next comics chronologically  
- **Direct**: Jump to specific dates
- **Smart Loading**: Efficient client-side comic discovery

### Transcript System
- **Independent Loading**: Transcripts load separately from comics
- **Local Storage**: Persistent comic state across sessions
- **Error Handling**: Graceful fallbacks when transcripts unavailable

### Browser Compatibility
- Works entirely in the browser
- No API calls to external services
- Static file serving for optimal performance
- Compatible with all modern browsers

## Deployment

### Web Application
This app is designed for static hosting. Simply run `npm run build` and deploy the `build` folder to:
- Vercel
- Netlify  
- GitHub Pages
- Any static hosting service

### Transcription Tools
The transcription scripts run locally with Node.js and are not needed for deployment.

## Development

The application uses:
- **SvelteKit** - Web framework
- **Vite** - Build tool
- **Svelte 5** - Component framework with runes
- **Node.js** - For transcription tools only

## License

This project is for educational and archival purposes. Dilbert comics are the property of their respective copyright holders.
