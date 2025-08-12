import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mail, AlertTriangle, Info, Send } from 'lucide-react';

const autoEmailSetupSchema = z.object({
  senderEmail: z.string().email('Please enter a valid email address'),
});

type AutoEmailSetupForm = z.infer<typeof autoEmailSetupSchema>;

interface EmailSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const EmailSetupModal = ({ isOpen, onClose, onComplete }: EmailSetupModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
  });

  const form = useForm<AutoEmailSetupForm>({
    resolver: zodResolver(autoEmailSetupSchema),
    defaultValues: {
      senderEmail: user?.senderEmail || user?.email || '',
    },
  });

  // Auto email setup mutation
  const setupAutoEmailMutation = useMutation({
    mutationFn: async (data: AutoEmailSetupForm) => {
      const response = await apiRequest('POST', '/api/setup-auto-email', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Setup Initiated",
        description: "Check your email for a verification message from Brevo to complete the setup.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed", 
        description: error.message || "Failed to setup auto email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AutoEmailSetupForm) => {
    setupAutoEmailMutation.mutate(data);
  };

  const hasCompanyDetails = user?.companyName && user?.companyAddress;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Setup Required
          </DialogTitle>
          <DialogDescription>
            To send emails with PDF attachments, you need to complete the setup process.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasCompanyDetails && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Company details missing:</strong> Please complete your company information in Settings before setting up email sending.
              </AlertDescription>
            </Alert>
          )}

          {hasCompanyDetails && !user?.isEmailVerified && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="senderEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="your.email@company.com" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This email will be used to send invoices, quotes, and statements to customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive a verification email to confirm this address. Once verified, emails will appear to come from your business email with PDFs automatically attached.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={setupAutoEmailMutation.isPending}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Send className="h-4 w-4" />
                    {setupAutoEmailMutation.isPending ? 'Setting up...' : 'Set up email sending'}
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {hasCompanyDetails && user?.isEmailVerified && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Email sending is already set up and ready to use!
                </AlertDescription>
              </Alert>
              <Button onClick={onComplete} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {!hasCompanyDetails && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  onClose();
                  // Navigate to settings - implement this based on your routing
                  window.location.href = '/settings';
                }}
                className="flex-1"
              >
                Go to Settings
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};