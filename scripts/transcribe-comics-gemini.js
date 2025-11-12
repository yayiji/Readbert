#!/usr/bin/env node
/**
 * Dilbert Comics Bulk Transcription Script (Official Google Gemini API)
 *
 * Transcribes Dilbert comics using Google's official Gemini API with advanced features.
 *
 * USAGE:
 *   node transcribe-comics-gemini.js [year]                       # Single year
 *   node transcribe-comics-gemini.js [start-year] [end-year]      # Multiple years
 *
 * EXAMPLES:
 *   node transcribe-comics-gemini.js 1989                         # Entire year 1989
 *   node transcribe-comics-gemini.js 1989 1995                    # Years 1989-1995
 *   node transcribe-comics-gemini.js                              # Show usage
 *
 * FEATURES:
 *   - Official Google Gemini 2.5 Flash Lite API
 *   - Smart skipping of existing transcripts
 *   - Automatic retries with exponential backoff
 *   - Progress tracking and comprehensive error handling
 *   - Multi-year batch processing
 *   - Structured JSON output with schema validation
 *   - Rate limiting to respect API quotas
 *
 * REQUIREMENTS:
 *   1. Create .env file with: GEMINI_API_KEY=your_api_key_here
 *   2. Install: npm install @google/genai
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path Configuration
const COMICS_DIR = path.join(__dirname, '../static/dilbert-comics'); // Input: comic images directory
const TRANSCRIPTS_DIR = path.join(__dirname, '../static/dilbert-transcripts'); // Output: transcripts directory

// API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-lite';

// Processing Configuration
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const YEAR_DELAY = 1000; // 1 seconds between years

if (!GEMINI_API_KEY) {
    console.error('❌ Please set GEMINI_API_KEY environment variable');
    console.log('💡 Get your API key from: https://ai.google.dev/');
    process.exit(1);
}

// Initialize Google GenAI with API key
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// Define the response schema for structured output using the new Type system
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        panels: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    panel: {
                        type: Type.NUMBER,
                        description: "Panel number"
                    },
                    dialogue: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        },
                        description: "Array of dialogue/text in the panel"
                    }
                },
                required: ["panel", "dialogue"]
            }
        }
    },
    required: ["panels"],
    propertyOrdering: ["panels"] // Important for consistent property ordering
};

// Helper function to convert image to base64
function imageToBase64(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString('base64');
    } catch (error) {
        throw new Error(`Failed to read image: ${error.message}`);
    }
}

// Helper function to create directories if they don't exist
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Helper function to add delay
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to clean JSON response (removes markdown code blocks)
function cleanJsonResponse(text) {
    // Remove markdown code blocks if present
    let cleaned = text.trim();

    // Check for ```json or ``` at the start
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*\n?/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*\n?/, '');
    }

    // Remove closing ``` if present
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.replace(/\n?```\s*$/, '');
    }

    return cleaned.trim();
}

// Function to transcribe a single comic using Google Gemini with retry logic
async function transcribeComic(imagePath, retryCount = 0) {
    const base64Image = imageToBase64(imagePath);

    const prompt = `You are transcribing a Dilbert comic strip. Please:
1. Read all text in the comic panels from left to right, top to bottom
2. For each panel, list the dialogue/text in the order it appears
3. Convert ALL text to proper sentence case for better readability
4. Don't identify who is speaking, just transcribe the text content
5. Maintain the sequential order of speech bubbles within each panel
6. If there's no text in a panel, indicate it as an empty dialogue array

Return the result as JSON in this exact format:
{
  "panels": [
    {
      "panel": 1,
      "dialogue": ["First speech bubble in sentence case", "Second speech bubble"]
    },
    {
      "panel": 2,
      "dialogue": ["Panel 2 text in sentence case"]
    }
  ]
}

Important: Convert text like "I LOVE WATCHING NBA GAMES" to "I love watching NBA games."

If there's no readable text, return: {"panels": [{"panel": 1, "dialogue": []}]}`;

    try {
        // Create the image part using the new format
        // Note: Even though files are .gif, we use image/png mime type as Gemini doesn't support GIF
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/png"
            }
        };

        // Generate content using the new API format
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                {
                    parts: [
                        { text: prompt },
                        imagePart
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
                maxOutputTokens: 1000,
            },
        });

        const text = response.text;

        // Clean and parse the JSON response (handles markdown code blocks)
        const cleanedText = cleanJsonResponse(text);
        const transcript = JSON.parse(cleanedText);
        
        // Validate the response structure
        if (!transcript.panels || !Array.isArray(transcript.panels)) {
            throw new Error('Invalid response structure: missing panels array');
        }

        return transcript;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Retry ${retryCount + 1}/${MAX_RETRIES} for ${path.basename(imagePath)}: ${error.message}`);
            await delay(RATE_LIMIT_DELAY * (retryCount + 1)); // Exponential backoff
            return transcribeComic(imagePath, retryCount + 1);
        }
        console.error(`❌ Error transcribing comic: ${error.message}`);
        return null;
    }
}

// Function to get all comic files for a given year
function getComicFiles(year) {
    const comicsDir = path.join(COMICS_DIR, year.toString());
    
    if (!fs.existsSync(comicsDir)) {
        throw new Error(`Comics directory not found: ${comicsDir}`);
    }
    
    const files = fs.readdirSync(comicsDir)
        .filter(file => file.endsWith('.gif'))
        .sort();
    
    return files.map(file => ({
        filename: file,
        date: file.replace('.gif', ''),
        path: path.join(comicsDir, file)
    }));
}

// Function to check if transcript already exists
function transcriptExists(date) {
    const year = date.split('-')[0];
    const transcriptPath = path.join(TRANSCRIPTS_DIR, year, `${date}.json`);
    return fs.existsSync(transcriptPath);
}

// Function to save transcript
function saveTranscript(date, transcript) {
    const year = date.split('-')[0];
    const transcriptsDir = path.join(TRANSCRIPTS_DIR, year);
    ensureDirectoryExists(transcriptsDir);
    
    const transcriptPath = path.join(transcriptsDir, `${date}.json`);
    const fullTranscript = {
        date: date,
        ...transcript
    };
    
    fs.writeFileSync(transcriptPath, JSON.stringify(fullTranscript, null, 2));
    return transcriptPath;
}

// Main transcription function for a single year
async function transcribeComics(year) {
    console.log(`🎯 Processing year ${year}`);
    console.log('='.repeat(50));
    
    try {
        // Get all comic files for the year
        const comics = getComicFiles(year);
        
        if (comics.length === 0) {
            console.log(`⚠️  No comics found for year ${year}`);
            return { processed: 0, skipped: 0, errors: 0 };
        }
        
        console.log(`📚 Found ${comics.length} comics for ${year}`);
        
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const comic of comics) {
            // Check if transcript already exists
            if (transcriptExists(comic.date)) {
                skipped++;
                console.log(`⏭️  Skipped ${comic.date} (already exists)`);
                console.log(`📊 Progress: ${processed + skipped + errors}/${comics.length} (${processed} new, ${skipped} skipped, ${errors} errors)\n`);
                continue;
            }
            
            try {
                console.log(`🔄 Transcribing ${comic.date}...`);
                const transcript = await transcribeComic(comic.path);
                
                if (transcript) {
                    const savedPath = saveTranscript(comic.date, transcript);
                    processed++;
                    console.log(`✅ Saved transcript: ${path.basename(savedPath)}`);
                } else {
                    errors++;
                    console.log(`❌ Failed to transcribe ${comic.date}`);
                }
                
                console.log(`📊 Progress: ${processed + skipped + errors}/${comics.length} (${processed} new, ${skipped} skipped, ${errors} errors)\n`);
                
                // Rate limiting
                if (processed + skipped + errors < comics.length) {
                    await delay(RATE_LIMIT_DELAY);
                }
            } catch (error) {
                errors++;
                console.error(`❌ Error processing ${comic.date}: ${error.message}`);
                console.log(`📊 Progress: ${processed + skipped + errors}/${comics.length} (${processed} new, ${skipped} skipped, ${errors} errors)\n`);
            }
        }
        
        console.log(`✅ Completed year ${year}: ${processed} transcribed, ${skipped} skipped, ${errors} errors`);
        return { processed, skipped, errors };
    } catch (error) {
        console.error(`❌ Error processing year ${year}: ${error.message}`);
        return { processed: 0, skipped: 0, errors: 1 };
    }
}

// Main function for multiple years
async function transcribeMultipleYears(startYear, endYear) {
    console.log(`🚀 Starting multi-year transcription from ${startYear} to ${endYear}`);
    console.log(`📅 This will process ${endYear - startYear + 1} years\n`);
    
    let totalProcessed = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (let year = startYear; year <= endYear; year++) {
        const yearIndex = year - startYear + 1;
        const totalYears = endYear - startYear + 1;
        
        console.log(`\n📆 Year ${year} (${yearIndex}/${totalYears})`);
        
        // Check if year directory exists
        const yearDir = path.join(COMICS_DIR, year.toString());
        if (!fs.existsSync(yearDir)) {
            console.log(`⚠️  Skipping ${year} - no comics directory found`);
            continue;
        }
        
        const stats = await transcribeComics(year);
        totalProcessed += stats.processed;
        totalSkipped += stats.skipped;
        totalErrors += stats.errors;
        
        // Delay between years
        if (year < endYear) {
            console.log(`⏳ Waiting ${YEAR_DELAY / 1000} seconds before next year...`);
            await delay(YEAR_DELAY);
        }
    }
    
    console.log(`\n🎉 Multi-year transcription completed!`);
    console.log(`📈 Final stats: ${totalProcessed} transcribed, ${totalSkipped} skipped, ${totalErrors} errors`);
    console.log(`📊 Years processed: ${startYear} to ${endYear}`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    // Interactive mode
    console.log(` 🎯 Dilbert Comics Bulk Transcription (Official Gemini API)
  Usage examples:
    node transcribe-comics-gemini.js 2023          # Single year
    node transcribe-comics-gemini.js 1989 1995     # Multiple years: 1989 to 1995
  `);
    process.exit(0);
} else if (args.length === 1) {
    // Transcribe single year
    const year = parseInt(args[0]);
    if (isNaN(year) || year < 1989 || year > 2023) {
        console.error('❌ Invalid year. Please use a year between 1989 and 2023.');
        process.exit(1);
    }
    transcribeComics(year);
} else if (args.length === 2) {
    // Transcribe multiple years
    const startYear = parseInt(args[0]);
    const endYear = parseInt(args[1]);
    
    if (isNaN(startYear) || isNaN(endYear) || startYear < 1989 || endYear > 2023 || startYear > endYear) {
        console.error('❌ Invalid years. Please use years between 1989 and 2023, with start year ≤ end year.');
        process.exit(1);
    }
    
    transcribeMultipleYears(startYear, endYear);
} else {
    console.error('❌ Invalid arguments.');
    console.log(`Usage:
  node transcribe-comics-gemini.js [year]                    # Single year
  node transcribe-comics-gemini.js [start-year] [end-year]   # Multiple years
  `);
    process.exit(1);
}
