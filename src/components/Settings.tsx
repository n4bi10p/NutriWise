import React, { useState, useEffect } from 'react'
import { supabase, Profile } from '../lib/supabase'
import { 
  Settings as SettingsIcon, User, Bell, Shield, Palette, 
  Save, Moon, Sun, Check, X, AlertCircle 
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">Manage your account and preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {message && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-2" />
                <p className="text-green-600">{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Goal
                      </label>
                      <select
                        value={profileData.goal}
                        onChange={(e) => setProfileData(prev => ({ ...prev, goal: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                      >
                        {goalOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Calorie Target
                      </label>
                      <input
                        type="number"
                        value={profileData.calorie_target}
                        onChange={(e) => setProfileData(prev => ({ ...prev, calorie_target: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Protein Target (g)
                      </label>
                      <input
                        type="number"
                        value={profileData.protein_target}
                        onChange={(e) => setProfileData(prev => ({ ...prev, protein_target: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Water Goal (L)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={profileData.water_goal_ltr}
                        onChange={(e) => setProfileData(prev => ({ ...prev, water_goal_ltr: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Sleep Hours
                      </label>
                      <input
                        type="number"
                        value={profileData.sleep_hours}
                        onChange={(e) => setProfileData(prev => ({ ...prev, sleep_hours: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Activity Level
                      </label>
                      <select
                        value={profileData.activity_level}
                        onChange={(e) => setProfileData(prev => ({ ...prev, activity_level: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
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
                    className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Daily Reminders</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Get reminded to log your meals and track progress</p>
                      </div>
                      <button
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, daily_reminders: !prev.daily_reminders }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationPrefs.daily_reminders ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationPrefs.daily_reminders ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Achievement Alerts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Get notified when you earn new achievements</p>
                      </div>
                      <button
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, achievement_alerts: !prev.achievement_alerts }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationPrefs.achievement_alerts ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationPrefs.achievement_alerts ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Community Updates</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Get updates about new recipes and community activity</p>
                      </div>
                      <button
                        onClick={() => setNotificationPrefs(prev => ({ ...prev, community_updates: !prev.community_updates }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          notificationPrefs.community_updates ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                            notificationPrefs.community_updates ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={loading}
                    className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
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
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                            theme === 'light'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <Sun className="w-8 h-8 text-yellow-500" />
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">Light</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Clean and bright interface</p>
                        </button>

                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                            theme === 'dark'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-2">
                            <Moon className="w-8 h-8 text-blue-400" />
                          </div>
                          <p className="font-medium text-gray-900 dark:text-white">Dark</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Easy on the eyes</p>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveTheme}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
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
    </div>
  )
}