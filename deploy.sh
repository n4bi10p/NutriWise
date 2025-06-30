#!/bin/bash

echo "🚀 NutriWise Netlify Deployment Helper"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the NutriWise root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo ""
    echo "📋 Next Steps for Netlify Deployment:"
    echo ""
    echo "🌐 Deploy to Netlify (All-in-One Solution):"
    echo "   1. Go to netlify.com and connect your GitHub repo"
    echo "   2. Configure build settings:"
    echo "      - Build command: npm run build"
    echo "      - Publish directory: dist"
    echo "      - Node version: 18"
    echo ""
    echo "🔧 Set Environment Variables in Netlify:"
    echo "   - VITE_SUPABASE_URL=your_supabase_url"
    echo "   - VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "   - VITE_GEMINI_API_KEY=your_gemini_api_key"
    echo "   - GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project"
    echo "   - GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_service_account"
    echo ""
    echo "✨ Features included:"
    echo "   ✅ Frontend React app"
    echo "   ✅ Backend API via Netlify Functions"
    echo "   ✅ Vertex AI image generation"
    echo "   ✅ Bolt.new badge for DevPost compliance"
    echo "   ✅ Fully responsive design"
    echo ""
    echo "🎯 Your dist/ folder is ready for manual deployment if needed!"
    echo "📁 Netlify Functions are in netlify/functions/ directory"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
