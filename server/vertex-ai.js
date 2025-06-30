const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Google Cloud configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = 'us-central1';
const PUBLISHER = 'google';
const MODEL = 'imagegeneration@006';

// Initialize credentials on startup
let auth;

async function initializeAuth() {
  try {
    // Check if we have base64 encoded credentials
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (credentialsBase64) {
      console.log('📝 Setting up credentials from base64 environment variable...');
      
      // Decode base64 credentials
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      
      // Create temporary credentials file
      const credentialsPath = '/tmp/credentials.json';
      fs.writeFileSync(credentialsPath, credentialsJson);
      
      // Set environment variable for Google Auth
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
      console.log('✅ Credentials file created at:', credentialsPath);
    }

    // Initialize Google Auth
    auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    // Test authentication
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();
    console.log('✅ Google Cloud authentication successful');
    console.log('📋 Project ID:', projectId);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Google Cloud authentication:', error);
    return false;
  }
}

// Generate food image using Vertex AI Imagen
app.post('/api/generate-food-image', async (req, res) => {
  try {
    const { dishName, description, cuisineType = 'modern', plating = 'elegant' } = req.body;

    if (!dishName) {
      return res.status(400).json({
        success: false,
        error: 'Dish name is required'
      });
    }

    console.log(`🍽️ Generating image for: ${dishName}`);

    // Check if authentication is available
    if (!auth) {
      throw new Error('Google Cloud authentication not initialized');
    }

    // Get authenticated client
    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    // Construct the API endpoint
    const endpoint = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/${PUBLISHER}/models/${MODEL}:predict`;

    // Create enhanced food description prompt
    const prompt = createFoodPrompt(dishName, description, cuisineType, plating);
    console.log('🎨 Generated prompt:', prompt);

    // Prepare the request payload for Imagen
    const requestBody = {
      instances: [
        {
          prompt: prompt
        }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
        safetyFilterLevel: 'block_some',
        personGeneration: 'dont_allow'
      }
    };

    // Make request to Vertex AI
    console.log('📡 Making request to Vertex AI...');
    const response = await client.request({
      url: endpoint,
      method: 'POST',
      data: requestBody,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Received response from Vertex AI');

    // Extract image data from response
    if (response.data?.predictions?.[0]?.bytesBase64Encoded) {
      const imageBase64 = response.data.predictions[0].bytesBase64Encoded;
      const imageDataUrl = `data:image/png;base64,${imageBase64}`;

      console.log('✅ Image generated successfully');

      res.json({
        success: true,
        imageUrl: imageDataUrl,
        dishName: dishName,
        prompt: prompt
      });
    } else {
      console.error('❌ No image data in response:', response.data);
      throw new Error('No image data received from Vertex AI');
    }

  } catch (error) {
    console.error('❌ Error generating food image:', error);
    
    let errorMessage = 'Failed to generate image';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
});

// Create enhanced food description prompt
function createFoodPrompt(dishName, description, cuisineType, plating) {
  // Base prompt for professional food photography
  let prompt = `Professional food photography of ${dishName}, `;
  
  // Add specific details based on dish type
  if (dishName.toLowerCase().includes('biryani')) {
    prompt += 'aromatic basmati rice layered with tender marinated meat, garnished with fried onions, fresh mint leaves, and saffron, served in traditional copper or clay pot, ';
  } else if (dishName.toLowerCase().includes('curry')) {
    prompt += 'rich and flavorful curry with tender pieces of meat or vegetables in aromatic spices and thick gravy, ';
  } else if (dishName.toLowerCase().includes('greek salad')) {
    prompt += 'fresh Mediterranean salad with crisp lettuce, ripe tomatoes, cucumber, red onions, kalamata olives, and feta cheese, drizzled with olive oil, ';
  } else if (dishName.toLowerCase().includes('prawns')) {
    prompt += 'succulent prawns cooked to perfection with aromatic spices and herbs, ';
  } else {
    prompt += 'beautifully prepared dish with authentic ingredients and traditional cooking methods, ';
  }

  // Add cuisine-specific styling
  const cuisineStyles = {
    indian: 'served on traditional brass or copper tableware with banana leaf garnish, basmati rice on the side, Indian bread, vibrant spices visible, warm golden lighting',
    mediterranean: 'presented on rustic ceramic plates with olive oil drizzle, fresh herbs, lemon wedges, and traditional Mediterranean elements',
    chinese: 'arranged on elegant porcelain with chopsticks and traditional garnishes, clean presentation',
    mexican: 'served on colorful ceramic plates with lime wedges and cilantro',
    japanese: 'presented on minimalist ceramic with clean lines and artistic arrangement',
    thai: 'served in traditional bowls with aromatic herbs and chili garnish',
    modern: 'plated with contemporary presentation and microgreens, artistic plating'
  };

  if (cuisineStyles[cuisineType.toLowerCase()]) {
    prompt += cuisineStyles[cuisineType.toLowerCase()];
  } else {
    prompt += 'served with traditional presentation and authentic garnishes';
  }

  // Add plating style
  const platingStyles = {
    elegant: ', sophisticated fine dining presentation with artistic arrangement',
    rustic: ', homestyle presentation with natural textures and traditional serving',
    modern: ', contemporary minimalist plating with clean lines',
    traditional: ', authentic cultural presentation with traditional serving methods'
  };

  if (platingStyles[plating.toLowerCase()]) {
    prompt += platingStyles[plating.toLowerCase()];
  }

  // Add professional photography elements
  prompt += '. Shot with professional DSLR camera, studio lighting setup, shallow depth of field background blur, appetizing warm colors, high resolution 4K quality, commercial food photography style, detailed textures, steam rising from hot food, glossy sauce finish, garnish details visible, restaurant quality presentation, overhead or 45-degree angle, soft shadows, vibrant and realistic colors';

  return prompt;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'vertex-ai-image-generator'
  });
});

// Test endpoint for authentication
app.get('/api/test-auth', async (req, res) => {
  try {
    if (!auth) {
      throw new Error('Authentication not initialized');
    }

    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    res.json({
      success: true,
      projectId: projectId,
      message: 'Authentication successful'
    });
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
async function startServer() {
  console.log('🚀 Starting Vertex AI Image Generation Server...');
  
  // Initialize authentication
  const authSuccess = await initializeAuth();
  
  if (!authSuccess) {
    console.error('❌ Failed to initialize authentication. Server will start but image generation will not work.');
  }

  app.listen(PORT, () => {
    console.log(`🌟 Server running on http://localhost:${PORT}`);
    console.log('🔗 Health check: http://localhost:${PORT}/api/health');
    console.log('🔐 Auth test: http://localhost:${PORT}/api/test-auth');
  });
}

startServer();

module.exports = app;
