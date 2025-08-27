#!/usr/bin/env node
/**
 * Dilbert Comics Single Date Transcription Script
 * 
 * This script transcribes a specific Dilbert comic by date using OpenRouter API.
 * 
 * USAGE:
 *   node transcribe-by-date.js YYYY-MM-DD
 * 
 * EXAMPLES:
 *   node transcribe-by-date.js 2023-01-15    # Transcribe comic from January 15, 2023
 *   node transcribe-by-date.js 1989-04-16    # Transcribe the very first Dilbert comic
 *   node transcribe-by-date.js 2022-12-25    # Transcribe Christmas comic from 2022
 * 
 * REQUIREMENTS:
 *   1. Create .env file with: OPENROUTER_API_KEY=your_api_key_here
 *   2. Comic image must exist at: source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif
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
 *   - Same transcription quality as bulk script
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

if (!OPENROUTER_API_KEY) {
    console.error('❌ Please set OPENROUTER_API_KEY environment variable');
    process.exit(1);
}

// Get date from command line argument
const dateArg = process.argv[2];

if (!dateArg) {
    console.error('❌ Please provide a date in YYYY-MM-DD format');
    console.error('Usage: node transcribe-by-date.js 2023-01-15');
    process.exit(1);
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRegex.test(dateArg)) {
    console.error('❌ Invalid date format. Please use YYYY-MM-DD format');
    console.error('Example: node transcribe-by-date.js 2023-01-15');
    process.exit(1);
}

const [year, month, day] = dateArg.split('-');

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
3. Convert ALL text to proper sentence case (first letter capitalized, rest lowercase) for better readability
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

Important: Convert text like "I CREATED AN ADVISORY COUNCIL" to "I created an advisory council"

If there's no readable text, return: {"panels": [{"panel": 1, "dialogue": []}]}`;

    try {
        console.log('🤖 Sending transcription request...');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Dilbert Comic Transcriber'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
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
        console.error(`❌ Transcription failed: ${error.message}`);
        return null;
    }
}

// Main function
async function main() {
    console.log(`🎯 Transcribing comic for date: ${dateArg}`);
    
    // Find the comic image
    const comicsDir = path.join(__dirname, 'source-data', 'dilbert-comics', year);
    const imagePath = path.join(comicsDir, `${dateArg}.gif`);
    
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Comic not found: ${imagePath}`);
        console.error('Make sure the comic exists in the correct location');
        process.exit(1);
    }
    
    console.log(`📸 Found comic: ${imagePath}`);
    
    // Transcribe the comic
    const transcript = await transcribeComic(imagePath);
    
    if (!transcript) {
        console.error('❌ Failed to transcribe comic');
        process.exit(1);
    }
    
    console.log('✅ Transcription completed!');
    console.log('\n📝 Transcript:');
    console.log(JSON.stringify(transcript, null, 2));
    
    // Save the transcript
    const transcriptsDir = path.join(__dirname, 'static', 'dilbert-transcripts', year);
    ensureDirectoryExists(transcriptsDir);
    
    const transcriptPath = path.join(transcriptsDir, `${dateArg}.json`);
    
    try {
        fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));
        console.log(`\n💾 Transcript saved to: ${transcriptPath}`);
    } catch (error) {
        console.error(`❌ Failed to save transcript: ${error.message}`);
    }
    
    // Display formatted transcript
    console.log('\n📖 Formatted transcript:');
    transcript.panels.forEach((panel, index) => {
        console.log(`\nPanel ${panel.panel}:`);
        if (panel.dialogue.length === 0) {
            console.log('  (No dialogue)');
        } else {
            panel.dialogue.forEach((line, lineIndex) => {
                console.log(`  ${lineIndex + 1}. ${line}`);
            });
        }
    });
}

// Run the script
main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
});
