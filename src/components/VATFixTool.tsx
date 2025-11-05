import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, AlertCircle, TrendingUp, Percent } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VATCorrection {
  invoiceId: string;
  invoiceNumber: string;
  oldRate: number;
  newRate: number;
  oldSubtotal: number;
  newSubtotal: number;
  oldVatAmount: number;
  newVatAmount: number;
  totalAmount: number;
  country: string;
  reason: string;
}

interface FixResult {
  success: boolean;
  summary: {
    total: number;
    corrected: number;
    skipped: number;
    errors: number;
  };
  corrections: VATCorrection[];
  distribution: Record<string, number>;
  errors: string[];
}

export default function VATFixTool() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);

  const handleFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      toast.info('Starte MwSt-Korrektur...', {
        description: 'Dies kann einige Minuten dauern'
      });

      const { data, error } = await supabase.functions.invoke('fix-vat-rates', {
        body: {}
      });

      if (error) throw error;

      setResult(data as FixResult);

      if (data.success) {
        toast.success('MwSt-Korrektur abgeschlossen!', {
          description: `${data.summary.corrected} Rechnungen korrigiert`
        });
      } else {
        toast.error('Fehler bei MwSt-Korrektur', {
          description: data.error
        });
      }
    } catch (error) {
      console.error('Error fixing VAT rates:', error);
      toast.error('Fehler beim Ausführen der Korrektur', {
        description: error instanceof Error ? error.message : 'Unbekannter Fehler'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">MwSt-Korrektur Tool</h1>
        <p className="text-muted-foreground">
          Korrigiert falsche MwSt-Sätze in bestehenden Rechnungen nach EU-Recht
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            MwSt-Berechnung
          </CardTitle>
          <CardDescription>
            Korrigiert MwSt-Sätze basierend auf Kundenland und USt-ID Status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Wichtig:</strong> Diese Korrektur ändert die MwSt-Sätze und Beträge in bestehenden Rechnungen.
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Deutschland (DE): 19%</li>
                <li>Spanien (ES): 21%</li>
                <li>EU mit gültiger USt-ID: 0% (Reverse Charge)</li>
                <li>Andere EU-Länder: Lokaler Satz</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleFix}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Korrigiere MwSt-Sätze...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                MwSt-Sätze jetzt korrigieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{result.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Geprüft</div>
                </div>
                <div className="text-center p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.summary.corrected}
                  </div>
                  <div className="text-sm text-muted-foreground">Korrigiert</div>
                </div>
                <div className="text-center p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.summary.skipped}
                  </div>
                  <div className="text-sm text-muted-foreground">Bereits korrekt</div>
                </div>
                <div className="text-center p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.summary.errors}
                  </div>
                  <div className="text-sm text-muted-foreground">Fehler</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.keys(result.distribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>MwSt-Verteilung</CardTitle>
                <CardDescription>Anzahl Rechnungen pro MwSt-Satz</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.distribution).map(([rate, count]) => (
                    <Badge key={rate} variant="outline" className="text-lg px-4 py-2">
                      {rate}: {count} Rechnungen
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {result.corrections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Korrekturen (Erste 100)</CardTitle>
                <CardDescription>Details der durchgeführten Änderungen</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rechnung</TableHead>
                        <TableHead>Land</TableHead>
                        <TableHead>Alt</TableHead>
                        <TableHead>Neu</TableHead>
                        <TableHead className="text-right">Netto Alt</TableHead>
                        <TableHead className="text-right">Netto Neu</TableHead>
                        <TableHead className="text-right">MwSt Alt</TableHead>
                        <TableHead className="text-right">MwSt Neu</TableHead>
                        <TableHead>Grund</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.corrections.map((corr, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-sm">
                            {corr.invoiceNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{corr.country}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">
                              {(corr.oldRate * 100).toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">
                              {(corr.newRate * 100).toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {corr.oldSubtotal.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {corr.newSubtotal.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-right">
                            {corr.oldVatAmount.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {corr.newVatAmount.toFixed(2)} €
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {corr.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {result.errors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Fehler</CardTitle>
                <CardDescription>Probleme bei der Korrektur (Erste 20)</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {result.errors.map((error, idx) => (
                    <li key={idx} className="text-destructive">• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
