import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { changePassword, deleteAccount } from '@/lib/auth';
import { Clock, Crown, AlertTriangle, User, Mail } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters')
});

const emailChangeSchema = z.object({
  newEmail: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type PasswordForm = z.infer<typeof passwordSchema>;
type DeleteAccountForm = z.infer<typeof deleteAccountSchema>;
type PersonalInfoForm = z.infer<typeof personalInfoSchema>;
type EmailChangeForm = z.infer<typeof emailChangeSchema>;

export const Account = () => {
  const [, setLocation] = useLocation();
  const { userData, trialDaysLeft, currentUser } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [personalInfoLoading, setPersonalInfoLoading] = useState(false);
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const deleteForm = useForm<DeleteAccountForm>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const personalInfoForm = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || ''
    }
  });

  const emailChangeForm = useForm<EmailChangeForm>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: '',
      password: ''
    }
  });

  // Update form when userData changes
  useEffect(() => {
    if (userData) {
      personalInfoForm.setValue('firstName', userData.firstName || '');
      personalInfoForm.setValue('lastName', userData.lastName || '');
    }
  }, [userData, personalInfoForm]);

  const onPasswordSubmit = async (data: PasswordForm) => {
    setError(null);
    setSuccess(null);
    setPasswordLoading(true);

    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast({
        title: "Success",
        description: "Password updated successfully!"
      });
      passwordForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onDeleteSubmit = async (data: DeleteAccountForm) => {
    setError(null);
    setSuccess(null);
    setDeleteLoading(true);

    try {
      await deleteAccount(data.password);
      setLocation('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
    }
  };

  const onPersonalInfoSubmit = async (data: PersonalInfoForm) => {
    if (!currentUser) return;
    
    setPersonalInfoLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest('PUT', `/api/users/${currentUser.uid}`, {
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      toast({
        title: "Success",
        description: "Your personal information has been updated successfully!"
      });
      
      // The auth context will sync automatically to get the updated user data
      window.location.reload(); // Simple refresh to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update personal information');
    } finally {
      setPersonalInfoLoading(false);
    }
  };

  const onEmailChangeSubmit = async (data: EmailChangeForm) => {
    if (!currentUser) return;
    
    setEmailChangeLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // First verify the current password
      const verifyResponse = await apiRequest('POST', '/api/verify-password', {
        password: data.password
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Invalid password');
      }

      // Update the email
      const updateResponse = await apiRequest('PUT', `/api/users/${currentUser.uid}`, {
        email: data.newEmail
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Failed to update email');
      }
      
      toast({
        title: "Email Updated",
        description: "Your email address has been updated successfully!"
      });
      
      emailChangeForm.reset();
      window.location.reload(); // Refresh to get updated data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email address');
    } finally {
      setEmailChangeLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!userData) return null;
    
    if (userData.isSubscriber) {
      return (
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Pro Subscriber</p>
              <p className="text-sm text-green-700">Full access to all features</p>
            </div>
          </div>
        </div>
      );
    } else if (trialDaysLeft > 0) {
      return (
        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">Trial Period</p>
              <p className="text-sm text-amber-700">{trialDaysLeft} days remaining</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Upgrade to Pro
          </Button>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Trial Expired</p>
              <p className="text-sm text-red-700">Please upgrade to continue using the service</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Upgrade Now
          </Button>
        </div>
      );
    }
  };

  return (
    <Layout title="Account">
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

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
          </CardHeader>
          <CardContent>
            {getSubscriptionStatus()}
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...personalInfoForm}>
              <form onSubmit={personalInfoForm.handleSubmit(onPersonalInfoSubmit)} className="space-y-4 max-w-md">
                <FormField
                  control={personalInfoForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={personalInfoForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={personalInfoLoading}>
                  {personalInfoLoading ? 'Updating...' : 'Update Personal Information'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Change Email Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Current email: <span className="font-medium text-slate-900 dark:text-slate-100">{userData?.email}</span>
              </p>
            </div>
            <Form {...emailChangeForm}>
              <form onSubmit={emailChangeForm.handleSubmit(onEmailChangeSubmit)} className="space-y-4 max-w-md">
                <FormField
                  control={emailChangeForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your new email address" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={emailChangeForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your current password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={emailChangeLoading}>
                  {emailChangeLoading ? 'Updating Email...' : 'Update Email Address'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter current password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Delete Account */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Delete Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">
                  ⚠️ This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <Form {...deleteForm}>
              <form onSubmit={deleteForm.handleSubmit(onDeleteSubmit)} className="space-y-4 max-w-md">
                <FormField
                  control={deleteForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Enter Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={deleteForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" variant="destructive" disabled={deleteLoading}>
                  {deleteLoading ? 'Deleting Account...' : 'Delete Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
