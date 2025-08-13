import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useSimpleEmailStatus = () => {
  const [showEmailSetup, setShowEmailSetup] = useState(false);

  // Get user data using TanStack Query
  const { data: userData } = useQuery({
    queryKey: ['/api/me'],
    retry: 1,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  const user = userData ? (userData as any).user : null;
  
  // Simple rule: if senderEmail exists and is not empty, email setup is complete
  const isEmailSetupComplete = Boolean(user?.senderEmail && user.senderEmail.trim().length > 0);

  console.log('📧 Simple Email Status Check:', {
    senderEmail: user?.senderEmail,
    isEmailSetupComplete,
    userDataExists: !!user,
    showEmailSetup,
    modalWillShow: !isEmailSetupComplete
  });

  const showEmailSetupModal = () => {
    console.log('🔍 showEmailSetupModal called:', {
      isEmailSetupComplete,
      willShowModal: !isEmailSetupComplete
    });
    
    if (!isEmailSetupComplete) {
      setShowEmailSetup(true);
      return false;
    }
    return true;
  };

  const closeEmailSetupModal = () => {
    setShowEmailSetup(false);
  };

  const markEmailSetupComplete = () => {
    setShowEmailSetup(false);
    // The query will refetch automatically and update the status
  };

  return {
    isEmailSetupComplete,
    showEmailSetup,
    showEmailSetupModal,
    closeEmailSetupModal,
    markEmailSetupComplete,
    userData: user
  };
};