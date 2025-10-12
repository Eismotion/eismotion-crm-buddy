import { Settings, Plus, Edit, Download, Palette, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name),
          template:invoice_templates(name)
        `)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByYear = (year: string) => {
    return invoices.filter(inv => {
      const invoiceYear = new Date(inv.invoice_date).getFullYear().toString();
      return invoiceYear === year;
    });
  };

  const years = ['2023', '2024', '2025'];
  const invoicesByYear = {
    '2023': filterByYear('2023'),
    '2024': filterByYear('2024'),
    '2025': filterByYear('2025'),
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bezahlt': return 'bg-status-paid text-white';
      case 'gesendet': return 'bg-status-sent text-white';
      case 'überfällig': return 'bg-status-overdue text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rechnungsverwaltung</h2>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Rechnungen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button variant="outline">
            <Palette className="h-4 w-4 mr-2" />
            Design-Studio
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neue Rechnung
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">Laden...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rechnungen nach Jahr</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedYear} onValueChange={setSelectedYear}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                {years.map(year => (
                  <TabsTrigger key={year} value={year}>
                    {year} ({invoicesByYear[year as keyof typeof invoicesByYear].length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {years.map(year => (
                <TabsContent key={year} value={year}>
                  {invoicesByYear[year as keyof typeof invoicesByYear].length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      Keine Rechnungen für {year} gefunden
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rechnungsnr.</TableHead>
                            <TableHead>Kunde</TableHead>
                            <TableHead>Datum</TableHead>
                            <TableHead>Fällig</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Design</TableHead>
                            <TableHead className="text-right">Betrag</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoicesByYear[year as keyof typeof invoicesByYear].map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                              <TableCell>{invoice.customer?.name || 'N/A'}</TableCell>
                              <TableCell>
                                {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                              </TableCell>
                              <TableCell>
                                {invoice.due_date 
                                  ? new Date(invoice.due_date).toLocaleDateString('de-DE')
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(invoice.status)}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {invoice.template ? (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Palette className="h-3 w-3 text-primary" />
                                    {invoice.template.name}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Standard</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                {formatCurrency(invoice.total_amount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
