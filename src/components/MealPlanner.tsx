import React, { useState } from 'react'
import { Profile } from '../lib/supabase'
import { generateMealPlan, generateWeeklyNutritionRecommendations } from '../lib/gemini'
import { Calendar, Loader, RefreshCw, Target, Sparkles, Sunrise, Sun, Moon, Apple, Info } from 'lucide-react'

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
      icon: any
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

  const parseMealPlan = (planText: string): ParsedMealPlan => {
    const lines = planText.split('\n').filter(line => line.trim())
    const result: ParsedMealPlan = { days: [] }
    
    let currentDay: any = null
    let notesSection = false
    let notes = ''

    const mealIcons = {
      'breakfast': Sunrise,
      'lunch': Sun,
      'dinner': Moon,
      'snack': Apple
    }

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
            icon: mealIcons[mealType as keyof typeof mealIcons] || Apple
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

    return result
  }

  const handleGeneratePlan = async () => {
    setLoading(true)
    try {
      const plan = await generateMealPlan(profile)
      setMealPlan(plan)
      const parsed = parseMealPlan(plan)
      setParsedMealPlan(parsed)
    } catch (error) {
      setMealPlan('Sorry, I encountered an error generating your meal plan. Please try again.')
      setParsedMealPlan(null)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      const recommendations = await generateWeeklyNutritionRecommendations(profile)
      setNutritionRecommendations(recommendations)
    } catch (error) {
      setNutritionRecommendations('Sorry, I encountered an error generating your nutrition recommendations. Please try again.')
    } finally {
      setLoadingRecommendations(false)
    }
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
                    const IconComponent = meal.icon
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
    </div>
  )
}