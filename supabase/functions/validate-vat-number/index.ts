import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VatValidationRequest {
  customerId: string;
  vatNumber: string;
  countryCode: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { customerId, vatNumber, countryCode }: VatValidationRequest = await req.json();

    if (!customerId || !vatNumber || !countryCode) {
      throw new Error('customerId, vatNumber und countryCode sind erforderlich');
    }

    // Bereinige die USt-ID (entferne Leerzeichen, Bindestriche)
    const cleanVatNumber = vatNumber.replace(/[\s\-]/g, '').toUpperCase();
    
    // Basis-Validierung: Format prüfen
    const vatPattern = /^[A-Z]{2}[A-Z0-9]{2,12}$/;
    if (!vatPattern.test(cleanVatNumber)) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: 'Ungültiges USt-ID Format. Format sollte sein: DE123456789'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prüfe ob Ländercode mit USt-ID übereinstimmt
    const vatCountryCode = cleanVatNumber.substring(0, 2);
    if (vatCountryCode !== countryCode) {
      return new Response(
        JSON.stringify({
          valid: false,
          message: `USt-ID Ländercode (${vatCountryCode}) stimmt nicht mit Kundenland (${countryCode}) überein`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // EU VIES API Validierung (optional - kann fehlschlagen wenn offline)
    let viesValid = false;
    let companyName = null;
    let companyAddress = null;

    try {
      // VIES SOAP API Request
      const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:checkVat>
      <urn:countryCode>${vatCountryCode}</urn:countryCode>
      <urn:vatNumber>${cleanVatNumber.substring(2)}</urn:vatNumber>
    </urn:checkVat>
  </soapenv:Body>
</soapenv:Envelope>`;

      const viesResponse = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': ''
        },
        body: soapRequest
      });

      const viesText = await viesResponse.text();
      
      // Parse SOAP Response
      viesValid = viesText.includes('<valid>true</valid>');
      
      if (viesValid) {
        // Extrahiere Firmenname und Adresse wenn verfügbar
        const nameMatch = viesText.match(/<name>(.*?)<\/name>/);
        const addressMatch = viesText.match(/<address>(.*?)<\/address>/);
        
        if (nameMatch) companyName = nameMatch[1].trim();
        if (addressMatch) companyAddress = addressMatch[1].replace(/\n/g, ', ').trim();
      }

      console.log('VIES Validierung:', { viesValid, companyName, companyAddress });
    } catch (viesError) {
      console.warn('VIES API nicht erreichbar, nutze Fallback-Validierung:', viesError);
      // Fallback: Wenn VIES nicht erreichbar, akzeptiere Format-Validierung
      viesValid = true;
    }

    // Update Kunde mit Validierungsergebnis
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        vat_number: cleanVatNumber,
        vat_validated: viesValid,
        vat_validated_at: viesValid ? new Date().toISOString() : null,
        is_business: viesValid
      })
      .eq('id', customerId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        valid: viesValid,
        vatNumber: cleanVatNumber,
        companyName,
        companyAddress,
        message: viesValid 
          ? 'USt-ID erfolgreich validiert' 
          : 'USt-ID konnte nicht validiert werden - bitte überprüfen'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fehler bei USt-ID Validierung:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(
      JSON.stringify({ 
        valid: false,
        error: errorMessage 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
