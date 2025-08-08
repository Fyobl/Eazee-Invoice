import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Target, Award, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const AboutUs = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img 
                  src="/attached_assets/Eazee Invoice Logo Transparent Small_1754663909119.png" 
                  alt="Eazee Invoice" 
                  className="h-10 w-auto"
                />
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
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              About Eazee Invoice
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              We're passionate about helping freelancers and small businesses streamline their invoicing 
              and business management processes with professional, easy-to-use tools.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                At Eazee Invoice, we believe that managing your business finances shouldn't be complicated. 
                Our mission is to provide powerful, intuitive tools that help freelancers and small businesses 
                create professional invoices, manage customers, and gain valuable insights into their business performance.
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                We're committed to building software that saves you time, reduces administrative burden, 
                and helps you focus on what you do best - growing your business.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Our Vision</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Empowering every business owner with professional-grade financial tools
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Our Focus</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Serving freelancers and small businesses with tailored solutions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features & Values */}
      <section className="py-20 bg-slate-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Choose Eazee Invoice?</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">Built with your business needs in mind</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Professional Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Generate professional PDF invoices and quotes with custom branding, 
                  multi-currency support, and automated calculations including VAT.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Complete Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Everything you need in one place: customer management, product catalogs, 
                  business analytics, email integration, and comprehensive reporting.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  User-Friendly
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Intuitive interface designed for non-technical users, with features like 
                  CSV import/export, soft delete recovery, and automated backups.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology & Security */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Built for Reliability & Security</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">Your data is safe with us</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Modern Technology Stack</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Secure Cloud Infrastructure:</strong>
                    <span className="text-slate-600 dark:text-slate-300 ml-2">
                      Built on reliable cloud platforms with automatic backups and 99.9% uptime
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Data Protection:</strong>
                    <span className="text-slate-600 dark:text-slate-300 ml-2">
                      SSL encryption, secure authentication, and GDPR-compliant data handling
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 dark:text-white">Payment Security:</strong>
                    <span className="text-slate-600 dark:text-slate-300 ml-2">
                      Integrated with Stripe for secure payment processing and subscription management
                    </span>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-8 text-center">
                  <Award className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Our Commitment</h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    We're committed to providing reliable, secure, and continuously improving 
                    software that grows with your business needs.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 dark:bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to Streamline Your Business?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Join thousands of freelancers and small businesses who trust Eazee Invoice 
            to manage their financial operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center md:space-x-4 mb-4 md:mb-0">
              <img 
                src="/attached_assets/Eazee Invoice Logo Transparent Small_1754663909119.png" 
                alt="Eazee Invoice" 
                className="h-8 w-auto mb-2 md:mb-0"
              />
              <a 
                href="https://www.facebook.com/profile.php?id=61578914895610" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label="Visit our Facebook page"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956.1874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/support" className="text-slate-300 hover:text-white transition-colors">
                Support
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