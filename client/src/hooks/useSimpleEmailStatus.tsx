import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export const useSimpleEmailStatus = () => {
  const [showEmailSetup, setShowEmailSetup] = useState(false);

  // Get user data using TanStack Query
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
    retry: 1,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  const user = userData ? (userData as any).user : null;
  
  // Simple rule: if senderEmail exists and is not empty, email setup is complete
  // BUT only check after data is loaded
  const isEmailSetupComplete = userLoading ? false : Boolean(user?.senderEmail && user.senderEmail.trim().length > 0);

  console.log('📧 Simple Email Status Check:', {
    senderEmail: user?.senderEmail,
    isEmailSetupComplete,
    userDataExists: !!user,
    userLoading,
    showEmailSetup,
    modalWillShow: !isEmailSetupComplete,
    rawUserData: user
  });

  const showEmailSetupModal = () => {
    console.log('🔍 showEmailSetupModal called:', {
      isEmailSetupComplete,
      userLoading,
      willShowModal: !isEmailSetupComplete,
      senderEmail: user?.senderEmail
    });
    
    // If still loading, don't show modal yet
    if (userLoading) {
      return false;
    }
    
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