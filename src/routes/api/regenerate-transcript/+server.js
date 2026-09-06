import { json } from "@sveltejs/kit";
import { OPENROUTER_API_KEY } from "$env/static/private";
import { cleanJsonResponse } from "$lib/cleanJsonResponse.js";
import { isValidComicDate, isValidComicDateRange } from "$lib/dateUtils.js";
import { TRANSCRIPTION_PROMPT } from "$lib/prompts.js";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "google/gemini-3.1-flash-lite";
// const MODEL_NAME = "google/gemini-2.5-flash-lite";
const RATE_LIMIT_DELAY = 2000;
const MAX_RETRIES = 3;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getImageUrl(date, baseUrl) {
  const year = date.split("-")[0];
  return new URL(`/dilbert-comics/${year}/${date}.gif`, baseUrl).toString();
}

async function getImageBase64(date, fetchFn, baseUrl) {
  const imageUrl = getImageUrl(date, baseUrl);
  const response = await fetchFn(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch comic image (${response.status} ${response.statusText})`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

async function transcribeComic(date, fetchFn, baseUrl, retryCount = 0) {
  const base64Image = await getImageBase64(date, fetchFn, baseUrl);

  const requestBody = {
    model: MODEL_NAME,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: TRANSCRIPTION_PROMPT,
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

    if (!transcript.explanation || typeof transcript.explanation !== "string") {
      throw new Error("Invalid response structure: missing or invalid explanation");
    }

    return transcript;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RATE_LIMIT_DELAY * (retryCount + 1));
      return transcribeComic(date, fetchFn, baseUrl, retryCount + 1);
    }
    throw error;
  }
}

export async function POST({ request, fetch, url }) {
  const baseUrl = url.origin;

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
    const transcript = await transcribeComic(date, fetch, baseUrl);
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
