import { Download, Euro, Users, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockInvoices, mockProducts, mockCustomers, formatCurrency } from '@/data/mockData';

export const Analytics = () => {
  const totalRevenue = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const openInvoices = mockInvoices.filter(inv => inv.status !== 'bezahlt').length;
  const overdueInvoices = mockInvoices.filter(inv => inv.status === 'überfällig');
  const avgInvoiceValue = totalRevenue / mockInvoices.length;

  const monthlyRevenue = [
    { month: 'Januar', amount: 245.50 },
    { month: 'Februar', amount: 312.30 },
    { month: 'März', amount: 189.75 },
    { month: 'April', amount: 423.60 },
    { month: 'Mai', amount: 356.80 },
    { month: 'Juni', amount: 467.20 },
  ];

  const topProducts = [
    { name: 'Vanilleeis - 2 Kugeln', sales: 145, revenue: 652.50 },
    { name: 'Schokoladeneis - 2 Kugeln', sales: 132, revenue: 594.00 },
    { name: 'Eiskaffee', sales: 89, revenue: 462.80 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analysen & Berichte</h2>
          <p className="text-muted-foreground">Detaillierte Übersicht Ihrer Geschäftsdaten</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Bericht exportieren
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtumsatz
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
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
            <div className="text-2xl font-bold">{mockCustomers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
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
            <div className="text-2xl font-bold">{mockInvoices.length}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{openInvoices} offen</Badge>
              <Badge className="text-xs bg-status-overdue text-white">
                {overdueInvoices.length} überfällig
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ø Rechnungswert
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgInvoiceValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Durchschnitt pro Rechnung
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Umsatzentwicklung</CardTitle>
            <p className="text-sm text-muted-foreground">Letzte 6 Monate</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyRevenue.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{data.month}</span>
                  <span className="text-sm font-bold">{formatCurrency(data.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Produkte</CardTitle>
            <p className="text-sm text-muted-foreground">Bestseller nach Umsatz</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm font-bold text-primary">
                      {formatCurrency(product.revenue)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.sales} Verkäufe
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices Warning */}
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
                <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.number} - {invoice.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      Fällig seit: {new Date(invoice.date).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <p className="font-bold text-destructive">{formatCurrency(invoice.amount)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
