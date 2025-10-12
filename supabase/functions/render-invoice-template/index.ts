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
    
    // Lade Rechnung oder verwende Demo-Daten
    let invoice: any;
    
    if (invoiceId && invoiceId !== 'null' && invoiceId !== null) {
      const { data: invoiceData, error: invoiceError } = await supabase
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
      invoice = invoiceData;
    } else {
      // Demo-Daten für Vorschau
      console.log('Using demo data for preview');
      invoice = {
        invoice_number: 'DEMO-001',
        invoice_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        custom_message: customizations?.custom_message || 'Vielen Dank für Ihren Einkauf!',
        subtotal: 125.00,
        tax_rate: 19,
        tax_amount: 23.75,
        total_amount: 148.75,
        customer: {
          name: 'Max Mustermann',
          address: 'Musterstraße 123',
          postal_code: '12345',
          city: 'Musterstadt',
          email: 'max@example.com',
          phone: '+49 123 456789'
        },
        items: [
          {
            description: 'Eismotion Classic 500ml',
            quantity: 2,
            unit_price: 45.00,
            total_price: 90.00
          },
          {
            description: 'Eismotion Deluxe 750ml',
            quantity: 1,
            unit_price: 35.00,
            total_price: 35.00
          }
        ]
      };
    }
    
    // Template-Variablen ersetzen
    let html = template.html_template || '';
    let css = template.css_styles || '';
    
    // Alle Template-Variablen ersetzen
    html = html.replace(/{{company_name}}/g, 'Eismotion');
    html = html.replace(/{{logo_url}}/g, '');
    
    // Customer Info
    html = html.replace(/{{customer_name}}/g, invoice.customer?.name || 'N/A');
    html = html.replace(/{{customer_address}}/g, invoice.customer?.address || '');
    html = html.replace(/{{customer_postal_code}}/g, invoice.customer?.postal_code || '');
    html = html.replace(/{{customer_city}}/g, invoice.customer?.city || '');
    
    // Invoice Details
    html = html.replace(/{{invoice_number}}/g, invoice.invoice_number || '');
    html = html.replace(/{{invoice_date}}/g, new Date(invoice.invoice_date).toLocaleDateString('de-DE'));
    html = html.replace(/{{due_date}}/g, new Date(invoice.due_date).toLocaleDateString('de-DE'));
    
    // Custom Message - entferne handlebars Syntax
    const customMessage = customizations?.custom_message || invoice.custom_message || 'Vielen Dank für Ihren Einkauf!';
    html = html.replace(/{{#if custom_message}}[\s\S]*?{{custom_message}}[\s\S]*?{{\/if}}/g, customMessage ? `<div class="custom-message">${customMessage}</div>` : '');
    html = html.replace(/{{custom_message}}/g, customMessage);
    
    // Items - entferne handlebars each loop
    const itemsHTML = invoice.items?.map((item: any) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${Number(item.unit_price).toFixed(2)} €</td>
        <td style="text-align: right;">${Number(item.total_price).toFixed(2)} €</td>
      </tr>
    `).join('') || '';
    
    html = html.replace(/{{#each items}}[\s\S]*?{{\/each}}/g, itemsHTML);
    
    // Totals
    html = html.replace(/{{subtotal}}/g, Number(invoice.subtotal).toFixed(2));
    html = html.replace(/{{tax_rate}}/g, invoice.tax_rate.toString());
    html = html.replace(/{{tax_amount}}/g, Number(invoice.tax_amount).toFixed(2));
    html = html.replace(/{{total_amount}}/g, Number(invoice.total_amount).toFixed(2));
    
    // Custom Design überschreiben
    if (customizations?.colors) {
      const colors = customizations.colors;
      if (colors.primary) css += `.custom-primary { color: ${colors.primary}; }`;
      if (colors.secondary) css += `.custom-secondary { background: ${colors.secondary}; }`;
    }
    
    // Wenn das Template bereits ein vollständiges HTML-Dokument ist, nicht erneut wrappen
    const hasFullDoc = /<!DOCTYPE|<html[\s\S]*<head[\s\S]*<body/i.test(html);

    let fullHTML: string;
    if (hasFullDoc) {
      // CSS injizieren
      if (html.includes('{{css}}')) {
        html = html.replace(/{{css}}/g, css);
      } else if (css && html.includes('</head>')) {
        html = html.replace('</head>', `<style>${css}</style></head>`);
      }
      fullHTML = html;
    } else {
      fullHTML = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Rechnung ${invoice.invoice_number}</title>
          <style>
            ${css}
            html, body { height: 100%; }
            body { background: #fff; color: #111; }
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
    }
    
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