# replit.md

## Overview
This is a full-featured SaaS invoice management application built to help freelancers manage invoices, quotes, statements, customers, and products. It includes robust PDF generation, a trial-based subscription model, user authentication, and role-based access control. The project aims to provide a comprehensive solution for financial document management with a focus on ease of use and professional output.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API (authentication), TanStack Query (server state)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Design Philosophy**: Responsive, mobile-first approach with modal-based interactions and toast notifications. Comprehensive dark mode support across the application.

### Backend
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: PostgreSQL-based with bcrypt password hashing
- **API Layer**: Express.js server with secure authentication endpoints
- **Session Management**: express-session with connect-pg-simple
- **User Roles**: Trial, Subscriber, Admin. Access control is context-based with route protection and trial expiration checks.

### Core Features
- **User & Subscription Management**: Trial system (7-day access), subscription flag-based access control, admin panel for user management (creation, suspension, subscription granting, permanent subscription option, deletion with full data cleanup). Stripe integration for monthly billing (£19.99/month GBP) with webhook support and subscription management UI.
- **Document Management**: Creation, tracking, and management of invoices, quotes, and statements. Features include PDF export (html2pdf.js), soft deletion with a 7-day recovery period, and status management (Invoices: Unpaid, Paid, Overdue; Quotes: Draft, Sent, Accepted). Quote-to-invoice conversion. Statements include snapshot system for immutability and historical data preservation.
- **Customer & Product Management**: Comprehensive customer profiles and product catalogs with pricing and tax rates. CSV import/export functionality for bulk data management (customers and products). Searchable customer and product selection in forms.
- **Reporting**: Comprehensive business reports including VAT, Top Customers, Best Sellers, and Period Takings reports. All reports include PDF export and customizable date range selection.
- **Email Integration**: Ability to email invoices, quotes, and statements. Generates PDFs, downloads automatically, and pre-fills email client. Customizable email templates with variable replacement. Password reset functionality via Brevo email service with secure token-based verification.
- **Company Branding**: Per-user company branding (logo, name, address) for all generated documents and emails.
- **Dashboard**: Redesigned 2x3 grid layout including a welcome message and local weather integration (Open-Meteo API).
- **Help Page**: Comprehensive help page with step-by-step instructions, visual workflow diagrams, interactive demos, and feature highlights.
- **System Resilience**: Automatic restart mechanism for database connection failures, database health monitoring, and exponential backoff retry for failed operations. Global error handling and specific solutions for WebFrameMain errors in the Replit environment.

## External Dependencies
- **Stripe**: For subscription management and payment processing.
- **Brevo (SendInBlue)**: Email service for sending password reset emails and other transactional emails.
- **Open-Meteo API**: For local weather data integration on the dashboard (no API key required).
- **html2pdf.js**: For client-side PDF generation from HTML.
- **Radix UI**: Accessible component primitives for UI.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library.

## Recent Updates

### August 4, 2025 - Push Notification System for New Subscriptions
- **Comprehensive Notification System**: Implemented multi-platform push notifications when users subscribe
- **Webhook Integration**: Enhanced Stripe webhook handler to trigger notifications on new subscription creation
- **Multiple Service Support**: Supports Pushover (recommended), Telegram, and Discord notifications simultaneously
- **Admin Test Feature**: Added "Test Notification" button in admin panel payment settings for easy setup verification
- **Background Processing**: Notifications sent asynchronously to avoid blocking webhook responses
- **Setup Documentation**: Created comprehensive NOTIFICATION_SETUP.md guide with step-by-step instructions
- **Rich Notification Content**: Includes customer name, email, subscription amount, and UK timezone timestamp
- **Error Handling**: Graceful failure handling with detailed logging for troubleshooting
- **Environment Configuration**: Uses environment variables for secure API key management (PUSHOVER_*, TELEGRAM_*, DISCORD_*)

### August 4, 2025 - Country Flags & UI Enhancement
- **Country Flag Feature**: Replaced user initials with country flags in admin panel user list
- **Database Schema**: Added country field to users table with ISO country codes (defaults to GB)
- **Flag Display**: Unicode country flags displayed instead of circular initials for better visual identification
- **International Support**: Added comprehensive country flag mapping for 40+ countries
- **User Data Enhancement**: Set realistic country codes for existing users based on their profiles

