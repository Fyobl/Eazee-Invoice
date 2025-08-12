
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { PasswordChangeDialog } from '../PasswordChangeDialog';
import { SubscriptionRenewalDialog } from '../SubscriptionRenewalDialog';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, userData, loading, hasAccess, mustChangePassword, isSubscriber, trialDaysLeft, isAdminGrantedSubscriptionExpired } = useAuth();
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  
  // Check if subscription is expired and user is not on trial
  const isSubscriptionExpired = userData && !isSubscriber && trialDaysLeft === 0 && !userData.isAdmin;
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Redirect to="/login" />;
  }

  if (userData?.isSuspended) {
    return <Redirect to="/suspended" />;
  }

  // Check if admin-granted subscription has expired
  if (isAdminGrantedSubscriptionExpired) {
    return <Redirect to="/subscribe" />;
  }

  if (!hasAccess) {
    return <Redirect to="/trial-expired" />;
  }

  // Check if user needs to change password
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        <PasswordChangeDialog 
          open={true} 
          onClose={() => {}} 
        />
        {children}
      </div>
    );
  }

  // Show subscription renewal dialog if subscription is expired
  if (isSubscriptionExpired) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
        <SubscriptionRenewalDialog 
          open={true} 
          onClose={() => setShowRenewalDialog(false)} 
        />
        {children}
      </div>
    );
  }

  return <>{children}</>;
};
