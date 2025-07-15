import { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFirestore } from '@/hooks/useFirestore';
import { Users, Crown, Ban, Eye, Clock, DollarSign } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { User } from '@shared/schema';

export const AdminPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { documents: users, loading, updateDocument } = useFirestore('users');

  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    
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
  const activeTrials = users?.filter((user: User) => !user.isSubscriber && !user.isSuspended).length || 0;
  const subscribers = users?.filter((user: User) => user.isSubscriber).length || 0;
  const suspendedUsers = users?.filter((user: User) => user.isSuspended).length || 0;
  const mockRevenue = subscribers * 29; // Assuming £29/month

  const handleGrantSubscription = async (userId: string) => {
    try {
      await updateDocument(userId, { isSubscriber: true, isSuspended: false });
      setSuccess('Subscription granted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grant subscription');
    }
  };

  const handleRevokeSubscription = async (userId: string) => {
    try {
      await updateDocument(userId, { isSubscriber: false });
      setSuccess('Subscription revoked successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke subscription');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await updateDocument(userId, { isSuspended: true });
      setSuccess('User suspended successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suspend user');
    }
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      await updateDocument(userId, { isSuspended: false });
      setSuccess('User unsuspended successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsuspend user');
    }
  };

  const getUserStatus = (user: User) => {
    if (user.isSuspended) return { text: 'Suspended', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
    if (user.isSubscriber) return { text: 'Subscriber', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
    return { text: 'Trial', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' };
  };

  const getTrialEndDate = (user: User) => {
    if (user.isSubscriber) return '-';
    const trialEnd = new Date(user.trialStartDate);
    trialEnd.setDate(trialEnd.getDate() + 7);
    return trialEnd.toLocaleDateString();
  };

  const getInitials = (user: User) => {
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const stats = [
    { title: 'Total Users', value: totalUsers, icon: Users, color: 'text-primary' },
    { title: 'Active Trials', value: activeTrials, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
    { title: 'Subscribers', value: subscribers, icon: Crown, color: 'text-green-600 dark:text-green-400' },
    { title: 'Revenue (Est.)', value: `£${mockRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600 dark:text-blue-400' }
  ];

  if (loading) {
    return (
      <Layout title="Admin Panel">
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Panel">
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
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-slate-900">Admin Panel</h2>
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

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex space-x-2">
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
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Trial Ends</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user: User) => {
                  const status = getUserStatus(user);
                  return (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.displayName || 'Unknown'}
                            </div>
                            <div className="text-sm text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{getTrialEndDate(user)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!user.isSubscriber && !user.isSuspended && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGrantSubscription(user.uid)}
                              title="Grant Subscription"
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          )}
                          {user.isSubscriber && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeSubscription(user.uid)}
                              title="Revoke Subscription"
                            >
                              <Crown className="h-4 w-4 text-amber-600" />
                            </Button>
                          )}
                          {!user.isSuspended ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspendUser(user.uid)}
                              title="Suspend User"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnsuspendUser(user.uid)}
                              title="Unsuspend User"
                            >
                              <Ban className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
