import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, X, Settings, Upload, Users, Package, FileText, Quote, ArrowRight, ExternalLink, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';

interface OnboardingProgress {
  id: number;
  uid: string;
  companyBrandingComplete: boolean;
  logoUploaded: boolean;
  emailSetupComplete: boolean;
  firstCustomerAdded: boolean;
  firstProductAdded: boolean;
  firstQuoteCreated: boolean;
  firstInvoiceCreated: boolean;
  firstQuoteConverted: boolean;
  isOnboardingDismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SetupChecklistProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetupChecklist({ isOpen, onOpenChange }: SetupChecklistProps) {
  const queryClient = useQueryClient();

  const { data: progress, isLoading } = useQuery({
    queryKey: ['onboarding-progress'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding-progress', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch onboarding progress');
      return response.json() as Promise<OnboardingProgress>;
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/onboarding-dismiss', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      onOpenChange(false);
    }
  });

  if (isLoading || !progress) {
    return null;
  }

  const tasks = [
    {
      id: 'branding',
      title: 'Set up company branding',
      description: 'Add company name and address in settings',
      completed: progress.companyBrandingComplete,
      icon: Settings,
      link: '/settings',
      linkText: 'Go to Settings'
    },
    {
      id: 'logo',
      title: 'Upload company logo',
      description: 'Upload your logo to appear on documents',
      completed: progress.logoUploaded,
      icon: Upload,
      link: '/settings',
      linkText: 'Upload Logo'
    },
    {
      id: 'email',
      title: 'Set up email sending',
      description: 'Configure email to send invoices and quotes directly',
      completed: progress.emailSetupComplete,
      icon: Mail,
      link: '/settings',
      linkText: 'Setup Email'
    },
    {
      id: 'customers',
      title: 'Add your first customer',
      description: 'Create customer profiles for invoicing',
      completed: progress.firstCustomerAdded,
      icon: Users,
      link: '/customers/new',
      linkText: 'Add Customer'
    },
    {
      id: 'products',
      title: 'Add your first product',
      description: 'Create products/services to include in quotes',
      completed: progress.firstProductAdded,
      icon: Package,
      link: '/products/new',
      linkText: 'Add Product'
    },
    {
      id: 'quote',
      title: 'Create your first quote',
      description: 'Generate quotes to send to customers',
      completed: progress.firstQuoteCreated,
      icon: Quote,
      link: '/quotes/new',
      linkText: 'Create Quote'
    },
    {
      id: 'invoice',
      title: 'Create your first invoice',
      description: 'Send invoices to request payment',
      completed: progress.firstInvoiceCreated,
      icon: FileText,
      link: '/invoices/new',
      linkText: 'Create Invoice'
    },
    {
      id: 'convert',
      title: 'Convert quote to invoice',
      description: 'Turn accepted quotes into invoices',
      completed: progress.firstQuoteConverted,
      icon: ArrowRight,
      link: '/quotes',
      linkText: 'View Quotes'
    }
  ];

  const completedCount = tasks.filter(task => task.completed).length;
  const progressPercentage = Math.round((completedCount / tasks.length) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete setup</DialogTitle>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Get your invoice system up and running
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>{completedCount} / {tasks.length} Completed</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          
          <Progress value={progressPercentage} className="w-full" />

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {tasks.map((task) => {
              const Icon = task.icon;
              return (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    task.completed
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${task.completed ? 'text-green-600' : 'text-slate-600 dark:text-slate-400'}`} />
                      <h3 className={`font-medium text-sm ${task.completed ? 'text-green-800 dark:text-green-200' : 'text-slate-900 dark:text-slate-100'}`}>
                        {task.title}
                      </h3>
                    </div>
                    <p className={`text-xs ${task.completed ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>
                      {task.description}
                    </p>
                  </div>

                  {!task.completed && (
                    <Link href={task.link}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => onOpenChange(false)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {task.linkText}
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => dismissMutation.mutate()}
              disabled={dismissMutation.isPending}
              className="flex-1"
            >
              {dismissMutation.isPending ? 'Dismissing...' : 'Dismiss'}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}