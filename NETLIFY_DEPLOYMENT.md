# NutriWise - Netlify Deployment Guide

## Overview
NutriWise is a full-stack React application that can be deployed entirely on Netlify using:
- **Frontend**: React app 
- **Backend**: Netlify Functions for Vertex AI image generation
- **Database**: Supabase
- **AI**: Google Gemini + Vertex AI

## Quick Deployment (All-in-One on Netlify)

### 1. Prepare Your Repository
```bash
git add .
git commit -m "Ready for Netlify deployment"
git push origin main
```

### 2. Deploy to Netlify
1. **Go to [netlify.com](https://netlify.com)**
2. **Click "New site from Git"**
3. **Connect your GitHub account and select your NutriWise repository**
4. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

### 3. Set Environment Variables
In Netlify dashboard → Site settings → Environment variables, add:

**Frontend Variables (must start with VITE_):**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key  
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Backend Variables (for Netlify Functions):**
```
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_service_account_credentials
```

### 4. Get Your Service Account Key (Base64)
1. **Download your Google Cloud service account JSON file**
2. **Convert to base64:**
   ```bash
   # On Linux/Mac:
   cat service-account-key.json | base64 -w 0
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("service-account-key.json"))
   ```
3. **Copy the base64 string to GOOGLE_CREDENTIALS_BASE64**

### 5. Deploy
- Click "Deploy site" 
- Your site will be available at a Netlify URL (e.g., `https://amazing-app-123456.netlify.app`)

## Alternative: Separate Backend Deployment

If you prefer to deploy the backend separately (Railway, Render, etc.), follow the original server deployment guide and set:
```
VITE_VERTEX_AI_API_URL=https://your-backend-server.com
```

## Features Included

✅ **Full React Frontend**
- Responsive design for mobile/tablet/desktop  
- Dark/light theme switching
- User authentication with Supabase
- Real-time chat with Gemini AI
- AI-powered image generation
- Nutrition tracking and meal planning

✅ **Netlify Functions Backend**  
- Vertex AI image generation API
- Automatic CORS handling
- Serverless scaling
- No separate server management needed

✅ **DevPost Compliance**
- Bolt.new badge visible in header
- Links to bolt.new as required
- Proper badge placement per guidelines

## Post-Deployment Checklist

**Netlify Site:**
- [ ] Site builds and deploys successfully
- [ ] All environment variables are set correctly
- [ ] Site loads without errors
- [ ] Authentication works with Supabase
- [ ] Chat assistant responds (Gemini AI working)
- [ ] Image generation works (Vertex AI working)
- [ ] Bolt.new badge is visible and clickable
- [ ] All pages work on mobile/tablet/desktop
- [ ] Theme switching works
- [ ] No console errors

**API Functions:**
- [ ] Visit `https://your-site.netlify.app/api/generate-food-image` (should show method not allowed - this is correct)
- [ ] Test image generation from the app
- [ ] Check Netlify function logs for any errors

## Troubleshooting

**Build Fails:**
- Check Node.js version is 18+
- Ensure all dependencies are installed
- Check for TypeScript/ESLint errors
- Verify package.json is correct

**Environment Variables:**
- Double-check variable names (frontend must start with `VITE_`)
- Ensure no trailing spaces in values  
- Redeploy after adding variables
- Backend env vars don't need `VITE_` prefix

**Netlify Function Errors:**
- Check function logs in Netlify dashboard
- Verify Google Cloud credentials are valid and base64 encoded correctly
- Ensure service account has Vertex AI permissions
- Check if project ID is correct

**Frontend API Calls Fail:**
- Verify functions are deploying correctly
- Check network tab for API request errors
- Ensure CORS is working (handled automatically by Netlify)

**Supabase Connection Issues:**
- Check RLS policies allow your operations
- Verify URL and anon key are correct  
- Ensure database tables exist and are properly configured

**Image Generation Not Working:**
- Verify Google Cloud credentials and project ID
- Check if Vertex AI API is enabled in Google Cloud
- Ensure service account has proper permissions
- Check function logs for specific error messages

## Local Development

For local development, you can still use the separate server approach:

```bash
# Terminal 1 - Start backend server
cd server
npm install
npm start

# Terminal 2 - Start frontend
npm install  
npm run dev
```

Set `VITE_VERTEX_AI_API_URL=http://localhost:3001` in your local `.env` file.

## Environment Variables Reference

Create `.env.netlify.example` file (already included) shows all required variables with instructions.

## Support

- Check Netlify function logs in the dashboard
- Use browser developer tools to debug frontend issues  
- Test API endpoints manually if needed
- Ensure all Google Cloud APIs are enabled
- Verify backend is accessible from frontend domain
