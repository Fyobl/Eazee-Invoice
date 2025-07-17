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
import { Plus, Eye, Edit, Download, Trash2, MoreHorizontal, FileText, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { Quote } from '@shared/schema';
import { useQueryClient } from '@tanstack/react-query';

export const QuoteList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  
  const { data: quotes, isLoading: loading, remove: deleteDocument, update: updateQuote } = useDatabase('quotes');
  const { data: customers } = useDatabase('customers');
  const { add: createInvoice } = useDatabase('invoices');
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredQuotes = quotes?.filter((quote: Quote) => {
    const matchesSearch = quote.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || quote.customerId === customerFilter || quote.customerId === parseInt(customerFilter);
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const handleDeleteClick = (quote: Quote) => {
    setQuoteToDelete(quote);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (quoteToDelete) {
      await deleteDocument(quoteToDelete.id);
      toast({
        title: "Quote Successfully Deleted",
        description: `Quote ${quoteToDelete.number} has been moved to the recycle bin. You can restore it within 7 days.`,
      });
      setDeleteDialogOpen(false);
      setQuoteToDelete(null);
    }
  };

  const handleViewPDF = async (quote: Quote) => {
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

    const customer = customers.find(c => c.id === parseInt(quote.customerId) || c.id.toString() === quote.customerId);

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this quote.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(quote, customer, currentUser, 'quote');
      
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      
      // Clean up the object URL after a delay to allow the browser to open it
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

  const handleDownloadPDF = async (quote: Quote) => {
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

    const customer = customers.find(c => c.id === parseInt(quote.customerId) || c.id.toString() === quote.customerId);

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this quote.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(quote, customer, currentUser, 'quote');
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quote-${quote.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: `Quote ${quote.number} PDF is being downloaded.`,
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

  const handleConvertToInvoice = async (quote: Quote) => {
    try {
      // Create invoice from quote data - convert decimal strings to proper format
      const invoiceData = {
        uid: quote.uid,
        // Server will generate the invoice number automatically
        customerId: quote.customerId,
        customerName: quote.customerName,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        items: quote.items,
        subtotal: typeof quote.subtotal === 'string' ? quote.subtotal : quote.subtotal.toString(),
        taxAmount: typeof quote.taxAmount === 'string' ? quote.taxAmount : quote.taxAmount.toString(),
        total: typeof quote.total === 'string' ? quote.total : quote.total.toString(),
        status: 'unpaid' as const,
        notes: quote.notes || '',
        quoteId: quote.id // Include quote ID so server can mark it as converted
      };

      console.log('Converting quote to invoice:', invoiceData);
      
      // Use the create mutation directly to avoid duplicate toast messages
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }

      const newInvoice = await response.json();
      
      // Manually invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      
      toast({
        title: "Invoice Created Successfully",
        description: `Invoice ${newInvoice.number} has been created from quote ${quote.number}.`,
      });
    } catch (error) {
      console.error('Error converting to invoice:', error);
      toast({
        title: "Error",
        description: "Failed to convert quote to invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [lastEmailTime, setLastEmailTime] = useState(0);

  const handleSendEmail = async (quote: Quote) => {
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

    const customer = customers.find(c => c.id === parseInt(quote.customerId) || c.id.toString() === quote.customerId);

    if (!customer) {
      console.error('Customer lookup failed:', {
        quoteCustomerId: quote.customerId,
        availableCustomers: customers.map(c => ({ id: c.id, name: c.name }))
      });
      toast({
        title: "Error",
        description: "Customer not found for this quote.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      console.log('Quote email process starting for quote:', quote.number);
      
      // Only update status if it's not already "sent"
      if (quote.status !== 'sent') {
        await updateQuote({ id: quote.id.toString(), data: { status: 'sent' } });
      }
      
      // Simple approach: generate PDF first, then open email
      try {
        const pdfBlob = await generatePDF(quote, customer, currentUser, 'quote');
        
        // Download the PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quote-${quote.number}.pdf`;
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
      const emailSubject = `Quote ${quote.number} from ${currentUser.companyName || 'Your Company'}`;
      const emailBody = `Dear ${customer.name},

Thank you for your interest in our services. Please find quote ${quote.number} for your consideration.

Quote Details:
- Quote Number: ${quote.number}
- Issue Date: ${new Date(quote.date).toLocaleDateString('en-GB')}
- Valid Until: ${new Date(quote.validUntil).toLocaleDateString('en-GB')}
- Amount: £${quote.total}

This quote is valid for 30 days from the issue date. If you have any questions or would like to proceed with this quote, please contact us.

We look forward to working with you.

Best regards,
${currentUser.companyName || 'Your Company'}

---
Note: The PDF has been downloaded to your Downloads folder. Please attach it to this email.`;

      const simpleMailtoUrl = `mailto:${customer.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      console.log('Opening email with URL:', simpleMailtoUrl);
      window.location.href = simpleMailtoUrl;
      
      toast({
        title: "Email Prepared",
        description: `PDF downloaded and email opened for quote ${quote.number}. Quote status updated to "Sent". Please attach the PDF to the email.`,
      });
    } catch (error) {
      console.error('Error in quote email process:', error);
      toast({
        title: "Error",
        description: `Failed to update quote status: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Quotes">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Quotes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quotes</h2>
            <p className="text-slate-600 dark:text-slate-400">Create and manage your quotes</p>
          </div>
          <Link href="/quotes/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search quotes..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
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

        {/* Quote Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes?.map((quote: Quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">{quote.number}</TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>{new Date(quote.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(quote.validUntil).toLocaleDateString()}</TableCell>
                    <TableCell>£{parseFloat(quote.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(quote.status)}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPDF(quote)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Quote
                          </DropdownMenuItem>
                          {quote.status !== 'converted' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/quotes/${quote.id}/edit`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Quote
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendEmail(quote)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send via Email
                          </DropdownMenuItem>
                          {quote.status !== 'converted' && (
                            <DropdownMenuItem onClick={() => handleConvertToInvoice(quote)}>
                              <FileText className="h-4 w-4 mr-2" />
                              Convert to Invoice
                            </DropdownMenuItem>
                          )}
                          {quote.status !== 'converted' && (
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(quote)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Quote
                            </DropdownMenuItem>
                          )}
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
            <DialogTitle>Delete Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete quote {quoteToDelete?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
