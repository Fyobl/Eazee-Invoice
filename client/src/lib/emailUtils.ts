import { generatePDF } from '@/components/PDF/PDFGenerator';
import { Invoice, Quote, Statement, Customer, User } from '@shared/schema';
import { formatCurrency } from './currency';
import { handlePDFError } from './pdfErrorHandler';
import { suppressErrorsForNewDocument } from './errorSuppression';

// Email template interface
export interface EmailTemplate {
  subject: string;
  body: string;
}

// Email templates for different document types
export interface EmailSettings {
  invoiceSubject: string;
  invoiceBody: string;
  quoteSubject: string;
  quoteBody: string;
  statementSubject: string;
  statementBody: string;
}

// Default email settings
export const defaultEmailSettings: EmailSettings = {
  invoiceSubject: 'Invoice {invoiceNumber} from {companyName}',
  invoiceBody: `Dear {customerName},

Please find attached invoice {invoiceNumber} for the services provided.

Invoice Details:
- Invoice Number: {invoiceNumber}
- Issue Date: {issueDate}
- Due Date: {dueDate}
- Amount: {total}

Payment is due within the terms specified on the invoice. If you have any questions or require clarification, please don't hesitate to contact us.

Thank you for your business.

Best regards,
{companyName}`,
  quoteSubject: 'Quote {quoteNumber} from {companyName}',
  quoteBody: `Dear {customerName},

Thank you for your interest in our services. Please find attached quote {quoteNumber} for your consideration.

Quote Details:
- Quote Number: {quoteNumber}
- Issue Date: {issueDate}
- Valid Until: {validUntil}
- Amount: {total}

This quote is valid for 30 days from the issue date. If you have any questions or would like to proceed with this quote, please contact us.

We look forward to working with you.

Best regards,
{companyName}`,
  statementSubject: 'Statement from {companyName}',
  statementBody: `Dear {customerName},

Please find attached your account statement for the period specified.

This statement shows all outstanding invoices and their current status. Please review and contact us if you have any questions about any of the items listed.

Thank you for your continued business.

Best regards,
{companyName}`,
};

// Get email settings from localStorage
export const getEmailSettings = (): EmailSettings => {
  const saved = localStorage.getItem('emailSettings');
  return saved ? JSON.parse(saved) : defaultEmailSettings;
};

// Save email settings to localStorage
export const saveEmailSettings = (settings: EmailSettings): void => {
  localStorage.setItem('emailSettings', JSON.stringify(settings));
};

// Replace variables in template
export const replaceVariables = (template: string, variables: Record<string, string>): string => {
  let result = template;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  return result;
};

// Generate email content for invoice
export const generateInvoiceEmail = (invoice: Invoice, customer: Customer, user: User): { subject: string; body: string } => {
  try {
    console.log('Generating invoice email with data:', { 
      invoiceNumber: invoice.number,
      customerName: customer.name,
      companyName: user.companyName,
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate,
      total: invoice.total
    });
    
    const settings = getEmailSettings();
    console.log('Email settings loaded:', settings);
    
    const variables = {
      invoiceNumber: invoice.number,
      customerName: customer.name,
      companyName: user.companyName || user.displayName || user.firstName + ' ' + user.lastName || 'Your Company',
      issueDate: new Date(invoice.date).toLocaleDateString('en-GB'),
      dueDate: new Date(invoice.dueDate).toLocaleDateString('en-GB'),
      total: formatCurrency(invoice.total, user.currency || 'GBP'),
    };

    console.log('Template variables:', variables);

    return {
      subject: replaceVariables(settings.invoiceSubject, variables),
      body: replaceVariables(settings.invoiceBody, variables),
    };
  } catch (error) {
    console.error('Error generating invoice email:', error);
    throw error;
  }
};

// Generate email content for quote
export const generateQuoteEmail = (quote: Quote, customer: Customer, user: User): { subject: string; body: string } => {
  try {
    console.log('Generating quote email with data:', { 
      quoteNumber: quote.number,
      customerName: customer.name,
      companyName: user.companyName,
      quoteDate: quote.date,
      validUntil: quote.validUntil,
      total: quote.total
    });
    
    const settings = getEmailSettings();
    console.log('Email settings for quote:', settings);
    
    const validUntil = new Date(quote.validUntil);
    
    const variables = {
      quoteNumber: quote.number,
      customerName: customer.name,
      companyName: user.companyName || user.displayName || user.firstName + ' ' + user.lastName || 'Your Company',
      issueDate: new Date(quote.date).toLocaleDateString('en-GB'),
      validUntil: validUntil.toLocaleDateString('en-GB'),
      total: formatCurrency(quote.total, user.currency || 'GBP'),
    };

    console.log('Quote email variables:', variables);

    return {
      subject: replaceVariables(settings.quoteSubject, variables),
      body: replaceVariables(settings.quoteBody, variables),
    };
  } catch (error) {
    console.error('Error generating quote email:', error);
    throw error;
  }
};

// Generate email content for statement
export const generateStatementEmail = (statement: Statement, customer: Customer, user: User): { subject: string; body: string } => {
  const settings = getEmailSettings();
  
  const variables = {
    customerName: customer.name,
    companyName: user.companyName || user.displayName || user.firstName + ' ' + user.lastName || 'Your Company',
    statementPeriod: `${new Date(statement.startDate).toLocaleDateString('en-GB')} - ${new Date(statement.endDate).toLocaleDateString('en-GB')}`,
  };

  return {
    subject: replaceVariables(settings.statementSubject, variables),
    body: replaceVariables(settings.statementBody, variables),
  };
};

