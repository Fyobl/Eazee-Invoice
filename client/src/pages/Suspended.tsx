import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Ban } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/auth';

export const Suspended = () => {
  const { userData } = useAuth();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>
            
            <p className="text-slate-600 mb-6">
              Your account has been suspended. Please contact support for more information.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-800">
                  Account: {userData?.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                If you believe this is an error, please reach out to our support team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
