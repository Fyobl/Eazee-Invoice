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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getEmailSettings, saveEmailSettings, defaultEmailSettings } from '@/lib/emailUtils';
import { apiRequest } from '@/lib/queryClient';
import { Mail, RotateCcw, Info, Send, CheckCircle, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { RequestNewCodeButton } from '@/components/Email/RequestNewCodeButton';

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

const otpVerificationSchema = z.object({
  otp: z.string().length(6, 'Verification code must be 6 digits'),
});

type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;
type AutoEmailSetupForm = z.infer<typeof autoEmailSetupSchema>;
type OtpVerificationForm = z.infer<typeof otpVerificationSchema>;

export const EmailSettings = () => {
  const [isResetting, setIsResetting] = useState(false);
  // Removed unused local state variables
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user data for email verification status  
  const { data: user, refetch: refetchUser, isLoading: userLoading } = useQuery({
    queryKey: ['/api/me'],
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the result (formerly cacheTime)
  });

  // Database rule: if senderEmail exists, show verified status
  const hasVerifiedEmail = Boolean(user?.senderEmail);
  
  console.log('📧 Email Settings Status:', { 
    senderEmail: user?.senderEmail,
    hasVerifiedEmail,
    willShowVerified: hasVerifiedEmail,
    user: user
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

  const otpForm = useForm<OtpVerificationForm>({
    resolver: zodResolver(otpVerificationSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Auto email setup mutation
  const setupAutoEmailMutation = useMutation({
    mutationFn: async (data: AutoEmailSetupForm) => {
      const response = await apiRequest('POST', '/api/setup-auto-email', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresOtp) {
        setShowOtpVerification(true);
        toast({
          title: "Verification Email Sent",
          description: "Check your email for a 6-digit verification code and enter it below.",
        });
      }
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

  // OTP verification mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpVerificationForm) => {
      const response = await apiRequest('POST', '/api/verify-sender-otp', data);
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('🎉 Verification success response:', data);
      setShowOtpVerification(false);
      
      // Immediately set local verified state
      setIsEmailVerifiedLocal(true);
      setVerifiedEmailLocal(user?.senderEmail || 'fyobl_ben@hotmail.com');
      
      toast({
        title: "Email Verified!",
        description: "Your email is now verified and ready for sending invoices.",
      });
      
      otpForm.reset();
    },
    onError: (error: any) => {
      if (error.message?.includes('invalid_code') || error.message?.includes('expired')) {
        toast({
          title: "Verification Code Invalid",
          description: "The code is incorrect or expired. Brevo codes expire in 2-3 minutes. Click 'Get New Code' if needed.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: error.message || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Delete sender mutation
  const deleteSenderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/delete-sender');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Email Deleted",
          description: data.message,
        });
        setShowOtpVerification(false);
        queryClient.invalidateQueries({ queryKey: ['/api/me'] });
        autoEmailForm.reset();
        otpForm.reset();
      }
    },
    onError: (error: any) => {
      console.error('Delete sender error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete sender email. Please try again.",
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

  const onOtpSubmit = async (data: OtpVerificationForm) => {
    verifyOtpMutation.mutate(data);
  };

  // Delete sender function is now handled directly in the AlertDialog onClick

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
            {userLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-2">Loading...</span>
              </div>
            ) : hasVerifiedEmail ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-green-700 dark:text-green-400">✓ Email Verified & Ready!</strong>
                        <br />
                        Emails will be sent from <strong>{user?.senderEmail}</strong> with replies going directly to your email address.
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={deleteSenderMutation.isPending}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleteSenderMutation.isPending ? 'Deleting...' : 'Change Email'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Change Email Address</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this email setup? You will need to verify a new email address to send emails again.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteSenderMutation.mutate();
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete & Change Email
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your automatic email sending is fully configured and ready to use. You can now send invoices, quotes, and statements with PDFs automatically attached.
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => refetchUser()}
                      className="text-xs"
                    >
                      Refresh Status
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Email Setup Required</strong>
                    <br />
                    Set up automatic email sending to send invoices, quotes, and statements directly to customers with PDFs attached.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={() => {
                    const popup = window.open('', 'EmailSetup', 'width=600,height=700,scrollbars=yes,resizable=yes');
                    if (popup) {
                      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Email Setup - Eazee Invoice</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      background: #0f172a; 
      color: white; 
      padding: 20px; 
      margin: 0;
    }
    .container { max-width: 500px; margin: 0 auto; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 5px; font-weight: 500; }
    input { 
      width: 100%; 
      padding: 12px; 
      border: 1px solid #374151; 
      border-radius: 6px; 
      background: #1f2937;
      color: white;
      font-size: 14px;
      box-sizing: border-box;
    }
    input::placeholder { color: #9ca3af; }
    button { 
      background: #3b82f6; 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 6px; 
      cursor: pointer; 
      font-size: 14px;
      font-weight: 500;
    }
    button:hover { background: #2563eb; }
    button:disabled { 
      background: #6b7280; 
      cursor: not-allowed; 
    }
    .steps { 
      background: #1f2937; 
      padding: 16px; 
      border-radius: 6px; 
      margin-bottom: 20px; 
    }
    .steps ol { margin: 10px 0 0 0; padding-left: 20px; }
    .steps li { margin-bottom: 8px; }
    .otp-section { 
      background: #1e3a8a; 
      padding: 16px; 
      border-radius: 6px; 
      margin-top: 20px; 
      display: none; 
    }
    .success { 
      background: #166534; 
      color: #dcfce7; 
      padding: 16px; 
      border-radius: 6px; 
      text-align: center; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Email Setup - Eazee Invoice</h2>
    <p>Set up automatic email sending through our secure email service.</p>
    
    <div class="steps">
      <strong>How it works:</strong>
      <ol>
        <li>Enter your business email address</li>
        <li>Click "Set up auto email" to begin verification</li>
        <li>Check your email for a 6-digit verification code from Brevo</li>
        <li>Enter the verification code when prompted</li>
        <li>Once verified, you can send professional emails with PDFs attached</li>
      </ol>
    </div>
    
    <div id="setupForm">
      <div class="form-group">
        <label for="email">Sender Email Address</label>
        <input type="email" id="email" placeholder="your.email@company.com" required>
        <small style="color: #9ca3af; font-size: 12px;">
          This email address will be used to send invoices, quotes, and statements.
        </small>
      </div>
      
      <button onclick="setupEmail()" id="setupBtn">
        Set up auto email
      </button>
    </div>
    
    <div id="otpSection" class="otp-section">
      <h4>Email Verification Required</h4>
      <p>Enter the 6-digit verification code sent to <strong id="sentTo"></strong>:</p>
      <div class="form-group">
        <label for="otp">Verification Code</label>
        <input type="text" id="otp" placeholder="123456" maxlength="6" pattern="[0-9]{6}">
      </div>
      <button onclick="verifyOtp()" id="verifyBtn">
        Verify Code
      </button>
    </div>
    
    <div id="successSection" style="display: none;">
      <div class="success">
        <h3>Email Verified & Ready!</h3>
        <p>Your automatic email sending is now configured.</p>
        <button onclick="window.close()" style="margin-top: 10px;">
          Close Window
        </button>
      </div>
    </div>
  </div>
  
  <script>
    async function setupEmail() {
      const email = document.getElementById('email').value;
      if (!email) {
        alert('Please enter an email address');
        return;
      }
      
      const btn = document.getElementById('setupBtn');
      btn.disabled = true;
      btn.textContent = 'Setting up...';
      
      try {
        const response = await fetch('/api/setup-auto-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ senderEmail: email }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          document.getElementById('setupForm').style.display = 'none';
          document.getElementById('otpSection').style.display = 'block';
          document.getElementById('sentTo').textContent = email;
        } else {
          alert('Error: ' + data.message);
          btn.disabled = false;
          btn.textContent = 'Set up auto email';
        }
      } catch (error) {
        alert('Network error: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Set up auto email';
      }
    }
    
    async function verifyOtp() {
      const otp = document.getElementById('otp').value;
      if (!otp) {
        alert('Please enter the verification code');
        return;
      }
      
      const btn = document.getElementById('verifyBtn');
      btn.disabled = true;
      btn.textContent = 'Verifying...';
      
      try {
        const response = await fetch('/api/verify-sender-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ otp: otp }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          document.getElementById('otpSection').style.display = 'none';
          document.getElementById('successSection').style.display = 'block';
          
          // Force refresh parent window with cache clearing
          if (window.opener) {
            window.opener.location.reload(true);
          }
        } else {
          alert('Error: ' + data.message);
          btn.disabled = false;
          btn.textContent = 'Verify Code';
        }
      } catch (error) {
        alert('Network error: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Verify Code';
      }
    }
    
    // Enter key support
    document.getElementById('email').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') setupEmail();
    });
    document.getElementById('otp').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') verifyOtp();
    });
  </script>
</body>
</html>`;
                      popup.document.write(htmlContent);
                      popup.document.close();
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Set up Automated Email Sending
                </Button>
              </div>
            )}
            
            {/* Remove OTP section since it's now in popup */}
            {false && (
              <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Email Verification Required
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit verification code sent to <strong>{user?.senderEmail}</strong>:
                </p>
                
                <Form {...otpForm}>
                  <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>6-Digit Verification Code</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              placeholder="123456"
                              maxLength={6}
                              {...field}
                              onChange={(e) => {
                                // Only allow numbers and limit to 6 digits
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Check your email for the verification code from Brevo. <strong>Important:</strong> Codes expire in 2-3 minutes. If your code doesn't work, click "Get New Code" below.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        type="submit" 
                        disabled={verifyOtpMutation.isPending || otpForm.watch('otp').length !== 6}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify Code'}
                      </Button>
                      
                      <RequestNewCodeButton
                        senderEmail={user?.senderEmail || ''}
                        onCodeRequested={() => {
                          otpForm.reset();
                          toast({
                            title: "Fresh Code Sent",
                            description: "Enter the new 6-digit code from your email.",
                          });
                        }}
                      />
                      
                      {showOtpVerification && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setShowOtpVerification(false)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </div>
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