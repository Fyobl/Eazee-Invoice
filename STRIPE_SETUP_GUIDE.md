# Complete Stripe Setup Guide for Live Account

## Step 1: Check Your Stripe Account Status

1. **Log into your Stripe Dashboard**: https://dashboard.stripe.com/
2. **Check the top banner** - look for any warnings or verification requirements
3. **Go to Settings > Account** and verify:
   - Business information is complete
   - Bank account is verified
   - Identity verification is complete
   - Tax information is submitted

## Step 2: Account Verification Requirements

Your live account may need:
- **Business verification**: Company registration details
- **Identity verification**: Government ID for business owners
- **Bank account verification**: Business bank account details
- **Address verification**: Proof of business address
- **Website review**: Your live website URL and business description

## Step 3: Enable Required Capabilities

Go to **Settings > Capabilities** and ensure these are enabled:
- ✅ **Card payments** - For credit/debit card processing
- ✅ **Payment Methods** - For various payment types
- ✅ **Subscriptions** - For recurring billing (REQUIRED for your app)

## Step 4: Get Your API Keys

1. Go to **Developers > API keys**
2. Toggle to **Live mode** (top right)
3. Copy these keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

## Step 5: Common Issues & Solutions

### Issue: "This account cannot currently make live charges"
**Solution**: Complete business verification in Dashboard

### Issue: "Your account has restricted capabilities"
**Solution**: Contact Stripe support with business documents

### Issue: "Payment processing unavailable"
**Solution**: Verify bank account and complete tax forms

### Issue: API calls returning 400 errors
**Solution**: Account verification incomplete - check Dashboard alerts

## Step 6: Test Mode First (Recommended)

Before going live, let's test with Stripe test mode:
1. Use **test API keys** (pk_test_ and sk_test_)
2. Test with card number: `4242 4242 4242 4242`
3. Once working, switch to live keys

## What I Need From You

Please check your Stripe Dashboard and tell me:
1. ✅ Are there any red warnings or alerts at the top?
2. ✅ What does "Settings > Account" show for verification status?
3. ✅ Are "Subscriptions" enabled in "Settings > Capabilities"?
4. ✅ Do you see both live API keys in "Developers > API keys"?

Once you confirm these, I'll update your app with the correct configuration.