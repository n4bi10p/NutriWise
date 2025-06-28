import React, { useState, useEffect } from 'react'
import { Profile, updateUserProgress, getUserProgress, UserProgress } from '../lib/supabase'
import { TrendingUp, Plus, Calendar, Droplets, Zap, Target, Activity } from 'lucide-react'

interface ProgressTrackerProps {
  profile: Profile
}

interface MealEntry {
  id: string
  meal: string
  calories: number
  protein: number
}

export function ProgressTracker({ profile }: ProgressTrackerProps) {
  const [todayProgress, setTodayProgress] = useState<UserProgress | null>(null)
  const [weekProgress, setWeekProgress] = useState<UserProgress[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newEntry, setNewEntry] = useState({
    meal: '',
    calories: '',
    protein: '',
    water: ''
  })

  useEffect(() => {
    loadProgress()
  }, [profile.user_id])

  const loadProgress = async () => {
    try {
      const progressData = await getUserProgress(profile.user_id, 7)
      setWeekProgress(progressData)
      
      const today = new Date().toISOString().split('T')[0]
      const todayData = progressData.find(p => p.date === today)
      setTodayProgress(todayData || null)
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEntry = async () => {
    if (!newEntry.meal || !newEntry.calories || !newEntry.protein) return

    try {
      const currentProgress = todayProgress || {
        calories_consumed: 0,
        protein_consumed: 0,
        water_consumed: 0,
        meals_logged: 0
      }

      const updatedProgress = await updateUserProgress(profile.user_id, {
        calories_consumed: currentProgress.calories_consumed + parseInt(newEntry.calories),
        protein_consumed: currentProgress.protein_consumed + parseInt(newEntry.protein),
        water_consumed: newEntry.water ? currentProgress.water_consumed + parseFloat(newEntry.water) : currentProgress.water_consumed,
        meals_logged: currentProgress.meals_logged + 1
      })

      setTodayProgress(updatedProgress)
      setNewEntry({ meal: '', calories: '', protein: '', water: '' })
      setShowAddForm(false)
      
      // Reload progress to get updated data
      loadProgress()
    } catch (error) {
      console.error('Error adding entry:', error)
    }
  }

  const updateWaterIntake = async (amount: number) => {
    try {
      const currentProgress = todayProgress || { water_consumed: 0 }
      const newWaterAmount = Math.max(0, currentProgress.water_consumed + amount)
      
      const updatedProgress = await updateUserProgress(profile.user_id, {
        water_consumed: newWaterAmount
      })

      setTodayProgress(updatedProgress)
      loadProgress()
    } catch (error) {
      console.error('Error updating water intake:', error)
    }
  }

  const todayCalories = todayProgress?.calories_consumed || 0
  const todayProtein = todayProgress?.protein_consumed || 0
  const todayWater = todayProgress?.water_consumed || 0

  const calorieProgress = (todayCalories / profile.calorie_target) * 100
  const proteinProgress = (todayProtein / profile.protein_target) * 100
  const waterProgress = (todayWater / profile.water_goal_ltr) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Progress */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Progress</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Track your daily nutrition intake</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meal
          </button>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-orange-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Calories</h3>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {todayCalories} / {profile.calorie_target}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {calorieProgress.toFixed(1)}% of target
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Target className="w-5 h-5 text-blue-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Protein</h3>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {todayProtein}g / {profile.protein_target}g
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(proteinProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {proteinProgress.toFixed(1)}% of target
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Droplets className="w-5 h-5 text-cyan-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Water</h3>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {todayWater.toFixed(1)}L / {profile.water_goal_ltr}L
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(waterProgress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {waterProgress.toFixed(1)}% of target
              </p>
              <div className="flex space-x-1">
                <button
                  onClick={() => updateWaterIntake(-0.25)}
                  className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-bold transition-colors duration-200"
                >
                  -
                </button>
                <button
                  onClick={() => updateWaterIntake(0.25)}
                  className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold transition-colors duration-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            7-Day Overview
          </h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (6 - i))
              const dateStr = date.toISOString().split('T')[0]
              const dayProgress = weekProgress.find(p => p.date === dateStr)
              
              const dayCalorieProgress = dayProgress ? (dayProgress.calories_consumed / profile.calorie_target) * 100 : 0
              
              return (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {date.toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded-lg relative overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-cyan-500 transition-all duration-300"
                      style={{ height: `${Math.min(dayCalorieProgress, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {dayProgress?.calories_consumed || 0}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Meal Form */}
      {showAddForm && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Meal Entry</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meal Description
              </label>
              <input
                type="text"
                value={newEntry.meal}
                onChange={(e) => setNewEntry(prev => ({ ...prev, meal: e.target.value }))}
                placeholder="e.g., Chicken breast with vegetables"
                className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white placeholder-gray-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calories
                </label>
                <input
                  type="number"
                  value={newEntry.calories}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, calories: e.target.value }))}
                  placeholder="e.g., 350"
                  className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Protein (g)
                </label>
                <input
                  type="number"
                  value={newEntry.protein}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, protein: e.target.value }))}
                  placeholder="e.g., 25"
                  className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Water (L) - Optional
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.water}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, water: e.target.value }))}
                  placeholder="e.g., 0.5"
                  className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:text-white placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={addEntry}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-200"
              >
                Add Entry
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 bg-white/10 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}