import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageSubscription() {
  const { currentUser: user } = useAuth();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  if (!user?.isSubscriber) {
    return (
      <Layout title="Manage Subscription">
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription. Please subscribe to access premium features.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate days remaining
  const calculateDaysRemaining = (): number | string => {
    if (user.isAdminGrantedSubscription) {
      return "Unlimited";
    }

    if (!user.subscriptionCurrentPeriodEnd) {
      return "Unknown";
    }

    const endDate = new Date(user.subscriptionCurrentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
        });
        
        // Refresh the page to update user data
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const daysRemaining = calculateDaysRemaining();
  const isUnlimited = daysRemaining === "Unlimited";
  const isExpiringSoon = typeof daysRemaining === 'number' && daysRemaining <= 7;

  return (
    <Layout title="Manage Subscription">
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        <Badge variant={user.isSubscriber ? "default" : "secondary"}>
          {user.isSubscriber ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Subscription Status
            </CardTitle>
            <CardDescription>
              Your current subscription details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan:</span>
              <span className="text-sm">
                {user.isAdminGrantedSubscription ? "Admin Granted" : "Pro Monthly"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Days Remaining:</span>
              <span className={`text-sm font-medium ${
                isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {daysRemaining} {typeof daysRemaining === 'number' ? 'days' : ''}
              </span>
            </div>

            {!isUnlimited && user.subscriptionCurrentPeriodEnd && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Renews:</span>
                <span className="text-sm">
                  {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
            <CardDescription>
              Manage your payment method and billing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Monthly Cost:</span>
              <span className="text-sm font-semibold">
                {user.isAdminGrantedSubscription ? "Free" : "£19.99"}
              </span>
            </div>

            {!user.isAdminGrantedSubscription && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Billing:</span>
                  <span className="text-sm">
                    {user.subscriptionCurrentPeriodEnd 
                      ? new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()
                      : "Unknown"
                    }
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Payment method management will be available soon.",
                      });
                    }}
                  >
                    Update Payment Method
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Warning for expiring subscriptions */}
      {isExpiringSoon && !isUnlimited && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Subscription Expiring Soon
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-300">
              Your subscription will expire in {daysRemaining} days. 
              {typeof daysRemaining === 'number' && daysRemaining <= 3 && 
                " Please ensure your payment method is up to date to avoid service interruption."
              }
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Cancel Subscription Section */}
      {!user.isAdminGrantedSubscription && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Cancel Subscription</CardTitle>
            <CardDescription>
              Cancel your subscription. You'll retain access until the end of your current billing period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isCancelling}>
                  {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will cancel your subscription. You'll continue to have access until {
                      user.subscriptionCurrentPeriodEnd 
                        ? new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()
                        : "the end of your billing period"
                    }, but you won't be charged again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancelSubscription}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Admin Granted Info */}
      {user.isAdminGrantedSubscription && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Calendar className="h-5 w-5" />
              Admin Granted Subscription
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Your subscription has been granted by an administrator. This subscription doesn't expire and there are no charges.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      </div>
    </Layout>
  );
}