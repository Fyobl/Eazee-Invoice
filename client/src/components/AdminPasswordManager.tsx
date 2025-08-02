import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Key, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
}

interface AdminPasswordManagerProps {
  user: User;
}

export function AdminPasswordManager({ user }: AdminPasswordManagerProps) {
  const [sendResetOpen, setSendResetOpen] = useState(false);
  const [setPasswordOpen, setSetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendResetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: user.uid })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send reset email");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Reset Email Sent",
        description: data.message
      });
      setSendResetOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email"
      });
    }
  });

  const setPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/admin/set-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userUid: user.uid, newPassword: password })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set password");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Updated",
        description: data.message
      });
      setSetPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set password"
      });
    }
  });

  const handleSetPassword = () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 8 characters long"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match"
      });
      return;
    }

    setPasswordMutation.mutate(newPassword);
  };

  return (
    <div className="flex gap-2">
      {/* Send Password Reset Dialog */}
      <Dialog open={sendResetOpen} onOpenChange={setSendResetOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Reset
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Password Reset Email</DialogTitle>
            <DialogDescription>
              Send a password reset email to {user.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                This will send a secure reset link to <strong>{user.email}</strong>. 
                The link will expire in 1 hour and can only be used once.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>User Details</Label>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSendResetOpen(false)}
                disabled={sendResetMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => sendResetMutation.mutate()}
                disabled={sendResetMutation.isPending}
              >
                {sendResetMutation.isPending ? "Sending..." : "Send Reset Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={setPasswordOpen} onOpenChange={setSetPasswordOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Key className="h-4 w-4 mr-2" />
            Set Password
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set User Password</DialogTitle>
            <DialogDescription>
              Directly set a new password for {user.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will immediately change the user's password. They will be able to log in with the new password right away.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>User Details</Label>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={setPasswordMutation.isPending}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={setPasswordMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={setPasswordMutation.isPending}
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={setPasswordMutation.isPending}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {newPassword && (
                <Alert className={newPassword.length >= 8 ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : ""}>
                  {newPassword.length >= 8 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={newPassword.length >= 8 ? "text-green-800 dark:text-green-200" : ""}>
                    Password must be at least 8 characters long
                    {newPassword.length >= 8 && " ✓"}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSetPasswordOpen(false);
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={setPasswordMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSetPassword}
                disabled={setPasswordMutation.isPending || newPassword.length < 8 || !confirmPassword}
              >
                {setPasswordMutation.isPending ? "Setting..." : "Set Password"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}