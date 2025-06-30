import React, { useState } from 'react'
import { supabase, Profile, uploadProfilePhoto, updateProfilePhoto } from '../lib/supabase'
import { StorageSetupModal } from './StorageSetupModal'
import { 
  Settings as SettingsIcon, User, Bell, Shield, Palette, 
  Save, Moon, Sun, Check, X, AlertCircle, Camera 
} from 'lucide-react'

interface SettingsProps {
  user: any
  profile: Profile
  onProfileUpdate: (profile: Profile) => void
  onClose: () => void
}

export function Settings({ user, profile, onProfileUpdate, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance'>('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [profileData, setProfileData] = useState({
    full_name: profile.full_name,
    calorie_target: profile.calorie_target,
    protein_target: profile.protein_target,
    water_goal_ltr: profile.water_goal_ltr,
    sleep_hours: profile.sleep_hours,
    activity_level: profile.activity_level,
    goal: profile.goal
  })

  const [notificationPrefs, setNotificationPrefs] = useState(profile.notification_preferences)
  const [theme, setTheme] = useState<'light' | 'dark'>(profile.theme)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showStorageSetup, setShowStorageSetup] = useState(false)

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
    setMessage('')

    try {
      // Upload photo to storage
      const photoUrl = await uploadProfilePhoto(user.id, file)
      console.log('Uploaded photo URL:', photoUrl)
      
      // Update profile with new photo URL
      await updateProfilePhoto(user.id, photoUrl)
      console.log('Updated profile with photo URL')

      // Create updated profile object
      const updatedProfile = { ...profile, profile_photo_url: photoUrl }
      console.log('Settings: Created updated profile object:', {
        old_photo_url: profile.profile_photo_url,
        new_photo_url: photoUrl,
        updated_profile_photo_url: updatedProfile.profile_photo_url
      })
      
      // Update local state immediately
      onProfileUpdate(updatedProfile)
      
      // Fetch updated profile to ensure database sync (don't wait for this)
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
        .then(({ data: freshProfile, error: fetchError }) => {
          if (fetchError) {
            console.error('Error fetching updated profile:', fetchError)
          } else if (freshProfile) {
            // Only update if the fresh data is different
            if (freshProfile.profile_photo_url !== updatedProfile.profile_photo_url) {
              onProfileUpdate(freshProfile)
            }
          }
        })
      
      setMessage('Profile photo updated successfully!')
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

  const handleSaveProfile = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Use simple update without complex selects
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Fetch updated profile separately with minimal columns
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id,user_id,full_name,age,gender,height,weight,goal,preferences,allergies,health_conditions,food_preferences,activity_level,sleep_hours,water_goal_ltr,notes,calorie_target,protein_target,theme,points,level,streak_days,last_login,notification_preferences,created_at')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      onProfileUpdate(data)
      setMessage('Profile updated successfully!')
    } catch (error: any) {
      console.error('Profile update error:', error)
      setError(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Use simple update
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ notification_preferences: notificationPrefs })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Update local profile
      const updatedProfile = { ...profile, notification_preferences: notificationPrefs }
      onProfileUpdate(updatedProfile)
      setMessage('Notification preferences updated!')
    } catch (error: any) {
      console.error('Notification update error:', error)
      setError(error.message || 'Failed to update notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTheme = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Use simple update
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ theme })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Update local profile and DOM
      const updatedProfile = { ...profile, theme }
      onProfileUpdate(updatedProfile)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      setMessage('Theme updated successfully!')
    } catch (error: any) {
      console.error('Theme update error:', error)
      setError(error.message || 'Failed to update theme')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ]

  const goalOptions = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'fat_loss_muscle_gain', label: 'Body Recomposition' },
    { value: 'athletic_performance', label: 'Athletic Performance' },
    { value: 'general_health', label: 'General Health' }
  ]

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'lightly_active', label: 'Lightly Active' },
    { value: 'moderately_active', label: 'Moderately Active' },
    { value: 'very_active', label: 'Very Active' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-xl sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
              <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Settings</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Manage your account and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl transition-colors duration-200 flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Mobile Tab Navigation */}
          <div className="sm:hidden border-b border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-shrink-0 flex items-center px-4 py-3 transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden sm:block sm:w-48 lg:w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 p-3 sm:p-4 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {message && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 flex items-center">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 flex-shrink-0" />
                <p className="text-green-600 text-sm sm:text-base">{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-3 flex items-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-red-600 text-sm sm:text-base">{error}</p>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Profile Information</h3>
                  
                  {/* Profile Photo Section */}
                  <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">Profile Photo</h4>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Current Photo */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden shadow-lg relative flex-shrink-0">
                        {profile.profile_photo_url ? (
                          <img 
                            src={profile.profile_photo_url} 
                            alt={profile.full_name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Profile photo failed to load in settings:', profile.profile_photo_url)
                              // Hide the broken image and show fallback
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement
                              const fallback = parent?.querySelector('.fallback-avatar') as HTMLElement
                              if (fallback) {
                                fallback.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`fallback-avatar absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center ${
                            profile.profile_photo_url ? 'hidden' : 'flex'
                          }`}
                        >
                          <span className="text-white font-bold text-lg sm:text-2xl">
                            {profile.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Upload Button */}
                      <div className="flex flex-col items-center sm:items-start">
                        <label className="cursor-pointer inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base">
                          {uploadingPhoto ? (
                            <>
                              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              <span className="hidden sm:inline">Change Photo</span>
                              <span className="sm:hidden">Change</span>
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
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center sm:text-left">
                          JPG, PNG or GIF. Max 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Goal
                      </label>
                      <select
                        value={profileData.goal}
                        onChange={(e) => setProfileData(prev => ({ ...prev, goal: e.target.value as any }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      >
                        {goalOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Calorie Target
                      </label>
                      <input
                        type="number"
                        value={profileData.calorie_target}
                        onChange={(e) => setProfileData(prev => ({ ...prev, calorie_target: parseInt(e.target.value) }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Protein Target (g)
                      </label>
                      <input
                        type="number"
                        value={profileData.protein_target}
                        onChange={(e) => setProfileData(prev => ({ ...prev, protein_target: parseInt(e.target.value) }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Water Goal (L)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={profileData.water_goal_ltr}
                        onChange={(e) => setProfileData(prev => ({ ...prev, water_goal_ltr: parseFloat(e.target.value) }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sleep Hours
                      </label>
                      <input
                        type="number"
                        value={profileData.sleep_hours}
                        onChange={(e) => setProfileData(prev => ({ ...prev, sleep_hours: parseInt(e.target.value) }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Activity Level
                      </label>
                      <select
                        value={profileData.activity_level}
                        onChange={(e) => setProfileData(prev => ({ ...prev, activity_level: e.target.value as any }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 border border-white/10 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-sm sm:text-base"
                      >
                        {activityLevels.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="mt-4 sm:mt-6 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-sm sm:text-base"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="settings-card flex items-center justify-between p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all duration-200">
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Daily Reminders</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">Get reminded to log your meals and track progress</p>
                      </div>
                      <button
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, daily_reminders: !prev.daily_reminders }))}
                        className={`switch-toggle relative inline-flex h-6 w-11 sm:h-7 sm:w-12 items-center rounded-full transition-all duration-300 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          notificationPrefs.daily_reminders 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                        role="switch"
                        aria-checked={notificationPrefs.daily_reminders}
                        aria-label="Toggle daily reminders"
                      >
                        <span
                          className={`switch-handle inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-md ${
                            notificationPrefs.daily_reminders ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="settings-card flex items-center justify-between p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all duration-200">
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Achievement Alerts</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">Get notified when you earn new achievements</p>
                      </div>
                      <button
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, achievement_alerts: !prev.achievement_alerts }))}
                        className={`switch-toggle relative inline-flex h-6 w-11 sm:h-7 sm:w-12 items-center rounded-full transition-all duration-300 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          notificationPrefs.achievement_alerts 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/25' 
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                        role="switch"
                        aria-checked={notificationPrefs.achievement_alerts}
                        aria-label="Toggle achievement alerts"
                      >
                        <span
                          className={`switch-handle inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-md ${
                            notificationPrefs.achievement_alerts ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="settings-card flex items-center justify-between p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-xl hover:bg-white/10 transition-all duration-200">
                      <div className="min-w-0 flex-1 pr-3">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Community Updates</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">Get updates about new recipes and community activity</p>
                      </div>
                      <button
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, community_updates: !prev.community_updates }))}
                        className={`switch-toggle relative inline-flex h-6 w-11 sm:h-7 sm:w-12 items-center rounded-full transition-all duration-300 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent ${
                          notificationPrefs.community_updates 
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg shadow-purple-500/25' 
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                        role="switch"
                        aria-checked={notificationPrefs.community_updates}
                        aria-label="Toggle community updates"
                      >
                        <span
                          className={`switch-handle inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-md ${
                            notificationPrefs.community_updates ? 'translate-x-6 sm:translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={loading}
                    className="mt-6 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Export</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Download all your data in JSON format</p>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        Export Data
                      </button>
                    </div>

                    <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Deletion</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Permanently delete your account and all associated data</p>
                      <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Theme</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          onClick={() => setTheme('light')}
                          className={`theme-card p-4 border-2 rounded-xl transition-all duration-200 group ${
                            theme === 'light'
                              ? 'selected border-blue-500 bg-white shadow-lg shadow-blue-500/20' 
                              : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                          } ${theme === 'light' ? 'theme-light-preview' : ''}`}
                        >
                          <div className="flex items-center justify-center mb-3">
                            <Sun className={`w-8 h-8 transition-colors duration-200 ${
                              theme === 'light' ? 'text-yellow-500' : 'text-yellow-400'
                            }`} />
                          </div>
                          <p className={`font-semibold text-base mb-1 transition-colors duration-200 ${
                            theme === 'light' 
                              ? 'theme-text-primary' 
                              : 'text-gray-900 dark:text-white'
                          }`}>Light</p>
                          <p className={`text-sm transition-colors duration-200 ${
                            theme === 'light' 
                              ? 'theme-text-secondary' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>Clean and bright interface</p>
                        </button>

                        <button
                          onClick={() => setTheme('dark')}
                          className={`theme-card p-4 border-2 rounded-xl transition-all duration-200 group ${
                            theme === 'dark'
                              ? 'selected border-blue-500 bg-gray-800 shadow-lg shadow-blue-500/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                          } ${theme === 'dark' ? 'theme-dark-preview' : ''}`}
                        >
                          <div className="flex items-center justify-center mb-3">
                            <Moon className={`w-8 h-8 transition-colors duration-200 ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-400'
                            }`} />
                          </div>
                          <p className={`font-semibold text-base mb-1 transition-colors duration-200 ${
                            theme === 'dark' 
                              ? 'theme-text-primary' 
                              : 'text-gray-900 dark:text-white'
                          }`}>Dark</p>
                          <p className={`text-sm transition-colors duration-200 ${
                            theme === 'dark' 
                              ? 'theme-text-secondary' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>Easy on the eyes</p>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveTheme}
                      disabled={loading}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Theme'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Storage Setup Modal */}
      <StorageSetupModal 
        isOpen={showStorageSetup} 
        onClose={() => setShowStorageSetup(false)} 
      />
    </div>
  )
}