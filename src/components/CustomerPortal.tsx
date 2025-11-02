import { FileText, Download, User, Mail, Phone, MapPin, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CustomerFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  category: string;
  description: string;
  created_at: string;
}

export const CustomerPortal = () => {
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      // Get current user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Nicht angemeldet');
        return;
      }

      // Get profile with customer_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, customer:customers(*)')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.customer_id) {
        toast.error('Kein Kundenprofil gefunden');
        return;
      }

      setCustomer(profile.customer);

      // Load invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('invoice_date', { ascending: false });

      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // Load files
      const { data: filesData, error: filesError } = await supabase
        .from('customer_files')
        .select('*')
        .eq('customer_id', profile.customer_id)
        .order('created_at', { ascending: false });

      if (filesError) throw filesError;
      setFiles(filesData || []);
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = async (file: CustomerFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('customer-files')
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Fehler beim Herunterladen der Datei');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bezahlt': return 'bg-status-paid text-white';
      case 'gesendet': return 'bg-status-sent text-white';
      case 'überfällig': return 'bg-status-overdue text-white';
      default: return 'bg-muted';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Kein Kundenprofil gefunden. Bitte wenden Sie sich an den Support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kundenportal</h1>
              <p className="text-sm text-muted-foreground">Willkommen, {customer.name}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Meine Informationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.email || '-'}</span>
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
                    {customer.address ? (
                      <>
                        <div>{customer.address}</div>
                        {(customer.postal_code || customer.city) && (
                          <div>{customer.postal_code} {customer.city}</div>
                        )}
                        {customer.country && <div>{customer.country}</div>}
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files & Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Meine Dokumente ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Keine Dokumente verfügbar
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dateiname</TableHead>
                        <TableHead>Kategorie</TableHead>
                        <TableHead>Größe</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead className="text-right">Aktion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">{file.file_name}</TableCell>
                          <TableCell>
                            <Badge>{file.category}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatFileSize(file.file_size)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(file.created_at).toLocaleDateString('de-DE')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(file)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {files.map((file) => (
                    <Card key={file.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{file.file_name}</p>
                              <Badge className="mt-1">{file.category}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatFileSize(file.file_size)}</span>
                            <span>{new Date(file.created_at).toLocaleDateString('de-DE')}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleDownloadFile(file)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Herunterladen
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

        {/* Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meine Rechnungen ({invoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                Keine Rechnungen verfügbar
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rechnungsnr.</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead>Fällig</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Betrag</TableHead>
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
                          <TableCell className="text-right font-bold">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
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
                      <CardContent className="space-y-2">
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
