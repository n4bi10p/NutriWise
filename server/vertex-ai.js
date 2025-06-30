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
  
  const dishLower = dishName.toLowerCase();
  const descriptionLower = (description || '').toLowerCase();
  
  // Comprehensive food categorization
  const foodCategories = {
    // Beverages
    coffee: ['coffee', 'latte', 'cappuccino', 'espresso', 'mocha', 'americano', 'macchiato', 'cortado', 'flat white', 'cold brew', 'frappuccino'],
    tea: ['tea', 'chai', 'matcha', 'green tea', 'black tea', 'herbal tea', 'oolong', 'earl grey', 'chamomile'],
    shakes: ['shake', 'smoothie', 'milkshake', 'protein shake', 'fruit shake', 'chocolate shake', 'vanilla shake'],
    juices: ['juice', 'fresh lime', 'orange juice', 'apple juice', 'grape juice', 'cranberry juice', 'pomegranate juice', 'green juice'],
    alcoholic: ['beer', 'wine', 'cocktail', 'whiskey', 'vodka', 'rum', 'gin', 'margarita', 'mojito', 'bloody mary'],
    
    // Indian Regional Cuisines
    northIndian: ['biryani', 'butter chicken', 'dal makhani', 'naan', 'tandoori', 'paneer', 'roti', 'chole', 'rajma', 'kadai', 'malai kofta'],
    southIndian: ['dosa', 'idli', 'sambhar', 'rasam', 'uttapam', 'vada', 'coconut rice', 'curd rice', 'medu vada', 'appam', 'kootu'],
    bengali: ['fish curry', 'machher jhol', 'rasgulla', 'sandesh', 'mishti doi', 'kosha mangsho', 'chingri malai curry'],
    gujarati: ['dhokla', 'khandvi', 'thepla', 'undhiyu', 'khaman', 'fafda', 'gujarati thali'],
    punjabi: ['makki di roti', 'sarson da saag', 'amritsari kulcha', 'chole bhature', 'punjabi kadhi'],
    maharashtrian: ['vada pav', 'misal pav', 'puran poli', 'bhel puri', 'pav bhaji', 'modak', 'batata vada'],
    rajasthani: ['dal baati churma', 'laal maas', 'gatte ki sabzi', 'ker sangri', 'bajre ki roti'],
    kerala: ['kerala fish curry', 'appam with stew', 'puttu', 'fish moilee', 'banana chips', 'payasam'],
    
    // International Cuisines
    italian: ['pasta', 'pizza', 'risotto', 'lasagna', 'carbonara', 'bolognese', 'margherita', 'tiramisu', 'gelato', 'bruschetta'],
    chinese: ['fried rice', 'chow mein', 'kung pao', 'sweet and sour', 'dim sum', 'peking duck', 'hot pot', 'mapo tofu'],
    mexican: ['taco', 'burrito', 'quesadilla', 'enchilada', 'guacamole', 'nachos', 'churros', 'fajita', 'tamale'],
    japanese: ['sushi', 'ramen', 'tempura', 'miso soup', 'yakitori', 'teriyaki', 'bento', 'udon', 'sashimi'],
    thai: ['pad thai', 'tom yum', 'green curry', 'red curry', 'som tam', 'massaman curry', 'mango sticky rice'],
    french: ['croissant', 'baguette', 'ratatouille', 'coq au vin', 'bouillabaisse', 'crème brûlée', 'macarons'],
    greek: ['greek salad', 'moussaka', 'souvlaki', 'gyros', 'tzatziki', 'spanakopita', 'baklava'],
    mediterranean: ['hummus', 'falafel', 'tabouleh', 'baba ganoush', 'dolma', 'shawarma'],
    american: ['burger', 'hot dog', 'barbecue', 'mac and cheese', 'buffalo wings', 'cheesecake', 'apple pie'],
    korean: ['kimchi', 'bulgogi', 'bibimbap', 'korean bbq', 'japchae', 'tteokbokki'],
    
    // Food Types
    breakfast: ['pancake', 'waffle', 'french toast', 'omelet', 'cereal', 'oatmeal', 'bagel', 'muffin', 'croissant'],
    lunch: ['sandwich', 'wrap', 'salad bowl', 'soup and sandwich', 'club sandwich', 'panini'],
    dinner: ['steak', 'roast chicken', 'salmon', 'lamb chops', 'pork tenderloin', 'beef stew'],
    desserts: ['cake', 'ice cream', 'pudding', 'pie', 'tart', 'cookies', 'brownies', 'mousse', 'parfait'],
    snacks: ['chips', 'popcorn', 'nuts', 'crackers', 'pretzels', 'fruit', 'cheese and crackers'],
    
    // Cooking Methods
    grilled: ['grilled chicken', 'bbq', 'grilled vegetables', 'grilled fish', 'barbecue ribs'],
    fried: ['fried chicken', 'french fries', 'fried rice', 'tempura', 'fish and chips'],
    baked: ['baked potato', 'baked chicken', 'baked goods', 'casserole', 'roasted vegetables'],
    steamed: ['steamed dumplings', 'steamed fish', 'steamed vegetables', 'steamed buns'],
    
    // Street Food
    streetFood: ['street food', 'food truck', 'vendor food', 'chaat', 'gol gappa', 'aloo tikki', 'corn on the cob']
  };

  // Function to detect food category
  function detectFoodCategory() {
    for (const [category, keywords] of Object.entries(foodCategories)) {
      if (keywords.some(keyword => dishLower.includes(keyword))) {
        return category;
      }
    }
    return 'general';
  }

  const foodCategory = detectFoodCategory();
  const isBeverage = ['coffee', 'tea', 'shakes', 'juices', 'alcoholic'].includes(foodCategory);

  // Add category-specific descriptions
  switch (foodCategory) {
    case 'coffee':
      prompt += 'perfectly brewed coffee with rich crema and aromatic steam rising, served in elegant ceramic cup with matching saucer, ';
      break;
    case 'tea':
      if (dishLower.includes('chai')) {
        prompt += 'traditional Indian chai with milk, aromatic spices, served in cutting glass or ceramic cup with steam rising, ';
      } else {
        prompt += 'freshly brewed tea with clear liquid and aromatic steam, served in elegant porcelain cup or traditional glass, ';
      }
      break;
    case 'shakes':
      prompt += 'thick creamy shake with perfect consistency, topped with whipped cream or fresh garnish, served in tall glass with colorful straw, ';
      break;
    case 'juices':
      prompt += 'fresh vibrant juice with natural colors, served in clear glass with fruit garnish and ice cubes, ';
      break;
    case 'alcoholic':
      prompt += 'expertly crafted alcoholic beverage with proper garnish and glassware, professional bar presentation, ';
      break;
    case 'northIndian':
      prompt += 'authentic North Indian dish with aromatic spices, rich gravies, and traditional garnishes like fresh coriander, fried onions, ';
      break;
    case 'southIndian':
      prompt += 'traditional South Indian dish with coconut-based preparations, curry leaves, and served on banana leaf or steel plate, ';
      break;
    case 'bengali':
      prompt += 'authentic Bengali cuisine with mustard oil, panch phoron spices, and traditional fish preparations, ';
      break;
    case 'gujarati':
      prompt += 'traditional Gujarati dish with sweet and savory flavors, steamed preparations, and colorful presentation, ';
      break;
    case 'punjabi':
      prompt += 'hearty Punjabi cuisine with rich butter-based gravies, tandoori preparations, and rustic presentation, ';
      break;
    case 'maharashtrian':
      prompt += 'authentic Maharashtrian street food with spicy flavors, chutneys, and traditional Mumbai-style presentation, ';
      break;
    case 'rajasthani':
      prompt += 'royal Rajasthani cuisine with rich gravies, desert spices, and traditional thali presentation, ';
      break;
    case 'kerala':
      prompt += 'authentic Kerala dish with coconut milk, curry leaves, and traditional backwater region flavors, ';
      break;
    case 'italian':
      prompt += 'authentic Italian cuisine with fresh herbs, quality olive oil, parmesan cheese, and rustic Mediterranean presentation, ';
      break;
    case 'chinese':
      prompt += 'traditional Chinese dish with wok-fried ingredients, balanced flavors, and elegant chopstick presentation, ';
      break;
    case 'mexican':
      prompt += 'vibrant Mexican dish with fresh cilantro, lime wedges, colorful peppers, and traditional ceramic serving, ';
      break;
    case 'japanese':
      prompt += 'authentic Japanese cuisine with minimalist presentation, fresh ingredients, and traditional ceramic or wooden serving, ';
      break;
    case 'thai':
      prompt += 'aromatic Thai dish with fresh herbs, chili garnish, and traditional Thai ceramic or banana leaf serving, ';
      break;
    case 'french':
      prompt += 'elegant French cuisine with refined presentation, fresh herbs, and sophisticated plating techniques, ';
      break;
    case 'greek':
      prompt += 'fresh Mediterranean dish with olive oil drizzle, feta cheese, olives, and rustic Greek presentation, ';
      break;
    case 'american':
      prompt += 'classic American dish with generous portions, fresh ingredients, and casual diner-style presentation, ';
      break;
    case 'korean':
      prompt += 'authentic Korean dish with fermented flavors, sesame garnish, and traditional Korean ceramic serving, ';
      break;
    case 'breakfast':
      prompt += 'hearty breakfast dish with golden colors, fresh ingredients, and morning comfort food presentation, ';
      break;
    case 'desserts':
      prompt += 'decadent dessert with rich textures, beautiful garnish, and elegant sweet presentation, ';
      break;
    case 'streetFood':
      prompt += 'authentic street food with vibrant colors, multiple chutneys, and traditional vendor-style presentation, ';
      break;
    case 'grilled':
      prompt += 'perfectly grilled with beautiful char marks, smoky aroma, and rustic barbecue presentation, ';
      break;
    case 'fried':
      prompt += 'golden fried with crispy texture, perfect browning, and casual comfort food presentation, ';
      break;
    default:
      prompt += 'beautifully prepared dish with authentic ingredients, traditional cooking methods, and appetizing presentation, ';
  }

  // Comprehensive cuisine-specific styling and presentation
  const cuisineStyles = {
    // Indian Regional Styles
    indian: 'served on traditional brass thali, copper bowls, or banana leaf with basmati rice, Indian breads, vibrant spices visible, warm golden lighting, traditional Indian table setting',
    northindian: 'presented on brass or steel plates with naan, roti, pickles, and yogurt on the side, rich gravies, garnished with fresh coriander and fried onions',
    southindian: 'served on banana leaf or steel plates with sambhar, coconut chutney, rasam, and rice, traditional South Indian presentation with curry leaves',
    bengali: 'served on traditional white plates with rice, fish curry, and Bengali sweets on the side, authentic Bengali home-style presentation',
    gujarati: 'presented on silver thali with multiple small bowls, rotli, rice, and sweet dish, colorful Gujarati feast presentation',
    punjabi: 'served on rustic plates with makki di roti, white butter, jaggery, and lassi, hearty Punjabi dhaba-style presentation',
    maharashtrian: 'street food style presentation with newspaper wrapping or steel plates, multiple chutneys, and Mumbai street vendor aesthetics',
    rajasthani: 'royal presentation on decorated thali with multiple courses, traditional Rajasthani royal dining style',
    kerala: 'served on banana leaf with coconut-based curries, appam, and traditional Kerala backwater region presentation',
    
    // International Styles
    italian: 'served on rustic ceramic plates with fresh basil, parmesan cheese, olive oil drizzle, crusty bread, Italian countryside presentation',
    chinese: 'presented on elegant porcelain with chopsticks, tea cups, lazy susan, traditional Chinese restaurant style with red and gold accents',
    mexican: 'served on colorful ceramic plates with lime wedges, cilantro, salsa, and tortillas, vibrant Mexican cantina presentation',
    japanese: 'minimalist presentation on traditional ceramic plates with bamboo elements, wasabi, ginger, soy sauce, zen-like styling',
    thai: 'served in traditional Thai bowls with jasmine rice, fresh herbs, chili, lime, and banana leaf elements',
    french: 'elegant fine dining presentation with white plates, silver cutlery, wine glasses, sophisticated French bistro styling',
    greek: 'rustic Mediterranean presentation with olive oil, olives, feta cheese, pita bread, and blue and white Greek elements',
    mediterranean: 'served on terracotta plates with olive oil, fresh herbs, lemon, and rustic Mediterranean coastal styling',
    american: 'casual diner presentation with large portions, condiments, pickles, and classic American comfort food styling',
    korean: 'served with multiple banchan (side dishes), metal chopsticks, rice bowls, and traditional Korean ceramic',
    middle_eastern: 'presented on decorative plates with pita bread, hummus, olives, and traditional Middle Eastern elements',
    
    // Cooking Style Presentations
    streetfood: 'authentic street vendor presentation with paper plates, plastic cutlery, multiple sauces, and bustling street food atmosphere',
    fine_dining: 'elegant restaurant presentation with white tablecloth, crystal glasses, silver cutlery, and artistic plating',
    homestyle: 'warm family-style presentation with comfortable dishes, generous portions, and cozy home dining atmosphere',
    cafe: 'modern café presentation with wooden tables, ceramic mugs, fresh flowers, and casual bistro styling',
    buffet: 'abundant buffet-style presentation with multiple dishes, serving spoons, and feast-like arrangement',
    
    // Modern Styles
    fusion: 'creative fusion presentation blending traditional and modern elements with artistic plating',
    molecular: 'avant-garde molecular gastronomy presentation with unique textures and scientific precision',
    farm_to_table: 'rustic farm-fresh presentation with wooden boards, mason jars, and organic garden aesthetics',
    vegan: 'colorful plant-based presentation with fresh vegetables, grains, and modern health-conscious styling',
    keto: 'low-carb presentation focusing on proteins, healthy fats, and fresh vegetables with modern health styling',
    
    // Default styles
    modern: 'contemporary presentation with clean lines, white plates, microgreens, and artistic arrangement',
    traditional: 'authentic cultural presentation with traditional serving methods and historical accuracy',
    rustic: 'homestyle presentation with natural textures, wooden elements, and comfortable family dining',
    elegant: 'sophisticated presentation with fine china, crystal, and upscale restaurant styling'
  };

  // Enhanced plating styles with detailed descriptions
  const platingStyles = {
    elegant: ', sophisticated fine dining presentation with artistic arrangement, microgreens, sauce dots, and chef-quality plating',
    rustic: ', homestyle comfort food presentation with generous portions, natural textures, and family-style serving',
    modern: ', contemporary minimalist plating with clean lines, negative space, and Instagram-worthy presentation',
    traditional: ', authentic cultural presentation respecting traditional serving methods and historical accuracy',
    street: ', authentic street food presentation with paper wrapping, plastic containers, and vendor-style serving',
    fine_dining: ', michelin-star quality presentation with precise plating, artistic garnish, and restaurant elegance',
    casual: ', relaxed everyday presentation with comfortable portions and approachable styling',
    festive: ', celebration-style presentation with decorative elements, abundant portions, and party atmosphere'
  };

  // Determine appropriate styling based on food category and cuisine
  let selectedStyle = '';
  
  if (isBeverage) {
    // Special handling for beverages
    if (foodCategory === 'coffee') {
      selectedStyle = 'served on elegant coffee saucer with coffee beans nearby, modern café presentation, warm ambient lighting';
    } else if (foodCategory === 'tea' && dishLower.includes('chai')) {
      selectedStyle = 'served in traditional cutting glass or ceramic cup, Indian street-side tea stall presentation, steam rising';
    } else if (foodCategory === 'shakes') {
      selectedStyle = 'served in tall glass or mason jar with colorful straw, modern beverage presentation, appealing garnish';
    } else if (foodCategory === 'juices') {
      selectedStyle = 'served in clear glass with fresh fruit slices, bright and refreshing presentation, natural lighting';
    } else if (foodCategory === 'alcoholic') {
      selectedStyle = 'served in appropriate glassware with proper garnish, professional bar presentation, ambient bar lighting';
    } else {
      selectedStyle = 'served with modern beverage presentation, clean and appealing styling';
    }
  } else {
    // Food styling based on cuisine type and category
    const cuisineKey = cuisineType.toLowerCase().replace(/[\s-]/g, '');
    if (cuisineStyles[cuisineKey]) {
      selectedStyle = cuisineStyles[cuisineKey];
    } else if (cuisineStyles[foodCategory]) {
      selectedStyle = cuisineStyles[foodCategory];
    } else {
      selectedStyle = cuisineStyles.traditional;
    }
  }

  prompt += selectedStyle;

  // Add plating style
  const platingKey = plating.toLowerCase();
  if (platingStyles[platingKey]) {
    prompt += platingStyles[platingKey];
  } else {
    prompt += platingStyles.elegant;
  }

  // Add professional photography elements with category-specific details
  prompt += '. Shot with professional DSLR camera, studio lighting setup, shallow depth of field background blur, appetizing warm colors, high resolution 4K quality, commercial food photography style, detailed textures';
  
  // Add specific visual elements based on food type
  if (isBeverage) {
    prompt += ', steam or condensation droplets visible where appropriate, perfect beverage clarity and color';
    if (foodCategory === 'coffee') {
      prompt += ', rich brown crema, aromatic steam wisps, coffee bean texture visible';
    } else if (foodCategory === 'tea') {
      prompt += ', clear liquid with natural tea color, delicate steam patterns';
    } else if (foodCategory === 'shakes') {
      prompt += ', creamy texture visible, foam or whipped cream details, straw reflection';
    } else if (foodCategory === 'juices') {
      prompt += ', vibrant natural fruit colors, fresh pulp texture, ice cube reflections';
    }
  } else {
    prompt += ', steam rising from hot food where appropriate, glossy sauce finish, garnish details visible';
    
    // Add specific visual details for different food categories
    if (['northIndian', 'southIndian', 'bengali', 'gujarati', 'punjabi', 'maharashtrian', 'rajasthani', 'kerala'].includes(foodCategory)) {
      prompt += ', vibrant spice colors, rich curry textures, aromatic steam, traditional Indian garnish details';
    } else if (['italian', 'mediterranean'].includes(foodCategory)) {
      prompt += ', olive oil sheen, fresh herb colors, cheese texture details, rustic bread textures';
    } else if (foodCategory === 'chinese') {
      prompt += ', glossy sauce coating, wok hei aroma visualization, precise ingredient cuts, steam wisps';
    } else if (foodCategory === 'japanese') {
      prompt += ', pristine ingredient freshness, clean cuts, minimalist garnish, natural textures';
    } else if (foodCategory === 'mexican') {
      prompt += ', vibrant chili colors, fresh cilantro green, lime juice glistening, colorful pepper textures';
    } else if (foodCategory === 'thai') {
      prompt += ', aromatic herb freshness, chili oil sheen, coconut milk richness, banana leaf texture';
    } else if (foodCategory === 'french') {
      prompt += ', refined sauce work, herb oil drizzles, elegant garnish precision, fine dining aesthetics';
    } else if (foodCategory === 'american') {
      prompt += ', generous portion appeal, comfort food textures, melted cheese details, crispy elements';
    } else if (foodCategory === 'desserts') {
      prompt += ', rich chocolate textures, cream smoothness, fruit freshness, sugar crystal details';
    } else if (foodCategory === 'breakfast') {
      prompt += ', golden brown textures, butter melting, syrup flow, morning light warmth';
    } else if (foodCategory === 'grilled') {
      prompt += ', perfect grill marks, smoky char details, juicy meat textures, flame-kissed appearance';
    } else if (foodCategory === 'fried') {
      prompt += ', golden crispy coating, oil-free appearance, perfect browning, crunchy texture details';
    } else if (foodCategory === 'streetFood') {
      prompt += ', authentic street vendor appearance, multiple sauce colors, casual serving style, vibrant spice dusting';
    }
  }
  
  // Final photography and lighting specifications
  prompt += ', restaurant quality presentation, optimal camera angle (overhead, 45-degree, or straight-on as appropriate)';
  prompt += ', soft natural shadows, vibrant and realistic colors, perfect focus on main subject';
  prompt += ', professional food styling, appetizing appeal, commercial photography standards';
  
  // Add appropriate background and context
  if (isBeverage) {
    prompt += ', clean background with subtle cafe or bar elements, soft focus supporting props';
  } else if (['streetFood', 'punjabi', 'maharashtrian'].includes(foodCategory)) {
    prompt += ', authentic rustic background with traditional elements, street food atmosphere';
  } else if (['japanese', 'korean'].includes(foodCategory)) {
    prompt += ', minimalist background with traditional Asian elements, zen-like simplicity';
  } else if (['italian', 'mediterranean', 'french'].includes(foodCategory)) {
    prompt += ', rustic European background with traditional cooking elements, countryside charm';
  } else if (foodCategory === 'fine_dining' || plating === 'elegant') {
    prompt += ', luxury restaurant background with upscale dining elements, sophisticated ambiance';
  } else {
    prompt += ', clean neutral background with appropriate cultural or cooking context elements';
  }

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
