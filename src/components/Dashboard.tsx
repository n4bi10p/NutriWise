import React, { useState, useEffect } from 'react'
import { supabase, Profile, updateLastLogin } from '../lib/supabase'
import { 
  MessageCircle, Menu, Calendar, ShoppingCart, TrendingUp, Moon, Sun, LogOut, 
  Settings as SettingsIcon, Trophy, Users, Bell, User
} from 'lucide-react'
import { ChatAssistant } from './ChatAssistant'
import { MenuAnalyzer } from './MenuAnalyzer'
import { MealPlanner } from './MealPlanner'
import { GroceryList } from './GroceryList'
import { ProgressTracker } from './ProgressTracker'
import { Settings } from './Settings'
import { Achievements } from './Achievements'
import { CommunityRecipes } from './CommunityRecipes'

interface DashboardProps {
  user: any
  profile: Profile
  onSignOut: () => void
}

export function Dashboard({ user, profile: initialProfile, onSignOut }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('chat')
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [theme, setTheme] = useState<'light' | 'dark'>(initialProfile.theme)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    
    // Update last login on dashboard load
    updateLastLogin(user.id).catch(console.error)
  }, [theme, user.id])

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error updating theme:', error)
    }
  }

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile)
    setTheme(updatedProfile.theme)
  }

  const tabs = [
    { id: 'chat', icon: MessageCircle, label: 'AI Assistant' },
    { id: 'menu', icon: Menu, label: 'Menu Analyzer' },
    { id: 'planner', icon: Calendar, label: 'Meal Planner' },
    { id: 'grocery', icon: ShoppingCart, label: 'Grocery List' },
    { id: 'progress', icon: TrendingUp, label: 'Progress' },
    { id: 'achievements', icon: Trophy, label: 'Achievements' },
    { id: 'community', icon: Users, label: 'Community' },
  ]

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatAssistant profile={profile} />
      case 'menu':
        return <MenuAnalyzer profile={profile} />
      case 'planner':
        return <MealPlanner profile={profile} />
      case 'grocery':
        return <GroceryList profile={profile} />
      case 'progress':
        return <ProgressTracker profile={profile} />
      case 'achievements':
        return <Achievements profile={profile} />
      case 'community':
        return <CommunityRecipes profile={profile} />
      default:
        return <ChatAssistant profile={profile} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">NutriAI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Welcome back, {profile.full_name}!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Stats */}
              <div className="hidden md:flex items-center space-x-4 mr-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{profile.points}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{profile.streak_days}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Lv.{profile.level}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Level</div>
                </div>
              </div>

              <button className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors duration-200 relative">
                <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors duration-200"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors duration-200"
              >
                <SettingsIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <button
                onClick={onSignOut}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors duration-200"
              >
                <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 min-h-screen p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              )
            })}
          </nav>

          {/* Profile Stats */}
          <div className="mt-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Goals</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Calories</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.calorie_target}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Protein</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.protein_target}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Water</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.water_goal_ltr}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Goal</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {profile.goal.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Level</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Points</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.points}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Streak</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.streak_days} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderActiveTab()}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          user={user}
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}