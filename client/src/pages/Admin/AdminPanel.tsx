import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Banner } from '@/components/ui/banner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Users, DollarSign, FileText, TrendingUp, Plus, MoreHorizontal, UserPlus, Shield, Ban, Clock, Crown, Upload, Download, FileSpreadsheet, Infinity, Trash2, Key, Mail, Settings, Package, Receipt, BarChart3, Globe } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from '@shared/schema';
import { AdminPasswordManager } from '@/components/AdminPasswordManager';
import { AdminEmailManager } from '@/components/AdminEmailManager';
import { Switch } from '@/components/ui/switch';
import { Link } from 'wouter';
// Simple country flag mapping - using Unicode flags directly
const countryFlags: Record<string, string> = {
  'GB': '🇬🇧', 'US': '🇺🇸', 'CA': '🇨🇦', 'AU': '🇦🇺', 'DE': '🇩🇪', 'FR': '🇫🇷', 
  'ES': '🇪🇸', 'IT': '🇮🇹', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰',
  'FI': '🇫🇮', 'IE': '🇮🇪', 'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'PL': '🇵🇱',
  'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽',
  'AR': '🇦🇷', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬', 'KE': '🇰🇪', 'MA': '🇲🇦',
  'TR': '🇹🇷', 'RU': '🇷🇺', 'UA': '🇺🇦', 'GR': '🇬🇷', 'BG': '🇧🇬', 'RO': '🇷🇴',
  'HR': '🇭🇷', 'SI': '🇸🇮', 'SK': '🇸🇰', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'LT': '🇱🇹',
  'LV': '🇱🇻', 'EE': '🇪🇪', 'IS': '🇮🇸', 'PT': '🇵🇹', 'LU': '🇱🇺', 'MT': '🇲🇹',
  'CY': '🇨🇾', 'SG': '🇸🇬', 'MY': '🇲🇾', 'TH': '🇹🇭', 'VN': '🇻🇳', 'PH': '🇵🇭',
  'ID': '🇮🇩', 'NZ': '🇳🇿', 'IL': '🇮🇱', 'AE': '🇦🇪', 'SA': '🇸🇦', 'QA': '🇶🇦'
};

