import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { RotateCcw, Trash2, Clock, MoreHorizontal } from 'lucide-react';
import { RecycleBinItem } from '@shared/schema';
import { Banner } from '@/components/ui/banner';

export const RecycleBin = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch recycle bin items from PostgreSQL
  const { data: recycleBinItems, isLoading: loading } = useQuery({
    queryKey: ['/api/recycle-bin'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/recycle-bin?uid=${currentUser?.uid}`);
      return response.json();
    },
    enabled: !!currentUser?.uid
  });

  // Permanent delete mutation
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/recycle-bin/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recycle-bin'] });
      toast({ title: 'Item permanently deleted' });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting item', description: error.message, variant: 'destructive' });
    }
  });

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: async ({ item, restoreEndpoint }: { item: RecycleBinItem; restoreEndpoint: string }) => {
      // Update the original item to restore it
      const response = await apiRequest('PUT', `/api/${restoreEndpoint}/${item.originalId}`, 
        { isDeleted: false, updatedAt: new Date() });
      
      // Remove from recycle bin
      await apiRequest('DELETE', `/api/recycle-bin/${item.id}`);
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recycle-bin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Item restored successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error restoring item', description: error.message, variant: 'destructive' });
    }
  });

  // Auto-cleanup items older than 7 days
  useEffect(() => {
    const cleanupOldItems = () => {
      const now = new Date();
      recycleBinItems?.forEach((item: RecycleBinItem) => {
        const deletedDate = new Date(item.deletedAt);
        const daysDiff = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 7) {
          permanentDeleteMutation.mutate(item.id);
        }
      });
    };

    if (recycleBinItems) {
      cleanupOldItems();
    }
  }, [recycleBinItems, permanentDeleteMutation]);

  const getRestoreEndpoint = (type: string) => {
    switch (type) {
      case 'invoice': return 'invoices';
      case 'quote': return 'quotes';
      case 'statement': return 'statements';
      case 'customer': return 'customers';
      case 'product': return 'products';
      default: return null;
    }
  };

  const handleRestore = async (item: RecycleBinItem) => {
    const restoreEndpoint = getRestoreEndpoint(item.type);
    if (!restoreEndpoint) {
      toast({ title: 'Cannot restore this item type', variant: 'destructive' });
      return;
    }

    restoreMutation.mutate({ item, restoreEndpoint });
  };

  const handlePermanentDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      permanentDeleteMutation.mutate(id);
    }
  };

  const getDaysRemaining = (deletedAt: Date) => {
    const now = new Date();
    const deletedDate = new Date(deletedAt);
    const daysDiff = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysDiff);
  };

  const getItemName = (item: RecycleBinItem) => {
    const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    switch (item.type) {
      case 'invoice':
        return `Invoice ${data.number}`;
      case 'quote':
        return `Quote ${data.number}`;
      case 'statement':
        return `Statement ${data.number}`;
      case 'customer':
        return data.name;
      case 'product':
        return data.name;
      default:
        return 'Unknown item';
    }
  };

  const getCustomerName = (item: RecycleBinItem) => {
    const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    switch (item.type) {
      case 'invoice':
      case 'quote':
      case 'statement':
        return data.customerName || 'Unknown Customer';
      case 'customer':
        return data.name;
      case 'product':
        return 'N/A';
      default:
        return 'N/A';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quote': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'statement': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'customer': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'product': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <Layout title="Recycle Bin">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Recycle Bin">
      <div className="space-y-6">
        {error && (
          <Banner variant="error" onClose={() => setError(null)}>
            {error}
          </Banner>
        )}
        
        {success && (
          <Banner variant="success" onClose={() => setSuccess(null)}>
            {success}
          </Banner>
        )}

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Recycle Bin</h2>
          <p className="text-slate-600 dark:text-slate-400">Restore or permanently delete items within 7 days</p>
        </div>

        {/* Recycle Bin Items */}
        <Card>
          <CardHeader>
            <CardTitle>Deleted Items</CardTitle>
          </CardHeader>
          <CardContent>
            {!recycleBinItems || recycleBinItems.length === 0 ? (
              <div className="text-center py-8">
                <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Recycle bin is empty</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recycleBinItems.map((item: RecycleBinItem) => {
                    const daysRemaining = getDaysRemaining(item.deletedAt);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{getItemName(item)}</TableCell>
                        <TableCell>{getCustomerName(item)}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(item.deletedAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className={daysRemaining <= 1 ? 'text-red-600' : 'text-gray-600'}>
                              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleRestore(item)}
                                disabled={daysRemaining <= 0}
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore Item
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handlePermanentDelete(item.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
