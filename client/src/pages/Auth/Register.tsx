import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from '@/components/ui/loading-screen';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register = () => {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      companyName: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser(data.email, data.password, data.firstName, data.lastName, data.companyName);
      await refreshUser();
      
      // Show redirecting state
      setRedirecting(true);
      
      toast({
        title: 'Registration successful',
        description: 'Welcome to Eazee Invoice! You have a 7-day free trial.',
      });
      
      // Use window.location instead of navigate to force a clean navigation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500); // Small delay to show the redirecting message
      
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      if (!redirecting) {
        setLoading(false);
      }
    }
  };

  // Show loading screen while redirecting
  if (redirecting) {
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create your account
          </CardTitle>
          <CardDescription className="text-center">
            Start your 7-day free trial with Eazee Invoice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a strong password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading || redirecting}>
                {loading ? 'Creating account...' : redirecting ? 'Redirecting...' : 'Create account'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm space-y-2">
            <div>
              <Link href="/" className="text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300">
                ← Back to Home
              </Link>
            </div>
            <div>
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};