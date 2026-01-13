import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthChange,
  signInWithGoogle,
  signInWithGitHub,
  signOut as firebaseSignOut,
  type User,
} from '@/lib/firebase'
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

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user)

      // Sync user to backend when they log in
      if (user) {
        await syncUserToBackend(user)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await firebaseSignOut()
    setUser(null)
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
