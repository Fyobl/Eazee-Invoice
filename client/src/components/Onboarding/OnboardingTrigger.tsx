import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { SetupChecklist } from './SetupChecklist';

interface OnboardingProgress {
  id: number;
  uid: string;
  companyBrandingComplete: boolean;
  logoUploaded: boolean;
  firstCustomerAdded: boolean;
  firstProductAdded: boolean;
  firstQuoteCreated: boolean;
  firstInvoiceCreated: boolean;
  firstQuoteConverted: boolean;
  isOnboardingDismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

export function OnboardingTrigger() {
  const [isOpen, setIsOpen] = useState(false);

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

  if (isLoading || !progress || progress.isOnboardingDismissed) {
    return null;
  }

  const tasks = [
    progress.companyBrandingComplete,
    progress.logoUploaded,
    progress.firstCustomerAdded,
    progress.firstProductAdded,
    progress.firstQuoteCreated,
    progress.firstInvoiceCreated,
    progress.firstQuoteConverted
  ];

  const completedCount = tasks.filter(Boolean).length;
  const totalTasks = tasks.length;
  const isAllComplete = completedCount === totalTasks;

  if (isAllComplete) {
    return null; // Hide if everything is complete
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Let's get started
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {completedCount}/{totalTasks} setup tasks completed
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            size="sm"
            className="gap-2"
          >
            Continue setup
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-3">
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / totalTasks) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <SetupChecklist isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}