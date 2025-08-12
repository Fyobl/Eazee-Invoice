import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  uid: string;
  email: string;
  companyName?: string;
  companyAddress?: string;
  isEmailVerified?: boolean;
  senderEmail?: string;
  emailVerificationStatus?: string;
}

export const useEmailSetup = () => {
  const [showEmailSetup, setShowEmailSetup] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/me'],
  });

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
    // Could trigger a callback here if needed
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