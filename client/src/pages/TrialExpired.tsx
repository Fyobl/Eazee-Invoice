import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/auth';

export const TrialExpired = () => {
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
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Trial Expired</h1>
            
            <p className="text-slate-600 mb-6">
              Your 7-day free trial has expired. Please upgrade to continue using InvoicePro.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Trial started on {userData?.trialStartDate && new Date(userData.trialStartDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg">
                Upgrade to Pro
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
                Need help? Contact our support team for assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
