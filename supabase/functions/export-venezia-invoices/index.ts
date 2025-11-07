import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('🔍 Fetching all Venezia invoices...');

    // Fetch all invoices from customers with "Venezia" in their name
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        invoice_date,
        total_amount,
        subtotal,
        id,
        customer_id,
        customers!inner (
          name,
          address,
          postal_code,
          city
        )
      `)
      .ilike('customers.name', '%venezia%')
      .order('invoice_date', { ascending: true })
      .order('invoice_number', { ascending: true });

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${invoices.length} Venezia invoices`);

    // Create CSV content
    const csvHeader = 'invoice_number,invoice_date,customer_name,address,postal_code,city,subtotal,total_amount,invoice_id,customer_id\n';
    
    const csvRows = invoices.map(inv => {
      const customer = inv.customers as any;
      return [
        inv.invoice_number,
        inv.invoice_date,
        `"${customer.name.replace(/"/g, '""')}"`,
        `"${(customer.address || '').replace(/"/g, '""')}"`,
        customer.postal_code || '',
        customer.city || '',
        inv.subtotal,
        inv.total_amount,
        inv.id,
        inv.customer_id
      ].join(',');
    });

    const csvContent = csvHeader + csvRows.join('\n');

    console.log(`📄 Generated CSV with ${csvRows.length} rows`);

    // Also return JSON for easy viewing
    const formattedData = invoices.map(inv => {
      const customer = inv.customers as any;
      return {
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        customer_name: customer.name,
        address: customer.address,
        postal_code: customer.postal_code,
        city: customer.city,
        subtotal: inv.subtotal,
        total_amount: inv.total_amount,
        invoice_id: inv.id,
        customer_id: inv.customer_id
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        total_invoices: invoices.length,
        csv_content: csvContent,
        invoices: formattedData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in export-venezia-invoices:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
