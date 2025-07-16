import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { useLocation, useRoute } from 'wouter';
import { Product } from '@shared/schema';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  taxRate: z.number().min(0, 'Tax rate must be positive').max(100, 'Tax rate cannot exceed 100%')
});

type ProductForm = z.infer<typeof productSchema>;

export const ProductForm = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/products/:id/edit');
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { data: products, add: addProduct, update: updateProduct, addMutation: { isPending: addLoading }, updateMutation: { isPending: updateLoading } } = useProducts();
  
  const isEditing = !!match && !!params?.id;
  const productId = params?.id ? parseInt(params.id) : null;
  const existingProduct = products?.find((p: Product) => p.id === productId);
  const loading = addLoading || updateLoading;

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      unitPrice: 0,
      taxRate: 0
    }
  });

  // Load existing product data when editing
  useEffect(() => {
    if (isEditing && existingProduct) {
      form.reset({
        name: existingProduct.name,
        description: existingProduct.description || '',
        unitPrice: parseFloat(existingProduct.unitPrice),
        taxRate: parseFloat(existingProduct.taxRate)
      });
    }
  }, [isEditing, existingProduct, form]);

  const onSubmit = async (data: ProductForm) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && productId) {
        // Update existing product
        const updateData: Partial<Product> = {
          name: data.name,
          description: data.description,
          unitPrice: data.unitPrice,
          taxRate: data.taxRate,
        };
        
        updateProduct({ id: productId, data: updateData });
        setSuccess('Product updated successfully!');
      } else {
        // Add new product
        const product: Partial<Product> = {
          uid: currentUser.uid,
          name: data.name,
          description: data.description,
          unitPrice: data.unitPrice,
          taxRate: data.taxRate,
          isDeleted: false
        };

        addProduct(product);
        setSuccess('Product added successfully!');
      }
      
      setTimeout(() => {
        setLocation('/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'add'} product`);
    }
  };

  return (
    <Layout title={isEditing ? "Edit Product" : "Add Product"}>
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

        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Product Information' : 'Product Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setLocation('/products')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Product' : 'Add Product')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
