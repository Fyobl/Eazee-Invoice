import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { RefreshCw } from 'lucide-react';

interface RequestNewCodeButtonProps {
  senderEmail: string;
  onCodeRequested?: () => void;
}

export const RequestNewCodeButton = ({ senderEmail, onCodeRequested }: RequestNewCodeButtonProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestNewCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/setup-auto-email', {
        senderEmail
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "New Verification Code Sent",
        description: "Check your email for a fresh 6-digit verification code.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      onCodeRequested?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => requestNewCodeMutation.mutate()}
      disabled={requestNewCodeMutation.isPending}
      className="flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      {requestNewCodeMutation.isPending ? 'Sending...' : 'Get New Code'}
    </Button>
  );
};