import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Standard-Template wenn kein Template ausgewählt wurde
function getDefaultTemplate() {
  return `
    <div class="page">
      <div class="header">
        <h1>RECHNUNG</h1>
        <div class="company-info">
          <strong>Eismotion</strong><br>
          Ihre Eisdiele<br>
          Beispielstraße 1<br>
          12345 Stadt
        </div>
      </div>
      
      <div class="top-address">
        <p><strong>{{customer_name}}</strong><br>
        {{customer_address}}<br>
        {{customer_postal_code}} {{customer_city}}</p>
      </div>
      
      <div class="content">
        <div class="invoice-details">
          <p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
          <p><strong>Rechnungsdatum:</strong> {{invoice_date}}</p>
          <p><strong>Fälligkeitsdatum:</strong> {{due_date}}</p>
        </div>
        
        <div class="custom-message">
          {{custom_message}}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th style="text-align: center;">Menge</th>
              <th style="text-align: right;">Einzelpreis</th>
              <th style="text-align: right;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{description}}</td>
              <td style="text-align: center;">{{quantity}}</td>
              <td style="text-align: right;">{{unit_price}} €</td>
              <td style="text-align: right;">{{total_price}} €</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        
        <div class="totals">
          <p><strong>Zwischensumme:</strong> {{subtotal}} €</p>
          <p><strong>MwSt ({{tax_rate}}%):</strong> {{tax_amount}} €</p>
          <p class="total"><strong>Gesamtbetrag:</strong> {{total_amount}} €</p>
        </div>
      </div>
      
      <div class="footer">
        <p>Vielen Dank für Ihren Einkauf!</p>
      </div>
    </div>
  `;
}

function getDefaultCSS() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; padding: 20px; background: #f8f9fa; }
    .header h1 { font-size: 32px; color: #2c3e50; margin-bottom: 10px; }
    .company-info { font-size: 12px; color: #666; }
    .top-address { margin-bottom: 30px; }
    .invoice-details { margin-bottom: 20px; }
    .custom-message { margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #007bff; }
    .items-table { width: 100%; margin: 30px 0; border-collapse: collapse; }
    .items-table th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #dee2e6; }
    .items-table td { padding: 10px; border-bottom: 1px solid #dee2e6; }
    .totals { margin-top: 30px; text-align: right; }
    .totals p { margin: 8px 0; }
    .totals .total { font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #333; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #666; font-size: 12px; }
  `;
}

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
    
    // Lade Template (optional)
    let template: any = null;
    
    if (templateId && templateId !== 'null' && templateId !== null) {
      const { data: templateData, error: templateError } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (templateError) {
        console.warn('Template not found, using default:', templateError);
      } else {
        template = templateData;
      }
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
    
    // Template-Variablen ersetzen oder Standard-Template verwenden
    let html = template?.html_template || getDefaultTemplate();
    let css = template?.css_styles || getDefaultCSS();

    // Hintergrundbild aus Template hinzufügen
    const backgroundImage = template?.background_storage_url || template?.background_base64;
    if (backgroundImage) {
      css += `
        .header{background-image:url('${backgroundImage}') !important;background-size:cover;background-position:center;}
        .page{position:relative;}
        .page::before{content:"";position:absolute;inset:0 0 auto 0;height:230px;background:url('${backgroundImage}') center/cover no-repeat;z-index:0;}
        .top-address,.content,.footer,.footer-bar{position:relative;z-index:1;background:transparent;}
      `;
      console.log('Applied template background image');
    }

    // Führendes IMG in Hintergrundbild umwandeln (falls Nutzer ein Bild oben eingefügt hat)
    try {
      // Suche nach einem IMG vor dem ersten <!DOCTYPE> oder <html>
      const firstDocIndex = html.search(/<!DOCTYPE|<html/i);
      const prefix = firstDocIndex > -1 ? html.slice(0, firstDocIndex) : html;
      const body = firstDocIndex > -1 ? html.slice(firstDocIndex) : '';
      const imgMatch = prefix.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
      if (imgMatch) {
        const imgUrl = imgMatch[1];
        // Entferne das gefundene Bild aus dem Prefix
        const cleanedPrefix = prefix.replace(imgMatch[0], '');
        html = (firstDocIndex > -1 ? cleanedPrefix + body : cleanedPrefix);
        // Erzwinge Hintergrund im Header und zusätzlich als ::before-Fallback
        css += `
          .header{background-image:url('${imgUrl}') !important;background-size:cover;background-position:center;}
          .page{position:relative;}
          .page::before{content:"";position:absolute;inset:0 0 auto 0;height:230px;background:url('${imgUrl}') center/cover no-repeat;z-index:0;}
          .top-address,.content,.footer,.footer-bar{position:relative;z-index:1;background:transparent;}
        `;
        console.log('Applied uploaded image as background:', imgUrl);
      }
    } catch (err) {
      const msg = (err as any)?.message ?? String(err);
      console.log('IMG transform skipped:', msg);
    }
    
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
    
    // Erstelle Data-URL für PDF-Vorschau
    const dataUrl = `data:text/html;base64,${btoa(unescape(encodeURIComponent(fullHTML)))}`;
    
    return new Response(JSON.stringify({ 
      html: fullHTML,
      pdfUrl: dataUrl,
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