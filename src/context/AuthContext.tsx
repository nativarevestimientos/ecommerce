"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from '@/lib/firebase'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  AuthError,
  User as FirebaseUser,
} from 'firebase/auth'

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<"popup" | "redirect">;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const mapFirebaseUser = (u: FirebaseUser): User => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  });

  const normalizeRedirect = (raw: string | null | undefined) => {
    if (!raw) return null
    const value = String(raw).trim()
    if (!value) return null
    try {
      const url = value.startsWith("/")
        ? new URL(value, window.location.origin)
        : new URL(value)
      if (url.origin !== window.location.origin) return null
      url.searchParams.delete("login")
      url.searchParams.delete("redirect")
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return value.startsWith("/") ? value : null
    }
  }

  useEffect(() => {
    if (!auth) return
    let cancelled = false
    ;(async () => {
      try {
        const result = await getRedirectResult(auth)
        if (cancelled) return
        if (result?.user) {
          setUser(mapFirebaseUser(result.user))
          const stored = normalizeRedirect(sessionStorage.getItem("post_login_redirect"))
          if (stored) {
            sessionStorage.removeItem("post_login_redirect")
            router.replace(stored)
          } else {
            const current = new URL(window.location.href)
            if (current.searchParams.get("login") === "open") {
              current.searchParams.delete("login")
              current.searchParams.delete("redirect")
              router.replace(`${current.pathname}${current.search}${current.hash}`)
            }
          }
        }
      } catch {
        return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router]);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth no está inicializado. Revisa tus variables de entorno.');
    const cred = await signInWithEmailAndPassword(auth, email, password)
    setUser(mapFirebaseUser(cred.user))
  }

  const signInWithGoogle = async (): Promise<"popup" | "redirect"> => {
    if (!auth) throw new Error('Firebase Auth no está inicializado. Revisa tus variables de entorno.');
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      const cred = await signInWithPopup(auth, provider)
      setUser(mapFirebaseUser(cred.user))
      return "popup"
    } catch (e) {
      const err = e as Partial<AuthError>
      const code = err?.code || ''
      // Fallback a redirect cuando el popup es cancelado/bloqueado o hay una solicitud simultánea
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider)
        return "redirect"
      }
      throw e
    }
  }

  const signOut = async () => {
    if (!auth) {
      setUser(null)
      return
    }
    await fbSignOut(auth)
    setUser(null)
  }

  useEffect(() => {
    if (!auth) {
      setIsLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUser(mapFirebaseUser(u))
      else setUser(null)
      setIsLoading(false)
    })
    return () => unsub()
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 
