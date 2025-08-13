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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getEmailSettings, saveEmailSettings, defaultEmailSettings } from '@/lib/emailUtils';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Send, CheckCircle, AlertCircle, Trash2, Clock } from 'lucide-react';

// Schemas
const emailSetupSchema = z.object({
  senderEmail: z.string().email('Please enter a valid email address'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Verification code must be 6 digits'),
});

const emailTemplatesSchema = z.object({
  invoiceSubject: z.string().min(1, 'Invoice subject is required'),
  invoiceBody: z.string().min(1, 'Invoice body is required'),
  quoteSubject: z.string().min(1, 'Quote subject is required'),
  quoteBody: z.string().min(1, 'Quote body is required'),
  statementSubject: z.string().min(1, 'Statement subject is required'),
  statementBody: z.string().min(1, 'Statement body is required'),
});

type EmailSetupForm = z.infer<typeof emailSetupSchema>;
type OtpForm = z.infer<typeof otpSchema>;
type EmailTemplatesForm = z.infer<typeof emailTemplatesSchema>;

export const EmailSetupNew = () => {
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data - force fresh data every time
  const { data: response, refetch: refetchUser } = useQuery<any>({
    queryKey: ['/api/me'],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  const user = response?.user;

  // Email setup form
  const emailForm = useForm<EmailSetupForm>({
    resolver: zodResolver(emailSetupSchema),
    defaultValues: {
      senderEmail: user?.senderEmail || '',
    },
  });

  // OTP form
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Templates form
  const templatesForm = useForm<EmailTemplatesForm>({
    resolver: zodResolver(emailTemplatesSchema),
    defaultValues: getEmailSettings(),
  });

  // Check if email is verified
  const isEmailSetup = Boolean(user?.senderEmail);
  const isEmailVerified = user?.isEmailVerified === true;

  // Setup email mutation
  const setupEmailMutation = useMutation({
    mutationFn: async (data: EmailSetupForm) => {
      const response = await apiRequest('POST', '/api/setup-auto-email', data);
      return response.json();
    },
    onSuccess: () => {
      setShowOtpForm(true);
      toast({
        title: "Verification Email Sent",
        description: "Check your email for a 6-digit verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup email. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpForm) => {
      const response = await apiRequest('POST', '/api/verify-sender-otp', data);
      return response.json();
    },
    onSuccess: () => {
      setShowOtpForm(false);
      refetchUser();
      otpForm.reset();
      toast({
        title: "Email Verified Successfully!",
        description: "Your email is now ready for sending invoices, quotes, and statements.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete sender mutation
  const deleteSenderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/delete-sender');
      return response.json();
    },
    onSuccess: () => {
      setShowOtpForm(false);
      emailForm.reset();
      refetchUser();
      toast({
        title: "Email Removed",
        description: "Email setup has been removed. You can set up a new email address.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove email setup.",
        variant: "destructive",
      });
    },
  });

  // Save templates mutation
  const saveTemplatesMutation = useMutation({
    mutationFn: async (data: EmailTemplatesForm) => {
      saveEmailSettings(data);
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Templates Saved",
        description: "Email templates have been updated successfully.",
      });
    },
  });

  const onEmailSetup = (data: EmailSetupForm) => {
    setupEmailMutation.mutate(data);
  };

  const onOtpVerify = (data: OtpForm) => {
    verifyOtpMutation.mutate(data);
  };

  const onTemplatesSave = (data: EmailTemplatesForm) => {
    saveTemplatesMutation.mutate(data);
  };

  return (
    <Layout title="Email Setup">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Setup</h1>
          <p className="text-muted-foreground">
            Configure automatic email sending for invoices, quotes, and statements
          </p>
        </div>

        {/* Email Setup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>
              Set up your business email for automatic document sending
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Setup Complete State */}
            {isEmailSetup && isEmailVerified && (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-green-700 dark:text-green-400">
                          ✓ Email Setup Complete!
                        </strong>
                        <br />
                        Emails will be sent from <strong>{user?.senderEmail}</strong>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Change Email
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Change Email Address</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove your current email setup. You'll need to verify a new email address.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteSenderMutation.mutate()}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove & Change
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Ready to Use</h4>
                  <p className="text-sm text-muted-foreground">
                    You can now send professional emails with PDF attachments directly from your invoice, quote, and statement pages.
                  </p>
                </div>
              </div>
            )}

            {/* Email Setup Needed */}
            {!isEmailSetup && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Email Setup Required</strong>
                    <br />
                    Configure your business email to send professional documents automatically.
                  </AlertDescription>
                </Alert>

                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSetup)} className="space-y-4">
                    <FormField
                      control={emailForm.control}
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

                    <Button 
                      type="submit" 
                      disabled={setupEmailMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {setupEmailMutation.isPending ? 'Setting up...' : 'Setup Email Sending'}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {/* Email Setup but not verified */}
            {isEmailSetup && !isEmailVerified && (
              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    <strong className="text-yellow-700 dark:text-yellow-400">
                      Email Verification Pending
                    </strong>
                    <br />
                    Please verify your email address: <strong>{user?.senderEmail}</strong>
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => setShowOtpForm(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Enter Verification Code
                </Button>
              </div>
            )}

            {/* OTP Verification Form */}
            {showOtpForm && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Email Verification
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to <strong>{user?.senderEmail || emailForm.getValues('senderEmail')}</strong>:
                </p>

                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpVerify)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="123456"
                              maxLength={6}
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Check your email for the 6-digit code. Codes expire in 2-3 minutes.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={verifyOtpMutation.isPending || otpForm.watch('otp').length !== 6}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowOtpForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Templates Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </div>
              <Button
                variant="ghost"
                onClick={() => setIsTemplatesExpanded(!isTemplatesExpanded)}
              >
                {isTemplatesExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </CardTitle>
            <CardDescription>
              Customize email templates for invoices, quotes, and statements
            </CardDescription>
          </CardHeader>
          
          {isTemplatesExpanded && (
            <CardContent>
              <Form {...templatesForm}>
                <form onSubmit={templatesForm.handleSubmit(onTemplatesSave)} className="space-y-6">
                  {/* Invoice Template */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Invoice Email Template</h4>
                    
                    <FormField
                      control={templatesForm.control}
                      name="invoiceSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject Line</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templatesForm.control}
                      name="invoiceBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Body</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quote Template */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Quote Email Template</h4>
                    
                    <FormField
                      control={templatesForm.control}
                      name="quoteSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject Line</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templatesForm.control}
                      name="quoteBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Body</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Statement Template */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Statement Email Template</h4>
                    
                    <FormField
                      control={templatesForm.control}
                      name="statementSubject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject Line</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templatesForm.control}
                      name="statementBody"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Body</FormLabel>
                          <FormControl>
                            <Textarea rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={saveTemplatesMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {saveTemplatesMutation.isPending ? 'Saving...' : 'Save Templates'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
};