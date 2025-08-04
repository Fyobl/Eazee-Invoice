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

const PaymentForm = ({ clientSecret, paymentIntentId }: { clientSecret: string; paymentIntentId: string }) => {
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
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isLoading} className="w-full" size="lg">
        {isLoading ? 'Processing...' : 'Subscribe - £19.99/month'}
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

  useEffect(() => {
    if (currentUser) {
      createPaymentIntent();
    } else {
      // Stop loading if no user is authenticated
      setIsLoading(false);
    }
  }, [currentUser]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                <span className="text-2xl font-bold text-green-600">£19.99/month</span>
                <span className="text-gray-500 ml-2">• Cancel anytime</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
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