# VS-Dilbert

A modern web application for browsing the complete collection of Dilbert comic strips (1989-2023) with AI-powered transcriptions for accessibility and searchability.

## ✨ Features

- **📅 Date Navigation**: Browse comics by specific date with an intuitive date picker
- **🎲 Random Comic**: Discover comics with the random comic feature
- **⬅️➡️ Sequential Browse**: Navigate seamlessly between previous and next comics  
- **📝 AI Transcriptions**: Access AI-generated text transcriptions of comic content
- **💾 Smart Caching**: Automatic local storage of recently viewed comics
- **📱 Responsive Design**: Optimized viewing experience across all devices
- **⚡ Fast Loading**: Static deployment ready with efficient asset management

## 🗂️ Collection

The app includes the complete Dilbert comic archive:
- **Start Date**: April 16, 1989 (first Dilbert comic)
- **End Date**: March 12, 2023 (final comic)
- **Total Years**: 34 years of comics
- **Format**: High-quality GIF images with corresponding transcriptions

## 🛠️ Tech Stack

- **Framework**: SvelteKit with Svelte 5
- **Build Tool**: Vite 7
- **Styling**: Custom CSS with modern font stack
- **AI Integration**: Google Generative AI for transcriptions
- **Icons**: Lucide Svelte icons
- **Deployment**: Vercel-ready with adapter-auto

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd VS-Dilbert-One

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Preview the build
npm run preview
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── browserLoader.js     # Client-side comic loading
│   ├── comicsClient.js      # Comic data management  
│   ├── comicsUtils.js       # Utility functions
│   └── DatePicker.svelte    # Date selection component
├── routes/
│   ├── +layout.svelte       # App layout
│   └── +page.svelte         # Main comic viewer
static/
├── dilbert-comics/          # Comic image archive (1989-2023)
└── dilbert-transcripts/     # AI-generated transcriptions
```

## 🎨 Key Components

- **Main Viewer**: Full-featured comic display with navigation controls
- **Date Picker**: Calendar-based comic selection
- **Transcript Display**: Toggle-able AI transcriptions for accessibility
- **Smart Navigation**: Automatic handling of weekends and missing comics

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run transcribe` - Generate comic transcriptions (if available)
- `npm run transcribe:gemini` - Generate transcriptions using Gemini AI

## 📄 License

This project is for educational and archival purposes. Dilbert comics are the property of their respective copyright holders.
