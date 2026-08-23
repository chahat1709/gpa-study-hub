import { initializeApp, getApps } from 'firebase/app';
// Separate type import for FirebaseApp
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// Separate type import for Auth
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Separate type import for Firestore
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Separate type import for FirebaseStorage
import type { FirebaseStorage } from 'firebase/storage';

/**
 * PRODUCTION FIREBASE CONFIGURATION
 * These environment variables should be set in your deployment platform (Firebase/GitHub/Vercel)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'MOCK_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'MOCK_KEY';

try {
  if (isConfigValid) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    }
  }
} catch {
  // Firebase initialization failed silently
}

export { app, auth, db, storage, isConfigValid };
