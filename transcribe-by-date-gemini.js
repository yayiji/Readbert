#!/usr/bin/env node
/**
 * Dilbert Comics Single Date Transcription Script (Google Gemini API)
 * 
 * This script transcribes a specific Dilbert comic by date using Google Gemini API.
 * 
 * USAGE:
 *   node transcribe-by-date-gemini.js YYYY-MM-DD
 * 
 * EXAMPLES:
 *   node transcribe-by-date-gemini.js 2023-01-15    # Transcribe comic from January 15, 2023
 *   node transcribe-by-date-gemini.js 1989-04-16    # Transcribe the very first Dilbert comic
 *   node transcribe-by-date-gemini.js 2022-12-25    # Transcribe Christmas comic from 2022
 * 
 * REQUIREMENTS:
 *   1. Create .env file with: GEMINI_API_KEY=your_api_key_here
 *   2. Comic image must exist at: source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif
 *   3. Install: npm install @google/genai
 * 
 * OUTPUT:
 *   - Saves transcript to: static/dilbert-transcripts/YYYY/YYYY-MM-DD.json
 *   - Displays formatted transcript in console
 *   - Shows both raw JSON and readable format
 * 
 * FEATURES:
 *   - Validates date format before processing
 *   - Checks if comic file exists before transcribing
 *   - Creates output directories automatically
 *   - Detailed error messages for troubleshooting
 *   - Uses Gemini's structured output for reliable JSON responses
 *   - Same transcription quality as bulk Gemini script
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
const MODEL_NAME = 'gemini-2.5-flash-lite'; 

if (!GEMINI_API_KEY) {
    console.error('❌ Please set GEMINI_API_KEY environment variable');
    console.log('💡 Get your API key from: https://ai.google.dev/');
    process.exit(1);
}

// Initialize Google GenAI with API key
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// Get date from command line argument
const dateArg = process.argv[2];

if (!dateArg) {
    console.error('❌ Please provide a date in YYYY-MM-DD format');
    console.error('Usage: node transcribe-by-date-gemini.js 2023-01-15');
    process.exit(1);
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(dateArg)) {
    console.error('❌ Invalid date format. Please use YYYY-MM-DD format');
    console.error('Example: node transcribe-by-date-gemini.js 2023-01-15');
    process.exit(1);
}

const [year, month, day] = dateArg.split('-');

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

// Function to display transcript in a readable format
function displayTranscript(transcript, date) {
    console.log(`\n📖 Transcript for Dilbert comic: ${date}`);
    console.log('─'.repeat(50));
    
    if (!transcript.panels || transcript.panels.length === 0) {
        console.log('No panels found or no text in the comic.');
        return;
    }

    transcript.panels.forEach(panel => {
        console.log(`\n📋 Panel ${panel.panel}:`);
        if (panel.dialogue && panel.dialogue.length > 0) {
            panel.dialogue.forEach((line, index) => {
                console.log(`  ${index + 1}. "${line}"`);
            });
        } else {
            console.log('  (No dialogue)');
        }
    });
    
    console.log('─'.repeat(50));
}

// Main function
async function main() {
    const comicsDir = path.join(__dirname, 'source-data', 'dilbert-comics', year);
    const transcriptsDir = path.join(__dirname, 'static', 'dilbert-transcripts');
    const imagePath = path.join(comicsDir, `${dateArg}.gif`);
    const transcriptPath = path.join(transcriptsDir, year, `${dateArg}.json`);

    console.log(`🎯 Transcribing Dilbert comic for date: ${dateArg}`);
    console.log(`🔍 Looking for comic at: ${imagePath}`);

    // Check if the comic file exists
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Comic file not found: ${imagePath}`);
        console.error(`💡 Make sure the comic exists in the correct directory structure.`);
        console.error(`   Expected path: source-data/dilbert-comics/${year}/${dateArg}.gif`);
        process.exit(1);
    }

    // Check if transcript already exists
    if (fs.existsSync(transcriptPath)) {
        console.log(`📄 Transcript already exists at: ${transcriptPath}`);
        console.log(`📖 Loading existing transcript...`);
        
        try {
            const existingTranscript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));
            displayTranscript(existingTranscript, dateArg);
            console.log(`\n✅ Existing transcript loaded successfully!`);
            console.log(`📁 Saved at: ${transcriptPath}`);
            return;
        } catch (error) {
            console.log(`❌ Error reading existing transcript, will recreate: ${error.message}`);
        }
    }

    console.log(`🤖 Using Google ${MODEL_NAME} for transcription...`);
    console.log(`🔄 Processing comic...`);

    try {
        const transcript = await transcribeComic(imagePath);
        
        if (!transcript) {
            console.error(`❌ Failed to transcribe comic for ${dateArg}`);
            process.exit(1);
        }

        // Save the transcript
        const outputPath = saveTranscript(dateArg, transcript, transcriptsDir);
        
        // Display the results
        console.log(`\n✅ Transcription completed successfully!`);
        console.log(`📁 Saved to: ${outputPath}`);
        
        // Show the transcript in readable format
        displayTranscript(transcript, dateArg);
        
        // Show raw JSON for reference
        console.log(`\n📋 Raw JSON output:`);
        console.log(JSON.stringify(transcript, null, 2));
        
    } catch (error) {
        console.error(`❌ Error processing comic: ${error.message}`);
        process.exit(1);
    }
}

// Run the script
main().catch(console.error);
