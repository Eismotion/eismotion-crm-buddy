import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    const { data: rows, year, status } = await req.json();
    
    console.log(`Starting import of ${rows.length} rows for year ${year} with status ${status}`);
    
    let successful = 0;
    let updated = 0;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const { name, address, invoiceNumber, invoiceDate, netAmount, grossAmount } = row;
        
        if (!invoiceNumber) {
          console.log('Skipping row without invoice number:', row);
          failed++;
          errors.push(`Zeile ohne Rechnungsnummer übersprungen`);
          continue;
        }

        // Find or create customer
        let customerId: string;
        
        const { data: existingCustomers } = await supabaseClient
          .from('customers')
          .select('id, name')
          .ilike('name', `%${name.substring(0, 20)}%`)
          .limit(5);

        if (existingCustomers && existingCustomers.length > 0) {
          // Use first match
          customerId = existingCustomers[0].id;
          console.log(`Found customer: ${existingCustomers[0].name} (${customerId})`);
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await supabaseClient
            .from('customers')
            .insert({
              name: name,
              address: address || null,
              country: 'DE'
            })
            .select('id')
            .single();

          if (customerError) {
            console.error('Customer creation error:', customerError);
            failed++;
            errors.push(`Kunde konnte nicht erstellt werden: ${name}`);
            continue;
          }

          customerId = newCustomer.id;
          console.log(`Created customer: ${name} (${customerId})`);
        }

        // Parse amounts
        const netAmountNum = typeof netAmount === 'number' ? netAmount : parseFloat(netAmount?.toString().replace(',', '.') || '0');
        const grossAmountNum = typeof grossAmount === 'number' ? grossAmount : parseFloat(grossAmount?.toString().replace(',', '.') || '0');
        
        // Calculate tax
        const taxAmount = grossAmountNum - netAmountNum;
        const taxRate = netAmountNum > 0 ? (taxAmount / netAmountNum) * 100 : 19.0;

        // Check if invoice exists
        const { data: existingInvoice } = await supabaseClient
          .from('invoices')
          .select('id')
          .eq('invoice_number', invoiceNumber)
          .maybeSingle();

        if (existingInvoice) {
          // Update existing
          const { error: updateError } = await supabaseClient
            .from('invoices')
            .update({
              customer_id: customerId,
              invoice_date: invoiceDate || `${year}-06-15`,
              status: status,
              subtotal: netAmountNum,
              tax_rate: taxRate,
              tax_amount: taxAmount,
              total_amount: grossAmountNum
            })
            .eq('id', existingInvoice.id);

          if (updateError) {
            console.error('Invoice update error:', updateError);
            failed++;
            errors.push(`Rechnung konnte nicht aktualisiert werden: ${invoiceNumber}`);
            continue;
          }

          // Update or create invoice item
          const { data: existingItem } = await supabaseClient
            .from('invoice_items')
            .select('id')
            .eq('invoice_id', existingInvoice.id)
            .maybeSingle();

          if (existingItem) {
            await supabaseClient
              .from('invoice_items')
              .update({
                description: `Rechnung ${invoiceNumber}`,
                quantity: 1,
                unit_price: netAmountNum,
                total_price: netAmountNum
              })
              .eq('id', existingItem.id);
          } else {
            await supabaseClient
              .from('invoice_items')
              .insert({
                invoice_id: existingInvoice.id,
                description: `Rechnung ${invoiceNumber}`,
                quantity: 1,
                unit_price: netAmountNum,
                total_price: netAmountNum
              });
          }

          updated++;
          console.log(`Updated invoice: ${invoiceNumber}`);
        } else {
          // Create new invoice
          const { data: newInvoice, error: invoiceError } = await supabaseClient
            .from('invoices')
            .insert({
              customer_id: customerId,
              invoice_number: invoiceNumber,
              invoice_date: invoiceDate || `${year}-06-15`,
              status: status,
              subtotal: netAmountNum,
              tax_rate: taxRate,
              tax_amount: taxAmount,
              total_amount: grossAmountNum
            })
            .select('id')
            .single();

          if (invoiceError) {
            console.error('Invoice creation error:', invoiceError);
            failed++;
            errors.push(`Rechnung konnte nicht erstellt werden: ${invoiceNumber}`);
            continue;
          }

          // Create invoice item
          await supabaseClient
            .from('invoice_items')
            .insert({
              invoice_id: newInvoice.id,
              description: `Rechnung ${invoiceNumber}`,
              quantity: 1,
              unit_price: netAmountNum,
              total_price: netAmountNum
            });

          created++;
          console.log(`Created invoice: ${invoiceNumber}`);
        }

        successful++;
      } catch (rowError) {
        console.error('Row processing error:', rowError);
        failed++;
        errors.push(`Fehler in Zeile: ${JSON.stringify(row)}`);
      }
    }

    console.log(`Import completed: ${successful} successful (${created} created, ${updated} updated), ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: rows.length,
        successful,
        created,
        updated,
        failed,
        errors
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
