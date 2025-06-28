import React, { useState } from 'react'
import { Profile } from '../lib/supabase'
import { generateMealPlan, generateWeeklyNutritionRecommendations } from '../lib/gemini'
import { Calendar, Loader, RefreshCw, Target, Sparkles } from 'lucide-react'

interface MealPlannerProps {
  profile: Profile
}

export function MealPlanner({ profile }: MealPlannerProps) {
  const [mealPlan, setMealPlan] = useState('')
  const [nutritionRecommendations, setNutritionRecommendations] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [activeTab, setActiveTab] = useState<'meal-plan' | 'recommendations'>('meal-plan')

  const handleGeneratePlan = async () => {
    setLoading(true)
    try {
      const plan = await generateMealPlan(profile)
      setMealPlan(plan)
    } catch (error) {
      setMealPlan('Sorry, I encountered an error generating your meal plan. Please try again.')
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Meal Planner</h2>
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
                  AI will consider your dietary preferences, allergies, and regional cuisine
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

      {/* Results Display */}
      {((activeTab === 'meal-plan' && mealPlan) || (activeTab === 'recommendations' && nutritionRecommendations)) && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            {activeTab === 'meal-plan' ? (
              <>
                <Calendar className="w-5 h-5 mr-2 text-green-500" />
                Your 7-Day Meal Plan
              </>
            ) : (
              <>
                <Target className="w-5 h-5 mr-2 text-purple-500" />
                Your Nutrition Strategy
              </>
            )}
          </h3>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {activeTab === 'meal-plan' ? mealPlan : nutritionRecommendations}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}