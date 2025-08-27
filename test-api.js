/**
 * Test API Connection Script
 * 
 * This script tests your API keys to ensure transcription will work.
 * 
 * USAGE:
 *   node test-api.js
 * 
 * REQUIREMENTS:
 *   1. Set up .env file with your API keys
 *   2. Have at least one comic image in source-data/dilbert-comics/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function testOpenRouterAPI() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.log('❌ OpenRouter API key not set in .env file');
    return false;
  }
  
  try {
    console.log('🔍 Testing OpenRouter API connection...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/your-repo',
        'X-Title': 'Dilbert Comics Transcription'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Respond with exactly: "API connection successful"'
          }
        ],
        max_tokens: 10
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenRouter API connection successful');
      console.log('📝 Response:', data.choices[0]?.message?.content || 'No content');
      return true;
    } else {
      console.log('❌ OpenRouter API connection failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ OpenRouter API test failed:', error.message);
    return false;
  }
}

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ Gemini API key not set in .env file');
    return false;
  }
  
  try {
    console.log('🔍 Testing Gemini API connection...');
    
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Respond with exactly: "API connection successful"');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API connection successful');
    console.log('📝 Response:', text);
    return true;
  } catch (error) {
    console.log('❌ Gemini API test failed:', error.message);
    return false;
  }
}

function checkComicImages() {
  const comicsDir = path.join(__dirname, 'source-data', 'dilbert-comics');
  
  if (!fs.existsSync(comicsDir)) {
    console.log('❌ Comics directory not found:', comicsDir);
    return false;
  }
  
  const years = fs.readdirSync(comicsDir).filter(item => {
    const yearPath = path.join(comicsDir, item);
    return fs.statSync(yearPath).isDirectory() && /^\d{4}$/.test(item);
  });
  
  if (years.length === 0) {
    console.log('❌ No comic year directories found');
    return false;
  }
  
  console.log(`✅ Found ${years.length} comic year directories:`, years.slice(0, 5).join(', '), years.length > 5 ? '...' : '');
  
  // Check for at least one comic image
  for (const year of years.slice(0, 3)) { // Check first 3 years
    const yearPath = path.join(comicsDir, year);
    const comics = fs.readdirSync(yearPath).filter(file => file.endsWith('.gif'));
    if (comics.length > 0) {
      console.log(`✅ Found ${comics.length} comics in ${year}`);
      return true;
    }
  }
  
  console.log('❌ No comic images found in checked directories');
  return false;
}

function checkOutputDirectory() {
  const outputDir = path.join(__dirname, 'static', 'dilbert-transcripts');
  
  if (!fs.existsSync(outputDir)) {
    console.log('📁 Creating transcripts directory:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('✅ Transcripts directory ready:', outputDir);
  return true;
}

async function main() {
  console.log('🧪 Testing Dilbert Comics Transcription Setup\n');
  
  console.log('📂 Checking file structure...');
  const hasComics = checkComicImages();
  const hasOutputDir = checkOutputDirectory();
  
  console.log('\n🔑 Testing API connections...');
  const openRouterWorks = await testOpenRouterAPI();
  const geminiWorks = await testGeminiAPI();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`Comics directory: ${hasComics ? '✅' : '❌'}`);
  console.log(`Output directory: ${hasOutputDir ? '✅' : '❌'}`);
  console.log(`OpenRouter API: ${openRouterWorks ? '✅' : '❌'}`);
  console.log(`Gemini API: ${geminiWorks ? '✅' : '❌'}`);
  
  if (hasComics && hasOutputDir && (openRouterWorks || geminiWorks)) {
    console.log('\n🎉 Setup looks good! You can start transcribing comics.');
    if (openRouterWorks) console.log('   Use: npm run transcribe');
    if (geminiWorks) console.log('   Use: npm run transcribe:gemini');
  } else {
    console.log('\n⚠️  Please fix the issues above before transcribing.');
  }
}

main().catch(console.error);
