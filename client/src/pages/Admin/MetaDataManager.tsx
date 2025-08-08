import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, Share2, Twitter, Facebook, Search } from 'lucide-react';
import { Banner } from '@/components/ui/banner';

const metaSchema = z.object({
  meta_title: z.string().min(1, 'Title is required'),
  meta_description: z.string().min(1, 'Description is required'),
  meta_keywords: z.string().min(1, 'Keywords are required'),
  meta_og_title: z.string().min(1, 'Open Graph title is required'),
  meta_og_description: z.string().min(1, 'Open Graph description is required'),
  meta_twitter_title: z.string().min(1, 'Twitter title is required'),
  meta_twitter_description: z.string().min(1, 'Twitter description is required'),
  meta_author: z.string().min(1, 'Author is required'),
  meta_site_name: z.string().min(1, 'Site name is required'),
  meta_canonical_url: z.string().url('Must be a valid URL')
});

type MetaForm = z.infer<typeof metaSchema>;

export const MetaDataManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: metaSettings, isLoading } = useQuery({
    queryKey: ['/api/meta-settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/meta-settings');
      return response.json();
    }
  });

  const form = useForm<MetaForm>({
    resolver: zodResolver(metaSchema),
    values: metaSettings || {}
  });

  const updateMetaMutation = useMutation({
    mutationFn: async (data: MetaForm) => {
      const response = await apiRequest('PUT', '/api/meta-settings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meta data settings updated successfully!"
      });
      setSuccess("Meta data settings have been updated. Changes will appear on new page loads.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/meta-settings'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update meta data settings"
      });
      setError(error.message || "Failed to update meta data settings");
      setSuccess(null);
    }
  });

  const onSubmit = (data: MetaForm) => {
    updateMetaMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout title="Meta Data Manager">
        <div className="text-slate-900 dark:text-slate-100">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Meta Data Manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Website Meta Data Manager</h2>
          <Badge variant="destructive">Admin Only</Badge>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400">
          Manage your website's meta data for better search engine optimization (SEO) and social media sharing.
        </p>

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic SEO Meta Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Basic SEO Meta Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Eazee Invoice - Professional Invoice Management" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The main title that appears in search results and browser tabs.
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Professional invoicing software for freelancers and small businesses..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The description that appears under your title in search results.
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="invoice software, freelance invoicing, small business billing"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords that describe your website content.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Open Graph (Facebook) Meta Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5" />
                  Open Graph Tags (Facebook/LinkedIn)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_og_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Eazee Invoice - Professional Invoice Management"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Title when shared on Facebook, LinkedIn, etc.
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_og_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Professional invoicing software for freelancers and small businesses..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Description when shared on social media.
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Twitter Meta Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="h-5 w-5" />
                  Twitter Card Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_twitter_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Eazee Invoice - Professional Invoice Management"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Title when shared on Twitter.
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_twitter_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Professional invoicing software for freelancers and small businesses..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Description when shared on Twitter.
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Additional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_author"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Eazee Invoice"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The author or company name for the website.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_site_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Eazee Invoice"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The name of your website/brand.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_canonical_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://eazeeinvoice.replit.app/"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        The primary URL for your website to prevent duplicate content issues.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button 
                type="submit" 
                disabled={updateMetaMutation.isPending}
                size="lg"
              >
                {updateMetaMutation.isPending ? 'Updating...' : 'Update Meta Data'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};