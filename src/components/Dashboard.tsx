import { useState, useEffect } from 'react'
import { supabase, Profile, updateLastLogin } from '../lib/supabase'
import { 
  MessageCircle, Menu, Calendar, ShoppingCart, TrendingUp, Moon, Sun, LogOut, 
  Settings as SettingsIcon, Trophy, Users, Bell, X
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
import { BoltBadge } from './BoltBadge'

interface DashboardProps {
  user: any
  profile: Profile
  onSignOut: () => void
  onProfileUpdate?: (profile: Profile) => void
}

export function Dashboard({ user, profile: initialProfile, onSignOut, onProfileUpdate }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('chat')
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [theme, setTheme] = useState<'light' | 'dark'>(initialProfile.theme)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Apply theme to document immediately
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
      localStorage.setItem('nutriwise-theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('nutriwise-theme', 'light')
    }
    
    // Update last login on dashboard load (fire and forget)
    updateLastLogin(user.id).catch(console.error)
  }, [theme, user.id])

  // Sync local profile state when parent profile changes
  useEffect(() => {
    console.log('Dashboard receiving profile update:', {
      profile_photo_url: initialProfile.profile_photo_url,
      full_name: initialProfile.full_name
    })
    setProfile(initialProfile)
    setTheme(initialProfile.theme)
  }, [initialProfile])

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
    // Propagate the update to the App component
    if (onProfileUpdate) {
      onProfileUpdate(updatedProfile)
    }
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
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16 w-full gap-2 sm:gap-4">
            {/* Left Section - Logo, Brand, and Mobile Menu */}
            <div className="flex items-center flex-shrink-0 min-w-0 max-w-[50%] sm:max-w-none">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-1.5 sm:p-2 lg:p-2.5 rounded-xl bg-white/20 hover:bg-white/30 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-300 mr-2 sm:mr-3 shadow-lg flex-shrink-0"
                aria-label="Toggle menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Profile Photo */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl mr-2 sm:mr-3 shadow-lg shadow-blue-500/25 overflow-hidden relative flex-shrink-0">
                {profile.profile_photo_url ? (
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Profile photo failed to load:', profile.profile_photo_url)
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
                  <span className="text-white font-bold text-sm sm:text-lg">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-shrink">
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 dark:text-white truncate">NutriWise</h1>
                  <BoltBadge variant="white" size="small" className="flex-shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate hidden sm:block">
                  Welcome back, {profile.full_name.split(' ')[0]}!
                </p>
              </div>
            </div>

            {/* Center Section - Desktop User Stats */}
            <div className="hidden xl:flex items-center justify-center flex-1 mx-4">
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
            <div className="flex items-center justify-end flex-shrink-0 min-w-0">
              {/* Action Buttons */}
              <div className="flex items-center space-x-0.5 sm:space-x-1 bg-white/25 dark:bg-white/10 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-lg sm:rounded-xl p-0.5 sm:p-1 shadow-xl flex-shrink-0">
                <button 
                  onClick={() => setShowNotifications(true)}
                  className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-white/40 dark:hover:bg-white/20 rounded-lg transition-all duration-300 relative group flex-shrink-0"
                  title="Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-lg"></span>
                </button>
                
                <button
                  onClick={toggleTheme}
                  disabled={updating}
                  className="p-1.5 sm:p-2 lg:p-2.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-300 disabled:opacity-50 relative overflow-hidden group flex-shrink-0"
                  title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                  <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                    {theme === 'light' ? (
                      <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-700 dark:text-gray-300 transition-colors duration-300" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-500 dark:text-yellow-400 transition-colors duration-300" />
                    )}
                  </div>
                  {updating && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60"></div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-white/40 dark:hover:bg-white/20 rounded-lg transition-all duration-300 group flex-shrink-0"
                  title="Settings"
                >
                  <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                </button>
                
                <button
                  onClick={onSignOut}
                  className="p-1.5 sm:p-2 lg:p-2.5 hover:bg-red-500/20 rounded-lg transition-all duration-300 group flex-shrink-0"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-700 dark:text-gray-300 group-hover:text-red-500 group-hover:scale-110 transition-all duration-300" />
                </button>
                
                {/* Bolt.new Badge - Top Right as per DevPost guidelines */}
                <div className="hidden sm:block ml-2 flex-shrink-0">
                  <BoltBadge variant="white" size="medium" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static top-0 left-0 z-50 lg:z-auto
          w-72 sm:w-80 lg:w-64 xl:w-72
          bg-white/20 dark:bg-white/5 backdrop-blur-xl 
          border-r border-white/30 dark:border-white/10 
          min-h-screen p-3 sm:p-4 
          shadow-2xl shadow-blue-500/5
          transition-transform duration-300 ease-in-out
          lg:transition-none
          mt-16 lg:mt-0
        `}>
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end mb-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false) // Close mobile sidebar when tab is selected
                  }}
                  className={`w-full flex items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 group relative overflow-hidden text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-xl shadow-blue-500/25 transform scale-[1.02]'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-white/10 hover:scale-[1.01] hover:shadow-lg'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 transition-transform duration-300 ${
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
          <div className="mt-6 sm:mt-8 bg-white/30 dark:bg-white/5 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 uppercase tracking-wide">Your Goals</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Calories</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.calorie_target}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Protein</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.protein_target}g</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Water</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.water_goal_ltr}L</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Goal</span>
                <span className="font-semibold text-gray-800 dark:text-white capitalize">
                  {profile.goal.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats - Desktop Only */}
          <div className="hidden lg:block mt-3 sm:mt-4 bg-white/30 dark:bg-white/5 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 uppercase tracking-wide">Quick Stats</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Level</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.level}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Points</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.points}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600 dark:text-gray-400">Streak</span>
                <span className="font-semibold text-gray-800 dark:text-white">{profile.streak_days} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-6 lg:p-8 flex flex-col min-h-0">
          {/* Content Background with better spacing */}
          <div className="flex-1 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-white/20 dark:border-white/10 shadow-2xl shadow-blue-500/5 p-3 sm:p-4 lg:p-4 flex flex-col min-h-0">
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