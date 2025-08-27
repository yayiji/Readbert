import { json } from '@sveltejs/kit';

export async function POST({ request }) {
  try {
    const { imageUrl, date } = await request.json();
    
    if (!imageUrl) {
      return json({ success: false, error: 'Image URL is required' }, { status: 400 });
    }

    // You'll need to add your OpenRouter API key as an environment variable
    // const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_API_KEY = "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";
    
    console.log('Environment check:', {
      hasKey: !!OPENROUTER_API_KEY,
      keyStart: OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + '...' : 'undefined'
    });
    
    if (!OPENROUTER_API_KEY) {
      return json({ 
        success: false, 
        error: 'OpenRouter API key not configured' 
      }, { status: 500 });
    }

    // Convert relative URL to absolute URL for the API
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${new URL(request.url).origin}${imageUrl}`;

    console.log('Fetching image from:', absoluteImageUrl);
    
    // Fetch the image and convert to base64
    const imageResponse = await fetch(absoluteImageUrl);
    if (!imageResponse.ok) {
      return json({ 
        success: false, 
        error: 'Failed to fetch image' 
      }, { status: 500 });
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/gif';

    console.log('Image details:', {
      size: imageBuffer.byteLength,
      mimeType,
      base64Length: base64Image.length,
      base64Preview: base64Image.substring(0, 50) + '...'
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': new URL(request.url).origin,
        'X-Title': 'Dilbert Comics Archive'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract only the text content from this comic. Return just the text in sentence case, with each line of dialogue or text on a separate line. Format it compactly with no empty lines between text. Use clear panel numbers (1., 2., 3., etc.) to indicate which panel each text comes from. Do not include character names or descriptions - only the actual text that appears in speech bubbles, thought bubbles, signs, or anywhere else in the comic.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
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
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return json({ 
        success: false, 
        error: `OpenRouter API error: ${response.status}` 
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return json({ 
        success: false, 
        error: 'Invalid response from OpenRouter API' 
      }, { status: 500 });
    }

    const transcription = data.choices[0].message.content;

    return json({
      success: true,
      transcription,
      date
    });

  } catch (error) {
    console.error('Error in transcription API:', error);
    return json({ 
      success: false, 
      error: 'Internal server error during transcription' 
    }, { status: 500 });
  }
}
