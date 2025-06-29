import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Simplified profile type without complex nested objects
export type Profile = {
  id: string
  user_id: string
  full_name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'fat_loss_muscle_gain' | 'athletic_performance' | 'general_health'
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'
  sleep_hours: number
  water_goal_ltr: number
  notes: string
  calorie_target: number
  protein_target: number
  theme: 'light' | 'dark'
  points: number
  level: number
  streak_days: number
  last_login: string
  notification_preferences: {
    daily_reminders: boolean
    achievement_alerts: boolean
    community_updates: boolean
  }
  created_at: string
  // Virtual fields populated from user_preferences table
  dietary_restrictions?: string[]
  allergies?: string[]
  health_conditions?: string[]
  food_preferences?: string[]
  regional_preference?: string
}

export type UserPreference = {
  id: string
  user_id: string
  preference_type: 'dietary_restriction' | 'allergy' | 'health_condition' | 'food_preference' | 'regional_preference'
  preference_value: string
  created_at: string
}

export type SavedMealPlan = {
  id: string
  user_id: string
  name: string
  plan_type: 'weekly_meal_plan' | 'nutrition_strategy'
  plan_content: string
  parsed_data: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  user_id: string
  message: string
  response: string
  created_at: string
}

export type UserProgress = {
  id: string
  user_id: string
  date: string
  calories_consumed: number
  protein_consumed: number
  water_consumed: number
  meals_logged: number
  exercise_minutes: number
  weight?: number
  notes: string
  created_at: string
  updated_at: string
}

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  category: 'nutrition' | 'consistency' | 'community' | 'milestone'
  points: number
  requirement_type: 'streak' | 'total' | 'single_day' | 'community'
  requirement_value: number
  is_active: boolean
  created_at: string
}

export type UserAchievement = {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  progress: number
  achievement?: Achievement
}

export type CommunityRecipe = {
  id: string
  user_id: string
  title: string
  description?: string
  ingredients: string[] // This will be stored as JSONB but parsed as string array
  instructions: string
  prep_time?: number
  cook_time?: number
  servings: number
  calories_per_serving?: number
  protein_per_serving?: number
  tags: string[] // This will be stored as JSONB but parsed as string array
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine_type?: string
  dietary_tags: string[] // This will be stored as JSONB but parsed as string array
  image_url?: string
  is_public: boolean
  rating_average: number
  rating_count: number
  created_at: string
  updated_at: string
  profiles?: { full_name: string }
}

export type RecipeRating = {
  id: string
  user_id: string
  recipe_id: string
  rating: number
  review?: string
  created_at: string
}

export type GroceryList = {
  id: string
  user_id: string
  name: string
  items: Array<{
    id: string
    name: string
    checked: boolean
    category?: string
  }>
  is_template: boolean
  is_shared: boolean
  created_at: string
  updated_at: string
}

export type MealPlan = {
  id: string
  user_id: string
  name: string
  description?: string
  plan_data: any
  week_start_date?: string
  is_active: boolean
  is_template: boolean
  created_at: string
  updated_at: string
}

export type UserStreak = {
  id: string
  user_id: string
  streak_type: 'daily_login' | 'meal_logging' | 'water_goal' | 'calorie_goal' | 'exercise'
  current_streak: number
  longest_streak: number
  last_activity_date?: string
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: 'achievement' | 'reminder' | 'community' | 'system'
  is_read: boolean
  action_url?: string
  created_at: string
}

