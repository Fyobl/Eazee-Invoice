# replit.md

## Overview

This is a full-featured SaaS invoice management application built with React and Firebase. The application allows freelancers to manage invoices, quotes, statements, customers, and products with PDF generation capabilities. It features a trial-based subscription model with user authentication and role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API for authentication state
- **Data Fetching**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Database**: PostgreSQL with Drizzle ORM for all data storage
- **Authentication**: PostgreSQL-based authentication with bcrypt password hashing
- **API Layer**: Express.js server with comprehensive authentication endpoints
- **Session Management**: express-session with connect-pg-simple for database-backed sessions

### Authentication & Authorization
- **Provider**: PostgreSQL-based authentication with bcrypt password hashing
- **User Roles**: Trial users (7-day access), subscribers (full access), and admins (platform control)
- **Access Control**: Context-based with route protection and trial expiration checks
- **Session Management**: express-session with PostgreSQL session store

## Key Components

### User Management
- Trial system with 7-day access from registration
- Subscription flag-based access control
- Admin panel for user management
- Account suspension capabilities

### Document Management
- Invoice creation and management
- Quote generation and tracking
- Statement generation
- PDF export functionality using html2pdf.js
- Soft deletion with 7-day recovery period

### Customer & Product Management
- Customer profile management
- Product catalog with pricing and tax rates
- Relationship tracking between documents and customers/products

### UI Components
- Comprehensive shadcn/ui component library
- Responsive design with mobile-first approach
- Modal-based interactions (no browser alerts/confirms)
- Toast notifications for user feedback
- Protected route components with loading states

## Data Flow

### Authentication Flow
1. User registers/logs in through Firebase Auth
2. User data is stored in Firestore with trial information
3. AuthContext provides user state throughout the app
4. ProtectedRoute components check access permissions
5. Trial expiration and suspension checks on each route

### Document Creation Flow
1. User creates document through form components
2. Data is validated using Zod schemas
3. Document is stored in Firestore with user association
4. Real-time updates through Firestore listeners
5. PDF generation on-demand using company branding

### Data Persistence
- Firestore collections for users, documents, customers, products
- Real-time synchronization with useFirestore hook
- Soft deletion with recycle bin functionality
- Automatic cleanup of old deleted items

## External Dependencies

### Firebase Services
- **Authentication**: User registration, login, password management
- **Firestore**: Document storage with real-time updates
- **Hosting**: (Ready for deployment)

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **html2pdf.js**: PDF generation from HTML

### Development Tools
- **Vite**: Fast development and build tooling
- **TypeScript**: Type safety and development experience
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Development Environment
- Replit-hosted development with hot module replacement
- Environment variables for Firebase configuration
- Development-specific error handling and logging

### Production Deployment
- Vite build process generates optimized static assets
- Express server serves the React application
- Firebase hosting for static assets and API endpoints
- Environment-based configuration management

### Database Schema
- Firestore collections: users, invoices, quotes, statements, customers, products, companies, recycle_bin
- Document-based structure with user-scoped data
- Soft deletion implementation with automatic cleanup
- Indexing for efficient queries and real-time updates

### Security Considerations
- Firebase security rules for data access control
- Client-side route protection with server-side validation
- Input validation using Zod schemas
- Secure password handling through Firebase Auth
- XSS protection through React's built-in escaping

The application is designed to be easily extensible with additional features like Stripe integration, email notifications, and advanced reporting while maintaining a clean separation of concerns between authentication, data management, and UI components.

## Recent Changes

### January 15, 2025 - Database Migration & Authentication Improvements
- **Firebase to PostgreSQL Migration**: Successfully migrated all data from Firebase Firestore to PostgreSQL database
  - Migrated 2 users, 2 companies, 1 customer, 2 products
  - Fixed API request issues in useDatabase hook to work with new backend
  - Updated customer and product forms to use PostgreSQL instead of Firestore
  - Data now persists properly after server restarts
