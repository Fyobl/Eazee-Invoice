import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEmailSetup } from '@/hooks/useEmailSetup';
import { EmailSetupModal } from './EmailSetupModal';
import { apiRequest } from '@/lib/queryClient';
import { getEmailSettings } from '@/lib/emailUtils';
import { Mail, Loader2 } from 'lucide-react';

interface EmailSendButtonProps {
  documentType: 'invoice' | 'quote' | 'statement';
  customerEmail: string;
  customerName: string;
  documentNumber: string;
  documentData: any; // The document data for variable replacement
  pdfBase64?: string; // Optional PDF attachment
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const EmailSendButton = ({
  documentType,
  customerEmail,
  customerName,
  documentNumber,
  documentData,
  pdfBase64,
  className,
  variant = 'outline',
  size = 'sm'
}: EmailSendButtonProps) => {
  const { toast } = useToast();
  const {
    showEmailSetup,
    showEmailSetupModal,
    closeEmailSetupModal,
    onEmailSetupComplete,
    isEmailSetupComplete
  } = useEmailSetup();

  const [isSending, setIsSending] = useState(false);

  // Email sending mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: {
      to: string;
      toName: string;
      subject: string;
      body: string;
      pdfBase64?: string;
      pdfFilename?: string;
    }) => {
      const response = await apiRequest('POST', '/api/send-email', emailData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} sent successfully to ${customerEmail}`,
      });
      setIsSending(false);
    },
    onError: (error: any) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email. Please try again.",
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  const handleSendEmail = async () => {
    // Check if email setup is complete
    if (!showEmailSetupModal()) {
      return; // Modal will be shown by the hook
    }

    setIsSending(true);

    try {
      // Get email templates from local storage
      const emailSettings = getEmailSettings();
      
      // Prepare variables for template replacement
      const variables = {
        customerName: customerName,
        companyName: documentData.companyName || 'Your Company',
        [`${documentType}Number`]: documentNumber,
        issueDate: documentData.date ? new Date(documentData.date).toLocaleDateString() : '',
        dueDate: documentData.dueDate ? new Date(documentData.dueDate).toLocaleDateString() : '',
        validUntil: documentData.validUntil ? new Date(documentData.validUntil).toLocaleDateString() : '',
        total: documentData.total ? `£${documentData.total}` : ''
      };

      // Get the appropriate template
      let subject = '';
      let body = '';
      
      switch (documentType) {
        case 'invoice':
          subject = emailSettings.invoiceSubject;
          body = emailSettings.invoiceBody;
          break;
        case 'quote':
          subject = emailSettings.quoteSubject;
          body = emailSettings.quoteBody;
          break;
        case 'statement':
          subject = emailSettings.statementSubject;
          body = emailSettings.statementBody;
          break;
      }

      // Prepare PDF filename
      const pdfFilename = pdfBase64 ? `${documentType}-${documentNumber}.pdf` : undefined;

      // Send email
      sendEmailMutation.mutate({
        to: customerEmail,
        toName: customerName,
        subject,
        body,
        pdfBase64,
        pdfFilename
      });

    } catch (error) {
      console.error('Email sending error:', error);
      setIsSending(false);
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleSendEmail}
        disabled={isSending || sendEmailMutation.isPending}
        className={className}
      >
        {(isSending || sendEmailMutation.isPending) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        <span className="ml-2">
          {(isSending || sendEmailMutation.isPending) ? 'Sending...' : 'Send via Email'}
        </span>
      </Button>

      <EmailSetupModal 
        isOpen={showEmailSetup}
        onClose={closeEmailSetupModal}
        onComplete={onEmailSetupComplete}
      />
    </>
  );
};