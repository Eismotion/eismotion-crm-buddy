import { Download, Euro, Users, FileText, TrendingUp, AlertTriangle, Heart, Palette, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    openInvoices: 0,
    overdueInvoices: 0,
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [popularDesigns, setPopularDesigns] = useState<any[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [statsRes, revenueRes, productsRes, overdueRes] = await Promise.all([
        supabase.from('dashboard_stats').select('*').single(),
        supabase.from('monthly_revenue').select('*').order('month', { ascending: false }),
        supabase.from('top_products').select('*').order('total_revenue', { ascending: false }).limit(3),
        supabase.from('invoices').select('*, customer:customers(name)').eq('status', 'überfällig')
      ]);

      if (statsRes.data) {
        setStats({
          totalRevenue: Number(statsRes.data.total_revenue) || 0,
          totalCustomers: Number(statsRes.data.total_customers) || 0,
          totalInvoices: Number(statsRes.data.total_invoices) || 0,
          openInvoices: 0,
          overdueInvoices: Number(statsRes.data.overdue_invoices) || 0,
        });
      }

      if (revenueRes.data) {
        const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
        
        // Gruppiere Daten nach Jahr und Monat
        const yearData: { [key: number]: any[] } = {};
        
        revenueRes.data.forEach(r => {
          const date = new Date(r.month);
          const year = date.getFullYear();
          const monthIndex = date.getMonth();
          
          if (!yearData[year]) {
            yearData[year] = monthNames.map((name, index) => ({
              month: name,
              amount: 0,
              monthIndex: index
            }));
          }
          
          yearData[year][monthIndex].amount = Number(r.revenue) || 0;
        });

        setMonthlyRevenue(Object.entries(yearData).map(([year, months]) => ({
          year: Number(year),
          months
        })));
      }

      if (productsRes.data) {
        setTopProducts(
          productsRes.data.map(p => ({
            name: p.name,
            sold: Number(p.total_sold) || 0,
            revenue: Number(p.total_revenue) || 0
          }))
        );
      }

      // Design templates data removed - table no longer exists
      setPopularDesigns([]);

      if (overdueRes.data) {
        setOverdueInvoices(overdueRes.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analysen & Berichte</h2>
          <p className="text-muted-foreground">Detaillierte Einblicke in Ihr Geschäft</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtumsatz
            </CardTitle>
            <div className="flex gap-1">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <TrendingUp className="h-4 w-4 text-status-paid" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-status-paid mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Gesamtumsatz aller Rechnungen
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
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Gesamtanzahl Kunden
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
            <div className="flex gap-2 mt-1">
              <Badge className="bg-status-overdue text-white text-xs">
                {stats.overdueInvoices} überfällig
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Design-Impact
            </CardTitle>
            <Heart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{popularDesigns.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              aktive Design-Vorlagen im Einsatz
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Umsatzentwicklung</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine Daten verfügbar</p>
            ) : (
              <div className="space-y-4">
                {/* Year Tabs */}
                <div className="flex flex-wrap gap-2">
                  {monthlyRevenue.map((yearData) => (
                    <Button
                      key={yearData.year}
                      variant={selectedYear === yearData.year ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedYear(yearData.year)}
                    >
                      {yearData.year}
                    </Button>
                  ))}
                </div>
                
                {/* Monthly Data for Selected Year */}
                <div className="space-y-2">
                  {monthlyRevenue.find(y => y.year === selectedYear)?.months.map((item: any) => (
                    <div key={item.month} className="flex items-center justify-between py-1">
                      <span className="text-sm text-muted-foreground">{item.month}</span>
                      <span className="font-semibold">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produkte</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine Produkt-Daten verfügbar</p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product) => (
                  <div key={product.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{product.name}</span>
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {product.sold}x verkauft
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Designs */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Beliebteste Designs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularDesigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine Design-Daten verfügbar</p>
            ) : (
              <div className="space-y-4">
                {popularDesigns.map((design) => (
                  <div key={design.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{design.name}</span>
                      <Badge variant="secondary">{design.uses} Nutzungen</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="h-3 w-3 fill-primary text-primary" />
                      {design.feedback}% Bewertung
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Überfällige Rechnungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer?.name || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{formatCurrency(invoice.total_amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Fällig seit {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
