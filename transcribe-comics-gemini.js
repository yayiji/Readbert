/**
 * Dilbert Comics Bulk Transcription Script (Google Gemini API)
 * 
 * This script transcribes Dilbert comic images to JSON text using Google Gemini API.
 * 
 * USAGE:
 *   node transcribe-comics-gemini.js [year]
 * 
 * EXAMPLES:
 *   node transcribe-comics-gemini.js           # Transcribe all available years
 *   node transcribe-comics-gemini.js 2023      # Transcribe only 2023 comics
 *   node transcribe-comics-gemini.js 1989      # Transcribe only 1989 comics
 * 
 * REQUIREMENTS:
 *   1. Create .env file with: GEMINI_API_KEY=your_api_key_here
 *   2. Comic images must be in: source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif
 *   3. Transcripts will be saved to: static/dilbert-transcripts/YYYY/YYYY-MM-DD.json
 *   4. Install: npm install @google/genai
 * 
 * FEATURES:
 *   - Rate limiting (2 requests/second to respect API limits)
 *   - Automatic retry on failures
 *   - Progress tracking with detailed logging
 *   - Skips already transcribed comics
 *   - Creates output directories automatically
 *   - Uses Gemini's structured output for reliable JSON responses
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

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// const MODEL_NAME = 'gemini-2.5-flash'; 
const MODEL_NAME = 'gemini-2.5-flash-lite'; 
const RATE_LIMIT_DELAY = 500; // 500ms between requests (2 requests per second)

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

// Function to transcribe a single comic using Google Gemini
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
        
        // Parse the JSON response
        const transcript = JSON.parse(text);
        
        // Validate the response structure
        if (!transcript.panels || !Array.isArray(transcript.panels)) {
            throw new Error('Invalid response structure: missing panels array');
        }

        return transcript;
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
    console.log(`🚀 Starting transcription with Google ${MODEL_NAME}...`);

    let processed = 0;
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const filename of comicFiles) {
        const date = filename.replace('.gif', '');
        const imagePath = path.join(comicsDir, filename);
        const transcriptPath = path.join(transcriptsDir, year, `${date}.json`);

        // Skip if transcript already exists
        if (fs.existsSync(transcriptPath)) {
            console.log(`⏭️  Skipping ${date} (transcript exists)`);
            processed++;
            skipped++;
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
    console.log(`📊 Total comics: ${comicFiles.length}`);
    console.log(`⏭️  Skipped (already done): ${skipped}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log(`\n💡 Run 'node transcribe-comics-retry-gemini.js ${year}' to retry failed transcripts.`);
    }
}

// Function to process all available years
async function processAllYears() {
    const comicsBaseDir = path.join(__dirname, 'source-data', 'dilbert-comics');
    
    if (!fs.existsSync(comicsBaseDir)) {
        console.error(`❌ Comics base directory not found: ${comicsBaseDir}`);
        return;
    }

    // Get all year directories
    const years = fs.readdirSync(comicsBaseDir)
        .filter(item => {
            const yearPath = path.join(comicsBaseDir, item);
            return fs.statSync(yearPath).isDirectory() && /^\d{4}$/.test(item);
        })
        .sort();

    console.log(`📅 Found ${years.length} years to process: ${years.join(', ')}`);
    
    for (const year of years) {
        console.log(`\n🎯 Processing year: ${year}`);
        await processYear(year);
        
        // Pause between years
        if (years.indexOf(year) < years.length - 1) {
            console.log(`\n⏸️  Pausing 2 seconds before next year...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Run the script
const yearArg = process.argv[2];

if (yearArg) {
    console.log(`🎯 Transcribing Dilbert comics for year: ${yearArg}`);
    processYear(yearArg).catch(console.error);
} else {
    console.log(`🎯 Transcribing Dilbert comics for all available years`);
    processAllYears().catch(console.error);
}
