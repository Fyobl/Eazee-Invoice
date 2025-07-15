import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestore } from '@/hooks/useFirestore';
import { FileText, Quote, FileBarChart, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Invoice, Quote as QuoteType, Statement, Customer } from '@shared/schema';

export const Reports = () => {
  const { documents: invoices } = useFirestore('invoices');
  const { documents: quotes } = useFirestore('quotes');
  const { documents: statements } = useFirestore('statements');
  const { documents: customers } = useFirestore('customers');

  const totalInvoices = invoices?.length || 0;
  const totalQuotes = quotes?.length || 0;
  const totalStatements = statements?.length || 0;
  const totalCustomers = customers?.length || 0;

  const totalRevenue = invoices?.reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0) || 0;
  const paidInvoices = invoices?.filter((invoice: Invoice) => invoice.status === 'paid').length || 0;
  const pendingInvoices = invoices?.filter((invoice: Invoice) => invoice.status === 'sent').length || 0;
  const overdueInvoices = invoices?.filter((invoice: Invoice) => invoice.status === 'overdue').length || 0;

  const acceptedQuotes = quotes?.filter((quote: QuoteType) => quote.status === 'accepted').length || 0;
  const pendingQuotes = quotes?.filter((quote: QuoteType) => quote.status === 'sent').length || 0;

  const stats = [
    {
      title: 'Total Invoices',
      value: totalInvoices,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Active Quotes',
      value: totalQuotes,
      icon: Quote,
      color: 'text-emerald-600'
    },
    {
      title: 'Statements',
      value: totalStatements,
      icon: FileBarChart,
      color: 'text-blue-600'
    },
    {
      title: 'Customers',
      value: totalCustomers,
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  const revenueStats = [
    {
      title: 'Total Revenue',
      value: `£${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Average Invoice',
      value: totalInvoices > 0 ? `£${(totalRevenue / totalInvoices).toFixed(2)}` : '£0.00',
      icon: TrendingUp,
      color: 'text-blue-600'
    }
  ];

  const topCustomers = customers?.map((customer: Customer) => {
    const customerInvoices = invoices?.filter((invoice: Invoice) => invoice.customerId === customer.id) || [];
    const customerRevenue = customerInvoices.reduce((sum: number, invoice: Invoice) => sum + invoice.total, 0);
    return {
      name: customer.name,
      invoiceCount: customerInvoices.length,
      revenue: customerRevenue
    };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{stat.title}</p>
                      <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {revenueStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{stat.title}</p>
                      <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Paid</span>
                  <span className="text-sm font-medium text-green-600">{paidInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Pending</span>
                  <span className="text-sm font-medium text-blue-600">{pendingInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overdue</span>
                  <span className="text-sm font-medium text-red-600">{overdueInvoices}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quote Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Accepted</span>
                  <span className="text-sm font-medium text-green-600">{acceptedQuotes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Pending</span>
                  <span className="text-sm font-medium text-blue-600">{pendingQuotes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Quotes</span>
                  <span className="text-sm font-medium text-slate-900">{totalQuotes}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              {topCustomers.length > 0 ? (
                <div className="space-y-4">
                  {topCustomers.map((customer, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.invoiceCount} invoices</p>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        £{customer.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No customer data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
