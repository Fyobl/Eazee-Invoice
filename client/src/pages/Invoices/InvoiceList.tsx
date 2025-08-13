import { useState, useEffect } from 'react';
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
import { EmailSendButton } from '@/components/Email/EmailSendButton';
import { Plus, Eye, Edit, Download, Trash2, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { Invoice, Customer } from '@shared/schema';

export const InvoiceList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { data: invoices, isLoading: loading, remove: deleteDocument, update: updateInvoice } = useDatabase('invoices');
  const { data: customers } = useDatabase('customers');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const filteredInvoices = invoices?.filter((invoice: Invoice) => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || invoice.customerId.toString() === customerFilter;
    
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Pagination logic
  const totalItems = filteredInvoices?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices?.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customerFilter]);

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
      await deleteDocument(invoiceToDelete.id.toString());
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

    const customer = customers.find((c: Customer) => c.id.toString() === invoice.customerId.toString());

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(invoice, customer, currentUser as any, 'invoice');
      
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

    const customer = customers.find((c: Customer) => c.id.toString() === invoice.customerId.toString());

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(invoice, customer, currentUser as any, 'invoice');
      
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
                  {customers?.map((customer: Customer) => (
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
                {paginatedInvoices?.map((invoice: Invoice) => (
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
                          <EmailSendButton
                            documentType="invoice"
                            customerEmail={customers?.find((c: Customer) => c.id.toString() === invoice.customerId.toString())?.email || ''}
                            customerName={invoice.customerName}
                            documentNumber={invoice.number}
                            documentData={invoice}
                            customer={customers?.find((c: Customer) => c.id.toString() === invoice.customerId.toString())}
                            currentUser={currentUser}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 px-2 text-sm font-normal"
                          />
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} invoices
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current page
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="px-1 text-slate-400">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
