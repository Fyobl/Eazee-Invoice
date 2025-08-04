import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
}

export const StripeProvider = ({ children, clientSecret }: StripeProviderProps) => {
  console.log('StripeProvider - clientSecret received:', clientSecret ? 'present' : 'missing');
  console.log('StripeProvider - clientSecret starts with:', clientSecret?.substring(0, 20));
  
  const options = clientSecret ? { 
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    }
  } : {};
  
  console.log('StripeProvider - options:', options);
  
  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};