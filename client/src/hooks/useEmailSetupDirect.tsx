import { useState, useEffect } from 'react';

interface User {
  emailVerificationStatus?: string;
  senderEmail?: string;
  companyName?: string;
  isEmailVerified?: boolean;
}

export const useEmailSetupDirect = () => {
  const [isEmailSetupComplete, setIsEmailSetupComplete] = useState(false);
  const [showEmailSetup, setShowEmailSetup] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  // Fetch user data directly without cache complications
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const user = data.user as User;
        setUserData(user);
        
        // Simple validation: if senderEmail exists, setup is complete
        const isComplete = Boolean(user?.senderEmail && user?.senderEmail.length > 0);
        
        console.log('✅ Email Setup Status:', {
          isComplete,
          senderEmail: user?.senderEmail,
          rule: 'senderEmail exists = setup complete'
        });
        
        setIsEmailSetupComplete(isComplete);
        
        // Update localStorage for backup
        if (isComplete) {
          localStorage.setItem('emailSetupComplete', 'true');
        } else {
          localStorage.removeItem('emailSetupComplete');
        }
      } else {
        console.error('Failed to fetch user data:', response.status);
        // Use localStorage backup if API fails
        const backup = localStorage.getItem('emailSetupComplete') === 'true';
        setIsEmailSetupComplete(backup);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Use localStorage backup if network fails
      const backup = localStorage.getItem('emailSetupComplete') === 'true';
      setIsEmailSetupComplete(backup);
    }
  };

  // Fetch on mount and when needed
  useEffect(() => {
    fetchUserData();
  }, []);

  const showEmailSetupModal = () => {
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
    localStorage.setItem('emailSetupComplete', 'true');
    setIsEmailSetupComplete(true);
    setShowEmailSetup(false);
    // Refresh user data after marking complete
    setTimeout(fetchUserData, 500);
  };

  return {
    isEmailSetupComplete,
    showEmailSetup,
    setShowEmailSetup,
    showEmailSetupModal,
    closeEmailSetupModal,
    markEmailSetupComplete,
    refreshUserData: fetchUserData,
    userData
  };
};