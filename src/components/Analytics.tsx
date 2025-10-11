import { Download, Euro, Users, FileText, TrendingUp, AlertTriangle, Heart, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockInvoices, mockProducts, mockCustomers, formatCurrency } from '@/data/mockData';

export const Analytics = () => {
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCustomers = mockCustomers.length;
  const totalInvoices = mockInvoices.length;
  const openInvoices = mockInvoices.filter(inv => inv.status === 'gesendet').length;
  const overdueInvoices = mockInvoices.filter(inv => inv.status === 'überfällig');

  const monthlyRevenue = [
    { month: 'Januar', amount: 245.50 },
    { month: 'Februar', amount: 312.80 },
    { month: 'März', amount: 189.30 },
    { month: 'April', amount: 456.90 },
    { month: 'Mai', amount: 523.40 },
    { month: 'Juni', amount: 564.65 }
  ];

  const topProducts = [
    { name: 'Vanilleeis - 2 Kugeln', sold: 156, revenue: 702.00 },
    { name: 'Schokoladeneis - 2 Kugeln', sold: 134, revenue: 603.00 },
    { name: 'Glühwein', sold: 89, revenue: 311.50 }
  ];

  // Mock design analytics
  const popularDesigns = [
    { name: 'Winter Wonderland', uses: 45, feedback: 92 },
    { name: 'Sommer Vibes', uses: 38, feedback: 88 },
    { name: 'Business Elegant', uses: 32, feedback: 85 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analysen & Berichte</h2>
          <p className="text-muted-foreground">Detaillierte Einblicke in Ihr Geschäft</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportieren
        </Button>
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
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-xs text-status-paid mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.5% zum Vormonat
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
            <p className="text-xs text-status-paid mt-1">
              +8 neue diesen Monat
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
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">{openInvoices} offen</Badge>
              <Badge className="bg-status-overdue text-white text-xs">
                {overdueInvoices.length} überfällig
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
            <div className="text-2xl font-bold text-primary">+15%</div>
            <p className="text-xs text-muted-foreground mt-1">
              mehr positive Feedbacks durch kreative Rechnungen
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
            <div className="space-y-3">
              {monthlyRevenue.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month}</span>
                  <span className="font-semibold">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Produkte</CardTitle>
          </CardHeader>
          <CardContent>
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
            <div className="space-y-4">
              {popularDesigns.map((design) => (
                <div key={design.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{design.name}</span>
                    <Badge variant="secondary">{design.uses} Nutzungen</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3 fill-primary text-primary" />
                    {design.feedback}% positive Rückmeldungen
                  </div>
                </div>
              ))}
            </div>
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
                    <p className="font-medium">{invoice.number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">{formatCurrency(invoice.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Fällig seit {new Date(invoice.date).toLocaleDateString('de-DE')}
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
