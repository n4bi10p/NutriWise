import React, { useState, useRef, useEffect } from 'react'
import { Profile, getUserPreferences } from '../lib/supabase'
import { chatWithGemini } from '../lib/gemini'
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react'

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
    <div className="h-full flex flex-col bg-white/10 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nutrition Assistant</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Your personalized nutrition companion</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-xs lg:max-w-md xl:max-w-lg ${
                message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/20 text-gray-900 dark:text-white border border-white/10'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <Loader className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-white/20 border border-white/10 px-4 py-3 rounded-2xl">
                <p className="text-sm text-gray-900 dark:text-white">Assistant is thinking...</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Analyzing your profile and generating response</p>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick questions to get started:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="text-xs px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-105"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about nutrition, meals, or dietary advice..."
            className="flex-1 px-4 py-3 bg-white/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white placeholder-gray-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}