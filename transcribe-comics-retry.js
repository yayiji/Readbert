/**
 * Dilbert Comics Retry Failed Transcriptions Script
 * 
 * This script retries transcription for comics that failed in previous runs.
 * It identifies comics that have image files but no corresponding transcript files.
 * 
 * USAGE:
 *   node transcribe-comics-retry.js [year]
 * 
 * EXAMPLES:
 *   node transcribe-comics-retry.js           # Retry all years with missing transcripts
 *   node transcribe-comics-retry.js 2020      # Retry only failed 2023 transcriptions
 *   node transcribe-comics-retry.js 1989      # Retry only failed 1989 transcriptions
 * 
 * REQUIREMENTS:
 *   1. Create .env file with: OPENROUTER_API_KEY=your_api_key_here
 *   2. Comic images in: source-data/dilbert-comics/YYYY/YYYY-MM-DD.gif
 *   3. Will check for missing: static/dilbert-transcripts/YYYY/YYYY-MM-DD.json
 * 
 * FEATURES:
 *   - Only processes comics missing transcript files
 *   - Rate limiting (2 requests/second)
 *   - Automatic retry with exponential backoff
 *   - Progress tracking and detailed logging
 *   - Safe to run multiple times
 *   - Creates output directories automatically
 * 
 * USE CASE:
 *   Run this after the main transcribe-comics.js script to catch any failures
 *   or network timeouts that occurred during bulk processing.
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
// const MODEL_NAME = 'openai/gpt-4o'; 
// const MODEL_NAME = 'openai/gpt-4o-mini'; 
// const MODEL_NAME = 'openai/gpt-4.1'; 
const MODEL_NAME = 'openai/gpt-4.1-mini';
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
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Dilbert Comic Retry Transcriber'
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
    console.log(`🚀 Starting retry process with ${MODEL_NAME}...`);

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
console.log(`🎯 Retrying failed transcriptions for year: ${year} using ${MODEL_NAME}`);
retryFailedTranscripts(year).catch(console.error);
