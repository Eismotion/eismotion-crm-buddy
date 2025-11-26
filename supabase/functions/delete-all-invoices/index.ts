import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("delete-all-invoices: start");

    // Zähle zuerst wie viele Rechnungen betroffen sind
    const { count: invoiceCount } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .gte("invoice_date", "2020-01-01")
      .lte("invoice_date", "2025-12-31");

    const { count: itemCount } = await supabase
      .from("invoice_items")
      .select("*, invoices!inner(invoice_date)", { count: "exact", head: true })
      .gte("invoices.invoice_date", "2020-01-01")
      .lte("invoices.invoice_date", "2025-12-31");

    console.log(`Lösche ${itemCount} Rechnungspositionen und ${invoiceCount} Rechnungen`);

    // Hole alle Invoice IDs aus 2020-2025
    const { data: invoiceIds, error: idsError } = await supabase
      .from("invoices")
      .select("id")
      .gte("invoice_date", "2020-01-01")
      .lte("invoice_date", "2025-12-31");

    if (idsError) {
      console.error("delete-all-invoices: error fetching invoice ids", idsError);
      return new Response(
        JSON.stringify({ success: false, error: idsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = invoiceIds?.map((inv: any) => inv.id) || [];

    console.log(`Gefunden: ${ids.length} Rechnungen zum Löschen`);

    // Lösche invoice_items in Batches (max 1000 pro Batch)
    if (ids.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        console.log(`Lösche Batch ${Math.floor(i / batchSize) + 1} von ${Math.ceil(ids.length / batchSize)}`);
        
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .delete()
          .in("invoice_id", batch);

        if (itemsError) {
          console.error("delete-all-invoices: error deleting items batch", itemsError);
          return new Response(
            JSON.stringify({ success: false, error: itemsError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Lösche Rechnungen in Batches
    const batchSize = 1000;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      console.log(`Lösche Rechnungs-Batch ${Math.floor(i / batchSize) + 1} von ${Math.ceil(ids.length / batchSize)}`);
      
      const { error: invoicesError } = await supabase
        .from("invoices")
        .delete()
        .in("id", batch);

      if (invoicesError) {
        console.error("delete-all-invoices: error deleting invoices batch", invoicesError);
        return new Response(
          JSON.stringify({ success: false, error: invoicesError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Setze Kundenstatistiken zurück
    const { error: statsError } = await supabase
      .from("customers")
      .update({ total_spent: 0, total_orders: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (statsError) {
      console.error("delete-all-invoices: error updating stats", statsError);
    }

    console.log("delete-all-invoices: done");

    return new Response(
      JSON.stringify({
        success: true,
        message: `${invoiceCount} Rechnungen und ${itemCount} Positionen gelöscht`,
        invoicesDeleted: invoiceCount,
        itemsDeleted: itemCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("delete-all-invoices: fatal", e);
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
