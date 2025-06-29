import React, { useState, useRef, useEffect } from 'react'
import { Profile, getUserPreferences } from '../lib/supabase'
import { chatWithGemini } from '../lib/gemini'
import { Send, User, Loader, Sparkles } from 'lucide-react'

interface ChatAssistantProps {
  profile: Profile
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

export function ChatAssistant({ profile }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hi ${profile.full_name}! 👋 I'm your nutrition assistant. I can help you with:

🍽️ Personalized meal planning based on your ${profile.goal.replace('_', ' ')} goals
🥗 Dietary advice considering your preferences and restrictions
🏃‍♂️ Nutrition for your ${profile.activity_level.replace('_', ' ')} lifestyle
🌍 Regional cuisine recommendations
📊 Macro tracking to hit your ${profile.calorie_target} cal, ${profile.protein_target}g protein targets

What would you like to know about nutrition and health today?`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [enrichedProfile, setEnrichedProfile] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load user preferences to enrich the profile for AI context
    const loadPreferences = async () => {
      try {
        const preferences = await getUserPreferences(profile.user_id)
        setEnrichedProfile({
          ...profile,
          preferences: {
            dietary_restrictions: preferences.dietary_restrictions,
            regional_preference: preferences.regional_preference
          },
          allergies: preferences.allergies,
          health_conditions: preferences.health_conditions,
          food_preferences: preferences.food_preferences
        })
      } catch (error) {
        console.error('Error loading preferences:', error)
        setEnrichedProfile(profile)
      }
    }

    loadPreferences()
  }, [profile])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading || !enrichedProfile) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const aiResponse = await chatWithGemini(input, enrichedProfile)
      // Remove bold formatting from AI responses
      const cleanResponse = aiResponse.replace(/\*\*(.*?)\*\*/g, '$1')
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: cleanResponse,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please check your API key configuration and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    "What should I eat for breakfast today?",
    "How can I increase my protein intake?",
    "Suggest a healthy snack for my goals",
    "What's a good post-workout meal?",
    "Help me plan dinner for tonight"
  ]

  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <div className="flex flex-col h-full bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/20 shadow-2xl rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-8 border-b border-white/30 dark:border-white/20 bg-white/20 dark:bg-white/5">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/25">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Nutrition Assistant</h2>
            <p className="text-gray-600 dark:text-gray-300">Your personalized nutrition companion</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              } group`}
            >
              <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-4' : 'mr-4'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110 ${
                  message.type === 'user' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
              <div
                className={`px-6 py-4 rounded-2xl backdrop-blur-lg transition-all duration-200 group-hover:scale-[1.02] ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/30 dark:bg-white/10 text-gray-800 dark:text-white border border-white/40 dark:border-white/20 shadow-lg'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                <p className={`text-xs mt-3 opacity-75 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex group">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Loader className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-white/30 dark:bg-white/10 border border-white/40 dark:border-white/20 px-6 py-4 rounded-2xl backdrop-blur-lg shadow-lg">
                <p className="text-sm text-gray-800 dark:text-white font-medium">Assistant is thinking...</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 opacity-75">Analyzing your profile and generating response</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="flex-shrink-0 px-8 py-6 border-t border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Quick questions to get started:</p>
          <div className="flex flex-wrap gap-3">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 transform shadow-lg border border-white/30 dark:border-white/20"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-8 border-t border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about nutrition, meals, or dietary advice..."
            className="flex-1 px-6 py-4 bg-white/30 dark:bg-white/10 border border-white/40 dark:border-white/20 rounded-2xl focus:ring-4 focus:ring-purple-500/30 focus:border-purple-400 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 backdrop-blur-lg shadow-lg transition-all duration-200"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-xl hover:shadow-purple-500/25 hover:scale-105 transform"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  )
}