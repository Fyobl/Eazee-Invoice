import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Zap, Bug, Shield, Calendar, Star } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const ReleaseNotes = () => {
  const releases = [
    {
      version: "2.4.0",
      date: "December 2024",
      type: "major",
      title: "Enhanced Admin Panel & User Analytics",
      features: [
        {
          type: "new",
          title: "Admin User Statistics Popup",
          description: "Admins can now click on any user to view detailed statistics including invoice count, quotes, statements, customers, and products in a comprehensive popup dialog."
        },
        {
          type: "improved",
          title: "Enhanced Admin Interface",
          description: "Improved admin panel with better user management tools and real-time statistics."
        },
        {
          type: "improved",
          title: "Database Performance",
          description: "Optimized database queries for better performance on user statistics and admin operations."
        }
      ]
    },
    {
      version: "2.3.0",
      date: "November 2024",
      type: "major",
      title: "Advanced Business Analytics & Reporting",
      features: [
        {
          type: "new",
          title: "Comprehensive Business Reports",
          description: "New analytics dashboard with revenue tracking, customer insights, VAT reporting, and performance metrics."
        },
        {
          type: "new",
          title: "Multi-Currency Support",
          description: "Full support for GBP, USD, EUR with proper formatting and conversion tracking."
        },
        {
          type: "new",
          title: "Advanced PDF Generation",
          description: "Enhanced PDF templates with custom branding, logo support, and professional layouts."
        },
        {
          type: "improved",
          title: "Email Integration",
          description: "Improved email delivery with better templates and attachment handling."
        }
      ]
    },
    {
      version: "2.2.0",
      date: "October 2024",
      type: "major",
      title: "Customer & Product Management Overhaul",
      features: [
        {
          type: "new",
          title: "CSV Import/Export",
          description: "Bulk import customers and products via CSV with data validation and error reporting."
        },
        {
          type: "new",
          title: "Advanced Customer Profiles",
          description: "Enhanced customer management with detailed profiles, contact history, and transaction tracking."
        },
        {
          type: "new",
          title: "Product Catalog Management",
          description: "Comprehensive product management with categories, pricing tiers, and inventory tracking."
        },
        {
          type: "improved",
          title: "Search & Filtering",
          description: "Enhanced search capabilities across customers, products, and transactions."
        }
      ]
    },
    {
      version: "2.1.0",
      date: "September 2024",
      type: "minor",
      title: "Security & Performance Enhancements",
      features: [
        {
          type: "new",
          title: "Enhanced Security",
          description: "Improved authentication system with better password requirements and session management."
        },
        {
          type: "new",
          title: "Data Recovery System",
          description: "Soft delete functionality with 7-day recovery window in recycle bin."
        },
        {
          type: "improved",
          title: "Performance Optimization",
          description: "Faster loading times and improved responsiveness across all pages."
        },
        {
          type: "fixed",
          title: "Bug Fixes",
          description: "Resolved issues with PDF generation, email sending, and data synchronization."
        }
      ]
    },
    {
      version: "2.0.0",
      date: "August 2024",
      type: "major",
      title: "Major Platform Redesign",
      features: [
        {
          type: "new",
          title: "Modern User Interface",
          description: "Complete UI/UX redesign with dark mode support and responsive design for all devices."
        },
        {
          type: "new",
          title: "Stripe Payment Integration",
          description: "Seamless subscription management with secure payment processing through Stripe."
        },
        {
          type: "new",
          title: "Advanced Invoice Features",
          description: "Professional invoice templates with automatic calculations, VAT handling, and payment tracking."
        },
        {
          type: "new",
          title: "Quote Management System",
          description: "Create and manage professional quotes with conversion tracking to invoices."
        },
        {
          type: "improved",
          title: "Database Architecture",
          description: "Migrated to PostgreSQL for better performance, reliability, and scalability."
        }
      ]
    },
    {
      version: "1.5.0",
      date: "July 2024",
      type: "minor",
      title: "Foundation Features",
      features: [
        {
          type: "new",
          title: "Core Invoicing System",
          description: "Basic invoice creation and management with PDF generation capabilities."
        },
        {
          type: "new",
          title: "User Account Management",
          description: "User registration, authentication, and basic profile management."
        },
        {
          type: "new",
          title: "Trial System",
          description: "7-day free trial with full feature access for new users."
        }
      ]
    }
  ];

  const getFeatureIcon = (type: string) => {
    switch (type) {
      case 'new':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'improved':
        return <Zap className="h-4 w-4 text-blue-500" />;
      case 'fixed':
        return <Bug className="h-4 w-4 text-orange-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Star className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFeatureBadge = (type: string) => {
    switch (type) {
      case 'new':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">New</Badge>;
      case 'improved':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Improved</Badge>;
      case 'fixed':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Fixed</Badge>;
      case 'security':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Security</Badge>;
      default:
        return <Badge variant="outline">Update</Badge>;
    }
  };

  const getVersionBadge = (type: string) => {
    switch (type) {
      case 'major':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Major Release</Badge>;
      case 'minor':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Minor Release</Badge>;
      default:
        return <Badge variant="outline">Patch</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <FileText className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">Eazee Invoice</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Release Notes
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
              Stay updated with the latest features and improvements to Eazee Invoice
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              Current Version: {releases[0].version}
            </div>
          </div>
        </div>
      </section>

      {/* Release Timeline */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {releases.map((release, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          Version {release.version}
                        </span>
                        {getVersionBadge(release.type)}
                      </CardTitle>
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {release.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {release.date}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {release.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <div className="flex-shrink-0 mt-0.5">
                          {getFeatureIcon(feature.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {feature.title}
                            </h4>
                            {getFeatureBadge(feature.type)}
                          </div>
                          <p className="text-slate-600 dark:text-slate-300">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Categories Info */}
      <section className="py-16 bg-slate-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Understanding Our Updates
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Learn about the different types of updates we release
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  New Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Brand new functionality and capabilities added to the platform. 
                  These often introduce new workflows or tools to enhance your business operations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Enhancements to existing features, performance optimizations, 
                  and user experience improvements based on feedback and usage patterns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-orange-500" />
                  Bug Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Resolution of reported issues, error corrections, and stability improvements 
                  to ensure smooth operation of all features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-500" />
                  Security Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Security enhancements, vulnerability patches, and privacy improvements 
                  to keep your data safe and comply with industry standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Help Shape Our Future
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Your feedback drives our development. Let us know what features you'd like to see next!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/help">
              <Button size="lg" variant="outline">
                Send Feedback
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg">
                Try Latest Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Eazee Invoice</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-slate-400">
            <p>© 2024 Eazee Invoice. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};