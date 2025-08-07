import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Quote, Users, DollarSign, CheckCircle, RotateCcw, Mail, BarChart3 } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

export const Landing = () => {
  const { currentUser, hasAccess, loading } = useAuth();
  const [, setLocation] = useLocation();

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
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">Eazee Invoice</span>
            </div>
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
      <section className="relative bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          {/* Office Scene Animation */}
          <div className="relative w-full h-full">
            {/* Floating Papers Animation */}
            <div className="absolute top-10 left-10 animate-float-slow">
              <svg width="40" height="50" viewBox="0 0 40 50" className="text-slate-600 dark:text-slate-400">
                <rect x="5" y="8" width="30" height="38" rx="2" fill="currentColor" opacity="0.6"/>
                <rect x="10" y="14" width="20" height="2" rx="1" fill="white"/>
                <rect x="10" y="18" width="15" height="2" rx="1" fill="white"/>
                <rect x="10" y="22" width="18" height="2" rx="1" fill="white"/>
                <rect x="10" y="26" width="12" height="2" rx="1" fill="white"/>
              </svg>
            </div>
            
            <div className="absolute top-32 right-20 animate-float-medium">
              <svg width="35" height="45" viewBox="0 0 35 45" className="text-blue-500 dark:text-blue-400">
                <rect x="3" y="6" width="28" height="35" rx="2" fill="currentColor" opacity="0.7"/>
                <rect x="8" y="12" width="18" height="2" rx="1" fill="white"/>
                <rect x="8" y="16" width="14" height="2" rx="1" fill="white"/>
                <rect x="8" y="20" width="16" height="2" rx="1" fill="white"/>
              </svg>
            </div>
            
            {/* Computer/Laptop Icons */}
            <div className="absolute bottom-20 left-1/4 animate-pulse-slow">
              <svg width="60" height="40" viewBox="0 0 60 40" className="text-slate-500 dark:text-slate-300">
                <rect x="5" y="5" width="50" height="30" rx="3" fill="currentColor" opacity="0.5"/>
                <rect x="8" y="8" width="44" height="24" rx="1" fill="white" opacity="0.8"/>
                <rect x="25" y="35" width="10" height="3" rx="1" fill="currentColor" opacity="0.5"/>
                <rect x="15" y="37" width="30" height="2" rx="1" fill="currentColor" opacity="0.5"/>
              </svg>
            </div>
            
            <div className="absolute top-16 right-1/3 animate-bounce-slow">
              <svg width="50" height="35" viewBox="0 0 50 35" className="text-green-500 dark:text-green-400">
                <rect x="3" y="3" width="44" height="26" rx="2" fill="currentColor" opacity="0.6"/>
                <rect x="6" y="6" width="38" height="20" rx="1" fill="white" opacity="0.9"/>
                <rect x="20" y="29" width="10" height="3" rx="1" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
            
            {/* People Silhouettes */}
            <div className="absolute bottom-10 right-1/4 animate-fade-in-out">
              <svg width="30" height="60" viewBox="0 0 30 60" className="text-slate-600 dark:text-slate-400">
                <circle cx="15" cy="12" r="8" fill="currentColor" opacity="0.4"/>
                <rect x="8" y="20" width="14" height="25" rx="7" fill="currentColor" opacity="0.4"/>
                <rect x="5" y="30" width="8" height="20" rx="4" fill="currentColor" opacity="0.3"/>
                <rect x="17" y="30" width="8" height="20" rx="4" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            
            <div className="absolute top-1/3 left-1/5 animate-sway">
              <svg width="25" height="55" viewBox="0 0 25 55" className="text-purple-500 dark:text-purple-400">
                <circle cx="12.5" cy="10" r="7" fill="currentColor" opacity="0.5"/>
                <rect x="6" y="17" width="13" height="23" rx="6" fill="currentColor" opacity="0.5"/>
                <rect x="3" y="28" width="7" height="18" rx="3" fill="currentColor" opacity="0.4"/>
                <rect x="15" y="28" width="7" height="18" rx="3" fill="currentColor" opacity="0.4"/>
              </svg>
            </div>
            
            {/* Geometric Office Elements */}
            <div className="absolute top-20 left-1/3 animate-rotate-slow">
              <svg width="40" height="40" viewBox="0 0 40 40" className="text-orange-400 dark:text-orange-300">
                <rect x="10" y="10" width="20" height="20" rx="2" fill="currentColor" opacity="0.3" transform="rotate(45 20 20)"/>
              </svg>
            </div>
            
            <div className="absolute bottom-1/3 right-10 animate-float-reverse">
              <svg width="35" height="35" viewBox="0 0 35 35" className="text-indigo-400 dark:text-indigo-300">
                <circle cx="17.5" cy="17.5" r="15" fill="currentColor" opacity="0.3"/>
                <circle cx="17.5" cy="17.5" r="8" fill="white" opacity="0.6"/>
              </svg>
            </div>
          </div>
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
                7-day free trial • Then £19.99/month • Cancel anytime
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
            <p className="text-xl text-slate-600 dark:text-slate-300">Start with our free trial, upgrade when you're ready</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free Trial</h3>
                <div className="text-4xl font-bold text-primary mb-4">7 Days</div>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Full access to all features</p>
                <ul className="text-left text-slate-600 dark:text-slate-300 mb-6 space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited invoices & quotes</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />PDF generation & email</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Customer management</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Business analytics</li>
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
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pro Plan</h3>
                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-4">£19.99<span className="text-lg text-slate-600 dark:text-slate-400">/month</span></div>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Everything in trial, plus unlimited usage</p>
                <ul className="text-left text-slate-600 dark:text-slate-300 mb-6 space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Everything in trial</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Unlimited usage</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Priority support</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cancel anytime</li>
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
                <FileText className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Eazee Invoice</span>
              </div>
              <p className="text-slate-300 mb-4 max-w-md">
                Professional invoice management solution for freelancers and small businesses. 
                Streamline your billing process with powerful tools and comprehensive analytics.
              </p>
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
                <li>
                  <Link href="/release-notes" className="text-slate-300 hover:text-white transition-colors">
                    Release Notes
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
