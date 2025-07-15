import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Customer, Product, Invoice, Quote, Statement, Company, RecycleBinItem } from "@shared/schema";

export const useDatabase = (collectionName: string) => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/${collectionName}`, currentUser?.uid],
    queryFn: async () => {
      if (!currentUser?.uid) return [];
      const response = await apiRequest(`/api/${collectionName}?uid=${currentUser.uid}`);
      return response.data;
    },
    enabled: !!currentUser?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(`/api/${collectionName}`, {
        method: 'POST',
        data: { ...data, uid: currentUser?.uid }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${collectionName}`] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: any }) => {
      const response = await apiRequest(`/api/${collectionName}/${id}`, {
        method: 'PUT',
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${collectionName}`] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const response = await apiRequest(`/api/${collectionName}/${id}`, {
        method: 'DELETE'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${collectionName}`] });
    }
  });

  const add = (data: any) => addMutation.mutate(data);
  const update = (id: string | number, data: any) => updateMutation.mutate({ id, data });
  const remove = (id: string | number) => deleteMutation.mutate(id);

  return {
    data,
    isLoading,
    error,
    refetch,
    add,
    update,
    remove,
    addMutation,
    updateMutation,
    deleteMutation
  };
};

// Specific hooks for each collection
export const useCustomers = () => useDatabase('customers');
export const useProducts = () => useDatabase('products');
export const useInvoices = () => useDatabase('invoices');
export const useQuotes = () => useDatabase('quotes');
export const useStatements = () => useDatabase('statements');
export const useCompanies = () => useDatabase('companies');
export const useRecycleBin = () => useDatabase('recycle-bin');