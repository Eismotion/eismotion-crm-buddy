import { Upload, Plus, Edit, Trash2, RefreshCw, ArrowUpDown, Link2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [createLoginDialogOpen, setCreateLoginDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [creatingLogin, setCreatingLogin] = useState(false);

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

  const openCreateLoginDialog = (customer: any) => {
    setSelectedCustomer(customer);
    setLoginEmail(customer.email || '');
    setLoginPassword('');
    setCreateLoginDialogOpen(true);
  };

  const handleCreateLogin = async () => {
    if (!selectedCustomer || !loginEmail || !loginPassword) {
      toast.error('Bitte E-Mail und Passwort eingeben');
      return;
    }

    setCreatingLogin(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sie müssen angemeldet sein');
        return;
      }

      const response = await supabase.functions.invoke('create-customer-account', {
        body: {
          customerId: selectedCustomer.id,
          email: loginEmail,
          password: loginPassword,
          fullName: selectedCustomer.name
        }
      });

      if (response.error) throw response.error;

      toast.success('Kunden-Login erfolgreich erstellt');
      setCreateLoginDialogOpen(false);
      setSelectedCustomer(null);
      setLoginEmail('');
      setLoginPassword('');
      loadCustomers();
    } catch (error: any) {
      console.error('Error creating login:', error);
      toast.error(error.message || 'Fehler beim Erstellen des Logins');
    } finally {
      setCreatingLogin(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Kundenverwaltung</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre Kundendaten</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadCustomers} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </Button>
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Neuer Kunde</span>
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
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
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
                              openCreateLoginDialog(customer);
                            }}
                            title="Kunden-Login erstellen"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {sortedCustomers.map((customer) => (
                <Card 
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-primary">{customer.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{customer.email || 'Keine E-Mail'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Telefon</p>
                        <p className="font-medium">{customer.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bestellungen</p>
                        <p className="font-medium">{customer.total_orders || 0}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Adresse</p>
                      {customer.address || customer.postal_code || customer.city ? (
                        <div>
                          {customer.address && <p className="font-medium">{customer.address}</p>}
                          <p className="font-medium">
                            {[customer.postal_code, customer.city].filter(Boolean).join(' ') || '-'}
                          </p>
                        </div>
                      ) : (
                        <p className="font-medium">-</p>
                      )}
                    </div>
                    {customer.parent && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Gehört zu</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-primary">{customer.parent.name}</span>
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
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Beigetreten</p>
                        <p className="font-medium">{new Date(customer.created_at).toLocaleDateString('de-DE')}</p>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(customer.total_spent || 0)}</p>
                    </div>
                    <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLinkDialog(customer);
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        Verknüpfen
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

      <Dialog open={createLoginDialogOpen} onOpenChange={setCreateLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunden-Login erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein Login für "{selectedCustomer?.name}", damit dieser Kunde seine Rechnungen im Portal einsehen kann.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-Mail</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="kunde@beispiel.de"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Passwort</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Mindestens 6 Zeichen"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateLoginDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateLogin} 
              disabled={!loginEmail || !loginPassword || loginPassword.length < 6 || creatingLogin}
            >
              {creatingLogin ? 'Wird erstellt...' : 'Login erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
