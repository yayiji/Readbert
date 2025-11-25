/**
 * Shared prompts for AI operations
 */

/**
 * Prompt for comic transcription (server and browser contexts)
 */
export const TRANSCRIPTION_PROMPT = `
You are transcribing a Dilbert comic strip. Please:
1. Read all text in the comic panels from left to right, top to bottom
2. For each panel, list the dialogue/text in the order it appears
3. Convert ALL text to proper sentence case for better readability
4. Don't identify who is speaking, just transcribe the text content
5. Maintain the sequential order of speech bubbles within each panel
6. If there's no text in a panel, indicate it as an empty dialogue array
7. Provide a brief and clever explanation of what's happening in the comic (the joke, context, or story)

Return the result as JSON in this exact format:
{
  "explanation": "What's happening in the comic and the joke/punchline",
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

If there's no readable text, return: {"explanation": "Explain what you see in this comic.", "panels": [{"panel": 1, "dialogue": []}]}
`;