// Helper function to get user preferences
export const getUserPreferences = async (userId: string): Promise<{
  dietary_restrictions: string[]
  allergies: string[]
  health_conditions: string[]
  food_preferences: string[]
  regional_preference: string
}> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('preference_type, preference_value')
    .eq('user_id', userId)

  if (error) {
    // If table doesn't exist, return empty preferences instead of throwing
    if (error.code === '42P01') {
      return {
        dietary_restrictions: [],
        allergies: [],
        health_conditions: [],
        food_preferences: [],
        regional_preference: ''
      }
    }
    throw error
  }

  const preferences = {
    dietary_restrictions: [] as string[],
    allergies: [] as string[],
    health_conditions: [] as string[],
    food_preferences: [] as string[],
    regional_preference: ''
  }

  data?.forEach(pref => {
    switch (pref.preference_type) {
      case 'dietary_restriction':
        preferences.dietary_restrictions.push(pref.preference_value)
        break
      case 'allergy':
        preferences.allergies.push(pref.preference_value)
        break
      case 'health_condition':
        preferences.health_conditions.push(pref.preference_value)
        break
      case 'food_preference':
        preferences.food_preferences.push(pref.preference_value)
        break
      case 'regional_preference':
        preferences.regional_preference = pref.preference_value
        break
    }
  })

  return preferences
}

// Helper function to save user preferences
export const saveUserPreferences = async (
  userId: string,
  preferences: {
    dietary_restrictions?: string[]
    allergies?: string[]
    health_conditions?: string[]
    food_preferences?: string[]
    regional_preference?: string
  }
) => {
  try {
    // Delete existing preferences for this user
    await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)

    // Insert new preferences
    const preferencesToInsert: Omit<UserPreference, 'id' | 'created_at'>[] = []

  if (preferences.dietary_restrictions) {
    preferences.dietary_restrictions.forEach(value => {
      if (value.trim()) {
        preferencesToInsert.push({
          user_id: userId,
          preference_type: 'dietary_restriction',
          preference_value: value
        })
      }
    })
  }

  if (preferences.allergies) {
    preferences.allergies.forEach(value => {
      if (value.trim()) {
        preferencesToInsert.push({
          user_id: userId,
          preference_type: 'allergy',
          preference_value: value
        })
      }
    })
  }

  if (preferences.health_conditions) {
    preferences.health_conditions.forEach(value => {
      if (value.trim()) {
        preferencesToInsert.push({
          user_id: userId,
          preference_type: 'health_condition',
          preference_value: value
        })
      }
    })
  }

  if (preferences.food_preferences) {
    preferences.food_preferences.forEach(value => {
      if (value.trim()) {
        preferencesToInsert.push({
          user_id: userId,
          preference_type: 'food_preference',
          preference_value: value
        })
      }
    })
  }

  if (preferences.regional_preference && preferences.regional_preference.trim()) {
    preferencesToInsert.push({
      user_id: userId,
      preference_type: 'regional_preference',
      preference_value: preferences.regional_preference
    })
  }

  if (preferencesToInsert.length > 0) {
    const { error } = await supabase
      .from('user_preferences')
      .insert(preferencesToInsert)

    if (error) throw error
  }
  } catch (error: any) {
    // If user_preferences table doesn't exist, log warning but don't fail
    if (error?.code === '42P01') {
      console.warn('user_preferences table does not exist. Please run migrations first.')
    } else {
      throw error
    }
  }
}

// Helper function to get complete profile with preferences
export const getCompleteProfile = async (userId: string): Promise<Profile | null> => {
  // Get basic profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,user_id,full_name,age,gender,height,weight,goal,activity_level,sleep_hours,water_goal_ltr,notes,calorie_target,protein_target,theme,points,level,streak_days,last_login,notification_preferences,created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile) return null

  // Get preferences (with error handling for missing table)
  let preferences = {
    dietary_restrictions: [] as string[],
    allergies: [] as string[],
    health_conditions: [] as string[],
    food_preferences: [] as string[],
    regional_preference: ''
  }

  try {
    preferences = await getUserPreferences(userId)
  } catch (error: any) {
    // If user_preferences table doesn't exist, use empty preferences
    if (error?.code === '42P01') {
      console.warn('user_preferences table does not exist. Using empty preferences.')
    } else {
      console.warn('Error fetching preferences:', error)
    }
  }

  return {
    ...profile,
    ...preferences
  }
}

// Helper functions
export const updateUserProgress = async (userId: string, progressData: Partial<UserProgress>) => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      date: today,
      ...progressData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserProgress = async (userId: string, days: number = 7) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(days)

  if (error) throw error
  return data
}

