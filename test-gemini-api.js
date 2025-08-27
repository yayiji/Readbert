/**
 * Test script to verify Google Gemini API key and connection
 */

import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load environment variables
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Testing Google Gemini API connection...');
console.log(`API Key: ${GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 15)}...` : 'NOT FOUND'}`);

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('💡 Get your API key from: https://ai.google.dev/');
    process.exit(1);
}

async function testGeminiAPI() {
    try {
        console.log('🚀 Making test API request...');
        
        // Initialize Google GenAI
        const ai = new GoogleGenAI({
            apiKey: GEMINI_API_KEY
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: 'Test message - please respond with "Gemini API connection successful"' }
                    ]
                }
            ],
            config: {
                temperature: 0.1,
                maxOutputTokens: 50,
            },
        });

        console.log('✅ API Response received successfully!');
        console.log(`🎯 AI Response: "${response.text}"`);
        console.log('✅ Gemini API is working correctly!');

    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.log('💡 Your API key appears to be invalid. Please check:');
            console.log('   1. Visit https://ai.google.dev/ to get a valid key');
            console.log('   2. Make sure your .env file has: GEMINI_API_KEY=your_actual_key');
            console.log('   3. Ensure the API key has the correct permissions');
        }
    }
}

testGeminiAPI();
