import { useState, useEffect } from 'react'
import { Profile, getCommunityRecipes, CommunityRecipe, createCommunityRecipe, updateCommunityRecipe, deleteCommunityRecipe, checkUserContext, supabase } from '../lib/supabase'
import { Users, Star, Clock, ChefHat, Search, Plus, Heart, X, Edit2, Trash2, Eye } from 'lucide-react'

interface CommunityRecipesProps {
  profile: Profile
}

export function CommunityRecipes({ profile }: CommunityRecipesProps) {
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<CommunityRecipe | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state for sharing recipe
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: '',
    instructions: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    calories_per_serving: '',
    protein_per_serving: '',
    tags: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    cuisine_type: '',
    dietary_tags: '',
    image_url: '',
    is_public: true
  })

  // Get current authenticated user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      console.log('Current authenticated user ID:', user?.id)
      console.log('Profile user ID:', profile.user_id)
    }
    getCurrentUser()
  }, [profile.user_id])

  useEffect(() => {
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    try {
      setError(null)
      const data = await getCommunityRecipes(20, 0)
      console.log('Loaded recipes:', data)
      setRecipes(data || [])
      
      // If no recipes are returned, it might be a database issue
      if (!data || data.length === 0) {
        console.warn('No community recipes found. This might indicate missing database tables or data.')
      }
    } catch (error) {
      console.error('Error loading recipes:', error)
      setError('Failed to load community recipes. This might be due to missing database tables.')
      setRecipes([])
    } finally {
      setLoading(false)
    }
  }

  const handleShareRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSharing(true)
    setShareError(null)
    setShareSuccess(null)

    try {
      if (isEditing && selectedRecipe) {
        await handleUpdateRecipe(e)
        return
      }

      // Parse arrays from comma-separated strings
      const ingredients = formData.ingredients.split(',').map(item => item.trim()).filter(Boolean)
      const tags = formData.tags.split(',').map(item => item.trim()).filter(Boolean)
      const dietary_tags = formData.dietary_tags.split(',').map(item => item.trim()).filter(Boolean)

      const recipeData = {
        title: formData.title,
        description: formData.description || undefined,
        ingredients,
        instructions: formData.instructions,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : undefined,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : undefined,
        servings: parseInt(formData.servings),
        calories_per_serving: formData.calories_per_serving ? parseInt(formData.calories_per_serving) : undefined,
        protein_per_serving: formData.protein_per_serving ? parseFloat(formData.protein_per_serving) : undefined,
        tags,
        difficulty: formData.difficulty,
        cuisine_type: formData.cuisine_type || undefined,
        dietary_tags,
        image_url: formData.image_url || undefined,
        is_public: formData.is_public
      }

      console.log('Profile user_id:', profile.user_id)
      console.log('Current auth user_id:', currentUserId)
      console.log('Recipe data:', recipeData)
      
      // Note: createCommunityRecipe will use the authenticated user ID, not profile.user_id
      await createCommunityRecipe(profile.user_id, recipeData)
      
      setShareSuccess('Recipe shared successfully!')
      setShowShareModal(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setShareSuccess(null)
      }, 3000)
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        ingredients: '',
        instructions: '',
        prep_time: '',
        cook_time: '',
        servings: '',
        calories_per_serving: '',
        protein_per_serving: '',
        tags: '',
        difficulty: 'easy' as 'easy' | 'medium' | 'hard',
        cuisine_type: '',
        dietary_tags: '',
        image_url: '',
        is_public: true
      })
      
      // Reload recipes to show the new one
      await loadRecipes()
      
    } catch (error) {
      console.error('Error sharing recipe:', error)
      setShareError('Failed to share recipe. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const resetShareForm = () => {
    setShowShareModal(false)
    setShareError(null)
    setShareSuccess(null)
    setIsEditing(false)
    setSelectedRecipe(null)
    setFormData({
      title: '',
      description: '',
      ingredients: '',
      instructions: '',
      prep_time: '',
      cook_time: '',
      servings: '',
      calories_per_serving: '',
      protein_per_serving: '',
      tags: '',
      difficulty: 'easy' as 'easy' | 'medium' | 'hard',
      cuisine_type: '',
      dietary_tags: '',
      image_url: '',
      is_public: true
    })
  }

  const handleViewRecipe = (recipe: CommunityRecipe) => {
    setSelectedRecipe(recipe)
    setShowViewModal(true)
    setIsEditing(false)
  }

  const handleEditRecipe = (recipe: CommunityRecipe) => {
    setSelectedRecipe(recipe)
    setFormData({
      title: recipe.title,
      description: recipe.description || '',
      ingredients: recipe.ingredients.join(', '),
      instructions: recipe.instructions,
      prep_time: recipe.prep_time?.toString() || '',
      cook_time: recipe.cook_time?.toString() || '',
      servings: recipe.servings.toString(),
      calories_per_serving: recipe.calories_per_serving?.toString() || '',
      protein_per_serving: recipe.protein_per_serving?.toString() || '',
      tags: recipe.tags.join(', '),
      difficulty: recipe.difficulty,
      cuisine_type: recipe.cuisine_type || '',
      dietary_tags: recipe.dietary_tags.join(', '),
      image_url: recipe.image_url || '',
      is_public: recipe.is_public
    })
    setIsEditing(true)
    setShowShareModal(true)
  }

  const handleUpdateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecipe) return

    setSharing(true)
    setShareError(null)
    setShareSuccess(null)

    try {
      // Parse arrays from comma-separated strings
      const ingredients = formData.ingredients.split(',').map(item => item.trim()).filter(Boolean)
      const tags = formData.tags.split(',').map(item => item.trim()).filter(Boolean)
      const dietary_tags = formData.dietary_tags.split(',').map(item => item.trim()).filter(Boolean)

      const recipeData = {
        title: formData.title,
        description: formData.description || undefined,
        ingredients,
        instructions: formData.instructions,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : undefined,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : undefined,
        servings: parseInt(formData.servings),
        calories_per_serving: formData.calories_per_serving ? parseInt(formData.calories_per_serving) : undefined,
        protein_per_serving: formData.protein_per_serving ? parseFloat(formData.protein_per_serving) : undefined,
        tags,
        difficulty: formData.difficulty,
        cuisine_type: formData.cuisine_type || undefined,
        dietary_tags,
        image_url: formData.image_url || undefined,
        is_public: formData.is_public
      }

      await updateCommunityRecipe(selectedRecipe.id, recipeData)
      
      setShareSuccess('Recipe updated successfully!')
      setShowShareModal(false)
      setIsEditing(false)
      setSelectedRecipe(null)
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setShareSuccess(null)
      }, 3000)
      
      // Reset form
      resetShareForm()
      
      // Reload recipes to show the updated one
      await loadRecipes()
      
    } catch (error) {
      console.error('Error updating recipe:', error)
      setShareError('Failed to update recipe. Please try again.')
    } finally {
      setSharing(false)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return
    }

    setDeleting(recipeId)
    setShareError(null)
    setShareSuccess(null)
    
    console.log('Starting delete process for recipe:', recipeId)
    console.log('Current recipes before delete:', recipes.length)
    
    // Add debug check
    console.log('=== DEBUG: Checking user context ===')
    try {
      const debugInfo = await checkUserContext(recipeId)
      console.log('Debug info:', debugInfo)
    } catch (debugError) {
      console.error('Debug check failed:', debugError)
    }
    
    try {
      const result = await deleteCommunityRecipe(recipeId)
      console.log('Delete result:', result)
      
      setShareSuccess('Recipe deleted successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setShareSuccess(null)
      }, 3000)
      
      // Reload recipes to reflect the deletion
      console.log('Reloading recipes after deletion...')
      await loadRecipes()
      console.log('Recipes reloaded. New count:', recipes.length)
      
    } catch (error) {
      console.error('Error deleting recipe:', error)
      
      // Handle specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete recipe. Please try again.'
      setShareError(errorMessage)
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setShareError(null)
      }, 5000)
    } finally {
      setDeleting(null)
    }
  }

  const closeViewModal = () => {
    setShowViewModal(false)
    setSelectedRecipe(null)
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

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Community Recipes</h2>
            <p className="text-sm text-red-600 dark:text-red-400">Database Setup Required</p>
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">To fix this:</h3>
          <ol className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Run the complete migration SQL in your Supabase dashboard</li>
            <li>Ensure the community_recipes table is created</li>
            <li>Verify the foreign key relationship to profiles table exists</li>
            <li>Add some sample recipe data</li>
            <li>Refresh the page to try again</li>
          </ol>
        </div>
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
          
          <button 
            onClick={() => setShowShareModal(true)}
            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center"
          >
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
              
              <div className="space-y-2">
                <button 
                  onClick={() => handleViewRecipe(recipe)}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-2 rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center justify-center"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Recipe
                </button>
                
                {/* Show edit/delete buttons only for recipes owned by current user */}
                {currentUserId && recipe.user_id === currentUserId && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRecipe(recipe)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      disabled={deleting === recipe.id}
                      className="flex-1 bg-red-500 text-white py-2 rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deleting === recipe.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && recipes.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">No community recipes available</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Be the first to share a recipe with the community!
          </p>
          <button 
            onClick={() => setShowShareModal(true)}
            className="mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200 flex items-center mx-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Share First Recipe
          </button>
        </div>
      )}

      {filteredRecipes.length === 0 && recipes.length > 0 && (
        <div className="text-center py-12">
          <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">No recipes match your filters</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Success/Error Messages */}
      {shareSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg z-50">
          {shareSuccess}
        </div>
      )}

      {shareError && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-xl shadow-lg z-50">
          {shareError}
        </div>
      )}

      {/* Share Recipe Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Recipe' : 'Share Your Recipe'}
                </h3>
                <button
                  onClick={resetShareForm}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleShareRecipe} className="space-y-6">
                {shareError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                    {shareError}
                  </div>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Basic Information
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recipe Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter recipe title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Brief description of your recipe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="https://example.com/recipe-image.jpg"
                    />
                  </div>
                </div>

                {/* Recipe Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Recipe Details
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ingredients * (separated by commas)
                    </label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="2 cups flour, 1 tsp salt, 3 eggs, 1 cup milk..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Instructions *
                    </label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="1. Preheat oven to 350°F...&#10;2. Mix dry ingredients...&#10;3. Add wet ingredients..."
                    />
                  </div>
                </div>

                {/* Timing & Servings */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Timing & Servings
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prep Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.prep_time}
                        onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="15"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cook Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={formData.cook_time}
                        onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Servings *
                      </label>
                      <input
                        type="number"
                        value={formData.servings}
                        onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                        required
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="4"
                      />
                    </div>
                  </div>
                </div>

                {/* Nutritional Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Nutritional Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Calories per Serving
                      </label>
                      <input
                        type="number"
                        value={formData.calories_per_serving}
                        onChange={(e) => setFormData({ ...formData, calories_per_serving: e.target.value })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="250"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Protein per Serving (g)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.protein_per_serving}
                        onChange={(e) => setFormData({ ...formData, protein_per_serving: e.target.value })}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="15.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Categories & Tags */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Categories & Tags
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty *
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cuisine Type
                      </label>
                      <select
                        value={formData.cuisine_type}
                        onChange={(e) => setFormData({ ...formData, cuisine_type: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select cuisine</option>
                        <option value="american">American</option>
                        <option value="asian">Asian</option>
                        <option value="indian">Indian</option>
                        <option value="italian">Italian</option>
                        <option value="mediterranean">Mediterranean</option>
                        <option value="mexican">Mexican</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      General Tags (separated by commas)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="healthy, quick, protein-rich, comfort food"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dietary Tags (separated by commas)
                    </label>
                    <input
                      type="text"
                      value={formData.dietary_tags}
                      onChange={(e) => setFormData({ ...formData, dietary_tags: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="vegetarian, gluten-free, keto, dairy-free"
                    />
                  </div>
                </div>

                {/* Visibility */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Privacy Settings
                  </h4>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_public" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Make this recipe public (visible to all users)
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={resetShareForm}
                    className="px-6 py-3 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sharing}
                    className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sharing ? (isEditing ? 'Updating...' : 'Sharing...') : (isEditing ? 'Update Recipe' : 'Share Recipe')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Recipe Modal */}
      {showViewModal && selectedRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedRecipe.title}</h3>
                <button
                  onClick={closeViewModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Recipe Image */}
              {selectedRecipe.image_url && (
                <div className="mb-6">
                  <img
                    src={selectedRecipe.image_url}
                    alt={selectedRecipe.title}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              )}

              {/* Key Recipe Details - Centered Grid */}
              <div className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                  {/* Prep Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Prep Time</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedRecipe.prep_time || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">minutes</div>
                  </div>

                  {/* Cook Time */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Cook Time</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedRecipe.cook_time || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">minutes</div>
                  </div>

                  {/* Servings */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Servings</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedRecipe.servings}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">portions</div>
                  </div>

                  {/* Difficulty */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Difficulty</div>
                    <div className="text-sm font-bold">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(selectedRecipe.difficulty)}`}>
                        {selectedRecipe.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Calories */}
                  {selectedRecipe.calories_per_serving && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Calories</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedRecipe.calories_per_serving}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">per serving</div>
                    </div>
                  )}

                  {/* Protein */}
                  {selectedRecipe.protein_per_serving && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Protein</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedRecipe.protein_per_serving}g</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">per serving</div>
                    </div>
                  )}
                </div>

                {/* Rating in the centered section */}
                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center">
                    {renderStars(selectedRecipe.rating_average)}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {selectedRecipe.rating_average.toFixed(1)} ({selectedRecipe.rating_count} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recipe Description and Details */}
                <div className="space-y-4">
                  {selectedRecipe.description && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                      <p className="text-gray-600 dark:text-gray-300">{selectedRecipe.description}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Created by</h4>
                    <p className="text-gray-600 dark:text-gray-300">{selectedRecipe.profiles?.full_name || 'Anonymous'}</p>
                  </div>

                  {selectedRecipe.cuisine_type && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Cuisine</h4>
                      <p className="text-gray-600 dark:text-gray-300 capitalize">{selectedRecipe.cuisine_type}</p>
                    </div>
                  )}

                  {selectedRecipe.dietary_tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Dietary Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedRecipe.dietary_tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedRecipe.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedRecipe.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ingredients and Instructions */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Ingredients</h4>
                    <ul className="space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-gray-600 dark:text-gray-300">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">Instructions</h4>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selectedRecipe.instructions}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons for own recipes */}
              {currentUserId && selectedRecipe.user_id === currentUserId && (
                <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      closeViewModal()
                      handleEditRecipe(selectedRecipe)
                    }}
                    className="px-6 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 flex items-center"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Recipe
                  </button>
                  <button
                    onClick={() => {
                      closeViewModal()
                      handleDeleteRecipe(selectedRecipe.id)
                    }}
                    className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-200 flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Recipe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}