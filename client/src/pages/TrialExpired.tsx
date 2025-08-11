import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useState } from 'react';

export const TrialExpired = () => {
  const { userData } = useAuth();
  const [, navigate] = useLocation();
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('monthly');

  const handleLogout = async () => {
    await logoutUser();
  };

  const handleSubscribe = () => {
    navigate('/subscribe');
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
            
            <h1 className="text-2xl font-bold text-slate-500 mb-2">Trial Expired</h1>
            
            <p className="text-slate-600 mb-6">
              Your 7-day free trial has expired. Please upgrade to continue using Eazee Invoice.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <p className="text-sm text-amber-800">
                  Trial started on {userData?.trialStartDate && new Date(userData.trialStartDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                <button 
                  onClick={() => setBillingFrequency('monthly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingFrequency === 'monthly' 
                      ? 'bg-primary text-white' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setBillingFrequency('yearly')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingFrequency === 'yearly' 
                      ? 'bg-primary text-white' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Yearly
                </button>
              </div>
              {billingFrequency === 'yearly' && (
                <div className="ml-3 text-sm">
                  <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 px-2 py-1 rounded-full font-medium">
                    Save 10%
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={handleSubscribe}>
                Upgrade to Pro - {billingFrequency === 'monthly' ? '£5.99/month' : '£64.69/year'}
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