// Convert blob to base64 for email attachment
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Remove data:application/pdf;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Open default mail app with pre-filled email
export const openMailApp = async (
  document: Invoice | Quote | Statement,
  customer: Customer,
  user: User,
  type: 'invoice' | 'quote' | 'statement'
): Promise<void> => {
  console.log('=== EMAIL FUNCTION CALLED ===');
  console.log('Document:', document);
  console.log('Customer:', customer);
  console.log('User:', user);
  console.log('Type:', type);
  
  try {
    console.log('Starting email preparation for:', { type, documentId: document.id, customerEmail: customer.email });
    
    // Temporarily disable error suppression to debug email client issue
    // const wasNewlyCreated = suppressErrorsForNewDocument(document);
    
    // if (wasNewlyCreated) {
    //   // Add a small delay to let the document "settle" in the system
    //   await new Promise(resolve => setTimeout(resolve, 1000));
    // }
    
    // Generate PDF with better error handling
    console.log('Generating PDF...');
    let pdfBlob;
    
    // Wrap PDF generation in a try-catch to handle browser-specific errors
    try {
      pdfBlob = await Promise.race([
        generatePDF(document, customer, user, type),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PDF generation timeout')), 15000)
        )
      ]) as Blob;
      console.log('PDF generated successfully, size:', pdfBlob.size);
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      
      // Check if it's a browser-specific error that we can handle gracefully
      if (handlePDFError(pdfError as Error)) {
        console.warn('Browser-specific PDF error detected - continuing with email preparation');
        // Create a minimal blob for email preparation to continue
        pdfBlob = new Blob(['PDF generation failed due to browser limitations'], { type: 'application/pdf' });
      } else {
        // For other errors, fail gracefully
        throw new Error('PDF generation failed. Please try viewing the PDF directly first.');
      }
    }
    
    // Skip base64 conversion as we're not using it for mailto
    console.log('PDF blob ready for download');

    // Generate email content
    let emailContent: { subject: string; body: string };
    
    switch (type) {
      case 'invoice':
        emailContent = generateInvoiceEmail(document as Invoice, customer, user);
        break;
      case 'quote':
        emailContent = generateQuoteEmail(document as Quote, customer, user);
        break;
      case 'statement':
        emailContent = generateStatementEmail(document as Statement, customer, user);
        break;
      default:
        throw new Error('Unknown document type');
    }

    console.log('Email content generated:', { subject: emailContent.subject });

    // Create mailto URL
    const subject = encodeURIComponent(emailContent.subject);
    const body = encodeURIComponent(emailContent.body);
    const to = encodeURIComponent(customer.email);

    // Note: Most email clients don't support PDF attachments via mailto
    // So we'll open the email with content and instructions to attach the PDF
    const bodyWithAttachmentNote = encodeURIComponent(
      emailContent.body + 
      '\n\n--- \nNote: A PDF document has been downloaded to your Downloads folder. Please attach it to this email before sending.'
    );

    const mailtoUrl = `mailto:${to}?subject=${subject}&body=${bodyWithAttachmentNote}`;
    console.log('Mailto URL created');

    // Download the PDF file with better error handling
    try {
      // Only try to download if we have a valid PDF blob
      if (pdfBlob && pdfBlob.size > 100) {
        const url = URL.createObjectURL(pdfBlob);
        
        // Fix the filename generation
        let filename: string;
        switch (type) {
          case 'invoice':
            filename = `invoice-${(document as Invoice).number}.pdf`;
            break;
          case 'quote':
            filename = `quote-${(document as Quote).number}.pdf`;
            break;
          case 'statement':
            filename = `statement-${(document as Statement).number || document.id}.pdf`;
            break;
          default:
            filename = `${type}-${document.id}.pdf`;
        }
        
        // Create download link with better error handling
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Add to DOM, click, then remove with timeout for cleanup
        document.body.appendChild(link);
        link.click();
        
        // Clean up after a short delay to prevent frame disposal issues
        setTimeout(() => {
          try {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            URL.revokeObjectURL(url);
          } catch (cleanupError) {
            console.warn('Cleanup error (non-critical):', cleanupError);
          }
        }, 100);
        
        console.log('PDF download initiated');
      } else {
        console.warn('PDF blob is invalid or too small, skipping download');
      }
    } catch (downloadError) {
      console.error('Error downloading PDF:', downloadError);
      // Still try to open mail app even if download fails
    }

    // Open mail app with delay to prevent conflicts
    console.log('Attempting to open mail app with URL:', mailtoUrl);
    
    // First try a simple test
    console.log('Testing basic mailto functionality...');
    const testMailto = `mailto:${customer.email}?subject=Test&body=Test email`;
    console.log('Test mailto URL:', testMailto);
    
    setTimeout(() => {
      try {
        console.log('Opening mail app via window.location.href');
        window.location.href = mailtoUrl;
        console.log('Mail app opened successfully');
      } catch (mailtoError) {
        console.error('Error opening mail app:', mailtoError);
        
        // Try alternative method with window.open
        try {
          console.log('Trying alternative method with window.open');
          const newWindow = window.open(mailtoUrl, '_blank');
          if (newWindow) {
            console.log('Window.open succeeded');
          } else {
            console.log('Window.open returned null - popup blocked?');
          }
        } catch (alternativeError) {
          console.error('Alternative method also failed:', alternativeError);
          
          // Try creating a clickable link as last resort
          try {
            console.log('Creating downloadable link as fallback');
            const link = document.createElement('a');
            link.href = mailtoUrl;
            link.textContent = 'Click to open email';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('Fallback link method attempted');
          } catch (fallbackError) {
            console.error('All methods failed:', fallbackError);
          }
        }
      }
    }, 200);
  } catch (error) {
    console.error('Error opening mail app:', error);
    throw error;
  }
};