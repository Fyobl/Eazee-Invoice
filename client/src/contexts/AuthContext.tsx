import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getCurrentUser, hasAccess, hasActiveSubscription, checkTrialStatus, getTrialDaysLeft } from '@/lib/auth';

interface AuthContextType {
  currentUser: AuthUser | null;
  userData: AuthUser | null;
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  trialDaysLeft: number;
  mustChangePassword: boolean;
  isSubscriber: boolean;
  refreshUser: () => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        localStorage.setItem('userData', JSON.stringify(user));
      } else {
        localStorage.removeItem('userData');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setCurrentUser(null);
      localStorage.removeItem('userData');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // Try to restore from localStorage first
      const storedUser = localStorage.getItem('userData');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      
      // Then verify with server (this will check session cookie)
      await refreshUser();
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    currentUser,
    userData: currentUser,
    loading,
    hasAccess: currentUser ? hasAccess(currentUser) : false,
    isAdmin: currentUser?.isAdmin || false,
    trialDaysLeft: currentUser ? getTrialDaysLeft(currentUser) : 0,
    mustChangePassword: currentUser?.mustChangePassword || false,
    isSubscriber: currentUser ? hasActiveSubscription(currentUser) : false,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};