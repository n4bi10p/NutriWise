import React, { useState, useEffect } from 'react'
import { Profile, getCommunityRecipes, CommunityRecipe } from '../lib/supabase'
import { Users, Star, Clock, ChefHat, Search, Filter, Plus, Heart } from 'lucide-react'

interface CommunityRecipesProps {
  profile: Profile
}

export function CommunityRecipes({ profile }: CommunityRecipesProps) {
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      const data = await getCommunityRecipes(20, 0)
      setRecipes(data)
    } catch (error) {
      console.error('Error loading recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDifficulty = !selectedDifficulty || recipe.difficulty === selectedDifficulty
    const matchesCuisine = !selectedCuisine || recipe.cuisine_type === selectedCuisine
    
    return matchesSearch && matchesDifficulty && matchesCuisine
  })

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-100'
      case 'medium': return 'text-yellow-500 bg-yellow-100'
      case 'hard': return 'text-red-500 bg-red-100'
      default: return 'text-gray-500 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mr-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Community Recipes</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Discover and share healthy recipes with the community</p>
            </div>
          </div>
          
          <button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Share Recipe
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:text-white placeholder-gray-500"
              />
            </div>
          </div>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:text-white"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          
          <select
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
            className="px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:text-white"
          >
            <option value="">All Cuisines</option>
            <option value="indian">Indian</option>
            <option value="mediterranean">Mediterranean</option>
            <option value="asian">Asian</option>
            <option value="american">American</option>
            <option value="mexican">Mexican</option>
          </select>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-200">
            {recipe.image_url && (
              <div className="h-48 bg-gradient-to-r from-pink-500 to-rose-500 relative">
                <img 
                  src={recipe.image_url} 
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors duration-200">
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{recipe.title}</h3>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {recipe.description}
              </p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {renderStars(recipe.rating_average)}
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    ({recipe.rating_count})
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 mr-1" />
                  {(recipe.prep_time || 0) + (recipe.cook_time || 0)}m
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-300">By </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {recipe.profiles?.full_name || 'Anonymous'}
                  </span>
                </div>
                
                {recipe.calories_per_serving && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {recipe.calories_per_serving} cal/serving
                  </div>
                )}
              </div>
              
              {recipe.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.dietary_tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-lg">
                      {tag}
                    </span>
                  ))}
                  {recipe.dietary_tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                      +{recipe.dietary_tags.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              <button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200">
                View Recipe
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">No recipes found</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}