- **Enhanced Authentication Persistence**: Improved Firebase Auth to maintain login state during development
  - Configured proper browserLocalPersistence for Firebase Auth
  - Added localStorage backup for user data and auth state
  - Enhanced ProtectedRoute to handle server restarts gracefully
  - Added timeout mechanism to prevent infinite loading states
  - Fixed decimal parsing issues in product displays and currency formatting
  - Improved product selection functionality in quotes and invoices

### January 15, 2025 - Latest Updates
- **Quote Creation Bug Fix**: Fixed critical server-side bug preventing quote creation due to PostgreSQL timestamp field parsing issues
- **Database Date Handling**: Resolved issue where client was sending ISO date strings but PostgreSQL expected Date objects
- **Enhanced Error Logging**: Added comprehensive error logging to quote and invoice creation endpoints for better debugging
- **Authentication Persistence Enhancement**: Implemented robust localStorage-based authentication restoration to prevent logout during server restarts
- **UI Styling Fix**: Fixed amount field background color and alignment issues in quote/invoice forms to use proper dark theme colors
- **Improved Auth Flow**: Authentication now immediately restores from localStorage on app startup, preventing redirect loops
- **PostgreSQL Migration**: Successfully migrated Quote List, Invoice List, Dashboard, and Reports components from Firestore to PostgreSQL
- **Decimal Field Handling**: Fixed decimal field display issues throughout the application (quote.total, invoice.total parsing)
- **Enhanced Delete Experience**: Replaced browser pop-ups with in-app confirmation dialogs for better user experience
- **Dropdown Action Menus**: Converted action buttons to dropdown menus with descriptive text for quotes and invoices
- **Toast Notifications**: Added success notifications that appear in bottom-right corner when items are deleted
- **PDF Functionality**: Implemented complete PDF view and download system for quotes and invoices
- **Professional PDFs**: Created professional PDF documents with company branding, proper formatting, and GBP currency
- **PDF Layout Enhancement**: Fixed PDF design issues - company logo now positioned in top-left, improved currency formatting, clean totals table, and proper page layout preventing content cut-off
- **Settings Page Database Migration**: Updated Settings page from Firestore to PostgreSQL database with proper logo upload functionality
- **Company Data Fixes**: Fixed company name typo and improved PDF margin settings to prevent content cut-off

