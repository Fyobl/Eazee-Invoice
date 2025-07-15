import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, userData, loading, hasAccess } = useAuth();

  // Check if we have stored auth data while Firebase Auth is initializing
  const storedAuthUser = localStorage.getItem('authUser');
  const storedUserData = localStorage.getItem('userData');

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

  // If no current user but we have stored auth data, show loading instead of redirecting
  if (!currentUser && storedAuthUser && storedUserData) {
    console.log('Protected route: No current user but stored data found, showing restore session');
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('Protected route: No current user, redirecting to landing page');
    return <Redirect to="/" />;
  }

  if (userData?.isSuspended) {
    return <Redirect to="/suspended" />;
  }

  if (!hasAccess) {
    return <Redirect to="/trial-expired" />;
  }

  return <>{children}</>;
};
