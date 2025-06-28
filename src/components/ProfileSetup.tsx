import React, { useState } from 'react'
import { supabase, saveUserPreferences } from '../lib/supabase'
import { 
  User, Target, Utensils, Globe, Calculator, AlertCircle, 
  Heart, Activity, Moon, Droplets, FileText, Shield,
  Zap, Coffee, Sparkles, TrendingUp, TrendingDown, 
  Minus, Plus, Dumbbell, Scale
} from 'lucide-react'

interface ProfileSetupProps {
  userId: string
  onProfileComplete: () => void
  error?: string
}

export function ProfileSetup({ userId, onProfileComplete, error: propError }: ProfileSetupProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    height: '',
    weight: '',
    goal: 'maintenance' as 'weight_loss' | 'muscle_gain' | 'maintenance' | 'fat_loss_muscle_gain' | 'athletic_performance' | 'general_health',
    dietary_restrictions: [] as string[],
    regional_preference: '',
    allergies: [] as string[],
    health_conditions: [] as string[],
    food_preferences: [] as string[],
    activity_level: 'moderately_active' as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active',
    sleep_hours: '8',
    water_goal_ltr: '2.5',
    notes: '',
    calorie_target: '',
    protein_target: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(propError || '')

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 
    'Keto', 'Paleo', 'Mediterranean', 'Low-Sodium', 'Diabetic-Friendly'
  ]

  const allergyOptions = [
    'Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Eggs', 'Tree Nuts', 'None'
  ]

  const healthConditionOptions = [
    'Diabetes', 'Hypertension', 'Thyroid', 'PCOS', 'Cholesterol', 'Heart Condition', 'None'
  ]

  const foodPreferenceOptions = [
    'Spicy', 'Sweet', 'Savory', 'Crunchy', 'Soft', 'Cold Meals', 'Hot Meals'
  ]

  const goalOptions = [
    { 
      value: 'weight_loss', 
      label: 'Weight Loss', 
      description: 'Lose weight and reduce body fat',
      icon: TrendingDown,
      color: 'from-red-500 to-pink-500'
    },
    { 
      value: 'muscle_gain', 
      label: 'Muscle Gain', 
      description: 'Build muscle mass and strength',
      icon: Dumbbell,
      color: 'from-blue-500 to-indigo-500'
    },
    { 
      value: 'maintenance', 
      label: 'Maintenance', 
      description: 'Maintain current weight and health',
      icon: Minus,
      color: 'from-green-500 to-emerald-500'
    },
    { 
      value: 'fat_loss_muscle_gain', 
      label: 'Body Recomposition', 
      description: 'Lose fat while gaining muscle',
      icon: Scale,
      color: 'from-purple-500 to-violet-500'
    },
    { 
      value: 'athletic_performance', 
      label: 'Athletic Performance', 
      description: 'Optimize nutrition for sports performance',
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500'
    },
    { 
      value: 'general_health', 
      label: 'General Health', 
      description: 'Improve overall health and wellness',
      icon: Heart,
      color: 'from-teal-500 to-cyan-500'
    }
  ]

  const indianStates = [
    { value: 'andhra_pradesh', label: 'Andhra Pradesh (Andhra cuisine)' },
    { value: 'arunachal_pradesh', label: 'Arunachal Pradesh (Bamboo shoot dishes)' },
    { value: 'assam', label: 'Assam (Assamese thali)' },
    { value: 'bihar', label: 'Bihar (Litti Chokha)' },
    { value: 'chhattisgarh', label: 'Chhattisgarh (Chana Samosa)' },
    { value: 'goa', label: 'Goa (Goan Fish Curry)' },
    { value: 'gujarat', label: 'Gujarat (Gujarati Thali)' },
    { value: 'haryana', label: 'Haryana (Bajra Roti)' },
    { value: 'himachal_pradesh', label: 'Himachal Pradesh (Siddu)' },
    { value: 'jharkhand', label: 'Jharkhand (Thekua)' },
    { value: 'karnataka', label: 'Karnataka (Ragi Mudde, Bisi Bele Bath)' },
    { value: 'kerala', label: 'Kerala (Sadhya)' },
    { value: 'madhya_pradesh', label: 'Madhya Pradesh (Poha)' },
    { value: 'maharashtra', label: 'Maharashtra (Misal Pav)' },
    { value: 'manipur', label: 'Manipur (Eromba)' },
    { value: 'meghalaya', label: 'Meghalaya (Jadoh)' },
    { value: 'mizoram', label: 'Mizoram (Bai)' },
    { value: 'nagaland', label: 'Nagaland (Smoked Pork)' },
    { value: 'odisha', label: 'Odisha (Dalma)' },
    { value: 'punjab', label: 'Punjab (Sarson da Saag)' },
    { value: 'rajasthan', label: 'Rajasthan (Dal Baati Churma)' },
    { value: 'sikkim', label: 'Sikkim (Phagshapa)' },
    { value: 'tamil_nadu', label: 'Tamil Nadu (Sambar, Chettinad)' },
    { value: 'telangana', label: 'Telangana (Hyderabadi Biryani)' },
    { value: 'tripura', label: 'Tripura (Mui Borok)' },
    { value: 'uttar_pradesh', label: 'Uttar Pradesh (Kachori Sabzi)' },
    { value: 'uttarakhand', label: 'Uttarakhand (Kafuli)' },
    { value: 'west_bengal', label: 'West Bengal (Shorshe Ilish)' }
  ]

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (Little to no exercise)' },
    { value: 'lightly_active', label: 'Lightly Active (Light exercise 1-3 days/week)' },
    { value: 'moderately_active', label: 'Moderately Active (Moderate exercise 3-5 days/week)' },
    { value: 'very_active', label: 'Very Active (Hard exercise 6-7 days/week)' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Creating profile for user:', userId)
      
      // Create basic profile data (no complex JSON)
      const basicProfileData = {
        user_id: userId,
        full_name: formData.full_name,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        goal: formData.goal,
        activity_level: formData.activity_level,
        sleep_hours: parseInt(formData.sleep_hours),
        water_goal_ltr: parseFloat(formData.water_goal_ltr),
        notes: formData.notes,
        calorie_target: parseInt(formData.calorie_target),
        protein_target: parseInt(formData.protein_target),
        theme: 'light' as const,
        notification_preferences: {
          daily_reminders: true,
          achievement_alerts: true,
          community_updates: false
        }
      }

      console.log('Basic profile data:', basicProfileData)

      // Insert basic profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(basicProfileData)
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw profileError
      }

      console.log('Profile created successfully:', profile)

      // Save preferences separately
      const preferences = {
        dietary_restrictions: formData.dietary_restrictions,
        allergies: formData.allergies,
        health_conditions: formData.health_conditions,
        food_preferences: formData.food_preferences,
        regional_preference: formData.regional_preference
      }

      console.log('Saving preferences:', preferences)
      await saveUserPreferences(userId, preferences)

      console.log('Preferences saved successfully')
      onProfileComplete()
    } catch (error: any) {
      console.error('Error creating profile:', error)
      setError(error.message || 'Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleArrayField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter(item => item !== value)
        : [...(prev[field] as string[]), value]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Complete Your Health Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Help us create your personalized nutrition journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <User className="w-6 h-6 mr-3 text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="Your age"
                    min="1"
                    max="150"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="Height in cm"
                    min="1"
                    max="300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="Weight in kg"
                    min="1"
                    max="500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Health & Allergies */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-red-500" />
                Health & Allergies
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Allergies
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {allergyOptions.map((allergy) => (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => toggleArrayField('allergies', allergy)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          formData.allergies.includes(allergy)
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
                        }`}
                      >
                        {allergy}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Health Conditions
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {healthConditionOptions.map((condition) => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => toggleArrayField('health_conditions', condition)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          formData.health_conditions.includes(condition)
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
                        }`}
                      >
                        {condition}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Utensils className="w-6 h-6 mr-3 text-green-500" />
                Dietary Preferences
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Dietary Restrictions
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {dietaryOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleArrayField('dietary_restrictions', option)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          formData.dietary_restrictions.includes(option)
                            ? 'bg-green-500 text-white shadow-lg'
                            : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Food Preferences
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {foodPreferenceOptions.map((preference) => (
                      <button
                        key={preference}
                        type="button"
                        onClick={() => toggleArrayField('food_preferences', preference)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          formData.food_preferences.includes(preference)
                            ? 'bg-purple-500 text-white shadow-lg'
                            : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
                        }`}
                      >
                        {preference}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Goals & Objectives */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-amber-500" />
                Goals & Objectives
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  What's your primary health and fitness goal?
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goalOptions.map((goal) => {
                    const IconComponent = goal.icon
                    return (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, goal: goal.value as any }))}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                          formData.goal === goal.value
                            ? `bg-gradient-to-r ${goal.color} text-white border-transparent shadow-lg`
                            : 'bg-white/20 border-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center space-y-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            formData.goal === goal.value 
                              ? 'bg-white/20' 
                              : `bg-gradient-to-r ${goal.color}`
                          }`}>
                            <IconComponent className={`w-6 h-6 ${
                              formData.goal === goal.value ? 'text-white' : 'text-white'
                            }`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">{goal.label}</h4>
                            <p className={`text-xs mt-1 ${
                              formData.goal === goal.value 
                                ? 'text-white/80' 
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {goal.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Regional Cuisine */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Globe className="w-6 h-6 mr-3 text-indigo-500" />
                Regional Cuisine Preference
              </h3>
              <select
                value={formData.regional_preference}
                onChange={(e) => setFormData(prev => ({ ...prev, regional_preference: e.target.value }))}
                className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
              >
                <option value="">Select your regional cuisine preference</option>
                {indianStates.map((state) => (
                  <option key={state.value} value={state.value}>{state.label}</option>
                ))}
              </select>
            </div>

            {/* Lifestyle & Activity */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-cyan-500" />
                Lifestyle & Activity
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Activity Level
                  </label>
                  <select
                    value={formData.activity_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, activity_level: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                  >
                    {activityLevels.map((level) => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Moon className="w-4 h-4 mr-1" />
                    Sleep Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={formData.sleep_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, sleep_hours: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="8"
                    min="1"
                    max="24"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Droplets className="w-4 h-4 mr-1" />
                    Water Goal (liters/day)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.water_goal_ltr}
                    onChange={(e) => setFormData(prev => ({ ...prev, water_goal_ltr: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="2.5"
                    min="0.5"
                    max="10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Nutrition Targets */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calculator className="w-6 h-6 mr-3 text-emerald-500" />
                Daily Nutrition Targets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Calorie Target
                  </label>
                  <input
                    type="number"
                    value={formData.calorie_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, calorie_target: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="e.g., 2000"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Coffee className="w-4 h-4 mr-1" />
                    Protein Target (g)
                  </label>
                  <input
                    type="number"
                    value={formData.protein_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, protein_target: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="e.g., 150"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-pink-500" />
                Additional Notes
              </h3>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full h-32 px-4 py-3 bg-white/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-800/50 dark:border-gray-600 dark:text-white transition-all duration-200 resize-none"
                placeholder="Share any specific health concerns, dietary needs, or goals you'd like us to consider..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start shadow-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 text-white py-4 rounded-2xl font-semibold hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Setting up your profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Complete Setup & Start Your Journey
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}