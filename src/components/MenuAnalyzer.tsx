import React, { useState, useRef } from 'react'
import { Profile } from '../lib/supabase'
import { analyzeMenu, analyzeMenuWithImage } from '../lib/gemini'
import { Search, Loader, Upload, Camera, X, Image as ImageIcon, Sparkles } from 'lucide-react'
import { VertexAIImageGenerator } from './VertexAIImageGenerator'

interface MenuAnalyzerProps {
  profile: Profile
}

interface RecommendedDish {
  name: string;
  description?: string;
  cuisineType?: string;
  calories?: string;
  protein?: string;
  benefits?: string;
}

export function MenuAnalyzer({ profile }: MenuAnalyzerProps) {
  const [menu, setMenu] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [recommendedDishes, setRecommendedDishes] = useState<RecommendedDish[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setUploadedImage(null)
    setImageFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = async () => {
    if (!menu.trim() && !imageFile) return
    
    setLoading(true)
    setRecommendedDishes([]) // Clear previous dishes
    
    try {
      let result: string
      
      if (imageFile) {
        // Convert image to base64
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
          }
        })
        reader.readAsDataURL(imageFile)
        const base64Data = await base64Promise
        
        result = await analyzeMenuWithImage(base64Data, imageFile.type, profile)
      } else {
        result = await analyzeMenu(menu, profile)
      }
      
      setAnalysis(result)
      
      // Extract recommended dishes for AI image generation
      const dishes = extractRecommendedDishes(result)
      setRecommendedDishes(dishes)
      
    } catch (error) {
      setAnalysis('Sorry, I encountered an error analyzing the menu. Please try again.')
      setRecommendedDishes([])
    } finally {
      setLoading(false)
    }
  }

  // Extract dish recommendations from analysis text
  const extractRecommendedDishes = (analysisText: string): RecommendedDish[] => {
    const dishes: RecommendedDish[] = []
    
    console.log('🔍 Extracting dishes from analysis:', analysisText.substring(0, 500))
    
    // More specific pattern to match numbered dish recommendations
    // Look for patterns like "1. Dish Name:" or "1. Dish Name -" or "1. **Dish Name**:"
    const dishPattern = /(?:^|\n)\s*(\d+)\.\s*(?:\*\*)?([^:\*\n]+?)(?:\*\*)?\s*[:–-]?\s*([^\n]*)/gm
    
    let match
    while ((match = dishPattern.exec(analysisText)) !== null && dishes.length < 4) {
      const dishNumber = match[1]
      let dishName = match[2]?.trim()
      let description = match[3]?.trim()
      
      console.log(`🔍 Found potential dish ${dishNumber}: "${dishName}" with description: "${description}"`)
      
      if (dishName && dishName.length > 5 && dishName.length < 80) {
        // Clean up dish name
        dishName = dishName
          .replace(/[*_]/g, '') // Remove markdown formatting
          .replace(/^\d+\.\s*/, '') // Remove numbering
          .replace(/^[-–]\s*/, '') // Remove leading dashes
          .trim()
        
        // Skip if it's not a proper dish name (contains explanatory text)
        if (dishName.toLowerCase().includes('why it fits') || 
            dishName.toLowerCase().includes('estimated calories') ||
            dishName.toLowerCase().includes('nutritional benefits') ||
            dishName.toLowerCase().includes('suggested modifications') ||
            dishName.toLowerCase().includes('this is likely') ||
            dishName.toLowerCase().includes('protein content')) {
          console.log(`⏭️ Skipping non-dish text: "${dishName}"`)
          continue
        }
        
        // Check if we already have this dish
        if (dishes.some(d => d.name.toLowerCase() === dishName.toLowerCase())) {
          continue
        }
        
        // Determine cuisine type from dish name or profile
        let cuisineType = 'indian' // Default
        if (dishName.toLowerCase().includes('biryani') || dishName.toLowerCase().includes('curry') || 
            dishName.toLowerCase().includes('dal') || dishName.toLowerCase().includes('paneer') ||
            dishName.toLowerCase().includes('murg') || dishName.toLowerCase().includes('gosht')) {
          cuisineType = 'indian'
        } else if (dishName.toLowerCase().includes('greek')) {
          cuisineType = 'mediterranean'
        } else if (dishName.toLowerCase().includes('prawns') || dishName.toLowerCase().includes('seafood')) {
          cuisineType = 'modern'
        } else if (profile.regional_preference) {
          cuisineType = profile.regional_preference.toLowerCase()
        }
        
        // Clean up description if it contains dish analysis
        if (description && description.toLowerCase().includes('this is likely')) {
          description = `Traditional ${cuisineType} dish with rich flavors`
        }
        
        console.log(`✅ Extracted dish: "${dishName}" (${cuisineType}) with description: "${description}"`)
        
        dishes.push({
          name: dishName,
          description: description || `Traditional ${cuisineType} dish`,
          cuisineType: cuisineType
        })
      }
    }
    
    console.log(`🍽️ Total dishes extracted: ${dishes.length}`, dishes)
    
    // If we couldn't extract enough dishes from the numbered format, try to find specific dish names
    if (dishes.length === 0) {
      console.log('⚠️ No dishes extracted from numbered format, trying specific dish name search...')
      
      // Look for common Indian dish names in the text
      const commonDishes = [
        'Murg Matka Dum Biryani', 'Gosht Hyderabadi Dum Biryani', 'Prawns Dum Biryani',
        'Greek Salad', 'Chicken Biryani', 'Mutton Biryani', 'Lamb Curry', 'Chicken Curry',
        'Dal Makhani', 'Paneer Makhani', 'Butter Chicken', 'Tandoori Chicken'
      ]
      
      for (const dishName of commonDishes) {
        if (analysisText.toLowerCase().includes(dishName.toLowerCase()) && dishes.length < 4) {
          let cuisineType = 'indian'
          if (dishName.toLowerCase().includes('greek')) {
            cuisineType = 'mediterranean'
          } else if (dishName.toLowerCase().includes('prawns')) {
            cuisineType = 'modern'
          }
          
          dishes.push({
            name: dishName,
            description: `Traditional ${cuisineType} dish with authentic flavors`,
            cuisineType: cuisineType
          })
          console.log(`🔄 Added specific dish: ${dishName}`)
        }
      }
    }
    
    return dishes
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Smart Menu Analyzer</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Upload a menu photo or paste text to get personalized recommendations</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Upload Menu Photo
            </h3>
            
            {uploadedImage ? (
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded menu" 
                  className="w-full max-h-64 object-contain rounded-lg border border-white/20"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-white/5 transition-all duration-200"
              >
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">Click to upload menu photo</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Supports JPG, PNG, WebP</p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Text Input Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Or Paste Menu Text
            </h3>
            <textarea
              value={menu}
              onChange={(e) => setMenu(e.target.value)}
              placeholder="Paste the restaurant menu here... Include dishes, descriptions, and prices if available."
              className="w-full h-32 px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:text-white placeholder-gray-500 resize-none"
              disabled={!!uploadedImage}
            />
            {uploadedImage && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Text input is disabled when an image is uploaded. Remove the image to use text input.
              </p>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || (!menu.trim() && !imageFile)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Menu with AI...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Analyze Menu with AI
              </>
            )}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Search className="w-5 h-5 mr-2 text-orange-500" />
            AI Analysis Results
          </h3>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysis}
            </pre>
          </div>
        </div>
      )}

      {/* AI Generated Food Images */}
      {recommendedDishes.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
            AI Generated Food Images
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Realistic AI-generated images of recommended Dishes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedDishes.map((dish, index) => (
              <div key={`${dish.name}-${index}`} className="space-y-3">
                <VertexAIImageGenerator
                  dishName={dish.name}
                  description={dish.description}
                  cuisineType={dish.cuisineType || 'modern'}
                  plating="elegant"
                  className="w-full"
                  onImageGenerated={(imageUrl) => {
                    console.log(`✅ Generated image for ${dish.name}:`, imageUrl)
                  }}
                  onError={(error) => {
                    console.error(`❌ Failed to generate image for ${dish.name}:`, error)
                  }}
                />
                
                {/* Dish Details */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {dish.name}
                  </h4>
                  {dish.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {dish.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-purple-400 font-medium">
                      {dish.cuisineType} Style
                    </span>
                    <span className="text-xs text-green-400">
                      ✅ Recommended
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}