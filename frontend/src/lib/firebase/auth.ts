import {
  signInWithPopup,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()
const githubProvider = new GithubAuthProvider()
const demoUserEmail = import.meta.env.VITE_DEMO_USER_EMAIL?.trim()
const demoUserPassword = import.meta.env.VITE_DEMO_USER_PASSWORD?.trim()

export const isDemoUserConfigured = Boolean(demoUserEmail && demoUserPassword)

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function signInWithGitHub(): Promise<User> {
  const result = await signInWithPopup(auth, githubProvider)
  return result.user
}

export async function signInWithDemoUser(): Promise<User> {
  if (!demoUserEmail || !demoUserPassword) {
    throw new Error(
      'Demo user authentication is not configured. Set VITE_DEMO_USER_EMAIL and VITE_DEMO_USER_PASSWORD.'
    )
  }

  const result = await signInWithEmailAndPassword(auth, demoUserEmail, demoUserPassword)
  return result.user
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export { auth }
export type { User }
