import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportRow {
  customerName: string;
  contactPerson: string;
  address: string;
  year: string;
}

interface ImportResult {
  successful: number;
  failed: number;
  skipped: number;
  notFound: string[];
  examples: Array<{ customer: string; contact: string; address: string }>;
}

export const ContactImport = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEntry, setCurrentEntry] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header row and filter out empty rows
      const rows: ImportRow[] = jsonData.slice(1)
        .filter(row => row[0]) // Has customer name
        .map(row => ({
          customerName: row[0]?.toString().trim() || '',
          contactPerson: row[1]?.toString().trim() || '',
          address: row[2]?.toString().trim() || '',
          year: row[3]?.toString().trim() || ''
        }));

      console.log(`📊 Total Einträge: ${rows.length}`);

      const successful: Array<{ customer: string; contact: string; address: string }> = [];
      const notFound: string[] = [];
      let skipped = 0;
      let failed = 0;

      // Get all customers from DB
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name');

      if (customersError) {
        throw new Error(`Fehler beim Laden der Kunden: ${customersError.message}`);
      }

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setProgress(Math.round(((i + 1) / rows.length) * 100));
        setCurrentEntry(`${i + 1}/${rows.length}: ${row.customerName}`);

        // Skip if no contact person
        if (!row.contactPerson) {
          console.log(`⏭️ Überspringe ${row.customerName} (kein Ansprechpartner)`);
          skipped++;
          continue;
        }

        // Find customer - exact match first
        let customer = customers?.find(c => c.name === row.customerName);

        // If not found, try LIKE search
        if (!customer) {
          customer = customers?.find(c => 
            c.name.toLowerCase().includes(row.customerName.toLowerCase()) ||
            row.customerName.toLowerCase().includes(c.name.toLowerCase())
          );
        }

        if (!customer) {
          console.log(`❌ Kunde nicht gefunden: ${row.customerName}`);
          notFound.push(row.customerName);
          failed++;
          continue;
        }

        // Update customer
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            contact_person: row.contactPerson,
            address: row.address
          })
          .eq('id', customer.id);

        if (updateError) {
          console.error(`❌ Fehler bei ${row.customerName}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Erfolgreich: ${row.customerName} -> ${row.contactPerson}`);
          if (successful.length < 5) {
            successful.push({
              customer: row.customerName,
              contact: row.contactPerson,
              address: row.address
            });
          }
        }

        // Show progress every 50 entries
        if ((i + 1) % 50 === 0) {
          toast.info(`Verarbeite Eintrag ${i + 1} von ${rows.length}...`);
        }
      }

      const finalResult: ImportResult = {
        successful: rows.length - failed - skipped,
        failed: notFound.length,
        skipped,
        notFound,
        examples: successful
      };

      setResult(finalResult);
      toast.success('Import abgeschlossen!');

    } catch (error) {
      console.error('Import-Fehler:', error);
      toast.error(`Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Ansprechpartner Import
        </CardTitle>
        <CardDescription>
          Excel-Datei mit Ansprechpartnern hochladen und automatisch zuordnen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={importing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {importing && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">{currentEntry}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{result.successful}</p>
                      <p className="text-sm text-muted-foreground">Erfolgreich</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{result.failed}</p>
                      <p className="text-sm text-muted-foreground">Nicht gefunden</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{result.skipped}</p>
                      <p className="text-sm text-muted-foreground">Übersprungen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.notFound.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Nicht gefundene Kunden</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {result.notFound.map((name, idx) => (
                      <li key={idx}>{name}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.examples.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Beispiele erfolgreicher Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {result.examples.map((ex, idx) => (
                      <div key={idx} className="border-l-2 border-green-500 pl-3">
                        <p className="font-semibold">{ex.customer}</p>
                        <p className="text-muted-foreground">Ansprechpartner: {ex.contact}</p>
                        <p className="text-muted-foreground">Adresse: {ex.address}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
