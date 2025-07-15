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
- **Database**: Firebase Firestore for document storage
- **Authentication**: Firebase Auth with email/password
- **API Layer**: Express.js server (currently minimal, ready for expansion)
- **Database ORM**: Drizzle ORM configured for PostgreSQL (for future expansion)

### Authentication & Authorization
- **Provider**: Firebase Authentication
- **User Roles**: Trial users (7-day access), subscribers (full access), and admins (platform control)
- **Access Control**: Context-based with route protection and trial expiration checks
- **Session Management**: Firebase Auth state persistence

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