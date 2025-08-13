import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useEmailSetupSimple } from '@/hooks/useEmailSetupSimple';

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

  // Get user data using simple hook
  const { isEmailSetupComplete: hookResult, user, refetch } = useEmailSetupSimple();

  // Check email setup status and update local state
  useEffect(() => {
    // localStorage backup for immediate response
    const localStorageComplete = localStorage.getItem('emailSetupComplete') === 'true';
    
    // Use hook result if available, otherwise fall back to localStorage
    const finalStatus = hookResult || localStorageComplete;
    
    console.log('🔍 EmailSetupContext - Status Check:', {
      hookResult,
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
    if (hookResult) {
      localStorage.setItem('emailSetupComplete', 'true');
    }
  }, [hookResult, user?.emailVerificationStatus, user?.senderEmail, user?.companyName]);

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