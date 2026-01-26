import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

interface BankDetailsData {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch: string;
  swift_code: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<BankDetailsData>({
    account_name: '',
    account_number: '',
    bank_name: '',
    branch: '',
    swift_code: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['bank-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('key', 'bank_details')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings?.value) {
      const bankDetails = settings.value as unknown as BankDetailsData;
      setFormData({
        account_name: bankDetails.account_name || '',
        account_number: bankDetails.account_number || '',
        bank_name: bankDetails.bank_name || '',
        branch: bankDetails.branch || '',
        swift_code: bankDetails.swift_code || '',
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: BankDetailsData) => {
      if (settings) {
        // Update existing
        const { error } = await supabase
          .from('store_settings')
          .update({ value: JSON.parse(JSON.stringify(data)) })
          .eq('key', 'bank_details');
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('store_settings')
          .insert([{ key: 'bank_details', value: JSON.parse(JSON.stringify(data)) }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-details'] });
      toast({
        title: 'Settings saved',
        description: 'Bank details have been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save',
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleChange = (field: keyof BankDetailsData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage store settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>
              These details will be displayed to customers at checkout for payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange('bank_name')}
                    placeholder="e.g., Commercial Bank"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    value={formData.branch}
                    onChange={handleChange('branch')}
                    placeholder="e.g., Colombo Main Branch"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={formData.account_name}
                  onChange={handleChange('account_name')}
                  placeholder="e.g., Company Store Account"
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={handleChange('account_number')}
                    placeholder="e.g., 1234567890"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swift_code">SWIFT Code (Optional)</Label>
                  <Input
                    id="swift_code"
                    value={formData.swift_code}
                    onChange={handleChange('swift_code')}
                    placeholder="e.g., CABORXXXX"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" disabled={saveMutation.isPending || isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