### January 16, 2025 - Status System Update & Statement PDF Enhancement & Layout Improvements
- **Invoice Status Simplification**: Updated invoice status options from "Draft/Sent/Paid/Overdue" to "Unpaid/Paid/Overdue" for clearer user experience
- **Database Status Migration**: Updated all existing invoices from "draft" and "sent" statuses to "unpaid" status (3 invoices updated)
- **Statement PDF Enhancement**: Statement PDFs now display actual unpaid invoices from the database for the selected customer and period
- **PDF Data Integration**: Statements fetch real invoice data and show invoice number, date, due date, status, and amounts in a professional table format
- **Statement Logic Update**: Updated statement filtering logic to show invoices with "unpaid" or "overdue" status instead of checking for "not paid"
- **UI Component Updates**: Updated invoice forms, lists, and reports to reflect the new three-status system
- **Status Badge Styling**: Updated status color coding throughout the application for the new status values
- **PDF Layout Optimization**: Enhanced all PDF documents (invoices, quotes, statements) with improved layout design
- **Bill To Section Repositioning**: Moved "Bill To" customer information to the right side of the document below the header
- **Compact Design Implementation**: Reduced margins, padding, and font sizes throughout PDF documents to fit more content per page
- **Statement PDF Bug Fix**: Resolved API request error that prevented statement PDFs from displaying unpaid invoices correctly
- **PDF Content Density**: Optimized table spacing, section margins, and text sizing for better space utilization while maintaining readability
- **Enhanced Bill To Positioning**: Further refined "Bill To" section positioning to the far right of PDF documents with improved spacing
- **Customer List UX Enhancement**: Transformed customer list to hide address column and make customer rows clickable for popup detail views
- **Customer Details Dialog**: Implemented modal popup showing comprehensive customer information including name, email, phone, and address with action buttons
- **404 Error Fix**: Added missing edit routes for all document types (customers, products, invoices, quotes, statements) to resolve navigation errors
- **Dark Mode 404 Page**: Updated 404 not found page with proper dark mode text colors for better visibility
- **Customer Actions Dropdown**: Replaced basic action buttons with professional 3-dot dropdown menu matching invoice list design with descriptive text
- **Customer Edit Form Enhancement**: Fixed customer edit functionality to properly load existing customer data and handle both add/edit modes
- **Improved Delete Confirmation**: Added proper confirmation dialog for customer deletion with toast notifications matching invoice workflow
- **Product Actions Dropdown**: Implemented professional 3-dot dropdown menu for product actions matching the consistent UI pattern
- **Product Edit Form Fix**: Fixed product edit functionality to properly load existing product data when editing
- **CSV Upload/Download System**: Added CSV template download and upload functionality for both products and customers
- **CSV Templates**: Created downloadable CSV templates with sample data for products and customers
- **CSV Import Implementation**: Fully implemented CSV import functionality with validation, error handling, and progress reporting
- **CSV Data Validation**: Added comprehensive validation for required fields, data types, and format requirements
- **Import Success Tracking**: Added detailed success/error reporting with specific row-level error messages
- **Recycle Bin Dark Mode Fix**: Fixed text visibility issues in dark mode for the recycle bin header and description
- **Soft Delete Implementation**: Added complete soft delete functionality for invoices, quotes, and customers
- **Recycle Bin Integration**: All deleted items now go to recycle bin with 7-day recovery period instead of permanent deletion
- **Enhanced Delete Feedback**: Updated toast messages to inform users about recycle bin availability and 7-day recovery option
- **Admin Panel Dark Mode Fix**: Fixed all dark mode text visibility issues in admin panel with proper light/dark color classes
- **PostgreSQL Admin Integration**: Migrated admin panel from Firestore to PostgreSQL with proper user management API routes
- **Enhanced User Management**: Added comprehensive user management with 3-dot dropdown menus for admin actions
- **Subscription Management**: Implemented subscription granting with customizable duration (1-12 months)
- **User Creation System**: Added ability for admins to create new user accounts with proper form validation
- **Account Suspension Controls**: Full suspend/unsuspend functionality with proper status tracking and UI feedback

### January 16, 2025 - Admin CSV Upload Implementation & Email Functionality Improvements
- **Admin CSV Upload System**: Added comprehensive CSV upload functionality to admin panel for bulk customer and product imports
- **CSV Template Downloads**: Created downloadable CSV templates with sample data for customers and products
- **Bulk Import Capability**: Admins can now upload CSV files to set up customer/product data for any user account
- **CSV Data Validation**: Added robust validation with detailed error reporting for CSV imports
- **User-Specific Data Import**: CSV uploads assign data to specific users selected by admin
- **Import Progress Tracking**: Real-time feedback showing success/error counts during CSV processing
- **Enhanced Error Handling**: Improved PDF generation error handling with timeout protection and fallback mechanisms
- **Browser Compatibility**: Added comprehensive error handling for browser-specific PDF generation issues
- **Graceful Degradation**: Email functionality continues working even when PDF generation encounters browser limitations

### January 16, 2025 - Email Functionality Implementation
- **Comprehensive Email Integration**: Added complete email functionality for all document types (invoices, quotes, statements)
- **Email Settings Page**: Created dedicated Email Settings page with customizable templates for each document type
- **Document Email Actions**: Added "Send via Email" options to all document dropdown menus (invoices, quotes, statements)
- **Email Templates System**: Implemented variable replacement system for personalized email content with customer and company details
- **PDF Email Integration**: Email system automatically generates PDFs and opens default mail app with pre-filled content
- **Customer ID Lookup Fix**: Resolved customer lookup issues in email functionality by handling string/integer ID comparisons
- **Navigation Enhancement**: Added Email Settings to Account section in sidebar navigation with proper Mail icon integration
- **Email Process Improvement**: Enhanced email functionality with better user messaging and PDF download instructions
- **DOM Conflict Resolution**: Fixed document.createElement naming conflict that was preventing email preparation
- **User Experience Enhancement**: Updated all toast notifications to clearly explain PDF download and manual attachment process
- **Email Functionality Completion**: Successfully implemented complete email workflow with PDF generation, automatic download, and email client integration
- **Browser Compatibility**: Added robust error handling to prevent JavaScript rendering issues while maintaining full functionality

