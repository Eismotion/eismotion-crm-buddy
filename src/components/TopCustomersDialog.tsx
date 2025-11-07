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
      // Hole alle nicht-stornierten Rechnungen mit Kundendaten
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('customer_id, total_amount, invoice_date, customers(name, address, city, postal_code)')
        .neq('status', 'storniert')
        .neq('status', 'cancelled');

      if (error) throw error;
      if (!invoices) return;

      // Gruppiere nach Kunde
      const customerMap = new Map<string, {
        key: string;
        id: string | null;
        name: string;
        location: string;
        orderCount: number;
        totalRevenue: number;
        lastOrder: Date;
      }>();

      invoices.forEach((inv: any) => {
        const name = inv.customers?.name || 'Unbekannt';
        const address = inv.customers?.address || '';
        const postal = inv.customers?.postal_code || extractPostalCode(address) || '';
        const location = extractLocation(address) || inv.customers?.city || 'Unbekannt';

        // Eindeutiger Key: Name + PLZ (wenn vorhanden), sonst Name + Adresse
        const key = postal ? `${name}|${postal}` : `${name}|${address}`;

        const revenue = Number(inv.total_amount || 0);
        const invoiceDate = inv.invoice_date ? new Date(inv.invoice_date) : new Date();

        const existing = customerMap.get(key);
        if (existing) {
          existing.totalRevenue += revenue;
          existing.orderCount++;
          if (invoiceDate > existing.lastOrder) {
            existing.lastOrder = invoiceDate;
          }
          existing.id = inv.customer_id || existing.id;
        } else {
          customerMap.set(key, {
            key,
            id: inv.customer_id || null,
            name,
            location,
            orderCount: 1,
            totalRevenue: revenue,
            lastOrder: invoiceDate
          });
        }
      });

      // Konvertiere zu Array und sortiere
      let sorted = Array.from(customerMap.values());
      
      if (sortBy === 'revenue') {
        sorted.sort((a, b) => b.totalRevenue - a.totalRevenue);
      } else {
        sorted.sort((a, b) => b.orderCount - a.orderCount);
      }

      // Top 50 + Rang hinzufügen
      const top50 = sorted.slice(0, 50).map((customer, index) => ({
        rank: index + 1,
        id: customer.id,
        name: customer.name,
        location: customer.location,
        orderCount: customer.orderCount,
        totalRevenue: customer.totalRevenue,
        averageOrder: customer.totalRevenue / customer.orderCount,
        lastOrder: customer.lastOrder.toISOString()
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
