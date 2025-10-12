import { Upload, Plus, Edit, Trash2, RefreshCw, ArrowUpDown, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type SortField = 'name' | 'created_at' | 'total_spent' | 'total_orders' | 'email';
type SortDirection = 'asc' | 'desc';

export const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          parent:parent_customer_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCustomer = async () => {
    if (!selectedCustomer || !selectedParentId) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .update({ parent_customer_id: selectedParentId })
        .eq('id', selectedCustomer.id);

      if (error) throw error;
      
      toast.success('Kunde erfolgreich verknüpft');
      setLinkDialogOpen(false);
      setSelectedCustomer(null);
      setSelectedParentId('');
      loadCustomers();
    } catch (error) {
      console.error('Error linking customer:', error);
      toast.error('Fehler beim Verknüpfen des Kunden');
    }
  };

  const handleUnlinkCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ parent_customer_id: null })
        .eq('id', customerId);

      if (error) throw error;
      
      toast.success('Verknüpfung erfolgreich entfernt');
      loadCustomers();
    } catch (error) {
      console.error('Error unlinking customer:', error);
      toast.error('Fehler beim Entfernen der Verknüpfung');
    }
  };

  const openLinkDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setSelectedParentId('');
    setLinkDialogOpen(true);
  };

  const availableParents = customers.filter(c => 
    c.id !== selectedCustomer?.id && 
    c.parent_customer_id !== selectedCustomer?.id
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    // Convert to numbers for numeric fields
    if (sortField === 'total_spent' || sortField === 'total_orders') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    }

    // Convert to dates for date fields
    if (sortField === 'created_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // String comparison for text fields
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground transition-colors"
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Kundenverwaltung</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre Kundendaten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCustomers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aktualisieren
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">Laden...</div>
      ) : customers.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">Keine Kunden gefunden</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Kunden ({customers.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Klicken Sie auf die Spaltenüberschriften zum Sortieren
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortButton field="name">Kundenname</SortButton>
                    </TableHead>
                    <TableHead>
                      <SortButton field="email">E-Mail</SortButton>
                    </TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Gehört zu</TableHead>
                    <TableHead>
                      <SortButton field="created_at">Eintrittsdatum</SortButton>
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton field="total_orders">Bestellungen</SortButton>
                    </TableHead>
                    <TableHead className="text-right">
                      <SortButton field="total_spent">Gesamtumsatz</SortButton>
                    </TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="font-medium text-primary hover:underline">
                        {customer.name}
                      </TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        {customer.address || customer.postal_code || customer.city ? (
                          <div className="text-sm">
                            {customer.address && <div>{customer.address}</div>}
                            <div className={customer.address ? 'text-muted-foreground' : ''}>
                              {[customer.postal_code, customer.city].filter(Boolean).join(' ') || '-'}
                            </div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {customer.parent ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-primary font-medium">
                              {customer.parent.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlinkCustomer(customer.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.total_orders || 0}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(customer.total_spent || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLinkDialog(customer);
                            }}
                            title="Kunde verknüpfen"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde verknüpfen</DialogTitle>
            <DialogDescription>
              Wählen Sie den Hauptkunden aus, zu dem "{selectedCustomer?.name}" gehören soll.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
              <SelectTrigger>
                <SelectValue placeholder="Hauptkunden auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableParents.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleLinkCustomer} disabled={!selectedParentId}>
              Verknüpfen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
