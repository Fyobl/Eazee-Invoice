import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/hooks/useFirestore';
import { RotateCcw, Trash2, Clock } from 'lucide-react';
import { RecycleBinItem } from '@shared/schema';
import { Banner } from '@/components/ui/banner';

export const RecycleBin = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { documents: recycleBinItems, loading, deleteDocument: permanentDelete } = useFirestore('recycle_bin');
  const { addDocument: restoreInvoice } = useFirestore('invoices');
  const { addDocument: restoreQuote } = useFirestore('quotes');
  const { addDocument: restoreStatement } = useFirestore('statements');
  const { addDocument: restoreCustomer } = useFirestore('customers');
  const { addDocument: restoreProduct } = useFirestore('products');

  // Auto-cleanup items older than 7 days
  useEffect(() => {
    const cleanupOldItems = () => {
      const now = new Date();
      recycleBinItems?.forEach((item: RecycleBinItem) => {
        const deletedDate = new Date(item.deletedAt);
        const daysDiff = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 7) {
          permanentDelete(item.id);
        }
      });
    };

    if (recycleBinItems) {
      cleanupOldItems();
    }
  }, [recycleBinItems, permanentDelete]);

  const getRestoreFunction = (type: string) => {
    switch (type) {
      case 'invoice': return restoreInvoice;
      case 'quote': return restoreQuote;
      case 'statement': return restoreStatement;
      case 'customer': return restoreCustomer;
      case 'product': return restoreProduct;
      default: return null;
    }
  };

  const handleRestore = async (item: RecycleBinItem) => {
    try {
      const restoreFunction = getRestoreFunction(item.type);
      if (!restoreFunction) {
        setError('Cannot restore this item type');
        return;
      }

      // Restore the item to its original collection
      const restoredData = {
        ...item.data,
        isDeleted: false,
        updatedAt: new Date()
      };
      
      await restoreFunction(restoredData);
      await permanentDelete(item.id);
      
      setSuccess(`${item.type} restored successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore item');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      try {
        await permanentDelete(id);
        setSuccess('Item permanently deleted');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete item');
      }
    }
  };

  const getDaysRemaining = (deletedAt: Date) => {
    const now = new Date();
    const deletedDate = new Date(deletedAt);
    const daysDiff = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - daysDiff);
  };

  const getItemName = (item: RecycleBinItem) => {
    switch (item.type) {
      case 'invoice':
      case 'quote':
      case 'statement':
        return item.data.number || 'Unknown';
      case 'customer':
      case 'product':
        return item.data.name || 'Unknown';
      default:
        return 'Unknown';
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
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(item)}
                              disabled={daysRemaining <= 0}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePermanentDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
