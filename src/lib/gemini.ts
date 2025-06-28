const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

interface GeminiPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string
  }
}

interface GeminiContent {
  role?: string
  parts: GeminiPart[]
}

interface GeminiRequest {
  contents: GeminiContent[]
  generationConfig?: {
    temperature?: number
    topK?: number
    topP?: number
    maxOutputTokens?: number
  }
}

export async function callGeminiAPI(request: GeminiRequest): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.error('Gemini API key not configured')
    return 'Sorry, the service is not configured. Please add your API key to the .env file.'
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API error:', response.status, errorData)
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid response structure:', data)
      throw new Error('Invalid response from service')
    }

    return data.candidates[0].content.parts[0]?.text || 'Sorry, I couldn\'t generate a response.'
  } catch (error) {
    console.error('API Error:', error)
    return 'Sorry, I\'m having trouble connecting to the service. Please try again later.'
  }
}

export async function chatWithGemini(message: string, userProfile?: any): Promise<string> {
  const profileContext = userProfile ? `
    User Profile Context:
    - Name: ${userProfile.full_name}
    - Age: ${userProfile.age}, Gender: ${userProfile.gender}
    - Height: ${userProfile.height}cm, Weight: ${userProfile.weight}kg
    - Goal: ${userProfile.goal.replace('_', ' ')}
    - Dietary Preferences: ${userProfile.dietary_restrictions?.join(', ') || userProfile.preferences?.dietary_restrictions?.join(', ') || 'None'}
    - Regional Cuisine: ${userProfile.regional_preference || userProfile.preferences?.regional_preference || 'No preference'}
    - Allergies: ${userProfile.allergies?.join(', ') || 'None'}
    - Health Conditions: ${userProfile.health_conditions?.join(', ') || 'None'}
    - Food Preferences: ${userProfile.food_preferences?.join(', ') || 'None'}
    - Activity Level: ${userProfile.activity_level}
    - Sleep Hours: ${userProfile.sleep_hours}
    - Water Goal: ${userProfile.water_goal_ltr}L
    - Daily Targets: ${userProfile.calorie_target} calories, ${userProfile.protein_target}g protein
  ` : ''

  const prompt = `You are a professional nutritionist and health coach. ${profileContext}

User Question: ${message}

Please provide helpful, personalized nutrition advice based on the user's profile. Keep responses concise, actionable, and friendly. Focus on practical advice that aligns with their goals and preferences. If they ask about specific foods or meals, consider their dietary restrictions, allergies, and regional preferences. Do not use bold formatting with asterisks in your response.`

  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  }

  return await callGeminiAPI(request)
}

export async function generateMealPlan(userProfile: any): Promise<string> {
  const prompt = `Generate a detailed 7-day meal plan for:
  - Name: ${userProfile.full_name}
  - Age: ${userProfile.age}, Gender: ${userProfile.gender}
  - Goal: ${userProfile.goal.replace('_', ' ')}
  - Daily Targets: ${userProfile.calorie_target} calories, ${userProfile.protein_target}g protein
  - Dietary Preferences: ${userProfile.dietary_restrictions?.join(', ') || userProfile.preferences?.dietary_restrictions?.join(', ') || 'None'}
  - Regional Cuisine: ${userProfile.regional_preference || userProfile.preferences?.regional_preference || 'Mixed'}
  - Allergies: ${userProfile.allergies?.join(', ') || 'None'}
  - Health Conditions: ${userProfile.health_conditions?.join(', ') || 'None'}
  - Food Preferences: ${userProfile.food_preferences?.join(', ') || 'None'}
  - Activity Level: ${userProfile.activity_level}
  - Sleep Hours: ${userProfile.sleep_hours}
  - Water Goal: ${userProfile.water_goal_ltr}L
  
  Create a comprehensive meal plan that:
  1. Meets their calorie and protein targets
  2. Respects all dietary restrictions and allergies
  3. Incorporates their regional cuisine preferences
  4. Aligns with their health goals
  5. Includes variety and balanced nutrition
  
  Format as:
  Day 1 - Monday
  🌅 Breakfast: [meal name] (~X calories, Yg protein)
  [Brief description and preparation tips]
  
  🌞 Lunch: [meal name] (~X calories, Yg protein)
  [Brief description and preparation tips]
  
  🌙 Dinner: [meal name] (~X calories, Yg protein)
  [Brief description and preparation tips]
  
  🍎 Snack: [meal name] (~X calories, Yg protein)
  [Brief description]
  
  Daily Total: ~X calories, Yg protein
  
  Continue for all 7 days. Include shopping tips and meal prep suggestions at the end. Do not use bold formatting with asterisks in your response.`

  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  }

  return await callGeminiAPI(request)
}

