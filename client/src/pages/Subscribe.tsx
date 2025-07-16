import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, CreditCard, Shield, Clock, Users, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Initialize Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to Eazee Invoice Pro!",
      });
    }

    setIsLoading(false);
  };

  const handleFakePayment = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/fake-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser?.uid,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Force sync user data to update auth context
        await fetch('/api/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: currentUser?.uid,
            email: currentUser?.email,
            displayName: currentUser?.displayName,
          }),
        });
        
        toast({
          title: "Payment Successful (Test Mode)",
          description: "Your subscription has been activated!",
        });
        
        // Redirect to dashboard after fake payment and force refresh
        setTimeout(() => {
          window.location.href = '/dashboard';
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data.error || 'Failed to process fake payment');
      }
    } catch (error) {
      console.error('Error processing fake payment:', error);
      toast({
        title: "Error",
        description: "Failed to process fake payment. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="space-y-3">
        <Button 
          type="submit" 
          disabled={!stripe || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? 'Processing...' : 'Subscribe to Pro - £19.99/month'}
        </Button>
        
        <Button 
          type="button"
          onClick={handleFakePayment}
          disabled={isLoading}
          className="w-full"
          size="lg"
          variant="outline"
        >
          {isLoading ? 'Processing...' : 'Test Payment (Fake) - £19.99/month'}
        </Button>
        
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          Use the "Test Payment" button to simulate a successful payment without charging a card
        </p>
      </div>
    </form>
  );
};

export const Subscribe = () => {
  const { userData, currentUser } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser && userData) {
      fetchSubscriptionStatus();
    }
  }, [currentUser, userData]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch(`/api/subscription-status?uid=${currentUser?.uid}`);
      const data = await response.json();
      setSubscriptionStatus(data);
      
      if (!data.isSubscriber) {
        // Create subscription if user is not a subscriber
        createSubscription();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser?.uid,
          email: currentUser?.email,
          firstName: userData?.firstName,
          lastName: userData?.lastName,
        }),
      });

      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to initialize subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser?.uid,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Subscription Canceled",
          description: data.message,
        });
        fetchSubscriptionStatus();
        
        // Force a page refresh to update the auth context immediately
        // This will cause the user to be redirected to the subscription warning page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If user is already subscribed, show subscription management
  if (subscriptionStatus?.isSubscriber) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Subscription Management</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your Eazee Invoice Pro subscription
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Active Subscription
            </CardTitle>
            <CardDescription>
              You're currently subscribed to Eazee Invoice Pro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Plan:</span>
              <Badge>Eazee Invoice Pro - £19.99/month</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={subscriptionStatus.status === 'active' ? 'default' : 'secondary'}>
                {subscriptionStatus.status}
              </Badge>
            </div>
            {subscriptionStatus.currentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span>Next billing date:</span>
                <span className="font-medium">
                  {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="w-full"
                  >
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Cancel Subscription
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? Your subscription will remain active until the end of the current billing period, after which you'll lose access to all Pro features.
                      <br /><br />
                      <strong>This action cannot be undone.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCancelSubscription}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
      </Layout>
    );
  }

  // Show subscription signup form
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Upgrade to Pro</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Continue enjoying all features with our monthly subscription
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Pro Features</CardTitle>
            <CardDescription>
              Everything you need to manage your invoicing business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Unlimited Invoices & Quotes</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create unlimited invoices, quotes, and statements
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Customer Management</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Manage unlimited customers and products
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Professional PDFs</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Generate professional PDF documents with your branding
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Email Integration</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Send invoices and quotes directly via email
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Business Analytics</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Track revenue, customer analytics, and reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Subscribe Now</CardTitle>
            <CardDescription>
              Only £19.99/month - Cancel anytime
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm clientSecret={clientSecret} />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  Setting up your subscription...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </Layout>
  );
};