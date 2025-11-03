import { Upload, Plus, Edit, Trash2, RefreshCw, ArrowUpDown, Link2, UserPlus, Search, User, MapPin, Phone, Mail, Calendar, Euro } from 'lucide-react';
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
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

type SortField = 'name' | 'created_at' | 'total_spent' | 'total_orders' | 'email';
type SortDirection = 'asc' | 'desc';

export const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [createLoginDialogOpen, setCreateLoginDialogOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [creatingLogin, setCreatingLogin] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'DE',
      customer_number: '',
      vat_number: '',
      is_business: false,
      notes: '',
    },
  });

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

  const openEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      country: customer.country || 'DE',
      customer_number: customer.customer_number || '',
      vat_number: customer.vat_number || '',
      is_business: customer.is_business || false,
      notes: customer.notes || '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCustomer = async (values: any) => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update(values)
        .eq('id', editingCustomer.id);

      if (error) throw error;

      toast.success('Kunde erfolgreich aktualisiert');
      setEditDialogOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Fehler beim Aktualisieren des Kunden');
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

  // Filter by search query
  const filteredCustomers = sortedCustomers.filter(customer => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query) ||
      customer.postal_code?.toLowerCase().includes(query) ||
      customer.customer_number?.toLowerCase().includes(query)
    );
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Kunden ({filteredCustomers.length})</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Klicken Sie auf die Spaltenüberschriften zum Sortieren
                </p>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nach Name, Email, Stadt suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-md border">
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
                  {filteredCustomers.map((customer) => (
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/${customer.id}`);
                            }}
                            title="Kunde bearbeiten"
                          >
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
            <div className="lg:hidden space-y-4">
              {filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id}
                  className="cursor-pointer hover:bg-muted/50 transition-all"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl font-bold text-foreground">{customer.name}</CardTitle>
                        {customer.contact_person && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{customer.contact_person}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Seit {new Date(customer.created_at).toLocaleDateString('de-DE')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
                          <Euro className="h-5 w-5" />
                          <span>{formatCurrency(customer.total_spent || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Adresse */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      {customer.address || customer.postal_code || customer.city ? (
                        <div className="flex-1">
                          <span className="font-medium">
                            {[customer.address, [customer.postal_code, customer.city].filter(Boolean).join(' ')]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* Telefon */}
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{customer.phone || '-'}</span>
                    </div>

                    {/* E-Mail */}
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate">{customer.email || 'Keine E-Mail'}</span>
                    </div>

                    {customer.parent && (
                      <div className="text-sm pt-2 border-t">
                        <p className="text-muted-foreground mb-1">Gehört zu</p>
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

                    <div className="flex gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${customer.id}`);
                        }}
                      >
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kunde bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Kundendaten für "{editingCustomer?.name}".
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateCustomer)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Firmenname oder Name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="kunde@beispiel.de" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+49 123 456789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Straße und Hausnummer" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stadt</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Berlin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DE" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kundennummer</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="K-12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vat_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>USt-IdNr.</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DE123456789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Zusätzliche Informationen..." rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  Speichern
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
