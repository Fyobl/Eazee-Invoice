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
    // Wait for auth to initialize before setting up the listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const data = await getUserData(user.uid);
          setUserData(data);
          // Store user data in localStorage as backup
          localStorage.setItem('userData', JSON.stringify(data));
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserData(null);
          localStorage.removeItem('userData');
        }
      } else {
        setUserData(null);
        localStorage.removeItem('userData');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

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
