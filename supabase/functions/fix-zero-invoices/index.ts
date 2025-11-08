import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface InvoiceItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  tax_rate: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Suche nach 0€-Rechnungen...');

    // Find all invoices with total_amount = 0
    const { data: zeroInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_id, tax_rate, subtotal, tax_amount, total_amount')
      .eq('total_amount', 0)
      .order('invoice_date');

    if (fetchError) {
      throw new Error(`Fehler beim Laden der Rechnungen: ${fetchError.message}`);
    }

    if (!zeroInvoices || zeroInvoices.length === 0) {
      console.log('✅ Keine 0€-Rechnungen gefunden');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Keine 0€-Rechnungen gefunden',
          fixed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log(`📋 ${zeroInvoices.length} 0€-Rechnungen gefunden`);

    const results = {
      total: zeroInvoices.length,
      fixed: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as any[]
    };

    for (const invoice of zeroInvoices) {
      try {
        console.log(`\n🔧 Verarbeite Rechnung ${invoice.invoice_number} (${invoice.id})`);

        // Get all invoice items for this invoice
        const { data: items, error: itemsError } = await supabase
          .from('invoice_items')
          .select('id, quantity, unit_price, total_price')
          .eq('invoice_id', invoice.id);

        if (itemsError) {
          throw new Error(`Fehler beim Laden der Positionen: ${itemsError.message}`);
        }

        if (!items || items.length === 0) {
          console.log(`⚠️ Keine Positionen gefunden für Rechnung ${invoice.invoice_number}`);
          results.skipped++;
          results.details.push({
            invoice_number: invoice.invoice_number,
            status: 'skipped',
            reason: 'Keine Positionen vorhanden'
          });
          continue;
        }

        console.log(`  📦 ${items.length} Positionen gefunden`);

        // Calculate subtotal from all items
        const calculatedSubtotal = items.reduce((sum, item) => {
          const itemTotal = Number(item.total_price) || 0;
          console.log(`    - Position: ${item.quantity}x ${item.unit_price}€ = ${itemTotal}€`);
          return sum + itemTotal;
        }, 0);

        // Calculate tax and total
        const taxRate = Number(invoice.tax_rate) || 19;
        const calculatedTaxAmount = calculatedSubtotal * (taxRate / 100);
        const calculatedTotalAmount = calculatedSubtotal + calculatedTaxAmount;

        console.log(`  💰 Berechnung:`);
        console.log(`     Zwischensumme: ${calculatedSubtotal.toFixed(2)}€`);
        console.log(`     MwSt (${taxRate}%): ${calculatedTaxAmount.toFixed(2)}€`);
        console.log(`     Gesamtsumme: ${calculatedTotalAmount.toFixed(2)}€`);

        // Update the invoice
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            subtotal: calculatedSubtotal,
            tax_amount: calculatedTaxAmount,
            total_amount: calculatedTotalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', invoice.id);

        if (updateError) {
          throw new Error(`Fehler beim Update: ${updateError.message}`);
        }

        console.log(`  ✅ Rechnung ${invoice.invoice_number} erfolgreich aktualisiert`);
        results.fixed++;
        results.details.push({
          invoice_number: invoice.invoice_number,
          status: 'fixed',
          old_total: 0,
          new_total: calculatedTotalAmount,
          items_count: items.length
        });

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`  ❌ Fehler bei Rechnung ${invoice.invoice_number}: ${errorMsg}`);
        results.errors.push(`${invoice.invoice_number}: ${errorMsg}`);
      }
    }

    console.log('\n📊 Zusammenfassung:');
    console.log(`   Gesamt: ${results.total}`);
    console.log(`   Korrigiert: ${results.fixed}`);
    console.log(`   Übersprungen: ${results.skipped}`);
    console.log(`   Fehler: ${results.errors.length}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        ...results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (err) {
    console.error('❌ Fehler in fix-zero-invoices:', err);
    const message = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Unknown error');
    return new Response(
      JSON.stringify({ error: message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