### January 16, 2025 - Dashboard Layout Enhancement & Weather Integration
- **Dashboard Layout Redesign**: Restructured dashboard from 4-column to 2x3 grid layout for better organization
- **Welcome Box Standardization**: Resized welcome message box to match other dashboard cards for consistent sizing
- **Local Weather Integration**: Added real-time weather widget using Open-Meteo API (no API key required)
- **Weather Data Display**: Shows temperature, weather conditions, wind speed, and humidity based on user's geolocation
- **Responsive Weather Icons**: Dynamic weather icons that change based on current conditions (sun, cloud, rain)
- **6-Box Dashboard Layout**: Implemented requested layout - Welcome/Weather (top), Invoices/Quotes (middle), Customers/This Month (bottom)
- **Geolocation API Integration**: Uses browser geolocation to fetch accurate local weather data
- **Weather API Reliability**: Implemented robust error handling with fallback states for location access denial

### January 16, 2025 - Stripe Subscription System Implementation
- **Complete Stripe Integration**: Implemented full subscription system with monthly billing at £19.99/month
- **Database Schema Updates**: Added Stripe customer ID, subscription ID, and subscription status fields to users table
- **Subscription Endpoints**: Created comprehensive API endpoints for subscription creation, status checking, cancellation, and webhook handling
- **Payment Processing**: Integrated Stripe Elements for secure payment processing with proper error handling
- **Subscription Management UI**: Built professional subscription page with features list, payment form, and subscription management
- **Navigation Integration**: Added subscription management links to sidebar navigation (Upgrade to Pro/Manage Subscription)
- **Trial Integration**: Updated trial expiration page to link directly to subscription signup
- **Authentication Context**: Enhanced auth context to include subscription status for access control
- **Webhook Support**: Implemented Stripe webhook handlers for subscription status updates and payment events
- **Currency Support**: All pricing displays in GBP (£) with proper pence conversion for Stripe API

### January 16, 2025 - Application Auto-Restart & Database Resilience
- **Automatic Restart System**: Implemented comprehensive auto-restart mechanism for database connection failures
- **Database Error Detection**: Added intelligent detection of database-related errors (connection lost, timeouts, etc.)
- **Global Error Handling**: Enhanced uncaught exception and unhandled rejection handlers with auto-restart capability
- **Database Health Monitoring**: Added periodic health checks (every 30 seconds) to monitor database connection status
- **Connection Pool Enhancement**: Improved database pool configuration with retry logic and timeout settings
- **Graceful Restart Process**: Implemented graceful shutdown and restart sequence to prevent data loss
- **Exponential Backoff Retry**: Added retry mechanism with exponential backoff for failed database operations
- **Enhanced Error Logging**: Improved error logging and debugging information for database connection issues

### January 16, 2025 - Landing Page Enhancement & Subscription Integration
- **Landing Page Redesign**: Updated landing page with comprehensive feature showcase and new pricing structure
- **Enhanced Feature Descriptions**: Added detailed descriptions of all current features including PDF generation, email integration, and analytics
- **Subscription Pricing Update**: Updated all pricing displays to reflect £19.99/month subscription model
- **Registration Enhancement**: Added subscription signup option during registration with checkbox for automatic upgrade after trial
- **Additional Features Section**: Added dedicated section showcasing advanced features like CSV import/export, admin panel, and soft delete recovery
- **Subscription Management Fix**: Fixed subscription management page by adding proper Layout component with header and navigation
- **Pricing Section Enhancement**: Improved pricing cards with detailed feature lists and "Most Popular" badge for Pro plan
- **User Experience Improvements**: Enhanced registration flow with clearer trial messaging and subscription options

