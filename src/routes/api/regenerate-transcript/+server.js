import fs from "fs";
import path from "path";
import { json } from "@sveltejs/kit";
import { OPENROUTER_API_KEY } from "$env/static/private";
import { isValidComicDate, isValidComicDateRange } from "$lib/dateUtils.js";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "google/gemini-2.5-flash-lite";
const RATE_LIMIT_DELAY = 2000;
const MAX_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanJsonResponse(text) {
  let cleaned = text.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*\n?/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*\n?/, "");
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.replace(/\n?```\s*$/, "");
  }

  return cleaned.trim();
}

function getImagePath(date) {
  const year = date.split("-")[0];
  return path.join(
    process.cwd(),
    "static",
    "dilbert-comics",
    year,
    `${date}.gif`,
  );
}

async function getImageBase64(date) {
  const imagePath = getImagePath(date);
  const imageBuffer = await fs.promises.readFile(imagePath);
  return imageBuffer.toString("base64");
}

async function transcribeComic(date, retryCount = 0) {
  const base64Image = await getImageBase64(date);

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
        "X-Title": "Dilbert Comics Transcription (On-demand)",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}\n${errorText}`,
      );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text || typeof text !== "string") {
      throw new Error("Invalid response structure from API");
    }

    const cleanedText = cleanJsonResponse(text);
    const transcript = JSON.parse(cleanedText);

    if (!transcript.panels || !Array.isArray(transcript.panels)) {
      throw new Error("Invalid response structure: missing panels array");
    }

    return transcript;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RATE_LIMIT_DELAY * (retryCount + 1));
      return transcribeComic(date, retryCount + 1);
    }
    throw error;
  }
}

export async function POST({ request }) {
  if (!OPENROUTER_API_KEY) {
    return json(
      { error: "OPENROUTER_API_KEY is not configured on the server" },
      { status: 500 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { date } = body || {};

  if (!date || typeof date !== "string") {
    return json({ error: "Missing or invalid 'date' field" }, { status: 400 });
  }

  if (!isValidComicDate(date) || !isValidComicDateRange(date)) {
    return json({ error: "Invalid comic date" }, { status: 422 });
  }

  try {
    const transcript = await transcribeComic(date);
    return json({ date, transcript });
  } catch (error) {
    console.error("Error regenerating transcript:", error);
    return json(
      {
        error: "Failed to regenerate transcript",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

