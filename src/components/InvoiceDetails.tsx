import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Send, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoiceProductSelector } from './InvoiceProductSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/data/mockData';

export const InvoiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Load invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Load customer
      if (invoiceData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', invoiceData.customer_id)
          .single();

      if (customerError) throw customerError;
        setCustomer(customerData);
      }
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      toast.error('Fehler beim Laden der Rechnung');
    } finally {
      setLoading(false);
    }
  };

  const recalculateTotals = async () => {
    if (!id) return;

    try {
      // Get all invoice items
      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('total_price, is_tax_exempt')
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      // Calculate subtotal from all items
      const subtotal = items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
      
      // Calculate tax only on non-exempt items
      const taxableAmount = items?.reduce((sum, item) => 
        item.is_tax_exempt ? sum : sum + (item.total_price || 0), 0) || 0;
      
      const taxRate = invoice?.tax_rate || 19.00;
      const taxAmount = taxableAmount * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Update invoice totals
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state without reloading everything
      if (updatedInvoice) {
        setInvoice(updatedInvoice);
      }
    } catch (error) {
      console.error('Error recalculating totals:', error);
    }
  };

  const handleSave = async () => {
    if (!invoice || !id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          status: invoice.status,
          notes: invoice.notes,
          custom_message: invoice.custom_message,
          tax_rate: invoice.tax_rate,
          subtotal: invoice.subtotal,
          tax_amount: invoice.tax_amount,
          total_amount: invoice.total_amount,
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Rechnung gespeichert');
    } catch (error: any) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (!id) return;
    
    try {
      toast.loading('Vorschau wird erstellt...');
      
      const { data, error } = await supabase.functions.invoke('render-invoice-template', {
        body: { invoiceId: id }
      });

      if (error) throw error;
      
      if (data?.pdfUrl) {
        setPreviewUrl(data.pdfUrl);
        setShowPreview(true);
        toast.dismiss();
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error('Fehler bei der Vorschau: ' + error.message);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    
    try {
      toast.loading('PDF wird erstellt...');
      
      const { data, error } = await supabase.functions.invoke('render-invoice-template', {
        body: { invoiceId: id }
      });

      if (error) throw error;
      
      if (data?.pdfUrl) {
        // Download PDF
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = `Rechnung_${invoice.invoice_number}.pdf`;
        link.click();
        toast.dismiss();
        toast.success('PDF heruntergeladen');
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error('Fehler beim PDF-Download: ' + error.message);
    }
  };

  const handleSendInvoice = async () => {
    if (!id || !customer?.email) {
      toast.error('Kunde hat keine Email-Adresse');
      return;
    }
    
    toast.info('Email-Versand wird in Kürze verfügbar sein');
    // TODO: Implement email sending
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('Möchten Sie diese Rechnung wirklich löschen?')) return;

    try {
      // Delete invoice items first
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      // Delete invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Rechnung gelöscht');
      navigate('/invoices');
    } catch (error: any) {
      toast.error('Fehler beim Löschen: ' + error.message);
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

  if (loading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center">Rechnung nicht gefunden</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/invoices')} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground truncate">
              {customer?.name || 'Kein Kunde'}
            </p>
          </div>
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePreview} size="sm" className="sm:size-default">
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Vorschau</span>
          </Button>
          <Button variant="outline" onClick={handleDelete} size="sm" className="sm:size-default">
            <Trash2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Löschen</span>
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} size="sm" className="sm:size-default">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" onClick={handleSendInvoice} size="sm" className="sm:size-default">
            <Send className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Senden</span>
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="sm:size-default">
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{saving ? 'Speichert...' : 'Speichern'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rechnungsdetails */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rechnungsdetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rechnungsdatum</Label>
                <Input
                  type="date"
                  value={invoice.invoice_date || ''}
                  onChange={(e) => setInvoice({ ...invoice, invoice_date: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Fälligkeitsdatum</Label>
                <Input
                  type="date"
                  value={invoice.due_date || ''}
                  onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={invoice.status} onValueChange={(value) => setInvoice({ ...invoice, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Entwurf</SelectItem>
                    <SelectItem value="gesendet">Gesendet</SelectItem>
                    <SelectItem value="bezahlt">Bezahlt</SelectItem>
                    <SelectItem value="überfällig">Überfällig</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>MwSt-Satz (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={invoice.tax_rate || 0}
                  onChange={(e) => {
                    const newTaxRate = parseFloat(e.target.value) || 0;
                    setInvoice({ ...invoice, tax_rate: newTaxRate });
                    // Recalculate immediately when tax rate changes
                    const subtotal = invoice.subtotal || 0;
                    const taxAmount = subtotal * (newTaxRate / 100);
                    const totalAmount = subtotal + taxAmount;
                    setInvoice(prev => ({
                      ...prev,
                      tax_rate: newTaxRate,
                      tax_amount: taxAmount,
                      total_amount: totalAmount
                    }));
                  }}
                  placeholder="z.B. 19 oder 0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Für B2B mit USt-IdNr: 0% (Reverse Charge)
                </p>
              </div>

              <div>
                <Label>Notizen (intern)</Label>
                <Textarea
                  value={invoice.notes || ''}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  rows={3}
                  placeholder="Interne Notizen..."
                />
              </div>

              <div>
                <Label>Individuelle Nachricht</Label>
                <Textarea
                  value={invoice.custom_message || ''}
                  onChange={(e) => setInvoice({ ...invoice, custom_message: e.target.value })}
                  rows={3}
                  placeholder="Diese Nachricht erscheint auf der Rechnung..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Kundendaten */}
          {customer && (
            <Card>
              <CardHeader>
                <CardTitle>Kunde</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <div className="font-semibold">{customer.name}</div>
                  {customer.contact_person && (
                    <div className="text-muted-foreground">{customer.contact_person}</div>
                  )}
                </div>
                {customer.address && (
                  <div>
                    <div>{customer.address}</div>
                    <div>{customer.postal_code} {customer.city}</div>
                  </div>
                )}
                {customer.email && <div>E-Mail: {customer.email}</div>}
                {customer.phone && <div>Tel: {customer.phone}</div>}
              </CardContent>
            </Card>
          )}

          {/* Summen */}
          <Card>
            <CardHeader>
              <CardTitle>Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Zwischensumme:</span>
                <span className="font-semibold">{formatCurrency(invoice.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>MwSt ({invoice.tax_rate}%):</span>
                <span className="font-semibold">{formatCurrency(invoice.tax_amount || 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <span className="font-bold">Gesamtbetrag:</span>
                <span className="font-bold text-primary">{formatCurrency(invoice.total_amount || 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Produktauswahl */}
        <div className="lg:col-span-2">
          <InvoiceProductSelector 
            invoiceId={id!}
            onItemsChange={recalculateTotals}
          />
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Rechnungsvorschau - {invoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh] overflow-auto">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Rechnungsvorschau"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Vorschau wird geladen...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
