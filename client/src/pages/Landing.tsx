import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Quote, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';
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
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Button size="lg" onClick={() => setShowRegister(true)}>
                Start 7-Day Free Trial
              </Button>
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
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Weather Dashboard</h3>
              <p className="text-slate-600 dark:text-slate-300">Stay informed with local weather right in your dashboard</p>
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
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Admin Panel</h3>
              <p className="text-slate-600 dark:text-slate-300">Advanced user management and subscription controls for administrators</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Soft Delete & Recovery</h3>
              <p className="text-slate-600 dark:text-slate-300">Accidentally deleted items? Recover them within 7 days from recycle bin</p>
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
                <Button className="w-full" onClick={() => setShowRegister(true)}>
                  Start Free Trial
                </Button>
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
    </div>
  );
};
