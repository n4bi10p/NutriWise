import React, { useState, useEffect } from 'react'
import { X, Bell, Dumbbell, Apple, Target, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { Profile } from '../lib/supabase'
import { generateHealthTips } from '../lib/gemini'

interface Notification {
  id: string
  type: 'health' | 'training' | 'nutrition' | 'maintenance'
  title: string
  message: string
  timestamp: Date
  read: boolean
  icon: React.ComponentType<any>
  priority: 'high' | 'medium' | 'low'
}

interface NotificationCenterProps {
  profile: Profile
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ profile, isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)

  const generateNotifications = async () => {
    setLoading(true)
    try {
      // Generate AI tips based on user profile
      const tips = await generateHealthTips(profile)
      
      const newNotifications: Notification[] = [
        {
          id: `health-${Date.now()}`,
          type: 'health',
          title: 'Daily Health Tip',
          message: tips.healthTip,
          timestamp: new Date(),
          read: false,
          icon: Target,
          priority: 'medium'
        },
        {
          id: `training-${Date.now()}`,
          type: 'training',
          title: 'Workout Recommendation',
          message: tips.trainingTip,
          timestamp: new Date(),
          read: false,
          icon: Dumbbell,
          priority: 'high'
        },
        {
          id: `nutrition-${Date.now()}`,
          type: 'nutrition',
          title: 'Nutrition Advice',
          message: tips.nutritionTip,
          timestamp: new Date(),
          read: false,
          icon: Apple,
          priority: 'high'
        },
        {
          id: `maintenance-${Date.now()}`,
          type: 'maintenance',
          title: 'Lifestyle Tip',
          message: tips.maintenanceTip,
          timestamp: new Date(),
          read: false,
          icon: TrendingUp,
          priority: 'low'
        }
      ]

      setNotifications(prev => [...newNotifications, ...prev.slice(0, 6)]) // Keep last 10 notifications
      setLastGenerated(new Date())
    } catch (error) {
      console.error('Error generating notifications:', error)
      // Fallback notifications
      const fallbackNotifications: Notification[] = [
        {
          id: `fallback-${Date.now()}`,
          type: 'health',
          title: 'Stay Hydrated!',
          message: `Remember to drink water! Your goal is ${profile.water_goal_ltr}L per day.`,
          timestamp: new Date(),
          read: false,
          icon: Target,
          priority: 'medium'
        }
      ]
      setNotifications(prev => [...fallbackNotifications, ...prev])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Generate notifications when component mounts or every 4 hours
    const shouldGenerate = !lastGenerated || 
      (Date.now() - lastGenerated.getTime()) > 4 * 60 * 60 * 1000

    if (isOpen && shouldGenerate) {
      generateNotifications()
    }
  }, [isOpen, profile])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'health': return 'text-green-600 dark:text-green-400'
      case 'training': return 'text-blue-600 dark:text-blue-400'
      case 'nutrition': return 'text-orange-600 dark:text-orange-400'
      case 'maintenance': return 'text-purple-600 dark:text-purple-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-start justify-end p-4">
      <div className="bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-white/30 dark:border-white/20 rounded-3xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl shadow-blue-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/30 dark:border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-xl">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full px-2 py-0.5 shadow-lg">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateNotifications}
              disabled={loading}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 transition-colors duration-300 font-medium"
            >
              {loading ? 'Generating...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-colors duration-300"
            >
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500/50 border-t-blue-500 rounded-full mx-auto mb-3 animate-spin"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generating personalized tips...
                </p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  No notifications yet
                </p>
                <button
                  onClick={generateNotifications}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300"
                >
                  Generate health tips
                </button>
              </div>
            </div>
          ) : (
            <>
              {notifications.map((notification) => {
                const Icon = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                      notification.read
                        ? 'bg-white/10 dark:bg-white/5 border-white/20 dark:border-white/10 opacity-70'
                        : 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/25 dark:hover:bg-white/15 shadow-lg'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-3 rounded-xl ${getTypeColor(notification.type)} bg-white/20 dark:bg-white/10 shadow-lg`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                            {notification.title}
                          </h3>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)} shadow-sm`}></div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{notification.timestamp.toLocaleTimeString()}</span>
                          {notification.read && <CheckCircle className="w-3 h-3 text-green-500" />}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-6 border-t border-white/30 dark:border-white/20">
            <button
              onClick={clearAll}
              className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-300 font-medium py-2"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