export const getUserAchievements = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  if (error) throw error
  return data
}

export const getAvailableAchievements = async () => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('points', { ascending: true })

  if (error) throw error
  return data
}

export const getCommunityRecipes = async (limit: number = 20, offset: number = 0) => {
  // First try to get recipes without the profiles join since it's causing issues
  const { data, error } = await supabase
    .from('community_recipes')
    .select('*')
    .eq('is_public', true)
    .order('rating_average', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to fetch community recipes:', error)
    throw error
  }

  // If we got recipes, try to enrich them with user profile data
  if (data && data.length > 0) {
    // Get unique user IDs from the recipes
    const userIds = [...new Set(data.map(recipe => recipe.user_id))]
    
    try {
      // Fetch profile data for these users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds)
      
      if (!profileError && profiles) {
        // Create a lookup map for profiles
        const profileMap = new Map(profiles.map(p => [p.user_id, p]))
        
        // Enrich recipes with profile data
        return data.map(recipe => ({
          ...recipe,
          profiles: profileMap.get(recipe.user_id) || { full_name: 'Anonymous' }
        }))
      }
    } catch (profileError) {
      console.warn('Failed to fetch user profiles, using anonymous names:', profileError)
    }
  }

  // Return recipes without profile enrichment if profile fetch failed
  return data?.map(recipe => ({
    ...recipe,
    profiles: { full_name: 'Anonymous' }
  })) || []
}

export const saveGroceryList = async (userId: string, listData: Omit<GroceryList, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({
      user_id: userId,
      ...listData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserGroceryLists = async (userId: string) => {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as GroceryList[]
}

export const getActiveGroceryList = async (userId: string) => {
  const { data, error } = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data as GroceryList | null
}

export const updateGroceryList = async (listId: string, updates: Partial<Omit<GroceryList, 'id' | 'user_id' | 'created_at'>>) => {
  const { data, error } = await supabase
    .from('grocery_lists')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', listId)
    .select()
    .single()

  if (error) throw error
  return data as GroceryList
}

export const deleteGroceryList = async (listId: string) => {
  const { error } = await supabase
    .from('grocery_lists')
    .delete()
    .eq('id', listId)

  if (error) throw error
}

export const saveMealPlan = async (userId: string, planData: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: userId,
      ...planData
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateLastLogin = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .update({ last_login: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) throw error
}

// Meal Plan Management Functions
export const saveMealPlanToDatabase = async (
  userId: string, 
  name: string,
  planType: 'weekly_meal_plan' | 'nutrition_strategy',
  planContent: string,
  parsedData?: any
) => {
  try {
    // First, deactivate any existing active plans of the same type
    await supabase
      .from('saved_meal_plans')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('plan_type', planType)

    // Save the new plan as active
    const { data, error } = await supabase
      .from('saved_meal_plans')
      .insert({
        user_id: userId,
        name,
        plan_type: planType,
        plan_content: planContent,
        parsed_data: parsedData || {},
        is_active: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') {
        console.warn('saved_meal_plans table does not exist. Please run migrations first.')
        return null
      }
      throw error
    }
    return data
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.warn('saved_meal_plans table does not exist. Please run migrations first.')
      return null
    }
    throw error
  }
}

export const getActiveMealPlan = async (userId: string, planType: 'weekly_meal_plan' | 'nutrition_strategy') => {
  try {
    const { data, error } = await supabase
      .from('saved_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_type', planType)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        console.warn('saved_meal_plans table does not exist. Please run migrations first.')
        return null
      }
      throw error
    }
    return data
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.warn('saved_meal_plans table does not exist. Please run migrations first.')
      return null
    }
    throw error
  }
}

export const getUserMealPlans = async (userId: string, planType?: 'weekly_meal_plan' | 'nutrition_strategy') => {
  try {
    let query = supabase
      .from('saved_meal_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (planType) {
      query = query.eq('plan_type', planType)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01') {
        console.warn('saved_meal_plans table does not exist. Please run migrations first.')
        return []
      }
      throw error
    }
    return data
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.warn('saved_meal_plans table does not exist. Please run migrations first.')
      return []
    }
    throw error
  }
}