### January 16, 2025 - Subscription System Complete Implementation & Authentication Fixes
- **Subscription Initialization Fix**: Fixed critical user synchronization issue between Firebase and PostgreSQL databases
- **Stripe API Integration**: Resolved Stripe product creation issues and implemented proper subscription flow
- **Test Payment System**: Added fake payment functionality for testing subscription activation without charging real cards
- **Recurring Billing Logic**: Enhanced subscription status validation to check for active subscription periods
- **Database Schema Updates**: Added proper subscription status tracking with current period end dates
- **Authentication Enhancement**: Updated auth context to properly validate active subscriptions vs expired ones
- **API Endpoint Improvements**: Created comprehensive subscription management endpoints including fake payment for testing
- **Subscription Status Validation**: Implemented proper recurring billing checks that expire subscriptions after period end
- **Subscription Renewal Popup**: Added comprehensive subscription renewal dialog that blocks access when subscriptions expire
- **User Data Synchronization**: Enhanced payment flow to automatically sync user data and refresh authentication context
- **Expired Subscription Handling**: Implemented proper logic to show renewal popup when subscription period ends
- **Authentication System Bug Fix**: Fixed critical authentication issue where expired subscriptions could still access dashboard
- **Data Source Correction**: Updated auth context to use real-time PostgreSQL data instead of cached Firebase data
- **Sync Endpoint Enhancement**: Added real-time subscription validation to user sync endpoint
- **Logout Functionality Fix**: Fixed logout button to properly clear user data and localStorage before redirecting
- **Landing Page Authentication**: Added auto-redirect for authenticated users from landing page to dashboard
- **Permanent Subscription System**: Added permanent subscription functionality to admin panel with infinity icon and checkbox
- **API Date Handling Fix**: Fixed user update API to properly handle date string conversions for timestamp fields
- **Ben Smith Permanent Subscription**: Applied permanent subscription to Ben Smith (expires 2099-12-31) through admin panel functionality

### January 16, 2025 - Complete Firebase to PostgreSQL Authentication Migration & Database Reset
- **Authentication System Overhaul**: Successfully migrated from Firebase Auth to PostgreSQL-based authentication
- **Database Schema Enhancement**: Added password_hash column and session management tables for secure authentication
- **Server-Side Authentication**: Implemented comprehensive authentication endpoints (/api/register, /api/login, /api/logout, /api/change-password)
- **Session Management**: Added express-session with connect-pg-simple for database-backed session persistence
- **Password Security**: Implemented bcrypt password hashing with salt rounds for secure password storage
- **Frontend Migration**: Updated all authentication contexts and components to use PostgreSQL authentication
- **Firebase Dependency Removal**: Completely removed Firebase and firebase-admin packages from the project
- **Remember Me Feature**: Added "Remember me" functionality to login form with email persistence and checkbox state
- **Route-Based Navigation**: Updated landing page to use route-based authentication instead of modal dialogs
- **Authentication Context**: Consolidated authentication system into single AuthContext with PostgreSQL integration
- **Error Handling**: Enhanced authentication error handling and user feedback throughout the application
- **API Security Implementation**: Secured all API endpoints with requireAuth middleware for proper user data isolation
- **Data Separation**: Fixed critical security issue where users could access each other's data by implementing proper UID-based filtering
- **Session-Based Authentication**: All API routes now use authenticated user's UID from session instead of query parameters
- **Password Change Dialog Fix**: Fixed password change dialog to properly close and refresh user context after successful password update
- **Complete Database Reset**: Deleted all invoices, quotes, statements, products, customers, and recycle bin items from database
- **Fresh Start Authentication**: Reset all user passwords to "password123" with mustChangePassword flag for clean testing
- **Data Isolation Verification**: Confirmed each user can only access their own data through authenticated API calls
- **Security Testing**: Verified unauthenticated requests are properly rejected with 401 errors
- **Password Change Persistence Fix**: Fixed mustChangePassword flag to properly persist after password changes, preventing repeated prompts after app restarts

