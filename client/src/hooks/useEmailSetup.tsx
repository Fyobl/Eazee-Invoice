import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  companyAddress?: string;
  isEmailVerified?: boolean;
  senderEmail?: string;
  emailVerificationStatus?: string;
}

export const useEmailSetup = () => {
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['/api/me'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Extract user from response
  const user = response?.user as User;

  // Check company details - require both companyName and companyAddress
  const hasCompanyDetails = Boolean(user?.companyName && user?.companyAddress);
  const hasEmailSetup = Boolean(user?.isEmailVerified && user?.senderEmail);
  const isEmailSetupComplete = hasCompanyDetails && hasEmailSetup;
  
  // Debug logging to check values - show ALL user fields
  console.log('🔍 Complete user object:', user);
  console.log('🔍 Email setup validation:', {
    companyName: user?.companyName,
    companyAddress: user?.companyAddress,
    isEmailVerified: user?.isEmailVerified,
    senderEmail: user?.senderEmail,
    hasCompanyDetails,
    hasEmailSetup,
    isEmailSetupComplete
  });

  // Debug the response structure
  console.log('🔍 Raw API response:', response);
  
  // If we have all the data but validation is still failing, force a refresh
  if (user && user.companyName && user.companyAddress && user.isEmailVerified && user.senderEmail && !isEmailSetupComplete) {
    console.log('🚨 VALIDATION BUG: All data present but validation failing, clearing cache...');
    queryClient.removeQueries({ queryKey: ['/api/me'] });
    setTimeout(() => window.location.reload(), 100);
  }

  const showEmailSetupModal = () => {
    if (!isEmailSetupComplete) {
      setShowEmailSetup(true);
      return false; // Don't proceed with email sending
    }
    return true; // Can proceed with email sending
  };

  const closeEmailSetupModal = () => {
    setShowEmailSetup(false);
  };

  const onEmailSetupComplete = () => {
    setShowEmailSetup(false);
    // Invalidate user data to refresh the validation
    queryClient.invalidateQueries({ queryKey: ['/api/me'] });
  };

  return {
    showEmailSetup,
    showEmailSetupModal,
    closeEmailSetupModal,
    onEmailSetupComplete,
    hasCompanyDetails,
    hasEmailSetup,
    isEmailSetupComplete,
    user
  };
};