export const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [csvUploadDialog, setCsvUploadDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [subscriptionDuration, setSubscriptionDuration] = useState('1');
  const [isPermanentSubscription, setIsPermanentSubscription] = useState(false);
  const [csvUploadType, setCsvUploadType] = useState<'customers' | 'products'>('customers');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploadUser, setCsvUploadUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    password: 'temp123456',
    accountType: 'trial' as 'trial' | 'subscription',
    subscriptionMonths: '1'
  });
  const [stripeMode, setStripeMode] = useState<'live' | 'test'>('live');
  const [isTogglingMode, setIsTogglingMode] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [userStatsDialog, setUserStatsDialog] = useState(false);
  const [selectedUserForStats, setSelectedUserForStats] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users from PostgreSQL
  const { data: users, isLoading: loading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users');
      return response.json();
    }
  });

  // Fetch current stripe mode
  const { data: stripeModeData } = useQuery({
    queryKey: ['/api/stripe-mode'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/stripe-mode');
      return response.json();
    }
  });

  // Update stripe mode when data changes
  useEffect(() => {
    if (stripeModeData?.mode) {
      setStripeMode(stripeModeData.mode);
    }
  }, [stripeModeData]);

  // Fetch user statistics
  const { data: userStats, isLoading: userStatsLoading } = useQuery({
    queryKey: ['/api/users', selectedUserForStats?.uid, 'stats'],
    queryFn: async () => {
      if (!selectedUserForStats?.uid) return null;
      const response = await apiRequest('GET', `/api/users/${selectedUserForStats.uid}/stats`);
      return response.json();
    },
    enabled: !!selectedUserForStats?.uid
  });

  // Don't fetch invoices for admin panel since they're user-specific
  // const { data: invoices } = useQuery({
  //   queryKey: ['/api/invoices'],
  //   queryFn: async () => {
  //     const response = await apiRequest('GET', '/api/invoices');
  //     return response.json();
  //   }
  // });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/users/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: 'User updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
    }
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({ title: 'User created successfully' });
      setCreateUserDialog(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        companyName: '',
        password: 'temp123456',
        accountType: 'trial',
        subscriptionMonths: '1'
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
    }
  });

  // CSV Upload mutation
  const csvUploadMutation = useMutation({
    mutationFn: async ({ file, type, userId }: { file: File; type: 'customers' | 'products'; userId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('userId', userId);
      
      const response = await fetch('/api/csv-upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'CSV upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.errorCount > 0) {
        toast({ 
          title: 'CSV Upload Completed with Errors', 
          description: `Successfully imported ${data.successCount} items. ${data.errorCount} errors encountered.`
        });
        console.error('CSV upload errors:', data.errors);
        console.error('Error details:', data.errors.join('\n'));
      } else {
        toast({ 
          title: 'CSV Upload Successful', 
          description: `Successfully imported ${data.successCount} items.` 
        });
      }
      setCsvUploadDialog(false);
      setCsvFile(null);
      setCsvUploadUser(null);
    },
    onError: (error: any) => {
      console.error('CSV upload error:', error);
      toast({ title: 'CSV Upload Failed', description: error.message, variant: 'destructive' });
    }
  });

  // Toggle stripe mode mutation
  const toggleStripeModeMutation = useMutation({
    mutationFn: async (mode: 'live' | 'test') => {
      const response = await apiRequest('POST', '/api/stripe-mode', { mode });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Stripe Mode Updated', 
        description: data.message 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe-mode'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating Stripe mode', description: error.message, variant: 'destructive' });
    }
  });

  const filteredUsers = users?.filter((user: any) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter === 'trial') {
      matchesStatus = !user.isSubscriber && !user.isSuspended;
    } else if (statusFilter === 'subscriber') {
      matchesStatus = user.isSubscriber;
    } else if (statusFilter === 'suspended') {
      matchesStatus = user.isSuspended;
    }
    
    return matchesSearch && matchesStatus;
  });

  const totalUsers = users?.length || 0;
  const activeTrials = users?.filter((user: any) => !user.isSubscriber && !user.isSuspended).length || 0;
  const subscribers = users?.filter((user: any) => user.isSubscriber).length || 0;
  const suspendedUsers = users?.filter((user: any) => user.isSuspended).length || 0;
  const mockRevenue = subscribers * 29; // Assuming £29/month

  const handleGrantSubscription = async (user: any) => {
    setSelectedUser(user);
    setSubscriptionDialog(true);
  };

  const handleConfirmSubscription = async () => {
    if (!selectedUser) return;
    
    // Set subscription end date to far future (year 2099) for permanent subscriptions
    const subscriptionEndDate = isPermanentSubscription 
      ? new Date('2099-12-31T23:59:59Z') 
      : new Date(Date.now() + (parseInt(subscriptionDuration) * 30 * 24 * 60 * 60 * 1000));
    
    await updateUserMutation.mutateAsync({
      userId: selectedUser.uid,
      data: {
        isSubscriber: true,
        isSuspended: false,
        subscriptionCurrentPeriodEnd: subscriptionEndDate.toISOString(),
        isAdminGrantedSubscription: true
      }
    });
    
    setSubscriptionDialog(false);
    setSelectedUser(null);
    setIsPermanentSubscription(false);
  };

  const handleRevokeSubscription = async (userId: string) => {
    await updateUserMutation.mutateAsync({
      userId,
      data: { isSubscriber: false, subscriptionEndDate: null }
    });
  };

  const handleSuspendUser = async (userId: string) => {
    await updateUserMutation.mutateAsync({
      userId,
      data: { isSuspended: true }
    });
  };

  const handleUnsuspendUser = async (userId: string) => {
    await updateUserMutation.mutateAsync({
      userId,
      data: { isSuspended: false }
    });
  };

  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setDeleteUserDialog(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/users/${userToDelete.uid}`);
      
      if (response.ok) {
        toast({
          title: "User Deleted",
          description: `${userToDelete.firstName} ${userToDelete.lastName} has been permanently deleted along with all their data.`
        });
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete user",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
    
    setDeleteUserDialog(false);
    setUserToDelete(null);
  };

  const handleCreateUser = async () => {
    const isSubscriber = newUserData.accountType === 'subscription';
    const subscriptionEndDate = isSubscriber ? 
      new Date(Date.now() + (parseInt(newUserData.subscriptionMonths) * 30 * 24 * 60 * 60 * 1000)) : 
      null;

    await createUserMutation.mutateAsync({
      uid: `user_${Date.now()}`,
      email: newUserData.email,
      password: newUserData.password,
      firstName: newUserData.firstName,
      lastName: newUserData.lastName,
      companyName: newUserData.companyName,
      displayName: `${newUserData.firstName} ${newUserData.lastName}`,
      isSubscriber,
      isSuspended: false,
      isAdmin: false,
      mustChangePassword: true,
      trialStartDate: new Date().toISOString(),
      subscriptionEndDate: subscriptionEndDate?.toISOString() || null,
      isAdminGrantedSubscription: isSubscriber
    });
  };

  // CSV Template Download Functions
  const downloadCustomersTemplate = () => {
    const csvContent = [
      'name,email,phone,address,city,country,taxNumber',
      'John Doe,john@example.com,+44 123 456 7890,123 Main St,London,United Kingdom,GB123456789',
      'Jane Smith,jane@example.com,+44 987 654 3210,456 Oak Ave,Manchester,United Kingdom,GB987654321'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customers_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadProductsTemplate = () => {
    const csvContent = [
      'name,description,unitPrice,taxRate,category',
      'Web Design,Custom website design and development,500.00,20.00,Design',
      'SEO Consultation,Search engine optimization consultation,150.00,20.00,Marketing',
      'Logo Design,Professional logo design service,250.00,20.00,Design'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !csvUploadUser) return;
    
    await csvUploadMutation.mutateAsync({
      file: csvFile,
      type: csvUploadType,
      userId: csvUploadUser.uid
    });
  };

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async (billingFrequency: 'monthly' | 'yearly') => {
      const response = await apiRequest('POST', '/api/test-notification', { billingFrequency });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'Test notification sent!', 
        description: data.message || 'Check your phone for the notification'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Notification test failed', 
        description: error.message || 'Failed to send test notification'
      });
    }
  });

  const handleTestNotification = (billingFrequency: 'monthly' | 'yearly') => {
    setIsTestingNotification(true);
    testNotificationMutation.mutate(billingFrequency);
    setTimeout(() => setIsTestingNotification(false), 2000);
  };

  const handleShowUserStats = (user: any) => {
    setSelectedUserForStats(user);
    setUserStatsDialog(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      toast({ title: 'Invalid file type', description: 'Please select a CSV file', variant: 'destructive' });
    }
  };

  const getUserStatus = (user: any) => {
    if (user.isSuspended) return { text: 'Suspended', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (user.isSubscriber && user.isAdminGrantedSubscription) return { text: 'Admin Subscriber', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' };
    if (user.isSubscriber) return { text: 'Subscriber', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    return { text: 'Trial', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
  };

  const getTrialEndDate = (user: any) => {
    if (user.isSuspended) return 'Suspended';
    
    if (user.isSubscriber) {
      // Handle admin-granted subscriptions without end dates
      if (user.isAdminGrantedSubscription && !user.subscriptionCurrentPeriodEnd) {
        return 'Permanent';
      }
      
      // Handle Stripe subscriptions without proper end dates
      if (!user.subscriptionCurrentPeriodEnd) {
        return 'Active (No End Date Set)';
      }
      
      const periodEnd = new Date(user.subscriptionCurrentPeriodEnd);
      const now = new Date();
      
      // Check if it's expired
      if (periodEnd <= now) {
        return 'Expired';
      }
      
      // Calculate days left - use floor instead of ceil to be more accurate
      // and ensure we're using consistent UTC time for calculation
      const periodEndUTC = new Date(periodEnd.toISOString());
      const nowUTC = new Date(now.toISOString());
      const daysLeft = Math.floor((periodEndUTC.getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24));
      
      // Special handling for permanent subscriptions (year 2099)
      if (periodEnd.getFullYear() === 2099) {
        return 'Permanent';
      }
      
      return `${daysLeft} days left`;
    }
    
    // For trial users, calculate days left in trial
    const trialStart = new Date(user.trialStartDate);
    const trialEnd = new Date(trialStart.getTime() + (7 * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    // Check if trial is expired
    if (trialEnd <= now) {
      return 'Trial Expired';
    }
    
    // Calculate days left in trial - use floor for consistency
    const daysLeft = Math.floor((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `${daysLeft} days left`;
  };

  const getCountryFlagForUser = (user: any) => {
    const countryCode = user.country || 'GB';
    return countryFlags[countryCode] || '🇬🇧'; // Fallback to UK flag
  };

  const getUserDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const stats = [
    { title: 'Total Users', value: totalUsers.toString(), icon: Users, color: 'text-blue-600 dark:text-blue-400' },
    { title: 'Active Trials', value: activeTrials.toString(), icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { title: 'Subscribers', value: subscribers.toString(), icon: Crown, color: 'text-green-600 dark:text-green-400' },
    { title: 'Revenue (Est.)', value: `£${mockRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600 dark:text-blue-400' }
  ];

  if (loading) {
    return (
      <Layout title="Admin Panel">
        <div className="text-slate-900 dark:text-slate-100">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Panel">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin Panel</h2>
          <Badge variant="destructive">Admin Only</Badge>
        </div>

        {/* Stripe Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Payment Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Stripe Mode</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {stripeMode === 'live' ? 'Live payments - real money' : 'Test payments - no real charges'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${stripeMode === 'test' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  Test
                </span>
                <Switch
                  checked={stripeMode === 'live'}
                  onCheckedChange={(checked) => {
                    const newMode = checked ? 'live' : 'test';
                    setStripeMode(newMode);
                    toggleStripeModeMutation.mutate(newMode);
                  }}
                  disabled={toggleStripeModeMutation.isPending}
                />
                <span className={`text-sm font-medium ${stripeMode === 'live' ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  Live
                </span>
              </div>
            </div>
            {stripeMode === 'test' && (
              <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  ⚠️ Test mode active - no real payments will be processed
                </p>
              </div>
            )}
            {stripeMode === 'live' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✅ Live mode active - real payments will be processed
                </p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">Push Notifications</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Test phone notifications for new subscriptions
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleTestNotification('monthly')}
                    disabled={isTestingNotification || testNotificationMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {isTestingNotification ? 'Sending...' : 'Test Monthly'}
                  </Button>
                  <Button
                    onClick={() => handleTestNotification('yearly')}
                    disabled={isTestingNotification || testNotificationMutation.isPending}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    {isTestingNotification ? 'Sending...' : 'Test Yearly'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Website Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Website Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Meta Data & SEO</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Manage meta tags, SEO settings, and social media sharing
                </p>
                <Link href="/admin/meta-manager">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Manage Meta Data
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
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

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-slate-900 dark:text-slate-100">User Management</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => setCreateUserDialog(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="trial">Trial Users</SelectItem>
                    <SelectItem value="subscriber">Subscribers</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-900 dark:text-slate-100">User</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Status</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Joined</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Subscription Status</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user: any) => {
                  const status = getUserStatus(user);
                  return (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div 
                          className="flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-md transition-colors"
                          onClick={() => handleShowUserStats(user)}
                          title="Click to view user statistics"
                        >
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {getCountryFlagForUser(user)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {getUserDisplayName(user)}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">
                        {new Date(user.trialStartDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">
                        {getTrialEndDate(user)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <AdminPasswordManager user={user} />
                            <AdminEmailManager user={user} />
                            {!user.isSubscriber && (
                              <DropdownMenuItem onClick={() => handleGrantSubscription(user)}>
                                <Shield className="h-4 w-4 mr-2" />
                                Grant Subscription
                              </DropdownMenuItem>
                            )}
                            {user.isSubscriber && (
                              <DropdownMenuItem onClick={() => handleRevokeSubscription(user.uid)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke Subscription
                              </DropdownMenuItem>
                            )}
                            {!user.isSuspended ? (
                              <DropdownMenuItem onClick={() => handleSuspendUser(user.uid)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUnsuspendUser(user.uid)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Unsuspend User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)} 
                              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredUsers || filteredUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* CSV Upload Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-slate-900 dark:text-slate-100">CSV Data Upload</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setCsvUploadDialog(true)} className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-2" />
                      Download Templates
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={downloadCustomersTemplate}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Customer Template
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadProductsTemplate}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Product Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Upload CSV files to bulk import customers or products for any user. This helps you set up new users with their data quickly.
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Customers Template</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload customer data with fields: name, email, phone, address, city, country, taxNumber
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadCustomersTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Customer Template
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Products Template</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Upload product data with fields: name, description, unitPrice, taxRate, category
                  </p>
                  <Button variant="outline" size="sm" onClick={downloadProductsTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Product Template
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create User Dialog */}
        <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account for a customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={newUserData.firstName}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Last Name"
                  value={newUserData.lastName}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Company Name"
                value={newUserData.companyName}
                onChange={(e) => setNewUserData(prev => ({ ...prev, companyName: e.target.value }))}
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Account Type</label>
                <Select 
                  value={newUserData.accountType} 
                  onValueChange={(value) => setNewUserData(prev => ({ ...prev, accountType: value as 'trial' | 'subscription' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial (7 days)</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newUserData.accountType === 'subscription' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Subscription Duration</label>
                  <Select 
                    value={newUserData.subscriptionMonths} 
                    onValueChange={(value) => setNewUserData(prev => ({ ...prev, subscriptionMonths: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Default password: temp123456 (user should change on first login)
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 
                  newUserData.accountType === 'subscription' ? 'Create Subscriber' : 'Create Trial User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Subscription Dialog */}
        <Dialog open={subscriptionDialog} onOpenChange={setSubscriptionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Subscription</DialogTitle>
              <DialogDescription>
                Grant subscription access to {selectedUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="permanent-subscription"
                  checked={isPermanentSubscription}
                  onCheckedChange={(checked) => setIsPermanentSubscription(checked as boolean)}
                />
                <label htmlFor="permanent-subscription" className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center space-x-1">
                  <Infinity className="h-4 w-4" />
                  <span>Permanent Subscription (Never Expires)</span>
                </label>
              </div>
              
              {!isPermanentSubscription && (
                <div>
                  <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Subscription Duration
                  </label>
                  <Select value={subscriptionDuration} onValueChange={setSubscriptionDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubscriptionDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmSubscription} disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Granting...' : 'Grant Subscription'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CSV Upload Dialog */}
        <Dialog open={csvUploadDialog} onOpenChange={setCsvUploadDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload CSV Data</DialogTitle>
              <DialogDescription>
                Upload CSV files to bulk import customers or products for a specific user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Select User
                </label>
                <Select 
                  value={csvUploadUser?.uid || ''} 
                  onValueChange={(value) => {
                    const user = users?.find((u: any) => u.uid === value);
                    setCsvUploadUser(user);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to upload data for" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.uid} value={user.uid}>
                        {getUserDisplayName(user)} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Data Type
                </label>
                <Select value={csvUploadType} onValueChange={(value) => setCsvUploadType(value as 'customers' | 'products')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 dark:text-slate-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100
                    dark:file:bg-violet-950 dark:file:text-violet-300
                    dark:hover:file:bg-violet-900"
                />
                {csvFile && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  CSV Format Requirements:
                </h4>
                <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {csvUploadType === 'customers' ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Headers: name, email, phone, address, city, country, taxNumber</li>
                      <li>All fields are required except taxNumber</li>
                      <li>Email must be valid format</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Headers: name, description, unitPrice, taxRate, category</li>
                      <li>All fields are required</li>
                      <li>unitPrice and taxRate must be numbers</li>
                      <li>Use decimal format (e.g., 5.99)</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCsvUploadDialog(false);
                setCsvFile(null);
                setCsvUploadUser(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCsvUpload} 
                disabled={!csvFile || !csvUploadUser || csvUploadMutation.isPending}
              >
                {csvUploadMutation.isPending ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteUserDialog} onOpenChange={setDeleteUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600 dark:text-red-400">Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete {userToDelete?.firstName} {userToDelete?.lastName} ({userToDelete?.email})?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                  ⚠️ This action cannot be undone
                </h4>
                <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <p>This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>User account and profile</li>
                    <li>All invoices and quotes</li>
                    <li>All customers and products</li>
                    <li>All statements and documents</li>
                    <li>All company information</li>
                    <li>All data in recycle bin</li>
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteUserDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete User Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Statistics Dialog */}
        <Dialog open={userStatsDialog} onOpenChange={setUserStatsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                User Statistics - {selectedUserForStats ? getUserDisplayName(selectedUserForStats) : ''}
              </DialogTitle>
              <DialogDescription>
                View detailed statistics for this user's account activity
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {userStatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-slate-600 dark:text-slate-400">Loading statistics...</div>
                </div>
              ) : userStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Invoices</p>
                          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{userStats.invoices}</p>
                        </div>
                        <Receipt className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Quotes</p>
                          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{userStats.quotes}</p>
                        </div>
                        <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Statements</p>
                          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{userStats.statements}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Customers</p>
                          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{userStats.customers}</p>
                        </div>
                        <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Products</p>
                          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{userStats.products}</p>
                        </div>
                        <Package className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Account Status</p>
                          <div className="mt-1">
                            {selectedUserForStats && (
                              <Badge className={getUserStatus(selectedUserForStats).color}>
                                {getUserStatus(selectedUserForStats).text}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Crown className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                  Failed to load statistics
                </div>
              )}
              
              {selectedUserForStats && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">User Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Email:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-100">{selectedUserForStats.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Company:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-100">{selectedUserForStats.companyName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Joined:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-100">
                        {new Date(selectedUserForStats.trialStartDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Country:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-100">
                        {getCountryFlagForUser(selectedUserForStats)} {selectedUserForStats.country || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserStatsDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};