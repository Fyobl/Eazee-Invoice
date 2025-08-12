import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface User {
  uid: string;
  email: string;
  companyName?: string;
  companyAddress?: string;
  company_name?: string;  // Add snake_case variants
  company_address?: string;
  isEmailVerified?: boolean;
  is_email_verified?: boolean;  // Add snake_case variant
  senderEmail?: string;
  sender_email?: string;  // Add snake_case variant
  emailVerificationStatus?: string;
  email_verification_status?: string;  // Add snake_case variant
}

export const useEmailSetup = () => {
  const [showEmailSetup, setShowEmailSetup] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/me'],
  });

  const hasCompanyDetails = Boolean(
    (user?.companyName || user?.company_name) && 
    (user?.companyAddress || user?.company_address)
  );
  const hasEmailSetup = Boolean(
    (user?.isEmailVerified || user?.is_email_verified) && 
    (user?.senderEmail || user?.sender_email)
  );
  const isEmailSetupComplete = hasCompanyDetails && hasEmailSetup;
  
  // Debug logging to check values
  console.log('🔍 Email setup validation:', {
    companyName: user?.companyName,
    company_name: user?.company_name,
    companyAddress: user?.companyAddress,
    company_address: user?.company_address,
    isEmailVerified: user?.isEmailVerified,
    is_email_verified: user?.is_email_verified,
    senderEmail: user?.senderEmail,
    sender_email: user?.sender_email,
    hasCompanyDetails,
    hasEmailSetup,
    isEmailSetupComplete
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