### January 16, 2025 - Toast Notifications & User Deletion Enhancement
- **Password Change Toast Notification**: Replaced browser alert with bottom-right toast notification for password changes in Account settings
- **Admin User Deletion**: Added complete user deletion functionality to admin panel with confirmation dialog
- **Comprehensive Data Cleanup**: User deletion removes all associated data (customers, products, invoices, quotes, statements, company info, recycle bin)
- **Enhanced Security**: Added admin authentication checks to all user management endpoints
- **Self-Deletion Prevention**: Admins cannot delete their own accounts
- **Admin User Creation Fix**: Fixed password hashing for users created through admin panel (default password: temp123456)

### January 16, 2025 - Admin-Granted Subscription Status & Expiration Enhancement
- **Admin Subscriber Status Tags**: Added "Admin Subscriber" status tags in admin panel to distinguish admin-granted from paid subscriptions
- **Purple Badge Styling**: Admin-granted subscriptions display with purple badge color (bg-purple-100 text-purple-800) for clear visual distinction
- **Subscription Days Calculation**: Enhanced admin panel to show accurate days left for all subscription types including admin-granted subscriptions
- **Permanent Subscription Display**: Subscriptions set to year 2099 now display as "Permanent" instead of showing large day counts
- **Expired Subscription Handling**: Expired subscriptions properly display as "Expired" in admin panel
- **Column Header Update**: Changed "Trial Ends" column to "Expires" to better reflect subscription and trial expiration information
- **Database Data Consistency**: Updated all existing admin-granted users to have proper subscription period end dates (John & Sarah Smith set to Feb 15, 2025)
- **Auto-Flag Admin Subscriptions**: Both grant subscription and create user functions now automatically set isAdminGrantedSubscription = true for admin-created subscriptions

### January 16, 2025 - Admin-Granted Subscription Expiration System
- **Database Schema Enhancement**: Added `isAdminGrantedSubscription` field to distinguish between admin-granted and paid subscriptions
- **Subscription Expiration Logic**: Implemented separate handling for admin-granted subscription expiration vs paid subscription expiration
- **Payment Flow Redirection**: Users with expired admin-granted subscriptions are redirected to `/subscribe` page instead of trial expired page
- **Special UI Messaging**: Added dedicated warning message on subscription page for users with expired admin-granted subscriptions
- **Admin Panel Integration**: Admin-created users with subscriptions are automatically marked as admin-granted subscriptions
- **Subscription Status Differentiation**: Admin-granted subscriptions transition to paid subscriptions when users complete payment
- **Database Migration**: Updated all existing admin-granted subscriptions to have proper `isAdminGrantedSubscription` flag
- **Forced Password Change**: All admin-created users now have `mustChangePassword` flag set to true with default password "temp123456"

### January 16, 2025 - Account Management Enhancement
- **Personal Information Update**: Added ability for users to update their first name and last name in Account settings
- **Enhanced Account Page**: Added new "Personal Information" section with form validation and user-friendly interface
- **Real-time Updates**: Form automatically updates when user data changes and provides success feedback via toast notifications
- **API Integration**: Connected to existing user update endpoint for seamless data persistence
- **UI Improvements**: Added User icon and professional styling to match existing account sections
- **Subscription Cancellation Safety**: Added confirmation dialog for cancel subscription button to prevent accidental cancellations
- **Enhanced User Experience**: Cancel subscription now shows warning with detailed information about consequences and requires explicit confirmation
- **Immediate Access Revocation**: Modified subscription cancellation to immediately revoke user access instead of waiting for period end
- **Enhanced Security**: Users with cancelled subscriptions are immediately redirected to trial expired/subscription warning page
- **Updated API Logic**: Cancel subscription endpoint now sets isSubscriber to false and subscription status to 'cancelled' immediately
- **Auth Context Enhancement**: Updated authentication logic to properly handle cancelled subscription status
- **Cancelled Subscription Handling**: Users with cancelled subscriptions now see the re-subscribe form instead of subscription management interface
- **Subscription Status API Fix**: Enhanced subscription status endpoint to properly identify cancelled subscriptions as inactive
- **Database Consistency**: Ensured cancelled subscriptions have both isSubscriber = false and subscriptionStatus = 'cancelled'

