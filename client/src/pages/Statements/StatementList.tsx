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
import { Plus, Eye, Download, Trash2, MoreHorizontal, FileText, Calendar, Mail } from 'lucide-react';
import { Link } from 'wouter';
import { Statement } from '@shared/schema';

export const StatementList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<Statement | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [lastEmailTime, setLastEmailTime] = useState(0);
  
  const { data: statements, isLoading: loading, remove: deleteDocument } = useDatabase('statements');
  const { data: customers } = useDatabase('customers');
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const filteredStatements = statements?.filter((statement: Statement) => {
    const matchesSearch = statement.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         statement.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || statement.customerId === customerFilter || statement.customerId === parseInt(customerFilter);
    const matchesPeriod = periodFilter === 'all' || statement.period === periodFilter;
    
    return matchesSearch && matchesCustomer && matchesPeriod;
  });

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case 'custom': return 'Custom period';
      default: return period;
    }
  };

  const handleDeleteClick = (statement: Statement) => {
    setStatementToDelete(statement);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (statementToDelete) {
      await deleteDocument(statementToDelete.id);
      toast({
        title: "Statement Successfully Deleted",
        description: `Statement ${statementToDelete.number} has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setStatementToDelete(null);
    }
  };

  const handleViewPDF = async (statement: Statement) => {
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

    const customer = customers.find(c => c.id === parseInt(statement.customerId) || c.id.toString() === statement.customerId);

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this statement.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(statement, customer, currentUser, 'statement');

      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (statement: Statement) => {
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

    const customer = customers.find(c => c.id === parseInt(statement.customerId) || c.id.toString() === statement.customerId);

    if (!customer) {
      toast({
        title: "Error",
        description: "Customer not found for this statement.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdfBlob = await generatePDF(statement, customer, currentUser, 'statement');

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${statement.number}_${statement.customerName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded",
        description: `Statement ${statement.number} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (statement: Statement) => {
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

    const customer = customers.find(c => c.id === parseInt(statement.customerId) || c.id.toString() === statement.customerId);

    if (!customer) {
      console.error('Customer lookup failed:', {
        statementCustomerId: statement.customerId,
        availableCustomers: customers.map(c => ({ id: c.id, name: c.name }))
      });
      toast({
        title: "Error",
        description: "Customer not found for this statement.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingPDF(true);
      console.log('Creating PDF and email for statement:', statement.number);
      
      // First, generate and download the PDF
      try {
        // Add small delay to prevent rapid-fire issues
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Temporarily suppress all alerts during PDF generation
        const originalAlert = window.alert;
        window.alert = () => {};
        
        const pdfBlob = await generatePDF(statement, customer, currentUser, 'statement');
        
        // Restore alert after PDF generation
        window.alert = originalAlert;
        
        // Download the PDF
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `statement-${statement.number}.pdf`;
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
      const emailSubject = `Statement ${statement.number} from ${currentUser.companyName || 'Your Company'}`;
      const emailBody = `Dear ${customer.name},

Please find your account statement for the period ${new Date(statement.fromDate).toLocaleDateString('en-GB')} to ${new Date(statement.toDate).toLocaleDateString('en-GB')}.

Statement Details:
- Statement Number: ${statement.number}
- Period: ${new Date(statement.fromDate).toLocaleDateString('en-GB')} - ${new Date(statement.toDate).toLocaleDateString('en-GB')}
- Total Amount: £${statement.total}

This statement shows all outstanding invoices for the specified period. If you have any questions or need clarification on any items, please contact us.

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
        description: `PDF downloaded and email opened for statement ${statement.number}. Please attach the PDF to the email.`,
      });
    } catch (error) {
      console.error('Error preparing email:', error);
      toast({
        title: "Error",
        description: "Failed to prepare email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Statements">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-600 dark:text-slate-400">Loading statements...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Statements">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Statements</h2>
            <p className="text-slate-600 dark:text-slate-400">Generate and manage customer statements</p>
          </div>
          <Link href="/statements/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Statement
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search statements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
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
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom period</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Statement Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Statements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStatements && filteredStatements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statement #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStatements?.map((statement: Statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium">{statement.number}</TableCell>
                      <TableCell>{statement.customerName}</TableCell>
                      <TableCell>{new Date(statement.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {getPeriodLabel(statement.period)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(statement.startDate).toLocaleDateString()} - {new Date(statement.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewPDF(statement)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadPDF(statement)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSendEmail(statement)}>
                              <Mail className="h-4 w-4 mr-2" />
                              Send via Email
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(statement)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Statement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No statements found</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {searchTerm || customerFilter !== 'all' || periodFilter !== 'all' 
                    ? 'No statements match your current filters.' 
                    : 'Create your first statement to get started.'}
                </p>
                <Link href="/statements/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Statement
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Statement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete statement {statementToDelete?.number}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Statement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};