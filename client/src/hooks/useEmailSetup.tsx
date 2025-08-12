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
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
    retry: false,
  });

  // Extract user from response
  const user = (response as any)?.user as User;

  // More robust validation - prioritize email verification status
  // If email is verified and we have basic company info, consider it complete
  const isEmailSetupComplete = Boolean(
    user?.emailVerificationStatus === 'verified' && 
    user?.senderEmail && 
    user?.companyName
  );

  console.log('🔍 useEmailSetup - Email Setup Status Check:', {
    step1_emailVerified: user?.emailVerificationStatus === 'verified',
    step2_senderEmail: Boolean(user?.senderEmail),
    step3_companyName: Boolean(user?.companyName),
    finalResult: isEmailSetupComplete,
    debugData: {
      emailVerificationStatus: user?.emailVerificationStatus,
      senderEmail: user?.senderEmail,
      companyName: user?.companyName
    }
  });

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
    queryClient.clear();
    queryClient.invalidateQueries({ queryKey: ['/api/me'] });
    queryClient.refetchQueries({ queryKey: ['/api/me'] });
    
    // Add a short delay to ensure fresh data is loaded
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['/api/me'] });
    }, 500);
  };

  return {
    showEmailSetup,
    showEmailSetupModal,
    closeEmailSetupModal,
    onEmailSetupComplete,
    isEmailSetupComplete,
    user
  };
};