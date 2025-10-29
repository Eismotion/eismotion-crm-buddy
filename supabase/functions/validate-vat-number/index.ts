import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VatValidationRequest {
  customerId: string;
  vatNumber: string;
  country: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId, vatNumber, country }: VatValidationRequest = await req.json();

    console.log('Validating VAT number:', { customerId, vatNumber, country });

    if (!customerId || !vatNumber || !country) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanedVatNumber = vatNumber.replace(/[\s-]/g, '').toUpperCase();
    let countryCode = country.toUpperCase();
    let vatNumberOnly = cleanedVatNumber;
    
    if (cleanedVatNumber.startsWith(countryCode)) {
      vatNumberOnly = cleanedVatNumber.substring(countryCode.length);
    }

    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 
                        'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 
                        'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

    let isValid = false;
    let validationMessage = '';

    if (euCountries.includes(countryCode)) {
      try {
        const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns1="urn:ec.europa.eu:taxud:vies:services:checkVat:types">
  <soap:Body>
    <tns1:checkVat>
      <tns1:countryCode>${countryCode}</tns1:countryCode>
      <tns1:vatNumber>${vatNumberOnly}</tns1:vatNumber>
    </tns1:checkVat>
  </soap:Body>
</soap:Envelope>`;

        const viesResponse = await fetch('https://ec.europa.eu/taxation_customs/vies/services/checkVatService', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml;charset=UTF-8',
            'SOAPAction': '',
          },
          body: soapRequest,
        });

        const responseText = await viesResponse.text();

        if (responseText.includes('<valid>true</valid>')) {
          isValid = true;
          validationMessage = 'USt-ID erfolgreich validiert';
          
          const nameMatch = responseText.match(/<name>(.*?)<\/name>/);
          if (nameMatch) {
            validationMessage += ` - ${nameMatch[1]}`;
          }
        } else if (responseText.includes('<valid>false</valid>')) {
          validationMessage = 'USt-ID ist nicht gültig';
        } else if (responseText.includes('SERVICE_UNAVAILABLE')) {
          isValid = true;
          validationMessage = 'VIES Service nicht verfügbar - vorläufig akzeptiert';
        } else {
          validationMessage = 'Validierung fehlgeschlagen';
        }
      } catch (viesError) {
        console.error('VIES Error:', viesError);
        isValid = true;
        validationMessage = 'VIES nicht erreichbar - vorläufig akzeptiert';
      }
    } else {
      isValid = true;
      validationMessage = 'Nicht-EU Land - keine Validierung';
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabaseClient
      .from('customers')
      .update({
        vat_number: `${countryCode}${vatNumberOnly}`,
        vat_validated: isValid,
        vat_validated_at: isValid ? new Date().toISOString() : null,
        is_business: isValid,
      })
      .eq('id', customerId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Update failed', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        isValid,
        message: validationMessage,
        vatNumber: `${countryCode}${vatNumberOnly}`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
