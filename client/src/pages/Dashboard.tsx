import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore } from '@/hooks/useFirestore';
import { FileText, Quote, FileBarChart, Users, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

export const Dashboard = () => {
  const { userData } = useAuth();
  const { documents: invoices } = useFirestore('invoices');
  const { documents: quotes } = useFirestore('quotes');
  const { documents: customers } = useFirestore('customers');

  const totalRevenue = invoices?.reduce((sum, invoice) => sum + invoice.total, 0) || 0;

  const stats = [
    {
      title: 'Total Invoices',
      value: invoices?.length || 0,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Active Quotes',
      value: quotes?.filter(q => q.status === 'sent').length || 0,
      icon: Quote,
      color: 'text-emerald-600'
    },
    {
      title: 'Customers',
      value: customers?.length || 0,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'This Month',
      value: `£${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  const quickActions = [
    { label: 'Create New Invoice', href: '/invoices/new', icon: Plus },
    { label: 'Generate Quote', href: '/quotes/new', icon: Quote },
    { label: 'Add Customer', href: '/customers/new', icon: Plus }
  ];

  const recentActivity = [
    { action: 'Invoice #001 created', time: '2 hours ago', icon: FileText },
    { action: 'New customer added', time: '1 day ago', icon: Users },
    { action: 'Quote #005 sent', time: '3 days ago', icon: Quote }
  ];

  return (
    <Layout title="Dashboard">
      {/* Welcome Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Welcome back, {userData?.displayName || 'User'}!
          </h2>
          <p className="text-slate-600 dark:text-slate-200">Here's what's happening with your business today.</p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{stat.title}</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button 
                  variant={index === 0 ? "default" : "outline"} 
                  className="w-full justify-start"
                >
                  <action.icon className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900 dark:text-slate-100">{activity.action}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
