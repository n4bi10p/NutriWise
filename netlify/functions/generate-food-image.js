const { GoogleAuth } = require('google-auth-library');

// Google Cloud configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = 'us-central1';
const PUBLISHER = 'google';
const MODEL = 'imagegeneration@006';

let auth;

async function initializeAuth() {
  try {
    // Check if we have base64 encoded credentials
    const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
    
    if (credentialsBase64) {
      console.log('📝 Setting up credentials from base64 environment variable...');
      
      // For Netlify Functions, we can use the credentials directly
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      const credentials = JSON.parse(credentialsJson);
      
      // Initialize Google Auth with credentials
      auth = new GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    } else {
      // Fallback to default authentication
      auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    }

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

  const detectedCategory = detectFoodCategory();
  
  // Add specific styling based on category
  switch (detectedCategory) {
    case 'coffee':
    case 'tea':
      prompt += 'in a beautiful ceramic cup with artistic latte art, warm steam rising, cozy café lighting, ';
      break;
    case 'shakes':
    case 'juices':
      prompt += 'in a tall glass with fresh garnish, vibrant colors, refreshing presentation, ';
      break;
    case 'alcoholic':
      prompt += 'in an appropriate glass with proper garnish, elegant bar setting, professional cocktail photography, ';
      break;
    case 'northIndian':
    case 'punjabi':
      prompt += 'served in traditional copper or brass serving dishes, garnished with fresh cilantro and mint, ';
      break;
    case 'southIndian':
      prompt += 'served on banana leaf or traditional south Indian serving plates, accompanied by coconut chutney and sambar, ';
      break;
    case 'italian':
      prompt += 'beautifully plated with fresh herbs, parmesan cheese, Italian table setting, ';
      break;
    case 'chinese':
      prompt += 'in traditional Chinese serving bowls with chopsticks, elegant Asian presentation, ';
      break;
    case 'mexican':
      prompt += 'colorfully presented with fresh cilantro, lime wedges, vibrant Mexican styling, ';
      break;
    case 'japanese':
      prompt += 'minimalist Japanese presentation, clean lines, traditional Japanese dishware, ';
      break;
    case 'desserts':
      prompt += 'beautifully plated dessert with artistic presentation, elegant garnish, fine dining styling, ';
      break;
    case 'streetFood':
      prompt += 'authentic street food presentation, casual serving, vibrant and appetizing, ';
      break;
    default:
      prompt += 'beautifully presented, ';
  }

  // Add description if provided
  if (description) {
    prompt += `${description}, `;
  }

  // Add cuisine-specific styling
  const cuisineStyles = {
    indian: 'vibrant spices, colorful garnishes, traditional Indian serving style',
    chinese: 'elegant Asian presentation, bamboo elements, traditional Chinese aesthetics',
    italian: 'rustic Italian charm, fresh herbs, Mediterranean styling',
    mexican: 'colorful Mexican presentation, fresh cilantro and lime, vibrant styling',
    american: 'classic American diner style, generous portions, comfort food presentation',
    french: 'elegant French culinary art, sophisticated plating, fine dining presentation',
    japanese: 'minimalist Japanese aesthetics, clean presentation, traditional elements',
    thai: 'authentic Thai styling, fresh herbs, traditional Thai presentation',
    mediterranean: 'fresh Mediterranean ingredients, olive oil drizzle, coastal vibes',
    modern: 'contemporary plating, artistic presentation, modern culinary techniques'
  };

  const cuisineStyle = cuisineStyles[cuisineType] || cuisineStyles.modern;
  prompt += `${cuisineStyle}, `;

  // Add plating style
  const platingStyles = {
    elegant: 'fine dining presentation, sophisticated plating, restaurant quality',
    rustic: 'rustic homestyle presentation, comfort food styling, cozy atmosphere',
    modern: 'modern artistic plating, contemporary styling, geometric arrangements',
    traditional: 'traditional cultural presentation, authentic serving style, heritage styling',
    casual: 'casual home-style presentation, comfortable and inviting, everyday dining'
  };

  const platingStyle = platingStyles[plating] || platingStyles.elegant;
  prompt += `${platingStyle}, `;

  // Add general photography specifications
  prompt += 'studio lighting, high-resolution, food photography, appetizing, 4K quality, professional composition, shallow depth of field, natural colors, mouth-watering presentation';

  return prompt;
}

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }),
    };
  }

  try {
    // Parse request body
    const { dishName, description, cuisineType = 'modern', plating = 'elegant' } = JSON.parse(event.body || '{}');

    if (!dishName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Dish name is required'
        }),
      };
    }

    console.log(`🍽️ Generating image for: ${dishName}`);

    // Initialize auth if not already done
    if (!auth) {
      const authInitialized = await initializeAuth();
      if (!authInitialized) {
        throw new Error('Failed to initialize Google Cloud authentication');
      }
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          imageUrl: imageDataUrl,
          dishName: dishName,
          prompt: prompt
        }),
      };
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

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: error.response?.data || error.message
      }),
    };
  }
};
