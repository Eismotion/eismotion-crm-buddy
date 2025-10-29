import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRow {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerPostalCode?: string;
  customerCity?: string;
  customerCountry?: string;
  invoiceNumber: string;
  invoiceDate: string;
  paidDate?: string | null;
  dueDate?: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
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

    // Process each row
    for (const row of importData as ImportRow[]) {
      try {
        console.log(`Processing invoice: ${row.invoiceNumber}`);
        
        // Find or create customer
        let customerId: string;
        const { data: existingCustomer } = await supabaseClient
          .from('customers')
          .select('id, address, postal_code, city, country')
          .eq('email', row.customerEmail)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
          
          // Update customer with any new address information
          const updateData: any = {};
          if (row.customerAddress && !existingCustomer.address) updateData.address = row.customerAddress;
          if (row.customerPostalCode && !existingCustomer.postal_code) updateData.postal_code = row.customerPostalCode;
          if (row.customerCity && !existingCustomer.city) updateData.city = row.customerCity;
          if (row.customerCountry && !existingCustomer.country) updateData.country = row.customerCountry;
          
          if (Object.keys(updateData).length > 0) {
            await supabaseClient
              .from('customers')
              .update(updateData)
              .eq('id', customerId);
          }
        } else {
          // Create new customer
          const customerNumber = `CUST-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
          const { data: newCustomer, error: customerError } = await supabaseClient
            .from('customers')
            .insert({
              name: row.customerName,
              email: row.customerEmail,
              phone: row.customerPhone,
              address: row.customerAddress,
              postal_code: row.customerPostalCode,
              city: row.customerCity,
              country: row.customerCountry || 'DE',
              customer_number: customerNumber
            })
            .select()
            .single();

          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }

        // Calculate tax rate from amounts
        const taxRate = row.subtotal > 0 
          ? Math.round((row.taxAmount / row.subtotal) * 100) 
          : 19;

        // Create invoice
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from('invoices')
          .insert({
            invoice_number: row.invoiceNumber,
            customer_id: customerId,
            invoice_date: row.invoiceDate,
            due_date: row.dueDate || null,
            status: row.status || 'draft',
            subtotal: row.subtotal,
            tax_rate: taxRate,
            tax_amount: row.taxAmount,
            total_amount: row.totalAmount,
            notes: row.paymentMethod ? `Zahlungsmethode: ${row.paymentMethod}` : null
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Create invoice items if provided
        if (row.items && Array.isArray(row.items) && row.items.length > 0) {
          for (const item of row.items) {
            const totalPrice = item.quantity * item.unitPrice;
            
            const { error: itemError } = await supabaseClient
              .from('invoice_items')
              .insert({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: totalPrice
              });

            if (itemError) throw itemError;
          }
        } else {
          // Create a single generic item for invoices without detailed items
          const { error: itemError } = await supabaseClient
            .from('invoice_items')
            .insert({
              invoice_id: invoice.id,
              description: 'Importierte Rechnung',
              quantity: 1,
              unit_price: row.subtotal,
              total_price: row.subtotal
            });

          if (itemError) throw itemError;
        }

        successCount++;
        console.log(`Successfully imported invoice: ${row.invoiceNumber}`);
      } catch (error) {
        failCount++;
        const errorMsg = `Failed to import ${row.invoiceNumber}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update import log
    await supabaseClient
      .from('import_logs')
      .update({
        records_processed: importData.length,
        records_successful: successCount,
        records_failed: failCount,
        error_details: errors.length > 0 ? { errors } : null,
        status: failCount === 0 ? 'completed' : 'completed'
      })
      .eq('id', importLog.id);

    const result = {
      success: true,
      importLogId: importLog.id,
      processed: importData.length,
      successful: successCount,
      failed: failCount,
      errors: errors
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
