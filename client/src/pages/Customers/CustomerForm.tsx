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
import { useCustomers } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { useLocation, useRoute } from 'wouter';
import { Customer } from '@shared/schema';

const customerSchema = z.object({
  name: z.string().min(1, 'Business Name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required')
});

type CustomerForm = z.infer<typeof customerSchema>;

export const CustomerForm = () => {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/customers/:id/edit');
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { data: customers, add: addCustomer, update: updateCustomer, addMutation: { isPending: addLoading }, updateMutation: { isPending: updateLoading } } = useCustomers();
  
  const isEditing = !!match && !!params?.id;
  const customerId = params?.id ? parseInt(params.id) : null;
  const existingCustomer = customers?.find((c: Customer) => c.id === customerId);
  const loading = addLoading || updateLoading;

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: ''
    }
  });

  // Load existing customer data when editing
  useEffect(() => {
    if (isEditing && existingCustomer) {
      form.reset({
        name: existingCustomer.name,
        contactName: existingCustomer.contactName || '',
        email: existingCustomer.email,
        phone: existingCustomer.phone || '',
        address: existingCustomer.address
      });
    }
  }, [isEditing, existingCustomer, form]);

  const onSubmit = async (data: CustomerForm) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && customerId) {
        // Update existing customer
        const updateData: Partial<Customer> = {
          name: data.name,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          address: data.address,
        };
        
        updateCustomer({ id: customerId, data: updateData });
        setSuccess('Customer updated successfully!');
      } else {
        // Add new customer
        const customer: Partial<Customer> = {
          uid: currentUser.uid,
          name: data.name,
          contactName: data.contactName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          isDeleted: false
        };

        addCustomer(customer);
        setSuccess('Customer added successfully!');
      }
      
      setTimeout(() => {
        setLocation('/customers');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'add'} customer`);
    }
  };

  return (
    <Layout title={isEditing ? "Edit Customer" : "Add Customer"}>
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
            <CardTitle>{isEditing ? 'Edit Customer Information' : 'Customer Information'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>



                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter customer address"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setLocation('/customers')}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Customer' : 'Add Customer')}
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
