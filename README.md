# InvoicePro - SaaS Invoice Management Platform

A comprehensive SaaS platform for freelancers to manage invoices, quotes, customers, and products with Firebase backend and trial-based access control.

## Features

### Core Functionality
- **Invoice Management**: Create, send, and track professional invoices
- **Quote Generation**: Generate professional quotes and convert to invoices
- **Statement Creation**: Generate detailed statements for customers
- **Customer Management**: Organize customer information and history
- **Product Catalog**: Manage products with pricing and tax rates
- **PDF Generation**: Export documents as professional PDFs

### Business Features
- **Trial System**: 7-day free trial for new users
- **Admin Panel**: User management and platform control
- **Reports & Analytics**: Revenue tracking and business insights
- **Recycle Bin**: Soft deletion with 7-day recovery period
- **GBP Currency**: Formatted for British Pounds throughout

### Technical Features
- **Firebase Authentication**: Secure user authentication
- **Firestore Database**: Real-time document storage
- **Responsive Design**: Mobile-first approach
- **Dark Mode Support**: Theme switching capability
- **Form Validation**: Comprehensive input validation
- **Error Handling**: User-friendly error messages

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context API
- **Data Fetching**: TanStack Query
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Backend**: Express.js with Firebase
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **PDF Generation**: html2pdf.js

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- Replit account (for hosting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/invoicepro-saas.git
cd invoicepro-saas
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Fill in your Firebase credentials in the `.env` file.

4. Start the development server:
```bash
npm run dev
```

### Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Add your domain to authorized domains
5. Get your Firebase config values and add them to `.env`

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── pages/          # Page components
│   │   └── types/          # TypeScript types
├── server/                 # Express backend
├── shared/                 # Shared schemas and types
└── components.json         # shadcn/ui configuration
```

## Key Features Explained

### User Roles
- **Trial Users**: 7-day access to all features
- **Subscribers**: Full access (coming soon)
- **Admins**: Platform management access

### Document Management
- Create invoices, quotes, and statements
- PDF export with company branding
- Status tracking (draft, sent, paid, overdue)
- Soft deletion with recovery

### Authentication Flow
- Firebase Auth integration
- Protected routes with access control
- Trial expiration monitoring
- Admin privilege system

## Development Guidelines

### Code Style
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture
- Responsive design principles

### State Management
- React Context for global state
- TanStack Query for server state
- Form state with React Hook Form

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Loading states and feedback

## Deployment

The application is designed to run on Replit with the following workflow:
1. Development server: `npm run dev`
2. Build: `npm run build`
3. Production server serves React app

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.

---

**Built with ❤️ for freelancers and small businesses**