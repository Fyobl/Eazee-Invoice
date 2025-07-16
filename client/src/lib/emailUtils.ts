import { generatePDF } from '@/components/PDF/PDFGenerator';
import { Invoice, Quote, Statement, Customer, Company } from '@shared/schema';
import { formatCurrency } from './currency';

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
export const generateInvoiceEmail = (invoice: Invoice, customer: Customer, company: Company): { subject: string; body: string } => {
  try {
    console.log('Generating invoice email with data:', { 
      invoiceNumber: invoice.number,
      customerName: customer.name,
      companyName: company.name,
      invoiceDate: invoice.date,
      dueDate: invoice.dueDate,
      total: invoice.total
    });
    
    const settings = getEmailSettings();
    console.log('Email settings loaded:', settings);
    
    const variables = {
      invoiceNumber: invoice.number,
      customerName: customer.name,
      companyName: company.name,
      issueDate: new Date(invoice.date).toLocaleDateString('en-GB'),
      dueDate: new Date(invoice.dueDate).toLocaleDateString('en-GB'),
      total: formatCurrency(invoice.total, company.currency),
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
export const generateQuoteEmail = (quote: Quote, customer: Customer, company: Company): { subject: string; body: string } => {
  try {
    console.log('Generating quote email with data:', { 
      quoteNumber: quote.number,
      customerName: customer.name,
      companyName: company.name,
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
      companyName: company.name,
      issueDate: new Date(quote.date).toLocaleDateString('en-GB'),
      validUntil: validUntil.toLocaleDateString('en-GB'),
      total: formatCurrency(quote.total, company.currency),
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
export const generateStatementEmail = (statement: Statement, customer: Customer, company: Company): { subject: string; body: string } => {
  const settings = getEmailSettings();
  
  const variables = {
    customerName: customer.name,
    companyName: company.name,
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
  company: Company,
  type: 'invoice' | 'quote' | 'statement'
): Promise<void> => {
  try {
    console.log('Starting email preparation for:', { type, documentId: document.id, customerEmail: customer.email });
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdfBlob = await generatePDF({ document, company, type });
    console.log('PDF generated successfully, size:', pdfBlob.size);
    
    const base64PDF = await blobToBase64(pdfBlob);
    console.log('PDF converted to base64');

    // Generate email content
    let emailContent: { subject: string; body: string };
    
    switch (type) {
      case 'invoice':
        emailContent = generateInvoiceEmail(document as Invoice, customer, company);
        break;
      case 'quote':
        emailContent = generateQuoteEmail(document as Quote, customer, company);
        break;
      case 'statement':
        emailContent = generateStatementEmail(document as Statement, customer, company);
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
      const link = window.document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, then remove with timeout for cleanup
      window.document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay to prevent frame disposal issues
      setTimeout(() => {
        if (window.document.body.contains(link)) {
          window.document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('PDF download initiated');
    } catch (downloadError) {
      console.error('Error downloading PDF:', downloadError);
      // Still try to open mail app even if download fails
    }

    // Open mail app with delay to prevent conflicts
    setTimeout(() => {
      try {
        window.location.href = mailtoUrl;
        console.log('Mail app opened');
      } catch (mailtoError) {
        console.error('Error opening mail app:', mailtoError);
      }
    }, 200);
  } catch (error) {
    console.error('Error opening mail app:', error);
    throw error;
  }
};