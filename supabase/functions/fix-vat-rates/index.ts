import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VATCorrection {
  invoiceId: string;
  invoiceNumber: string;
  oldRate: number;
  newRate: number;
  oldSubtotal: number;
  newSubtotal: number;
  oldVatAmount: number;
  newVatAmount: number;
  totalAmount: number;
  country: string;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting VAT rate correction...');

    // Helper: Extract country from address
    const extractCountry = (address: string): string => {
      if (!address) return 'DE';
      
      const countryMatch = address.match(/\(([A-Z]{2})\)/);
      if (countryMatch) return countryMatch[1];
      
      const plzMatch = address.match(/\b\d{5}\b/);
      if (plzMatch) {
        const plz = parseInt(plzMatch[0]);
        if (plz >= 1000 && plz <= 52999) return 'ES';
        if (plz >= 1000 && plz <= 99999) return 'DE';
      }
      
      if (address.includes('España') || address.includes('Spain')) return 'ES';
      if (address.includes('Deutschland') || address.includes('Germany')) return 'DE';
      if (address.includes('Österreich') || address.includes('Austria')) return 'AT';
      if (address.includes('France') || address.includes('Frankreich')) return 'FR';
      if (address.includes('Italia') || address.includes('Italien')) return 'IT';
      if (address.includes('Nederland') || address.includes('Niederlande')) return 'NL';
      
      return 'DE';
    };

    // Helper: Get country VAT rate
    const getCountryVATRate = (country: string, hasValidVAT: boolean): number => {
      if (hasValidVAT && country !== 'DE') return 0.00; // Reverse Charge
      
      const rates: Record<string, number> = {
        DE: 0.19, ES: 0.21, AT: 0.20, FR: 0.20, IT: 0.22,
        NL: 0.21, BE: 0.21, PL: 0.23, PT: 0.23, SE: 0.25,
        DK: 0.25, FI: 0.24, IE: 0.23, LU: 0.17, GR: 0.24,
        CZ: 0.21, HU: 0.27, RO: 0.19, BG: 0.20, HR: 0.25,
        SI: 0.22, SK: 0.20, EE: 0.20, LV: 0.21, LT: 0.21,
        CY: 0.19, MT: 0.18
      };
      return rates[country] || 0.19;
    };

    // Step 1: Get all invoices with customer data
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from('invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        subtotal,
        tax_rate,
        tax_amount,
        total_amount,
        customers (
          id,
          name,
          address,
          country,
          vat_number,
          vat_validated
        )
      `)
      .not('customers', 'is', null)
      .limit(2000);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      throw invoicesError;
    }

    console.log(`Processing ${invoices?.length || 0} invoices...`);

    const corrections: VATCorrection[] = [];
    const errors: string[] = [];
    let corrected = 0;
    let skipped = 0;

    for (const invoice of invoices || []) {
      try {
        const customer = invoice.customers as any;
        if (!customer) {
          skipped++;
          continue;
        }

        // Determine country
        const country = customer.country || extractCountry(customer.address || '');
        
        // Determine correct VAT rate
        const hasValidVAT = customer.vat_validated && customer.vat_number;
        const correctRate = getCountryVATRate(country, hasValidVAT);
        
        // Round to 2 decimals for comparison
        const currentRate = Math.round((invoice.tax_rate || 0.19) * 10000) / 10000;
        const targetRate = Math.round(correctRate * 10000) / 10000;

        // Skip if rate is already correct
        if (Math.abs(currentRate - targetRate) < 0.0001) {
          skipped++;
          continue;
        }

        // Calculate new amounts
        const totalAmount = invoice.total_amount || 0;
        const newSubtotal = Math.round((totalAmount / (1 + correctRate)) * 100) / 100;
        const newVatAmount = Math.round((newSubtotal * correctRate) * 100) / 100;

        // Log correction
        const reason = hasValidVAT 
          ? `Reverse Charge (USt-ID: ${customer.vat_number})`
          : `${country} - ${(correctRate * 100).toFixed(0)}% MwSt`;

        corrections.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          oldRate: currentRate,
          newRate: targetRate,
          oldSubtotal: invoice.subtotal || 0,
          newSubtotal,
          oldVatAmount: invoice.tax_amount || 0,
          newVatAmount,
          totalAmount,
          country,
          reason
        });

        // Update invoice
        const { error: updateError } = await supabaseClient
          .from('invoices')
          .update({
            tax_rate: correctRate,
            subtotal: newSubtotal,
            tax_amount: newVatAmount
          })
          .eq('id', invoice.id);

        if (updateError) {
          errors.push(`Rechnung ${invoice.invoice_number}: ${updateError.message}`);
        } else {
          corrected++;
        }

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Rechnung ${invoice.invoice_number}: ${errorMsg}`);
      }
    }

    // Validation: Get updated stats
    const { data: stats } = await supabaseClient
      .rpc('get_invoice_counts_by_year')
      .limit(1);

    const { data: vatDistribution } = await supabaseClient
      .from('invoices')
      .select('tax_rate')
      .not('tax_rate', 'is', null);

    const distribution: Record<string, number> = {};
    vatDistribution?.forEach(inv => {
      const rate = ((inv.tax_rate || 0) * 100).toFixed(0) + '%';
      distribution[rate] = (distribution[rate] || 0) + 1;
    });

    console.log('VAT correction completed!');
    console.log(`Corrected: ${corrected}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: invoices?.length || 0,
          corrected,
          skipped,
          errors: errors.length
        },
        corrections: corrections.slice(0, 100), // First 100 corrections
        distribution,
        errors: errors.slice(0, 20) // First 20 errors
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
