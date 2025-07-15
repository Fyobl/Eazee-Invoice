import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { Plus, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { Quote, InvoiceItem, Product } from '@shared/schema';
import { formatCurrency } from '@/lib/currency';
import { SearchableCustomerSelect } from '@/components/SearchableCustomerSelect';
import { SearchableProductSelect } from '@/components/SearchableProductSelect';

const quoteSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  notes: z.string().optional()
});

type QuoteForm = z.infer<typeof quoteSchema>;

export const QuoteForm = () => {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { documents: customers } = useFirestore('customers');
  const { documents: products } = useFirestore('products');
  const { addDocument, loading } = useFirestore('quotes');

  const form = useForm<QuoteForm>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      notes: ''
    }
  });

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate amount
    if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
      const item = newItems[index];
      const subtotal = item.quantity * item.unitPrice;
      const tax = subtotal * (item.taxRate / 100);
      newItems[index].amount = subtotal + tax;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { 
      id: String(items.length + 1), 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      taxRate: 0, 
      amount: 0 
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const addProductToItem = (index: number, product: Product) => {
    updateItem(index, 'description', product.name);
    updateItem(index, 'unitPrice', product.unitPrice);
    updateItem(index, 'taxRate', product.taxRate);
    updateItem(index, 'productId', product.id);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const onSubmit = async (data: QuoteForm) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);

    try {
      const selectedCustomer = customers?.find(c => c.id === data.customerId);
      if (!selectedCustomer) {
        setError('Selected customer not found');
        return;
      }

      const { subtotal, taxAmount, total } = calculateTotals();
      const quoteNumber = `QTE-${Date.now().toString().slice(-6)}`;

      const quote: Partial<Quote> = {
        uid: currentUser.uid,
        number: quoteNumber,
        customerId: data.customerId,
        customerName: selectedCustomer.name,
        date: new Date(data.date),
        validUntil: new Date(data.validUntil),
        items,
        subtotal,
        taxAmount,
        total,
        status: data.status,
        notes: data.notes,
        isDeleted: false
      };

      await addDocument(quote);
      setSuccess('Quote created successfully!');
      
      setTimeout(() => {
        setLocation('/quotes');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote');
    }
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  return (
    <Layout title="Create Quote">
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <FormControl>
                          <SearchableCustomerSelect
                            customers={customers}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Search and select customer..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid Until</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Items</CardTitle>
                  <Button type="button" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <div className="space-y-2">
                          <SearchableProductSelect
                            products={products}
                            onProductSelect={(product) => addProductToItem(index, product)}
                            placeholder="Search products..."
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Or enter custom description"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Unit Price</label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
                        <Input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>
                      <div className="flex items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">Amount</label>
                          <Input
                            value={formatCurrency(item.amount, 'GBP')}
                            readOnly
                            className="bg-gray-50"
                          />
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Totals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-right">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal, 'GBP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(taxAmount, 'GBP')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(total, 'GBP')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add any notes or terms..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setLocation('/quotes')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Quote'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};
