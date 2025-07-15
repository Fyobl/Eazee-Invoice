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
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { Banner } from '@/components/ui/banner';
import { Upload, Image, X } from 'lucide-react';
import { Company } from '@shared/schema';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const settingsSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().min(1, 'Address is required'),
  vatNumber: z.string().optional(),
  registrationNumber: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  dateFormat: z.string().min(1, 'Date format is required')
});

type SettingsForm = z.infer<typeof settingsSchema>;

export const Settings = () => {
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { documents: companies, addDocument, updateDocument } = useFirestore('companies');
  const currentCompany = companies?.find((c: Company) => c.uid === currentUser?.uid);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      address: '',
      vatNumber: '',
      registrationNumber: '',
      currency: 'GBP',
      dateFormat: 'DD/MM/YYYY'
    }
  });

  useEffect(() => {
    if (currentCompany) {
      form.reset({
        name: currentCompany.name,
        address: currentCompany.address,
        vatNumber: currentCompany.vatNumber || '',
        registrationNumber: currentCompany.registrationNumber || '',
        currency: currentCompany.currency,
        dateFormat: currentCompany.dateFormat
      });
      setLogoPreview(currentCompany.logo || null);
    }
  }, [currentCompany, form]);

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
    setError(null);

    try {
      // Create a reference to the file location
      const fileRef = ref(storage, `logos/${currentUser.uid}/${logoFile.name}`);
      
      // Upload the file
      await uploadBytes(fileRef, logoFile);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update company record with logo URL
      const companyData: Partial<Company> = {
        logo: downloadURL
      };

      if (currentCompany) {
        await updateDocument(currentCompany.id, companyData);
      } else {
        // If no company exists, create one with current form data
        const formData = form.getValues();
        await addDocument({
          uid: currentUser.uid,
          name: formData.name || 'My Company',
          address: formData.address || '',
          vatNumber: formData.vatNumber,
          registrationNumber: formData.registrationNumber,
          currency: formData.currency,
          dateFormat: formData.dateFormat,
          logo: downloadURL
        });
      }

      setSuccess('Logo uploaded successfully!');
      setLogoFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!currentCompany?.logo || !currentUser) return;

    setLogoUploading(true);
    setError(null);

    try {
      // Delete from storage
      const logoRef = ref(storage, currentCompany.logo);
      await deleteObject(logoRef);
      
      // Update company record
      await updateDocument(currentCompany.id, { logo: null });
      
      setLogoPreview(null);
      setSuccess('Logo removed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    if (!currentUser) return;
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const companyData: Partial<Company> = {
        uid: currentUser.uid,
        name: data.name,
        address: data.address,
        vatNumber: data.vatNumber,
        registrationNumber: data.registrationNumber,
        currency: data.currency,
        dateFormat: data.dateFormat
      };

      if (currentCompany) {
        await updateDocument(currentCompany.id, companyData);
      } else {
        await addDocument(companyData);
      }

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
                    name="name"
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
                    name="address"
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
                      name="vatNumber"
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
                      name="registrationNumber"
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
