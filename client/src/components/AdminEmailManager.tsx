import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface AdminEmailManagerProps {
  user: User;
}

export function AdminEmailManager({ user }: AdminEmailManagerProps) {
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const changeEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const response = await apiRequest('PUT', `/api/users/${user.uid}`, {
        email: newEmail
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change email");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Email Updated",
        description: `Email address has been changed to ${newEmail}`
      });
      setChangeEmailOpen(false);
      setNewEmail("");
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change email"
      });
    }
  });

  const handleChangeEmail = () => {
    if (!newEmail || !isValidEmail(newEmail)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address"
      });
      return;
    }

    if (newEmail === user.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New email must be different from current email"
      });
      return;
    }

    changeEmailMutation.mutate(newEmail);
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <>
      {/* Change Email Dialog */}
      <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <DialogTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Mail className="h-4 w-4 mr-2" />
            Change Email
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Email</DialogTitle>
            <DialogDescription>
              Change the email address for {user.displayName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will immediately change the user's email address. They will need to use the new email for login.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>User Details</Label>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">Current: {user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email Address</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="Enter new email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={changeEmailMutation.isPending}
                />
              </div>

              {newEmail && (
                <Alert className={isValidEmail(newEmail) ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : ""}>
                  {isValidEmail(newEmail) ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={isValidEmail(newEmail) ? "text-green-800 dark:text-green-200" : ""}>
                    {isValidEmail(newEmail) ? "Valid email format ✓" : "Please enter a valid email address"}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setChangeEmailOpen(false);
                  setNewEmail("");
                }}
                disabled={changeEmailMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleChangeEmail}
                disabled={changeEmailMutation.isPending || !newEmail || !isValidEmail(newEmail)}
              >
                {changeEmailMutation.isPending ? "Changing..." : "Change Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}