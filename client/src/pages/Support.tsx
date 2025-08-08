import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Mail, Clock, HelpCircle, MessageSquare, Phone, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export const Support = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <img 
                  src="/attached_assets/Eazee Invoice Logo Blue Background Small_1754663816740.png" 
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
              Support & Help Center
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-4">
              Get the help you need with Eazee Invoice
            </p>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              We're here to help you succeed with your invoicing and business management needs
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Get in Touch</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Multiple ways to reach our support team
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Mail className="h-6 w-6 text-primary" />
                  Email Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Primary Contact</h4>
                    <a 
                      href="mailto:support@eazeeinvoice.com" 
                      className="text-lg text-primary hover:underline font-medium"
                    >
                      support@eazeeinvoice.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="h-4 w-4" />
                    <span>Response time: 24-48 hours</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Email us for technical support, billing questions, feature requests, 
                    or any other assistance you need.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  In-App Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-300">
                    For existing users, access our comprehensive help system directly within the application.
                  </p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Available Features</h4>
                    <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Step-by-step guides
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Video tutorials
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        FAQ section
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Feature documentation
                      </li>
                    </ul>
                  </div>
                  <Link href="/login">
                    <Button className="w-full">Access Help Center</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-16 bg-slate-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">How We Can Help</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Common areas where our support team assists customers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Account setup and configuration</li>
                  <li>• First invoice creation</li>
                  <li>• Customer and product management</li>
                  <li>• Basic feature walkthrough</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Technical Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• PDF generation issues</li>
                  <li>• Email delivery problems</li>
                  <li>• Data import/export assistance</li>
                  <li>• Browser compatibility</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Billing & Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Payment and billing questions</li>
                  <li>• Subscription management</li>
                  <li>• Plan upgrades or changes</li>
                  <li>• Invoice and receipt requests</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Feature Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• New feature suggestions</li>
                  <li>• Workflow improvements</li>
                  <li>• Integration requests</li>
                  <li>• User experience feedback</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Business Consultation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Best practice recommendations</li>
                  <li>• Workflow optimization</li>
                  <li>• Tax and compliance guidance</li>
                  <li>• Business process advice</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Account Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Password reset assistance</li>
                  <li>• Account recovery</li>
                  <li>• Data migration help</li>
                  <li>• Security concerns</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Support Hours & Expectations */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Support Hours & Response Times</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              What to expect when you contact us
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Email Support</h4>
                  <p className="text-slate-600 dark:text-slate-300">24-48 hours during business days</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Urgent Issues</h4>
                  <p className="text-slate-600 dark:text-slate-300">Same day response when possible</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Feature Requests</h4>
                  <p className="text-slate-600 dark:text-slate-300">Acknowledged within 72 hours</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Our Commitment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Professional Support</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Knowledgeable team with expertise in invoicing and business management
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Clear Communication</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Easy-to-understand responses with step-by-step guidance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">Follow-up Support</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        We check back to ensure your issue is fully resolved
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-16 bg-slate-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I start my free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Simply click "Sign Up" and create your account. You'll immediately have access to all features 
                  for 7 days with no payment information required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my subscription anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Yes, you can cancel your subscription at any time through your account settings. 
                  Your access continues until the end of your current billing period.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do I import my existing customer data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Use our CSV import feature in the Customers section. We support standard formats and 
                  provide templates to make the process easy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure and backed up?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-300">
                  Yes, we use industry-standard encryption and perform automated daily backups. 
                  Your data is stored securely in the cloud with 99.9% uptime.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Need more detailed help? Access our complete knowledge base after signing up.
            </p>
            <Link href="/register">
              <Button size="lg">Get Started for Free</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-primary/5 dark:bg-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Don't hesitate to reach out. We're here to help you succeed with Eazee Invoice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@eazeeinvoice.com">
              <Button size="lg" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </Button>
            </a>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Access Help Center
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