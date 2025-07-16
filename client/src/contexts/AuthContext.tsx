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
  mustChangePassword: boolean;
  isSubscriber: boolean;
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
    let isMounted = true;
    
    // Try to restore user data from localStorage immediately
    const storedUserData = localStorage.getItem('userData');
    const storedAuthUser = localStorage.getItem('authUser');
    
    console.log('Auth initialization - Stored data available:', !!storedUserData && !!storedAuthUser);
    
    if (storedUserData && storedAuthUser) {
      try {
        const parsedData = JSON.parse(storedUserData);
        const parsedAuth = JSON.parse(storedAuthUser);
        console.log('Restoring stored user data:', parsedData.email);
        
        if (isMounted) {
          setUserData(parsedData);
          setCurrentUser(parsedAuth);
          setLoading(false); // Stop loading immediately when we have stored data
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('userData');
        localStorage.removeItem('authUser');
      }
    }

    // Set a longer timeout for Firebase Auth initialization
    const authTimeout = setTimeout(() => {
      console.log('Auth timeout reached, stopping loading');
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    // Set up the auth listener 
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      
      clearTimeout(authTimeout);
      console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'No user');
      
      if (user) {
        setCurrentUser(user);
        try {
          // First, ensure user is synced to PostgreSQL
          const syncResponse = await fetch('/api/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uid: user.uid,
              email: user.email || '',
              firstName: user.displayName?.split(' ')[0] || '',
              lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
              displayName: user.displayName || user.email || 'User'
            })
          });

          if (syncResponse.ok) {
            const syncedUser = await syncResponse.json();
            console.log('User synced to PostgreSQL:', syncedUser);
            
            // Use the PostgreSQL data instead of Firebase data
            if (isMounted) {
              setUserData(syncedUser);
              // Store user data in localStorage as backup
              localStorage.setItem('userData', JSON.stringify(syncedUser));
              localStorage.setItem('authUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
              }));
              console.log('User data stored in localStorage (PostgreSQL)');
            }
          } else {
            console.error('Failed to sync user to PostgreSQL');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Keep stored data if available
          if (!storedUserData && isMounted) {
            setUserData(null);
          }
        }
      } else {
        // No Firebase user - clear everything (user logged out)
        console.log('No Firebase user found, clearing all data');
        if (isMounted) {
          setCurrentUser(null);
          setUserData(null);
          localStorage.removeItem('userData');
          localStorage.removeItem('authUser');
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  // Check if user has active subscription based on current time
  const hasActiveSubscription = userData ? (
    userData.subscriptionCurrentPeriodEnd && 
    new Date(userData.subscriptionCurrentPeriodEnd) > new Date()
  ) : false;
  
  // Authentication access control logic now working properly
  
  const hasAccess = userData ? (userData.isAdmin || hasActiveSubscription || checkTrialStatus(userData)) && !userData.isSuspended : false;
  const isAdmin = userData?.isAdmin || false;
  const mustChangePassword = userData?.mustChangePassword || false;
  
  const trialDaysLeft = userData && !hasActiveSubscription ? 
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
    trialDaysLeft,
    mustChangePassword,
    isSubscriber: hasActiveSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
