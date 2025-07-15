import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserData, checkTrialStatus } from '@/lib/auth';
import { User } from '@shared/schema';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  trialDaysLeft: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore user data from localStorage immediately
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('userData');
      }
    }

    // Set a timeout to prevent infinite loading if Firebase Auth fails
    const authTimeout = setTimeout(() => {
      if (!currentUser && storedUserData) {
        // If we still don't have a user after 5 seconds but have stored data,
        // stop loading to prevent infinite loading state
        console.log('Auth timeout reached, stopping loading with stored data');
        setLoading(false);
      }
    }, 5000);

    // Wait for auth to initialize before setting up the listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);
      console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'No user');
      setCurrentUser(user);
      
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
          // Store user data in localStorage as backup
          localStorage.setItem('userData', JSON.stringify(data));
          localStorage.setItem('authUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }));
          console.log('User data stored in localStorage');
        } catch (error) {
          console.error('Error loading user data:', error);
          // Keep the stored data if available, don't clear it immediately
          if (!storedUserData) {
            setUserData(null);
          }
        }
      } else {
        console.log('No user found, stored data available:', !!storedUserData);
        // Don't clear localStorage data immediately - give Firebase Auth time to restore
        // Only clear if we're sure there's no user and no stored data
        if (!storedUserData) {
          setUserData(null);
          localStorage.removeItem('userData');
          localStorage.removeItem('authUser');
          console.log('Cleared localStorage data');
        } else {
          console.log('Keeping stored data during auth restoration');
        }
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, [currentUser]);

  const hasAccess = userData ? (userData.isAdmin || userData.isSubscriber || checkTrialStatus(userData)) && !userData.isSuspended : false;
  const isAdmin = userData?.isAdmin || false;
  
  const trialDaysLeft = userData && !userData.isSubscriber ? 
    (() => {
      let trialStart: Date;
      
      // Handle Firestore Timestamp objects
      if (userData.trialStartDate && typeof userData.trialStartDate === 'object' && 'seconds' in userData.trialStartDate) {
        trialStart = new Date((userData.trialStartDate as any).seconds * 1000);
      } else {
        trialStart = new Date(userData.trialStartDate);
      }
      
      return Math.max(0, 7 - Math.floor((new Date().getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)));
    })() : 0;



  const value = {
    currentUser,
    userData,
    loading,
    hasAccess,
    isAdmin,
    trialDaysLeft
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