export async function analyzeMenu(menu: string, userProfile: any): Promise<string> {
  const prompt = `Analyze this restaurant menu for someone with these health goals and preferences:
  
  User Profile:
  - Name: ${userProfile.full_name}
  - Goal: ${userProfile.goal.replace('_', ' ')}
  - Daily Targets: ${userProfile.calorie_target} calories, ${userProfile.protein_target}g protein
  - Dietary Preferences: ${userProfile.dietary_restrictions?.join(', ') || userProfile.preferences?.dietary_restrictions?.join(', ') || 'None'}
  - Regional Preference: ${userProfile.regional_preference || userProfile.preferences?.regional_preference || 'No preference'}
  - Allergies: ${userProfile.allergies?.join(', ') || 'None'}
  - Health Conditions: ${userProfile.health_conditions?.join(', ') || 'None'}
  - Food Preferences: ${userProfile.food_preferences?.join(', ') || 'None'}
  
  Restaurant Menu:
  ${menu}
  
  Please provide:
  
  🌟 TOP RECOMMENDATIONS (3-5 best options):
  For each recommended item, explain:
  - Why it fits their goals
  - Estimated calories and protein
  - Nutritional benefits
  - Any suggested modifications
  
  ⚠️ ITEMS TO AVOID:
  List items that don't align with their goals/restrictions and explain why
  
  💡 SMART MODIFICATIONS:
  Suggest how to customize dishes to better fit their needs
  
  📊 NUTRITIONAL STRATEGY:
  How to balance the meal within their daily targets
  
  Keep recommendations practical and explain your reasoning clearly. Do not use bold formatting with asterisks in your response.`

  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1536,
    }
  }

  return await callGeminiAPI(request)
}

export async function analyzeMenuWithImage(imageBase64: string, mimeType: string, userProfile: any): Promise<string> {
  const prompt = `Analyze this menu image for someone with these health goals and preferences:
  
  User Profile:
  - Name: ${userProfile.full_name}
  - Goal: ${userProfile.goal.replace('_', ' ')}
  - Daily Targets: ${userProfile.calorie_target} calories, ${userProfile.protein_target}g protein
  - Dietary Preferences: ${userProfile.dietary_restrictions?.join(', ') || userProfile.preferences?.dietary_restrictions?.join(', ') || 'None'}
  - Regional Preference: ${userProfile.regional_preference || userProfile.preferences?.regional_preference || 'No preference'}
  - Allergies: ${userProfile.allergies?.join(', ') || 'None'}
  - Health Conditions: ${userProfile.health_conditions?.join(', ') || 'None'}
  - Food Preferences: ${userProfile.food_preferences?.join(', ') || 'None'}
  
  Please analyze the menu in the image and provide:
  
  🌟 TOP RECOMMENDATIONS (3-5 best options):
  For each recommended item, explain:
  - Why it fits their goals
  - Estimated calories and protein
  - Nutritional benefits
  - Any suggested modifications
  
  ⚠️ ITEMS TO AVOID:
  List items that don't align with their goals/restrictions and explain why
  
  💡 SMART MODIFICATIONS:
  Suggest how to customize dishes to better fit their needs
  
  📊 NUTRITIONAL STRATEGY:
  How to balance the meal within their daily targets
  
  Keep recommendations practical and explain your reasoning clearly. Do not use bold formatting with asterisks in your response.`

  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1536,
    }
  }

  return await callGeminiAPI(request)
}

export async function generateWeeklyNutritionRecommendations(userProfile: any): Promise<string> {
  const prompt = `Create comprehensive weekly nutrition recommendations for:
  
  User Profile:
  - Name: ${userProfile.full_name}
  - Age: ${userProfile.age}, Gender: ${userProfile.gender}
  - Height: ${userProfile.height}cm, Weight: ${userProfile.weight}kg
  - Goal: ${userProfile.goal.replace('_', ' ')}
  - Daily Targets: ${userProfile.calorie_target} calories, ${userProfile.protein_target}g protein
  - Dietary Preferences: ${userProfile.dietary_restrictions?.join(', ') || userProfile.preferences?.dietary_restrictions?.join(', ') || 'None'}
  - Regional Cuisine: ${userProfile.regional_preference || userProfile.preferences?.regional_preference || 'Mixed'}
  - Allergies: ${userProfile.allergies?.join(', ') || 'None'}
  - Health Conditions: ${userProfile.health_conditions?.join(', ') || 'None'}
  - Food Preferences: ${userProfile.food_preferences?.join(', ') || 'None'}
  - Activity Level: ${userProfile.activity_level}
  - Sleep Hours: ${userProfile.sleep_hours}
  - Water Goal: ${userProfile.water_goal_ltr}L
  
  Provide a comprehensive weekly nutrition strategy including:
  
  🎯 WEEKLY NUTRITION GOALS
  - Macro and micronutrient targets
  - Hydration strategy
  - Meal timing recommendations
  
  🍽️ REGIONAL FOOD FOCUS
  - Traditional dishes that align with their goals
  - Healthy preparation methods
  - Seasonal ingredient suggestions
  
  📅 WEEKLY STRUCTURE
  - Meal prep strategies
  - Shopping list organization
  - Portion control tips
  
  💪 PERFORMANCE OPTIMIZATION
  - Pre/post workout nutrition
  - Energy level management
  - Sleep and nutrition connection
  
  🏥 HEALTH CONSIDERATIONS
  - Specific recommendations for their health conditions
  - Supplement suggestions if needed
  - Warning signs to watch for
  
  Make it practical, culturally relevant, and aligned with their specific goals. Do not use bold formatting with asterisks in your response.`

  const request: GeminiRequest = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    }
  }

  return await callGeminiAPI(request)
}