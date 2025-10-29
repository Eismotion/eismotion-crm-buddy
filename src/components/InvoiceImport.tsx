import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';
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
          unitPrice: 0
        };
      });

      // Parse amounts
      const nettoStr = (row.Nettosumme || '').toString().replace('€', '').replace(',', '.').trim();
      const bruttoStr = (row.Bruttosumme || '').toString().replace('€', '').replace(',', '.').trim();
      
      const subtotal = parseFloat(nettoStr) || 0;
      const totalAmount = parseFloat(bruttoStr) || 0;
      const taxAmount = totalAmount - subtotal;

      // Parse invoice date - handle both string and Excel serial date formats (incl. de-DE)
      let invoiceDate = '';
      const rawDate = row.Rechnungsdatum;
      
      if (rawDate !== undefined && rawDate !== null) {
        if (typeof rawDate === 'number') {
          // Excel serial date (1900-based, Excel leap-year bug accounted for)
          const excelEpoch = new Date(1900, 0, 1);
          const date = new Date(excelEpoch.getTime() + (rawDate - 2) * 86400000);
          invoiceDate = date.toISOString().split('T')[0];
        } else {
          const dateStr = rawDate.toString().trim().replace(/\s+/g, ' ');
          // 1) Already ISO (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            invoiceDate = dateStr;
          } else {
            // 2) de-DE or DMY variants: DD.MM.YYYY | DD/MM/YYYY | DD-MM-YYYY (also allows 1/1/2022)
            const dmy = dateStr.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2}|\d{4})$/);
            if (dmy) {
              let d = parseInt(dmy[1], 10);
              let m = parseInt(dmy[2], 10);
              let y = parseInt(dmy[3], 10);
              if (y < 100) y += 2000; // assume 20xx for 2-digit years
              if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                invoiceDate = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
              }
            }
            // 3) YMD with different separators: YYYY/MM/DD | YYYY.MM.DD
            if (!invoiceDate) {
              const ymd = dateStr.match(/^(\d{4})[.\/\-](\d{1,2})[.\/\-](\d{1,2})$/);
              if (ymd) {
                const y = parseInt(ymd[1], 10);
                const m = parseInt(ymd[2], 10);
                const d = parseInt(ymd[3], 10);
                if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                  invoiceDate = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                }
              }
            }
            // 4) Fallback to Date parser as last resort
            if (!invoiceDate) {
              const parsed = new Date(dateStr);
              if (!isNaN(parsed.getTime())) {
                invoiceDate = parsed.toISOString().split('T')[0];
              }
            }
          }
        }
      }
      
      // If still empty or invalid, use current date as fallback
      if (!invoiceDate || invoiceDate === '' || invoiceDate === 'NaN-NaN-NaN') {
        invoiceDate = new Date().toISOString().split('T')[0];
      }

      return {
        customerName: row.Name || '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: street,
        customerCity: city,
        customerPostalCode: postalCode,
        customerCountry: 'DE',
        invoiceNumber: row.Rechnungsnummer || '',
        invoiceDate: invoiceDate,
        subtotal: subtotal,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        status: 'bezahlt',
        items: items
      };
    });
  };

  const downloadTemplate = () => {
    // Create template data with examples from 2020-2024
    const templateData = [
      {
        'Name': 'Eisdiele Sommer',
        'Adresse': 'Eisdiele Sommer, Sonnenallee 10, 10999 Berlin',
        'Produkte': '1 Eismaschine Compact',
        'Rechnungsnummer': '01/2020/001',
        'Rechnungsdatum': '2020-03-15',
        'Nettosumme': '850,00',
        'Bruttosumme': '1011,50'
      },
      {
        'Name': 'Gelateria Milano',
        'Adresse': 'Gelateria Milano, Bahnhofstraße 34, 80335 München',
        'Produkte': '1 Kühlvitrine Groß\n2 Eisportionierer Set',
        'Rechnungsnummer': '06/2020/045',
        'Rechnungsdatum': '2020-06-22',
        'Nettosumme': '1200,00',
        'Bruttosumme': '1428,00'
      },
      {
        'Name': 'Eis & Café Zentral',
        'Adresse': 'Eis & Café Zentral, Marktplatz 5, 50667 Köln',
        'Produkte': '1 Eismaschine Professional',
        'Rechnungsnummer': '02/2021/023',
        'Rechnungsdatum': '2021-02-10',
        'Nettosumme': '1500,00',
        'Bruttosumme': '1785,00'
      },
      {
        'Name': 'La Dolce Vita',
        'Adresse': 'La Dolce Vita, Hafenstraße 78, 20459 Hamburg',
        'Produkte': '1 Vitrine Standard\n1 Waffelhalter',
        'Rechnungsnummer': '08/2021/112',
        'Rechnungsdatum': '2021-08-05',
        'Nettosumme': '650,00',
        'Bruttosumme': '773,50'
      },
      {
        'Name': 'Eiscafé Venezia',
        'Adresse': 'Eiscafé Venezia, Kirchstraße 23, 60311 Frankfurt',
        'Produkte': '1 Eismaschine Modell XY',
        'Rechnungsnummer': '04/2022/067',
        'Rechnungsdatum': '2022-04-18',
        'Nettosumme': '950,00',
        'Bruttosumme': '1130,50'
      },
      {
        'Name': 'Gelato Paradise',
        'Adresse': 'Gelato Paradise, Altstadt 12, 70173 Stuttgart',
        'Produkte': '1 Kühlschrank Pro\n2 Eisbehälter Set',
        'Rechnungsnummer': '11/2022/189',
        'Rechnungsdatum': '2022-11-30',
        'Nettosumme': '1100,00',
        'Bruttosumme': '1309,00'
      },
      {
        'Name': 'Musterfirma GmbH',
        'Adresse': 'Musterfirma GmbH, Musterstraße 123, 12345 Musterstadt',
        'Produkte': '1 Eismaschine Modell XY\n2 Kühlschrank Pro',
        'Rechnungsnummer': '01/2024/001',
        'Rechnungsdatum': '2024-01-15',
        'Nettosumme': '1000,00',
        'Bruttosumme': '1190,00'
      },
      {
        'Name': 'Beispiel Eiscafe',
        'Adresse': 'Beispiel Eiscafe, Hauptstraße 45, 54321 Beispielstadt',
        'Produkte': '1 Vitrine Standard',
        'Rechnungsnummer': '01/2024/002',
        'Rechnungsdatum': '2024-01-16',
        'Nettosumme': '500,00',
        'Bruttosumme': '595,00'
      }
    ];

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rechnungen');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 50 }, // Adresse
      { wch: 40 }, // Produkte
      { wch: 20 }, // Rechnungsnummer
      { wch: 15 }, // Rechnungsdatum
      { wch: 15 }, // Nettosumme
      { wch: 15 }  // Bruttosumme
    ];

    // Generate file
    XLSX.writeFile(workbook, 'Rechnungen_Import_Vorlage.xlsx');
    toast.success('Vorlage wurde heruntergeladen');
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
          data: importData,
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
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Vorlage herunterladen
              </Button>
            </div>
            
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
                <li>• Spalte "Adresse" - Vollständige Adresse (Format: Name, Straße, PLZ Ort)</li>
                <li>• Spalte "Produkte" - Produktbeschreibungen (eine pro Zeile)</li>
                <li>• Spalte "Rechnungsnummer" - Eindeutige Rechnungsnummer</li>
                <li>• Spalte "Rechnungsdatum" - Datum der Rechnung (Format: YYYY-MM-DD)</li>
                <li>• Spalte "Nettosumme" - Nettobetrag (Format: 1000,00)</li>
                <li>• Spalte "Bruttosumme" - Bruttobetrag inkl. MwSt. (Format: 1190,00)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Hinweis: E-Mail-Adressen und Telefonnummern können später manuell in der Kundenverwaltung ergänzt werden.
              </p>
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