### January 17, 2025 - Invoice Status System Enhancement & PDF Status Marking
- **Three-Status System Implementation**: Updated invoice system to use only three statuses: unpaid, paid, and overdue
- **Quote-to-Invoice Conversion Fix**: Fixed quote conversion to create invoices with "unpaid" status instead of "sent"
- **Clickable Status Field**: Made invoice status field clickable in invoice list for easy status updates
- **PDF Status Stamp**: Added status stamp to invoice PDFs showing UNPAID, PAID, or OVERDUE in top-right corner
- **Enhanced Status Display**: Updated status badges throughout the application with proper color coding
- **Database Updates**: Enhanced useDatabase hook to support invoice status updates via dropdown selection
- **User Experience**: Status changes now show toast notifications confirming the update
- **PDF Visual Enhancement**: Added bordered status stamps to invoice PDFs for clear payment status visibility
- **Status Position Update**: Moved status stamp from top-right to left side next to totals table for better layout
- **Statement PDF Fix**: Fixed status badge cutoff issue in statement PDFs by reducing padding and font size for better fit

### January 16, 2025 - CSV Upload Template Consistency Fix
- **Customer CSV Template Standardization**: Fixed inconsistency between customer page and admin panel CSV templates
- **Template Format Unification**: Updated customer page template to match server-side expectations with proper column headers
- **Column Structure Fix**: Added missing columns (city, country, taxNumber) to customer CSV template to prevent upload errors
- **Server-Side Processing**: Migrated customer page CSV upload to use centralized server-side endpoint instead of client-side processing
- **Template Content Update**: Removed quoted fields and standardized format across all CSV templates in the application
- **Error Handling Enhancement**: Improved error reporting and validation for CSV uploads throughout the platform
- **Upload Consistency**: Both admin panel and customer page now use identical CSV format and processing logic

### January 16, 2025 - Per-User Company Branding Migration Complete
- **Database Schema Migration**: Successfully migrated from global companies table to per-user company branding fields in users table
- **Company Table Removal**: Completely dropped the companies table from the database as branding is now stored per-user
- **PDF Generation Update**: Updated PDFGenerator component to use User type instead of Company type for document generation
- **Email System Migration**: Updated all email functions (invoice, quote, statement) to use user branding fields instead of company data
- **Document Lists Update**: Modified InvoiceList, QuoteList, and StatementList components to use currentUser for PDF generation and email sending
- **Settings Page Enhancement**: Updated Settings component to handle per-user branding with direct user profile updates
- **Data Consistency**: All PDF documents now use individual user's company branding (companyName, companyLogo, companyAddress, etc.)
- **API Integration**: Removed all companies database dependencies and hooks throughout the application
- **User Experience**: Each user now has personalized company branding on their generated documents without shared company data

### January 16, 2025 - Comprehensive Help Page Implementation
- **Complete Help System**: Created comprehensive help page with detailed step-by-step instructions for all key features
- **Visual Workflow Diagrams**: Added interactive visual guides showing process flows for invoice creation, quote to invoice conversion, and customer management
- **Interactive Demo Section**: Added quick demo cards with direct links to try key features (Add Customer, Create Product, Generate Quote, Create Invoice)
- **Feature Highlights**: Showcased main platform capabilities with professional PDF generation, email integration, and business analytics
- **Navigation Integration**: Added Help page to sidebar navigation with HelpCircle icon for easy access
- **User-Friendly Guidance**: Structured help content with:
  - Quick navigation to jump between sections
  - Step-by-step instructions for each feature
  - Visual process flows with color-coded steps
  - Pro tips and best practices
  - Common Q&A troubleshooting section
  - Direct action buttons to try features
