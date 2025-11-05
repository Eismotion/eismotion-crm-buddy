import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FixResult {
  success: boolean;
  correctionsApplied: number;
  totalCorrections: number;
  errors: string[];
  validation: {
    testInvoice: any;
    topCustomers: Array<{
      name: string;
      address: string;
      totalRevenue: number;
      invoiceCount: number;
    }>;
  };
  affectedCustomers: number;
}

export const CustomerFixTool = () => {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);

  const handleFix = async () => {
    if (!confirm('⚠️ Dies wird alle Kunden-Zuordnungen korrigieren basierend auf Name + PLZ.\n\nMöchten Sie fortfahren?')) {
      return;
    }

    setFixing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('fix-customer-assignments');

      if (error) throw error;

      setResult(data);

      if (data.success) {
        toast.success(`✓ ${data.correctionsApplied} Rechnungen korrigiert!`);
      } else {
        toast.error('Korrektur fehlgeschlagen: ' + data.error);
      }
    } catch (error) {
      console.error('Fix error:', error);
      toast.error('Fehler: ' + (error as Error).message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kunden-Zuordnung reparieren</h1>
        <p className="text-muted-foreground mt-2">
          Korrigiert falsche Kunden-Zuordnungen basierend auf Name + Postleitzahl
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚠️ Problem erkannt</AlertTitle>
        <AlertDescription>
          Beim Import wurden Rechnungen nur nach <strong>Namen</strong> zugeordnet, nicht nach <strong>Adresse</strong>.
          <br />
          Beispiel: Es gibt 19 verschiedene "Eiscafe Venezia" - alle Rechnungen wurden dem ersten zugeordnet!
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Automatische Korrektur</CardTitle>
          <CardDescription>
            Ordnet Rechnungen basierend auf Kundenname + Postleitzahl neu zu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">Was wird korrigiert:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Rechnungen werden dem richtigen Kunden zugeordnet (Name + PLZ-Match)</li>
              <li>Kunden-Statistiken (Umsatz, Anzahl Rechnungen) werden neu berechnet</li>
              <li>Dashboard zeigt dann die korrekten Top-Kunden</li>
            </ul>
          </div>

          <Button
            onClick={handleFix}
            disabled={fixing}
            className="w-full"
            size="lg"
          >
            {fixing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Korrigiere Zuordnungen...
              </>
            ) : (
              'Kunden-Zuordnung jetzt korrigieren'
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-status-paid" />
                  Korrektur erfolgreich
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Korrektur fehlgeschlagen
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-2xl font-bold">{result.correctionsApplied}</div>
                <div className="text-sm text-muted-foreground">Korrigierte Rechnungen</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-2xl font-bold">{result.affectedCustomers}</div>
                <div className="text-sm text-muted-foreground">Betroffene Kunden</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-2xl font-bold">{result.errors.length}</div>
                <div className="text-sm text-muted-foreground">Fehler</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Fehler bei folgenden Rechnungen:</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm mt-2">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.validation.testInvoice && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">✓ Validierung: Rechnung 07/2025/956</h4>
                <div className="text-sm">
                  <strong>Kunde:</strong> {result.validation.testInvoice.customers?.name}
                  <br />
                  <strong>Adresse:</strong> {result.validation.testInvoice.customers?.address}
                </div>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Neue Top 5 Kunden:</h4>
              <div className="space-y-2">
                {result.validation.topCustomers.map((customer, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{customer.totalRevenue.toFixed(2)} €</div>
                      <div className="text-xs text-muted-foreground">{customer.invoiceCount} Rechnungen</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
