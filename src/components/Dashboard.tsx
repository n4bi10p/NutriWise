import { useState, useEffect } from 'react'
import { supabase, Profile, updateLastLogin } from '../lib/supabase'
import { 
  MessageCircle, Menu, Calendar, ShoppingCart, TrendingUp, Moon, Sun, LogOut, 
  Settings as SettingsIcon, Trophy, Users, Bell
} from 'lucide-react'
import { ChatAssistant } from './ChatAssistant'
import { MenuAnalyzer } from './MenuAnalyzer'
import { MealPlanner } from './MealPlanner'
import { GroceryList } from './GroceryList'
import { ProgressTracker } from './ProgressTracker'
import { Settings } from './Settings'
import { Achievements } from './Achievements'
import { CommunityRecipes } from './CommunityRecipes'
import { NotificationCenter } from './NotificationCenter'

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
  const [showNotifications, setShowNotifications] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    // Apply theme to document immediately
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('nutriai-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('nutriai-theme', 'light')
    }
    
    // Update last login on dashboard load (fire and forget)
    updateLastLogin(user.id).catch(console.error)
  }, [theme, user.id])

  const toggleTheme = async () => {
    if (updating) return // Prevent multiple simultaneous updates
    
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setUpdating(true)
    
    // Update UI immediately for smooth transition
    setTheme(newTheme)
    
    try {
      // Update theme in database
      const { error } = await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('user_id', user.id)

      if (error) {
        console.error('Theme update error:', error)
        // Revert theme on error
        setTheme(theme)
        // Show error message (you could add a toast notification here)
      } else {
        // Update local profile state
        setProfile(prev => ({ ...prev, theme: newTheme }))
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      // Revert theme on error
      setTheme(theme)
    } finally {
      setUpdating(false)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-emerald-50/80 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-emerald-100/20 dark:from-gray-800/20 dark:to-gray-900/20"></div>
      
      {/* Header */}
      <div className="bg-white/20 dark:bg-white/10 backdrop-blur-xl border-b border-white/30 dark:border-white/20 sticky top-0 z-40 shadow-lg shadow-blue-500/5">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full">
            {/* Left Section - Logo and Brand */}
            <div className="flex items-center flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-blue-500/25">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">NutriAI</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Welcome back, {profile.full_name}!</p>
              </div>
            </div>

            {/* Center Section - User Stats */}
            <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center space-x-4 bg-white/20 dark:bg-white/5 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-xl px-4 py-2 shadow-lg shadow-blue-500/5">
                <div className="text-center">
                  <div className="text-base font-bold text-gray-800 dark:text-white">{profile.points}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">Points</div>
                </div>
                <div className="w-px h-6 bg-white/30 dark:bg-white/20"></div>
                <div className="text-center">
                  <div className="text-base font-bold text-gray-800 dark:text-white">{profile.streak_days}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">Streak</div>
                </div>
                <div className="w-px h-6 bg-white/30 dark:bg-white/20"></div>
                <div className="text-center">
                  <div className="text-base font-bold text-gray-800 dark:text-white">Lv.{profile.level}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide">Level</div>
                </div>
              </div>
            </div>
            
            {/* Right Section - Action Buttons */}
            <div className="flex items-center justify-end flex-shrink-0">
              {/* Mobile Stats (shown on smaller screens) */}
              <div className="lg:hidden flex items-center space-x-1.5 mr-3">
                <div className="text-center bg-white/20 dark:bg-white/5 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-lg px-2 py-1 shadow-md">
                  <div className="text-sm font-bold text-gray-800 dark:text-white">{profile.points}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Points</div>
                </div>
                <div className="text-center bg-white/20 dark:bg-white/5 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-lg px-2 py-1 shadow-md">
                  <div className="text-sm font-bold text-gray-800 dark:text-white">{profile.streak_days}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Streak</div>
                </div>
                <div className="text-center bg-white/20 dark:bg-white/5 backdrop-blur-lg border border-white/30 dark:border-white/10 rounded-lg px-2 py-1 shadow-md">
                  <div className="text-sm font-bold text-gray-800 dark:text-white">Lv.{profile.level}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Level</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1 bg-white/25 dark:bg-white/10 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-2xl p-1 shadow-xl">
                <button 
                  onClick={() => setShowNotifications(true)}
                  className="p-3 hover:bg-white/40 dark:hover:bg-white/20 rounded-xl transition-all duration-300 relative group"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></span>
                </button>
                
                <button
                  onClick={toggleTheme}
                  disabled={updating}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                    {theme === 'light' ? (
                      <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-500 dark:text-yellow-400 transition-colors duration-300" />
                    )}
                  </div>
                  {updating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-3 hover:bg-white/40 dark:hover:bg-white/20 rounded-xl transition-all duration-300 group"
                  title="Settings"
                >
                  <SettingsIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                </button>
                
                <button
                  onClick={onSignOut}
                  className="p-3 hover:bg-red-500/20 rounded-xl transition-all duration-300 group"
                  title="Sign out"
                >
                  <LogOut className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Sidebar */}
        <div className="w-64 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-r border-white/30 dark:border-white/10 min-h-screen p-4 shadow-2xl shadow-blue-500/5">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-xl shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:scale-[1.01] hover:shadow-lg'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${
                    activeTab === tab.id ? '' : 'group-hover:scale-110'
                  }`} />
                  <span className="font-medium">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50 rounded-xl"></div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Profile Stats */}
          <div className="mt-8 bg-white/30 dark:bg-white/5 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Your Goals</h3>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Goals</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Calories</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.calorie_target}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Protein</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.protein_target}g</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Water</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.water_goal_ltr}L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Goal</span>
                <span className="font-semibold text-gray-800 dark:text-white capitalize">
                  {profile.goal.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 bg-white/30 dark:bg-white/5 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-2xl p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Level</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.level}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Points</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.points}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Streak</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.streak_days} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 flex flex-col min-h-0">
          {/* Content Background with better spacing */}
          <div className="flex-1 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl shadow-blue-500/5 p-4 flex flex-col min-h-0">
            {renderActiveTab()}
          </div>
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

      {/* Notification Center */}
      {showNotifications && (
        <NotificationCenter
          profile={profile}
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}