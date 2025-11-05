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

    // Step 1: Find all invoices with temp columns (from migration)
    const { data: invoicesWithTemp, error: tempError } = await supabaseClient
      .from('invoices')
      .select('id, customer_id, customer_name_temp, customer_address_temp')
      .not('customer_name_temp', 'is', null)
      .limit(1000);

    if (tempError) {
      console.error('Error fetching invoices:', tempError);
      throw tempError;
    }

    console.log(`Found ${invoicesWithTemp?.length || 0} invoices to check`);

    // Step 2: Build correction map
    const corrections: Array<{
      invoiceId: string;
      oldCustomerId: string;
      newCustomerId: string;
      invoiceNumber: string;
      oldCustomerName: string;
      newCustomerName: string;
    }> = [];

    for (const invoice of invoicesWithTemp || []) {
      const invoicePLZ = extractPLZ(invoice.customer_address_temp);
      
      // Find correct customer by name + PLZ
      const { data: matchingCustomers } = await supabaseClient
        .from('customers')
        .select('id, name, address')
        .ilike('name', invoice.customer_name_temp);

      if (matchingCustomers && matchingCustomers.length > 0) {
        let correctCustomer = null;

        // Try to match by PLZ if multiple customers
        if (matchingCustomers.length > 1 && invoicePLZ) {
          correctCustomer = matchingCustomers.find(c => extractPLZ(c.address) === invoicePLZ);
        } else {
          correctCustomer = matchingCustomers[0];
        }

        if (correctCustomer && correctCustomer.id !== invoice.customer_id) {
          // Get invoice number for logging
          const { data: invData } = await supabaseClient
            .from('invoices')
            .select('invoice_number')
            .eq('id', invoice.id)
            .single();

          // Get old customer name
          const { data: oldCustomer } = await supabaseClient
            .from('customers')
            .select('name')
            .eq('id', invoice.customer_id)
            .single();

          corrections.push({
            invoiceId: invoice.id,
            oldCustomerId: invoice.customer_id,
            newCustomerId: correctCustomer.id,
            invoiceNumber: invData?.invoice_number || 'unknown',
            oldCustomerName: oldCustomer?.name || 'unknown',
            newCustomerName: correctCustomer.name
          });
        }
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
        console.log(`✓ Corrected ${correction.invoiceNumber}: ${correction.oldCustomerName} → ${correction.newCustomerName}`);
      }
    }

    // Step 4: Clean up temp columns (done via migration, skip here)

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

    // Step 6: Validate - check specific invoice
    const { data: testInvoice } = await supabaseClient
      .from('invoices')
      .select('invoice_number, customers(name, address)')
      .eq('invoice_number', '07/2025/956')
      .single();

    // Step 7: Get new top customers
    const { data: topCustomers } = await supabaseClient
      .from('invoices')
      .select('customer_id, total_amount, customers(name, address)')
      .neq('status', 'storniert')
      .order('total_amount', { ascending: false })
      .limit(100);

    const customerMap = new Map<string, { name: string; address: string; totalRevenue: number; invoiceCount: number }>();
    
    topCustomers?.forEach((inv: any) => {
      if (!inv.customer_id || !inv.customers) return;
      const existing = customerMap.get(inv.customer_id);
      if (existing) {
        existing.totalRevenue += Number(inv.total_amount || 0);
        existing.invoiceCount++;
      } else {
        customerMap.set(inv.customer_id, {
          name: inv.customers.name,
          address: inv.customers.address,
          totalRevenue: Number(inv.total_amount || 0),
          invoiceCount: 1
        });
      }
    });

    const topCustomersList = Array.from(customerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        success: true,
        correctionsApplied: successCount,
        totalCorrections: corrections.length,
        errors: errors,
        validation: {
          testInvoice: testInvoice,
          topCustomers: topCustomersList
        },
        affectedCustomers: affectedCustomerIds.length
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
