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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ImportResult {
  success: boolean;
  processed: number;
  successful: number;
  created?: number;
  updated?: number;
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
  const [forceYear, setForceYear] = useState<number | ''>('');
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setImportResult(null);
        // Parse immediately to show a quick preview (first rows)
        parseExcelFile(selectedFile)
          .then((excelData) => {
            const rows = transformExcelData(excelData);
            setPreview(rows.slice(0, 5));
          })
          .catch(() => {
            setPreview([]);
          });
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
          
          // Parse with options to handle headers correctly
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: '', // Use empty string for missing values instead of undefined
            raw: false  // Convert all values to strings first (preserves formatting)
          });
          
          console.log('Excel data sample:', jsonData.slice(0, 2));
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
    console.log('🔍 transformExcelData RAW input:', excelData.slice(0, 3));
    console.log('🔍 First row keys:', excelData[0] ? Object.keys(excelData[0]) : 'no data');
    
    return excelData.map((row, index) => {
      // Parse amounts with German formatting
      const parseGermanAmount = (v: any) => {
        if (v === undefined || v === null) return 0;
        let cleaned = v.toString()
          .replace(/\s+/g, '')      // Remove spaces
          .replace('€', '')          // Remove euro symbol
          .trim();
        
        // If both dot and comma: German format (1.234,56)
        if (cleaned.includes(',') && cleaned.includes('.')) {
          cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        }
        // Only comma: decimal separator
        else if (cleaned.includes(',')) {
          cleaned = cleaned.replace(',', '.');
        }
        
        return parseFloat(cleaned) || 0;
      };

      const netAmount = parseGermanAmount(row.Nettosumme ?? row.Netto ?? row.Nettobetrag);
      const grossAmount = parseGermanAmount(row.Bruttosumme ?? row.Brutto ?? row.Gesamtbetrag ?? row.Gesamtbrutto);

      // Parse invoice number
      const invoiceNumber = (row.Rechnungsnummer || row['Rechnungs-Nr.'] || row['Rechnungsnr'] || row['Nr'] || '').toString().trim();
      
      // DEBUG: Log first few rows
      if (index < 3) {
        console.log(`Row ${index}:`, {
          rawRechnungsnummer: row.Rechnungsnummer,
          parsedInvoiceNumber: invoiceNumber,
          customerName: row.Name,
          netAmount,
          grossAmount
        });
      }
      
      // Parse invoice date
      const rawDate = (row.Rechnungsdatum || row['Rechnungs-Datum'] || row['Datum'] || row['Invoice Date'] || row['Date']) as any;
      let invoiceDate = '';
      
      if (rawDate !== undefined && rawDate !== null) {
        if (typeof rawDate === 'number') {
          // Excel serial date
          const excelEpoch = new Date(1900, 0, 1);
          const date = new Date(excelEpoch.getTime() + (rawDate - 2) * 86400000);
          invoiceDate = date.toISOString().split('T')[0];
        } else {
          const dateStr = rawDate.toString().trim();
          // Already ISO (YYYY-MM-DD)
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            invoiceDate = dateStr;
          } else {
            // DD.MM.YYYY | DD/MM/YYYY | DD-MM-YYYY
            const dmy = dateStr.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2}|\d{4})$/);
            if (dmy) {
              let d = parseInt(dmy[1], 10);
              let m = parseInt(dmy[2], 10);
              let y = parseInt(dmy[3], 10);
              if (y < 100) y += 2000;
              if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
                invoiceDate = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
              }
            }
          }
        }
      }

      // Fallback: infer from invoice number like "12/2022/183" => 2022-12-15
      if (!invoiceDate && invoiceNumber) {
        const m = invoiceNumber.match(/^(\d{1,2})[.\/-](\d{4})[.\/-]?/);
        if (m) {
          const mth = Math.min(Math.max(parseInt(m[1], 10), 1), 12);
          const yr = parseInt(m[2], 10);
          invoiceDate = `${yr.toString().padStart(4, '0')}-${mth.toString().padStart(2, '0')}-15`;
        }
      }
      
      // Final fallback: Don't use today's date! Send empty to let edge function handle it
      if (!invoiceDate || invoiceDate === '' || invoiceDate === 'NaN-NaN-NaN') {
        invoiceDate = ''; // Edge function will derive from invoice number
      }

      // Optional: force all rows into a specific year selected by the user
      if (forceYear !== '') {
        const yyyy = String(forceYear);
        // Try to keep month/day from parsed date, else derive month from invoice number, else use mid-year
        if (invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
          const [, mm = '06', dd = '15'] = invoiceDate.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
          invoiceDate = `${yyyy}-${mm}-${dd}`;
        } else {
          const m = invoiceNumber.match(/^(\d{1,2})[.\/-](\d{4})/);
          const mm = m ? String(Math.min(Math.max(parseInt(m[1], 10), 1), 12)).padStart(2, '0') : '06';
          invoiceDate = `${yyyy}-${mm}-15`;
        }
      }


      return {
        customerName: row.Name || '',
        customerAddress: row.Adresse || '',
        invoiceNumber: invoiceNumber,
        invoiceDate: invoiceDate,
        netAmount: netAmount,
        grossAmount: grossAmount
      };
    });
  };

  const downloadTemplate = () => {
    // Create template data with examples from 2020-2024
    const templateData = [
      {
        'Name': 'Eisdiele Sommer',
        'Adresse': 'Eisdiele Sommer, Sonnenallee 10, 10999 Berlin',
        'Rechnungsnummer': '01/2020/001',
        'Rechnungsdatum': '2020-03-15',
        'Nettosumme': '850,00',
        'Bruttosumme': '1011,50'
      },
      {
        'Name': 'Gelateria Milano',
        'Adresse': 'Gelateria Milano, Bahnhofstraße 34, 80335 München',
        'Rechnungsnummer': '06/2020/045',
        'Rechnungsdatum': '2020-06-22',
        'Nettosumme': '1200,00',
        'Bruttosumme': '1428,00'
      },
      {
        'Name': 'Eis & Café Zentral',
        'Adresse': 'Eis & Café Zentral, Marktplatz 5, 50667 Köln',
        'Rechnungsnummer': '02/2021/023',
        'Rechnungsdatum': '2021-02-10',
        'Nettosumme': '1500,00',
        'Bruttosumme': '1785,00'
      },
      {
        'Name': 'La Dolce Vita',
        'Adresse': 'La Dolce Vita, Hafenstraße 78, 20459 Hamburg',
        'Rechnungsnummer': '08/2021/112',
        'Rechnungsdatum': '2021-08-05',
        'Nettosumme': '650,00',
        'Bruttosumme': '773,50'
      },
      {
        'Name': 'Eiscafé Venezia',
        'Adresse': 'Eiscafé Venezia, Kirchstraße 23, 60311 Frankfurt',
        'Rechnungsnummer': '04/2022/067',
        'Rechnungsdatum': '2022-04-18',
        'Nettosumme': '950,00',
        'Bruttosumme': '1130,50'
      },
      {
        'Name': 'Gelato Paradise',
        'Adresse': 'Gelato Paradise, Altstadt 12, 70173 Stuttgart',
        'Rechnungsnummer': '11/2022/189',
        'Rechnungsdatum': '2022-11-30',
        'Nettosumme': '1100,00',
        'Bruttosumme': '1309,00'
      },
      {
        'Name': 'Musterfirma GmbH',
        'Adresse': 'Musterfirma GmbH, Musterstraße 123, 12345 Musterstadt',
        'Rechnungsnummer': '01/2024/001',
        'Rechnungsdatum': '2024-01-15',
        'Nettosumme': '1000,00',
        'Bruttosumme': '1190,00'
      },
      {
        'Name': 'Beispiel Eiscafe',
        'Adresse': 'Beispiel Eiscafe, Hauptstraße 45, 54321 Beispielstadt',
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
        const parts = [];
        if (data.created > 0) parts.push(`${data.created} neue erstellt`);
        if (data.updated > 0) parts.push(`${data.updated} aktualisiert`);
        toast.success(`✓ Import abgeschlossen: ${parts.join(', ')}`);
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
            <div className="flex justify-end mb-4 gap-4 flex-col sm:flex-row sm:items-center">
              <div className="w-full sm:w-auto">
                <Label>Zieljahr (optional)</Label>
<Select value={forceYear === '' ? 'auto' : String(forceYear)} onValueChange={(v) => setForceYear(v === 'auto' ? '' : parseInt(v, 10))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Jahr wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatisch</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="gap-2 w-full sm:w-auto"
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

            {preview.length > 0 && (
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-semibold text-sm mb-2">Vorschau (erste 5 Zeilen)</h4>
                <div className="text-xs text-muted-foreground grid grid-cols-4 gap-2">
                  <div className="font-medium">Rechnungsnummer</div>
                  <div className="font-medium">Datum</div>
                  <div className="font-medium">Netto</div>
                  <div className="font-medium">Brutto</div>
                  {preview.map((r, idx) => (
                    <>
                      <div key={`i-${idx}-n`}>{r.invoiceNumber || '-'}</div>
                      <div key={`i-${idx}-d`}>{r.invoiceDate || '-'}</div>
                      <div key={`i-${idx}-net`}>{r.netAmount}</div>
                      <div key={`i-${idx}-gross`}>{r.grossAmount}</div>
                    </>
                  ))}
                </div>
              </div>
            )}


            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Anforderungen an die Excel-Datei:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Spalte "Name" - Kundenname</li>
                <li>• Spalte "Adresse" - Vollständige Adresse (Format: Name, Straße, PLZ Ort)</li>
                <li>• Spalte "Rechnungsnummer" - Eindeutige Rechnungsnummer</li>
                <li>• Spalte "Rechnungsdatum" oder "Datum" – Format: YYYY-MM-DD, DD.MM.YYYY oder Excel-Datum</li>
                <li>• Spalte "Nettosumme"/"Netto" – z. B. 1.081,00</li>
                <li>• Spalte "Bruttosumme"/"Brutto"/"Gesamtbetrag" – z. B. 1.309,00</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Hinweis: Produkte werden separat verwaltet. Falls kein Datum gesetzt ist, wird es aus der Rechnungsnummer (MM/YYYY) abgeleitet.
              </p>
            </div>

            {importResult && (
              <div className="space-y-4">
                <h4 className="font-semibold">Import-Ergebnis:</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                        <p className="text-2xl font-bold text-green-600">{importResult.created ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Neu erstellt</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-bold text-blue-600">{importResult.updated ?? 0}</p>
                        <p className="text-sm text-muted-foreground">Aktualisiert</p>
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
