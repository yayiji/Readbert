/**
 * Test script to verify Gemini API with a single comic image
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
}

// Initialize Google GenAI
const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY
});

// Define the response schema
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        panels: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    panel: {
                        type: Type.NUMBER,
                        description: "Panel number"
                    },
                    dialogue: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        },
                        description: "Array of dialogue/text in the panel"
                    }
                },
                required: ["panel", "dialogue"]
            }
        }
    },
    required: ["panels"]
};

// Helper function to convert image to base64
function imageToBase64(imagePath) {
    try {
        const imageBuffer = fs.readFileSync(imagePath);
        return imageBuffer.toString('base64');
    } catch (error) {
        throw new Error(`Failed to read image: ${error.message}`);
    }
}

// Function to find a test image
function findTestImage() {
    const comicsBaseDir = path.join(__dirname, 'source-data', 'dilbert-comics');
    
    // Try to find a comic from 1989 (early ones)
    const testDirs = ['1989', '2023', '2022', '2021'];
    
    for (const year of testDirs) {
        const yearDir = path.join(comicsBaseDir, year);
        if (fs.existsSync(yearDir)) {
            const files = fs.readdirSync(yearDir)
                .filter(file => file.endsWith('.gif'))
                .sort();
            
            if (files.length > 0) {
                const testFile = files[0]; // Take the first file
                return {
                    path: path.join(yearDir, testFile),
                    date: testFile.replace('.gif', ''),
                    year: year
                };
            }
        }
    }
    
    return null;
}

async function testSingleImage() {
    console.log('🔍 Finding a test comic image...');
    
    const testImage = findTestImage();
    if (!testImage) {
        console.error('❌ No test comic images found');
        return;
    }
    
    console.log(`📷 Testing with: ${testImage.date} from ${testImage.year}`);
    console.log(`📁 Image path: ${testImage.path}`);
    
    try {
        const base64Image = imageToBase64(testImage.path);
        console.log(`📊 Image size: ${Math.round(base64Image.length / 1024)} KB`);
        
        const prompt = `You are transcribing a Dilbert comic strip. Please:
1. Read all text in the comic panels from left to right, top to bottom
2. For each panel, list the dialogue/text in the order it appears
3. Convert ALL text to proper sentence case (first letter capitalized, rest lowercase) for better readability
4. Don't identify who is speaking, just transcribe the text content
5. Maintain the sequential order of speech bubbles within each panel
6. If there's no text in a panel, indicate it as an empty dialogue array

Important: Convert text like "I CREATED AN ADVISORY COUNCIL" to "I created an advisory council"

If there's no readable text, return a single panel with empty dialogue array.`;

        console.log('🚀 Sending image to Gemini API...');
        
        // Create the image part - try PNG first, then JPEG
        // Note: Gemini doesn't support GIF, so we'll try PNG mime type
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: "image/png"
            }
        };

        // Generate content
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    parts: [
                        { text: prompt },
                        imagePart
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
                maxOutputTokens: 1000,
            },
        });

        console.log('✅ API Response received!');
        
        const text = response.text;
        console.log('\n📝 Raw response:');
        console.log(text);
        
        // Parse the JSON response
        const transcript = JSON.parse(text);
        
        console.log('\n🎯 Parsed transcript:');
        console.log(JSON.stringify(transcript, null, 2));
        
        // Validate structure
        if (transcript.panels && Array.isArray(transcript.panels)) {
            console.log(`\n✅ Valid response structure with ${transcript.panels.length} panel(s)`);
            
            transcript.panels.forEach((panel, index) => {
                console.log(`   Panel ${panel.panel}: ${panel.dialogue.length} dialogue item(s)`);
                panel.dialogue.forEach((text, textIndex) => {
                    console.log(`     ${textIndex + 1}: "${text}"`);
                });
            });
        } else {
            console.error('❌ Invalid response structure');
        }
        
        console.log('\n🎉 Test completed successfully!');
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

testSingleImage();
