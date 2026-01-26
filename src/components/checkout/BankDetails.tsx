import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface BankDetailsData {
  account_name: string;
  account_number: string;
  bank_name: string;
  branch: string;
  swift_code?: string;
}

export function BankDetails() {
  const { data: bankDetails, isLoading } = useQuery({
    queryKey: ['bank-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'bank_details')
        .maybeSingle();

      if (error) throw error;
      return data?.value as unknown as BankDetailsData | null;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!bankDetails) return null;

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-1">
          <span className="text-muted-foreground">Bank:</span>
          <span className="font-medium">{bankDetails.bank_name}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <span className="text-muted-foreground">Branch:</span>
          <span className="font-medium">{bankDetails.branch}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <span className="text-muted-foreground">Account Name:</span>
          <span className="font-medium">{bankDetails.account_name}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <span className="text-muted-foreground">Account No:</span>
          <span className="font-medium font-mono">{bankDetails.account_number}</span>
        </div>
        {bankDetails.swift_code && (
          <div className="grid grid-cols-2 gap-1">
            <span className="text-muted-foreground">SWIFT Code:</span>
            <span className="font-medium font-mono">{bankDetails.swift_code}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
