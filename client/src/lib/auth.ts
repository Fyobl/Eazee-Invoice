import { User } from '@shared/schema';
import { apiRequest } from './queryClient';

export interface AuthUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  companyName: string;
  isAdmin: boolean;
  isSubscriber: boolean;
  isSuspended: boolean;
  mustChangePassword: boolean;
  trialStartDate: Date;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: Date;
  isAdminGrantedSubscription?: boolean;
  // Company branding fields
  companyLogo?: string;
  companyAddress?: string;
  companyVatNumber?: string;
  companyRegistrationNumber?: string;
  currency?: string;
  dateFormat?: string;
  // Bank details fields
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankSortCode?: string;
}

export const registerUser = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string, 
  companyName: string
): Promise<AuthUser> => {
  const response = await apiRequest('POST', '/api/register', {
    email,
    password,
    firstName,
    lastName,
    companyName
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  
  return data.user;
};

export const loginUser = async (email: string, password: string): Promise<AuthUser> => {
  const response = await apiRequest('POST', '/api/login', {
    email,
    password
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }
  
  return data.user;
};

export const logoutUser = async (): Promise<void> => {
  const response = await apiRequest('POST', '/api/logout');
  
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  
  // Clear localStorage
  localStorage.removeItem('userData');
  localStorage.removeItem('authUser');
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const response = await apiRequest('GET', '/api/me');
    
    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error('Failed to get current user');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const response = await apiRequest('POST', '/api/change-password', {
    currentPassword,
    newPassword
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Password change failed');
  }
};

export const deleteAccount = async (password: string): Promise<void> => {
  const response = await apiRequest('POST', '/api/delete-account', {
    password
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Account deletion failed');
  }
};

export const checkTrialStatus = (user: AuthUser): boolean => {
  if (!user.trialStartDate) return false;
  
  const trialStart = new Date(user.trialStartDate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff < 7; // 7-day trial
};

export const getTrialDaysLeft = (user: AuthUser): number => {
  if (!user.trialStartDate) return 0;
  
  const trialStart = new Date(user.trialStartDate);
  const trialEnd = new Date(trialStart.getTime() + (7 * 24 * 60 * 60 * 1000));
  const now = new Date();
  
  // Check if trial is expired
  if (trialEnd <= now) {
    return 0;
  }
  
  // Calculate days left in trial - use floor for consistency with admin panel
  const daysLeft = Math.floor((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
};

export const hasActiveSubscription = (user: AuthUser): boolean => {
  if (!user.isSubscriber) return false;
  if (user.subscriptionStatus === 'cancelled') return false;
  
  // Admin-granted subscriptions are always considered active (unless cancelled)
  if (user.isAdminGrantedSubscription) return true;
  
  // For regular subscriptions, check the end date
  if (user.subscriptionCurrentPeriodEnd) {
    const now = new Date();
    const periodEnd = new Date(user.subscriptionCurrentPeriodEnd);
    return periodEnd > now;
  }
  
  return false;
};

export const isAdminGrantedSubscriptionExpired = (user: AuthUser): boolean => {
  if (!user.isAdminGrantedSubscription) return false;
  if (user.subscriptionStatus === 'cancelled') return false;
  
  if (user.subscriptionCurrentPeriodEnd) {
    const now = new Date();
    const periodEnd = new Date(user.subscriptionCurrentPeriodEnd);
    return periodEnd <= now;
  }
  
  return false;
};

export const hasAccess = (user: AuthUser): boolean => {
  if (user.isSuspended) return false;
  if (user.isAdmin) return true;
  
  return hasActiveSubscription(user) || checkTrialStatus(user);
};