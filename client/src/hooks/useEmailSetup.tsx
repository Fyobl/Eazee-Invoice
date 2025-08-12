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

  // Simplified validation - if email verification status is 'verified', assume everything is set up
  const isEmailSetupComplete = Boolean(
    user?.emailVerificationStatus === 'verified' && 
    user?.senderEmail && 
    user?.companyName &&
    user?.companyAddress
  );

  console.log('🔍 useEmailSetup - Raw user data:', user);
  console.log('🔍 useEmailSetup - Detailed validation:', {
    emailVerificationStatus: user?.emailVerificationStatus,
    senderEmail: user?.senderEmail,
    companyName: user?.companyName,
    companyAddress: user?.companyAddress,
    hasAddress: Boolean(user?.companyAddress),
    isEmailSetupComplete,
    response
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