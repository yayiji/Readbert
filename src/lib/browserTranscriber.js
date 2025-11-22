const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL_NAME = "google/gemini-2.5-flash-lite";
// const OPENROUTER_MODEL_NAME = "google/gemini-2.5-flash";

function cleanJsonResponse(text) {
  if (!text) return "";
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

async function imageUrlToPngDataUrl(imageUrl) {
  const response = await fetch(imageUrl, { mode: "cors" });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  // Important: label as PNG to match server-side behavior
  return `data:image/png;base64,${base64}`;
}

export async function transcribeComicInBrowser(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Invalid image URL for browser LLM call.");
  }

  if (typeof window === "undefined") {
    throw new Error("Browser-only regeneration is not available on the server.");
  }

  const OPENROUTER_API_KEY_TEST="";

  const apiKey =
    window.localStorage.getItem("OPENROUTER_API_KEY") ||
    window.localStorage.getItem("openrouter_api_key") || OPENROUTER_API_KEY_TEST;
    
  if (!apiKey) {
    throw new Error(
      "Set OPENROUTER_API_KEY in localStorage to use the browser LLM call.",
    );
  }

  let imageUrlForApi = imageUrl;
  try {
    imageUrlForApi = await imageUrlToPngDataUrl(imageUrl);
  } catch (error) {
    console.warn(
      "Could not read image data locally, falling back to image URL:",
      error,
    );
  }

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
    model: OPENROUTER_MODEL_NAME,
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
              url: imageUrlForApi,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  };

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/yayiji/VS-Dilbert",
      "X-Title": "Dilbert Comics Transcription (Browser)",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        if (typeof errorBody.error === "string") {
          errorMessage += `: ${errorBody.error}`;
        } else {
          errorMessage += `: ${JSON.stringify(errorBody.error)}`;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text || typeof text !== "string") {
    throw new Error("Invalid response structure from API");
  }

  const cleanedText = cleanJsonResponse(text);
  const transcriptObj = JSON.parse(cleanedText);

  if (!transcriptObj.panels || !Array.isArray(transcriptObj.panels)) {
    throw new Error("Invalid response structure: missing panels array");
  }

  return transcriptObj;
}
