import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Quote, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Login } from './Auth/Login';
import { Register } from './Auth/Register';

export const Landing = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const features = [
    {
      icon: FileText,
      title: 'Invoice Management',
      description: 'Create, send, and track professional invoices with automated reminders'
    },
    {
      icon: Quote,
      title: 'Quote Generation',
      description: 'Generate professional quotes and convert them to invoices instantly'
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Organize customer information and track project history'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-slate-900">InvoicePro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setShowLogin(true)}>
                Login
              </Button>
              <Button onClick={() => setShowRegister(true)}>
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-slate-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Professional Invoice Management
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Create, manage, and track invoices, quotes, and statements with ease. 
              Built specifically for freelancers and small businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setShowRegister(true)}>
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Everything You Need to Manage Your Business
            </h2>
            <p className="text-xl text-slate-600">Professional tools to streamline your workflow</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <Icon className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-600">Start with our free trial, upgrade when you're ready</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Trial</h3>
                <div className="text-4xl font-bold text-primary mb-4">7 Days</div>
                <p className="text-slate-600 mb-6">Full access to all features</p>
                <Button className="w-full" onClick={() => setShowRegister(true)}>
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro Plan</h3>
                <div className="text-4xl font-bold text-slate-900 mb-4">Coming Soon</div>
                <p className="text-slate-600 mb-6">Unlimited access and premium features</p>
                <Button variant="secondary" className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Modals */}
      <Modal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        title="Welcome Back"
        description="Sign in to your account to continue"
      >
        <Login onSuccess={() => setShowLogin(false)} />
      </Modal>

      <Modal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        title="Create Your Account"
        description="Start your 7-day free trial today"
      >
        <Register onSuccess={() => setShowRegister(false)} />
      </Modal>
    </div>
  );
};
