import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface EmailSetupContextType {
  isEmailSetupComplete: boolean;
  showEmailSetup: boolean;
  setShowEmailSetup: (show: boolean) => void;
  refreshEmailSetupStatus: () => void;
  markEmailSetupComplete: () => void;
}

const EmailSetupContext = createContext<EmailSetupContextType | undefined>(undefined);

interface User {
  emailVerificationStatus?: string;
  senderEmail?: string;
  companyName?: string;
}

export const EmailSetupProvider = ({ children }: { children: ReactNode }) => {
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Get user data from API
  const { data: response, refetch } = useQuery({
    queryKey: ['/api/me'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const user = (response as any)?.user as User;

  // Check email setup status and update local state
  useEffect(() => {
    const checkSetupStatus = () => {
      // Primary validation from server data
      const serverValidation = Boolean(
        user?.emailVerificationStatus === 'verified' && 
        user?.senderEmail && 
        user?.companyName
      );

      // localStorage backup
      const localStorageComplete = localStorage.getItem('emailSetupComplete') === 'true';
      
      // Use server data if available, otherwise fall back to localStorage
      const finalStatus = serverValidation || localStorageComplete;
      
      console.log('🔍 EmailSetupContext - Status Check:', {
        serverValidation,
        localStorageComplete,
        finalStatus,
        userData: {
          emailVerificationStatus: user?.emailVerificationStatus,
          senderEmail: user?.senderEmail,
          companyName: user?.companyName
        }
      });

      setIsSetupComplete(finalStatus);

      // Sync localStorage with server state if server has valid data
      if (serverValidation) {
        localStorage.setItem('emailSetupComplete', 'true');
      }
    };

    checkSetupStatus();
  }, [user?.emailVerificationStatus, user?.senderEmail, user?.companyName]);

  const refreshEmailSetupStatus = async () => {
    await refetch();
  };

  const markEmailSetupComplete = () => {
    localStorage.setItem('emailSetupComplete', 'true');
    setIsSetupComplete(true);
    setShowEmailSetup(false);
    refreshEmailSetupStatus();
  };

  const value = {
    isEmailSetupComplete: isSetupComplete,
    showEmailSetup,
    setShowEmailSetup,
    refreshEmailSetupStatus,
    markEmailSetupComplete
  };

  return (
    <EmailSetupContext.Provider value={value}>
      {children}
    </EmailSetupContext.Provider>
  );
};

export const useEmailSetupContext = () => {
  const context = useContext(EmailSetupContext);
  if (context === undefined) {
    throw new Error('useEmailSetupContext must be used within an EmailSetupProvider');
  }
  return context;
};