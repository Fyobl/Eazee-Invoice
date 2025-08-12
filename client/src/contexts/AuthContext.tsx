import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getCurrentUser, hasAccess, hasActiveSubscription, checkTrialStatus, getTrialDaysLeft, isAdminGrantedSubscriptionExpired } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';

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
      // Always fetch fresh data from server, no caching for security
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      if (!user) {
        // SECURITY CRITICAL: Clear all data if no user but preserve remember me data
        const rememberMe = localStorage.getItem('rememberMe');
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        
        localStorage.clear();
        queryClient.clear();
        
        // Restore remember me data
        if (rememberMe) localStorage.setItem('rememberMe', rememberMe);
        if (rememberedEmail) localStorage.setItem('rememberedEmail', rememberedEmail);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setCurrentUser(null);
      // SECURITY CRITICAL: Clear all cached data on error but preserve remember me data
      const rememberMe = localStorage.getItem('rememberMe');
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      
      localStorage.clear();
      queryClient.clear();
      
      // Restore remember me data
      if (rememberMe) localStorage.setItem('rememberMe', rememberMe);
      if (rememberedEmail) localStorage.setItem('rememberedEmail', rememberedEmail);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // SECURITY FIX: Clear sensitive data but preserve login convenience data
      const rememberMe = localStorage.getItem('rememberMe');
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      

      
      localStorage.clear();
      queryClient.clear();
      
      // Restore login convenience data
      if (rememberMe) {
        localStorage.setItem('rememberMe', rememberMe);

      }
      if (rememberedEmail) {
        localStorage.setItem('rememberedEmail', rememberedEmail);

      }
      
      // Always fetch fresh data from server - no caching
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