export const deleteMealPlan = async (planId: string) => {
  const { error } = await supabase
    .from('saved_meal_plans')
    .delete()
    .eq('id', planId)

  if (error) throw error
}

export const setActiveMealPlan = async (planId: string, userId: string, planType: 'weekly_meal_plan' | 'nutrition_strategy') => {
  // Deactivate all plans of this type for the user
  await supabase
    .from('saved_meal_plans')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('plan_type', planType)

  // Activate the selected plan
  const { data, error } = await supabase
    .from('saved_meal_plans')
    .update({ is_active: true })
    .eq('id', planId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const createCommunityRecipe = async (userId: string, recipeData: Omit<CommunityRecipe, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'rating_average' | 'rating_count' | 'profiles'>) => {
  // Debug: Check current user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Current authenticated user:', user?.id)
  console.log('Provided userId:', userId)
  
  if (authError) {
    console.error('Auth error:', authError)
    throw authError
  }
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  // Use the authenticated user's ID instead of the provided userId
  const { data, error } = await supabase
    .from('community_recipes')
    .insert({
      user_id: user.id, // Use the authenticated user's ID
      ...recipeData,
      rating_average: 0,
      rating_count: 0
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateCommunityRecipe = async (recipeId: string, updates: Partial<Omit<CommunityRecipe, 'id' | 'user_id' | 'created_at' | 'rating_average' | 'rating_count' | 'profiles'>>) => {
  const { data, error } = await supabase
    .from('community_recipes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', recipeId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteCommunityRecipe = async (recipeId: string) => {
  console.log('Attempting to delete recipe:', recipeId)
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('Auth error:', authError)
      throw new Error('Authentication failed')
    }
    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('Authenticated user:', user.id)

    // First check if recipe exists and user owns it
    const { data: recipe, error: fetchError } = await supabase
      .from('community_recipes')
      .select('id, user_id, title')
      .eq('id', recipeId)
      .single()

    if (fetchError) {
      console.error('Error fetching recipe:', fetchError)
      
      if (fetchError.code === 'PGRST116') {
        throw new Error('Recipe not found')
      }
      
      // Check for RLS policy issues
      if (fetchError.message?.includes('permission denied') || 
          fetchError.message?.includes('insufficient privilege') ||
          fetchError.message?.includes('row-level security')) {
        throw new Error(`Database permission error: ${fetchError.message}. You may need to run the IMPROVED_RLS_FIX.sql script.`)
      }
      
      throw new Error(`Failed to fetch recipe: ${fetchError.message}`)
    }

    console.log('Recipe found:', recipe.title)
    console.log('Recipe owner ID:', recipe.user_id)
    console.log('Current user ID:', user.id)
    console.log('IDs match?', recipe.user_id === user.id)

    if (recipe.user_id !== user.id) {
      console.error('User does not own this recipe. Recipe owner:', recipe.user_id, 'Current user:', user.id)
      throw new Error('You can only delete your own recipes')
    }

    // Attempt deletion with better error handling
    const { data, error, count } = await supabase
      .from('community_recipes')
      .delete({ count: 'exact' })
      .eq('id', recipeId)

    console.log('Delete response - error:', error)
    console.log('Delete response - count:', count)
    console.log('Delete response - data:', data)

    if (error) {
      console.error('Database error during delete:', error)
      
      // Check for specific RLS policy issues
      if (error.message?.includes('permission denied') || 
          error.message?.includes('insufficient privilege') ||
          error.message?.includes('row-level security') ||
          error.message?.includes('policy')) {
        throw new Error(`Row Level Security policy error: ${error.message}. Please run the IMPROVED_RLS_FIX.sql script in your Supabase SQL Editor to fix recipe deletion permissions.`)
      }
      
      throw new Error(`Failed to delete recipe: ${error.message}`)
    }

    if (count === 0) {
      console.log('Delete returned count=0, checking if recipe still exists...')
      
      // Check if the recipe still exists
      const { data: stillExists, error: checkError } = await supabase
        .from('community_recipes')
        .select('id, user_id, title')
        .eq('id', recipeId)
        .single()
      
      console.log('Recipe check after failed delete:', stillExists)
      console.log('Check error:', checkError)
      
      if (stillExists) {
        throw new Error('Recipe still exists after delete attempt. This is likely a Row Level Security (RLS) policy issue. Please run the IMPROVED_RLS_FIX.sql script in your Supabase SQL Editor to fix deletion permissions.')
      } else {
        console.log('Recipe no longer exists, delete may have succeeded despite count=0')
        return { deletedCount: 1, data: null }
      }
    }

    console.log('Delete successful, affected rows:', count)
    return { deletedCount: count, data }
    
  } catch (error) {
    console.error('Error in deleteCommunityRecipe:', error)
    
    // Re-throw with additional context if it's an RLS issue
    if (error instanceof Error && error.message.includes('policy')) {
      throw new Error(`${error.message}\n\nTo fix this, please:\n1. Open your Supabase dashboard\n2. Go to SQL Editor\n3. Run the IMPROVED_RLS_FIX.sql script\n4. Try deleting the recipe again`)
    }
    
    throw error
  }
}

// Temporary function to test deletion without RLS (for debugging only)
export const debugDeleteCommunityRecipe = async (recipeId: string) => {
  console.log('DEBUG: Attempting to delete recipe with admin privileges:', recipeId)
  
  // This should only be used for debugging - in production, always use RLS
  const { data, error, count } = await supabase
    .from('community_recipes')
    .delete({ count: 'exact' })
    .eq('id', recipeId)

  console.log('DEBUG Delete result:', { data, error, count })
  return { data, error, count }
}

// Function to check current user context and compare with recipe ownership
export const checkUserContext = async (recipeId: string) => {
  // Get auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('Auth user:', user)
  console.log('Auth error:', authError)

  // Get recipe details
  const { data: recipe, error: recipeError } = await supabase
    .from('community_recipes')
    .select('*')
    .eq('id', recipeId)
    .single()

  console.log('Recipe details:', recipe)
  console.log('Recipe error:', recipeError)

  // Test RLS by trying a select with the current user context
  const { data: rlsTest, error: rlsError } = await supabase
    .from('community_recipes')
    .select('id, title, user_id')
    .eq('id', recipeId)
    .eq('user_id', user?.id)

  console.log('RLS test (recipes owned by current user):', rlsTest)
  console.log('RLS test error:', rlsError)

  return {
    authUser: user,
    recipe,
    rlsTest,
    canDelete: recipe && user && recipe.user_id === user.id
  }
}

export const rateRecipe = async (userId: string, recipeId: string, rating: number, review?: string) => {
  // First, check if user has already rated this recipe
  const { data: existingRating } = await supabase
    .from('recipe_ratings')
    .select('id')
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .single()

  if (existingRating) {
    // Update existing rating
    const { error } = await supabase
      .from('recipe_ratings')
      .update({ rating, review })
      .eq('id', existingRating.id)
    
    if (error) throw error
  } else {
    // Insert new rating
    const { error } = await supabase
      .from('recipe_ratings')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        rating,
        review
      })
    
    if (error) throw error
  }

  // Update recipe's average rating
  await updateRecipeRating(recipeId)
}

const updateRecipeRating = async (recipeId: string) => {
  // Calculate new average rating
  const { data: ratings, error } = await supabase
    .from('recipe_ratings')
    .select('rating')
    .eq('recipe_id', recipeId)

  if (error) throw error

  if (ratings && ratings.length > 0) {
    const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    const count = ratings.length

    // Update the recipe with new rating data
    await supabase
      .from('community_recipes')
      .update({
        rating_average: Math.round(average * 100) / 100, // Round to 2 decimal places
        rating_count: count
      })
      .eq('id', recipeId)
  }
}