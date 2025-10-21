import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function Accounting() {
  // Fetch invoices (Ausgangsrechnungen)
  const { data: invoices } = useQuery({
    queryKey: ['invoices-accounting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('total_amount, tax_amount, status')
        .eq('status', 'bezahlt');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch supplier invoices (Lieferantenrechnungen)
  const { data: supplierInvoices } = useQuery({
    queryKey: ['supplier-invoices-accounting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_invoices')
        .select('amount')
        .eq('invoice_type', 'supplier');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch other invoices (Sonstige Eingangsrechnungen)
  const { data: otherInvoices } = useQuery({
    queryKey: ['other-invoices-accounting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_invoices')
        .select('amount')
        .eq('invoice_type', 'other');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch private expenses
  const { data: privateExpenses } = useQuery({
    queryKey: ['private-expenses-accounting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('private_expenses')
        .select('amount');
      
      if (error) throw error;
      return data;
    },
  });

  // Berechnungen
  const umsatzGesamt = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
  const umsatzsteuerEingenommen = invoices?.reduce((sum, inv) => sum + Number(inv.tax_amount), 0) || 0;
  const nettoUmsatz = umsatzGesamt - umsatzsteuerEingenommen;

  const kostenProduktion = supplierInvoices?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
  // Annahme: 19% MwSt. in den Produktionskosten enthalten
  const umsatzsteuerProduktion = kostenProduktion * 0.19 / 1.19;
  const nettoProduktion = kostenProduktion - umsatzsteuerProduktion;

  // Differenz Umsatzsteuer die abgeführt werden muss
  const umsatzsteuerDifferenz = umsatzsteuerEingenommen - umsatzsteuerProduktion;

  const sonstigeKosten = otherInvoices?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0;
  const privateAusgaben = privateExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
  const gesamtSonstigeKosten = sonstigeKosten + privateAusgaben;

  // Gewinn vor Steuern
  const gewinnVorSteuern = nettoUmsatz - nettoProduktion - umsatzsteuerDifferenz - gesamtSonstigeKosten;
  
  // 6% Steuer auf Gewinn
  const steuer6Prozent = gewinnVorSteuern * 0.06;
  
  // Endgültiger Gewinn
  const gewinn = gewinnVorSteuern - steuer6Prozent;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Buchhaltung</h2>
        <p className="text-muted-foreground">
          Übersicht über Umsätze, Kosten und Gewinn
        </p>
      </div>

      <div className="grid gap-6">
        {/* Umsatz Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Umsatz Deutschland
            </CardTitle>
            <CardDescription>
              Einnahmen aus bezahlten Rechnungen inkl. 19% Umsatzsteuer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Brutto-Umsatz (inkl. 19% MwSt.)</span>
              <span className="text-xl font-bold text-green-600">{formatCurrency(umsatzGesamt)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">davon Umsatzsteuer (19%)</span>
              <span className="font-medium">{formatCurrency(umsatzsteuerEingenommen)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Netto-Umsatz</span>
              <span className="text-lg font-bold">{formatCurrency(nettoUmsatz)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Kosten Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              Kosten
            </CardTitle>
            <CardDescription>
              Produktionskosten und sonstige Ausgaben
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Kosten Produktion Deutschland</span>
                <span className="text-lg font-bold text-red-600">- {formatCurrency(kostenProduktion)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pl-4">
                <span className="text-muted-foreground">Netto-Produktionskosten</span>
                <span>{formatCurrency(nettoProduktion)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pl-4">
                <span className="text-muted-foreground">enthaltene Vorsteuer (19%)</span>
                <span>{formatCurrency(umsatzsteuerProduktion)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Umsatzsteuer-Differenz (abzuführen)</span>
              <span className="text-lg font-bold text-red-600">- {formatCurrency(umsatzsteuerDifferenz)}</span>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sonstige Kosten</span>
                <span className="text-lg font-bold text-red-600">- {formatCurrency(gesamtSonstigeKosten)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pl-4">
                <span className="text-muted-foreground">Eingangsrechnungen (Sonstige)</span>
                <span>{formatCurrency(sonstigeKosten)}</span>
              </div>
              <div className="flex justify-between items-center text-sm pl-4">
                <span className="text-muted-foreground">Private Ausgaben</span>
                <span>{formatCurrency(privateAusgaben)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gewinn Calculation */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Gewinnberechnung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Netto-Umsatz</span>
                <span className="font-medium">{formatCurrency(nettoUmsatz)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− Netto-Produktionskosten</span>
                <span className="font-medium">{formatCurrency(nettoProduktion)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− Umsatzsteuer-Differenz</span>
                <span className="font-medium">{formatCurrency(umsatzsteuerDifferenz)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>− Sonstige Kosten</span>
                <span className="font-medium">{formatCurrency(gesamtSonstigeKosten)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-semibold">Gewinn vor Steuern</span>
              <span className="text-lg font-bold">{formatCurrency(gewinnVorSteuern)}</span>
            </div>

            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm font-medium">− Steuer (6%)</span>
              <span className="font-medium">{formatCurrency(steuer6Prozent)}</span>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Gewinn (netto)</span>
              </div>
              <span className={`text-2xl font-bold ${gewinn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(gewinn)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Zusammenfassung */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Brutto-Umsatz</p>
              <p className="text-lg font-bold">{formatCurrency(umsatzGesamt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gesamtkosten</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(nettoProduktion + umsatzsteuerDifferenz + gesamtSonstigeKosten + steuer6Prozent)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Gewinnmarge</p>
              <p className="text-lg font-bold">
                {umsatzGesamt > 0 ? ((gewinn / umsatzGesamt) * 100).toFixed(1) : '0.0'}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Steuerbelastung</p>
              <p className="text-lg font-bold">
                {formatCurrency(umsatzsteuerDifferenz + steuer6Prozent)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
