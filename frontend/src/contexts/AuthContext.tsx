import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { connectFacebookFromAuthResult } from '../lib/facebookService'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  logOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()
googleProvider.addScope('profile')
googleProvider.addScope('email')

async function ensureUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      plan: 'free',
      timezone: 'Asia/Kolkata',
      language: 'english',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    })
    await setDoc(doc(db, 'settings', user.uid), {
      userId: user.uid,
      timezone: 'Asia/Kolkata',
      language: 'english',
      defaultPlatform: 'facebook',
      defaultTone: 'casual',
      notifications: {
        email: true,
        push: true,
        published: true,
        failed: true,
        scheduled: true,
        aiComplete: true,
      },
      theme: 'system',
      updatedAt: serverTimestamp(),
    })
  } else {
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true })
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        try {
          await ensureUserProfile(u)
        } catch (err) {
          console.warn('[SocialFlow] Non-fatal error ensuring user profile:', err)
        }
        setUser(u)
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await ensureUserProfile(cred.user)
  }

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signInWithFacebook = async () => {
    const facebookProvider = new FacebookAuthProvider()
    facebookProvider.addScope('public_profile')
    facebookProvider.addScope('email')
    facebookProvider.addScope('pages_show_list')
    facebookProvider.addScope('pages_read_engagement')
    facebookProvider.addScope('pages_manage_posts')
    const cred = await signInWithPopup(auth, facebookProvider)
    const oauthCred = FacebookAuthProvider.credentialFromResult(cred)
    const token = oauthCred?.accessToken || undefined
    await ensureUserProfile(cred.user)
    try {
      await connectFacebookFromAuthResult(cred.user.uid, cred.user, token)
    } catch (fbErr) {
      console.warn('[SocialFlow] Auto-connect Facebook error:', fbErr)
    }
  }

  const logOut = async () => {
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signInWithFacebook, logOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
