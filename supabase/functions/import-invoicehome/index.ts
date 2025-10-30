import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRow {
  customerName: string;
  customerAddress?: string;
  invoiceNumber: string;
  invoiceDate: string;
  netAmount: number | string;
  grossAmount: number | string;
}

// Parse German number format to float
function parseGermanAmount(amountStr: string | number): number {
  if (!amountStr) return 0;
  
  let cleaned = amountStr.toString()
    .replace(/\s+/g, '')  // Remove spaces
    .replace('€', '')     // Remove euro symbol
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('InvoiceHome Import: Starting import process');
    
    const { data: importData, importType } = await req.json();
    
    if (!importData || !Array.isArray(importData)) {
      throw new Error('Invalid import data format');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create import log entry
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        filename: 'import_' + new Date().toISOString(),
        import_type: importType || 'invoicehome_csv',
        records_processed: 0,
        records_successful: 0,
        records_failed: 0,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) throw logError;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];
    const warnings: Array<{
      type: 'duplicate_invoice_number' | 'customer_ambiguous' | 'missing_data',
      invoice_number: string,
      customer_name: string,
      message: string,
      data?: any
    }> = [];

    // Process each row
    for (const row of importData as ImportRow[]) {
      try {
        console.log(`Processing invoice: ${row.invoiceNumber}`);
        
        // Find or create customer - simple matching by name
        let customerId: string;
        
        // Search by name
        const { data: customersByName } = await supabaseClient
          .from('customers')
          .select('id, name, address')
          .ilike('name', row.customerName.trim());
        
        let existingCustomer = null;
        
        if (customersByName && customersByName.length > 0) {
          existingCustomer = customersByName[0];
          
          if (customersByName.length > 1) {
            warnings.push({
              type: 'customer_ambiguous',
              invoice_number: row.invoiceNumber,
              customer_name: row.customerName,
              message: `Mehrere Kunden mit Namen "${row.customerName}" gefunden. Erste Übereinstimmung verwendet.`,
              data: { matchCount: customersByName.length }
            });
          }
        }

        if (existingCustomer) {
          customerId = existingCustomer.id;
          
          // Update customer address if new information is provided
          if (row.customerAddress && !existingCustomer.address) {
            await supabaseClient
              .from('customers')
              .update({ address: row.customerAddress })
              .eq('id', customerId);
          }
        } else {
          // Create new customer
          const customerNumber = `CUST-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
          
          const { data: newCustomer, error: customerError } = await supabaseClient
            .from('customers')
            .insert({
              name: row.customerName,
              address: row.customerAddress || null,
              customer_number: customerNumber
            })
            .select()
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }

        // Parse German number formats
        const netAmount = parseGermanAmount(row.netAmount);
        const grossAmount = parseGermanAmount(row.grossAmount);
        const taxAmount = grossAmount - netAmount;
        const taxRate = netAmount > 0 ? (taxAmount / netAmount) * 100 : 19;

        // Create invoice with robust date normalization
        const numStr = (row.invoiceNumber || '').toString().trim();
        let dateStr = (row.invoiceDate || '').toString().trim();

        const isISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
        const parseFlex = (s: string): string | null => {
          if (!s) return null;
          if (isISO(s)) return s;
          const dmy = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2}|\d{4})$/);
          if (dmy) {
            let d = parseInt(dmy[1]);
            let m = parseInt(dmy[2]);
            let y = parseInt(dmy[3]);
            if (y < 100) y += 2000;
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
              return `${y.toString().padStart(4,'0')}-${m.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            }
          }
          const ymd = s.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})$/);
          if (ymd) {
            const y = parseInt(ymd[1]);
            const m = parseInt(ymd[2]);
            const d = parseInt(ymd[3]);
            if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
              return `${y.toString().padStart(4,'0')}-${m.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
            }
          }
          return null;
        };
        const deriveFromNumber = (num: string): string | null => {
          const m = num.match(/^(\d{1,2})[.\/-](\d{4})[.\/-]?/);
          if (m) {
            const mm = Math.min(Math.max(parseInt(m[1], 10), 1), 12);
            const yyyy = parseInt(m[2], 10);
            return `${yyyy}-${String(mm).padStart(2,'0')}-15`;
          }
          const yHit = num.includes('/2022/');
          if (yHit) return `2022-01-15`;
          return null;
        };

        let normalizedDate = parseFlex(dateStr) || '';
        // If invoice number clearly says 2022, force year 2022
        if (numStr.includes('/2022/')) {
          const inferred = deriveFromNumber(numStr);
          if (inferred) normalizedDate = inferred;
          else if (normalizedDate && !normalizedDate.startsWith('2022-')) {
            // Keep month/day, but force year 2022
            const [, mm = '01', dd = '15'] = normalizedDate.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
            normalizedDate = `2022-${mm}-${dd || '15'}`;
          }
        }
        if (!normalizedDate) {
          const fromNum = deriveFromNumber(numStr);
          if (fromNum) normalizedDate = fromNum;
        }
        if (!normalizedDate) {
          // As a last resort, default to 2022-01-15 to avoid "today" pollution
          normalizedDate = '2022-01-15';
        }

        // Create invoice with date normalization
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from('invoices')
          .insert({
            invoice_number: row.invoiceNumber,
            customer_id: customerId,
            invoice_date: normalizedDate,
            status: 'bezahlt',
            subtotal: netAmount,
            tax_rate: Math.round(taxRate * 100) / 100,
            tax_amount: Math.round(taxAmount * 100) / 100,
            total_amount: Math.round(grossAmount * 100) / 100
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Create a single generic invoice item
        const { error: itemError } = await supabaseClient
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            description: 'Dienstleistung',
            quantity: 1,
            unit_price: netAmount,
            total_price: netAmount
          });

        if (itemError) throw itemError;

        successCount++;
        console.log(`Successfully imported invoice: ${row.invoiceNumber}`);
      } catch (error) {
        failCount++;
        let errorMsg = `Failed to import ${row.invoiceNumber}: `;
        
        if (error instanceof Error) {
          errorMsg += error.message;
        } else if (typeof error === 'object' && error !== null) {
          // Handle Supabase errors which are objects with message, details, etc.
          const err = error as any;
          errorMsg += err.message || err.details || err.hint || JSON.stringify(error);
        } else {
          errorMsg += String(error);
        }
        
        errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }

    // Update import log with errors and warnings
    await supabaseClient
      .from('import_logs')
      .update({
        records_processed: importData.length,
        records_successful: successCount,
        records_failed: failCount,
        error_details: errors.length > 0 || warnings.length > 0 
          ? { errors, warnings } 
          : null,
        status: failCount === 0 ? 'completed' : 'completed'
      })
      .eq('id', importLog.id);

    const result = {
      success: true,
      importLogId: importLog.id,
      processed: importData.length,
      successful: successCount,
      failed: failCount,
      skipped: 0,
      errors: errors,
      warnings: warnings
    };

    console.log('Import completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
