import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface VeneziaMapping {
  invoice_number: string;
  customer_name: string;
  new_customer_name: string;
  full_address: string;
  strasse: string;
  plz: string;
  ort: string;
  location_key: string;
  date: string;
  net: string;
  gross: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('🚀 Starting Venezia customer split process...');

    // CSV data from the uploaded file
    const csvData: VeneziaMapping[] = [
      {"invoice_number":"03/2023/264","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Leipzig)","full_address":"Ludwigsburger Str. 9, 04209 Leipzig","strasse":"Ludwigsburger Str. 9","plz":"04209","ort":"Leipzig","location_key":"04209 Leipzig","date":"2023-03-22","net":"372,00","gross":"439,85"},
      {"invoice_number":"01/2024/469","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2024-01-29","net":"133,90","gross":"158,41"},
      {"invoice_number":"02/2024/506","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2024-02-20","net":"1000,90","gross":"1188,24"},
      {"invoice_number":"04/2024/580","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2024-04-05","net":"443,90","gross":"523,51"},
      {"invoice_number":"04/2024/600","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2024-04-22","net":"63,90","gross":"74,35"},
      {"invoice_number":"05/2024/624","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2024-05-07","net":"63,90","gross":"74,35"},
      {"invoice_number":"06/2023/375","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2023-06-23","net":"251,90","gross":"298,07"},
      {"invoice_number":"08/2024/693","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2024-08-09","net":"136,90","gross":"161,41"},
      {"invoice_number":"11/2023/445","customer_name":"EIS VENEZIA MANUFAKTUR","new_customer_name":"Eiscafe Venezia (Schneeberg)","full_address":"Markt 26, 08289 Schneeberg","strasse":"Markt 26","plz":"08289","ort":"Schneeberg","location_key":"08289 Schneeberg","date":"2023-11-11","net":"347,10","gross":"411,36"},
      {"invoice_number":"03/2023/262","customer_name":"EISCAFFE VENEZIA","new_customer_name":"Eiscafe Venezia (Brandenburg)","full_address":"Steinstr. 28, 14776 Brandenburg","strasse":"Steinstr. 28","plz":"14776","ort":"Brandenburg","location_key":"14776 Brandenburg","date":"2023-03-21","net":"47,90","gross":"56,07"},
      {"invoice_number":"05/2023/316","customer_name":"EISCAFFE VENEZIA","new_customer_name":"Eiscafe Venezia (Brandenburg)","full_address":"Steinstr. 28, 14776 Brandenburg","strasse":"Steinstr. 28","plz":"14776","ort":"Brandenburg","location_key":"14776 Brandenburg","date":"2023-05-02","net":"75,90","gross":"89,39"},
      {"invoice_number":"02/2024/487","customer_name":"EISCAFE PICCOLA VENEZIA","new_customer_name":"Eiscafe Venezia (Jork)","full_address":"Altländer Markt 2, 21635 Jork","strasse":"Altländer Markt 2","plz":"21635","ort":"Jork","location_key":"21635 Jork","date":"2024-02-12","net":"1250,90","gross":"1483,84"},
      {"invoice_number":"02/2024/489","customer_name":"EISCAFE PICCOLA VENEZIA","new_customer_name":"Eiscafe Venezia (Jork)","full_address":"Altländer Markt 2, 21635 Jork","strasse":"Altländer Markt 2","plz":"21635","ort":"Jork","location_key":"21635 Jork","date":"2024-02-12","net":"198,90","gross":"233,86"},
      {"invoice_number":"03/2024/543","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Boltenhagen)","full_address":"Dünenweg 1c, 23946 Boltenhagen","strasse":"Dünenweg 1c","plz":"23946","ort":"Boltenhagen","location_key":"23946 Boltenhagen","date":"2024-03-14","net":"565,90","gross":"671,73"},
      {"invoice_number":"02/2023/213","customer_name":"EISDIELE VENEZIA BRAKEL","new_customer_name":"Eiscafe Venezia (Brakel)","full_address":"Hanekamp 18, 33034 Brakel","strasse":"Hanekamp 18","plz":"33034","ort":"Brakel","location_key":"33034 Brakel","date":"2023-02-03","net":"292,80","gross":"358,23"},
      {"invoice_number":"02/2023/214","customer_name":"Eisdiele Venezia Brakel","new_customer_name":"Eiscafe Venezia (Brakel)","full_address":"Hanekamp 18, 33034 Brakel","strasse":"Hanekamp 18","plz":"33034","ort":"Brakel","location_key":"33034 Brakel","date":"2023-02-03","net":"302,60","gross":"358,23"},
      {"invoice_number":"01/2023/189","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Werther)","full_address":"Am Markt 30, 33824 Werther","strasse":"Am Markt 30","plz":"33824","ort":"Werther","location_key":"33824 Werther","date":"2023-01-20","net":"290,90","gross":"343,95"},
      {"invoice_number":"04/2024/590","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Werther)","full_address":"Am Markt 30, 33824 Werther","strasse":"Am Markt 30","plz":"33824","ort":"Werther","location_key":"33824 Werther","date":"2024-04-15","net":"191,90","gross":"226,80"},
      {"invoice_number":"07/2023/387","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Werther)","full_address":"Am Markt 30, 33824 Werther","strasse":"Am Markt 30","plz":"33824","ort":"Werther","location_key":"33824 Werther","date":"2023-07-06","net":"357,10","gross":"420,62"},
      {"invoice_number":"03/2024/536","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Bebra)","full_address":"Benrather Str. 2, 36179 Bebra","strasse":"Benrather Str. 2","plz":"36179","ort":"Bebra","location_key":"36179 Bebra","date":"2024-03-11","net":"533,50","gross":"633,17"},
      {"invoice_number":"03/2023/251","customer_name":"EISCAFE PICCOLA VENEZIA","new_customer_name":"Eiscafe Venezia (Halberstadt)","full_address":"Holzmaarkt 1, 38820 Halberstadt","strasse":"Holzmaarkt 1","plz":"38820","ort":"Halberstadt","location_key":"38820 Halberstadt","date":"2023-03-09","net":"652,90","gross":"772,22"},
      {"invoice_number":"02/2023/215","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Köln)","full_address":"Frankfurter Str. 728, 51143 Köln","strasse":"Frankfurter Str. 728","plz":"51143","ort":"Köln","location_key":"51143 Köln","date":"2023-02-03","net":"301,70","gross":"357,33"},
      {"invoice_number":"02/2023/226","customer_name":"EISCAFE VENEZIA REMAGEN","new_customer_name":"Eiscafe Venezia (Remagen)","full_address":"Grabenstr. 13, 53424 Remagen","strasse":"Grabenstr. 13","plz":"53424","ort":"Remagen","location_key":"53424 Remagen","date":"2023-02-08","net":"361,90","gross":"428,00"},
      {"invoice_number":"05/2023/329","customer_name":"EISCAFE VENEZIA REMAGEN","new_customer_name":"Eiscafe Venezia (Remagen)","full_address":"Grabenstr. 13, 53424 Remagen","strasse":"Grabenstr. 13","plz":"53424","ort":"Remagen","location_key":"53424 Remagen","date":"2023-05-11","net":"257,00","gross":"315,70"},
      {"invoice_number":"04/2023/298","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Lahnstein)","full_address":"Hochstr. 84, 56112 Lahnstein","strasse":"Hochstr. 84","plz":"56112","ort":"Lahnstein","location_key":"56112 Lahnstein","date":"2023-04-13","net":"305,90","gross":"362,33"},
      {"invoice_number":"02/2024/490","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Bad Vilbel)","full_address":"Frankfurter Str. 96, 61118 Bad Vilbel","strasse":"Frankfurter Str. 96","plz":"61118","ort":"Bad Vilbel","location_key":"61118 Bad Vilbel","date":"2024-02-12","net":"134,10","gross":"159,41"},
      {"invoice_number":"04/2024/597","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Bad Vilbel)","full_address":"Frankfurter Str. 96, 61118 Bad Vilbel","strasse":"Frankfurter Str. 96","plz":"61118","ort":"Bad Vilbel","location_key":"61118 Bad Vilbel","date":"2024-04-19","net":"365,90","gross":"433,73"},
      {"invoice_number":"11/2023/449","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Bad Vilbel)","full_address":"Frankfurter Str. 96, 61118 Bad Vilbel","strasse":"Frankfurter Str. 96","plz":"61118","ort":"Bad Vilbel","location_key":"61118 Bad Vilbel","date":"2023-11-20","net":"2519,10","gross":"2985,62"},
      {"invoice_number":"02/2024/492","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Bad Vilbe)","full_address":"Frankfurter Str. 98, 61118 Bad Vilbe","strasse":"Frankfurter Str. 98","plz":"61118","ort":"Bad Vilbe","location_key":"61118 Bad Vilbe","date":"2024-02-13","net":"870,90","gross":"1031,64"},
      {"invoice_number":"03/2023/252","customer_name":"EISCAFE PICCOLA VENEZIA RODENBACH","new_customer_name":"Eiscafe Venezia (Rodenbach)","full_address":"Große Gasse 1, 63517 Rodenbach","strasse":"Große Gasse 1","plz":"63517","ort":"Rodenbach","location_key":"63517 Rodenbach","date":"2023-03-09","net":"1743,90","gross":"2072,41"},
      {"invoice_number":"03/2023/254","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Pirmasens)","full_address":"Schloßstr. 5-7, 66953 Pirmasens","strasse":"Schloßstr. 5-7","plz":"66953","ort":"Pirmasens","location_key":"66953 Pirmasens","date":"2023-03-09","net":"301,70","gross":"357,33"},
      {"invoice_number":"03/2023/278","customer_name":"EISCAFE VENEZIA PFORZHEIM","new_customer_name":"Eiscafe Venezia (Pforzheim)","full_address":"Westl. Karl-Friedrich-Str. 17-19, 75172 Pforzheim","strasse":"Westl. Karl-Friedrich-Str. 17-19","plz":"75172","ort":"Pforzheim","location_key":"75172 Pforzheim","date":"2023-03-30","net":"301,70","gross":"357,33"},
      {"invoice_number":"02/2023/225","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2023-02-07","net":"1253,10","gross":"1484,50"},
      {"invoice_number":"02/2024/484","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2024-02-09","net":"1146,90","gross":"1358,17"},
      {"invoice_number":"02/2024/494","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2024-02-14","net":"237,50","gross":"281,41"},
      {"invoice_number":"05/2023/339","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2023-05-16","net":"301,70","gross":"357,33"},
      {"invoice_number":"05/2024/639","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2024-05-27","net":"237,50","gross":"281,41"},
      {"invoice_number":"06/2024/658","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2024-06-10","net":"214,90","gross":"254,52"},
      {"invoice_number":"06/2024/667","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2024-06-18","net":"93,10","gross":"110,29"},
      {"invoice_number":"12/2024/743","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Forst)","full_address":"Kirschstraßen 2, 76694 Forst","strasse":"Kirschstraßen 2","plz":"76694","ort":"Forst","location_key":"76694 Forst","date":"2024-12-04","net":"1138,90","gross":"1348,70"},
      {"invoice_number":"01/2024/460","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Rottweil)","full_address":"Hauptstraße 53, 78628 Rottweil","strasse":"Hauptstraße 53","plz":"78628","ort":"Rottweil","location_key":"78628 Rottweil","date":"2024-01-30","net":"2382,10","gross":"2820,35"},
      {"invoice_number":"04/2023/297","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Rottweil)","full_address":"Hauptstraße 53, 78628 Rottweil","strasse":"Hauptstraße 53","plz":"78628","ort":"Rottweil","location_key":"78628 Rottweil","date":"2023-04-12","net":"307,80","gross":"364,59"},
      {"invoice_number":"02/2023/233","customer_name":"EISCAFE VENEZIA MANUFAKTUR,","new_customer_name":"Eiscafe Venezia (Marktoberdorf)","full_address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","strasse":"Kaufbeurener Str. 1","plz":"87616","ort":"Marktoberdorf","location_key":"87616 Marktoberdorf","date":"2023-02-10","net":"1506,00","gross":"1783,72"},
      {"invoice_number":"03/2023/248","customer_name":"EISCAFE VENEZIA MANUFAKTUR,","new_customer_name":"Eiscafe Venezia (Marktoberdorf)","full_address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","strasse":"Kaufbeurener Str. 1","plz":"87616","ort":"Marktoberdorf","location_key":"87616 Marktoberdorf","date":"2023-03-07","net":"268,60","gross":"318,30"},
      {"invoice_number":"03/2024/548","customer_name":"EISCAFE VENEZIA MANUFAKTUR,","new_customer_name":"Eiscafe Venezia (Marktoberdorf)","full_address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","strasse":"Kaufbeurener Str. 1","plz":"87616","ort":"Marktoberdorf","location_key":"87616 Marktoberdorf","date":"2024-03-18","net":"291,40","gross":"345,24"},
      {"invoice_number":"03/2024/572","customer_name":"EISCAFE VENEZIA MANUFAKTUR,","new_customer_name":"Eiscafe Venezia (Marktoberdorf)","full_address":"Kaufbeurener Str. 1, 87616 Marktoberdorf","strasse":"Kaufbeurener Str. 1","plz":"87616","ort":"Marktoberdorf","location_key":"87616 Marktoberdorf","date":"2024-03-25","net":"1995,90","gross":"2363,91"},
      {"invoice_number":"03/2024/559","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Senden)","full_address":"Hauptstr. 65, 89250 Senden","strasse":"Hauptstr. 65","plz":"89250","ort":"Senden","location_key":"89250 Senden","date":"2024-03-21","net":"2028,90","gross":"2856,62"},
      {"invoice_number":"02/2023/227","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Auerbach)","full_address":"Marienplatz 15, 91275 Auerbach","strasse":"Marienplatz 15","plz":"91275","ort":"Auerbach","location_key":"91275 Auerbach","date":"2023-02-08","net":"350,50","gross":"415,40"},
      {"invoice_number":"03/2023/280","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Burgbernheim)","full_address":"Mitterstr. 3, 91593 Burgbernheim","strasse":"Mitterstr. 3","plz":"91593","ort":"Burgbernheim","location_key":"91593 Burgbernheim","date":"2023-03-30","net":"288,90","gross":"342,10"},
      {"invoice_number":"04/2023/294","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Roding)","full_address":"Stadtplatz 23, 93426 Roding","strasse":"Stadtplatz 23","plz":"93426","ort":"Roding","location_key":"93426 Roding","date":"2023-04-11","net":"395,90","gross":"468,86"},
      {"invoice_number":"01/2024/458","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Sömmerda)","full_address":"Langstr.7, 99610 Sömmerda","strasse":"Langstr.7","plz":"99610","ort":"Sömmerda","location_key":"99610 Sömmerda","date":"2024-01-29","net":"3205,40","gross":"3804,95"},
      {"invoice_number":"03/2023/250","customer_name":"Eiscafe Venezia","new_customer_name":"Eiscafe Venezia (Unbekannt)","full_address":"Unbekannt","strasse":"Unbekannt","plz":"","ort":"Unbekannt","location_key":"Unbekannt","date":"2023-03-08","net":"301,70","gross":"357,33"},
      {"invoice_number":"03/2023/265","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Unbekannt)","full_address":"Unbekannt","strasse":"Unbekannt","plz":"","ort":"Unbekannt","location_key":"Unbekannt","date":"2023-03-22","net":"301,70","gross":"357,33"},
      {"invoice_number":"03/2023/274","customer_name":"EISCAFE VENEZIA","new_customer_name":"Eiscafe Venezia (Unbekannt)","full_address":"Unbekannt","strasse":"Unbekannt","plz":"","ort":"Unbekannt","location_key":"Unbekannt","date":"2023-03-28","net":"1400,60","gross":"1666,72"}
    ];

    console.log(`📋 Loaded ${csvData.length} invoice mappings`);

    // Step 1: Extract unique customer locations
    const uniqueLocations = new Map<string, VeneziaMapping>();
    for (const row of csvData) {
      if (!uniqueLocations.has(row.new_customer_name)) {
        uniqueLocations.set(row.new_customer_name, row);
      }
    }

    console.log(`🏢 Found ${uniqueLocations.size} unique Venezia locations`);

    // Step 2: Create new customer records
    const customerMap = new Map<string, string>(); // new_customer_name -> customer_id
    const createdCustomers: any[] = [];

    for (const [locationName, locationData] of uniqueLocations) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', locationName)
        .maybeSingle();

      if (existingCustomer) {
        console.log(`✓ Customer already exists: ${locationName}`);
        customerMap.set(locationName, existingCustomer.id);
      } else {
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({
            name: locationName,
            address: locationData.full_address,
            postal_code: locationData.plz,
            city: locationData.ort,
            country: 'DE',
            total_spent: 0,
            total_orders: 0
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Failed to create customer ${locationName}:`, error);
          continue;
        }

        console.log(`✓ Created customer: ${locationName} (${newCustomer.id})`);
        customerMap.set(locationName, newCustomer.id);
        createdCustomers.push(newCustomer);
      }
    }

    // Step 3: Update invoices
    const corrections: any[] = [];
    const errors: any[] = [];

    for (const row of csvData) {
      const newCustomerId = customerMap.get(row.new_customer_name);
      if (!newCustomerId) {
        errors.push({
          invoice_number: row.invoice_number,
          error: `Customer not found: ${row.new_customer_name}`
        });
        continue;
      }

      // Find invoice by invoice_number
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, customer_id, total_amount')
        .eq('invoice_number', row.invoice_number)
        .maybeSingle();

      if (!invoice) {
        errors.push({
          invoice_number: row.invoice_number,
          error: 'Invoice not found'
        });
        continue;
      }

      // Update invoice to new customer
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ customer_id: newCustomerId })
        .eq('id', invoice.id);

      if (updateError) {
        errors.push({
          invoice_number: row.invoice_number,
          error: updateError.message
        });
        continue;
      }

      corrections.push({
        invoice_number: row.invoice_number,
        invoice_id: invoice.id,
        old_customer_id: invoice.customer_id,
        new_customer_id: newCustomerId,
        new_customer_name: row.new_customer_name,
        amount: invoice.total_amount
      });

      console.log(`✓ Updated invoice ${row.invoice_number} -> ${row.new_customer_name}`);
    }

    // Step 4: Update customer statistics for all affected customers
    const affectedCustomerIds = new Set<string>();
    corrections.forEach(c => {
      affectedCustomerIds.add(c.old_customer_id);
      affectedCustomerIds.add(c.new_customer_id);
    });

    console.log(`📊 Updating statistics for ${affectedCustomerIds.size} affected customers...`);

    for (const customerId of affectedCustomerIds) {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('total_amount, status')
        .eq('customer_id', customerId);

      if (invoices) {
        const totalSpent = invoices
          .filter(inv => inv.status === 'bezahlt')
          .reduce((sum, inv) => sum + Number(inv.total_amount), 0);
        
        const totalOrders = invoices.length;

        await supabase
          .from('customers')
          .update({
            total_spent: totalSpent,
            total_orders: totalOrders
          })
          .eq('id', customerId);
      }
    }

    // Step 5: Validation - Check Venezia customers
    const { data: veneziaCustomers } = await supabase
      .from('customers')
      .select('id, name, total_spent, total_orders')
      .ilike('name', '%venezia%')
      .order('total_spent', { ascending: false });

    console.log('✅ Venezia customer split completed!');

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          unique_locations: uniqueLocations.size,
          customers_created: createdCustomers.length,
          invoices_updated: corrections.length,
          errors: errors.length,
          affected_customers: affectedCustomerIds.size
        },
        created_customers: createdCustomers,
        corrections,
        errors,
        venezia_customers: veneziaCustomers
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in split-venezia-customers:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
