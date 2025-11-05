import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Send, Download, Calendar, Lock } from 'lucide-react';
import { useAdmin } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  const { isAdmin, loading: adminLoading } = useAdmin();

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
        .select('total_price')
        .eq('invoice_id', id);

      if (itemsError) throw itemsError;

      const subtotal = (items || []).reduce((sum, item) => sum + Number(item.total_price || 0), 0);
      const taxRate = Number(invoice?.tax_rate ?? 19.0);
      const taxAmount = subtotal * (taxRate / 100);
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
    
    if (!isAdmin) {
      toast.error('Nur Administratoren dürfen Rechnungen ändern');
      return;
    }

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

  const handleDelete = async () => {
    if (!id) return;
    
    if (!isAdmin) {
      toast.error('Nur Administratoren dürfen Rechnungen löschen');
      return;
    }
    
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

  if (loading || adminLoading) {
    return <div className="p-8 text-center">Laden...</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center">Rechnung nicht gefunden</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">
              {customer?.name || 'Kein Kunde'}
            </p>
          </div>
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDelete} disabled={!isAdmin}>
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline">
            <Send className="h-4 w-4 mr-2" />
            Senden
          </Button>
          <Button onClick={handleSave} disabled={saving || !isAdmin}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rechnungsdetails */}
        <div className="lg:col-span-1 space-y-6">
          {!isAdmin && (
            <Card className="border-warning bg-warning/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-semibold text-warning">Schreibgeschützt</p>
                    <p className="text-sm text-muted-foreground">
                      Nur Administratoren dürfen historische Rechnungsdaten ändern.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
                  disabled={!isAdmin}
                  className={!isAdmin ? 'cursor-not-allowed opacity-60' : ''}
                />
              </div>
              
              <div>
                <Label>Fälligkeitsdatum</Label>
                <Input
                  type="date"
                  value={invoice.due_date || ''}
                  onChange={(e) => setInvoice({ ...invoice, due_date: e.target.value })}
                  disabled={!isAdmin}
                  className={!isAdmin ? 'cursor-not-allowed opacity-60' : ''}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select 
                  value={invoice.status} 
                  onValueChange={(value) => setInvoice({ ...invoice, status: value })}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className={!isAdmin ? 'cursor-not-allowed opacity-60' : ''}>
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
                <Label>MwSt-Satz</Label>
                <div className="text-2xl font-bold">{invoice.tax_rate}%</div>
              </div>

              <div>
                <Label>Notizen (intern)</Label>
                <Textarea
                  value={invoice.notes || ''}
                  onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                  rows={3}
                  placeholder="Interne Notizen..."
                  disabled={!isAdmin}
                  className={!isAdmin ? 'cursor-not-allowed opacity-60' : ''}
                />
              </div>

              <div>
                <Label>Individuelle Nachricht</Label>
                <Textarea
                  value={invoice.custom_message || ''}
                  onChange={(e) => setInvoice({ ...invoice, custom_message: e.target.value })}
                  rows={3}
                  placeholder="Diese Nachricht erscheint auf der Rechnung..."
                  disabled={!isAdmin}
                  className={!isAdmin ? 'cursor-not-allowed opacity-60' : ''}
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
    </div>
  );
};
