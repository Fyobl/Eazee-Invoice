import { useQuery } from '@tanstack/react-query';

export const useEmailSetupSimple = () => {
  // Always fetch fresh user data on every call
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['/api/me'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const user = (response as any)?.user;
  
  // Direct validation based on server data - no cache, no localStorage complications
  const isEmailSetupComplete = Boolean(
    user?.emailVerificationStatus === 'verified' && 
    user?.senderEmail && 
    user?.companyName
  );

  console.log('🔍 Simple Email Setup Check:', {
    isComplete: isEmailSetupComplete,
    emailStatus: user?.emailVerificationStatus,
    hasSender: Boolean(user?.senderEmail),
    hasCompany: Boolean(user?.companyName),
    fullUser: user
  });

  return {
    isEmailSetupComplete,
    user,
    isLoading,
    refetch
  };
};