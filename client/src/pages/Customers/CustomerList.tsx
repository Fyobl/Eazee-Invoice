import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCustomers } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, User, MoreHorizontal, Download, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { Customer } from '@shared/schema';

export const CustomerList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  
  const { data: customers, isLoading: loading, remove: deleteCustomer, add: addCustomer } = useCustomers();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const filteredCustomers = customers?.filter((customer: Customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (customerToDelete) {
      await deleteCustomer(customerToDelete.id);
      toast({
        title: "Customer Successfully Deleted",
        description: `${customerToDelete.name} has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const downloadCustomerTemplate = () => {
    const csvContent = `name,email,phone,address
"John Smith","john@example.com","07123456789","123 Main Street, London, UK"
"Jane Doe","jane@example.com","07987654321","456 Oak Avenue, Manchester, UK"
"Bob Johnson","bob@example.com","07555123456","789 Pine Road, Birmingham, UK"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Customer CSV template has been downloaded successfully.",
    });
  };

  const handleCustomerCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must contain at least a header row and one data row.",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const expectedHeaders = ['name', 'email', 'phone', 'address'];
      
      // Validate headers
      const hasRequiredHeaders = ['name', 'email', 'address'].every(header => 
        headers.some(h => h.toLowerCase() === header.toLowerCase())
      );
      
      if (!hasRequiredHeaders) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must contain columns: name, email, phone, address (phone is optional)",
          variant: "destructive",
        });
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each data row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
        
        if (values.length !== headers.length) {
          errorCount++;
          errors.push(`Row ${i + 1}: Incorrect number of columns`);
          continue;
        }

        try {
          const customerData: any = {};
          headers.forEach((header, index) => {
            customerData[header.toLowerCase()] = values[index];
          });

          // Validate required fields
          if (!customerData.name || !customerData.email || !customerData.address) {
            errorCount++;
            errors.push(`Row ${i + 1}: Missing required fields (name, email, address)`);
            continue;
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(customerData.email)) {
            errorCount++;
            errors.push(`Row ${i + 1}: Invalid email format`);
            continue;
          }

          const customer = {
            uid: currentUser?.uid,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone || '',
            address: customerData.address,
            isDeleted: false
          };

          await addCustomer(customer);
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "CSV Import Complete",
          description: `Successfully imported ${successCount} customers${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
        });
      }
      
      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Import Failed",
          description: `${errorCount} errors occurred. Please check your CSV format.`,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <Layout title="Customers">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Customers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Customers</h2>
            <p className="text-slate-600 dark:text-slate-400">Manage your customer database</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={downloadCustomerTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('customer-csv-upload')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <input
              id="customer-csv-upload"
              type="file"
              accept=".csv"
              onChange={handleCustomerCSVUpload}
              className="hidden"
            />
            <Link href="/customers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer: Customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => handleCustomerClick(customer)}
                  >
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{customer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCustomerClick(customer)}>
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${customer.id}/edit`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Customer
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(customer)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Customer Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer Details</span>
              </DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                    {selectedCustomer.name}
                  </h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-slate-600 dark:text-slate-400">{selectedCustomer.email}</span>
                  </div>
                  
                  {selectedCustomer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="text-slate-600 dark:text-slate-400">{selectedCustomer.phone}</span>
                    </div>
                  )}
                  
                  {selectedCustomer.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-red-500 mt-1" />
                      <span className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {selectedCustomer.address}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Link href={`/customers/${selectedCustomer.id}/edit`}>
                    <Button variant="outline" size="sm" onClick={() => setShowDetails(false)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {customerToDelete?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Customer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
