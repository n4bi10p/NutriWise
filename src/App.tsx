import React, { useState, useEffect } from 'react'
import { supabase, getCompleteProfile, Profile } from './lib/supabase'
import { AuthForm } from './components/AuthForm'
import { ProfileSetup } from './components/ProfileSetup'
import { Dashboard } from './components/Dashboard'
import { Loader } from 'lucide-react'

type AppState = 'loading' | 'auth' | 'profile-setup' | 'dashboard'

function App() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...')
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          if (mounted) {
            setError('Authentication error. Please try again.')
            setAppState('auth')
            setIsInitialized(true)
          }
          return
        }

        if (session?.user && mounted) {
          console.log('Initial session found for user:', session.user.id)
          setUser(session.user)
          await checkProfile(session.user.id)
        } else if (mounted) {
          console.log('No initial session found')
          setAppState('auth')
        }
        
        if (mounted) {
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setError('Failed to initialize authentication.')
          setAppState('auth')
          setIsInitialized(true)
        }
      }
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted || !isInitialized) return
      
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setError('')
        await checkProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        setError('')
        setAppState('auth')
      }
    })

    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const checkProfile = async (userId: string) => {
    try {
      console.log('Checking profile for user:', userId)
      setAppState('loading')
      
      // Use the new normalized profile fetching function
      const completeProfile = await getCompleteProfile(userId)

      if (completeProfile) {
        console.log('Profile found, going to dashboard')
        setProfile(completeProfile)
        setAppState('dashboard')
      } else {
        console.log('No profile found, going to setup')
        setAppState('profile-setup')
      }
    } catch (error: any) {
      console.error('Error checking profile:', error)
      
      // Check if it's a missing table error
      if (error?.code === '42P01') {
        setError('Database setup required. Please run the migration script.')
      } else {
        setError('Failed to load profile data.')
      }
      setAppState('profile-setup')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleAuthSuccess = () => {
    setError('')
    // Don't set loading state here - let the auth state change handler do it
  }

  const handleProfileComplete = async () => {
    setError('')
    if (user) {
      await checkProfile(user.id)
    }
  }

  // Show loading until initialized
  if (!isInitialized || appState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {!isInitialized ? 'Initializing...' : 'Loading...'}
          </p>
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    )
  }

  if (appState === 'auth') {
    return <AuthForm onAuthSuccess={handleAuthSuccess} error={error} />
  }

  if (appState === 'profile-setup' && user) {
    return (
      <ProfileSetup
        userId={user.id}
        onProfileComplete={handleProfileComplete}
        error={error}
      />
    )
  }

  if (appState === 'dashboard' && user && profile) {
    return (
      <Dashboard
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />
    )
  }

  // Fallback to auth if something goes wrong
  return <AuthForm onAuthSuccess={handleAuthSuccess} error="Something went wrong. Please sign in again." />
}

export default App