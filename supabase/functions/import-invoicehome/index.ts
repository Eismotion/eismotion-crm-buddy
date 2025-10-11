import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRow {
  customerName: string;
  customerEmail: string;
  customerCity: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting InvoiceHome import function');

    const { csvData, importType } = await req.json();
    
    if (!csvData || !Array.isArray(csvData)) {
      throw new Error('Invalid CSV data format');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errorDetails: any[] = [];

    // Create import log
    const { data: importLog, error: logError } = await supabase
      .from('import_logs')
      .insert({
        filename: 'upload.csv',
        import_type: importType || 'invoicehome_csv',
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating import log:', logError);
      throw logError;
    }

    console.log(`Processing ${csvData.length} rows`);

    // Process each row
    for (const row of csvData as ImportRow[]) {
      recordsProcessed++;

      try {
        // Check if customer exists or create new one
        let customer;
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', row.customerEmail)
          .maybeSingle();

        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              name: row.customerName,
              email: row.customerEmail,
              city: row.customerCity,
              customer_number: `CUST-${Date.now()}`
            })
            .select()
            .single();

          if (customerError) throw customerError;
          customer = newCustomer;
        }

        // Create invoice
        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: row.invoiceNumber,
            customer_id: customer.id,
            invoice_date: row.invoiceDate,
            total_amount: row.amount,
            status: row.status || 'draft'
          });

        if (invoiceError) throw invoiceError;

        recordsSuccessful++;
        console.log(`Successfully imported row ${recordsProcessed}`);
      } catch (error: any) {
        recordsFailed++;
        errorDetails.push({
          row: recordsProcessed,
          error: error.message
        });
        console.error(`Error processing row ${recordsProcessed}:`, error.message);
      }
    }

    // Update import log
    await supabase
      .from('import_logs')
      .update({
        records_processed: recordsProcessed,
        records_successful: recordsSuccessful,
        records_failed: recordsFailed,
        error_details: errorDetails,
        status: recordsFailed === 0 ? 'completed' : 'completed_with_errors'
      })
      .eq('id', importLog.id);

    console.log(`Import completed: ${recordsSuccessful}/${recordsProcessed} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        recordsProcessed,
        recordsSuccessful,
        recordsFailed,
        errorDetails: recordsFailed > 0 ? errorDetails : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in import-invoicehome function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
