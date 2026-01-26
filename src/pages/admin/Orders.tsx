import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Eye, Download, CalendarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const statusOptions = [
  { value: 'pending', label: 'Pending Payment' },
  { value: 'payment_uploaded', label: 'Payment Uploaded' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const statusColors: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  payment_uploaded: 'default',
  confirmed: 'default',
  shipped: 'default',
  delivered: 'default',
  cancelled: 'destructive',
};

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', selectedDate],
    queryFn: async () => {
      const monthStart = startOfMonth(selectedDate).toISOString();
      const monthEnd = endOfMonth(selectedDate).toISOString();
      
      // Fetch orders with order_items
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd)
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Fetch all profiles for these orders
      const userIds = [...new Set(ordersData?.map(o => o.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      // Map profiles to orders
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      return ordersData?.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || null
      })) || [];
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.admin_notes = notes;
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: 'Order updated!' });
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleSaveNotes = () => {
    if (selectedOrder) {
      updateOrderMutation.mutate({
        id: selectedOrder.id,
        status: selectedOrder.status,
        notes: adminNotes,
      });
    }
  };

  const getReceiptUrl = async (path: string) => {
    const { data } = await supabase.storage.from('receipts').createSignedUrl(path, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground">Manage customer orders</p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {(order.profiles as any)?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'PP')}
                      </TableCell>
                      <TableCell>Rs. {Number(order.total_amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <Badge variant={statusColors[order.status]}>
                              {statusOptions.find(s => s.value === order.status)?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {order.receipt_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => getReceiptUrl(order.receipt_url)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No receipt</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedOrder(order);
                            setAdminNotes(order.admin_notes || '');
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg bg-background">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>{(selectedOrder.profiles as any)?.full_name || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2 bg-muted p-3 rounded-lg">
                    {selectedOrder.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.product_name} x{item.quantity}
                          {item.color && ` (${item.color})`}
                          {item.size && ` - ${item.size}`}
                        </span>
                        <span>Rs. {(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>Rs. {Number(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes for this order..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={handleSaveNotes}
                    disabled={updateOrderMutation.isPending}
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
