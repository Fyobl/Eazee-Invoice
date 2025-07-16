import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProducts } from '@/hooks/useDatabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Package, MoreHorizontal, Download, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { Product } from '@shared/schema';

export const ProductList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const { data: products, isLoading: loading, remove: deleteProduct, add: addProduct } = useProducts();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const filteredProducts = products?.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      toast({
        title: "Product Successfully Deleted",
        description: `${productToDelete.name} has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,description,unitPrice,taxRate
"Website Design","Custom website design service",500.00,20.00
"SEO Audit","Comprehensive SEO audit and recommendations",150.00,20.00
"Logo Design","Professional logo design package",200.00,20.00`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Product CSV template has been downloaded successfully.",
    });
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const expectedHeaders = ['name', 'description', 'unitPrice', 'taxRate'];
      
      // Validate headers
      const hasRequiredHeaders = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase() === header.toLowerCase())
      );
      
      if (!hasRequiredHeaders) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must contain columns: name, description, unitPrice, taxRate",
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
          const productData: any = {};
          headers.forEach((header, index) => {
            productData[header.toLowerCase()] = values[index];
          });

          // Validate and convert data types
          const unitPrice = parseFloat(productData.unitprice);
          const taxRate = parseFloat(productData.taxrate);
          
          if (isNaN(unitPrice) || unitPrice < 0) {
            errorCount++;
            errors.push(`Row ${i + 1}: Invalid unit price`);
            continue;
          }
          
          if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
            errorCount++;
            errors.push(`Row ${i + 1}: Invalid tax rate (must be 0-100)`);
            continue;
          }

          const product = {
            uid: currentUser?.uid,
            name: productData.name,
            description: productData.description || '',
            unitPrice: unitPrice,
            taxRate: taxRate,
            isDeleted: false
          };

          await addProduct(product);
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
          description: `Successfully imported ${successCount} products${errorCount > 0 ? ` (${errorCount} errors)` : ''}`,
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

  if (loading) {
    return (
      <Layout title="Products">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Products</h2>
            <p className="text-slate-600 dark:text-slate-400">Manage your product catalog</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload CSV
            </Button>
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <Link href="/products/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts?.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No products found</p>
                <Link href="/products/new">
                  <Button className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts?.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{product.description}</TableCell>
                      <TableCell>£{parseFloat(product.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>{parseFloat(product.taxRate).toFixed(0)}%</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}/edit`} className="flex items-center">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(product)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {productToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
