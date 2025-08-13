# replit.md

## Overview
This project is a comprehensive SaaS invoice management application designed for freelancers. It provides tools for managing invoices, quotes, statements, customers, and products. Key capabilities include robust PDF generation, a trial-based subscription model, secure user authentication, and role-based access control. The primary goal is to offer an intuitive and professional solution for financial document management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/UX**: Tailwind CSS with shadcn/ui components, focusing on a responsive, mobile-first design. Interactions are primarily modal-based with toast notifications and full dark mode support.
- **State Management**: React Context API for authentication, TanStack Query for server state.
- **Forms**: React Hook Form with Zod validation.
- **Routing**: Wouter.

### Backend
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: PostgreSQL-based with bcrypt password hashing and secure Express.js endpoints.
- **Session Management**: express-session with connect-pg-simple.
- **User Roles**: Trial, Subscriber, Admin, with context-based access control and trial expiration checks.
- **Technical Implementations**: Automatic restart for database connection failures, database health monitoring, exponential backoff retry, and global error handling with specific solutions for Replit environment issues.

### Core Features
- **User & Subscription Management**: 7-day trial system, flag-based access control, admin panel for full user lifecycle management (creation, suspension, subscription granting, permanent subscription, deletion). Integrated Stripe for monthly billing (£5.99/month GBP) with webhook support.
- **Document Management**: Creation, tracking, and management of invoices, quotes, and statements. Features include HTML-to-PDF export, soft deletion with recovery, status management (e.g., Invoices: Unpaid, Paid, Overdue), quote-to-invoice conversion, and immutable statement snapshots.
- **Customer & Product Management**: Comprehensive profiles and catalogs with pricing and tax rates. Supports CSV import/export for bulk data and searchable selection in forms.
- **Reporting**: Business reports including VAT, Top Customers, Best Sellers, and Period Takings, all with PDF export and customizable date ranges.
- **Email Integration**: Ability to email documents (PDFs generated and attached), pre-fill email clients, and customizable templates. Password reset functionality via Brevo using secure token-based verification. Automated welcome emails for new user registration with comprehensive platform information.
- **Company Branding**: Per-user branding (logo, name, address) on all generated documents and emails.
- **Dashboard**: Redesigned 2x3 grid with welcome message and local weather integration.
- **Help Page**: Comprehensive help page with instructions, diagrams, demos, and feature highlights.
- **User Onboarding**: Interactive setup checklist with 7 guided tasks (company branding, logo upload, customers, products, quotes, invoices, conversions). Features automatic completion detection, dismissible interface, and progress tracking via dedicated database table.

