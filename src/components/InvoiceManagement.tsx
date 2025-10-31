import { Settings, Plus, Edit, Download, Palette, RefreshCw, Search, Upload, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const InvoiceManagement = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [yearCounts, setYearCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadYearCounts();
  }, []);

  // Realtime-Updates: Zählt sofort korrekt nach Änderungen (Import/Update/Delete)
  useEffect(() => {
    const channel = supabase
      .channel('invoices-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => {
          loadInvoices();
          loadYearCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadYearCounts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_invoice_counts_by_year');
      if (error) throw error;
      
      const counts: Record<number, number> = {};
      data?.forEach((row: any) => {
        counts[row.jahr] = row.anzahl;
      });
      setYearCounts(counts);
    } catch (error) {
      console.error('Error loading year counts:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  useEffect(() => {
    if (customerSearch.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = customerSearch.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.customer_number?.toLowerCase().includes(query) ||
        customer.address?.toLowerCase().includes(query) ||
        customer.city?.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearch, customers]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const PAGE_SIZE = 1000;
      let all: any[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            customer:customers(name)
          `)
          .order('invoice_date', { ascending: false })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        all = all.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }

      setInvoices(all);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };
  const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    
    // Get the latest invoice number for current year
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `RE-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching invoice numbers:', error);
      return `RE-${year}-0001`;
    }

    if (!data || data.length === 0) {
      return `RE-${year}-0001`;
    }

    // Extract number from last invoice (e.g., "RE-2025-0042" -> 42)
    const lastNumber = data[0].invoice_number;
    const match = lastNumber.match(/RE-\d{4}-(\d+)/);
    const nextNumber = match ? parseInt(match[1]) + 1 : 1;
    
    // Format with leading zeros (4 digits)
    return `RE-${year}-${nextNumber.toString().padStart(4, '0')}`;
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId) {
      toast.error('Bitte wählen Sie einen Kunden aus');
      return;
    }

    try {
      const invoiceNumber = await generateInvoiceNumber();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          invoice_date: today,
          customer_id: selectedCustomerId,
          status: 'draft',
          subtotal: 0,
          tax_rate: 19.00,
          tax_amount: 0,
          total_amount: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadInvoices();
      await loadYearCounts();
      setShowCreateDialog(false);
      setSelectedCustomerId('');
      setCustomerSearch('');
      toast.success('Rechnung erfolgreich erstellt');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Fehler beim Erstellen der Rechnung');
    }
  };

  const filterByYear = (year: string) => {
    return invoices.filter(inv => {
      // 1) Bevorzugt: gültiges invoice_date verwenden
      if (inv.invoice_date) {
        const d = new Date(inv.invoice_date);
        if (!isNaN(d.getTime()) && d.getFullYear().toString() === year) {
          return true;
        }
      }
      // 2) Fallback: Jahr aus Rechnungsnummer (Form MM/YYYY/…)
      const num: string = inv.invoice_number || '';
      const m = num.match(/^([0-9]{1,2})[.\/-]([0-9]{4})\//);
      if (m) {
        const yr = m[2];
        return yr === year;
      }
      return false;
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

  const years = ['2020', '2021', '2022', '2023', '2024', '2025'];
  const invoicesByYear = {
    '2020': filterBySearch(filterByYear('2020')),
    '2021': filterBySearch(filterByYear('2021')),
    '2022': filterBySearch(filterByYear('2022')),
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
          <Button 
            variant="destructive" 
            onClick={async () => {
              const confirmText = `ACHTUNG: Dies löscht ALLE ${invoices.length} Rechnungen unwiderruflich!\n\nMöchten Sie fortfahren?`;
              if (!confirm(confirmText)) return;
              
              try {
                // Delete all invoice_items first (foreign key constraint)
                const { error: itemsError } = await supabase
                  .from('invoice_items')
                  .delete()
                  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

                if (itemsError) throw itemsError;

                // Delete all invoices
                const { error: invoicesError } = await supabase
                  .from('invoices')
                  .delete()
                  .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

                if (invoicesError) throw invoicesError;

                toast.success('Alle Rechnungen wurden gelöscht');
                await loadInvoices();
                await loadYearCounts();
              } catch (e) {
                console.error(e);
                toast.error('Fehler beim Löschen der Rechnungen');
              }
            }} 
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Alle Rechnungen löschen</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/import')} className="flex-1 sm:flex-none">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Importieren</span>
          </Button>
          <Button variant="outline" onClick={() => navigate('/design-studio')} className="flex-1 sm:flex-none">
            <Palette className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Design-Studio</span>
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={() => setShowCreateDialog(true)}>
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
              <div className="relative mb-4">
                <TabsList className="inline-flex w-auto gap-1 overflow-x-auto scrollbar-hide">
                {years.map(year => (
                  <TabsTrigger 
                    key={year} 
                    value={year}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {year} <span className="ml-1 text-muted-foreground">({yearCounts[parseInt(year)] || 0})</span>
                  </TabsTrigger>
                ))}
                </TabsList>
              </div>

              {years.map(year => (
                <TabsContent key={year} value={year}>
                  {invoicesByYear[year as keyof typeof invoicesByYear].length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      Keine Rechnungen für {year} gefunden
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="hidden lg:block rounded-md border">
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
                      <div className="lg:hidden space-y-4">
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

      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setCustomerSearch('');
          setSelectedCustomerId('');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neue Rechnung erstellen</DialogTitle>
            <DialogDescription>
              Suchen Sie nach einem Kunden. Die vollständige Adresse wird automatisch übernommen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customerSearch">Kunde suchen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="customerSearch"
                  placeholder="Name, Kundennummer, Stadt eingeben..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Customer List */}
            <div className="space-y-2">
              <Label>Ergebnisse ({filteredCustomers.length})</Label>
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                {filteredCustomers.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Keine Kunden gefunden
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                          selectedCustomerId === customer.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                        }`}
                      >
                        <div className="font-medium">{customer.name}</div>
                        {customer.customer_number && (
                          <div className="text-xs text-muted-foreground">
                            Kundennr: {customer.customer_number}
                          </div>
                        )}
                        {customer.address && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {customer.address}, {customer.postal_code} {customer.city}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {selectedCustomerId && customers.find(c => c.id === selectedCustomerId) && (
              <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                <p className="font-medium">Kundenadresse:</p>
                {(() => {
                  const customer = customers.find(c => c.id === selectedCustomerId);
                  return (
                    <>
                      <p>{customer.name}</p>
                      {customer.address && <p>{customer.address}</p>}
                      {(customer.postal_code || customer.city) && (
                        <p>{customer.postal_code} {customer.city}</p>
                      )}
                      {customer.country && <p>{customer.country}</p>}
                    </>
                  );
                })()}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => {
                setShowCreateDialog(false);
                setSelectedCustomerId('');
                setCustomerSearch('');
              }}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateInvoice} disabled={!selectedCustomerId}>
                Rechnung erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
