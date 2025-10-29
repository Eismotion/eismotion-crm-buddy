import { AlertTriangle, CheckCircle, XCircle, FileWarning } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ImportWarning {
  type: 'duplicate_invoice_number' | 'customer_ambiguous' | 'missing_data';
  invoice_number: string;
  customer_name: string;
  message: string;
  data?: any;
}

interface ImportResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  warnings: ImportWarning[];
}

interface ImportWarningsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ImportResult | null;
  onResolve?: () => void;
}

export const ImportWarningsDialog = ({ open, onOpenChange, result, onResolve }: ImportWarningsDialogProps) => {
  if (!result) return null;

  const hasWarnings = result.warnings && result.warnings.length > 0;
  const hasErrors = result.errors && result.errors.length > 0;

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'duplicate_invoice_number':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'customer_ambiguous':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'missing_data':
        return <FileWarning className="h-4 w-4 text-muted-foreground" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getWarningBadge = (type: string) => {
    switch (type) {
      case 'duplicate_invoice_number':
        return <Badge variant="destructive" className="text-xs">Duplikat</Badge>;
      case 'customer_ambiguous':
        return <Badge variant="default" className="text-xs bg-warning text-warning-foreground">Mehrdeutig</Badge>;
      case 'missing_data':
        return <Badge variant="secondary" className="text-xs">Unvollständig</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!hasWarnings && !hasErrors ? (
              <>
                <CheckCircle className="h-5 w-5 text-success" />
                Import erfolgreich abgeschlossen
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-warning" />
                Import abgeschlossen mit Warnungen
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {result.processed} Rechnungen verarbeitet: {result.successful} erfolgreich, {result.skipped} übersprungen, {result.failed} fehlgeschlagen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-success">{result.successful}</div>
                <div className="text-xs text-muted-foreground">Erfolgreich</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-warning">{result.skipped}</div>
                <div className="text-xs text-muted-foreground">Übersprungen</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-destructive">{result.failed}</div>
                <div className="text-xs text-muted-foreground">Fehlgeschlagen</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{result.warnings?.length || 0}</div>
                <div className="text-xs text-muted-foreground">Warnungen</div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings List */}
          {hasWarnings && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warnungen - Bitte manuell prüfen
              </h4>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-3">
                  {result.warnings.map((warning, index) => (
                    <Card key={index} className="border-l-4 border-l-warning">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getWarningIcon(warning.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">RE {warning.invoice_number}</span>
                                {getWarningBadge(warning.type)}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{warning.customer_name}</p>
                            <p className="text-sm">{warning.message}</p>
                            {warning.data && warning.type === 'customer_ambiguous' && (
                              <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                                <p className="font-medium mb-1">Gefundene Übereinstimmungen:</p>
                                {warning.data.customers?.map((c: any, i: number) => (
                                  <div key={i} className="text-muted-foreground">
                                    • {c.name} {c.city ? `- ${c.city}` : ''} {c.address ? `(${c.address})` : ''}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Errors List */}
          {hasErrors && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <XCircle className="h-4 w-4" />
                Fehler
              </h4>
              <ScrollArea className="h-[150px] rounded-md border border-destructive p-4">
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-destructive">
                      • {error}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            {hasWarnings && onResolve && (
              <Button onClick={onResolve}>
                Zur Kundenverwaltung
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
