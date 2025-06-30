import React, { useState, useRef, useEffect } from 'react'
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

interface MenuAnalyzerState {
  menu: string;
  analysis: string;
  uploadedImage: string | null;
  recommendedDishes: RecommendedDish[];
}

export function MenuAnalyzer({ profile }: MenuAnalyzerProps) {
  const [menu, setMenu] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [recommendedDishes, setRecommendedDishes] = useState<RecommendedDish[]>([])
  const [sessionRestored, setSessionRestored] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Storage keys
  const STORAGE_KEY = 'nutriwise-menu-analyzer-state'

  // Load state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsedState: MenuAnalyzerState = JSON.parse(savedState)
        if (parsedState.menu || parsedState.analysis || parsedState.uploadedImage || parsedState.recommendedDishes?.length > 0) {
          setMenu(parsedState.menu || '')
          setAnalysis(parsedState.analysis || '')
          setUploadedImage(parsedState.uploadedImage || null)
          setRecommendedDishes(parsedState.recommendedDishes || [])
          setSessionRestored(true)
          console.log('📁 Restored menu analyzer state from localStorage')
          
          // Hide the restoration notification after 3 seconds
          setTimeout(() => setSessionRestored(false), 3000)
        }
      } catch (error) {
        console.error('❌ Failed to parse saved menu analyzer state:', error)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save state to localStorage whenever key state changes
  useEffect(() => {
    const stateToSave: MenuAnalyzerState = {
      menu,
      analysis,
      uploadedImage,
      recommendedDishes
    }
    
    // Only save if there's meaningful data
    if (menu || analysis || uploadedImage || recommendedDishes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      console.log('💾 Saved menu analyzer state to localStorage')
    }
  }, [menu, analysis, uploadedImage, recommendedDishes])

  // Clear saved state
  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEY)
    setMenu('')
    setAnalysis('')
    setUploadedImage(null)
    setImageFile(null)
    setRecommendedDishes([])
    console.log('🗑️ Cleared menu analyzer session')
  }

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
    
    console.log('🔍 Extracting dishes from analysis (first 1000 chars):', analysisText.substring(0, 1000))
    console.log('🔍 Full analysis length:', analysisText.length)
    
    // More precise pattern to extract only numbered dish titles
    // Pattern: "1. Mutton Cutlet (2 pcs):" or "2. Chicken Cheese Masala Omelette:"
    const numberedDishPattern = /(?:^|\n)\s*(\d+)\.\s*([A-Z][^:\n(]*?)(?:\s*\([^)]*\))?\s*:/gm
    
    console.log('🔍 Using numbered dish title pattern...')
    
    let match
    while ((match = numberedDishPattern.exec(analysisText)) !== null && dishes.length < 4) {
      const dishNumber = match[1]
      let dishName = match[2]?.trim()
      
      console.log(`🔍 Found numbered dish ${dishNumber}: "${dishName}"`)
      
      if (dishName && isValidDishName(dishName)) {
        // Clean up dish name
        dishName = dishName
          .replace(/[*_]/g, '') // Remove markdown formatting
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim()
        
        // Additional validation - must be a proper dish name
        if (dishName.length > 5 && dishName.length < 60 && 
            !dishName.toLowerCase().includes('option') &&
            !dishName.toLowerCase().includes('likely') &&
            !dishName.toLowerCase().includes('most of') &&
            !dishName.toLowerCase().includes('all of') &&
            !dishName.toLowerCase().includes('various') &&
            !dishName.toLowerCase().includes('several') &&
            !dishName.toLowerCase().includes('many') &&
            !dishName.toLowerCase().includes('items') &&
            !dishName.toLowerCase().includes('dishes') &&
            /^[A-Z]/.test(dishName)) { // Must start with capital letter
          
          // Check if we already have this dish
          if (dishes.some(d => d.name.toLowerCase() === dishName.toLowerCase())) {
            console.log(`⏭️ Skipping duplicate dish: "${dishName}"`)
            continue
          }
          
          // Determine cuisine type from dish name or profile
          let cuisineType = profile.regional_preference?.toLowerCase() || 'indian'
          if (dishName.toLowerCase().includes('biryani') || dishName.toLowerCase().includes('curry') || 
              dishName.toLowerCase().includes('dal') || dishName.toLowerCase().includes('paneer') ||
              dishName.toLowerCase().includes('murg') || dishName.toLowerCase().includes('gosht') ||
              dishName.toLowerCase().includes('tandoori') || dishName.toLowerCase().includes('masala') ||
              dishName.toLowerCase().includes('cutlet') || dishName.toLowerCase().includes('tikka')) {
            cuisineType = 'indian'
          } else if (dishName.toLowerCase().includes('greek') || dishName.toLowerCase().includes('mediterranean')) {
            cuisineType = 'mediterranean'
          } else if (dishName.toLowerCase().includes('prawns') || dishName.toLowerCase().includes('seafood') ||
                     dishName.toLowerCase().includes('salmon') || dishName.toLowerCase().includes('fish')) {
            cuisineType = 'modern'
          } else if (dishName.toLowerCase().includes('pasta') || dishName.toLowerCase().includes('pizza')) {
            cuisineType = 'italian'
          } else if (dishName.toLowerCase().includes('sandwich') || dishName.toLowerCase().includes('burger')) {
            cuisineType = 'western'
          }
          
          // Create proper description based on dish name and type
          let description = generateDishDescription(dishName, cuisineType)
          
          console.log(`✅ Extracted dish: "${dishName}" (${cuisineType}) with description: "${description}"`)
          
          dishes.push({
            name: dishName,
            description: description,
            cuisineType: cuisineType
          })
        } else {
          console.log(`⏭️ Skipping invalid dish name: "${dishName}"`)
        }
      }
    }
    
    console.log(`🔧 Extracted ${dishes.length} dishes using numbered pattern`)
    
    // If no dishes found with numbered pattern, try fallback with specific dish search
    if (dishes.length === 0) {
      console.log('⚠️ No dishes extracted from numbered pattern, trying fallback search...')
      
      // Look for common dish names directly mentioned in the text
      const commonDishes = [
        'Mutton Cutlet', 'Chicken Cheese Masala Omelette', 'Chicken Biryani', 'Mutton Biryani',
        'Butter Chicken', 'Tandoori Chicken', 'Dal Makhani', 'Paneer Makhani',
        'Fish Curry', 'Prawn Curry', 'Vegetable Biryani', 'Chicken Tikka',
        'Greek Salad', 'Caesar Salad', 'Grilled Chicken', 'Chicken Sandwich'
      ]
      
      for (const dishName of commonDishes) {
        if (analysisText.toLowerCase().includes(dishName.toLowerCase()) && dishes.length < 3) {
          let cuisineType = 'indian'
          if (dishName.toLowerCase().includes('greek') || dishName.toLowerCase().includes('caesar')) {
            cuisineType = 'mediterranean'
          } else if (dishName.toLowerCase().includes('sandwich') || dishName.toLowerCase().includes('grilled')) {
            cuisineType = 'western'
          }
          
          dishes.push({
            name: dishName,
            description: generateDishDescription(dishName, cuisineType),
            cuisineType: cuisineType
          })
          console.log(`🔄 Added fallback dish: ${dishName}`)
        }
      }
    }
    
    console.log(`🍽️ Final extracted dishes (${dishes.length}):`, dishes.map(d => d.name))
    
    return dishes
  }
  
  // Generate proper description for image generation
  const generateDishDescription = (dishName: string, cuisineType: string): string => {
    const dishLower = dishName.toLowerCase()
    
    // Specific descriptions based on dish type
    if (dishLower.includes('cutlet')) {
      return `Golden fried ${cuisineType} cutlet with crispy coating, served hot with garnish`
    } else if (dishLower.includes('omelette')) {
      return `Fluffy ${cuisineType} style omelette with cheese and spices, perfectly cooked`
    } else if (dishLower.includes('biryani')) {
      return `Aromatic basmati rice layered with spiced meat and traditional ${cuisineType} seasonings`
    } else if (dishLower.includes('curry')) {
      return `Rich and creamy ${cuisineType} curry with traditional spices and fresh herbs`
    } else if (dishLower.includes('tandoori')) {
      return `Clay oven roasted ${cuisineType} dish with smoky flavor and vibrant spices`
    } else if (dishLower.includes('masala')) {
      return `Spiced ${cuisineType} dish with aromatic masala and traditional cooking`
    } else if (dishLower.includes('grilled')) {
      return `Perfectly grilled dish with char marks and ${cuisineType} marinade`
    } else if (dishLower.includes('sandwich')) {
      return `Fresh ${cuisineType} style sandwich with crispy bread and flavorful fillings`
    } else if (dishLower.includes('salad')) {
      return `Fresh and colorful ${cuisineType} salad with crisp vegetables and dressing`
    } else {
      return `Traditional ${cuisineType} dish prepared with authentic spices and fresh ingredients`
    }
  }

  // Validate if a string is a proper dish name
  const isValidDishName = (name: string): boolean => {
    if (!name || name.length < 3 || name.length > 100) return false
    
    // Must start with a capital letter
    if (!/^[A-Z]/.test(name)) return false
    
    // Should not contain explanatory phrases
    const invalidPhrases = [
      'this appears', 'this is', 'it appears', 'seems to be', 'likely to be',
      'appears to be', 'description', 'analysis', 'estimated', 'approximately',
      'nutritional', 'calories', 'protein content', 'why it fits', 'benefits',
      'most of', 'all of', 'various', 'several', 'many', 'items', 'dishes',
      'options', 'bakery items', 'the bakery', 'cream roll', 'jam roll'
    ]
    
    const nameLower = name.toLowerCase()
    
    // Check for invalid phrases
    if (invalidPhrases.some(phrase => nameLower.includes(phrase))) return false
    
    // Must contain alphabetic characters (not just numbers and symbols)
    if (!/[a-zA-Z]{3,}/.test(name)) return false
    
    // Should not be a generic description
    if (nameLower === 'dish' || nameLower === 'food' || nameLower === 'meal') return false
    
    return true
  }

  return (
    <div className="space-y-4 sm:space-y-6 h-full overflow-y-auto custom-scrollbar p-3 sm:p-0">
      {/* Session Restored Notification */}
      {sessionRestored && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
            <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-green-400 font-medium text-xs sm:text-sm">Session Restored</p>
            <p className="text-green-300/80 text-xs">Your previous menu analysis has been restored</p>
          </div>
        </div>
      )}
      
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Smart Menu Analyzer</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Upload a menu photo or paste text to get personalized recommendations</p>
            </div>
          </div>
          
          {/* Clear Session Button - only show if there's saved data */}
          {(analysis || uploadedImage || recommendedDishes.length > 0) && (
            <button
              onClick={clearSession}
              className="px-2 sm:px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-colors duration-200 border border-red-500/30 flex-shrink-0"
              title="Clear saved session"
            >
              Clear Session
            </button>
          )}
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recommendedDishes.map((dish, index) => {
              console.log(`🖼️ Rendering image for dish: "${dish.name}" with description: "${dish.description}" (${dish.cuisineType})`)
              return (
                <div key={`${dish.name}-${index}`} className="space-y-2 sm:space-y-3">
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
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-2 sm:p-3">
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                      {dish.name}
                    </h4>
                    {dish.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {dish.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                      <span className="text-xs text-purple-400 font-medium">
                        {dish.cuisineType} Style
                      </span>
                      <span className="text-xs text-green-400">
                        ✅ Recommended
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}