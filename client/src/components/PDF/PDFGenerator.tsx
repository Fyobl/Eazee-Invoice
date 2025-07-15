import html2pdf from 'html2pdf.js';
import { Invoice, Quote, Statement, Company } from '@shared/schema';
import { formatCurrency } from '@/lib/currency';

interface PDFGeneratorProps {
  document: Invoice | Quote | Statement;
  company: Company;
  type: 'invoice' | 'quote' | 'statement';
}

export const generatePDF = async ({ document, company, type }: PDFGeneratorProps) => {
  const documentTitle = type.charAt(0).toUpperCase() + type.slice(1);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${documentTitle} ${document.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .logo-img { max-height: 60px; max-width: 200px; object-fit: contain; }
        .document-type { text-align: center; font-size: 28px; font-weight: bold; color: #1e293b; }
        .company-info { text-align: right; }
        .document-info { margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: bold; }
        .totals { text-align: right; margin-bottom: 30px; }
        .totals table { margin-left: auto; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; }
        .total-row { font-weight: bold; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">
          ${company.logo ? `<img src="${company.logo}" alt="${company.name}" class="logo-img">` : 'Eazee Invoice'}
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
              <td>£{formatCurrency(item.unitPrice, company.currency)}</td>
              <td>${item.taxRate}%</td>
              <td>${formatCurrency(item.amount, company.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <table>
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td>${formatCurrency(document.subtotal, company.currency)}</td>
          </tr>
          <tr>
            <td><strong>Tax:</strong></td>
            <td>${formatCurrency(document.taxAmount, company.currency)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>Total:</strong></td>
            <td>£{formatCurrency(document.total, company.currency)}</td>
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

  return html2pdf().from(html).set(options).save();
};
