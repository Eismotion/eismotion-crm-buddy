import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, templateId, customizations } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Rendering invoice ${invoiceId} with template ${templateId}`);
    
    // Lade Template
    const { data: template, error: templateError } = await supabase
      .from('invoice_templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (templateError) {
      console.error('Template error:', templateError);
      throw new Error(`Template nicht gefunden: ${templateError.message}`);
    }
    
    // Lade Rechnung mit Kunde und Items
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        items:invoice_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', invoiceId)
      .single();
    
    if (invoiceError) {
      console.error('Invoice error:', invoiceError);
      throw new Error(`Rechnung nicht gefunden: ${invoiceError.message}`);
    }
    
    // Template-Variablen ersetzen
    let html = template.html_template || '';
    let css = template.css_styles || '';
    
    // Company Name
    html = html.replace(/{{company_name}}/g, 'Eismotion');
    
    // Custom Message
    const customMessage = customizations?.custom_message || invoice.custom_message || 'Vielen Dank für Ihren Einkauf!';
    html = html.replace(/{{custom_message}}/g, customMessage);
    
    // Rechnung Content generieren
    const contentHTML = `
      <div class="invoice-details">
        <div class="invoice-header">
          <h2>Rechnung ${invoice.invoice_number}</h2>
          <p>Datum: ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</p>
        </div>
        
        <div class="customer-info">
          <h3>Kunde</h3>
          <p>${invoice.customer?.name || 'N/A'}</p>
          <p>${invoice.customer?.address || ''}</p>
          <p>${invoice.customer?.postal_code || ''} ${invoice.customer?.city || ''}</p>
        </div>
        
        <div class="items-table">
          <table>
            <thead>
              <tr>
                <th>Beschreibung</th>
                <th>Menge</th>
                <th>Preis</th>
                <th>Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items?.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>€${Number(item.unit_price).toFixed(2)}</td>
                  <td>€${Number(item.total_price).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>
        
        <div class="totals">
          <p>Zwischensumme: €${Number(invoice.subtotal).toFixed(2)}</p>
          <p>MwSt (${invoice.tax_rate}%): €${Number(invoice.tax_amount).toFixed(2)}</p>
          <p><strong>Gesamt: €${Number(invoice.total_amount).toFixed(2)}</strong></p>
        </div>
      </div>
    `;
    
    html = html.replace(/{{content}}/g, contentHTML);
    html = html.replace(/{{css}}/g, css);
    
    // Custom Design überschreiben
    if (customizations?.colors) {
      const colors = customizations.colors;
      if (colors.primary) css += `.custom-primary { color: ${colors.primary}; }`;
      if (colors.secondary) css += `.custom-secondary { background: ${colors.secondary}; }`;
    }
    
    const fullHTML = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rechnung ${invoice.invoice_number}</title>
        <style>
          ${css}
          .invoice-details { padding: 20px; }
          .items-table { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .totals { margin-top: 20px; text-align: right; }
          .customer-info { margin: 20px 0; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    console.log('Template successfully rendered');
    
    return new Response(JSON.stringify({ 
      html: fullHTML,
      invoice_id: invoiceId,
      template_id: templateId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error rendering template:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});