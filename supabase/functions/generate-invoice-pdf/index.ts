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
    console.log('PDF Generation: Starting process');
    
    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        template:invoice_templates(*),
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    console.log('Fetched invoice:', invoice.invoice_number);

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    // Format date
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('de-DE');
    };

    // Build invoice content HTML
    let itemsHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
    itemsHtml += '<thead><tr style="background: #f5f5f5;">';
    itemsHtml += '<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Position</th>';
    itemsHtml += '<th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Menge</th>';
    itemsHtml += '<th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Einzelpreis</th>';
    itemsHtml += '<th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Gesamt</th>';
    itemsHtml += '</tr></thead><tbody>';

    for (const item of invoice.items) {
      itemsHtml += '<tr>';
      itemsHtml += `<td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>`;
      itemsHtml += `<td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${item.quantity}</td>`;
      itemsHtml += `<td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(item.unit_price)}</td>`;
      itemsHtml += `<td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${formatCurrency(item.total_price)}</td>`;
      itemsHtml += '</tr>';
    }

    itemsHtml += '</tbody></table>';

    // Build content
    const content = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <div style="margin-bottom: 30px;">
          <h2 style="margin: 0;">Rechnung ${invoice.invoice_number}</h2>
          <p style="margin: 5px 0;">Datum: ${formatDate(invoice.invoice_date)}</p>
          ${invoice.due_date ? `<p style="margin: 5px 0;">Fällig am: ${formatDate(invoice.due_date)}</p>` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0;">Kunde</h3>
          <p style="margin: 2px 0;"><strong>${invoice.customer.name}</strong></p>
          ${invoice.customer.email ? `<p style="margin: 2px 0;">${invoice.customer.email}</p>` : ''}
          ${invoice.customer.phone ? `<p style="margin: 2px 0;">${invoice.customer.phone}</p>` : ''}
          ${invoice.customer.address ? `<p style="margin: 2px 0;">${invoice.customer.address}</p>` : ''}
          ${invoice.customer.city ? `<p style="margin: 2px 0;">${invoice.customer.postal_code || ''} ${invoice.customer.city}</p>` : ''}
        </div>

        <h3 style="margin: 20px 0 10px 0;">Positionen</h3>
        ${itemsHtml}

        <div style="margin-top: 30px; text-align: right;">
          <table style="margin-left: auto; min-width: 300px;">
            <tr>
              <td style="padding: 5px;"><strong>Zwischensumme:</strong></td>
              <td style="padding: 5px; text-align: right;">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 5px;"><strong>MwSt. (${invoice.tax_rate}%):</strong></td>
              <td style="padding: 5px; text-align: right;">${formatCurrency(invoice.tax_amount)}</td>
            </tr>
            <tr style="border-top: 2px solid #333;">
              <td style="padding: 10px 5px;"><strong>Gesamtbetrag:</strong></td>
              <td style="padding: 10px 5px; text-align: right; font-size: 1.2em;"><strong>${formatCurrency(invoice.total_amount)}</strong></td>
            </tr>
          </table>
        </div>

        ${invoice.notes ? `<div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 3px solid #333;"><p style="margin: 0;"><strong>Notizen:</strong> ${invoice.notes}</p></div>` : ''}

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 0.9em;">
          <p>Vielen Dank für Ihren Auftrag!</p>
        </div>
      </div>
    `;

    // Get template or use default
    let htmlTemplate = invoice.template?.html_template || 
      '<!DOCTYPE html><html><head><style>{{css}}</style></head><body><div class="content">{{content}}</div></body></html>';
    
    let cssStyles = invoice.template?.css_styles || 
      'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }';

    // Replace placeholders
    const finalHtml = htmlTemplate
      .replace('{{css}}', cssStyles)
      .replace('{{content}}', content);

    console.log('PDF generation completed for invoice:', invoice.invoice_number);

    // Return HTML for now (PDF generation would require additional library)
    // In production, you would use a library like puppeteer or pdfmake
    return new Response(
      JSON.stringify({
        success: true,
        invoiceNumber: invoice.invoice_number,
        html: finalHtml,
        message: 'HTML generated successfully. PDF generation requires additional setup.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('PDF generation error:', error);
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
