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
- **User & Subscription Management**: 7-day trial system, flag-based access control, admin panel for full user lifecycle management (creation, suspension, subscription granting, permanent subscription, deletion). Integrated Stripe for monthly billing (£19.99/month GBP) with webhook support.
- **Document Management**: Creation, tracking, and management of invoices, quotes, and statements. Features include HTML-to-PDF export, soft deletion with recovery, status management (e.g., Invoices: Unpaid, Paid, Overdue), quote-to-invoice conversion, and immutable statement snapshots.
- **Customer & Product Management**: Comprehensive profiles and catalogs with pricing and tax rates. Supports CSV import/export for bulk data and searchable selection in forms.
- **Reporting**: Business reports including VAT, Top Customers, Best Sellers, and Period Takings, all with PDF export and customizable date ranges.
- **Email Integration**: Ability to email documents (PDFs generated and attached), pre-fill email clients, and customizable templates. Password reset functionality via Brevo using secure token-based verification.
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

## External Dependencies
- **Stripe**: Subscription management and payment processing.
- **Brevo (SendInBlue)**: Email service for transactional emails and password resets.
- **Open-Meteo API**: Local weather data for the dashboard.
- **html2pdf.js**: Client-side PDF generation.
- **Radix UI**: Accessible UI component primitives.
- **Tailwind CSS**: Styling framework.
- **Lucide React**: Icon library.