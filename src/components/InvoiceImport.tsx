import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { ImportWarningsDialog } from './ImportWarningsDialog';

interface ImportResult {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: string[];
  warnings: Array<{
    type: 'customer_ambiguous' | 'duplicate_invoice_number' | 'missing_data';
    invoice_number: string;
    customer_name: string;
    message: string;
    data?: any;
  }>;
}

export const InvoiceImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        toast.error('Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)');
      }
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Fehler beim Lesen der Datei'));
      reader.readAsBinaryString(file);
    });
  };

  const transformExcelData = (excelData: any[]): any[] => {
    return excelData.map((row) => {
      // Parse address (format: "Name, Street, PLZ City")
      const address = row.Adresse || '';
      const addressParts = address.split(',').map((part: string) => part.trim());
      
      let street = '';
      let postalCode = '';
      let city = '';
      
      if (addressParts.length >= 3) {
        street = addressParts[1] || '';
        const plzCity = addressParts[2] || '';
        const plzCityMatch = plzCity.match(/(\d+)\s+(.+)/);
        if (plzCityMatch) {
          postalCode = plzCityMatch[1];
          city = plzCityMatch[2];
        }
      }

      // Parse products (format: "1 Product Name\n2 Product Name")
      const productsText = row.Produkte || '';
      const productLines = productsText.split('\n').filter((line: string) => line.trim());
      const items = productLines.map((line: string) => {
        const match = line.match(/^\d+\s+(.+)/);
        return {
          description: match ? match[1] : line,
          quantity: 1,
          unit_price: 0
        };
      });

      // Parse amounts
      const nettoStr = (row.Nettosumme || '').toString().replace('€', '').replace(',', '.').trim();
      const bruttoStr = (row.Bruttosumme || '').toString().replace('€', '').replace(',', '.').trim();
      
      const netAmount = parseFloat(nettoStr) || 0;
      const totalAmount = parseFloat(bruttoStr) || 0;

      return {
        customerName: row.Name || '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: street,
        customerCity: city,
        customerPostalCode: postalCode,
        customerCountry: 'DE',
        invoiceNumber: row.Rechnungsnummer || '',
        invoiceDate: row.Rechnungsdatum || '',
        subtotal: netAmount,
        total: totalAmount,
        items: items
      };
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Bitte wählen Sie eine Datei aus');
      return;
    }

    setImporting(true);
    try {
      // Parse Excel file
      const excelData = await parseExcelFile(file);
      console.log('Parsed Excel data:', excelData);
      
      // Transform data to match expected format
      const importData = transformExcelData(excelData);
      console.log('Transformed import data:', importData);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('import-invoicehome', {
        body: {
          importData: importData,
          importType: 'excel'
        }
      });

      if (error) {
        console.error('Import error:', error);
        throw error;
      }

      console.log('Import response:', data);
      setImportResult(data);
      setShowResults(true);

      if (data.successful > 0) {
        toast.success(`${data.successful} Rechnungen erfolgreich importiert`);
      }
      if (data.failed > 0) {
        toast.error(`${data.failed} Rechnungen konnten nicht importiert werden`);
      }
      if (data.skipped > 0) {
        toast.info(`${data.skipped} Rechnungen übersprungen (Duplikate)`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Import fehlgeschlagen: ' + (error as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rechnungen importieren</h1>
          <p className="text-muted-foreground mt-2">
            Importieren Sie Ihre InvoiceHome-Rechnungen aus einer Excel-Datei
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel-Import
            </CardTitle>
            <CardDescription>
              Laden Sie Ihre Excel-Datei mit allen Rechnungsinformationen hoch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Excel-Datei auswählen</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button
                  onClick={handleImport}
                  disabled={!file || importing}
                  className="min-w-[120px]"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importieren
                    </>
                  )}
                </Button>
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Ausgewählte Datei: {file.name}
                </p>
              )}
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Anforderungen an die Excel-Datei:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Spalte "Name" - Kundenname</li>
                <li>• Spalte "Adresse" - Vollständige Adresse</li>
                <li>• Spalte "Produkte" - Produktbeschreibungen</li>
                <li>• Spalte "Rechnungsnummer" - Eindeutige Rechnungsnummer</li>
                <li>• Spalte "Rechnungsdatum" - Datum der Rechnung</li>
                <li>• Spalte "Nettosumme" - Nettobetrag</li>
                <li>• Spalte "Bruttosumme" - Bruttobetrag</li>
              </ul>
            </div>

            {importResult && (
              <div className="space-y-4">
                <h4 className="font-semibold">Import-Ergebnis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground">{importResult.processed}</p>
                        <p className="text-sm text-muted-foreground">Verarbeitet</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                        <p className="text-sm text-muted-foreground">Erfolgreich</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                        <p className="text-sm text-muted-foreground">Übersprungen</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                        <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                        <p className="text-sm text-muted-foreground">Fehlgeschlagen</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportWarningsDialog
        open={showResults}
        onOpenChange={setShowResults}
        result={importResult}
      />
    </>
  );
};
