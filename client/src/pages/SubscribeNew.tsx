import { FormEvent, useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout/Layout';
import { CheckCircle, Star } from 'lucide-react';

// Fresh Stripe initialization - using live keys
const stripePromise = loadStripe('pk_live_51RlU9WJfs8qCR8mtjprd7cMgGSOTXQgkOdoNIIyhH26RofzXQUkiHVKh8TjaGvpk4xcH8iZb9PHMYDUGQs2z18jN00Pg9lqxKK');

const PaymentForm = ({ clientSecret, paymentIntentId, billingFrequency }: { clientSecret: string; paymentIntentId: string; billingFrequency: 'monthly' | 'yearly' }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        const response = await fetch('/api/confirm-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        const data = await response.json();
        if (data.success) {
          toast({
            title: "Welcome to Pro!",
            description: "Your subscription is now active.",
          });
          setTimeout(() => window.location.href = '/dashboard', 1500);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment failed. Please try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const handleAdminTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fake-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Test Subscription Active!" });
        setTimeout(() => window.location.href = '/dashboard', 1500);
      }
    } catch (error) {
      toast({ title: "Test failed", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement 
        options={{
          layout: 'tabs'
        }}
      />
      <div className="text-sm text-gray-600 text-center">
        <p>💳 Secure payment powered by Stripe</p>
      </div>
      <Button type="submit" disabled={!stripe || isLoading} className="w-full" size="lg">
{isLoading ? 'Processing...' : `Subscribe - ${billingFrequency === 'monthly' ? '£5.99/month' : '£64.69/year'}`}
      </Button>
      {currentUser?.isAdmin && (
        <Button type="button" onClick={handleAdminTest} variant="outline" className="w-full">
          Admin Test Payment
        </Button>
      )}
    </form>
  );
};

export default function SubscribeNew() {
  const { currentUser } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (currentUser) {
      createPaymentIntent();
    } else {
      // Stop loading if no user is authenticated
      setIsLoading(false);
    }
  }, [currentUser, billingFrequency]); // Re-create payment intent when billing frequency changes

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingFrequency })
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Layout title="Subscribe to Pro">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Setting up payment...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Subscribe to Pro">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Subscribe to Pro</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Please log in to access subscription features
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              size="lg"
            >
              Login to Continue
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Subscribe to Pro">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Upgrade to Pro
          </h1>
          <p className="text-xl text-muted-foreground">
            Unlock unlimited invoices and premium features
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Pro Features
              </CardTitle>
              <CardDescription>Everything you need to manage your business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                'Unlimited invoices and quotes',
                'Professional PDF generation',
                'Customer management system',
                'Product catalog',
                'Business analytics',
                'Email integration',
                'Priority support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle>Start Your Subscription</CardTitle>
              <CardDescription>
                {/* Billing Toggle */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1 shadow-sm">
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
                  <div className="ml-3 text-sm">
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full font-medium">
                      Save 10%
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-600">
                    {billingFrequency === 'monthly' ? '£5.99/month' : '£64.69/year'}
                  </span>
                  <span className="text-gray-500 ml-2">• Cancel anytime</span>
                  {billingFrequency === 'yearly' && (
                    <div className="text-sm text-green-600 mt-2">
                      Save £7.19 per year (10% off monthly)
                    </div>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientSecret ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#3b82f6'
                      }
                    }
                  }}
                >
                  <PaymentForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} billingFrequency={billingFrequency} />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to initialize payment. Please refresh the page.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}