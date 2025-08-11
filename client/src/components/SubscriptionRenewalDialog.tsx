import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionRenewalDialogProps {
  open: boolean;
  onClose: () => void;
}

export const SubscriptionRenewalDialog = ({ open, onClose }: SubscriptionRenewalDialogProps) => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRenewSubscription = () => {
    setLoading(true);
    // Redirect to subscription page
    window.location.href = '/subscribe';
  };

  const handleFakeRenewal = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fake-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: userData?.uid,
        }),
      });

      if (response.ok) {
        // Force sync user data to update auth context
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userData?.uid,
            email: userData?.email,
            displayName: userData?.displayName,
          }),
        });
        
        // Refresh the page to update auth state
        window.location.reload();
      }
    } catch (error) {
      console.error('Error renewing subscription:', error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Subscription Renewal Required
          </DialogTitle>
          <DialogDescription>
            Your subscription has expired. Please renew to continue using Eazee Invoice Pro.
          </DialogDescription>
        </DialogHeader>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Renew Subscription</CardTitle>
            <CardDescription>
              Continue enjoying all features with our monthly subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-center">
              <span className="text-2xl font-bold">£5.99</span>
              <span className="text-slate-600 dark:text-slate-400">/month</span>
            </div>
            
            <Button 
              onClick={handleRenewSubscription}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Renew Subscription'}
            </Button>
            
            <Button 
              onClick={handleFakeRenewal}
              disabled={loading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {loading ? 'Processing...' : 'Test Renewal (Fake)'}
            </Button>
            
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Your data will be preserved while your subscription is inactive
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};