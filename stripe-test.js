// Test script to verify Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeAccount() {
  try {
    console.log('Testing Stripe account configuration...');
    
    // Test 1: Get account info
    const account = await stripe.accounts.retrieve();
    console.log('Account ID:', account.id);
    console.log('Account charges enabled:', account.charges_enabled);
    console.log('Account payouts enabled:', account.payouts_enabled);
    console.log('Account capabilities:', account.capabilities);
    
    // Test 2: Create a simple customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer'
    });
    console.log('Test customer created:', customer.id);
    
    // Test 3: Try to create a SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session'
    });
    console.log('SetupIntent created:', setupIntent.id);
    console.log('SetupIntent status:', setupIntent.status);
    console.log('SetupIntent client_secret present:', !!setupIntent.client_secret);
    
    // Clean up
    await stripe.customers.del(customer.id);
    console.log('Test customer deleted');
    
  } catch (error) {
    console.error('Stripe test error:', error.message);
    if (error.type) {
      console.error('Error type:', error.type);
      console.error('Error code:', error.code);
    }
  }
}

testStripeAccount();