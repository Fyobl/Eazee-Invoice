import html2pdf from 'html2pdf.js';
import { Invoice, Quote, Customer, Product, User } from '@shared/schema';
import { format } from 'date-fns';

interface ReportData {
  invoices: Invoice[];
  quotes: Quote[];
  customers: Customer[];
  products: Product[];
  user: User;
}

export const generateVATReport = async (data: ReportData, dateRange: { start: Date; end: Date }) => {
  const { invoices, user } = data;
  
  // Filter invoices within date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
  });

  // Calculate VAT totals
  const vatData = filteredInvoices.map(invoice => {
    const subtotal = parseFloat(invoice.subtotal);
    const taxAmount = parseFloat(invoice.taxAmount);
    const total = parseFloat(invoice.total);
    
    return {
      number: invoice.number,
      customerName: invoice.customerName,
      date: format(new Date(invoice.date), 'dd/MM/yyyy'),
      subtotal,
      taxAmount,
      total,
      status: invoice.status
    };
  });

  const totalSubtotal = vatData.reduce((sum, item) => sum + item.subtotal, 0);
  const totalVAT = vatData.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalWithVAT = vatData.reduce((sum, item) => sum + item.total, 0);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>VAT Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
        .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .report-title { font-size: 20px; font-weight: bold; text-align: center; }
        .date-range { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: bold; }
        .table td:nth-child(3), .table td:nth-child(4), .table td:nth-child(5), .table td:nth-child(6) { text-align: right; }
        .summary { background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .summary-row.total { font-weight: bold; font-size: 16px; border-top: 2px solid #1e293b; padding-top: 10px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-unpaid { background-color: #dbeafe; color: #1e40af; }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .status-overdue { background-color: #fecaca; color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${user.companyName}</div>
        <div class="report-title">VAT Report</div>
      </div>
      
      <div class="date-range">
        Period: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Subtotal</th>
            <th>VAT</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${vatData.map(item => `
            <tr>
              <td>${item.number}</td>
              <td>${item.customerName}</td>
              <td>${item.date}</td>
              <td>£${item.subtotal.toFixed(2)}</td>
              <td>£${item.taxAmount.toFixed(2)}</td>
              <td>£${item.total.toFixed(2)}</td>
              <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <span>Total Subtotal:</span>
          <span>£${totalSubtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Total VAT:</span>
          <span>£${totalVAT.toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Total with VAT:</span>
          <span>£${totalWithVAT.toFixed(2)}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  return html2pdf().from(html).set({
    margin: 0.5,
    filename: `vat-report-${format(dateRange.start, 'yyyy-MM-dd')}-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`,
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).save();
};

export const generateTopCustomersReport = async (data: ReportData, dateRange: { start: Date; end: Date }) => {
  const { invoices, customers, user } = data;
  
  // Filter invoices within date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
  });

  // Calculate customer data
  const customerData = customers.map(customer => {
    const customerInvoices = filteredInvoices.filter(invoice => invoice.customerId === customer.id.toString());
    const totalRevenue = customerInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0);
    const invoiceCount = customerInvoices.length;
    
    return {
      name: customer.name,
      email: customer.email,
      invoiceCount,
      totalRevenue,
      avgInvoiceValue: invoiceCount > 0 ? totalRevenue / invoiceCount : 0
    };
  }).filter(customer => customer.invoiceCount > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Top Customers Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
        .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .report-title { font-size: 20px; font-weight: bold; text-align: center; }
        .date-range { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: bold; }
        .table td:nth-child(3), .table td:nth-child(4), .table td:nth-child(5) { text-align: right; }
        .rank { font-weight: bold; color: #3b82f6; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${user.companyName}</div>
        <div class="report-title">Top Customers Report</div>
      </div>
      
      <div class="date-range">
        Period: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Invoices</th>
            <th>Total Revenue</th>
            <th>Avg Invoice Value</th>
          </tr>
        </thead>
        <tbody>
          ${customerData.map((customer, index) => `
            <tr>
              <td class="rank">${index + 1}</td>
              <td>${customer.name}</td>
              <td>${customer.email}</td>
              <td>${customer.invoiceCount}</td>
              <td>£${customer.totalRevenue.toFixed(2)}</td>
              <td>£${customer.avgInvoiceValue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html2pdf().from(html).set({
    margin: 0.5,
    filename: `top-customers-report-${format(dateRange.start, 'yyyy-MM-dd')}-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`,
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).save();
};

export const generateBestSellersReport = async (data: ReportData, dateRange: { start: Date; end: Date }) => {
  const { invoices, user } = data;
  
  // Filter invoices within date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
  });

  // Extract and count products from invoice items
  const productSales: { [key: string]: { quantity: number; revenue: number; description: string } } = {};
  
  filteredInvoices.forEach(invoice => {
    invoice.items.forEach((item: any) => {
      if (!productSales[item.description]) {
        productSales[item.description] = {
          quantity: 0,
          revenue: 0,
          description: item.description
        };
      }
      productSales[item.description].quantity += parseInt(item.quantity);
      productSales[item.description].revenue += parseFloat(item.amount);
    });
  });

  const sortedProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Best Sellers Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
        .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .report-title { font-size: 20px; font-weight: bold; text-align: center; }
        .date-range { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: bold; }
        .table td:nth-child(3), .table td:nth-child(4) { text-align: right; }
        .rank { font-weight: bold; color: #3b82f6; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${user.companyName}</div>
        <div class="report-title">Best Sellers Report</div>
      </div>
      
      <div class="date-range">
        Period: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Product/Service</th>
            <th>Quantity Sold</th>
            <th>Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${sortedProducts.map((product, index) => `
            <tr>
              <td class="rank">${index + 1}</td>
              <td>${product.description}</td>
              <td>${product.quantity}</td>
              <td>£${product.revenue.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  return html2pdf().from(html).set({
    margin: 0.5,
    filename: `best-sellers-report-${format(dateRange.start, 'yyyy-MM-dd')}-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`,
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).save();
};

export const generatePeriodTakingsReport = async (data: ReportData, period: 'weekly' | 'monthly' | 'quarterly' | 'yearly', dateRange: { start: Date; end: Date }) => {
  const { invoices, user } = data;
  
  // Filter invoices within date range
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= dateRange.start && invoiceDate <= dateRange.end;
  });

  // Group invoices by period
  const periodData: { [key: string]: { subtotal: number; vat: number; total: number; count: number } } = {};
  
  filteredInvoices.forEach(invoice => {
    let periodKey = '';
    const invoiceDate = new Date(invoice.date);
    
    switch (period) {
      case 'weekly':
        const weekStart = new Date(invoiceDate);
        weekStart.setDate(invoiceDate.getDate() - invoiceDate.getDay());
        periodKey = format(weekStart, 'dd/MM/yyyy');
        break;
      case 'monthly':
        periodKey = format(invoiceDate, 'MM/yyyy');
        break;
      case 'quarterly':
        const quarter = Math.floor(invoiceDate.getMonth() / 3) + 1;
        periodKey = `Q${quarter} ${invoiceDate.getFullYear()}`;
        break;
      case 'yearly':
        periodKey = invoiceDate.getFullYear().toString();
        break;
    }
    
    if (!periodData[periodKey]) {
      periodData[periodKey] = { subtotal: 0, vat: 0, total: 0, count: 0 };
    }
    
    periodData[periodKey].subtotal += parseFloat(invoice.subtotal);
    periodData[periodKey].vat += parseFloat(invoice.taxAmount);
    periodData[periodKey].total += parseFloat(invoice.total);
    periodData[periodKey].count += 1;
  });

  const sortedPeriods = Object.entries(periodData).sort(([a], [b]) => a.localeCompare(b));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${period.charAt(0).toUpperCase() + period.slice(1)} Takings Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; }
        .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .report-title { font-size: 20px; font-weight: bold; text-align: center; }
        .date-range { font-size: 14px; color: #64748b; text-align: center; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
        .table th { background-color: #f8fafc; font-weight: bold; }
        .table td:nth-child(2), .table td:nth-child(3), .table td:nth-child(4), .table td:nth-child(5) { text-align: right; }
        .summary { background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-top: 20px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .summary-row.total { font-weight: bold; font-size: 16px; border-top: 2px solid #1e293b; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${user.companyName}</div>
        <div class="report-title">${period.charAt(0).toUpperCase() + period.slice(1)} Takings Report</div>
      </div>
      
      <div class="date-range">
        Period: ${format(dateRange.start, 'dd/MM/yyyy')} - ${format(dateRange.end, 'dd/MM/yyyy')}
      </div>
      
      <table class="table">
        <thead>
          <tr>
            <th>Period</th>
            <th>Invoices</th>
            <th>Subtotal</th>
            <th>VAT</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${sortedPeriods.map(([period, data]) => `
            <tr>
              <td>${period}</td>
              <td>${data.count}</td>
              <td>£${data.subtotal.toFixed(2)}</td>
              <td>£${data.vat.toFixed(2)}</td>
              <td>£${data.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <div class="summary-row">
          <span>Total Invoices:</span>
          <span>${Object.values(periodData).reduce((sum, data) => sum + data.count, 0)}</span>
        </div>
        <div class="summary-row">
          <span>Total Subtotal:</span>
          <span>£${Object.values(periodData).reduce((sum, data) => sum + data.subtotal, 0).toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span>Total VAT:</span>
          <span>£${Object.values(periodData).reduce((sum, data) => sum + data.vat, 0).toFixed(2)}</span>
        </div>
        <div class="summary-row total">
          <span>Grand Total:</span>
          <span>£${Object.values(periodData).reduce((sum, data) => sum + data.total, 0).toFixed(2)}</span>
        </div>
      </div>
    </body>
    </html>
  `;

  return html2pdf().from(html).set({
    margin: 0.5,
    filename: `${period}-takings-report-${format(dateRange.start, 'yyyy-MM-dd')}-${format(dateRange.end, 'yyyy-MM-dd')}.pdf`,
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).save();
};