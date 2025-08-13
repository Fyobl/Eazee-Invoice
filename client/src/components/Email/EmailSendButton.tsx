import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEmailSetupDirect } from '@/hooks/useEmailSetupDirect';
import { EmailSetupModal } from './EmailSetupModal';
import { apiRequest } from '@/lib/queryClient';
import { getEmailSettings, replaceVariables } from '@/lib/emailUtils';
import { generatePDF } from '@/components/PDF/PDFGenerator';
import { Mail, Loader2 } from 'lucide-react';

interface EmailSendButtonProps {
  documentType: 'invoice' | 'quote' | 'statement';
  customerEmail: string;
  customerName: string;
  documentNumber: string;
  documentData: any; // The complete document data (invoice/quote/statement)
  customer: any; // Customer data for PDF generation
  currentUser: any; // Current user data for PDF generation
  pdfBase64?: string; // Optional PDF attachment (will generate if not provided)
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
  customer,
  currentUser,
  pdfBase64,
  className,
  variant = 'outline',
  size = 'sm'
}: EmailSendButtonProps) => {
  const { toast } = useToast();
  const {
    isEmailSetupComplete,
    showEmailSetup,
    showEmailSetupModal,
    closeEmailSetupModal,
    markEmailSetupComplete
  } = useEmailSetupDirect();

  const [isSending, setIsSending] = useState(false);

  const onEmailSetupComplete = () => {
    markEmailSetupComplete();
  };

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
      // Get email settings and prepare variables
      const emailSettings = getEmailSettings();
      
      const variables = {
        customerName: customerName,
        documentType: documentType,
        documentNumber: documentNumber,
        companyName: currentUser?.companyName || 'Your Company',
        total: documentData.total ? `£${documentData.total}` : ''
      };

      // Get the appropriate template
      let subject = '';
      let body = '';
      
      switch (documentType) {
        case 'invoice':
          subject = replaceVariables(emailSettings.invoiceSubject, variables);
          body = replaceVariables(emailSettings.invoiceBody, variables);
          break;
        case 'quote':
          subject = replaceVariables(emailSettings.quoteSubject, variables);
          body = replaceVariables(emailSettings.quoteBody, variables);
          break;
        case 'statement':
          subject = replaceVariables(emailSettings.statementSubject, variables);
          body = replaceVariables(emailSettings.statementBody, variables);
          break;
      }

      // Generate PDF if not provided
      let pdfBase64ForEmail = pdfBase64;
      if (!pdfBase64ForEmail && customer && currentUser) {
        try {
          console.log('Starting PDF generation for email attachment...');
          const pdfBlob = await generatePDF(documentData, customer, currentUser, documentType);
          
          // Convert blob to base64 using FileReader for better memory handling
          pdfBase64ForEmail = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Extract base64 part after the comma
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(pdfBlob);
          });
          
          console.log('PDF successfully converted to base64 for email');
        } catch (pdfError) {
          console.error('Error generating PDF for email:', pdfError);
          toast({
            title: "PDF Generation Failed", 
            description: "Could not generate PDF attachment. Email will be sent without PDF.",
            variant: "destructive",
          });
          // Continue without PDF
          pdfBase64ForEmail = undefined;
        }
      }

      // Prepare PDF filename
      const pdfFilename = pdfBase64ForEmail ? `${documentType}-${documentNumber}.pdf` : undefined;

      // Send email
      sendEmailMutation.mutate({
        to: customerEmail,
        toName: customerName,
        subject,
        body,
        pdfBase64: pdfBase64ForEmail,
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