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
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { FileText, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { Statement, Customer } from '@shared/schema';

const statementSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  period: z.enum(['7', '30', 'custom']).default('30'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => {
  if (data.period === 'custom') {
    return data.startDate && data.endDate;
  }
  return true;
}, {
  message: 'Start and end dates are required for custom period',
  path: ['startDate']
});

type StatementForm = z.infer<typeof statementSchema>;

export const StatementForm = () => {
  const [, setLocation] = useLocation();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { data: customers } = useDatabase('customers');
  const { add: addStatement, loading } = useDatabase('statements');

  const form = useForm<StatementForm>({
    resolver: zodResolver(statementSchema),
    defaultValues: {
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      period: '30',
      startDate: '',
      endDate: '',
      notes: ''
    }
  });

  const watchedPeriod = form.watch('period');

  // Calculate dates based on period selection
  const calculateDates = (period: string) => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        return { startDate: '', endDate: '' };
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const onSubmit = async (data: StatementForm) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);

    try {
      const selectedCustomer = customers?.find((c: Customer) => c.id.toString() === data.customerId);
      if (!selectedCustomer) {
        setError('Selected customer not found');
        return;
      }

      let startDate, endDate;
      
      if (data.period === 'custom') {
        startDate = new Date(data.startDate!);
        endDate = new Date(data.endDate!);
      } else {
        const dates = calculateDates(data.period);
        startDate = new Date(dates.startDate);
        endDate = new Date(dates.endDate);
      }

      const statement: Partial<Statement> = {
        uid: currentUser.uid,
        // Server will generate the statement number automatically
        customerId: data.customerId,
        customerName: selectedCustomer.name,
        date: new Date(data.date),
        startDate: new Date(data.period === 'custom' ? data.startDate! : calculateDates(data.period).startDate),
        endDate: new Date(data.period === 'custom' ? data.endDate! : calculateDates(data.period).endDate),
        period: data.period,
        notes: data.notes || '',
        isDeleted: false
      };

      await addStatement(statement);
      setSuccess('Statement created successfully!');
      
      setTimeout(() => {
        setLocation('/statements');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create statement');
    }
  };

  return (
    <Layout title="Create Statement">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Statement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers?.map((customer: Customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statement Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Statement Period
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="7">Last 7 days</SelectItem>
                          <SelectItem value="30">Last 30 days</SelectItem>
                          <SelectItem value="custom">Custom period</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedPeriod === 'custom' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period Start</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Period End</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {watchedPeriod !== 'custom' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This statement will include all invoices and transactions for the customer 
                      from the last {watchedPeriod} days.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                          placeholder="Add any notes for this statement..."
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

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setLocation('/statements')}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Statement'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};