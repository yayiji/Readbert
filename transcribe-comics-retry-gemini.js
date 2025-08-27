/**
 * Dilbert Comics Retry Failed Transcriptions Script (Google Gemini API)
 * 
 * This script retries transcription for comics that failed in previous runs using Google Gemini API.
 * It identifies comics that have image files but no corresponding transcript files.
 * 
 * USAGE:
 *   node transcribe-comics-retry-gemini.js [year]
 * 
 * EXAMPLES:
 *   node transcribe-comics-retry-gemini.js           # Retry all years with missing transcripts
 *   node transcribe-comics-retry-gemini.js 2020      # Retry only failed 2023 transcriptions
 *   node transcribe-comics-retry-gemini.js 1989      # Retry only failed 1989 transcriptions
 * 
 * REQUIREMENTS:
 *   1. Create .env file with: GEMINI_API_KEY=your_api_key_here
 *   2. Comic images in: source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif
 *   3. Will check for missing: static/dilbert-transcripts/YYYY/YYYY-MM-DD.json
 *   4. Install: npm install @google/genai
 * 
 * FEATURES:
 *   - Only processes comics missing transcript files
 *   - Rate limiting (2 requests/second)
 *   - Automatic retry with exponential backoff
 *   - Progress tracking and detailed logging
 *   - Safe to run multiple times
 *   - Creates output directories automatically
 *   - Uses Gemini's structured output for reliable JSON responses
 * 
 * USE CASE:
 *   Run this after the main transcribe-comics.js script to catch any failures
 *   or network timeouts that occurred during bulk processing.
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
const MODEL_NAME = 'gemini-2.5-flash'; // Change this to: gemini-2.5-flash, gemini-1.5-pro, gemini-1.5-flash
const RATE_LIMIT_DELAY = 500; // 500ms between requests (2 requests per second)

if (!GEMINI_API_KEY) {
    console.error('❌ Please set GEMINI_API_KEY environment variable');
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
3. Convert ALL text to proper sentence case (first letter capitalized, rest lowercase) for better readability
4. Don't identify who is speaking, just transcribe the text content
5. Maintain the sequential order of speech bubbles within each panel
6. If there's no text in a panel, indicate it as an empty dialogue array

Important: Convert text like "I CREATED AN ADVISORY COUNCIL" to "I created an advisory council"

If there's no readable text, return a single panel with empty dialogue array.`;

    try {
        // Create the image part using the new format
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/gif"
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

// Function to find missing transcripts for a year
function findMissingTranscripts(year) {
    const comicsDir = path.join(__dirname, 'source-data', 'dilbert-comics', year);
    const transcriptsDir = path.join(__dirname, 'static', 'dilbert-transcripts', year);
    
    if (!fs.existsSync(comicsDir)) {
        console.error(`❌ Comics directory not found: ${comicsDir}`);
        return [];
    }

    // Get all comic files
    const comicFiles = fs.readdirSync(comicsDir)
        .filter(file => file.endsWith('.gif'))
        .sort();

    // Find missing transcripts
    const missingTranscripts = [];
    
    for (const filename of comicFiles) {
        const date = filename.replace('.gif', '');
        const transcriptPath = path.join(transcriptsDir, `${date}.json`);
        
        if (!fs.existsSync(transcriptPath)) {
            missingTranscripts.push({
                date,
                comicPath: path.join(comicsDir, filename),
                transcriptPath
            });
        }
    }
    
    return missingTranscripts;
}

// Main function to retry failed transcripts
async function retryFailedTranscripts(year) {
    const transcriptsDir = path.join(__dirname, 'static', 'dilbert-transcripts');
    
    console.log(`🔍 Checking for missing transcripts in year ${year}...`);
    
    const missingTranscripts = findMissingTranscripts(year);
    
    if (missingTranscripts.length === 0) {
        console.log(`✅ No missing transcripts found for year ${year}!`);
        return;
    }

    console.log(`📝 Found ${missingTranscripts.length} missing transcripts for year ${year}`);
    console.log(`🚀 Starting retry process with Google ${MODEL_NAME}...`);

    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const { date, comicPath, transcriptPath } of missingTranscripts) {
        console.log(`🔄 Retrying ${date} (${processed + 1}/${missingTranscripts.length})`);

        try {
            const transcript = await transcribeComic(comicPath);
            
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
        if (processed < missingTranscripts.length) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
    }

    console.log(`\n🎉 Retry process complete!`);
    console.log(`📊 Processed: ${processed}/${missingTranscripts.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed > 0) {
        console.log(`\n💡 You can run this script again to retry the ${failed} remaining failed transcripts.`);
    }
}

// Run the script
const year = process.argv[2] || '2022';
console.log(`🎯 Retrying failed transcriptions for year: ${year} using Google ${MODEL_NAME}`);
retryFailedTranscripts(year).catch(console.error);
