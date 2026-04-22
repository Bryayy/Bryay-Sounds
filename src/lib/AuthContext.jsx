import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
      return data
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    // Timeout safety — if auth takes more than 4 seconds, just load the page
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth timeout — loading page without session')
        setLoading(false)
      }
    }, 4000)

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => {
            if (mounted) setLoading(false)
          })
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Auth session error:', err)
        if (mounted) setLoading(false)
      })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    fetchProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
