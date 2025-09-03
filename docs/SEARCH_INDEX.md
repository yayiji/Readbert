# Search Index System

This project uses a pregenerated search index for fast text searching through Dilbert comic transcripts.

## How It Works

### 1. **Pregenerated Index**
- All comic transcripts are processed into a searchable index
- The index contains ~18,841 unique words from ~12,384 comics
- Stored as JSON files in `/static/` for instant loading

### 2. **Fast Loading**
- **Before**: 30-60 seconds to build index from transcripts
- **After**: ~200ms to load pregenerated index
- 150x-300x performance improvement!

### 3. **Automatic Fallback**
- If pregenerated index is missing, builds from transcripts
- Ensures search always works, even without pregeneration

## Files Generated

- `search-index.json` (15.56 MB) - Human-readable format
- `search-index.min.json` (9.38 MB) - Compressed format (used by app)

## Data Structure

```json
{
  "version": "1.0",
  "generatedAt": "2025-09-04T...",
  "stats": {
    "totalComics": 12384,
    "totalWords": 18841
  },
  "wordIndex": {
    "meeting": ["1989-04-20", "1990-03-15", ...],
    "boss": ["1989-05-01", "1990-01-20", ...],
    "computer": ["1989-04-16", "1989-04-17", ...]
  },
  "comics": {
    "1989-04-16": {
      "date": "1989-04-16",
      "panels": [...]
    }
  }
}
```

## Usage

### Generate New Index
```bash
npm run generate-search-index
```

Run this command whenever:
- Transcripts are updated
- New comics are added
- Search algorithm is modified

### Development vs Production

**Development**: Index loads from `/static/search-index.min.json`
**Production**: Same file, served statically

## Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Load Time | 30-60s | ~200ms | 150-300x faster |
| Comics Indexed | 12,384 | 12,384 | Same |
| Words Indexed | 18,841 | 18,841 | Same |
| File Size | N/A | 9.38 MB | Efficient |
| Memory Usage | ~50MB | ~50MB | Same |

## Search Features

- **Case-insensitive** matching
- **Relevance scoring** based on match frequency and context
- **Exact phrase** highlighting in results
- **Panel-level** organization of dialogue
- **Fast lookup** using Map/Set data structures

## Maintenance

The pregenerated index should be regenerated when:
1. New transcripts are added
2. Existing transcripts are corrected
3. Search algorithm improvements are made

The index is static and doesn't change during runtime, making it perfect for caching and CDN distribution.
