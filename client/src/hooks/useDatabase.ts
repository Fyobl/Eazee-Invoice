import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export const useDatabase = (collectionName: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [collectionName],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/${collectionName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${collectionName}`);
      }
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const response = await apiRequest('POST', `/api/${collectionName}`, newData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to create ${collectionName.slice(0, -1)}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      // Only show generic success toast for non-invoice collections
      // Invoice creation has custom success messages
      if (collectionName !== 'invoices') {
        toast({
          title: 'Success',
          description: `${collectionName.slice(0, -1)} created successfully`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/${collectionName}/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to update ${collectionName.slice(0, -1)}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      toast({
        title: 'Success',
        description: `${collectionName.slice(0, -1)} updated successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/${collectionName}/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${collectionName.slice(0, -1)}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      toast({
        title: 'Success',
        description: `${collectionName.slice(0, -1)} deleted successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    data: data || [],
    isLoading,
    error,
    loading: isLoading,
    add: createMutation.mutate,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    addMutation: createMutation,
    createMutation: createMutation,
    updateMutation: updateMutation,
    deleteMutation: deleteMutation,
  };
};

export const useCustomers = () => useDatabase('customers');
export const useProducts = () => useDatabase('products');
export const useInvoices = () => useDatabase('invoices');
export const useQuotes = () => useDatabase('quotes');
export const useStatements = () => useDatabase('statements');
export const useRecycleBin = () => useDatabase('recycle-bin');