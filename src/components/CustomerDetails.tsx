import { ArrowLeft, Mail, Phone, MapPin, Calendar, Euro, FileText, Download, Edit, UserPlus, MessageSquare, Send, Copy, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CustomerFileUpload } from './CustomerFileUpload';

export const CustomerDetails = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showContactEditDialog, setShowContactEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [contactForm, setContactForm] = useState<any>({});
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [generatedCredentials, setGeneratedCredentials] = useState<{email: string, password: string} | null>(null);

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const [customerRes, invoicesRes] = await Promise.all([
        supabase.from('customers').select('*').eq('id', customerId).single(),
        supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', customerId)
          .order('invoice_date', { ascending: false })
      ]);

      if (customerRes.data) {
        setCustomer(customerRes.data);
        setEditForm(customerRes.data);
        setContactForm(customerRes.data);
      }
      if (invoicesRes.data) {
        setInvoices(invoicesRes.data);
        
        // Load all products from invoice items
        const invoiceIds = invoicesRes.data.map((inv: any) => inv.id);
        if (invoiceIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('invoice_items')
            .select('*')
            .in('invoice_id', invoiceIds);
          
          if (itemsData) {
            // Group products by description and sum quantities
            const productMap = new Map();
            itemsData.forEach((item: any) => {
              const key = item.description;
              if (productMap.has(key)) {
                const existing = productMap.get(key);
                existing.totalQuantity += item.quantity;
                existing.totalRevenue += item.total_price;
              } else {
                productMap.set(key, {
                  description: item.description,
                  totalQuantity: item.quantity,
                  totalRevenue: item.total_price,
                  unit_price: item.unit_price
                });
              }
            });
            setProducts(Array.from(productMap.values()));
          }
        }
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          postal_code: editForm.postal_code,
          country: editForm.country,
          notes: editForm.notes,
        })
        .eq('id', customerId);

      if (error) throw error;
      
      setCustomer(editForm);
      setShowEditDialog(false);
      toast.success('Kundendaten erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Fehler beim Aktualisieren der Kundendaten');
    }
  };

  const handleUpdateContact = async () => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          contact_person: contactForm.contact_person,
          email: contactForm.email,
          phone: contactForm.phone,
          address: contactForm.address,
          city: contactForm.city,
          postal_code: contactForm.postal_code,
          country: contactForm.country,
        })
        .eq('id', customerId);

      if (error) throw error;
      
      setCustomer({ ...customer, ...contactForm });
      setShowContactEditDialog(false);
      toast.success('Kontaktinformationen erfolgreich aktualisiert');
      await loadCustomerData();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Fehler beim Aktualisieren der Kontaktinformationen');
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleCreateLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Bitte E-Mail und Passwort eingeben');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-customer-login', {
        body: {
          customerId: customerId,
          email: loginEmail,
          password: loginPassword,
          name: customer.name
        }
      });

      if (error) throw error;

      toast.success('Login erfolgreich erstellt');
      setShowLoginDialog(false);
      setLoginEmail('');
      setLoginPassword('');
      await loadCustomerData();
    } catch (error) {
      console.error('Error creating login:', error);
      toast.error('Fehler beim Erstellen des Logins');
    }
  };

  const handleGenerateInvite = async () => {
    const email = customer.email || `${customer.name.toLowerCase().replace(/\s+/g, '.')}@beispiel.de`;
    const password = generatePassword();

    try {
      const { error } = await supabase.functions.invoke('create-customer-login', {
        body: {
          customerId: customerId,
          email: email,
          password: password,
          name: customer.name
        }
      });

      if (error) throw error;

      setGeneratedCredentials({ email, password });
      setShowInviteDialog(true);
      toast.success('Login-Zugangsdaten wurden erstellt');
      await loadCustomerData();
    } catch (error) {
      console.error('Error generating invite:', error);
      toast.error('Fehler beim Erstellen der Einladung');
    }
  };

  const handleSendWhatsApp = () => {
    if (!generatedCredentials) return;

    const portalUrl = `${window.location.origin}/customer-portal`;
    const message = `Hallo ${customer.name},\n\nIhr persönlicher Zugang zu unserem Kundenportal wurde erstellt!\n\n🔐 Ihre Zugangsdaten:\nE-Mail: ${generatedCredentials.email}\nPasswort: ${generatedCredentials.password}\n\n🌐 Login-Link:\n${portalUrl}\n\nIm Kundenportal können Sie:\n✅ Ihre Rechnungen einsehen und herunterladen\n✅ Ihre Dokumente verwalten\n✅ Ihre Kontaktdaten aktualisieren\n\nBei Fragen stehen wir Ihnen gerne zur Verfügung!\n\nViele Grüße`;

    const whatsappUrl = `https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyCredentials = () => {
    if (!generatedCredentials) return;

    const portalUrl = `${window.location.origin}/customer-portal`;
    const text = `Kundenportal-Zugang für ${customer.name}\n\nE-Mail: ${generatedCredentials.email}\nPasswort: ${generatedCredentials.password}\n\nLogin-Link: ${portalUrl}`;
    
    navigator.clipboard.writeText(text);
    toast.success('Zugangsdaten in Zwischenablage kopiert');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bezahlt': return 'bg-status-paid text-white';
      case 'gesendet': return 'bg-status-sent text-white';
      case 'überfällig': return 'bg-status-overdue text-white';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-muted-foreground">Kunde nicht gefunden</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">{customer.name}</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Kundennummer: {customer.customer_number || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Button 
            variant="outline" 
            onClick={handleGenerateInvite}
            className="flex-1 sm:flex-none"
          >
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Einladen</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowLoginDialog(true)}
            className="flex-1 sm:flex-none"
          >
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Login</span>
          </Button>
          <Button 
            onClick={() => setShowEditDialog(true)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Bearbeiten</span>
          </Button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamtumsatz
            </CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(customer.total_spent || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bestellungen
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.total_orders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kunde seit
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date(customer.created_at).toLocaleDateString('de-DE')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-status-paid text-white">Aktiv</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Kontaktinformationen</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setContactForm(customer);
              setShowContactEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Bearbeiten
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {customer.contact_person && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Ansprechpartner: </span>
                    <span>{customer.contact_person}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.email || 'Keine E-Mail'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.phone || '-'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Adresse</div>
                  {customer.address ? (
                    <>
                      <div>{customer.address}</div>
                      {(customer.postal_code || customer.city) && (
                        <div>{customer.postal_code} {customer.city}</div>
                      )}
                      {customer.country && <div>{customer.country}</div>}
                    </>
                  ) : (
                    <div className="text-muted-foreground">-</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {customer.notes && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground font-medium mb-1">Notizen</p>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products / Produktbeschreibungen */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produktbeschreibungen ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Gesamt Menge</TableHead>
                    <TableHead className="text-right">Einzelpreis</TableHead>
                    <TableHead className="text-right">Gesamt Umsatz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.description}</TableCell>
                      <TableCell className="text-right">{product.totalQuantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.unit_price)}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(product.totalRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {products.map((product, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{product.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Menge</p>
                          <p className="font-medium">{product.totalQuantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Einzelpreis</p>
                          <p className="font-medium">{formatCurrency(product.unit_price)}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Gesamt Umsatz</p>
                        <p className="text-lg font-bold">{formatCurrency(product.totalRevenue)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Files */}
      <CustomerFileUpload customerId={customerId!} />

      {/* Invoices / Druckdateien */}
      <Card>
        <CardHeader>
          <CardTitle>Rechnungen & Druckdateien ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              Keine Rechnungen für diesen Kunden gefunden
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rechnungsnr.</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Fällig</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Design-Vorlage</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
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
                          {invoice.template?.name || 'Standard'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" title="Rechnung bearbeiten">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="PDF herunterladen">
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
              <div className="lg:hidden space-y-3">
                {invoices.map((invoice) => (
                  <Card key={invoice.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{invoice.invoice_number}</p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(invoice.total_amount)}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Datum</p>
                          <p className="font-medium">
                            {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Fällig</p>
                          <p className="font-medium">
                            {invoice.due_date 
                              ? new Date(invoice.due_date).toLocaleDateString('de-DE')
                              : '-'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Design: {invoice.template?.name || 'Standard'}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
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
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kundendaten bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Kundendaten. Die Änderungen werden sofort gespeichert.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Land</Label>
                <Input
                  id="country"
                  value={editForm.country || ''}
                  onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">PLZ</Label>
                <Input
                  id="postal_code"
                  value={editForm.postal_code || ''}
                  onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateCustomer}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kundenlogin erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen Login-Zugang für {customer?.name}. Der Kunde kann sich dann mit diesen Zugangsdaten anmelden.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-Mail-Adresse *</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="kunde@beispiel.de"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Passwort *</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Mindestens 6 Zeichen"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateLogin}>
              Login erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Edit Dialog */}
      <Dialog open={showContactEditDialog} onOpenChange={setShowContactEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kontaktinformationen bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Kontaktdaten des Kunden.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_person">Ansprechpartner</Label>
              <Input
                id="contact_person"
                value={contactForm.contact_person || ''}
                onChange={(e) => setContactForm({ ...contactForm, contact_person: e.target.value })}
                placeholder="Name des Ansprechpartners"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_email">E-Mail</Label>
              <Input
                id="contact_email"
                type="email"
                value={contactForm.email || ''}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="kunde@beispiel.de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_phone">Telefon</Label>
              <Input
                id="contact_phone"
                value={contactForm.phone || ''}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_address">Straße und Hausnummer</Label>
              <Input
                id="contact_address"
                value={contactForm.address || ''}
                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                placeholder="Musterstraße 123"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact_postal">PLZ</Label>
                <Input
                  id="contact_postal"
                  value={contactForm.postal_code || ''}
                  onChange={(e) => setContactForm({ ...contactForm, postal_code: e.target.value })}
                  placeholder="12345"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact_city">Stadt</Label>
                <Input
                  id="contact_city"
                  value={contactForm.city || ''}
                  onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                  placeholder="Berlin"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_country">Land</Label>
              <Input
                id="contact_country"
                value={contactForm.country || ''}
                onChange={(e) => setContactForm({ ...contactForm, country: e.target.value })}
                placeholder="DE"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateContact}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog with Generated Credentials */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kundeneinladung erstellt</DialogTitle>
            <DialogDescription>
              Die Login-Zugangsdaten wurden erfolgreich erstellt. Senden Sie diese nun an den Kunden.
            </DialogDescription>
          </DialogHeader>
          {generatedCredentials && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Kunde</Label>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">E-Mail</Label>
                  <p className="font-medium font-mono text-sm">{generatedCredentials.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Passwort</Label>
                  <p className="font-medium font-mono text-sm">{generatedCredentials.password}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Portal-Link</Label>
                  <p className="font-medium text-sm break-all">{window.location.origin}/customer-portal</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {customer.phone && (
                  <Button 
                    onClick={handleSendWhatsApp} 
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Per WhatsApp senden
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleCopyCredentials}
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Zugangsdaten kopieren
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                <strong>Wichtig:</strong> Bewahren Sie diese Zugangsdaten sicher auf. Das Passwort kann später nicht mehr angezeigt werden.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowInviteDialog(false);
                setGeneratedCredentials(null);
              }}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
