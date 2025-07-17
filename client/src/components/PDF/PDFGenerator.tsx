import html2pdf from 'html2pdf.js';
import { Invoice, Quote, Statement, User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface PDFGeneratorProps {
  document: Invoice | Quote | Statement;
  user: User;
  type: 'invoice' | 'quote' | 'statement';
}

export const generatePDF = async ({ document, user, type }: PDFGeneratorProps): Promise<Blob> => {
  console.log(`Starting PDF generation for ${type}:`, { 
    documentId: document.id, 
    documentNumber: document.number,
    companyName: user.companyName 
  });
  
  const documentTitle = type.charAt(0).toUpperCase() + type.slice(1);
  
  // Format currency values properly
  const formatPrice = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `£${numAmount.toFixed(2)}`;
  };

  // Fetch unpaid invoices for statements
  let unpaidInvoices: Invoice[] = [];
  if (type === 'statement') {
    try {
      const response = await apiRequest('GET', '/api/invoices');
      const allInvoices = await response.json();
      
      // Filter unpaid invoices for this customer within the statement period
      unpaidInvoices = allInvoices.filter((invoice: Invoice) => {
        const invoiceDate = new Date(invoice.date);
        const statementStart = new Date(document.startDate);
        const statementEnd = new Date(document.endDate);
        
        // Set statement end date to end of day for proper comparison
        const statementEndOfDay = new Date(statementEnd);
        statementEndOfDay.setHours(23, 59, 59, 999);
        
        const customerMatch = invoice.customerId === document.customerId;
        const statusMatch = invoice.status === 'unpaid' || invoice.status === 'overdue';
        const dateMatch = invoiceDate >= statementStart && invoiceDate <= statementEndOfDay;
        
        return customerMatch && statusMatch && dateMatch;
      });
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle} ${document.number}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          color: #1e293b;
          min-height: 100vh;
          box-sizing: border-box;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 15px; 
          border-bottom: 2px solid #3b82f6; 
          padding-bottom: 10px; 
        }
        .logo-section { 
          flex: 1;
          display: flex;
          align-items: center;
        }
        .logo-img { 
          max-height: 100px; 
          max-width: 300px; 
          object-fit: contain; 
        }
        .logo-text {
          font-size: 24px; 
          font-weight: bold; 
          color: #3b82f6;
        }
        .document-type { 
          flex: 1;
          text-align: center; 
          font-size: 28px; 
          font-weight: bold; 
          color: #1e293b; 
        }
        .company-info { 
          flex: 1;
          text-align: right; 
          font-size: 14px;
          line-height: 1.4;
        }
        .document-info { 
          margin-bottom: 15px; 
          font-size: 14px;
          line-height: 1.4;
        }
        .info-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
        }
        .document-details {
          flex: 2;
          padding-right: 40px;
        }
        .customer-info { 
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
          text-align: right;
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
          font-size: 13px;
        }
        .table th, .table td { 
          border: 1px solid #e2e8f0; 
          padding: 8px; 
          text-align: left; 
        }
        .table th { 
          background-color: #f8fafc; 
          font-weight: bold; 
        }
        .table td:nth-child(2), .table td:nth-child(3), .table td:nth-child(4), .table td:nth-child(5) {
          text-align: right;
        }
        .table th:nth-child(2), .table th:nth-child(3), .table th:nth-child(4), .table th:nth-child(5) {
          text-align: right;
        }
        .totals { 
          margin-bottom: 20px; 
          display: flex;
          justify-content: flex-end;
        }
        .totals-table { 
          border-collapse: collapse;
          font-size: 14px;
          min-width: 300px;
        }
        .totals-table td { 
          padding: 6px 10px; 
          border: 1px solid #e2e8f0;
        }
        .totals-table .label { 
          font-weight: bold;
          text-align: right;
          background-color: #f8fafc;
        }
        .totals-table .amount { 
          text-align: right;
          width: 120px;
        }
        .total-row td { 
          font-weight: bold; 
          font-size: 16px;
          background-color: #f1f5f9;
        }
        .notes {
          margin-bottom: 20px;
          font-size: 13px;
          line-height: 1.4;
        }
        .footer { 
          border-top: 1px solid #e2e8f0; 
          padding-top: 15px; 
          padding-bottom: 20px;
          text-align: center; 
          color: #64748b; 
          font-size: 11px;
          margin-top: 30px;
        }
        .statement-content {
          margin: 15px 0;
          padding: 15px;
          background-color: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .statement-content h3 {
          margin: 0 0 10px 0;
          color: #1e293b;
          font-size: 16px;
        }
        .statement-content p {
          margin: 5px 0;
          line-height: 1.4;
          font-size: 14px;
        }
        .statement-placeholder {
          padding: 20px;
          background-color: #ffffff;
          border-radius: 4px;
          border: 1px dashed #cbd5e1;
          margin-top: 20px;
          text-align: center;
          color: #64748b;
        }
        .statement-summary {
          margin-top: 15px;
          padding: 10px;
          background-color: #f1f5f9;
          border-radius: 4px;
          border: 1px solid #e2e8f0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-weight: bold;
          font-size: 14px;
        }
        .summary-row:last-child {
          margin-bottom: 0;
        }
        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-sent { background-color: #fef3c7; color: #92400e; }
        .status-overdue { background-color: #fecaca; color: #b91c1c; }
        .status-draft { background-color: #f3f4f6; color: #4b5563; }
        @media print {
          body { margin: 0; padding: 15px; }
          .header { page-break-inside: avoid; }
          .table { page-break-inside: avoid; }
          .totals { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          ${user.companyLogo ? `<img src="${user.companyLogo}" alt="${user.companyName}" class="logo-img">` : `<div class="logo-text">Eazee Invoice</div>`}
        </div>
        <div class="document-type">${documentTitle}</div>
        <div class="company-info">
          <strong>${user.companyName || 'Company Name'}</strong><br>
          ${(user.companyAddress || '').replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div class="info-section">
        <div class="document-details">
          <strong>${documentTitle} #:</strong> ${document.number}<br>
          <strong>Date:</strong> ${new Date(document.date).toLocaleDateString()}<br>
          ${type === 'quote' && 'validUntil' in document ? `<strong>Valid Until:</strong> ${new Date(document.validUntil).toLocaleDateString()}<br>` : ''}
          ${type === 'invoice' && 'dueDate' in document ? `<strong>Due Date:</strong> ${new Date(document.dueDate).toLocaleDateString()}<br>` : ''}
          ${type === 'statement' && 'startDate' in document && 'endDate' in document ? `<strong>Period:</strong> ${new Date(document.startDate).toLocaleDateString()} - ${new Date(document.endDate).toLocaleDateString()}<br>` : ''}
        </div>
        
        <div class="customer-info">
          <strong>Bill To:</strong><br>
          ${document.customerName}
        </div>
      </div>
      
      ${type === 'statement' ? `
        <div class="statement-content">
          <h3>Customer Statement</h3>
          <p>This statement shows unpaid invoices for the selected period.</p>
          <p><strong>Period:</strong> ${new Date(document.startDate).toLocaleDateString()} - ${new Date(document.endDate).toLocaleDateString()}</p>
          <p><strong>Statement Type:</strong> ${document.period === '7' ? 'Weekly' : document.period === '30' ? 'Monthly' : 'Custom Period'}</p>
          
          ${unpaidInvoices.length > 0 ? `
            <table class="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${unpaidInvoices.map(invoice => `
                  <tr>
                    <td>${invoice.number}</td>
                    <td>${new Date(invoice.date).toLocaleDateString()}</td>
                    <td>${new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${invoice.status}">${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span></td>
                    <td>${formatPrice(invoice.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="statement-summary">
              <div class="summary-row">
                <span>Total Outstanding:</span>
                <span class="amount">${formatPrice(unpaidInvoices.reduce((sum, inv) => sum + parseFloat(inv.total), 0))}</span>
              </div>
              <div class="summary-row">
                <span>Number of Unpaid Invoices:</span>
                <span class="amount">${unpaidInvoices.length}</span>
              </div>
            </div>
          ` : `
            <div class="statement-placeholder">
              <p>No unpaid invoices found for this customer within the selected period.</p>
            </div>
          `}
        </div>
      ` : `
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Tax Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${document.items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${formatPrice(item.unitPrice)}</td>
                <td>${item.taxRate}%</td>
                <td>${formatPrice(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <table class="totals-table">
            <tr>
              <td class="label">Subtotal:</td>
              <td class="amount">${formatPrice(document.subtotal)}</td>
            </tr>
            <tr>
              <td class="label">Tax:</td>
              <td class="amount">${formatPrice(document.taxAmount)}</td>
            </tr>
            <tr class="total-row">
              <td class="label">Total:</td>
              <td class="amount">${formatPrice(document.total)}</td>
            </tr>
          </table>
        </div>
      `}
      
      ${document.notes ? `<div class="notes"><strong>Notes:</strong><br>${document.notes}</div>` : ''}
      
      <div class="footer">
        ${user.companyVatNumber ? `VAT Number: ${user.companyVatNumber}` : ''}
        ${user.companyRegistrationNumber ? ` | Registration Number: ${user.companyRegistrationNumber}` : ''}
      </div>
    </body>
    </html>
  `;

  const options = {
    margin: [0.5, 0.5, 0.8, 0.5], // top, right, bottom, left
    filename: `${type}-${document.number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      onrendered: (canvas: any) => {
        console.log('Canvas rendered for PDF generation');
      }
    },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // Generate PDF and return as blob with better error handling
  try {
    console.log(`Generating PDF for ${type} with options:`, options);
    
    // Create a more robust PDF generation with error handling
    const pdfPromise = html2pdf().from(html).set(options).outputPdf('blob');
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout')), 30000); // 30 second timeout
    });
    
    const result = await Promise.race([pdfPromise, timeoutPromise]);
    console.log(`PDF generation completed for ${type}`);
    return result;
  } catch (error) {
    console.error(`Error in PDF generation for ${type}:`, error);
    
    // If it's a frame disposal error, try a simpler approach
    if (error.message.includes('WebFrameMain') || error.message.includes('frame was disposed')) {
      console.log('Attempting fallback PDF generation...');
      try {
        // Simpler options for fallback
        const fallbackOptions = {
          margin: 0.5,
          filename: `${type}-${document.number}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 1 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        return html2pdf().from(html).set(fallbackOptions).outputPdf('blob');
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError);
      }
    }
    
    throw new Error(`PDF generation failed for ${type}: ${error.message}`);
  }
};