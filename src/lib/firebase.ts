import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const isValidConfig = (cfg: Record<string, any>) =>
  Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId)

let app: ReturnType<typeof getApp> | ReturnType<typeof initializeApp> | null = null
let db: ReturnType<typeof getFirestore> | null = null
let storage: ReturnType<typeof getStorage> | null = null
let auth: ReturnType<typeof getAuth> | null = null

// Inicializar Firebase SOLO en cliente y si hay config válida
if (typeof window !== 'undefined' && isValidConfig(firebaseConfig)) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
}

export { app, db, storage, auth }