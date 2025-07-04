import { useState, useEffect } from 'react'
import { Profile, getUserAchievements, getAvailableAchievements, UserAchievement, Achievement } from '../lib/supabase'
import { Award, Star, Trophy, Target, Users, Calendar, Zap, Lock } from 'lucide-react'

interface AchievementsProps {
  profile: Profile
}

export function Achievements({ profile }: AchievementsProps) {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [availableAchievements, setAvailableAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'earned' | 'available'>('earned')

  useEffect(() => {
    loadAchievements()
  }, [profile.user_id])

  const loadAchievements = async () => {
    try {
      setError(null)
      const [earned, available] = await Promise.all([
        getUserAchievements(profile.user_id),
        getAvailableAchievements()
      ])
      
      console.log('Loaded achievements:', { earned, available })
      setUserAchievements(earned)
      setAvailableAchievements(available)
      
      // If no achievements are available, it might be a database issue
      if (!available || available.length === 0) {
        setError('Achievements data not found. Please ensure the database migration has been applied.')
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
      setError('Failed to load achievements. This might be due to missing database tables or RLS policies.')
      // If achievements table doesn't exist, create empty arrays to prevent errors
      setUserAchievements([])
      setAvailableAchievements([])
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'Footprints': Target,
      'Calendar': Calendar,
      'Droplets': Zap,
      'Zap': Zap,
      'Users': Users,
      'ChefHat': Trophy,
      'Star': Star,
      'Target': Target,
      'Award': Award,
      'Sunrise': Star
    }
    return icons[iconName] || Award
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'nutrition': return 'from-green-500 to-emerald-500'
      case 'consistency': return 'from-blue-500 to-indigo-500'
      case 'community': return 'from-purple-500 to-pink-500'
      case 'milestone': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id))
  const unlockedAchievements = availableAchievements.filter(a => earnedAchievementIds.has(a.id))
  const lockedAchievements = availableAchievements.filter(a => !earnedAchievementIds.has(a.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 animate-fade-in">Loading achievements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Achievements</h2>
            <p className="text-sm text-red-600 dark:text-red-400">Database Setup Required</p>
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">To fix this:</h3>
          <ol className="text-blue-800 dark:text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Run the complete migration SQL in your Supabase dashboard</li>
            <li>Ensure the achievements table is created and populated</li>
            <li>Verify RLS policies are correctly applied</li>
            <li>Refresh the page to try again</li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-3">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Achievements</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {userAchievements.length} of {availableAchievements.length} achievements unlocked
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.points}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Points</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>Progress</span>
            <span>{Math.round((userAchievements.length / availableAchievements.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(userAchievements.length / availableAchievements.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('earned')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              activeTab === 'earned'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
            }`}
          >
            <Trophy className="w-4 h-4 mr-2" />
            Earned ({userAchievements.length})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
              activeTab === 'available'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            Available ({lockedAchievements.length})
          </button>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'earned' && unlockedAchievements.map((achievement) => {
          const IconComponent = getIconComponent(achievement.icon)
          const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
          
          return (
            <div key={achievement.id} className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-6 hover:scale-105 transition-transform duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(achievement.category)} rounded-xl flex items-center justify-center`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-yellow-500">+{achievement.points}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">points</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{achievement.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{achievement.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-green-100 text-green-600 text-xs rounded-full font-medium">
                  Completed
                </span>
                {userAchievement && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(userAchievement.earned_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {activeTab === 'available' && lockedAchievements.map((achievement) => {
          return (
            <div key={achievement.id} className="bg-white/5 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 opacity-75 hover:opacity-90 transition-opacity duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-400">+{achievement.points}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">points</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">{achievement.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">{achievement.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                  Locked
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {achievement.category}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {((activeTab === 'earned' && unlockedAchievements.length === 0) || 
        (activeTab === 'available' && lockedAchievements.length === 0)) && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {activeTab === 'earned' ? 'No achievements earned yet' : 'All achievements unlocked!'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'earned' 
              ? 'Start logging your meals and tracking progress to earn your first achievement'
              : 'Congratulations on completing all available achievements!'
            }
          </p>
        </div>
      )}
    </div>
  )
}