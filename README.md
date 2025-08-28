# VS-Dilbert

A web application to browse the classic Dilbert comic strips, complete with AI-powered transcriptions.

## Features

- **Comic Browser**: View Dilbert comics by date.
- **Navigation**: Easily navigate to the previous or next day's comic.
- **Random Comic**: Jump to a random comic for a surprise laugh.
- **Transcripts**: View AI-generated transcripts for each comic.
- **AI Transcription**: Scripts to automatically transcribe comics using Gemini.

## Tech Stack

- **Frontend**: SvelteKit, Svelte 5
- **Build Tool**: Vite
- **Transcription**: Node.js, Google Gemini

## Project Structure

```
/
├── source-data/            # Original comic strip image files
│   └── dilbert-comics/
├── static/
│   ├── dilbert-comics/     # Processed/optimized comic images (if any)
│   └── dilbert-transcripts/ # JSON transcripts for each comic
├── src/                    # SvelteKit application source
│   ├── lib/                # Utility functions and clients
│   └── routes/             # Application pages
├── transcribe-comics.js    # Transcription script using OpenRouter
├── transcribe-comics-gemini.js # Transcription script using Google's Gemini API
├── package.json            # Project dependencies and scripts
└── svelte.config.js        # SvelteKit configuration
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd vs-dilbert
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project and add your API key for transcription:

    ```
    GEMINI_API_KEY="your_google_gemini_api_key"
    ```
    or
    ```
    OPENROUTER_API_KEY="your_openrouter_api_key"
    ```

## Usage

### Running the Web Application

To start the development server:

```bash
npm run dev
```

This will start the application on `http://localhost:5173`.

### Building for Production

To create a production version of the app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

### Transcription Scripts

The project includes two scripts to generate comic transcriptions. The comics are located in `source-data/dilbert-comics` and the transcripts will be saved in `static/dilbert-transcripts`.

**1. Using Google Gemini API (`transcribe-comics-gemini.js`)**

This script uses the official Google Gemini API for transcription.

**Usage:**

-   Transcribe a single year:
    ```bash
    node transcribe-comics-gemini.js 2008
    ```
-   Transcribe a range of years:
    ```bash
    node transcribe-comics-gemini.js 2008 2010
    ```

**2. Using OpenRouter (`transcribe-comics.js`)**

This script uses OpenRouter to access various models, including Gemini.

**Usage:**

-   Transcribe a single year:
    ```bash
    node transcribe-comics.js 1999
    ```
-   Transcribe a range of years:
    ```bash
    node transcribe-comics.js 1999 2005
    ```
