import html2pdf from 'html2pdf.js';
import { Invoice, Quote, Statement, User, Customer } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export const generatePDF = async (
  document: Invoice | Quote | Statement,
  customer: Customer,
  user: User,
  type: 'invoice' | 'quote' | 'statement'
): Promise<Blob> => {
  console.log(`Starting PDF generation for ${type}:`, { 
    documentId: document.id, 
    documentNumber: document.number,
    companyName: user.companyName,
    customerName: customer.name,
    documentType: type
  });
  
  // Simple error suppression for PDF generation
  const originalErrorHandler = window.onerror;
  const originalUnhandledRejection = window.onunhandledrejection;
  
  window.onerror = function(message, source, lineno, colno, error) {
    if (typeof message === 'string' && (
      message.includes('WebFrameMain') ||
      message.includes('frame was disposed') ||
      message.includes('browser_init.js2') ||
      message.includes('emitter.emit')
    )) {
      console.warn('PDF generation error suppressed:', message);
      return true;
    }
    return originalErrorHandler ? originalErrorHandler(message, source, lineno, colno, error) : false;
  };
  
  window.onunhandledrejection = function(event) {
    if (event.reason && event.reason.message && (
      event.reason.message.includes('WebFrameMain') ||
      event.reason.message.includes('frame was disposed')
    )) {
      console.warn('PDF generation promise rejection suppressed:', event.reason.message);
      event.preventDefault();
      return true;
    }
    return originalUnhandledRejection ? originalUnhandledRejection(event) : false;
  };
  
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
          vertical-align: middle;
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
          justify-content: space-between;
          align-items: flex-start;
        }
        .status-container {
          flex: 1;
          padding-right: 20px;
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
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          white-space: nowrap;
          display: inline-block;
        }
        .status-unpaid { background-color: #dbeafe; color: #1e40af; }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .status-overdue { background-color: #fecaca; color: #b91c1c; }
        .status-stamp {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          border: 2px solid;
          margin-bottom: 10px;
          display: inline-block;
        }
        .status-stamp-unpaid { 
          background-color: #dbeafe; 
          color: #1e40af; 
          border-color: #1e40af; 
        }
        .status-stamp-paid { 
          background-color: #dcfce7; 
          color: #166534; 
          border-color: #166534; 
        }
        .status-stamp-overdue { 
          background-color: #fecaca; 
          color: #b91c1c; 
          border-color: #b91c1c; 
        }
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
          <div class="status-container">
            ${type === 'invoice' && 'status' in document ? `<div class="status-stamp status-stamp-${document.status}">${document.status}</div>` : ''}
          </div>
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

  // Generate PDF and return as blob
  try {
    console.log(`Generating PDF for ${type} with options:`, options);
    
    const result = await html2pdf().from(html).set(options).outputPdf('blob');
    console.log(`PDF generation completed for ${type}`);
    return result;
  } catch (error) {
    console.error(`Error in PDF generation for ${type}:`, error);
    throw error;
  } finally {
    // Restore original error handlers
    window.onerror = originalErrorHandler;
    window.onunhandledrejection = originalUnhandledRejection;
  }
};