# NutriWise

Your AI-powered nutrition companion. NutriWise is a modern, full-stack web app for meal planning, nutrition tracking, grocery management, and community-powered healthy living. Built entirely with the help of Bolt.ai.

---

## 🚀 Features

- **AI Chat Assistant**: Real-time nutrition and health Q&A powered by Google Gemini AI
- **Menu Analyzer**: Upload a menu or meal photo and get instant dish analysis and recommendations
- **Meal Planner**: Personalized meal plans with auto-save and progress tracking
- **Grocery List**: Smart, auto-saving grocery lists based on your meal plan
- **Achievements & Gamification**: Earn points, badges, and track your health streaks
- **Community Recipes**: Share and discover healthy recipes with ratings
- **Notifications**: Stay on track with reminders and achievement alerts
- **Settings & Profile**: Customizable goals, dietary preferences, and profile photo
- **Theme Switching**: Beautiful light/dark mode with smooth transitions
- **Professional Food Images**: Google Vertex AI integration for realistic food photography
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Secure**: Supabase authentication and Row Level Security (RLS) for all user data

---

## 🛠️ Technologies Used

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express (for Vertex AI server), Netlify Functions (for serverless deployment)
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Google Gemini (chat), Google Vertex AI (image generation)
- **State Management**: React hooks
- **Other**: PostCSS, ESLint, Prettier
- **DevOps**: Netlify (all-in-one deploy), Vercel/Railway/Render (optional backend)
- **Badge**: Bolt.new badge for DevPost compliance

---

## ⚡️ Built with Bolt.ai

This project was developed entirely using Bolt.ai for code generation, refactoring, and troubleshooting. The Bolt.new badge is proudly displayed in the app header.

---

## 📦 Project Structure

```
/ (root)
├── src/                # React frontend (components, pages, styles)
├── server/             # Vertex AI backend (Express server)
├── netlify/functions/  # Netlify Functions for serverless backend
├── supabase/           # Database migrations and SQL
├── public/             # Static assets
├── ...                 # Config, docs, scripts
```

---

## 🧑‍💻 Local Development

1. **Clone the repo**
2. `npm install` (root)
3. `npm run dev` (start frontend)
4. (Optional) `cd server && npm install && npm start` (for local Vertex AI server)
5. Set up your `.env` files (see below)

---

## 🌐 Deployment

- **Netlify**: One-click deploy for frontend and backend (see `NETLIFY_DEPLOYMENT.md`)
- **Vercel/Railway/Render**: Deploy backend separately if needed

---

## 🔑 Environment Variables

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud project for Vertex AI
- `GOOGLE_CREDENTIALS_BASE64` - Base64-encoded service account JSON
- (See `.env.example` and deployment docs for full list)

---

## 🏆 DevPost & Bolt Compliance

- Bolt.new badge is visible in the app header
- All code, features, and UI were generated or refactored using Bolt.ai
- Follows DevPost and hackathon guidelines

---

## 📄 License

MIT License. See LICENSE file.

---

## 🙏 Credits

- Built with Bolt.ai
- Powered by Google Gemini and Vertex AI
- Database by Supabase
- UI by React, Tailwind, and Lucide

---

For setup, troubleshooting, and advanced features, see:
- `NETLIFY_DEPLOYMENT.md`
- `VERTEX_AI_INTEGRATION.md`
- `FINAL_SETUP_INSTRUCTIONS.md`
- `STATUS_UPDATE.md`
