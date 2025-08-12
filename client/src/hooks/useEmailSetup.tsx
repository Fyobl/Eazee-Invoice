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