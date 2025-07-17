import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDatabase } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { generatePDF } from '@/components/PDF/PDFGenerator';
import { openMailApp } from '@/lib/emailUtils';
import { Plus, Eye, Edit, Download, Trash2, MoreHorizontal, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { Invoice } from '@shared/schema';

export const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [lastEmailTime, setLastEmailTime] = useState(0);
  
  const { data: invoices, isLoading: loading, remove: deleteDocument, update: updateInvoice } = useDatabase('invoices');
  const { data: customers } = useDatabase('customers');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const filteredInvoices = invoices?.filter((invoice: Invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || invoice.customerId === customerFilter || invoice.customerId === parseInt(customerFilter);
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'unpaid': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (invoiceToDelete) {
      await deleteDocument(invoiceToDelete.id);
      toast({
        title: "Invoice Successfully Deleted",
        description: `Invoice ${invoiceToDelete.number} has been moved to the recycle bin. You can restore it within 7 days.`,
      });
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleViewPDF = async (invoice: Invoice) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User information not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    if (!customers || customers.length === 0) {
      toast({
        title: "Error",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    const customer = customers.find(c => c.id === parseInt(invoice.customerId) || c.id.toString() === invoice.customerId);

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(invoice, customer, currentUser, 'invoice');
      
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "User information not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    if (!customers || customers.length === 0) {
      toast({
        title: "Error",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    const customer = customers.find(c => c.id === parseInt(invoice.customerId) || c.id.toString() === invoice.customerId);

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(invoice, customer, currentUser, 'invoice');
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Invoice ${invoice.number} PDF is being downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      await updateInvoice({ id: invoice.id.toString(), data: { status: newStatus } });
      toast({
        title: "Status Updated",
        description: `Invoice ${invoice.number} status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    const now = Date.now();
    
    if (isGeneratingPDF) {
      toast({
        title: "Please Wait",
        description: "PDF is still being generated. Please wait for it to complete.",
        variant: "destructive",
      });
      return;
    }
    
    // Debounce: prevent rapid clicks within 3 seconds
    if (now - lastEmailTime < 3000) {
      toast({
        title: "Please Wait",
        description: "Please wait a moment before sending another email.",
        variant: "destructive",
      });
      return;
    }
    
    setLastEmailTime(now);

    if (!currentUser) {
      toast({
        title: "Error",
        description: "User information not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    if (!customers || customers.length === 0) {
      toast({
        title: "Error",
        description: "Customer information not found.",
        variant: "destructive",
      });
      return;
    }

    const customer = customers.find(c => c.id === parseInt(invoice.customerId) || c.id.toString() === invoice.customerId);

    if (!customer) {
      console.error('Customer lookup failed:', {
        invoiceCustomerId: invoice.customerId,
        availableCustomers: customers.map(c => ({ id: c.id, name: c.name }))
      });
      toast({
        title: "Error",
        description: "Customer not found for this invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      console.log('Creating PDF and email for invoice:', invoice.number);
      
      // First, generate and download the PDF
      try {
        const pdfBlob = await generatePDF(invoice, customer, currentUser, 'invoice');
        
        // Download the PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoice.number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('PDF generated and downloaded successfully');
      } catch (pdfError) {
        console.warn('PDF generation failed, continuing with email:', pdfError);
        // Continue with email even if PDF fails
      }
      
      // Then open the email
      const emailSubject = `Invoice ${invoice.number} from ${currentUser.companyName || 'Your Company'}`;
      const emailBody = `Dear ${customer.name},

Please find attached invoice ${invoice.number} for your recent purchase.

Invoice Details:
- Invoice Number: ${invoice.number}
- Issue Date: ${new Date(invoice.date).toLocaleDateString('en-GB')}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}
- Amount: £${invoice.total}
- Status: ${invoice.status.toUpperCase()}

Payment is due by ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}. If you have any questions regarding this invoice, please contact us.

Thank you for your business.

Best regards,
${currentUser.companyName || 'Your Company'}

---
Note: The PDF has been downloaded to your Downloads folder. Please attach it to this email.`;

      const simpleMailtoUrl = `mailto:${customer.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      console.log('Opening email with URL:', simpleMailtoUrl);
      window.location.href = simpleMailtoUrl;
      
      toast({
        title: "Email Prepared",
        description: `PDF downloaded and email opened for invoice ${invoice.number}. Please attach the PDF to the email.`,
      });
    } catch (error) {
      console.error('Error preparing email:', error);
      toast({
        title: "Error",
        description: `Failed to prepare email: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Invoices">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Invoices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Invoices</h2>
            <p className="text-slate-600 dark:text-slate-400">Manage your invoices and track payments</p>
          </div>
          <Link href="/invoices/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>£{parseFloat(invoice.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Select value={invoice.status} onValueChange={(newStatus) => handleStatusChange(invoice, newStatus)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">
                            <Badge className={getStatusColor('unpaid')}>
                              unpaid
                            </Badge>
                          </SelectItem>
                          <SelectItem value="paid">
                            <Badge className={getStatusColor('paid')}>
                              paid
                            </Badge>
                          </SelectItem>
                          <SelectItem value="overdue">
                            <Badge className={getStatusColor('overdue')}>
                              overdue
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPDF(invoice)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}/edit`} className="flex items-center">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Invoice
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(invoice)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send via Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(invoice)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Invoice
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice {invoiceToDelete?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
