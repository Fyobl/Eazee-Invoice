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
import { StripeProvider } from '@/components/StripeProvider';
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
// Initialize Stripe with proper configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ clientSecret, subscriptionData }: { 
  clientSecret: string;
  subscriptionData?: any;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { currentUser, userData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      if (subscriptionData?.isSetupIntent) {
        // Setup Intent flow for collecting payment method
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/dashboard`,
          },
          redirect: 'if_required'
        });

        if (error) {
          console.error('Setup error:', error);
          toast({
            title: "Payment Setup Failed",
            description: error.message || 'There was an error setting up your payment method',
            variant: "destructive",
          });
        } else if (setupIntent && setupIntent.status === 'succeeded') {
          // Complete the subscription
          const response = await fetch('/api/complete-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              setupIntentId: subscriptionData.setupIntentId,
              customerId: subscriptionData.customerId,
              priceId: subscriptionData.priceId,
              uid: currentUser?.uid
            })
          });

          const result = await response.json();

          if (result.success) {
            toast({
              title: "Subscription Active!",
              description: "Your subscription is now active. Welcome to Pro!",
            });
            
            // Redirect after a short delay
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          } else {
            throw new Error(result.details || 'Failed to complete subscription');
          }
        }
      } else {
        // Legacy PaymentIntent flow
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
      }
    } catch (error) {
      console.error('Stripe error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : 'There was an unexpected error. Please try again.',
        variant: "destructive",
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
        
        {userData?.isAdmin && (
          <>
            <Button 
              type="button"
              onClick={handleFakePayment}
              disabled={isLoading}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {isLoading ? 'Processing...' : 'Test Payment (Admin Only) - £19.99/month'}
            </Button>
            
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Admin test: Simulate successful payment without charging a card
            </p>
          </>
        )}
      </div>
    </form>
  );
};

export const Subscribe = () => {
  const { userData, currentUser, isAdminGrantedSubscriptionExpired } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
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
      
      // If user is not a subscriber OR has cancelled subscription, show re-subscribe form
      if (!data.isSubscriber || data.status === 'cancelled') {
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
    console.log('Starting createSubscription...', { currentUser: currentUser?.uid, userData: userData?.firstName });
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

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Subscription API response:', data);
      
      if (data.clientSecret) {
        console.log('Setting clientSecret:', data.clientSecret);
        console.log('Current state before update - loading:', loading, 'clientSecret:', clientSecret);
        setClientSecret(data.clientSecret);
        setSubscriptionData(data);
        setLoading(false); // Set loading false here when we have client secret
        console.log('State updated - should show payment form now');
      } else {
        console.error('No clientSecret in response:', data);
        throw new Error(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      
      // Try to extract more detailed error information
      let errorMessage = "Failed to initialize subscription. Please try again.";
      
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          errorMessage = errorData.details || errorData.error || errorMessage;
          console.error('Detailed error:', errorData);
        } catch {
          errorMessage = `Server error: ${error.status}`;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLoading(false); // Only set loading false on error
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

  // If user is already subscribed and not cancelled, show subscription management
  if (subscriptionStatus?.isSubscriber && subscriptionStatus?.status !== 'cancelled') {
    return (
      <Layout title="Subscription Management">
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
    <StripeProvider clientSecret={clientSecret}>
      <Layout title="Upgrade to Pro">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Upgrade to Pro</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Continue enjoying all features with our monthly subscription
        </p>
      </div>

      {/* Special message for expired admin-granted subscriptions */}
      {isAdminGrantedSubscriptionExpired && (
        <div className="mb-8">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Your complimentary subscription has expired
                </h3>
              </div>
              <p className="text-orange-700 dark:text-orange-300 mb-4">
                Your admin-granted subscription has reached its expiration date. To continue using Eazee Invoice Pro, 
                please subscribe with your payment details below.
              </p>
              <div className="text-sm text-orange-600 dark:text-orange-400">
                <strong>Note:</strong> This will be a recurring subscription at £19.99/month
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
            {(() => {
              console.log('Render - clientSecret:', clientSecret, 'loading:', loading);
              return clientSecret ? (
                <SubscribeForm clientSecret={clientSecret} subscriptionData={subscriptionData} />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Setting up your subscription...
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
          </div>
        </div>
      </Layout>
    </StripeProvider>
  );
};