// Temporary script to set up admin user
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Find user by email and update to admin
async function makeUserAdmin(email) {
  try {
    // Note: This is a simplified approach - in production you'd query by email
    // For now, we'll use a known UID approach
    console.log('Making user admin for email:', email);
    
    // You would typically query users collection to find by email
    // For now, we'll provide a manual approach
    console.log('Please provide the user UID to make admin');
    
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

makeUserAdmin('fyobl_ben@hotmail.com');