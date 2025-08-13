# Email Setup System Documentation

## Overview
This document describes the complete email setup system for Eazee Invoice, which allows users to send professional invoices, quotes, and statements directly via email with PDF attachments using Brevo API integration.

## System Architecture

### Frontend Components
- **EmailSetupNew.tsx** - Main email setup page with clean, working implementation
- **EmailSendButton.tsx** - Component for sending emails from document lists
- **EmailSettings.tsx** - Legacy email settings page (kept for reference)

### Backend Integration
- **Brevo API** - Handles email sending and sender verification
- **Database** - Stores user email verification status
- **Session Management** - Tracks user authentication for email operations

## How It Works

### 1. Email Verification Flow
```
User enters email → Brevo sends verification code → User enters code → Email verified → Ready to send
```

### 2. Database Fields
- `senderEmail` - The verified business email address
- `isEmailVerified` - Boolean flag for verification status
- `emailVerificationStatus` - Additional status tracking

### 3. API Endpoints
- `POST /api/setup-auto-email` - Initiates email setup and sends verification code
- `POST /api/verify-sender-otp` - Verifies the OTP code from Brevo
- `DELETE /api/delete-sender` - Removes email setup
- `GET /api/me` - Returns user data including email verification status

### 4. Frontend Logic
```typescript
// Correct way to access user data from API response
const { data: response } = useQuery({
  queryKey: ['/api/me'],
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
});

const user = response?.user; // Important: API returns { user: {...} }

// Check verification status
const isEmailSetup = Boolean(user?.senderEmail);
const isEmailVerified = user?.isEmailVerified === true;
```

## Key Features

### Email Setup States
1. **No Email Setup** - Shows setup form
2. **Email Pending Verification** - Shows OTP verification form
3. **Email Verified & Ready** - Shows success state with change option

### Email Templates
- Customizable templates for invoices, quotes, and statements
- Variables: `{customerName}`, `{companyName}`, `{documentNumber}`, etc.
- Stored in localStorage for user preferences

### Security Features
- OTP codes expire in 2-3 minutes
- Sender verification through Brevo
- Email addresses must be verified before sending
- Session-based authentication required

## Technical Implementation

### Server Response Format
```javascript
// /api/me endpoint returns:
{
  "user": {
    "id": 1,
    "senderEmail": "user@company.com",
    "isEmailVerified": true,
    "emailVerificationStatus": "verified",
    // ... other user fields
  }
}
```

### Frontend Data Access
```typescript
// CORRECT - Access through response.user
const user = response?.user;
const isVerified = user?.isEmailVerified;

// INCORRECT - Direct access (doesn't work)
const isVerified = response?.isEmailVerified;
```

### Cache Management
```typescript
// Force fresh data on every load
const queryConfig = {
  staleTime: 0,
  gcTime: 0,
  refetchOnWindowFocus: true,
  refetchOnMount: true,
};
```

## Email Sending Process

### 1. Document Generation
- HTML to PDF conversion using html2pdf.js
- Company branding and logo included
- Professional formatting

### 2. Email Composition
- Subject line from templates
- Body text with variable replacement
- PDF attachment
- Reply-to set to user's business email

### 3. Brevo Integration
- Authenticated sender verification
- Professional email delivery
- Delivery tracking and reporting

## Troubleshooting

### Common Issues

#### Email Shows "Setup Required" Despite Verification
**Cause**: Frontend not accessing API response correctly
**Solution**: Ensure `user = response?.user` structure

#### OTP Verification Fails
**Cause**: Code expired or incorrect format
**Solution**: Codes expire in 2-3 minutes, request new code

#### Email Not Sending
**Cause**: Sender not verified in Brevo
**Solution**: Check verification status and re-verify if needed

### Debug Information
Server logs show user data:
```
🔍 User data from storage: {
  companyName: 'Your Business Name Here',
  isEmailVerified: true,
  senderEmail: 'fyobl_ben@hotmail.com',
  emailVerificationStatus: 'verified'
}
```

## File Locations

### Frontend Files
- `client/src/pages/EmailSetupNew.tsx` - Main email setup page
- `client/src/components/Email/EmailSendButton.tsx` - Email sending component
- `client/src/lib/emailUtils.ts` - Email template utilities

### Backend Files
- `server/routes.ts` - API endpoints for email operations
- `server/emailSender.ts` - Brevo integration
- `server/storage.ts` - Database operations

### Navigation
- Added to sidebar: "Email Setup (New)"
- Route: `/email-setup-new`
- Protected route requiring authentication

## Success Criteria
When working correctly:
1. User with verified email sees "Email Setup Complete!"
2. Email address displayed: `fyobl_ben@hotmail.com`
3. Can send emails from all document types
4. Professional email delivery with PDFs attached

## Maintenance Notes
- Keep Brevo API credentials updated
- Monitor email delivery rates
- Update templates as needed
- Maintain sender verification status

---
*Last Updated: August 13, 2025*
*Status: Working and Documented*