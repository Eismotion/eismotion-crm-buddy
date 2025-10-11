import { Settings, Plus, Edit, Download, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockInvoices, formatCurrency, mockTemplates } from '@/data/mockData';

export const InvoiceManagement = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bezahlt': return 'bg-status-paid text-white';
      case 'gesendet': return 'bg-status-sent text-white';
      case 'überfällig': return 'bg-status-overdue text-white';
      default: return 'bg-muted';
    }
  };

  // Mock design mapping for invoices
  const invoiceDesigns = [
    { invoiceId: 1, design: 'Winter Wonderland' },
    { invoiceId: 2, design: 'Sommer Vibes' },
    { invoiceId: 3, design: 'Business Elegant' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rechnungsverwaltung</h2>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Rechnungen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Palette className="h-4 w-4 mr-2" />
            Design-Studio
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Vorlagen verwalten
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Rechnung
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockInvoices.map((invoice, idx) => {
          const design = invoiceDesigns.find(d => d.invoiceId === invoice.id);
          
          return (
            <Card key={invoice.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{invoice.number}</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Design Preview */}
                {design && (
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground mb-1">Design-Vorlage</p>
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{design.design}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-muted-foreground">Kunde</p>
                  <p className="text-sm font-medium">{invoice.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Datum</p>
                  <p className="text-sm font-medium">
                    {new Date(invoice.date).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Betrag</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
