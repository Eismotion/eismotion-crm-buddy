import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/data/mockData';
import { extractLocation, extractPostalCode } from '@/lib/address-parser';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TopCustomer {
  rank: number;
  id: string | null;
  name: string;
  location: string;
  orderCount: number;
  totalRevenue: number;
  averageOrder: number;
  lastOrder: string;
}

interface TopCustomersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopCustomersDialog({ open, onOpenChange }: TopCustomersDialogProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'revenue' | 'orders'>('revenue');
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTopCustomers();
    }
  }, [open, sortBy]);

  const loadTopCustomers = async () => {
    setLoading(true);
    try {
      // Hole aggregierte Top-Kunden aus der View
      const { data, error } = await supabase
        .from('top_customers')
        .select('*');

      if (error) throw error;

      let rows = (data || []).map((row: any) => ({
        name: row.name || 'Unbekannt',
        address: row.address || '',
        location: extractLocation(row.address || '') || 'Unbekannt',
        orderCount: Number(row.orders || 0),
        totalRevenue: Number(row.revenue || 0),
        averageOrder: Number(row.average || 0),
        lastOrder: row.last_order ? new Date(row.last_order) : null
      }));

      if (sortBy === 'revenue') {
        rows.sort((a, b) => b.totalRevenue - a.totalRevenue);
      } else {
        rows.sort((a, b) => b.orderCount - a.orderCount);
      }

      // Top 50 + Rang hinzufügen
      const top50 = rows.slice(0, 50).map((row, index) => ({
        rank: index + 1,
        id: null,
        name: row.name,
        location: row.location,
        orderCount: row.orderCount,
        totalRevenue: row.totalRevenue,
        averageOrder: row.averageOrder || (row.orderCount ? row.totalRevenue / row.orderCount : 0),
        lastOrder: (row.lastOrder || new Date()).toISOString()
      }));

      setCustomers(top50);
    } catch (error) {
      console.error('Error loading top customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    onOpenChange(false);
    navigate(`/customers/${customerId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Top 50 Kunden</DialogTitle>
          <div className="flex gap-2 mt-4">
            <Button 
              variant={sortBy === 'revenue' ? 'default' : 'outline'}
              onClick={() => setSortBy('revenue')}
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Nach Umsatz
            </Button>
            <Button 
              variant={sortBy === 'orders' ? 'default' : 'outline'}
              onClick={() => setSortBy('orders')}
              size="sm"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Nach Bestellungen
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead className="text-right">Bestellungen</TableHead>
                  <TableHead className="text-right">Gesamtumsatz</TableHead>
                  <TableHead className="text-right">Ø Bestellung</TableHead>
                  <TableHead>Letzter Kauf</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow 
                    key={customer.rank + '-' + customer.id + '-' + customer.name}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => customer.id && handleCustomerClick(customer.id)}
                  >
                    <TableCell className="text-center font-medium">
                      {customer.rank}
                    </TableCell>
                    <TableCell>
                      <span className="text-primary hover:underline font-medium">
                        {customer.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.location}
                    </TableCell>
                    <TableCell className="text-right">
                      {customer.orderCount}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(customer.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.averageOrder)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.lastOrder), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
