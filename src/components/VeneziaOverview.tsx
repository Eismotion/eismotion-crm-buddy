import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Euro, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface VeneziaCustomer {
  id: string;
  name: string;
  address: string;
  postal_code: string;
  city: string;
  total_orders: number;
  total_spent: number;
}

export const VeneziaOverview = () => {
  const [customers, setCustomers] = useState<VeneziaCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVeneziaCustomers();
  }, []);

  const loadVeneziaCustomers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, address, postal_code, city, total_orders, total_spent')
        .ilike('name', '%venezia%')
        .order('total_spent', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading Venezia customers:', error);
      toast.error('Fehler beim Laden der Venezia-Kunden');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
  const totalInvoices = customers.reduce((sum, c) => sum + c.total_orders, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Eiscafe Venezia Übersicht</h1>
        <p className="text-muted-foreground mt-2">
          Alle Venezia-Standorte und ihre Umsätze
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Standorte gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{customers.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rechnungen gesamt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{totalInvoices}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtumsatz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Venezia-Standorte</CardTitle>
          <CardDescription>
            Sortiert nach Umsatz (höchste zuerst)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead className="text-right">Rechnungen</TableHead>
                  <TableHead className="text-right">Umsatz</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{customer.name}</span>
                        {customer.postal_code && customer.city && (
                          <span className="text-xs text-muted-foreground">
                            {customer.postal_code} {customer.city}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{customer.address || 'Keine Adresse'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {customer.total_orders}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(customer.total_spent)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
