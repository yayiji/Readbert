/**
 * Test script to verify OpenRouter API key and connection
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

console.log('🔍 Testing OpenRouter API connection...');
console.log(`API Key: ${OPENROUTER_API_KEY ? `${OPENROUTER_API_KEY.substring(0, 10)}...` : 'NOT FOUND'}`);

if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables');
    process.exit(1);
}

async function testAPI() {
    try {
        console.log('🚀 Making test API request...');
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'Dilbert Comic Transcriber Test'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'user',
                        content: 'Test message - please respond with "API connection successful"'
                    }
                ],
                max_tokens: 50,
                temperature: 0.1
            })
        });

        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ API Error Response: ${errorText}`);
            return;
        }

        const data = await response.json();
        console.log('✅ API Response:', JSON.stringify(data, null, 2));
        
        const content = data.choices[0]?.message?.content;
        if (content) {
            console.log(`🎯 AI Response: "${content}"`);
        }

    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
    }
}

testAPI();