### August 4, 2025 - Admin Stripe Mode Toggle & Subscription Data Cleanup
- **Stripe Mode Toggle**: Added admin-only toggle to switch between live and test Stripe modes in admin panel
- **System Settings Table**: Created new system_settings table to store configuration like stripe_mode
- **API Endpoints**: Added `/api/stripe-mode` endpoints for getting/setting payment mode (admin only)
- **Subscription Data Fix**: Corrected subscription end dates to be realistic for monthly billing (30 days) vs admin grants (permanent)
- **User Cleanup**: Removed 13 test users created during development, keeping only legitimate accounts
- **Database Integrity**: Fixed "N/A" subscription expiry display issue with proper date handling

### August 4, 2025 - Complete Stripe Subscription System Rebuild (PaymentIntent Approach)
- **Fresh Implementation**: Completely rebuilt Stripe subscription system using PaymentIntent approach instead of SetupIntent
- **Key Mismatch Resolution**: Fixed client_secret mismatch errors that were causing 400 errors from api.stripe.com
- **Live Key Configuration**: Properly configured live Stripe keys (pk_live_ and sk_live_) with verified account (acct_1RlU9WJfs8qCR8mt)
- **Account Verification**: Confirmed Stripe account is fully active with charges and payouts enabled, all capabilities active
- **New Endpoint**: Created `/subscribe-new` route with clean PaymentIntent implementation
- **Error Elimination**: Eliminated all SetupIntent-related 400 errors by switching to PaymentIntent for subscription setup
- **Server Diagnostics**: Added comprehensive Stripe account diagnostics on server startup
- **Fresh Components**: Built new SubscribeNew.tsx component with proper useAuth integration

### August 4, 2025 - Admin Password Management & Help Page Updates
- **Admin Password Management**: Added comprehensive admin password management functionality with two options:
  - Send password reset emails to users (generates secure reset tokens via Brevo)
  - Directly set new passwords for users (immediate password change)
- **UI Integration**: Password management options integrated into admin panel dropdown menu alongside other admin actions
- **Help Page Enhancement**: Added support contact details (support@eazeeinvoice.com) prominently at the top of help page
- **Product Management Documentation**: Updated help page to include comprehensive bulk CSV upload instructions for products section
- **Security Features**: Admin-only access controls with proper validation and error handling for password management operations

### August 2, 2025 - Password Reset System Implementation (Brevo Integration)
- **Complete Password Reset Flow**: Implemented secure password reset functionality using email-based token verification
- **Brevo Email Service Integration**: Integrated Brevo (formerly SendInBlue) email service for sending password reset emails with professional HTML templates
- **Secure Token System**: Added password reset tokens table with 1-hour expiration, one-time use validation, and secure token generation
- **Frontend Components**: Created forgot password and reset password pages with proper validation, error handling, and user feedback
- **Email Templates**: Designed professional email templates with security warnings, clear instructions, and branded styling
- **Database Schema**: Added passwordResetTokens table with proper relationships and automatic cleanup of expired tokens
- **API Endpoints**: Implemented `/api/forgot-password`, `/api/reset-password`, and `/api/validate-reset-token` endpoints with comprehensive error handling
- **User Experience**: Added "Forgot your password?" link to login page and seamless flow between reset pages

### August 1, 2025 - Login Issue Fix (Production Deployment)
- **Session Cookie Configuration Fix**: Fixed login issue where users couldn't stay logged in on deployed sites due to improper session cookie configuration
- **HTTPS-Only Cookie Problem**: Previously session cookies were set to `secure: true` in production, requiring HTTPS which caused login failures on non-HTTPS deployments
- **Flexible Cookie Security**: Updated session configuration to only use secure cookies when HTTPS is explicitly enabled or detected (via HTTPS_ENABLED environment variable)
- **Session Persistence Enhancement**: Added `rolling: true` to session configuration to extend session on each request, improving user experience
- **Better Cookie Compatibility**: Added `sameSite: 'lax'` for better cross-site compatibility while maintaining security
- **Production Debugging**: Added comprehensive session debugging for production troubleshooting
- **Multer Security Update**: Verified application functionality after multer dependency security update - all file upload features working correctly