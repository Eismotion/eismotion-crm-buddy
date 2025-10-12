import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';

type InvoiceType = 'supplier' | 'other';

export default function IncomingInvoices() {
  const queryClient = useQueryClient();
  const [uploadType, setUploadType] = useState<InvoiceType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch incoming invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['incoming-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !uploadType) throw new Error('Datei und Typ sind erforderlich');

      setIsUploading(true);
      
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${uploadType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('incoming-invoices')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Insert metadata
      const { error: dbError } = await supabase
        .from('incoming_invoices')
        .insert({
          invoice_type: uploadType,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          supplier_name: supplierName || null,
          invoice_number: invoiceNumber || null,
          invoice_date: invoiceDate || null,
          amount: amount ? parseFloat(amount) : null,
          notes: notes || null,
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Rechnung erfolgreich hochgeladen');
      queryClient.invalidateQueries({ queryKey: ['incoming-invoices'] });
      resetForm();
      setUploadType(null);
    },
    onError: (error: any) => {
      toast.error(`Upload fehlgeschlagen: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (invoice: any) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('incoming-invoices')
        .remove([invoice.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('incoming_invoices')
        .delete()
        .eq('id', invoice.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Rechnung gelöscht');
      queryClient.invalidateQueries({ queryKey: ['incoming-invoices'] });
    },
    onError: (error: any) => {
      toast.error(`Löschen fehlgeschlagen: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSelectedFile(null);
    setSupplierName('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setAmount('');
    setNotes('');
  };

  const handleDownload = async (invoice: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('incoming-invoices')
        .download(invoice.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = invoice.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(`Download fehlgeschlagen: ${error.message}`);
    }
  };

  const getTypeLabel = (type: InvoiceType) => {
    return type === 'supplier' ? 'Lieferant (Druckerei)' : 'Sonstige';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Eingangsrechnungen</h2>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Eingangsrechnungen für die Buchhaltung
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lieferantenrechnungen</CardTitle>
            <CardDescription>
              Rechnungen von Druckereien (Wir machen Druck, Print.com, Flyeralarm etc.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={uploadType === 'supplier'} onOpenChange={(open) => !open && setUploadType(null)}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => setUploadType('supplier')}>
                  <Upload className="mr-2 h-4 w-4" />
                  Lieferantenrechnung hochladen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Lieferantenrechnung hochladen</DialogTitle>
                  <DialogDescription>
                    Laden Sie eine Rechnung von einem Druckerei-Lieferanten hoch
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="supplier-file">PDF-Datei</Label>
                    <Input
                      id="supplier-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier-name">Lieferant</Label>
                    <Input
                      id="supplier-name"
                      placeholder="z.B. Wir machen Druck"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-number">Rechnungsnummer</Label>
                    <Input
                      id="invoice-number"
                      placeholder="Optional"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="invoice-date">Rechnungsdatum</Label>
                    <Input
                      id="invoice-date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Betrag (EUR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notizen</Label>
                    <Input
                      id="notes"
                      placeholder="Optional"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadType(null)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => uploadMutation.mutate()} 
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sonstige Rechnungen</CardTitle>
            <CardDescription>
              Alle anderen Eingangsrechnungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={uploadType === 'other'} onOpenChange={(open) => !open && setUploadType(null)}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => setUploadType('other')}>
                  <Upload className="mr-2 h-4 w-4" />
                  Sonstige Rechnung hochladen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Sonstige Rechnung hochladen</DialogTitle>
                  <DialogDescription>
                    Laden Sie eine sonstige Eingangsrechnung hoch
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="other-file">PDF-Datei</Label>
                    <Input
                      id="other-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other-supplier">Lieferant/Absender</Label>
                    <Input
                      id="other-supplier"
                      placeholder="Optional"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other-invoice-number">Rechnungsnummer</Label>
                    <Input
                      id="other-invoice-number"
                      placeholder="Optional"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other-invoice-date">Rechnungsdatum</Label>
                    <Input
                      id="other-invoice-date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other-amount">Betrag (EUR)</Label>
                    <Input
                      id="other-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="other-notes">Notizen</Label>
                    <Input
                      id="other-notes"
                      placeholder="Optional"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadType(null)}>
                    Abbrechen
                  </Button>
                  <Button 
                    onClick={() => uploadMutation.mutate()} 
                    disabled={!selectedFile || isUploading}
                  >
                    {isUploading ? 'Wird hochgeladen...' : 'Hochladen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hochgeladene Rechnungen</CardTitle>
          <CardDescription>
            Übersicht aller hochgeladenen Eingangsrechnungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Lädt...</p>
          ) : !invoices || invoices.length === 0 ? (
            <p className="text-muted-foreground">Noch keine Rechnungen hochgeladen</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Dateiname</TableHead>
                  <TableHead>Lieferant</TableHead>
                  <TableHead>Rechnungs-Nr.</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Betrag</TableHead>
                  <TableHead>Hochgeladen am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        invoice.invoice_type === 'supplier' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        {getTypeLabel(invoice.invoice_type)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {invoice.file_name}
                      </div>
                    </TableCell>
                    <TableCell>{invoice.supplier_name || '-'}</TableCell>
                    <TableCell>{invoice.invoice_number || '-'}</TableCell>
                    <TableCell>
                      {invoice.invoice_date 
                        ? format(new Date(invoice.invoice_date), 'dd.MM.yyyy') 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {invoice.amount 
                        ? `${invoice.amount.toFixed(2)} €` 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(invoice)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}