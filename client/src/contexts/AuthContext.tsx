import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getCurrentUser, hasAccess, hasActiveSubscription, checkTrialStatus, getTrialDaysLeft, isAdminGrantedSubscriptionExpired } from '@/lib/auth';

interface AuthContextType {
  currentUser: AuthUser | null;
  userData: AuthUser | null;
  loading: boolean;
  hasAccess: boolean;
  isAdmin: boolean;
  trialDaysLeft: number;
  mustChangePassword: boolean;
  isSubscriber: boolean;
  isAdminGrantedSubscriptionExpired: boolean;
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
      // Always fetch fresh data from server, don't rely on localStorage
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        // Update localStorage with fresh data
        localStorage.setItem('userData', JSON.stringify(user));
      } else {
        // Clear all cached data if no user
        localStorage.removeItem('userData');
        localStorage.removeItem('authUser');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setCurrentUser(null);
      // Clear cached data on error
      localStorage.removeItem('userData');
      localStorage.removeItem('authUser');
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
    isAdminGrantedSubscriptionExpired: currentUser ? isAdminGrantedSubscriptionExpired(currentUser) : false,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};