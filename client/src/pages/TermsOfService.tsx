import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Scale, Shield, CreditCard, AlertTriangle, Users } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const TermsOfService = () => {
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
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 dark:from-primary/10 dark:to-gray-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
              Terms and conditions for using Eazee Invoice
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
            
            {/* Agreement */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Agreement to Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  By accessing and using Eazee Invoice, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
              </CardContent>
            </Card>

            {/* Service Description */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Service Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 dark:text-slate-300">
                  Eazee Invoice is a Software as a Service (SaaS) platform that provides:
                </p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                  <li>Professional invoice and quote generation</li>
                  <li>Customer and product management</li>
                  <li>Business analytics and reporting</li>
                  <li>PDF generation and email integration</li>
                  <li>Payment processing through Stripe</li>
                  <li>Data import/export capabilities</li>
                  <li>Cloud storage and backup services</li>
                </ul>
              </CardContent>
            </Card>

            {/* User Accounts */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Accounts & Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Account Creation</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    You must provide accurate and complete information when creating your account. 
                    You are responsible for maintaining the confidentiality of your account credentials 
                    and for all activities that occur under your account.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Acceptable Use</h4>
                  <p className="text-slate-600 dark:text-slate-300">You agree not to:</p>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                    <li>Use the service for any illegal or unauthorized purpose</li>
                    <li>Violate any laws in your jurisdiction</li>
                    <li>Transmit viruses, malware, or other harmful code</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with or disrupt the service</li>
                    <li>Use the service to send spam or unsolicited communications</li>
                    <li>Impersonate another person or entity</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Responsibility</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    You are responsible for the accuracy and legality of all data you input into the system. 
                    This includes customer information, product details, pricing, and tax calculations. 
                    You must ensure compliance with all applicable tax and business regulations in your jurisdiction.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription & Billing */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Free Trial</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    New users receive a 7-day free trial with full access to all features. 
                    No payment information is required during the trial period.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Subscription Plans</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    After the trial period, continued use requires a paid subscription at £19.99 per month. 
                    Billing is processed monthly through Stripe, our payment processor.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Payment Terms</h4>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                    <li>Subscriptions are billed monthly in advance</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>Failed payments may result in service suspension</li>
                    <li>Price changes will be communicated with 30 days notice</li>
                    <li>You can cancel your subscription at any time</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Cancellation</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    You may cancel your subscription at any time through your account settings. 
                    Cancellation takes effect at the end of your current billing period. 
                    Your data will be retained for 90 days after cancellation for potential account reactivation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service Availability */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Service Availability & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Service Level</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. 
                    Planned maintenance will be communicated in advance when possible.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data Backup</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We perform regular automated backups of your data. However, you are encouraged 
                    to regularly export your data as an additional precaution.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Support</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Support is provided through our in-application help system and email. 
                    We aim to respond to support requests within 24-48 hours during business days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Intellectual Property */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Intellectual Property
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Our Rights</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Eazee Invoice and all related technology, content, and materials are protected by 
                    intellectual property rights. You may not copy, modify, or distribute our software 
                    or content without permission.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Your Rights</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    You retain all rights to your business data, customer information, and content 
                    that you upload to our service. You grant us a license to process this data 
                    solely for the purpose of providing our services.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Limitations & Disclaimers */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  Limitations & Disclaimers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Service Disclaimer</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Our service is provided "as is" without warranties of any kind. While we strive 
                    for accuracy in calculations and functionality, you are responsible for verifying 
                    all financial information and ensuring compliance with applicable laws.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Limitation of Liability</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    Our liability for any damages arising from the use of our service is limited to 
                    the amount you paid for the service in the 12 months preceding the claim. 
                    We are not liable for indirect, incidental, or consequential damages.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Tax Compliance</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    While our system can calculate VAT and other taxes, you are responsible for 
                    ensuring compliance with all applicable tax laws and regulations in your jurisdiction. 
                    We recommend consulting with a qualified accountant or tax professional.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Changes to Terms */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  We reserve the right to modify these terms at any time. We will notify users of 
                  material changes via email or through our platform. Continued use of the service 
                  after changes constitutes acceptance of the new terms.
                </p>
              </CardContent>
            </Card>

            {/* Termination */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Account Termination</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">By You</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    You may terminate your account at any time through your account settings. 
                    Upon termination, your access to the service will cease at the end of your 
                    current billing period.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">By Us</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    We may terminate accounts that violate these terms, engage in fraudulent activity, 
                    or for non-payment. We will provide reasonable notice when possible.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Data After Termination</h4>
                  <p className="text-slate-600 dark:text-slate-300">
                    After account termination, your data will be retained for 90 days to allow for 
                    account reactivation. After this period, all data will be permanently deleted.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Governing Law */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Governing Law & Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  These terms are governed by the laws of the United Kingdom. Any disputes arising 
                  from the use of our service will be resolved through binding arbitration or in 
                  the courts of the United Kingdom.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  If you have questions about these Terms of Service, please contact us through 
                  our support system within the application or reach out to us directly.
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
              <Link href="/about" className="text-slate-300 hover:text-white transition-colors">
                About Us
              </Link>
              <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                Privacy Policy
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