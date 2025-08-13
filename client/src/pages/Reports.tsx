import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { FileText, Quote, FileBarChart, Users, TrendingUp, DollarSign, Download, Receipt, Star, Crown, Calendar } from 'lucide-react';
import { Invoice, Quote as QuoteType, Statement, Customer, Product, User } from '@shared/schema';
import { generateVATReport, generateTopCustomersReport, generateBestSellersReport, generatePeriodTakingsReport } from '@/components/Reports/ReportGenerator';
import { format, subDays, subMonths, subWeeks, startOfYear, endOfYear } from 'date-fns';
import { useState } from 'react';

export const Reports = () => {
  const { data: invoices } = useDatabase('invoices');
  const { data: quotes } = useDatabase('quotes');
  const { data: statements } = useDatabase('statements');
  const { data: customers } = useDatabase('customers');
  const { data: products } = useDatabase('products');
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 12), 'yyyy-MM-dd')); // Default to last 12 months
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const totalInvoices = invoices?.length || 0;
  const totalQuotes = quotes?.length || 0;
  const totalStatements = statements?.length || 0;
  const totalCustomers = customers?.length || 0;

  const totalRevenue = invoices?.reduce((sum: number, invoice: Invoice) => sum + parseFloat(invoice.total), 0) || 0;
  const paidInvoices = invoices?.filter((invoice: Invoice) => invoice.status === 'paid').length || 0;
  const unpaidInvoices = invoices?.filter((invoice: Invoice) => invoice.status === 'unpaid').length || 0;
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
      color: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Statements',
      value: totalStatements,
      icon: FileBarChart,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Customers',
      value: totalCustomers,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const revenueStats = [
    {
      title: 'Total Revenue',
      value: `£${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Average Invoice',
      value: totalInvoices > 0 ? `£${(totalRevenue / totalInvoices).toFixed(2)}` : '£0.00',
      icon: TrendingUp,
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  const handleGenerateReport = async (reportType: string) => {
    if (!currentUser || !invoices || !customers) return;
    
    setGeneratingReport(reportType);
    
    try {
      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
      
      const reportData = {
        invoices: invoices as Invoice[],
        quotes: quotes as QuoteType[] || [],
        customers: customers as Customer[],
        products: products as Product[] || [],
        user: currentUser as User
      };
      
      switch (reportType) {
        case 'vat':
          await generateVATReport(reportData, dateRange);
          break;
        case 'topCustomers':
          await generateTopCustomersReport(reportData, dateRange);
          break;
        case 'bestSellers':
          await generateBestSellersReport(reportData, dateRange);
          break;
        case 'periodTakings':
          await generatePeriodTakingsReport(reportData, selectedPeriod, dateRange);
          break;
      }
      
      toast({
        title: "Report Generated",
        description: "Your report has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(null);
    }
  };

  const topCustomers = customers?.map((customer: Customer) => {
    const customerInvoices = invoices?.filter((invoice: Invoice) => invoice.customerId === customer.id.toString()) || [];
    const customerRevenue = customerInvoices.reduce((sum: number, invoice: Invoice) => sum + parseFloat(invoice.total), 0);
    return {
      name: customer.name,
      invoiceCount: customerInvoices.length,
      revenue: customerRevenue
    };
  }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5) || [];

  return (
    <Layout title="Reports">
      <div className="space-y-6">
        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Report Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="period">Period Type</Label>
                <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Downloadable Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Downloadable Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => handleGenerateReport('vat')}
                disabled={generatingReport === 'vat'}
                className="flex items-center gap-2 h-20 flex-col"
                variant="outline"
              >
                <Receipt className="h-6 w-6" />
                <span>VAT Report</span>
                {generatingReport === 'vat' && <span className="text-xs">Generating...</span>}
              </Button>
              
              <Button
                onClick={() => handleGenerateReport('topCustomers')}
                disabled={generatingReport === 'topCustomers'}
                className="flex items-center gap-2 h-20 flex-col"
                variant="outline"
              >
                <Crown className="h-6 w-6" />
                <span>Top Customers</span>
                {generatingReport === 'topCustomers' && <span className="text-xs">Generating...</span>}
              </Button>
              
              <Button
                onClick={() => handleGenerateReport('bestSellers')}
                disabled={generatingReport === 'bestSellers'}
                className="flex items-center gap-2 h-20 flex-col"
                variant="outline"
              >
                <Star className="h-6 w-6" />
                <span>Best Sellers</span>
                {generatingReport === 'bestSellers' && <span className="text-xs">Generating...</span>}
              </Button>
              
              <Button
                onClick={() => handleGenerateReport('periodTakings')}
                disabled={generatingReport === 'periodTakings'}
                className="flex items-center gap-2 h-20 flex-col"
                variant="outline"
              >
                <Calendar className="h-6 w-6" />
                <span>{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Takings</span>
                {generatingReport === 'periodTakings' && <span className="text-xs">Generating...</span>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{stat.title}</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
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
                      <p className="text-sm text-slate-600 dark:text-slate-400">{stat.title}</p>
                      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
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
                  <span className="text-sm text-slate-600 dark:text-slate-400">Paid</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{paidInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Unpaid</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{unpaidInvoices}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Overdue</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">{overdueInvoices}</span>
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
                  <span className="text-sm text-slate-600 dark:text-slate-400">Accepted</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{acceptedQuotes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{pendingQuotes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Total Quotes</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{totalQuotes}</span>
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
                  {topCustomers.map((customer: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{customer.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{customer.invoiceCount} invoices</p>
                      </div>
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        £{customer.revenue.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No customer data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
