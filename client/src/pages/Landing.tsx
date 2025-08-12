import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Quote, Users, DollarSign, CheckCircle, RotateCcw, Mail, BarChart3, AlertCircle, Star } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

export const Landing = () => {
  const { currentUser, hasAccess, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [billingFrequency, setBillingFrequency] = useState<'monthly' | 'yearly'>('monthly');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && currentUser && hasAccess) {
      setLocation('/dashboard');
    }
  }, [currentUser, hasAccess, loading, setLocation]);

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: FileText,
      title: 'Professional Invoices & Quotes',
      description: 'Create unlimited professional invoices, quotes, and statements with PDF generation and email integration'
    },
    {
      icon: Users,
      title: 'Complete Customer Management',
      description: 'Manage unlimited customers and products with CSV import/export and comprehensive analytics'
    },
    {
      icon: CheckCircle,
      title: 'Business Analytics & Reports',
      description: 'Track revenue, customer insights, and business performance with detailed reporting and dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-slate-900 dark:bg-gray-900 shadow-sm border-b border-slate-700 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <img 
                src="/attached_assets/Eazee Invoice Logo Transparent Small_1754663909119.png" 
                alt="Eazee Invoice" 
                className="h-10 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:text-white hover:bg-slate-800">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-white">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-20 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/attached_assets/61037-497754241_1754572896095.mp4" type="video/mp4" />
          </video>
          {/* Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900/30 dark:from-primary/30 dark:to-gray-900/50"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Professional Invoice Management
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Complete business management solution with professional invoicing, customer management, 
              PDF generation, email integration, and comprehensive analytics. Built for freelancers and small businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg">
                  Start 7-Day Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={scrollToFeatures}>
                View Features
              </Button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                7-day free trial • Then £5.99/month or £64.69/year • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">Professional tools to streamline your workflow</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section id="features-section" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful Features Built for Your Success
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">Everything you need to run your business efficiently</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Professional PDFs</h3>
              <p className="text-slate-600 dark:text-slate-300">Generate branded PDFs with your company logo and professional layouts</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Multi-Currency Support</h3>
              <p className="text-slate-600 dark:text-slate-300">Work with GBP, USD, EUR and other currencies with proper formatting</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Soft Delete & Recovery</h3>
              <p className="text-slate-600 dark:text-slate-300">Accidentally deleted items? Recover them within 7 days from recycle bin</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">CSV Import/Export</h3>
              <p className="text-slate-600 dark:text-slate-300">Bulk import customers and products, export data for analysis</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Email Integration</h3>
              <p className="text-slate-600 dark:text-slate-300">Send invoices and quotes directly via email with PDF attachments</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Business Reports & Analytics</h3>
              <p className="text-slate-600 dark:text-slate-300">Track revenue, VAT, top customers, and business performance with detailed reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">Start with our free trial, upgrade when you're ready</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free Trial</h3>
                <div className="text-4xl font-bold text-primary mb-4">7 Days</div>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Try all features with limitations</p>
                <ul className="text-left text-slate-600 dark:text-slate-300 mb-6 space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Create invoices & quotes</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Customer & product management</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Business analytics & reports</li>
                  <li className="flex items-center text-orange-600 dark:text-orange-400"><AlertCircle className="h-4 w-4 mr-2" />PDFs include "TRIAL VERSION" watermark</li>
                </ul>
                <Link href="/register">
                  <Button className="w-full">
                    Start Free Trial
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-green-500/20 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Pro Plan</h3>
                
                {/* Billing Toggle inside Pro Plan box */}
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <button 
                      onClick={() => setBillingFrequency('monthly')}
                      className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        billingFrequency === 'monthly' 
                          ? 'bg-primary text-white' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button 
                      onClick={() => setBillingFrequency('yearly')}
                      className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        billingFrequency === 'yearly' 
                          ? 'bg-primary text-white' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                  {billingFrequency === 'yearly' && (
                    <div className="ml-2 text-xs">
                      <span className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 px-2 py-1 rounded-full font-medium">
                        Save 10%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                  <span>
                    {billingFrequency === 'monthly' ? '£5.99' : '£64.69'}
                  </span>
                  <span className="text-lg text-slate-600 dark:text-slate-400">
                    /{billingFrequency === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingFrequency === 'yearly' && (
                  <div className="text-sm text-green-600 dark:text-green-400 mb-4 font-medium">
                    Save £7.19 per year (10% off)
                  </div>
                )}
                {billingFrequency === 'monthly' && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    or £64.69/year (save 10%)
                  </div>
                )}
                <p className="text-slate-600 dark:text-slate-300 mb-6">Unlock the full power of professional invoicing</p>
                <ul className="text-left text-slate-600 dark:text-slate-300 mb-6 space-y-2">
                  <li className="flex items-center"><Star className="h-4 w-4 text-yellow-500 mr-2" />✨ <strong>Clean, professional PDFs</strong> - No watermarks</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited invoices, quotes & customers</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Advanced business analytics & VAT reports</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Email integration with PDF attachments</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />CSV import/export for bulk operations</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Priority customer support</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cancel anytime - No contracts</li>
                </ul>
                <Link href="/register">
                  <Button className="w-full">Start with Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/attached_assets/Eazee Invoice Logo Transparent Small_1754663909119.png" 
                  alt="Eazee Invoice" 
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-slate-300 mb-4 max-w-md">
                Professional invoice management solution for freelancers and small businesses. 
                Streamline your billing process with powerful tools and comprehensive analytics.
              </p>
              
              {/* Social Media Links */}
              <div className="flex space-x-4 mb-4">
                <a 
                  href="https://www.facebook.com/profile.php?id=61578914895610" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors"
                  aria-label="Visit our Facebook page"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
              
              <p className="text-slate-400 text-sm">
                © 2024 Eazee Invoice. All rights reserved.
              </p>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>

              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/support" className="text-slate-300 hover:text-white transition-colors">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-300 hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-slate-300 hover:text-white transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
