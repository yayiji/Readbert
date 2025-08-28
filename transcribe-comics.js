#!/usr/bin/env node
/**
 * Dilbert Comics Bulk Transcription Script
 *
 * Transcribes Dilbert comics using OpenRouter's Gemini API with advanced features.
 *
 * USAGE:
 *   node transcribe-comics.js [year]                       # Single year
 *   node transcribe-comics.js [start-year] [end-year]      # Multiple years
 *
 * EXAMPLES:
 *   node transcribe-comics.js 1989                         # Entire year 1989
 *   node transcribe-comics.js 1989 1995                    # Years 1989-1995
 *   node transcribe-comics.js                              # Show usage
 *
 * FEATURES:
 *   - Gemini 2.5 Flash Lite model via OpenRouter
 *   - Smart skipping of existing transcripts
 *   - Automatic retries with rate limiting
 *   - Progress tracking and error handling
 *   - Multi-year batch processing
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
// const MODEL_NAME = 'google/gemini-2.5-flash';
const MODEL_NAME = "google/gemini-2.5-flash-lite";
// const MODEL_NAME = 'openai/gpt-4o-mini';
const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests
const MAX_RETRIES = 3;
const YEAR_DELAY = 5000; // 5 seconds between years

if (!OPENROUTER_API_KEY) {
  console.error("❌ Please set OPENROUTER_API_KEY environment variable");
  console.log("💡 Get your API key from: https://openrouter.ai/keys");
  process.exit(1);
}

// Helper function to convert image to base64
function imageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString("base64");
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

// Function to transcribe a single comic using OpenRouter Gemini (same as single-date script)
async function transcribeComic(imagePath, retryCount = 0) {
  const base64Image = imageToBase64(imagePath);

  const prompt = `
You are transcribing a Dilbert comic strip. Please:
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

If there's no readable text, return: {"panels": [{"panel": 1, "dialogue": []}]}
`;

  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/yayiji/VS-Dilbert",
        "X-Title": "Dilbert Comics Transcription",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from API");
    }

    const text = data.choices[0].message.content;

    // Parse the JSON response
    const transcript = JSON.parse(text);

    // Validate the response structure
    if (!transcript.panels || !Array.isArray(transcript.panels)) {
      throw new Error("Invalid response structure: missing panels array");
    }

    return transcript;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(
        `🔄 Retry ${retryCount + 1}/${MAX_RETRIES} for ${path.basename(
          imagePath
        )}: ${error.message}`
      );
      await delay(RATE_LIMIT_DELAY * (retryCount + 1)); // Exponential backoff
      return transcribeComic(imagePath, retryCount + 1);
    }
    console.error(`❌ Error transcribing comic: ${error.message}`);
    return null;
  }
}

// Function to get all comic files for a given year
function getComicFiles(year) {
  const comicsDir = path.join(
    __dirname,
    "source-data",
    "dilbert-comics",
    year.toString()
  );

  if (!fs.existsSync(comicsDir)) {
    throw new Error(`Comics directory not found: ${comicsDir}`);
  }

  const files = fs
    .readdirSync(comicsDir)
    .filter((file) => file.endsWith(".gif"))
    .sort();

  return files.map((file) => ({
    filename: file,
    date: file.replace(".gif", ""),
    path: path.join(comicsDir, file),
  }));
}

// Function to check if transcript already exists
function transcriptExists(date) {
  const year = date.split("-")[0];
  const transcriptPath = path.join(
    __dirname,
    "static",
    "dilbert-transcripts",
    year,
    `${date}.json`
  );
  return fs.existsSync(transcriptPath);
}

// Function to save transcript
function saveTranscript(date, transcript) {
  const year = date.split("-")[0];
  const transcriptsDir = path.join(
    __dirname,
    "static",
    "dilbert-transcripts",
    year
  );
  ensureDirectoryExists(transcriptsDir);

  const transcriptPath = path.join(transcriptsDir, `${date}.json`);
  const fullTranscript = {
    date: date,
    ...transcript,
  };

  fs.writeFileSync(transcriptPath, JSON.stringify(fullTranscript, null, 2));
  return transcriptPath;
}

// Main transcription function for a single year
async function transcribeComics(year) {
  console.log(`🎯 Processing year ${year}`);
  console.log("=".repeat(50));

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
        console.log(
          `📊 Progress: ${processed + skipped + errors}/${
            comics.length
          } (${processed} new, ${skipped} skipped, ${errors} errors)\n`
        );
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

        console.log(
          `📊 Progress: ${processed + skipped + errors}/${
            comics.length
          } (${processed} new, ${skipped} skipped, ${errors} errors)\n`
        );

        // Rate limiting
        if (processed + skipped + errors < comics.length) {
          await delay(RATE_LIMIT_DELAY);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${comic.date}: ${error.message}`);
        console.log(
          `📊 Progress: ${processed + skipped + errors}/${
            comics.length
          } (${processed} new, ${skipped} skipped, ${errors} errors)\n`
        );
      }
    }

    console.log(
      `✅ Completed year ${year}: ${processed} transcribed, ${skipped} skipped, ${errors} errors`
    );
    return { processed, skipped, errors };
  } catch (error) {
    console.error(`� Error processing year ${year}: ${error.message}`);
    return { processed: 0, skipped: 0, errors: 1 };
  }
}

// Main function for multiple years
async function transcribeMultipleYears(startYear, endYear) {
  console.log(
    `🚀 Starting multi-year transcription from ${startYear} to ${endYear}`
  );
  console.log(`📅 This will process ${endYear - startYear + 1} years\n`);

  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let year = startYear; year <= endYear; year++) {
    const yearIndex = year - startYear + 1;
    const totalYears = endYear - startYear + 1;

    console.log(`\n📆 Year ${year} (${yearIndex}/${totalYears})`);

    // Check if year directory exists
    const yearDir = path.join(
      __dirname,
      "source-data",
      "dilbert-comics",
      year.toString()
    );
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
      console.log(
        `⏳ Waiting ${YEAR_DELAY / 1000} seconds before next year...`
      );
      await delay(YEAR_DELAY);
    }
  }

  console.log(`\n🎉 Multi-year transcription completed!`);
  console.log(
    `📈 Final stats: ${totalProcessed} transcribed, ${totalSkipped} skipped, ${totalErrors} errors`
  );
  console.log(`📊 Years processed: ${startYear} to ${endYear}`);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Interactive mode
  console.log("🎯 Dilbert Bulk Transcription (OpenRouter Gemini)");
  console.log("Usage examples:");
  console.log("  node transcribe-comics.js 2023");
  console.log("  node transcribe-comics.js 1989 1995");
  process.exit(0);
} else if (args.length === 1) {
  // Transcribe single year
  const year = parseInt(args[0]);
  if (isNaN(year) || year < 1989 || year > 2023) {
    console.error("❌ Invalid year. Please use a year between 1989 and 2023.");
    process.exit(1);
  }
  transcribeComics(year);
} else if (args.length === 2) {
  // Transcribe multiple years
  const startYear = parseInt(args[0]);
  const endYear = parseInt(args[1]);

  if (
    isNaN(startYear) ||
    isNaN(endYear) ||
    startYear < 1989 ||
    endYear > 2023 ||
    startYear > endYear
  ) {
    console.error(
      "❌ Invalid years. Please use years between 1989 and 2023, with start year ≤ end year."
    );
    process.exit(1);
  }

  transcribeMultipleYears(startYear, endYear);
} else {
  console.error("❌ Invalid arguments.");
  console.log("Usage:");
  console.log(
    "  node transcribe-comics.js [year]                    # Single year"
  );
  console.log(
    "  node transcribe-comics.js [start-year] [end-year]   # Multiple years"
  );
  process.exit(1);
}
