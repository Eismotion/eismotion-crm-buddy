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

    // Rufe Postgres-Funktion auf die alles löscht
    const { data, error } = await supabase.rpc("delete_all_invoices_2020_2025");

    if (error) {
      console.error("delete-all-invoices: error", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("delete-all-invoices: done", data);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${data.invoices_deleted} Rechnungen und ${data.items_deleted} Positionen gelöscht`,
        invoicesDeleted: data.invoices_deleted,
        itemsDeleted: data.items_deleted,
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
