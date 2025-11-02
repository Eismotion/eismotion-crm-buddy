import { Euro, Users, FileText, Snowflake, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalInvoices: 0, overdueInvoices: 0, totalRevenue: 0 });
  const [topProduct, setTopProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [customersRes, invoicesRes, statsRes, topProductRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('invoices').select('*, customer:customers(name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('dashboard_stats').select('*').single(),
        supabase.from('top_products').select('*').order('total_revenue', { ascending: false }).limit(1).single()
      ]);

      if (customersRes.data) setCustomers(customersRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (statsRes.data) {
        setStats({
          totalInvoices: Number(statsRes.data.total_invoices) || 0,
          overdueInvoices: Number(statsRes.data.overdue_invoices) || 0,
          totalRevenue: Number(statsRes.data.total_revenue) || 0
        });
      }
      if (topProductRes.data) setTopProduct(topProductRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCustomers = customers.length;

  const topCustomers = [...customers]
    .sort((a, b) => (b.total_spent || 0) - (a.total_spent || 0))
    .slice(0, 3);

  const recentInvoices = invoices.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bezahlt': return 'bg-status-paid text-white';
      case 'gesendet': return 'bg-status-sent text-white';
      case 'überfällig': return 'bg-status-overdue text-white';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Übersicht über Ihr Eismotion CRM</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtumsatz
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-status-paid mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% vs. letzter Monat
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kunden
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +8 neue diese Woche
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rechnungen
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <p className="text-xs text-destructive mt-1">
              {stats.overdueInvoices} überfällig
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bestes Produkt
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{topProduct?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topProduct ? formatCurrency(topProduct.total_revenue) : 'Keine Daten'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Beste Kunden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCustomers.map((customer) => (
                <div 
                  key={customer.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <div>
                    <p className="font-medium text-primary">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.city || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(customer.total_spent || 0)}</p>
                    <p className="text-sm text-muted-foreground">{customer.total_orders || 0} Bestellungen</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Rechnungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => invoice.customer_id && navigate(`/customers/${invoice.customer_id}`)}
                >
                  <div>
                    <p className="font-medium text-primary">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer?.name || 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{formatCurrency(invoice.total_amount)}</p>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
