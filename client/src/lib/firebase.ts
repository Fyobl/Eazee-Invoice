import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "default_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "default_domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "default_project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "default_bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "default_sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "default_app"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
