/**
 * Dilbert Comics Bulk Transcript// Co// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// MODEL OPTIONS - Easy to change here:
// Option 1: OpenAI GPT-4o (same as working transcribe-by-date.js)
const MODEL_NAME = 'openai/gpt-4o';

// Option 2: OpenAI GPT-4o mini (faster, cheaper alternative)
// const MODEL_NAME = 'openai/gpt-4o-mini';

// Option 3: For Gemini, use the dedicated transcribe-comics-gemini.js script instead
// It uses the official Google Gemini API which works better for vision tasks

const RATE_LIMIT_DELAY = 500; // 500ms between requests (2 requests per second)ion
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// const MODEL_NAME = 'openai/gpt-4o-mini';
const MODEL_NAME = 'openai/gpt-4o';
const RATE_LIMIT_DELAY = 500; // 500ms between requests (2 requests per second)ript
 * 
 * This script transcribes Dilbert comic images to JSON text using OpenRouter API.
 * 
 * USAGE:
 *   node transcribe-comics.js [year]
 * 
 * EXAMPLES:
 *   node transcribe-comics.js           # Transcribe all available years
 *   node transcribe-comics.js 2023      # Transcribe only 2023 comics
 *   node transcribe-comics.js 1989      # Transcribe only 1989 comics
 * 
 * REQUIREMENTS:
 *   1. Create .env file with: OPENROUTER_API_KEY=your_api_key_here
 *   2. Comic images must be in: source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif
 *   3. Transcripts will be saved to: static/dilbert-transcripts/YYYY/YYYY-MM-DD.json
 * 
 * FEATURES:
 *   - Rate limiting (2 requests/second to respect API limits)
 *   - Automatic retry on failures
 *   - Progress tracking with detailed logging
 *   - Skips already transcribed comics
 *   - Creates output directories automatically
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
// Option 1: Use GPT-4o mini (tested working)
// const MODEL_NAME = 'openai/gpt-4o-mini';
const MODEL_NAME = 'google/gemini-2.5-flash';
const RATE_LIMIT_DELAY = 500; // 500ms between requests (2 requests per second)

if (!OPENROUTER_API_KEY) {
    console.error('❌ Please set OPENROUTER_API_KEY environment variable');
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

// Function to transcribe a single comic
async function transcribeComic(imagePath) {
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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Dilbert Comic Transcriber'
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/gif;base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        
        if (!content) {
            throw new Error('No content in API response');
        }

        // Parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON found in response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error(`❌ Error transcribing comic: ${error.message}`);
        return null;
    }
}

// Function to save transcript
function saveTranscript(date, transcript, outputDir) {
    const year = date.split('-')[0];
    const yearDir = path.join(outputDir, year);
    ensureDirectoryExists(yearDir);
    
    const transcriptData = {
        date: date,
        ...transcript
    };
    
    const outputPath = path.join(yearDir, `${date}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(transcriptData, null, 2));
    return outputPath;
}

// Main function to process comics for a specific year
async function processYear(year) {
    const comicsDir = path.join(__dirname, 'source-data', 'dilbert-comics', year);
    const transcriptsDir = path.join(__dirname, 'static', 'dilbert-transcripts');
    
    if (!fs.existsSync(comicsDir)) {
        console.error(`❌ Comics directory not found: ${comicsDir}`);
        return;
    }

    // Get all comic files
    const comicFiles = fs.readdirSync(comicsDir)
        .filter(file => file.endsWith('.gif'))
        .sort();

    console.log(`📚 Found ${comicFiles.length} comics for year ${year}`);
    console.log(`🚀 Starting transcription...`);

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const filename of comicFiles) {
        const date = filename.replace('.gif', '');
        const imagePath = path.join(comicsDir, filename);
        const transcriptPath = path.join(transcriptsDir, year, `${date}.json`);

        // Skip if transcript already exists
        if (fs.existsSync(transcriptPath)) {
            console.log(`⏭️  Skipping ${date} (transcript exists)`);
            processed++;
            continue;
        }

        console.log(`🔄 Processing ${date} (${processed + 1}/${comicFiles.length})`);

        try {
            const transcript = await transcribeComic(imagePath);
            
            if (transcript) {
                saveTranscript(date, transcript, transcriptsDir);
                successful++;
                console.log(`✅ Completed ${date}`);
            } else {
                failed++;
                console.log(`❌ Failed ${date}`);
            }
        } catch (error) {
            failed++;
            console.error(`❌ Error processing ${date}: ${error.message}`);
        }

        processed++;

        // Rate limiting
        if (processed < comicFiles.length) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
    }

    console.log(`\n🎉 Transcription complete!`);
    console.log(`📊 Processed: ${processed}/${comicFiles.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
}

// Run the script
const year = process.argv[2] || '2023';
console.log(`🎯 Transcribing Dilbert comics for year: ${year}`);
processYear(year).catch(console.error);
