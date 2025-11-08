import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

interface InvoiceData {
  invoice_number: string;
  address: string;
  postal_code: string;
  city: string;
}

// Extrahiert PLZ aus einer Adresse
function extractPostalCode(address: string): string {
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : '';
}

// Extrahiert Stadt aus einer Adresse
function extractCity(address: string): string {
  // Entferne Länderkürzel in Klammern
  let cleaned = address.replace(/\([A-Z]{2}\)/g, '').trim();
  
  // Splitte bei Komma
  const parts = cleaned.split(',').map(p => p.trim());
  
  // Letzter Teil enthält normalerweise PLZ + Stadt
  const lastPart = parts[parts.length - 1];
  
  // Entferne PLZ (5 Ziffern am Anfang)
  const city = lastPart.replace(/^\d{5}\s*/, '').trim();
  
  return city || 'Unbekannt';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('🚀 Starting Venezia assignment fix...');

    // CSV-Daten mit ALLEN 123 Venezia-Rechnungen und ihren korrekten Adressen
    const csvData: InvoiceData[] = [
      {"invoice_number":"01/2021/04","address":"Paolo Marrocu","postal_code":"","city":""},
      {"invoice_number":"01/2021/11","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"02/2021/12","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"02/2021/15","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"02/2021/17","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"03/2021/21","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"04/2021/39","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"05/2021/68","address":"Alte Bielefelder Str. 11, 33824 Werther","postal_code":"","city":""},
      {"invoice_number":"05/2021/72","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"06/2021/102","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"07/2021/111","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"08/2021/119","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"08/2021/120","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"08/2021/125","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"09/2021/132","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"11/2021/135","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"01/2022/06","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"02/2022/19","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"02/2022/21","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"03/2022/41","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"04/2022/61","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"04/2022/80","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"05/2022/82","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"05/2022/92","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"07/2022/137","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"08/2022/145","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"08/2022/151","address":"Reichenstr. 20, 02625 Bautzen","postal_code":"","city":""},
      {"invoice_number":"11/2022/167","address":"MANUFAKTUR","postal_code":"","city":""},
      {"invoice_number":"01/2023/189","address":"Am Markt 30, 33824 Werther","postal_code":"33824","city":"Werther"},
      {"invoice_number":"01/2023/201","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"01/2023/205","address":"Grabenstr. 13","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"02/2023/213","address":"Hanekamp 18, 33034 Brakel","postal_code":"33034","city":"Brakel"},
      {"invoice_number":"02/2023/214","address":"Hanekamp 18, 33034 Brakel","postal_code":"33034","city":"Brakel"},
      {"invoice_number":"02/2023/215","address":"Frankfurter Str. 728, 51143 Köln","postal_code":"51143","city":"Köln"},
      {"invoice_number":"02/2023/225","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"02/2023/226","address":"Grabenstr. 13, 53424 Remagen","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"02/2023/227","address":"Marienplatz 15, 91275 Auerbach","postal_code":"91275","city":"Auerbach"},
      {"invoice_number":"02/2023/233","address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","postal_code":"87616","city":"Marktoberdorf"},
      {"invoice_number":"02/2023/235","address":"Adolfstraße 45, 56112 Lahnstein","postal_code":"56112","city":"Lahnstein"},
      {"invoice_number":"03/2023/248","address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","postal_code":"87616","city":"Marktoberdorf"},
      {"invoice_number":"03/2023/250","address":"Unbekannt","postal_code":"","city":"Unbekannt"},
      {"invoice_number":"03/2023/251","address":"Unterer Markt 6, 91275 Auerbach","postal_code":"91275","city":"Auerbach"},
      {"invoice_number":"03/2023/252","address":"Große Gasse 1, 63517 Rodenbach","postal_code":"63517","city":"Rodenbach"},
      {"invoice_number":"03/2023/254","address":"Schloßstr. 5-7, 66953 Pirmasens","postal_code":"66953","city":"Pirmasens"},
      {"invoice_number":"03/2023/262","address":"Steinstr. 28, 14776 Brandenburg","postal_code":"14776","city":"Brandenburg"},
      {"invoice_number":"03/2023/264","address":"Ludwigsburger Str. 9, 04209 Leipzig","postal_code":"04209","city":"Leipzig"},
      {"invoice_number":"03/2023/265","address":"Unbekannt","postal_code":"","city":"Unbekannt"},
      {"invoice_number":"03/2023/274","address":"Unbekannt","postal_code":"","city":"Unbekannt"},
      {"invoice_number":"03/2023/278","address":"Westl. Karl-Friedrich-Str. 17-19, 75172 Pforzheim","postal_code":"75172","city":"Pforzheim"},
      {"invoice_number":"04/2023/291","address":"Marktplatz 4","postal_code":"","city":""},
      {"invoice_number":"04/2023/294","address":"Stadtplatz 23, 93426 Roding","postal_code":"93426","city":"Roding"},
      {"invoice_number":"04/2023/295","address":"Markt 26","postal_code":"","city":""},
      {"invoice_number":"04/2023/297","address":"Hauptstraße 53, 78628 Rottweil","postal_code":"78628","city":"Rottweil"},
      {"invoice_number":"04/2023/298","address":"Hochstr. 84, 56112 Lahnstein","postal_code":"56112","city":"Lahnstein"},
      {"invoice_number":"05/2023/316","address":"Steinstr. 28, 14776 Brandenburg","postal_code":"14776","city":"Brandenburg"},
      {"invoice_number":"05/2023/329","address":"Grabenstr. 13, 53424 Remagen","postal_code":"53424","city":"Remagen"},
      {"invoice_number":"05/2023/339","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"06/2023/352","address":"Hauptstraße 32, 66953 Pirmasens","postal_code":"66953","city":"Pirmasens"},
      {"invoice_number":"06/2023/375","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"07/2023/387","address":"Am Markt 30, 33824 Werther","postal_code":"33824","city":"Werther"},
      {"invoice_number":"07/2023/402","address":"Schulstraße 11, 93426 Roding","postal_code":"93426","city":"Roding"},
      {"invoice_number":"10/2023/441","address":"Haupt Straße 42, 51143 Köln","postal_code":"51143","city":"Köln"},
      {"invoice_number":"11/2023/445","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"11/2023/449","address":"Frankfurter Str. 96, 61118 Bad Vilbel","postal_code":"61118","city":"Bad Vilbel"},
      {"invoice_number":"11/2023/450","address":"Frankfurter Str. 96, 61118 Bad Vilbel","postal_code":"61118","city":"Bad Vilbel"},
      {"invoice_number":"01/2024/457","address":"Obere Kirschgasse 6, 91593 Burgbernheim","postal_code":"91593","city":"Burgbernheim"},
      {"invoice_number":"01/2024/458","address":"Langstr.7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"01/2024/460","address":"Hauptstraße 53, 78628 Rottweil","postal_code":"78628","city":"Rottweil"},
      {"invoice_number":"01/2024/469","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"02/2024/482","address":"Hanauer Landstraße 3B, 63517 Rodenbach","postal_code":"63517","city":"Rodenbach"},
      {"invoice_number":"02/2024/484","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"02/2024/487","address":"Altländer Markt 2, 21635 Jork","postal_code":"21635","city":"Jork"},
      {"invoice_number":"02/2024/489","address":"Altländer Markt 2, 21635 Jork","postal_code":"21635","city":"Jork"},
      {"invoice_number":"02/2024/490","address":"Frankfurter Str. 96, 61118 Bad Vilbel","postal_code":"61118","city":"Bad Vilbel"},
      {"invoice_number":"02/2024/492","address":"Frankfurter Str. 98, 61118 Bad Vilbe","postal_code":"61118","city":"Bad Vilbe"},
      {"invoice_number":"02/2024/494","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"02/2024/506","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"03/2024/524","address":"Blumenstraße 18, 75172 Pforzheim","postal_code":"75172","city":"Pforzheim"},
      {"invoice_number":"03/2024/528","address":"Alte Bielefelder Str. 11, 33824 Werther","postal_code":"33824","city":"Werther"},
      {"invoice_number":"03/2024/536","address":"Benrather Str. 2, 36179 Bebra","postal_code":"36179","city":"Bebra"},
      {"invoice_number":"03/2024/543","address":"Dünenweg 1c, 23946 Boltenhagen","postal_code":"23946","city":"Boltenhagen"},
      {"invoice_number":"03/2024/548","address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","postal_code":"87616","city":"Marktoberdorf"},
      {"invoice_number":"03/2024/557","address":"Da Fonseca & Cipriano, Prudencio Gb R, Da Fonseca Alex","postal_code":"","city":""},
      {"invoice_number":"03/2024/559","address":"Hauptstr. 65, 89250 Senden","postal_code":"89250","city":"Senden"},
      {"invoice_number":"03/2024/572","address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","postal_code":"87616","city":"Marktoberdorf"},
      {"invoice_number":"04/2024/580","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"04/2024/590","address":"Am Markt 30, 33824 Werther","postal_code":"33824","city":"Werther"},
      {"invoice_number":"04/2024/591","address":"Kemptner Str. 27, 89250 Senden","postal_code":"89250","city":"Senden"},
      {"invoice_number":"04/2024/597","address":"Frankfurter Str. 96, 61118 Bad Vilbel","postal_code":"61118","city":"Bad Vilbel"},
      {"invoice_number":"04/2024/600","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"05/2024/624","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"05/2024/634","address":"Nürnbergerstrasse 46, 36179 Bebra","postal_code":"36179","city":"Bebra"},
      {"invoice_number":"05/2024/639","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"06/2024/658","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"06/2024/667","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"08/2024/692","address":"Frankfurter Str. 96, 61118 Bad Vilbe","postal_code":"61118","city":"Bad Vilbe"},
      {"invoice_number":"08/2024/693","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"09/2024/716","address":"Holzmarkt 7, 38820 Halberstadt","postal_code":"38820","city":"Halberstadt"},
      {"invoice_number":"12/2024/743","address":"Kirschstraßen 2, 76694 Forst","postal_code":"76694","city":"Forst"},
      {"invoice_number":"01/2025/759","address":"Schloßstraße 2, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"01/2025/760","address":"Schloßstraße 2, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"01/2025/763","address":"Obernstraße 29, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"01/2025/764","address":"Obernstraße 29, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"01/2025/768","address":"Obernstraße 29, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"03/2025/797","address":"Schloßstraße 2, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"03/2025/798","address":"Schloßstraße 2, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"03/2025/799","address":"Obernstraße 29, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"03/2025/800","address":"Obernstraße 29, 31655 Stadthagen","postal_code":"31655","city":"Stadthagen"},
      {"invoice_number":"03/2025/821","address":"Unbekannt","postal_code":"","city":""},
      {"invoice_number":"04/2025/836","address":"Hauptstraße 159, 53757 Sankt Augustin","postal_code":"53757","city":"Sankt Augustin"},
      {"invoice_number":"04/2025/863","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"04/2025/870","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"04/2025/877","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"04/2025/887","address":"Unbekannt","postal_code":"","city":""},
      {"invoice_number":"04/2025/901","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"04/2025/906","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"05/2025/872","address":"Alpenstraße 46, 82467 Garmisch Partenkirchen","postal_code":"82467","city":"Garmisch Partenkirchen"},
      {"invoice_number":"05/2025/929","address":"Markt 26, 08289 Schneeberg","postal_code":"08289","city":"Schneeberg"},
      {"invoice_number":"06/2025/899","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"06/2025/915","address":"Alpenstraße 46, 82467 Garmisch Partenkirchen","postal_code":"82467","city":"Garmisch Partenkirchen"},
      {"invoice_number":"07/2025/941","address":"Hauptstraße 159, 53757 Sankt Augustin","postal_code":"53757","city":"Sankt Augustin"},
      {"invoice_number":"07/2025/950","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"07/2025/954","address":"Langstraße 7, 99610 Sömmerda","postal_code":"99610","city":"Sömmerda"},
      {"invoice_number":"07/2025/956","address":"Völklinger Str. 58, 66333 Völklingen","postal_code":"66333","city":"Völklingen"}
    ];

    console.log(`📋 Loaded ${csvData.length} invoice mappings from CSV`);

    // Step 1: Sammle eindeutige Standorte (PLZ + Stadt)
    const locationMap = new Map<string, { plz: string; city: string; full_address: string }>();
    
    for (const row of csvData) {
      if (row.postal_code && row.city && row.city !== 'Unbekannt') {
        const locationKey = `${row.postal_code}_${row.city}`;
        if (!locationMap.has(locationKey)) {
          locationMap.set(locationKey, {
            plz: row.postal_code,
            city: row.city,
            full_address: row.address
          });
        }
      }
    }

    console.log(`🏢 Found ${locationMap.size} unique Venezia locations`);

    // Step 2: Erstelle oder finde Kunden für jeden Standort
    const customerIdMap = new Map<string, string>(); // locationKey -> customer_id
    const createdCustomers: string[] = [];
    const foundCustomers: string[] = [];

    for (const [locationKey, location] of locationMap) {
      const customerName = `Eiscafe Venezia (${location.city})`;
      
      // Prüfe ob Kunde bereits existiert
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, name')
        .eq('postal_code', location.plz)
        .eq('city', location.city)
        .ilike('name', '%venezia%')
        .maybeSingle();

      if (existingCustomer) {
        console.log(`✓ Found existing customer: ${existingCustomer.name} (${locationKey})`);
        customerIdMap.set(locationKey, existingCustomer.id);
        foundCustomers.push(customerName);
      } else {
        // Erstelle neuen Kunden
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            name: customerName,
            address: location.full_address,
            postal_code: location.plz,
            city: location.city,
            country: 'DE',
            total_spent: 0,
            total_orders: 0
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating customer ${customerName}:`, error);
        } else {
          console.log(`✨ Created new customer: ${customerName} (${locationKey})`);
          customerIdMap.set(locationKey, newCustomer.id);
          createdCustomers.push(customerName);
        }
      }
    }

    // Step 3: Ordne alle Rechnungen den richtigen Kunden zu
    const updatedInvoices: string[] = [];
    const skippedInvoices: string[] = [];
    const errors: any[] = [];

    for (const row of csvData) {
      if (!row.postal_code || !row.city || row.city === 'Unbekannt') {
        console.log(`⚠️ Skipping invoice ${row.invoice_number} - no valid location`);
        skippedInvoices.push(row.invoice_number);
        continue;
      }

      const locationKey = `${row.postal_code}_${row.city}`;
      const correctCustomerId = customerIdMap.get(locationKey);

      if (!correctCustomerId) {
        console.log(`❌ No customer found for ${locationKey}`);
        errors.push({ invoice: row.invoice_number, error: 'No customer for location' });
        continue;
      }

      // Finde die Rechnung
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, customer_id')
        .eq('invoice_number', row.invoice_number)
        .maybeSingle();

      if (!invoice) {
        console.log(`⚠️ Invoice ${row.invoice_number} not found in database`);
        skippedInvoices.push(row.invoice_number);
        continue;
      }

      // Prüfe ob Rechnung bereits beim richtigen Kunden ist
      if (invoice.customer_id === correctCustomerId) {
        console.log(`✓ Invoice ${row.invoice_number} already correct`);
        continue;
      }

      // Aktualisiere die Rechnung
      const { error } = await supabase
        .from('invoices')
        .update({ customer_id: correctCustomerId })
        .eq('id', invoice.id);

      if (error) {
        console.error(`❌ Error updating invoice ${row.invoice_number}:`, error);
        errors.push({ invoice: row.invoice_number, error: error.message });
      } else {
        console.log(`✅ Updated invoice ${row.invoice_number} -> ${row.city}`);
        updatedInvoices.push(row.invoice_number);
      }
    }

    // Step 4: Aktualisiere Kundenstatistiken
    console.log('📊 Updating customer statistics...');
    
    for (const customerId of customerIdMap.values()) {
      const { data: stats } = await supabase
        .from('invoices')
        .select('total_amount')
        .eq('customer_id', customerId)
        .eq('status', 'bezahlt');

      if (stats) {
        const totalSpent = stats.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
        const totalOrders = stats.length;

        await supabase
          .from('customers')
          .update({
            total_spent: totalSpent,
            total_orders: totalOrders
          })
          .eq('id', customerId);
      }
    }

    // Step 5: Lösche alte "Venezia"-Kunden ohne Rechnungen
    console.log('🧹 Cleaning up empty Venezia customers...');
    
    const { data: allVeneziaCustomers } = await supabase
      .from('customers')
      .select('id, name')
      .ilike('name', '%venezia%');

    const deletedCustomers: string[] = [];
    
    if (allVeneziaCustomers) {
      for (const customer of allVeneziaCustomers) {
        const { count, error: countError } = await supabase
          .from('invoices')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', customer.id);

        if ((count ?? 0) === 0) {
          await supabase
            .from('customers')
            .delete()
            .eq('id', customer.id);
          
          console.log(`🗑️ Deleted empty customer: ${customer.name}`);
          deletedCustomers.push(customer.name);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_invoices: csvData.length,
          unique_locations: locationMap.size,
          customers_created: createdCustomers.length,
          customers_found: foundCustomers.length,
          invoices_updated: updatedInvoices.length,
          invoices_skipped: skippedInvoices.length,
          customers_deleted: deletedCustomers.length,
          errors: errors.length
        },
        created_customers: createdCustomers,
        found_customers: foundCustomers,
        updated_invoices: updatedInvoices,
        skipped_invoices: skippedInvoices,
        deleted_customers: deletedCustomers,
        errors
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (err) {
    console.error('❌ Error in fix-venezia-assignments:', err);
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
