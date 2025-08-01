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
- **Email Integration**: Ability to email invoices, quotes, and statements. Generates PDFs, downloads automatically, and pre-fills email client. Customizable email templates with variable replacement.
- **Company Branding**: Per-user company branding (logo, name, address) for all generated documents and emails.
- **Dashboard**: Redesigned 2x3 grid layout including a welcome message and local weather integration (Open-Meteo API).
- **Help Page**: Comprehensive help page with step-by-step instructions, visual workflow diagrams, interactive demos, and feature highlights.
- **System Resilience**: Automatic restart mechanism for database connection failures, database health monitoring, and exponential backoff retry for failed operations. Global error handling and specific solutions for WebFrameMain errors in the Replit environment.

## External Dependencies
- **Stripe**: For subscription management and payment processing.
- **Open-Meteo API**: For local weather data integration on the dashboard (no API key required).
- **html2pdf.js**: For client-side PDF generation from HTML.
- **Radix UI**: Accessible component primitives for UI.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library.

## Recent Updates

### August 1, 2025 - Login Issue Fix (Production Deployment)
- **Session Cookie Configuration Fix**: Fixed login issue where users couldn't stay logged in on deployed sites due to improper session cookie configuration
- **HTTPS-Only Cookie Problem**: Previously session cookies were set to `secure: true` in production, requiring HTTPS which caused login failures on non-HTTPS deployments
- **Flexible Cookie Security**: Updated session configuration to only use secure cookies when HTTPS is explicitly enabled or detected (via HTTPS_ENABLED environment variable)
- **Session Persistence Enhancement**: Added `rolling: true` to session configuration to extend session on each request, improving user experience
- **Better Cookie Compatibility**: Added `sameSite: 'lax'` for better cross-site compatibility while maintaining security
- **Production Debugging**: Added comprehensive session debugging for production troubleshooting
- **Multer Security Update**: Verified application functionality after multer dependency security update - all file upload features working correctly