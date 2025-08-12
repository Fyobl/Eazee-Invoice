import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const EmailSetupModal = ({ isOpen, onClose, onComplete }: EmailSetupModalProps) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [senderEmail, setSenderEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
  });

  // Check if company details are missing
  const hasCompanyDetails = Boolean(user?.companyName && user?.companyAddress);

  // Setup email mutation
  const setupEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/setup-auto-email', {
        senderEmail: email
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresOtp) {
        setStep('verify');
        toast({
          title: "Verification Email Sent",
          description: "Check your email for a 6-digit verification code.",
        });
      }
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
    mutationFn: async (otpCode: string) => {
      const response = await apiRequest('POST', '/api/verify-sender-otp', {
        otp: otpCode
      });
      return response.json();
    },
    onSuccess: () => {
      setStep('complete');
      // Force complete cache refresh
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.refetchQueries({ queryKey: ['/api/me'] });
      
      toast({
        title: "Email Verified!",
        description: "You can now send professional emails with PDF attachments.",
      });
      
      setTimeout(() => {
        onComplete();
        handleClose();
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSetupEmail = () => {
    if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setupEmailMutation.mutate(senderEmail);
  };

  const handleVerifyOtp = () => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    verifyOtpMutation.mutate(otp);
  };

  const handleClose = () => {
    setStep('setup');
    setSenderEmail('');
    setOtp('');
    onClose();
  };

  const handleSkip = () => {
    toast({
      title: "Setup Skipped",
      description: "You can setup email sending later in the Email Settings page.",
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Setup Required
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && "Set up email sending to send professional invoices directly to your customers."}
            {step === 'verify' && "Enter the 6-digit verification code sent to your email."}
            {step === 'complete' && "Email setup complete! You can now send emails."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasCompanyDetails && step === 'setup' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete your company details in Settings before setting up email sending.
              </AlertDescription>
            </Alert>
          )}

          {step === 'setup' && hasCompanyDetails && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sender-email">Your Business Email Address</Label>
                <Input
                  id="sender-email"
                  type="email"
                  placeholder="your@business.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  disabled={setupEmailMutation.isPending}
                />
                <p className="text-sm text-muted-foreground">
                  This email will appear as the sender when you email invoices to customers.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSetupEmail}
                  disabled={setupEmailMutation.isPending || !hasCompanyDetails}
                  className="flex-1"
                >
                  {setupEmailMutation.isPending ? 'Setting up...' : 'Setup Email'}
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  Skip
                </Button>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">6-Digit Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={verifyOtpMutation.isPending}
                  maxLength={6}
                />
                <p className="text-sm text-muted-foreground">
                  Check your email ({senderEmail}) for the verification code.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleVerifyOtp}
                  disabled={verifyOtpMutation.isPending || otp.length !== 6}
                  className="flex-1"
                >
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button variant="outline" onClick={() => setStep('setup')}>
                  Back
                </Button>
              </div>
            </>
          )}

          {step === 'complete' && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-lg font-medium">Email Setup Complete!</p>
              <p className="text-sm text-muted-foreground">
                You can now send professional emails with PDF attachments.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};