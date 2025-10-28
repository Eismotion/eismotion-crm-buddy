import { Settings, Plus, Edit, Download, Palette, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const InvoiceManagement = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        setLoading(false);
        navigate('/auth');
        return;
      }
      loadInvoices();
    });
  }, [navigate]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(name)
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

  const filterBySearch = (invoicesList: any[]) => {
    if (!searchQuery.trim()) return invoicesList;
    
    const query = searchQuery.toLowerCase();
    return invoicesList.filter(inv => {
      const invoiceNumber = inv.invoice_number?.toLowerCase() || '';
      const customerName = inv.customer?.name?.toLowerCase() || '';
      return invoiceNumber.includes(query) || customerName.includes(query);
    });
  };

  const years = ['2023', '2024', '2025'];
  const invoicesByYear = {
    '2023': filterBySearch(filterByYear('2023')),
    '2024': filterBySearch(filterByYear('2024')),
    '2025': filterBySearch(filterByYear('2025')),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rechnungsverwaltung</h2>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Rechnungen</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadInvoices} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/design-studio')} className="flex-1 sm:flex-none">
            <Palette className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Design-Studio</span>
          </Button>
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Neue Rechnung</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">Laden...</div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Rechnungen nach Jahr</CardTitle>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Nach Rechnungsnummer oder Kunde suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
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
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden md:block rounded-md border">
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
                                <TableCell>
                                  {invoice.customer_id ? (
                                    <button
                                      onClick={() => navigate(`/customers/${invoice.customer_id}`)}
                                      className="text-primary hover:underline"
                                    >
                                      {invoice.customer?.name || 'N/A'}
                                    </button>
                                  ) : (
                                    <span>{invoice.customer?.name || 'N/A'}</span>
                                  )}
                                </TableCell>
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
                                  {invoice.template_id ? (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Palette className="h-3 w-3 text-primary" />
                                      Template
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

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {invoicesByYear[year as keyof typeof invoicesByYear].map((invoice) => (
                          <Card key={invoice.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                                  {invoice.customer_id ? (
                                    <button
                                      onClick={() => navigate(`/customers/${invoice.customer_id}`)}
                                      className="text-sm text-primary hover:underline"
                                    >
                                      {invoice.customer?.name || 'N/A'}
                                    </button>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">{invoice.customer?.name || 'N/A'}</p>
                                  )}
                                </div>
                                <Badge className={getStatusColor(invoice.status)}>
                                  {invoice.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Datum</p>
                                  <p className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Fällig</p>
                                  <p className="font-medium">
                                    {invoice.due_date 
                                      ? new Date(invoice.due_date).toLocaleDateString('de-DE')
                                      : '-'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                  {invoice.template_id ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Palette className="h-3 w-3" />
                                      Template
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Standard</span>
                                  )}
                                </div>
                                <p className="text-lg font-bold">{formatCurrency(invoice.total_amount)}</p>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
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
