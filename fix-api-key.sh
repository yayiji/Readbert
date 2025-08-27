#!/bin/bash

echo "🔧 OpenRouter API Key Setup Instructions"
echo "========================================"
echo ""
echo "1. Visit: https://openrouter.ai/keys"
echo "2. Sign in to your OpenRouter account"
echo "3. Create a new API key or copy your existing one"
echo "4. Update your .env file with the new key:"
echo ""
echo "   OPENROUTER_API_KEY=your_new_api_key_here"
echo ""
echo "5. Make sure your OpenRouter account has credits/balance"
echo "6. Test again with: node test-api.js"
echo ""
echo "📋 Current .env file contents:"
cat .env
