# NutriWise Backend Server

This is the Vertex AI image generation server for NutriWise.

## Environment Variables Required

```
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CREDENTIALS_BASE64=your_base64_encoded_service_account_json
PORT=3001
NODE_ENV=production
```

## Deployment Options

### Option 1: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Select the `server` folder
4. Add environment variables
5. Deploy

### Option 2: Render
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Set root directory to `server`
5. Build command: `npm install`
6. Start command: `npm start`
7. Add environment variables

### Option 3: Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git subtree push --prefix server heroku main`
4. Add environment variables via Heroku dashboard

### Option 4: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. In server folder: `vercel`
3. Add environment variables via Vercel dashboard

## After Deployment

Update your frontend environment variable:
```
VITE_VERTEX_AI_API_URL=https://your-backend-url.com
```
