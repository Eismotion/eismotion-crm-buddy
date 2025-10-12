import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, LogOut, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/data/mockData';
import { toast } from 'sonner';
import { User, Session } from '@supabase/supabase-js';

export default function CustomerPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate('/auth');
      } else {
        loadData();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, customer:customer_id(*)')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);
      setCustomer(profileData.customer);

      // Load invoices if customer is linked
      if (profileData.customer_id) {
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            *,
            customer:customer_id(name, email),
            template:template_id(name)
          `)
          .eq('customer_id', profileData.customer_id)
          .order('invoice_date', { ascending: false });

        if (invoicesError) throw invoicesError;
        setInvoices(invoicesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Erfolgreich abgemeldet');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Fehler beim Abmelden');
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    toast.info('Download wird vorbereitet...');
    // This will be implemented with the PDF generation
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bezahlt':
        return 'bg-green-500';
      case 'offen':
        return 'bg-yellow-500';
      case 'überfällig':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Laden...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kundenportal</h1>
            <p className="text-muted-foreground">
              Willkommen, {profile?.full_name || user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aktualisieren
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Customer Info */}
        {customer && (
          <Card>
            <CardHeader>
              <CardTitle>Ihre Kundendaten</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">E-Mail</p>
                <p className="font-medium">{customer.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{customer.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">
                  {customer.address || '-'}<br />
                  {customer.postal_code && customer.city && 
                    `${customer.postal_code} ${customer.city}`
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
                <p className="font-medium text-primary text-lg">
                  {formatCurrency(customer.total_spent || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Anzahl Rechnungen</p>
                <p className="font-medium text-lg">{customer.total_orders || 0}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>Ihre Rechnungen ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {!customer?.id ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Ihr Konto ist noch keinem Kunden zugeordnet.</p>
                <p className="text-sm mt-2">
                  Bitte kontaktieren Sie uns, um Ihr Konto zu verknüpfen.
                </p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Keine Rechnungen gefunden
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rechnungsnummer</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Fällig am</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoice_number}
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
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}