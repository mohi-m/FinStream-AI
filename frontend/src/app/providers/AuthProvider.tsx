import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthChange,
  signInWithGoogle,
  signInWithGitHub,
  signOut as firebaseSignOut,
  type User,
} from '@/lib/firebase'
import {
  logLogin,
  logLogout,
  logSignUp,
  setAnalyticsUserProperties,
  logError,
} from '@/lib/firebase/analytics'
import { userApi } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<User>
  signInWithGitHub: () => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Syncs the Firebase user to the backend app_user table.
 * Uses PUT /api/me which has upsert logic - creates if not exists, updates if exists.
 */
async function syncUserToBackend(user: User): Promise<void> {
  try {
    await userApi.updateMe({
      email: user.email || undefined,
      fullName: user.displayName ?? '',
      firebaseUid: user.uid,
    })
  } catch (error) {
    // Log but don't fail - user can still use the app
    console.error('Failed to sync user to backend:', error)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUserUid, setLastUserUid] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      const previousUid = lastUserUid

      if (user) {
        // User is logged in
        setUser(user)
        setLastUserUid(user.uid)

        // Sync user to backend when they log in
        await syncUserToBackend(user)

        // Track login/signup
        if (!previousUid) {
          // This is a new session/fresh login - check if it's a signup by seeing if backend sync happens
          logSignUp(user.providerData[0]?.providerId.includes('google') ? 'google' : 'github')
        } else if (previousUid !== user.uid) {
          // Different user logged in
          logLogin(user.providerData[0]?.providerId.includes('google') ? 'google' : 'github')
        }

        // Set user properties for analytics segmentation
        setAnalyticsUserProperties(user.uid, {
          email: user.email || '',
          display_name: user.displayName || '',
          has_photo: user.photoURL ? 'yes' : 'no',
        })
      } else if (previousUid) {
        // User logged out
        logLogout()
        setUser(null)
        setLastUserUid(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [lastUserUid])

  const signOut = async () => {
    try {
      await firebaseSignOut()
      setUser(null)
      setLastUserUid(null)
    } catch (error) {
      logError('logout_failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
