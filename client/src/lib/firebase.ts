import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
export const auth = getAuth(app);

// Ensure local persistence is set immediately and wait for auth to be ready
let authInitialized = false;

const initializeAuth = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    authInitialized = true;
  } catch (error) {
    console.error('Error setting auth persistence:', error);
  }
};

// Initialize auth persistence
initializeAuth();

// Export a function to check if auth is ready
export const waitForAuthInit = () => {
  return new Promise<void>((resolve) => {
    if (authInitialized) {
      resolve();
    } else {
      const checkInit = () => {
        if (authInitialized) {
          resolve();
        } else {
          setTimeout(checkInit, 50);
        }
      };
      checkInit();
    }
  });
};

export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
