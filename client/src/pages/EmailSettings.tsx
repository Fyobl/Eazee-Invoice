import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getEmailSettings, saveEmailSettings, defaultEmailSettings } from '@/lib/emailUtils';
import { apiRequest } from '@/lib/queryClient';
import { Mail, RotateCcw, Info, Send, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const emailSettingsSchema = z.object({
  invoiceSubject: z.string().min(1, 'Invoice subject is required'),
  invoiceBody: z.string().min(1, 'Invoice body is required'),
  quoteSubject: z.string().min(1, 'Quote subject is required'),
  quoteBody: z.string().min(1, 'Quote body is required'),
  statementSubject: z.string().min(1, 'Statement subject is required'),
  statementBody: z.string().min(1, 'Statement body is required'),
});

const autoEmailSetupSchema = z.object({
  senderEmail: z.string().email('Please enter a valid email address'),
});

type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;
type AutoEmailSetupForm = z.infer<typeof autoEmailSetupSchema>;

export const EmailSettings = () => {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data for email verification status
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
  });

  const form = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: getEmailSettings(),
  });

  const autoEmailForm = useForm<AutoEmailSetupForm>({
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
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup auto email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: EmailSettingsForm) => {
    try {
      saveEmailSettings(data);
      toast({
        title: "Email Settings Updated",
        description: "Your email templates have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    setIsResetting(true);
    form.reset(defaultEmailSettings);
    saveEmailSettings(defaultEmailSettings);
    toast({
      title: "Settings Reset",
      description: "Email templates have been reset to default values.",
    });
    setIsResetting(false);
  };

  const onAutoEmailSubmit = async (data: AutoEmailSetupForm) => {
    setupAutoEmailMutation.mutate(data);
  };

  const getEmailVerificationStatus = () => {
    if (!user?.senderEmail) return null;
    
    switch (user.emailVerificationStatus) {
      case 'verified':
        return { icon: CheckCircle, color: 'text-green-600', text: 'Email verified and ready for sending' };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600', text: 'Verification pending - check your email' };
      case 'failed':
        return { icon: AlertCircle, color: 'text-red-600', text: 'Verification failed - please try again' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', text: 'Email verification status unknown' };
    }
  };

  return (
    <Layout title="Email Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Email Settings</h2>
            <p className="text-slate-600 dark:text-slate-400">Configure email templates and automatic email sending</p>
          </div>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </Button>
        </div>

        {/* Auto Email Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Automatic Email Sending
            </CardTitle>
            <CardDescription>
              Set up automatic email sending through our secure email service. Once verified, you can send invoices, quotes, and statements directly to customers with PDFs automatically attached.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.isEmailVerified && user?.senderEmail ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Auto email is set up and ready! Emails will be sent from <strong>{user.senderEmail}</strong> with replies going directly to your email address.
                  </AlertDescription>
                </Alert>
                {(() => {
                  const status = getEmailVerificationStatus();
                  if (!status) return null;
                  const Icon = status.icon;
                  return (
                    <div className={`flex items-center gap-2 text-sm ${status.color}`}>
                      <Icon className="h-4 w-4" />
                      {status.text}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <Form {...autoEmailForm}>
                <form onSubmit={autoEmailForm.handleSubmit(onAutoEmailSubmit)} className="space-y-4">
                  <FormField
                    control={autoEmailForm.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sender Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="your.email@company.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This email address will be used to send invoices, quotes, and statements. You will receive a verification email to confirm this address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>How it works:</strong>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Enter your business email address above</li>
                        <li>Click "Set up auto email" to begin verification</li>
                        <li>Check your email for a verification message from Brevo</li>
                        <li>Click the verification link to complete setup</li>
                        <li>Once verified, you can send professional emails with PDFs attached</li>
                      </ol>
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    disabled={setupAutoEmailMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {setupAutoEmailMutation.isPending ? 'Setting up...' : 'Set up auto email'}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Available Variables
            </CardTitle>
            <CardDescription>
              You can use these variables in your email templates. They will be automatically replaced with actual values when sending emails.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Invoice Templates:</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{invoiceNumber}'}</code> - Invoice number</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{customerName}'}</code> - Customer name</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{companyName}'}</code> - Your company name</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{issueDate}'}</code> - Invoice issue date</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{dueDate}'}</code> - Invoice due date</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{total}'}</code> - Invoice total amount</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Quote Templates:</h4>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{quoteNumber}'}</code> - Quote number</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{customerName}'}</code> - Customer name</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{companyName}'}</code> - Your company name</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{issueDate}'}</code> - Quote issue date</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{validUntil}'}</code> - Quote valid until date</li>
                  <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{total}'}</code> - Quote total amount</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Invoice Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Invoice Email Templates
                </CardTitle>
                <CardDescription>
                  Configure the email subject and body for invoice emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="invoiceSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Invoice {invoiceNumber} from {companyName}" {...field} />
                      </FormControl>
                      <FormDescription>
                        The subject line for invoice emails
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="invoiceBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Body</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the email body for invoices..."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The main content of the invoice email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Quote Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Quote Email Templates
                </CardTitle>
                <CardDescription>
                  Configure the email subject and body for quote emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="quoteSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Quote {quoteNumber} from {companyName}" {...field} />
                      </FormControl>
                      <FormDescription>
                        The subject line for quote emails
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quoteBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quote Body</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the email body for quotes..."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The main content of the quote email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            {/* Statement Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Statement Email Templates
                </CardTitle>
                <CardDescription>
                  Configure the email subject and body for statement emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="statementSubject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Statement from {companyName}" {...field} />
                      </FormControl>
                      <FormDescription>
                        The subject line for statement emails
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="statementBody"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement Body</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the email body for statements..."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The main content of the statement email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Email Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};