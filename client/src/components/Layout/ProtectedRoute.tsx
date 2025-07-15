import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, userData, loading, hasAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
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
