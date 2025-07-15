import html2pdf from 'html2pdf.js';
import { Invoice, Quote, Statement, Company } from '@shared/schema';

interface PDFGeneratorProps {
  document: Invoice | Quote | Statement;
  company: Company;
  type: 'invoice' | 'quote' | 'statement';
}

export const generatePDF = async ({ document, company, type }: PDFGeneratorProps): Promise<Blob> => {
  const documentTitle = type.charAt(0).toUpperCase() + type.slice(1);
  
  // Format currency values properly
  const formatPrice = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `£${numAmount.toFixed(2)}`;
  };

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
          margin-bottom: 30px; 
          border-bottom: 2px solid #3b82f6; 
          padding-bottom: 20px; 
        }
        .logo-section { 
          flex: 1;
          display: flex;
          align-items: center;
        }
        .logo-img { 
          max-height: 60px; 
          max-width: 200px; 
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
          margin-bottom: 30px; 
          font-size: 14px;
          line-height: 1.6;
        }
        .customer-info { 
          margin-bottom: 30px; 
          font-size: 14px;
          line-height: 1.6;
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px; 
          font-size: 14px;
        }
        .table th, .table td { 
          border: 1px solid #e2e8f0; 
          padding: 12px; 
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
          margin-bottom: 40px; 
          display: flex;
          justify-content: flex-end;
        }
        .totals-table { 
          border-collapse: collapse;
          font-size: 14px;
          min-width: 300px;
        }
        .totals-table td { 
          padding: 8px 12px; 
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
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.6;
        }
        .footer { 
          border-top: 1px solid #e2e8f0; 
          padding-top: 20px; 
          text-align: center; 
          color: #64748b; 
          font-size: 12px;
          margin-top: 40px;
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
          ${company.logo ? `<img src="${company.logo}" alt="${company.name}" class="logo-img">` : `<div class="logo-text">Eazee Invoice</div>`}
        </div>
        <div class="document-type">${documentTitle}</div>
        <div class="company-info">
          <strong>${company.name}</strong><br>
          ${company.address.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div class="document-info">
        <strong>${documentTitle} #:</strong> ${document.number}<br>
        <strong>Date:</strong> ${new Date(document.date).toLocaleDateString()}<br>
        ${type === 'quote' && 'validUntil' in document ? `<strong>Valid Until:</strong> ${new Date(document.validUntil).toLocaleDateString()}<br>` : ''}
        ${type === 'invoice' && 'dueDate' in document ? `<strong>Due Date:</strong> ${new Date(document.dueDate).toLocaleDateString()}<br>` : ''}
      </div>
      
      <div class="customer-info">
        <strong>Bill To:</strong><br>
        ${document.customerName}
      </div>
      
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
      
      ${document.notes ? `<div class="notes"><strong>Notes:</strong><br>${document.notes}</div>` : ''}
      
      <div class="footer">
        ${company.vatNumber ? `VAT Number: ${company.vatNumber}` : ''}
        ${company.registrationNumber ? ` | Registration Number: ${company.registrationNumber}` : ''}
      </div>
    </body>
    </html>
  `;

  const options = {
    margin: 0.5,
    filename: `${type}-${document.number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  // Generate PDF and return as blob
  return html2pdf().from(html).set(options).outputPdf('blob');
};