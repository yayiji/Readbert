#!/usr/bin/env node
/**
 * Dilbert Comics Bulk Transcription Script
 * 
 * Transcribes Dilbert comics using OpenRouter's Gemini API with advanced features.
 * 
 * USAGE:
 *   node transcribe-comics.js [year] [start-date] [end-date]
 * 
 * EXAMPLES:
 *   node transcribe-comics.js 1989                         # Entire year
 *   node transcribe-comics.js 1989 1989-05-01 1989-05-31   # Date range
 *   node transcribe-comics.js                              # Show usage
 * 
 * FEATURES:
 *   - Gemini 2.5 Flash Lite model via OpenRouter
 *   - Smart skipping of existing transcripts
 *   - Automatic retries with rate limiting
 *   - Progress tracking and error handling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// const MODEL_NAME = 'google/gemini-2.5-flash';
const MODEL_NAME = 'google/gemini-2.5-flash-lite';
// const MODEL_NAME = 'openai/gpt-4o-mini';
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;

if (!OPENROUTER_API_KEY) {
    console.error('❌ Please set OPENROUTER_API_KEY environment variable');
    console.log('💡 Get your API key from: https://openrouter.ai/keys');
    process.exit(1);
}

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
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to transcribe a single comic using OpenRouter Gemini (same as single-date script)
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

    const requestBody = {
        model: MODEL_NAME,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/png;base64,${base64Image}`
                        }
                    }
                ]
            }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://github.com/yayiji/VS-Dilbert',
                'X-Title': 'Dilbert Comics Transcription'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid response structure from API');
        }

        const text = data.choices[0].message.content;
        
        // Parse the JSON response
        const transcript = JSON.parse(text);
        
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

// Function to get all comic files for a given year or date range
function getComicFiles(year, startDate = null, endDate = null) {
    const comicsDir = path.join(__dirname, 'source-data', 'dilbert-comics', year.toString());
    
    if (!fs.existsSync(comicsDir)) {
        throw new Error(`Comics directory not found: ${comicsDir}`);
    }
    
    let files = fs.readdirSync(comicsDir)
        .filter(file => file.endsWith('.gif'))
        .sort();
    
    if (startDate && endDate) {
        files = files.filter(file => {
            const fileDate = file.replace('.gif', '');
            return fileDate >= startDate && fileDate <= endDate;
        });
    }
    
    return files.map(file => ({
        filename: file,
        date: file.replace('.gif', ''),
        path: path.join(comicsDir, file)
    }));
}

// Function to check if transcript already exists
function transcriptExists(date) {
    const year = date.split('-')[0];
    const transcriptPath = path.join(__dirname, 'static', 'dilbert-transcripts', year, `${date}.json`);
    return fs.existsSync(transcriptPath);
}

// Function to save transcript
function saveTranscript(date, transcript) {
    const year = date.split('-')[0];
    const transcriptsDir = path.join(__dirname, 'static', 'dilbert-transcripts', year);
    ensureDirectoryExists(transcriptsDir);
    
    const transcriptPath = path.join(transcriptsDir, `${date}.json`);
    const fullTranscript = {
        date: date,
        ...transcript
    };
    
    fs.writeFileSync(transcriptPath, JSON.stringify(fullTranscript, null, 2));
    return transcriptPath;
}

// Main transcription function
async function transcribeComics(year, startDate = null, endDate = null) {
    console.log(`🚀 Starting bulk transcription for ${year}${startDate ? ` (${startDate} to ${endDate})` : ''}`);
    console.log(`📡 Using model: ${MODEL_NAME}`);
    console.log(`⏱️  Rate limit: ${RATE_LIMIT_DELAY}ms between requests\n`);
    
    try {
        const comics = getComicFiles(year, startDate, endDate);
        console.log(`📚 Found ${comics.length} comics to process\n`);
        
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const comic of comics) {
            try {
                // Check if already transcribed
                if (transcriptExists(comic.date)) {
                    console.log(`⏭️  Skipping ${comic.date} (already transcribed)`);
                    skipped++;
                    continue;
                }
                
                console.log(`🎯 Processing ${comic.date}...`);
                
                // Transcribe the comic
                const transcript = await transcribeComic(comic.path);
                
                // Save the transcript
                const savedPath = saveTranscript(comic.date, transcript);
                
                processed++;
                console.log(`✅ Saved transcript: ${path.basename(savedPath)}`);
                console.log(`📊 Progress: ${processed + skipped}/${comics.length} (${processed} new, ${skipped} skipped, ${errors} errors)\n`);
                
                // Rate limiting
                if (processed < comics.length - skipped) {
                    await delay(RATE_LIMIT_DELAY);
                }
                
            } catch (error) {
                errors++;
                console.error(`❌ Error processing ${comic.date}: ${error.message}`);
                console.log(`📊 Progress: ${processed + skipped + errors}/${comics.length} (${processed} new, ${skipped} skipped, ${errors} errors)\n`);
            }
        }
        
        console.log(`🎉 Bulk transcription completed!`);
        console.log(`📈 Final stats: ${processed} transcribed, ${skipped} skipped, ${errors} errors`);
        
    } catch (error) {
        console.error(`💥 Fatal error: ${error.message}`);
        process.exit(1);
    }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    // Interactive mode
    console.log('🎯 Dilbert Bulk Transcription (OpenRouter Gemini)');
    console.log('Usage examples:');
    console.log('  node transcribe-comics.js 2023');
    console.log('  node transcribe-comics.js 2023 2023-01-01 2023-01-31');
    process.exit(0);
} else if (args.length === 1) {
    // Transcribe entire year
    const year = parseInt(args[0]);
    if (isNaN(year) || year < 1989 || year > 2023) {
        console.error('❌ Invalid year. Please use a year between 1989 and 2023.');
        process.exit(1);
    }
    transcribeComics(year);
} else if (args.length === 3) {
    // Transcribe date range
    const year = parseInt(args[0]);
    const startDate = args[1];
    const endDate = args[2];
    
    if (isNaN(year) || year < 1989 || year > 2023) {
        console.error('❌ Invalid year. Please use a year between 1989 and 2023.');
        process.exit(1);
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        console.error('❌ Invalid date format. Please use YYYY-MM-DD format.');
        process.exit(1);
    }
    
    transcribeComics(year, startDate, endDate);
} else {
    console.error('❌ Invalid arguments. Use: node transcribe-comics.js [YYYY] [start-date] [end-date]');
    process.exit(1);
}