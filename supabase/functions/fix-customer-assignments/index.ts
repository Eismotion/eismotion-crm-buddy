import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting customer assignment fix...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Helper function to extract PLZ from address
    const extractPLZ = (address: string | null): string | null => {
      if (!address) return null;
      const match = address.match(/\d{5}/);
      return match ? match[0] : null;
    };

    // Step 1: Get all customers grouped by name to find duplicates
    console.log('Step 1: Finding duplicate customer names...');
    const { data: allCustomers, error: customersError } = await supabaseClient
      .from('customers')
      .select('id, name, address, postal_code')
      .order('name');

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      throw customersError;
    }

    // Build map: name -> list of customers with that name
    const customersByName = new Map<string, Array<{id: string; name: string; address: string; postal_code: string | null}>>();
    
    for (const customer of allCustomers || []) {
      const lowerName = (customer.name || '').toLowerCase().trim();
      if (!customersByName.has(lowerName)) {
        customersByName.set(lowerName, []);
      }
      customersByName.get(lowerName)!.push({
        id: customer.id,
        name: customer.name || '',
        address: customer.address || '',
        postal_code: customer.postal_code
      });
    }

    // Find only duplicate names (>1 customer with same name)
    const duplicateNames = Array.from(customersByName.entries())
      .filter(([_, customers]) => customers.length > 1)
      .map(([name, customers]) => ({ name, customers }));

    console.log(`Found ${duplicateNames.length} duplicate customer names`);

    // Step 2: Get all invoices
    const { data: allInvoices, error: invoicesError } = await supabaseClient
      .from('invoices')
      .select('id, customer_id, invoice_number, customers(id, name, address, postal_code)')
      .limit(2000);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      throw invoicesError;
    }

    console.log(`Found ${allInvoices?.length || 0} invoices to check`);

    // Step 3: Build correction map
    const corrections: Array<{
      invoiceId: string;
      oldCustomerId: string;
      newCustomerId: string;
      invoiceNumber: string;
      oldCustomerName: string;
      newCustomerName: string;
      oldAddress: string;
      newAddress: string;
      matchedBy: string;
    }> = [];

    for (const invoice of allInvoices || []) {
      if (!invoice.customers) continue;

      const currentCustomer = invoice.customers as any;
      const lowerName = (currentCustomer.name || '').toLowerCase().trim();
      
      // Check if this customer name has duplicates
      const duplicateEntry = duplicateNames.find(d => d.name === lowerName);
      if (!duplicateEntry) continue;

      const currentPLZ = currentCustomer.postal_code || extractPLZ(currentCustomer.address);
      const currentAddress = (currentCustomer.address || '').toLowerCase().trim();

      // Find best match among duplicate customers
      let bestMatch = null;
      let matchReason = '';

      for (const candidate of duplicateEntry.customers) {
        // Skip if it's the same customer
        if (candidate.id === invoice.customer_id) continue;

        const candidatePLZ = candidate.postal_code || extractPLZ(candidate.address);
        const candidateAddress = (candidate.address || '').toLowerCase().trim();

        // Match by PLZ (strongest signal)
        if (currentPLZ && candidatePLZ && currentPLZ === candidatePLZ) {
          bestMatch = candidate;
          matchReason = `PLZ ${currentPLZ}`;
          break;
        }

        // Match by address substring (weaker signal)
        if (currentAddress && candidateAddress && 
            (currentAddress.includes(candidateAddress.slice(0, 15)) || 
             candidateAddress.includes(currentAddress.slice(0, 15)))) {
          bestMatch = candidate;
          matchReason = 'Adress-Match';
        }
      }

      // If we found a better match, add to corrections
      if (bestMatch && bestMatch.id !== invoice.customer_id) {
        corrections.push({
          invoiceId: invoice.id,
          oldCustomerId: invoice.customer_id,
          newCustomerId: bestMatch.id,
          invoiceNumber: invoice.invoice_number || 'unknown',
          oldCustomerName: currentCustomer.name,
          newCustomerName: bestMatch.name,
          oldAddress: currentCustomer.address || '',
          newAddress: bestMatch.address || '',
          matchedBy: matchReason
        });
      }
    }

    console.log(`Found ${corrections.length} corrections to apply`);

    // Step 3: Apply corrections
    let successCount = 0;
    const errors: string[] = [];

    for (const correction of corrections) {
      const { error: updateError } = await supabaseClient
        .from('invoices')
        .update({ customer_id: correction.newCustomerId })
        .eq('id', correction.invoiceId);

      if (updateError) {
        console.error(`Error updating invoice ${correction.invoiceNumber}:`, updateError);
        errors.push(`${correction.invoiceNumber}: ${updateError.message}`);
      } else {
        successCount++;
        console.log(`✓ Corrected ${correction.invoiceNumber}: ${correction.oldCustomerName} (${correction.oldAddress.slice(0, 30)}) → ${correction.newCustomerName} (${correction.newAddress.slice(0, 30)}) [${correction.matchedBy}]`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total corrections applied: ${successCount}/${corrections.length}`);
    console.log(`Errors: ${errors.length}`);

    // Step 4: No cleanup needed (no temp columns used)

    // Step 5: Update customer statistics for affected customers
    const affectedCustomerIds = [
      ...new Set([
        ...corrections.map(c => c.oldCustomerId),
        ...corrections.map(c => c.newCustomerId)
      ])
    ];

    for (const customerId of affectedCustomerIds) {
      // Calculate total_spent
      const { data: paidInvoices } = await supabaseClient
        .from('invoices')
        .select('total_amount')
        .eq('customer_id', customerId)
        .eq('status', 'bezahlt');

      const totalSpent = paidInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      // Calculate total_orders
      const { count } = await supabaseClient
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      // Update customer
      await supabaseClient
        .from('customers')
        .update({
          total_spent: totalSpent,
          total_orders: count || 0
        })
        .eq('id', customerId);
    }

    // Step 6: Validate - check all Venezia customers
    console.log('\n=== Validierung: Alle "Eiscafe Venezia" ===');
    
    const { data: veneziaCustomers } = await supabaseClient
      .from('customers')
      .select('id, name, address, postal_code')
      .ilike('name', '%Venezia%')
      .order('postal_code');

    const veneziaStats = [];
    for (const customer of veneziaCustomers || []) {
      const { data: invoices } = await supabaseClient
        .from('invoices')
        .select('total_amount')
        .eq('customer_id', customer.id)
        .neq('status', 'storniert')
        .neq('status', 'cancelled');

      const invoiceCount = invoices?.length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      veneziaStats.push({
        name: customer.name,
        address: customer.address?.slice(0, 40) || '',
        postal_code: customer.postal_code || extractPLZ(customer.address),
        invoiceCount,
        totalRevenue: totalRevenue.toFixed(2)
      });

      console.log(`${customer.name} | ${customer.address?.slice(0, 40)} | ${customer.postal_code || extractPLZ(customer.address)} | ${invoiceCount} Rechnungen | ${totalRevenue.toFixed(2)} €`);
    }

    // Step 7: Get new top 5 customers from view
    const { data: topCustomersView } = await supabaseClient
      .from('top_customers')
      .select('*')
      .order('revenue', { ascending: false })
      .limit(5);

    return new Response(
      JSON.stringify({
        success: true,
        correctionsApplied: successCount,
        totalCorrections: corrections.length,
        errors: errors,
        validation: {
          veneziaCustomers: veneziaStats,
          topCustomers: topCustomersView || []
        },
        affectedCustomers: affectedCustomerIds.length,
        sampleCorrections: corrections.slice(0, 10)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Fix customer assignments error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
