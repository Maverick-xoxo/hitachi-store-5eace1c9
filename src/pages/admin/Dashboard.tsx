import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag, Users, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: stats } = useQuery({
    queryKey: ['admin-stats', selectedDate],
    queryFn: async () => {
      const monthStart = startOfMonth(selectedDate).toISOString();
      const monthEnd = endOfMonth(selectedDate).toISOString();
      
      const [ordersRes, productsRes, pendingRes] = await Promise.all([
        supabase.from('orders')
          .select('total_amount')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('orders')
          .select('id', { count: 'exact' })
          .in('status', ['pending', 'payment_uploaded'])
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
      ]);

      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;
      
      return {
        totalOrders: ordersRes.data?.length ?? 0,
        totalProducts: productsRes.count ?? 0,
        pendingOrders: pendingRes.count ?? 0,
        totalRevenue,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Overview of your company store</p>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders This Month</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending This Month</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingOrders ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts ?? 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
              <span className="text-xs font-medium text-muted-foreground">LKR</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {stats?.totalRevenue?.toFixed(2) ?? '0.00'}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