- **Comprehensive Coverage**: Included detailed instructions for:
  - Customer management (adding, editing, CSV import)
  - Product catalog management
  - Quote creation and management
  - Invoice generation and tracking
  - Quote to invoice conversion workflow
  - PDF generation and email integration
  - Dashboard usage and business analytics
  - Settings and subscription management
- **Dark Mode Support**: All help content properly styled for both light and dark themes

### January 16, 2025 - Mobile Responsiveness Enhancement & Navigation Improvements
- **Navigation Bar Scroll Fix**: Fixed navigation bar scrolling behavior to prevent background page scrolling when sidebar is open
- **Enhanced Mobile Navigation**: Added scroll lock to background page when navigation is open, only navigation content scrolls
- **Proper Scroll Handling**: Implemented `useEffect` to toggle body overflow when sidebar opens/closes with cleanup
- **Help Page Button Sizing**: Fixed text overflow in Help page Quick Navigation buttons with proper responsive sizing
- **Mobile-First Design**: Updated all major page headers with mobile-responsive layouts:
  - Admin Panel: User Management and CSV Upload sections now stack vertically on mobile
  - Customers Page: Download Template, Upload CSV, and Add Customer buttons stack on mobile
  - Products Page: Download Template, Upload CSV, and Add Product buttons stack on mobile
  - Invoices Page: New Invoice button responsive layout
  - Quotes Page: New Quote button responsive layout
- **Button Layout Improvements**: All action buttons now use full width on mobile (`w-full`) and auto width on desktop (`sm:w-auto`)
- **Responsive Headers**: Changed all page headers from `flex justify-between` to `flex flex-col sm:flex-row sm:justify-between` with proper gap spacing
- **Enhanced User Experience**: Mobile users now have properly sized buttons that don't get cut off or require horizontal scrolling

### January 15, 2025
- **Admin Setup Removal**: Removed AdminSetup component from landing page for cleaner user experience
- **GitHub Integration**: Created comprehensive GitHub setup guide and documentation
- **Repository Setup**: Added README.md, .env.example, and updated .gitignore for GitHub integration
- **Currency Formatting**: Successfully implemented GBP (£) currency formatting throughout entire application
- **Documentation**: Added detailed project documentation and setup instructions
- **Dark Mode Implementation**: Added comprehensive dark mode system with theme context and proper CSS variables
- **Navigation System**: Converted sidebar to burger menu that slides in/out, hiding by default on all screen sizes
- **UI Consistency**: Updated all major components (Dashboard, Layout, Sidebar, Header) with proper dark mode styling
- **Authentication Persistence**: Fixed Firebase Auth persistence to prevent logout on page refresh using browserLocalPersistence
- **Branding Update**: Renamed application from "InvoicePro" to "Eazee Invoice" throughout the interface
- **Currency Symbol Cleanup**: Fixed remaining $ symbols to £ in PDF generator, Reports, and Admin panel components
- **User Registration Enhancement**: Added firstName, lastName, and companyName fields to registration form
- **Personalized UI**: Updated header and dashboard to display "Hi [First Name]" instead of email address
- **Logout Functionality**: Added logout button to navigation header with proper Firebase auth integration
- **Trial Access Fix**: Fixed critical bug where new users couldn't access trial - properly handled Firestore Timestamp objects in date calculations
- **Dark Mode Reports**: Updated Reports screen with proper dark mode text colors for better visibility
- **Logo Upload System**: Implemented complete logo upload functionality with Firebase Storage integration, file validation, preview, and PDF integration
- **Searchable Customer Selection**: Added searchable customer dropdown with typing search functionality for quotes and invoices
- **Searchable Product Selection**: Created searchable product selector that allows typing to find products and auto-fills pricing/tax information
- **Enhanced Form UX**: Both quote and invoice forms now have improved user experience with search-as-you-type functionality