import { useState } from 'react';
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, isSameMonth } from 'date-fns';
import { Upload, Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const statusConfig = {
  pending: { label: 'Pending Payment', icon: Clock, variant: 'secondary' as const },
  payment_uploaded: { label: 'Payment Uploaded', icon: Upload, variant: 'default' as const },
  confirmed: { label: 'Confirmed', icon: CheckCircle, variant: 'default' as const },
  shipped: { label: 'Shipped', icon: Truck, variant: 'default' as const },
  delivered: { label: 'Delivered', icon: Package, variant: 'default' as const },
  cancelled: { label: 'Cancelled', icon: XCircle, variant: 'destructive' as const },
};

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ orderId, file }: { orderId: string; file: File }) => {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user!.id}/${orderId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          receipt_url: filePath,
          status: 'payment_uploaded' as const
        })
        .eq('id', orderId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: 'Receipt uploaded successfully!' });
      setUploadingOrderId(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message,
      });
    },
  });

  const handleFileUpload = (orderId: string, file: File) => {
    uploadReceiptMutation.mutate({ orderId, file });
  };

  // Group orders by month
  const ordersByMonth = useMemo(() => {
    if (!orders) return [];
    
    const groups = new Map<string, typeof orders>();
    
    orders.forEach(order => {
      const monthKey = format(startOfMonth(new Date(order.created_at)), 'MMMM yyyy');
      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(order);
    });
    
    // Convert to array and sort by date descending
    return Array.from(groups.entries()).sort((a, b) => {
      const dateA = new Date(a[1][0].created_at);
      const dateB = new Date(b[1][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Orders</h1>

        {ordersByMonth && ordersByMonth.length > 0 ? (
          <div className="space-y-4">
            {ordersByMonth.map(([monthKey, monthOrders]) => (
              <div key={monthKey} className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground border-b pb-2">
                  {monthKey}
                </h2>
                {monthOrders.map((order) => {
                  const status = statusConfig[order.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;
                  
                  return (
                    <Card key={order.id}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Order #{order.id.slice(0, 8)}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), 'PPP')}
                            </p>
                          </div>
                          <Badge variant={status.variant} className="w-fit">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>
                                {item.product_name} x{item.quantity}
                                {item.color && ` (${item.color})`}
                                {item.size && ` - ${item.size}`}
                              </span>
                              <span className="font-medium">
                                Rs. {(Number(item.unit_price) * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          <div className="border-t pt-2 flex justify-between font-bold">
                            <span>Total</span>
                            <span>Rs. {Number(order.total_amount).toFixed(2)}</span>
                          </div>

                          {order.admin_notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>Note:</strong> {order.admin_notes}
                            </div>
                          )}

                          {order.status === 'pending' && (
                            <Dialog open={uploadingOrderId === order.id} onOpenChange={(open) => setUploadingOrderId(open ? order.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="mt-2">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Payment Receipt
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-background">
                                <DialogHeader>
                                  <DialogTitle>Upload Payment Receipt</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    Please upload a photo or PDF of your payment receipt.
                                  </p>
                                  <Input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleFileUpload(order.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                  {uploadReceiptMutation.isPending && (
                                    <p className="text-sm text-muted-foreground">Uploading...</p>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}

                          {order.receipt_url && (
                            <p className="text-sm text-muted-foreground mt-2">
                              ✓ Receipt uploaded
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground">
              Start shopping to see your orders here.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
