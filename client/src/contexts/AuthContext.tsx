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
    const storedAuthUser = localStorage.getItem('authUser');
    
    if (storedUserData && storedAuthUser) {
      try {
        const parsedData = JSON.parse(storedUserData);
        const parsedAuth = JSON.parse(storedAuthUser);
        console.log('Restoring stored user data:', parsedData.email);
        setUserData(parsedData);
        setCurrentUser(parsedAuth);
        setLoading(false); // Stop loading immediately when we have stored data
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('userData');
        localStorage.removeItem('authUser');
      }
    }

    // Set a timeout to prevent infinite loading if Firebase Auth fails
    const authTimeout = setTimeout(() => {
      console.log('Auth timeout reached, stopping loading');
      setLoading(false);
    }, 3000);

    // Wait for auth to initialize before setting up the listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(authTimeout);
      console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'No user');
      
      if (user) {
        // Only update if we don't already have this user or if it's different
        if (!currentUser || currentUser.uid !== user.uid) {
          setCurrentUser(user);
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
            // Keep stored data if available
            if (!storedUserData) {
              setUserData(null);
            }
          }
        }
      } else {
        // Only clear data if we don't have valid stored data
        if (!storedUserData || !storedAuthUser) {
          console.log('No user found, clearing data');
          setCurrentUser(null);
          setUserData(null);
          localStorage.removeItem('userData');
          localStorage.removeItem('authUser');
        } else {
          console.log('No user found but keeping stored data');
        }
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
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
