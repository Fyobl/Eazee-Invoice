# replit.md

## Overview
This project is a comprehensive SaaS invoice management application designed for freelancers. It provides tools for managing invoices, quotes, statements, customers, and products. Key capabilities include robust PDF generation, a trial-based subscription model, secure user authentication, and role-based access control. The primary goal is to offer an intuitive and professional solution for financial document management, with a business vision to provide a high-quality, professional financial document solution for freelancers and small businesses.

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
- **Technical Implementations**: Automatic restart for database connection failures, database health monitoring, exponential backoff retry, and global error handling.

### Core Features
- **User & Subscription Management**: 7-day trial system, flag-based access control, admin panel for full user lifecycle management. Integrated Stripe for monthly billing with webhook support.
- **Document Management**: Creation, tracking, and management of invoices, quotes, and statements with HTML-to-PDF export, soft deletion, status management, and quote-to-invoice conversion. Includes immutable statement snapshots and trial watermarking.
- **Customer & Product Management**: Comprehensive profiles and catalogs with pricing and tax rates. Supports CSV import/export and searchable selection.
- **Reporting**: Business reports (VAT, Top Customers, Best Sellers, Period Takings) with PDF export and customizable date ranges.
- **Email Integration**: Ability to email documents with PDF attachments, customizable templates, and password reset functionality via Brevo. Automated welcome emails for new user registration.
- **Company Branding**: Per-user branding (logo, name, address) on all generated documents and emails.
- **Dashboard**: Redesigned 2x3 grid with welcome message and local weather integration.
- **Help Page**: Comprehensive help page with instructions, diagrams, demos, and feature highlights.
- **User Onboarding**: Interactive setup checklist with guided tasks including email setup, automatic completion detection, and progress tracking.
- **Web Analytics**: Admin-accessible dashboard with live visitor tracking, geographic data, device analytics, and traffic sources, persisting across server restarts.

### System Design Choices
- Structured address forms and enhanced customer schema.
- Consistent layout optimization using max-width containers and responsive grids.
- Admin panel includes accurate user statistics and robust user management capabilities.
- Complete footer and company information pages.
- Configured real-time push notifications for new subscriptions.
- Rebuilt Stripe subscription system using PaymentIntent approach.
- Implemented a secure password reset system with email-based token verification.
- Comprehensive TypeScript error elimination for enhanced stability and code quality.
- Automated email sending system with Brevo API integration, including sender verification, customizable templates, and subscription-based sending limits.

## External Dependencies
- **Stripe**: Subscription management and payment processing.
- **Brevo (SendInBlue)**: Email service for transactional emails and password resets.
- **Open-Meteo API**: Local weather data for the dashboard.
- **html2pdf.js**: Client-side PDF generation.