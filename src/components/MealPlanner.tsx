import { useState, useEffect } from 'react'
import { Profile, saveMealPlanToDatabase, getActiveMealPlan, getUserMealPlans, setActiveMealPlan, deleteMealPlan, SavedMealPlan } from '../lib/supabase'
import { generateMealPlan, generateWeeklyNutritionRecommendations } from '../lib/gemini'
import { 
  Calendar, Loader, RefreshCw, Target, Sparkles, Sunrise, Sun, Moon, Apple, Info, 
  History, Trash2, Check, X, BookOpen
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Helper function to assign meal icons
const assignMealIcon = (mealType: string): LucideIcon => {
  const mealIcons: Record<string, LucideIcon> = {
    'breakfast': Sunrise,
    'lunch': Sun,
    'dinner': Moon,
    'snack': Apple
  }
  return mealIcons[mealType.toLowerCase()] || Apple
}

interface MealPlannerProps {
  profile: Profile
}

interface ParsedMealPlan {
  notes?: string
  days: Array<{
    dayNumber: number
    dayName: string
    meals: Array<{
      type: string
      name: string
      calories: string
      protein: string
      description: string
      icon: LucideIcon
    }>
    totalCalories: string
    totalProtein: string
  }>
}

export function MealPlanner({ profile }: MealPlannerProps) {
  const [mealPlan, setMealPlan] = useState('')
  const [parsedMealPlan, setParsedMealPlan] = useState<ParsedMealPlan | null>(null)
  const [nutritionRecommendations, setNutritionRecommendations] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'recommendations'>('meal-plan')
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [savedPlans, setSavedPlans] = useState<SavedMealPlan[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [justGeneratedPlan, setJustGeneratedPlan] = useState(false)

  useEffect(() => {
    if (!initialLoadComplete && !justGeneratedPlan) {
      loadActivePlans().then(() => {
        setInitialLoadComplete(true)
        console.log('Initial load complete')
      })
    }
  }, [profile.user_id, initialLoadComplete, justGeneratedPlan])

  const loadActivePlans = async () => {
    try {
      console.log('Loading active plans...')
      // Load active meal plan
      const activeMealPlan = await getActiveMealPlan(profile.user_id, 'weekly_meal_plan')
      if (activeMealPlan) {
        console.log('Found active meal plan, loading...')
        setMealPlan(activeMealPlan.plan_content)
        if (activeMealPlan.parsed_data && Object.keys(activeMealPlan.parsed_data).length > 0) {
          // Reassign icons to meals when loading from database
          const parsedWithIcons = {
            ...activeMealPlan.parsed_data,
            days: activeMealPlan.parsed_data.days?.map((day: any) => ({
              ...day,
              meals: day.meals?.map((meal: any) => ({
                ...meal,
                icon: assignMealIcon(meal.type)
              }))
            }))
          }
          setParsedMealPlan(parsedWithIcons)
        } else {
          const parsed = parseMealPlan(activeMealPlan.plan_content)
          setParsedMealPlan(parsed)
        }
      } else {
        console.log('No active meal plan found')
      }

      // Load active nutrition strategy
      const activeStrategy = await getActiveMealPlan(profile.user_id, 'nutrition_strategy')
      if (activeStrategy) {
        console.log('Found active nutrition strategy, loading...')
        setNutritionRecommendations(activeStrategy.plan_content)
      } else {
        console.log('No active nutrition strategy found')
      }
    } catch (error) {
      console.error('Error loading active plans:', error)
    }
  }

  const loadSavedPlans = async () => {
    setLoadingHistory(true)
    try {
      const planType = activeTab === 'meal-plan' ? 'weekly_meal_plan' : 'nutrition_strategy'
      const plans = await getUserMealPlans(profile.user_id, planType)
      setSavedPlans(plans)
    } catch (error) {
      console.error('Error loading saved plans:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  const parseMealPlan = (planText: string): ParsedMealPlan => {
    try {
      const lines = planText.split('\n').filter(line => line.trim())
      const result: ParsedMealPlan = { days: [] }
      
      let currentDay: any = null
      let notesSection = false
      let notes = ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        
        // Check for notes section
        if (trimmedLine.toLowerCase().includes('shopping tips') || 
            trimmedLine.toLowerCase().includes('meal prep') ||
            trimmedLine.toLowerCase().includes('notes') ||
            trimmedLine.toLowerCase().includes('tips')) {
          notesSection = true
          continue
        }

        if (notesSection) {
          notes += trimmedLine + ' '
          continue
        }

        // Check for day headers
        const dayMatch = trimmedLine.match(/Day\s+(\d+)\s*-\s*(\w+)/i)
        if (dayMatch) {
          if (currentDay) {
            result.days.push(currentDay)
          }
          currentDay = {
            dayNumber: parseInt(dayMatch[1]),
            dayName: dayMatch[2],
            meals: [],
            totalCalories: '',
            totalProtein: ''
          }
          continue
        }

        // Check for meal entries
        const mealMatch = trimmedLine.match(/🌅|🌞|🌙|🍎/)
        if (mealMatch && currentDay) {
          const mealText = trimmedLine.replace(/🌅|🌞|🌙|🍎/, '').trim()
          const parts = mealText.split(':')
          if (parts.length >= 2) {
            const mealType = parts[0].trim().toLowerCase()
            const mealInfo = parts[1].trim()
            
            // Extract calories and protein
            const calorieMatch = mealInfo.match(/(\d+)\s*calories?/i)
            const proteinMatch = mealInfo.match(/(\d+)g?\s*protein/i)
            
            const meal = {
              type: mealType,
              name: mealInfo.split('(')[0].trim(),
              calories: calorieMatch ? calorieMatch[1] : '',
              protein: proteinMatch ? proteinMatch[1] : '',
              description: '',
              icon: assignMealIcon(mealType)
            }
            
            currentDay.meals.push(meal)
          }
          continue
        }

        // Check for meal descriptions
        if (currentDay && currentDay.meals.length > 0 && 
            !trimmedLine.includes('Daily Total') && 
            !trimmedLine.match(/Day\s+\d+/i)) {
          const lastMeal = currentDay.meals[currentDay.meals.length - 1]
          if (!lastMeal.description) {
            lastMeal.description = trimmedLine
          }
        }

        // Check for daily totals
        const totalMatch = trimmedLine.match(/Daily Total.*?(\d+)\s*calories.*?(\d+)g?\s*protein/i)
        if (totalMatch && currentDay) {
          currentDay.totalCalories = totalMatch[1]
          currentDay.totalProtein = totalMatch[2]
        }
      }

      if (currentDay) {
        result.days.push(currentDay)
      }

      if (notes.trim()) {
        result.notes = notes.trim()
      }

      console.log('Parsing successful:', result)
      return result
    } catch (error) {
      console.error('Error parsing meal plan:', error)
      // Return a structure that will show the raw meal plan
      return {
        days: [],
        notes: 'Meal plan generated successfully. View the raw text below if parsing failed.'
      }
    }
  }

  const handleGeneratePlan = async () => {
    setLoading(true)
    setJustGeneratedPlan(true) // Prevent loadActivePlans from overriding our new plan
    try {
      const plan = await generateMealPlan(profile)
      console.log('Generated meal plan:', plan)
      setMealPlan(plan)
      
      const parsed = parseMealPlan(plan)
      console.log('Parsed meal plan:', parsed)
      setParsedMealPlan(parsed)
      
      // Auto-save the generated plan (but don't fail if save fails)
      try {
        const defaultName = `Meal Plan - ${new Date().toLocaleDateString()}`
        console.log('Attempting to save meal plan to database...')
        // Remove icons from parsed data before saving to database
        const parsedForDB = {
          ...parsed,
          days: parsed.days?.map((day: any) => ({
            ...day,
            meals: day.meals?.map((meal: any) => {
              const { icon, ...mealWithoutIcon } = meal
              return mealWithoutIcon
            })
          }))
        }
        const saveResult = await saveMealPlanToDatabase(
          profile.user_id,
          defaultName,
          'weekly_meal_plan',
          plan,
          parsedForDB
        )
        console.log('Meal plan saved successfully:', saveResult)
      } catch (saveError: any) {
        console.warn('Failed to save meal plan, but keeping it displayed:', saveError)
        // Don't reset the meal plan if saving fails
        // Check if this is a database table missing error
        if (saveError?.code === '42P01') {
          console.warn('Database table missing - meal plan will remain visible but not saved')
        }
      }
    } catch (error) {
      console.error('Error generating meal plan:', error)
      setMealPlan('Sorry, I encountered an error generating your meal plan. Please try again.')
      setParsedMealPlan(null)
    } finally {
      setLoading(false)
      // Reset the flag after a delay to allow normal loading later
      setTimeout(() => setJustGeneratedPlan(false), 5000)
    }
  }

  const handleGenerateRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      const recommendations = await generateWeeklyNutritionRecommendations(profile)
      setNutritionRecommendations(recommendations)
      
      // Auto-save the generated strategy
      const defaultName = `Nutrition Strategy - ${new Date().toLocaleDateString()}`
      await saveMealPlanToDatabase(
        profile.user_id,
        defaultName,
        'nutrition_strategy',
        recommendations
      )
    } catch (error) {
      setNutritionRecommendations('Sorry, I encountered an error generating your nutrition recommendations. Please try again.')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  const handleLoadPlan = async (plan: SavedMealPlan) => {
    try {
      await setActiveMealPlan(plan.id, profile.user_id, plan.plan_type)
      
      if (plan.plan_type === 'weekly_meal_plan') {
        setMealPlan(plan.plan_content)
        if (plan.parsed_data && Object.keys(plan.parsed_data).length > 0) {
          // Reassign icons to meals when loading from database
          const parsedWithIcons = {
            ...plan.parsed_data,
            days: plan.parsed_data.days?.map((day: any) => ({
              ...day,
              meals: day.meals?.map((meal: any) => ({
                ...meal,
                icon: assignMealIcon(meal.type)
              }))
            }))
          }
          setParsedMealPlan(parsedWithIcons)
        } else {
          const parsed = parseMealPlan(plan.plan_content)
          setParsedMealPlan(parsed)
        }
        setActiveTab('meal-plan')
      } else {
        setNutritionRecommendations(plan.plan_content)
        setActiveTab('recommendations')
      }
      
      setShowHistoryDialog(false)
    } catch (error) {
      console.error('Error loading plan:', error)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteMealPlan(planId)
      await loadSavedPlans() // Refresh the list
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  const openHistoryDialog = () => {
    setShowHistoryDialog(true)
    loadSavedPlans()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Meal Planner</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Generate personalized meal plans and nutrition strategies</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={openHistoryDialog}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center"
            >
              <History className="w-4 h-4 mr-2" />
              History
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('meal-plan')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              activeTab === 'meal-plan'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            7-Day Meal Plan
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              activeTab === 'recommendations'
                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            Nutrition Strategy
          </button>
        </div>

        {/* Meal Plan Tab */}
        {activeTab === 'meal-plan' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Meal Plan</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Based on your goals: {profile.calorie_target} calories, {profile.protein_target}g protein daily
                </p>
              </div>
              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {mealPlan ? <RefreshCw className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                    {mealPlan ? 'Regenerate Plan' : 'Generate Meal Plan'}
                  </>
                )}
              </button>
            </div>

            {!mealPlan && !loading && (
              <div className="text-center py-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Ready to create your personalized meal plan?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  The assistant will consider your dietary preferences, allergies, and regional cuisine
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nutrition Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Nutrition Strategy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Comprehensive nutrition recommendations tailored to your profile
                </p>
              </div>
              <button
                onClick={handleGenerateRecommendations}
                disabled={loadingRecommendations}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
              >
                {loadingRecommendations ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {nutritionRecommendations ? <RefreshCw className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {nutritionRecommendations ? 'Regenerate Strategy' : 'Generate Strategy'}
                  </>
                )}
              </button>
            </div>

            {!nutritionRecommendations && !loadingRecommendations && (
              <div className="text-center py-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Get your personalized nutrition strategy
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Includes regional food focus, health considerations, and performance optimization
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes Component */}
      {parsedMealPlan?.notes && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 border border-blue-300 shadow-xl rounded-2xl p-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3 mt-1">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Meal Prep Tips & Notes</h3>
              <p className="text-blue-100 leading-relaxed">{parsedMealPlan.notes}</p>
            </div>
          </div>
        </div>
      )}



      {/* Day Cards Display */}
      {parsedMealPlan?.days && parsedMealPlan.days.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-green-500" />
            Your 7-Day Meal Plan
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {parsedMealPlan.days.map((day) => (
              <div key={day.dayNumber} className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Day {day.dayNumber} - {day.dayName}
                    </h4>
                    {day.totalCalories && day.totalProtein && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Total: {day.totalCalories} cal, {day.totalProtein}g protein
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold">{day.dayNumber}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {day.meals.map((meal, mealIndex) => {
                    // Ensure we have a valid icon component
                    const IconComponent: LucideIcon = meal.icon || Apple
                    return (
                      <div key={mealIndex} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3 mt-1">
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-gray-900 dark:text-white capitalize">
                                {meal.type}
                              </h5>
                              {(meal.calories || meal.protein) && (
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {meal.calories && `${meal.calories} cal`}
                                  {meal.calories && meal.protein && ', '}
                                  {meal.protein && `${meal.protein}g protein`}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                              {meal.name}
                            </p>
                            {meal.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                {meal.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nutrition Recommendations Display */}
      {activeTab === 'recommendations' && nutritionRecommendations && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-500" />
            Your Nutrition Strategy
          </h3>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {nutritionRecommendations}
            </pre>
          </div>
        </div>
      )}

      {/* Raw meal plan fallback */}
      {activeTab === 'meal-plan' && mealPlan && (!parsedMealPlan || parsedMealPlan.days.length === 0) && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-500" />
            Your 7-Day Meal Plan
          </h3>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {mealPlan}
            </pre>
          </div>
        </div>
      )}


      {/* History Dialog */}
      {showHistoryDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Saved {activeTab === 'meal-plan' ? 'Meal Plans' : 'Nutrition Strategies'}
              </h3>
              <button
                onClick={() => setShowHistoryDialog(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : savedPlans.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300">No saved plans yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generate and save your first {activeTab === 'meal-plan' ? 'meal plan' : 'nutrition strategy'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedPlans.map((plan) => (
                    <div key={plan.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {plan.name}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(plan.created_at).toLocaleDateString()}
                            </p>
                            {plan.is_active && (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full font-medium">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleLoadPlan(plan)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
                            title="Load this plan"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                            title="Delete this plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}