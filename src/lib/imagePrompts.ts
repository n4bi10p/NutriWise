// Image Generation Prompt Guidelines for Food Images
// This file contains guidelines for generating realistic and accurate food images

export const FOOD_IMAGE_PROMPTS = {
  // Base prompt structure for realistic food photography
  basePrompt: "Professional food photography, high-resolution, realistic, appetizing, well-lit, restaurant quality",
  
  // Cuisine-specific styling
  cuisineStyles: {
    indian: "Traditional Indian presentation, vibrant colors, authentic Indian spices visible, served on traditional Indian plates or banana leaf",
    mediterranean: "Fresh Mediterranean presentation, olive oil drizzle, herbs, served on rustic ceramic plates",
    modern: "Contemporary plating, minimalist presentation, chef-style arrangement",
    italian: "Classic Italian presentation, fresh herbs, parmesan cheese, rustic Italian styling",
    western: "Classic western presentation, fresh ingredients, modern plating"
  },
  
  // Dish-specific enhancements
  dishEnhancements: {
    sandwich: "Crispy bread, fresh vegetables visible, cheese melting, cross-section view showing all ingredients",
    biryani: "Colorful saffron rice, aromatic steam, garnished with fried onions and fresh herbs",
    curry: "Rich gravy, visible spices, garnished with fresh cilantro, served with rice or bread",
    grilled: "Perfect grill marks, char marks visible, served hot with vegetables",
    salad: "Fresh crisp vegetables, colorful presentation, healthy and vibrant"
  },
  
  // Plating styles
  platingStyles: {
    elegant: "Fine dining presentation, artistic plating, garnished beautifully",
    rustic: "Homestyle presentation, warm and inviting, traditional serving style",
    modern: "Contemporary presentation, clean lines, minimalist styling"
  },
  
  // Quality descriptors
  qualityDescriptors: "8K resolution, professional lighting, depth of field, food styling, commercial photography, realistic textures"
}

// Function to build comprehensive prompt
export function buildFoodImagePrompt(dishName: string, description: string, cuisineType: string, plating: string): string {
  const basePrompt = FOOD_IMAGE_PROMPTS.basePrompt
  const cuisineStyle = FOOD_IMAGE_PROMPTS.cuisineStyles[cuisineType as keyof typeof FOOD_IMAGE_PROMPTS.cuisineStyles] || FOOD_IMAGE_PROMPTS.cuisineStyles.modern
  const platingStyle = FOOD_IMAGE_PROMPTS.platingStyles[plating as keyof typeof FOOD_IMAGE_PROMPTS.platingStyles] || FOOD_IMAGE_PROMPTS.platingStyles.elegant
  const qualityDescriptors = FOOD_IMAGE_PROMPTS.qualityDescriptors
  
  // Find dish-specific enhancement
  let dishEnhancement = ""
  Object.keys(FOOD_IMAGE_PROMPTS.dishEnhancements).forEach(key => {
    if (dishName.toLowerCase().includes(key)) {
      dishEnhancement = FOOD_IMAGE_PROMPTS.dishEnhancements[key as keyof typeof FOOD_IMAGE_PROMPTS.dishEnhancements]
    }
  })
  
  // Build comprehensive prompt
  const prompt = `${basePrompt}, ${dishName}, ${description}, ${cuisineStyle}, ${platingStyle}, ${dishEnhancement}, ${qualityDescriptors}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '')
  
  return prompt
}

// Negative prompt to avoid unwanted elements
export const NEGATIVE_PROMPT = "blurry, low quality, cartoon, anime, illustration, drawing, painting, sketch, fake, plastic, artificial, unappetizing, burnt, moldy, spoiled, raw meat, blood, gore"
