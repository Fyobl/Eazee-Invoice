import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Calendar, CreditCard, Info } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ManageSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Show management page for both regular subscribers and admin-granted subscribers
  if (!user?.isSubscriber && !user?.isAdminGrantedSubscription) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No Active Subscription
            </CardTitle>
            <CardDescription>
              You don't have an active subscription. Subscribe to access all features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/subscribe'}>
              Subscribe Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate days remaining
  const endDate = user.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd) : null;
  const today = new Date();
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const isExpiringSoon = daysRemaining <= 7;

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You'll retain access until your current period ends.",
        });
        setShowCancelDialog(false);
        // Refresh the page to show updated status
        window.location.reload();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel subscription. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Subscription</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your Eazee Invoice subscription
        </p>
      </div>

      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </span>
            <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
              {user.subscriptionStatus === 'active' ? 'Active' : 'Cancelled'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Plan</div>
              <div className="font-semibold">Pro Plan</div>
              <div className="text-sm text-muted-foreground">
                {user.isAdminGrantedSubscription ? 'Admin Granted' : '£19.99/month'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {user.subscriptionStatus === 'active' ? 'Next billing date' : 'Access ends'}
              </div>
              <div className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {endDate ? endDate.toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </div>
              {daysRemaining > 0 && (
                <div className={`text-sm ${isExpiringSoon ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {daysRemaining} days remaining
                </div>
              )}
            </div>
          </div>

          {isExpiringSoon && user.subscriptionStatus === 'active' && !user.isAdminGrantedSubscription && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your subscription renews in {daysRemaining} days. Your card will be charged £19.99.
              </AlertDescription>
            </Alert>
          )}

          {user.isAdminGrantedSubscription && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You have an admin-granted subscription. 
                {daysRemaining > 0 ? ` You have ${daysRemaining} days remaining.` : ' Your subscription has expired.'}
              </AlertDescription>
            </Alert>
          )}

          {user.subscriptionStatus === 'cancelled' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your subscription is cancelled but you'll retain access until {endDate?.toLocaleDateString('en-GB')}.
                After this date, your account will revert to trial status.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Important Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Important Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-red-600">Non-Refundable Service</h4>
            <p className="text-sm text-muted-foreground">
              All subscription payments are non-refundable. This policy helps us maintain consistent service quality and development.
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-semibold">Cancellation Policy</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>You can cancel your subscription at any time</li>
              <li>Cancelled subscriptions remain active until the end of the current billing period</li>
              <li>After cancellation, your account will revert to trial status with limited features</li>
              <li>You can resubscribe at any time to regain full access</li>
            </ul>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold">What happens after subscription ends?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your data will be preserved but access will be limited</li>
              <li>You can view existing invoices and quotes but cannot create new ones</li>
              <li>PDF generation and email features will be disabled</li>
              <li>Customer and product management will be read-only</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card - Only show cancel option for paid subscriptions, not admin-granted */}
      {user.subscriptionStatus === 'active' && !user.isAdminGrantedSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Actions</CardTitle>
            <CardDescription>
              Manage your subscription settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Subscription</DialogTitle>
                  <DialogDescription className="space-y-2">
                    <p>Are you sure you want to cancel your subscription?</p>
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
                      <p className="text-sm text-amber-800">
                        <strong>Important:</strong> Your subscription will remain active until {endDate?.toLocaleDateString('en-GB')} 
                        ({daysRemaining} days). After this date, your account will revert to trial status with limited access.
                      </p>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                    Keep Subscription
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Resubscribe Card */}
      {user.subscriptionStatus === 'cancelled' && (
        <Card>
          <CardHeader>
            <CardTitle>Resubscribe</CardTitle>
            <CardDescription>
              Want to continue using all features? Resubscribe anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/subscribe'}>
              Resubscribe Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            If you have questions about your subscription or need assistance, please contact our support team.
          </p>
          <Button variant="outline" onClick={() => window.open('mailto:support@eazeeinvoice.com')}>
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}