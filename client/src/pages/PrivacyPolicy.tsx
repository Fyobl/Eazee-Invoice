import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Shield, Lock, Eye, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const PrivacyPolicy = () => {
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
                  className="h-16 w-auto"
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
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
              How we protect and handle your personal information
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: December 2024
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            
            {/* Introduction */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  At Eazee Invoice, we are committed to protecting your privacy and personal information. 
                  This Privacy Policy explains how we collect, use, store, and protect your information 
                  when you use our invoicing and business management platform.
                </p>
              </CardContent>
            </Card>

            {/* Information We Collect */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Account Information</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    When you create an account, we collect your name, email address, company name, 
                    and password. This information is necessary to provide our services and communicate with you.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Business Data</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We store the business information you enter into our platform, including:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                    <li>Customer details and contact information</li>
                    <li>Product and service information</li>
                    <li>Invoice and quote data</li>
                    <li>Payment and subscription information</li>
                    <li>Business reports and analytics data</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Technical Information</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We automatically collect certain technical information to improve our service:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                    <li>IP address and geographic location (for security and localization)</li>
                    <li>Browser type and version</li>
                    <li>Device information and operating system</li>
                    <li>Usage patterns and feature interactions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* How We Use Your Information */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Service Delivery</h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Provide invoice and business management services</li>
                    <li>Generate PDF documents and send emails</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Provide customer support and technical assistance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Security & Compliance</h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Protect against fraud and unauthorized access</li>
                    <li>Comply with legal and regulatory requirements</li>
                    <li>Monitor system performance and security</li>
                    <li>Backup and recover your data</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Communications</h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Send important service updates and notifications</li>
                    <li>Respond to support requests and inquiries</li>
                    <li>Send billing and payment information</li>
                    <li>Provide product updates and feature announcements (with your consent)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Data Protection & Security */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Data Protection & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Encryption & Security</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We use industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                    <li>SSL/TLS encryption for all data transmission</li>
                    <li>Encrypted storage of sensitive information</li>
                    <li>Secure authentication and password protection</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Automatic backups and disaster recovery</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Access Controls</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Access to your data is strictly limited to authorized personnel who need it 
                    to provide services or support. All access is logged and monitored.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Retention</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We retain your data for as long as your account is active or as needed to 
                    provide services. Deleted items are moved to a recycle bin for 7 days before 
                    permanent deletion. Account data is retained for up to 90 days after account closure.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Your Rights & Choices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Access & Control</h4>
                  <p className="text-slate-600 dark:text-slate-300">You have the right to:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                    <li>Access and download your personal data</li>
                    <li>Correct or update inaccurate information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your business data at any time</li>
                    <li>Opt out of non-essential communications</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">GDPR Compliance</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    If you're located in the European Union, you have additional rights under GDPR, 
                    including the right to data portability, the right to be forgotten, and the 
                    right to object to processing.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Third-Party Services */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Third-Party Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Payment Processing</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We use Stripe for secure payment processing. Stripe handles all payment data 
                    according to their privacy policy and PCI DSS compliance standards.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Email Services</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We use trusted email service providers to send invoices, notifications, and 
                    support communications. These services are GDPR compliant and process data 
                    according to our instructions.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Sharing</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We do not sell, rent, or share your personal information with third parties 
                    for marketing purposes. We only share data when necessary to provide our 
                    services or when required by law.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  If you have questions about this Privacy Policy or how we handle your data, 
                  please contact us:
                </p>
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Support Contact</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Email: <a href="mailto:support@eazeeinvoice.com" className="text-primary hover:underline">
                      support@eazeeinvoice.com
                    </a>
                  </p>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  We're committed to addressing any privacy concerns promptly and transparently. 
                  We typically respond to privacy-related inquiries within 24-48 hours.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Privacy Policy */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  We may update this Privacy Policy from time to time to reflect changes in our 
                  practices or for legal and regulatory reasons. We will notify you of any material 
                  changes by email or through our platform. The "Last updated" date at the top of 
                  this policy indicates when it was last revised.
                </p>
              </CardContent>
            </Card>

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