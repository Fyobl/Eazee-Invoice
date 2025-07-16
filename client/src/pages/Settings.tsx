import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDatabase } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { Progress } from '@/components/ui/progress';
import { Upload, Image, X } from 'lucide-react';
import { User } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const settingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyAddress: z.string().min(1, 'Address is required'),
  companyVatNumber: z.string().optional(),
  companyRegistrationNumber: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  dateFormat: z.string().min(1, 'Date format is required')
});

type SettingsForm = z.infer<typeof settingsSchema>;

export const Settings = () => {
  const { currentUser, refreshUser } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      companyAddress: '',
      companyVatNumber: '',
      companyRegistrationNumber: '',
      currency: 'GBP',
      dateFormat: 'DD/MM/YYYY'
    }
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        companyName: currentUser.companyName || '',
        companyAddress: currentUser.companyAddress || '',
        companyVatNumber: currentUser.companyVatNumber || '',
        companyRegistrationNumber: currentUser.companyRegistrationNumber || '',
        currency: currentUser.currency || 'GBP',
        dateFormat: currentUser.dateFormat || 'DD/MM/YYYY'
      });
      setLogoPreview(currentUser.companyLogo || null);
    }
  }, [currentUser, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be less than 5MB');
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !currentUser) return;

    setLogoUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress during file reading
      setUploadProgress(10);
      
      // Convert file to base64 for database storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          setUploadProgress(50);
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(logoFile);
      });

      const base64Data = await base64Promise;
      
      // Simulate progress during upload
      setUploadProgress(70);
      
      // Update user record with logo data
      const response = await apiRequest('PUT', `/api/users/${currentUser.uid}`, {
        companyLogo: base64Data
      });
      
      if (!response.ok) {
        throw new Error('Failed to update logo');
      }
      
      setUploadProgress(90);
      await refreshUser();
      setUploadProgress(100);
      
      setSuccess('Logo uploaded successfully!');
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError('Failed to upload logo');
    } finally {
      setLogoUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogoRemove = async () => {
    if (!currentUser?.companyLogo) return;

    setLogoUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      setUploadProgress(30);
      
      const response = await apiRequest('PUT', `/api/users/${currentUser.uid}`, {
        companyLogo: null
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove logo');
      }
      
      setUploadProgress(70);
      await refreshUser();
      setUploadProgress(100);
      
      setLogoPreview(null);
      setSuccess('Logo removed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
    } finally {
      setLogoUploading(false);
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiRequest('PUT', `/api/users/${currentUser.uid}`, {
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyVatNumber: data.companyVatNumber,
        companyRegistrationNumber: data.companyRegistrationNumber,
        currency: data.currency,
        dateFormat: data.dateFormat
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      await refreshUser();
      toast({
        title: 'Success',
        description: 'Settings saved successfully!'
      });
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Settings">
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Company Branding */}
            <Card>
              <CardHeader>
                <CardTitle>Company Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Logo</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img 
                            src={logoPreview} 
                            alt="Company logo" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Image className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={logoUploading}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {logoFile ? 'Change Logo' : 'Upload Logo'}
                            </Button>
                            
                            {logoFile && (
                              <Button 
                                type="button" 
                                onClick={handleLogoUpload}
                                disabled={logoUploading}
                                size="sm"
                              >
                                {logoUploading ? 'Uploading...' : 'Save'}
                              </Button>
                            )}
                            
                            {logoPreview && !logoFile && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={handleLogoRemove}
                                disabled={logoUploading}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove
                              </Button>
                            )}
                          </div>
                          
                          {/* Progress Bar */}
                          {logoUploading && (
                            <div className="w-full max-w-xs">
                              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
                                <span>{uploadProgress < 100 ? 'Uploading...' : 'Complete!'}</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <Progress value={uploadProgress} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Upload a logo to appear on your invoices, quotes, and statements. Max size: 5MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your business address"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="companyVatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="VAT123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyRegistrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="REG123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PDF Settings */}
            <Card>
              <CardHeader>
                <CardTitle>PDF Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="CAD">CAD ($)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date Format</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
};