### System Design Choices
- Structured address forms for customer data.
- Enhanced customer schema with separate "Business Name" and "Contact Name" fields.
- Implemented consistent layout optimization using max-width containers and responsive grid enhancements.
- Admin panel includes accurate user statistics by excluding deleted items.
- Implemented a complete footer and company information pages (About Us, Privacy Policy, Terms of Service, Support).
- Configured real-time push notifications for new subscriptions (Pushover, Telegram, Discord).
- Display country flags instead of initials in the admin user list.
- Admin-only toggle for Stripe live/test mode.
- Rebuilt Stripe subscription system using the PaymentIntent approach for reliability.
- Admin password management allowing email resets or direct password setting.
- Implemented a secure password reset system with email-based token verification.
- Fixed session cookie configuration for robust login persistence across deployments.
- Resolved all TypeScript compilation errors preventing deployment (August 2025).
- Fixed session persistence issue causing login redirection failures.
- Corrected PDF payment details formatting to eliminate spacing gaps (August 2025).
- Added comprehensive onboarding system with progress tracking and guided setup checklist (August 2025).
- Fixed critical session bug where new user registration used parseInt(UUID) causing invalid sessions and trial expired screen for new users (August 2025).
- Resolved critical data connectivity issue where users couldn't access their invoices, quotes, products, or customers due to session handling problems (August 2025).
- Implemented PDF watermarking system for trial users with "TRIAL VERSION" overlay, while subscribers get clean PDFs (August 2025).
- Added comprehensive welcome email automation for new registrations with detailed platform information, feature explanations, and getting started guidance (August 2025).
- Enhanced welcome email to emphasize products/services as mandatory step for invoice creation (August 2025).
- Fixed Stripe payment initialization by implementing automatic payment methods instead of specific Apple Pay/Google Pay types (August 2025).
- Updated landing page to clearly highlight PDF watermarking difference between trial and pro plans (August 2025).
- Fixed PDF watermark positioning to ensure "TRIAL VERSION" text is fully visible and properly centered (August 2025).
- CRITICAL SECURITY FIX: Resolved data leakage between user sessions caused by localStorage and TanStack Query cache persistence. Implemented comprehensive cache clearing on login/logout while preserving login convenience features (August 2025).
- Fixed login navigation and remember me functionality: Resolved navigation failures after login, implemented proper email persistence across sessions while maintaining security by not storing passwords, and added professional loading screen with animated spinner to replace white screen during authentication transitions (August 2025).
- Resolved critical subscription payment bug where Stripe payments succeeded but users didn't receive Pro access due to missing `/api/confirm-subscription` endpoint. Implemented proper payment confirmation flow and manually activated affected users (August 2025).
- Fixed push notification system for subscription payments: Added notification support to PaymentIntent confirmation flow and configured Pushover notifications for real-time customer subscription alerts (August 2025).
- Implemented comprehensive web analytics dashboard with live visitor tracking, geographic data, device analytics, traffic sources, and interactive charts. Admin-accessible at /admin/analytics with real-time data collection and no placeholder content (August 2025).
- Enhanced user statistics tracking system with subscription start date and last login timestamp differentiation. Fixed admin panel to properly distinguish between user registration dates and actual subscription start dates, providing accurate billing cycle and subscription information for all existing and new users (August 2025).
- Completed comprehensive application audit and TypeScript error resolution: Fixed 102+ TypeScript compilation errors across 21 files, resolved critical PDF generation issues, enhanced billing cycle detection logic, updated multiple packages for security, and improved error handling throughout the codebase. Application now compiles cleanly with enhanced stability (August 2025).
- COMPREHENSIVE TYPESCRIPT ERROR ELIMINATION: Successfully resolved all remaining TypeScript compilation errors, achieving ZERO TypeScript errors across the entire codebase. Fixed 69+ additional errors including Customer/User type annotations, string/number ID mismatches, form validation schemas, email system type handling, product pricing conversions, and error suppression utilities. Enhanced type safety and code quality throughout invoices, quotes, statements, reports, and settings modules (August 2025).
- Implemented comprehensive automatic email sending system with Brevo API integration: Users can now set up sender email verification through a guided process and send professional invoices, quotes, and statements directly via email with PDF attachments. Features automatic sender registration with Brevo, email verification workflow, customizable templates with company branding, and seamless integration into invoice/quote management workflows. Emails appear to be sent from the user's business email address with proper authentication and delivery tracking (August 2025).
- CRITICAL FIX: Resolved email validation blocking issue caused by database field mapping mismatch between snake_case database fields and camelCase frontend validation. Implemented explicit field mapping in `/api/me` endpoint and enhanced cache invalidation to ensure fresh user data validation. Email sending system now fully functional with successful test delivery (August 2025).
- Extended automated email system to all document types: Replaced old mailto-based email functionality in QuoteList.tsx and StatementList.tsx with the modern EmailSendButton component. All document types (invoices, quotes, statements) now use the same professional email system with Brevo API integration, OTP verification, and consistent company branding (August 2025).
- RESOLVED email setup persistence issue: Fixed critical bug where email verification status reset after page refresh despite correct database storage. Implemented timing-aware validation hook that waits for user data to load before checking email setup status. Email setup now properly persists with simple rule: if senderEmail exists in database, setup is complete (August 2025).
- COMPLETED comprehensive email setup system rebuild: Created new EmailSetupNew.tsx page with clean Brevo integration, fixed API response structure issue where frontend incorrectly accessed user data directly instead of through response.user format, implemented proper cache invalidation for real-time status updates, and documented complete working system. Email verification now works reliably with immediate "Email Setup Complete!" status display for verified users (August 2025).
- IMPLEMENTED email sending limits with subscription-based restrictions: Trial users limited to 5 emails per day maximum with usage counter and upgrade prompts, Pro users get unlimited email sending with crown icon indicator. Features include real-time usage tracking, database storage of daily email counts, automatic limit enforcement before sending, and clear UI feedback showing remaining email quota. Enhanced EmailSendButton component displays usage status and prevents sending when limits reached (August 2025).
- FIXED registration redirect bug: Updated Register.tsx to use same redirect pattern as LoginPage.tsx with window.location.href instead of wouter navigate, added redirecting state with LoadingScreen component, and proper timeout handling. Users now properly redirect to dashboard after successful registration instead of staying on login screen (August 2025).
- ENHANCED onboarding checklist with email setup: Added email setup as step 3 in the "Let's get started" onboarding checklist, updated database schema with emailSetupComplete field, implemented automatic detection of email verification completion, and added dedicated email setup task with icon and link. New users are now guided to set up email sending as part of their initial platform setup (August 2025).

## External Dependencies
- **Stripe**: Subscription management and payment processing.
- **Brevo (SendInBlue)**: Email service for transactional emails and password resets.
- **Open-Meteo API**: Local weather data for the dashboard.
- **html2pdf.js**: Client-side PDF generation.
- **Radix UI**: Accessible UI component primitives.
- **Tailwind CSS**: Styling framework.
- **Lucide React**: Icon library.