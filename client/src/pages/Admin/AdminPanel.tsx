import { useState } from 'react';
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
import { Users, DollarSign, FileText, TrendingUp, Plus, MoreHorizontal, UserPlus, Shield, Ban, Clock, Crown } from 'lucide-react';
import { User } from '@shared/schema';

export const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [subscriptionDuration, setSubscriptionDuration] = useState('1');
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyName: '',
    password: 'temp123456'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users from PostgreSQL
  const { data: users, isLoading: loading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('/api/users', { method: 'GET' });
      return response.json();
    }
  });

  // Fetch stats
  const { data: invoices } = useQuery({
    queryKey: ['/api/invoices'],
    queryFn: async () => {
      const response = await apiRequest('/api/invoices', { method: 'GET' });
      return response.json();
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await apiRequest(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
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
      const response = await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
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
        password: 'temp123456'
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
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
    
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + parseInt(subscriptionDuration));
    
    await updateUserMutation.mutateAsync({
      userId: selectedUser.uid,
      data: {
        isSubscriber: true,
        isSuspended: false,
        subscriptionEndDate: subscriptionEndDate.toISOString()
      }
    });
    
    setSubscriptionDialog(false);
    setSelectedUser(null);
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

  const handleCreateUser = async () => {
    await createUserMutation.mutateAsync({
      uid: `user_${Date.now()}`,
      email: newUserData.email,
      firstName: newUserData.firstName,
      lastName: newUserData.lastName,
      companyName: newUserData.companyName,
      displayName: `${newUserData.firstName} ${newUserData.lastName}`,
      isSubscriber: false,
      isSuspended: false,
      isAdmin: false,
      trialStartDate: new Date().toISOString()
    });
  };

  const getUserStatus = (user: any) => {
    if (user.isSuspended) return { text: 'Suspended', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (user.isSubscriber) return { text: 'Subscriber', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    return { text: 'Trial', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
  };

  const getTrialEndDate = (user: any) => {
    if (user.isSubscriber) return 'N/A';
    if (user.isSuspended) return 'Suspended';
    
    const trialStart = new Date(user.trialStartDate);
    const trialEnd = new Date(trialStart.getTime() + (7 * 24 * 60 * 60 * 1000));
    return trialEnd.toLocaleDateString();
  };

  const getInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-slate-100">User Management</CardTitle>
              <div className="flex space-x-2">
                <Button onClick={() => setCreateUserDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
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
                  <TableHead className="text-slate-900 dark:text-slate-100">Trial Ends</TableHead>
                  <TableHead className="text-slate-900 dark:text-slate-100">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user: any) => {
                  const status = getUserStatus(user);
                  return (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
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
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Default password: temp123456 (user should change on first login)
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateUserDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create User'}
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
      </div>
    </Layout>
  );
};