import React, { useState, useEffect } from 'react'
import { supabase, saveUserPreferences, uploadProfilePhoto } from '../lib/supabase'
import DatabaseSetup from './DatabaseSetup'
import { StorageSetupModal } from './StorageSetupModal'
import { 
  User, Target, Utensils, Globe, Calculator, AlertCircle, 
  Heart, Activity, Moon, Droplets, FileText, Shield,
  Zap, Coffee, Sparkles, TrendingUp, TrendingDown, 
  Minus, Dumbbell, Scale, Camera
} from 'lucide-react'

interface ProfileSetupProps {
  userId: string
  onProfileComplete: () => void
  error?: string
}

export function ProfileSetup({ userId, onProfileComplete, error: propError }: ProfileSetupProps) {
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    profile_photo_url: '',
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showStorageSetup, setShowStorageSetup] = useState(false)

  // Check if we need to show database setup modal
  useEffect(() => {
    if (propError && propError.includes('Database setup required')) {
      setShowDatabaseSetup(true)
    }
  }, [propError])

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

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setUploadingPhoto(true)
    setError('')

    try {
      // Upload photo to storage
      const photoUrl = await uploadProfilePhoto(userId, file)
      
      // Update form data with photo URL
      setFormData(prev => ({ ...prev, profile_photo_url: photoUrl }))
    } catch (error: any) {
      console.error('Photo upload error:', error)
      if (error.message?.includes('Storage bucket not configured') || 
          error.message?.includes('Bucket not found') ||
          error.message?.includes('Database setup required')) {
        setShowStorageSetup(true)
      } else {
        setError(error.message || 'Failed to upload photo')
      }
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Creating profile for user:', userId)
      
      // Map new goal values to supported database values temporarily
      const goalMapping: Record<string, string> = {
        'weight_loss': 'weight_loss',
        'muscle_gain': 'muscle_gain', 
        'maintenance': 'maintenance',
        'fat_loss_muscle_gain': 'maintenance', // Temporary mapping
        'athletic_performance': 'muscle_gain', // Temporary mapping
        'general_health': 'maintenance' // Temporary mapping
      }
      
      const mappedGoal = goalMapping[formData.goal] || 'maintenance'
      
      // Create basic profile data (no complex JSON)
      const basicProfileData = {
        user_id: userId,
        full_name: formData.full_name,
        profile_photo_url: formData.profile_photo_url || null,
        age: parseInt(formData.age),
        gender: formData.gender,
        height: parseInt(formData.height),
        weight: parseInt(formData.weight),
        goal: mappedGoal, // Use mapped goal value
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

      // Try to insert basic profile first, if it fails due to duplicate, update instead
      let profile
      const { data: insertedProfile, error: profileError } = await supabase
        .from('profiles')
        .insert(basicProfileData)
        .select()
        .single()

      if (profileError) {
        if (profileError.code === '23505') {
          // Profile already exists, update it instead
          console.log('Profile already exists, updating...')
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update(basicProfileData)
            .eq('user_id', userId)
            .select()
            .single()
          
          if (updateError) {
            console.error('Profile update error:', updateError)
            throw updateError
          }
          profile = updatedProfile
        } else {
          console.error('Profile creation error:', profileError)
          throw profileError
        }
      } else {
        profile = insertedProfile
      }

      console.log('Profile created successfully:', profile)

      // Save preferences separately (including original goal)
      const preferences = {
        dietary_restrictions: formData.dietary_restrictions,
        allergies: formData.allergies,
        health_conditions: formData.health_conditions,
        food_preferences: formData.food_preferences,
        regional_preference: formData.regional_preference
      }
      
      console.log('Saving preferences:', preferences)
      await saveUserPreferences(userId, preferences)
      
      // Save original goal as a separate preference entry if it was mapped
      if (formData.goal !== mappedGoal) {
        console.log('Saving original goal as preference:', formData.goal)
        try {
          // Insert the original goal directly into user_preferences table
          const { error: goalError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: userId,
              preference_type: 'original_goal',
              preference_value: formData.goal
            })
          
          if (goalError) {
            console.warn('Could not save original goal preference:', goalError)
          }
        } catch (goalErr) {
          console.warn('user_preferences table may not exist yet:', goalErr)
        }
      }

      console.log('Preferences saved successfully')
      onProfileComplete()
    } catch (error: any) {
      console.error('Error creating profile:', error)
      
      // Handle different types of errors
      let errorMessage = 'Failed to create profile. Please try again.'
      
      if (error?.code === '42P01') {
        // Table doesn't exist
        setShowDatabaseSetup(true)
        errorMessage = 'Database tables are not set up properly. Please follow the setup instructions.'
      } else if (error?.code === '23514') {
        // Check constraint violation
        if (error?.message?.includes('goal')) {
          errorMessage = 'Invalid goal selected. Please contact support to update the database constraints.'
        } else if (error?.message?.includes('age')) {
          errorMessage = 'Please enter a valid age between 1 and 149.'
        } else if (error?.message?.includes('height')) {
          errorMessage = 'Please enter a valid height between 1 and 299 cm.'
        } else if (error?.message?.includes('weight')) {
          errorMessage = 'Please enter a valid weight between 1 and 499 kg.'
        } else {
          errorMessage = 'Invalid data provided. Please check your inputs and try again.'
        }
      } else if (error?.code === '23505') {
        // Unique constraint violation - this shouldn't happen now since we handle it
        errorMessage = 'Profile updated successfully, but there was an issue with preferences. Please try again.'
      } else if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.details) {
        errorMessage = error.details
      }
      
      setError(errorMessage)
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
              
              {/* Profile Photo Section */}
              <div className="mb-8 p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <Camera className="w-5 h-5 mr-2 text-blue-500" />
                  Profile Photo (Optional)
                </h4>
                <div className="flex items-center space-x-6">
                  {/* Preview */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg">
                    {formData.profile_photo_url ? (
                      <img 
                        src={formData.profile_photo_url} 
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Profile photo failed to load in setup:', formData.profile_photo_url)
                          // Hide the broken image and show fallback
                          e.currentTarget.style.display = 'none'
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center ${
                        formData.profile_photo_url ? 'hidden' : ''
                      }`}
                    >
                      <span className="text-white font-bold text-2xl">
                        {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Upload Button */}
                  <div>
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50">
                      {uploadingPhoto ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {formData.profile_photo_url ? 'Change Photo' : 'Add Photo'}
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>
              
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
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="text-red-600 mb-3">{error}</p>
                    {error.includes('Database setup required') && (
                      <button
                        type="button"
                        onClick={() => setShowDatabaseSetup(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Show Setup Instructions
                      </button>
                    )}
                  </div>
                </div>
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
      
      {showDatabaseSetup && (
        <DatabaseSetup onClose={() => setShowDatabaseSetup(false)} />
      )}
      
      {/* Storage Setup Modal */}
      <StorageSetupModal 
        isOpen={showStorageSetup} 
        onClose={() => setShowStorageSetup(false)} 
      />
    </div>
  )
}