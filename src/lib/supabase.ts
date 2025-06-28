import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Explicitly define profile columns to avoid stack depth issues with SELECT *
export const PROFILE_COLUMNS = `
  id,
  user_id,
  full_name,
  age,
  gender,
  height,
  weight,
  goal,
  preferences,
  allergies,
  health_conditions,
  food_preferences,
  activity_level,
  sleep_hours,
  water_goal_ltr,
  notes,
  calorie_target,
  protein_target,
  theme,
  points,
  level,
  streak_days,
  last_login,
  notification_preferences,
  created_at
`

export type Profile = {
  id: string
  user_id: string
  full_name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'fat_loss_muscle_gain' | 'athletic_performance' | 'general_health'
  preferences: {
    dietary_restrictions: string[]
    regional_preference: string
  }
  allergies: string[]
  health_conditions: string[]
  food_preferences: string[]
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
  ingredients: string[]
  instructions: string
  prep_time?: number
  cook_time?: number
  servings: number
  calories_per_serving?: number
  protein_per_serving?: number
  tags: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  cuisine_type?: string
  dietary_tags: string[]
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
  const { data, error } = await supabase
    .from('community_recipes')
    .select(`
      *,
      profiles!inner(full_name)
    `)
    .eq('is_public', true)
    .order('rating_average', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
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