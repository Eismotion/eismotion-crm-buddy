import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    console.log('Starting PDF generation function');

    const { invoiceId } = await req.json();
    
    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoice with customer and items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customers (*),
        invoice_items (*,
          products (*)
        ),
        invoice_templates (*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Error fetching invoice:', invoiceError);
      throw new Error('Invoice not found');
    }

    console.log(`Generating PDF for invoice ${invoice.invoice_number}`);

    // Get template or use default
    const template = invoice.invoice_templates || {
      html_template: '<!DOCTYPE html><html><head><style>{{css}}</style></head><body><div class="header"><h1>Eismotion</h1></div><div class="content">{{content}}</div></body></html>',
      css_styles: 'body { font-family: Arial, sans-serif; padding: 20px; } .header { background: #0d47a1; color: white; padding: 20px; text-align: center; }'
    };

    // Build invoice HTML content
    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('de-DE');
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('de-DE') : 'Sofort';
    
    const itemsHtml = invoice.invoice_items.map((item: any) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
        <td style="text-align: right;">${formatCurrency(item.total_price)}</td>
      </tr>
    `).join('');

    const contentHtml = `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <h2>Rechnung</h2>
            <p><strong>Rechnungsnummer:</strong> ${invoice.invoice_number}</p>
            <p><strong>Rechnungsdatum:</strong> ${invoiceDate}</p>
            <p><strong>Fälligkeitsdatum:</strong> ${dueDate}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>${invoice.customers.name}</strong></p>
            <p>${invoice.customers.email || ''}</p>
            <p>${invoice.customers.city || ''}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Beschreibung</th>
              <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd;">Menge</th>
              <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Einzelpreis</th>
              <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <p><strong>Zwischensumme:</strong> ${formatCurrency(invoice.subtotal)}</p>
          <p><strong>MwSt. (${invoice.tax_rate}%):</strong> ${formatCurrency(invoice.tax_amount)}</p>
          <p style="font-size: 1.2em; margin-top: 10px;"><strong>Gesamtbetrag:</strong> ${formatCurrency(invoice.total_amount)}</p>
        </div>

        ${invoice.notes ? `<div style="margin-top: 40px;"><p><strong>Notizen:</strong></p><p>${invoice.notes}</p></div>` : ''}
      </div>
    `;

    // Replace template placeholders
    let html = template.html_template
      .replace('{{css}}', template.css_styles)
      .replace('{{content}}', contentHtml);

    // For now, return HTML (PDF generation would require additional libraries)
    // In production, you would use a library like puppeteer or similar
    console.log('PDF generation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        html: html,
        message: 'HTML generated successfully. PDF generation requires additional setup.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-invoice-pdf function:', error);
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}
