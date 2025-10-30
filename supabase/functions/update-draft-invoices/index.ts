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

    console.log("update-draft-invoices: start");

    // Update all draft invoices from 2022 to "bezahlt"
    const { data, error } = await supabase
      .from("invoices")
      .update({ status: "bezahlt", updated_at: new Date().toISOString() })
      .eq("status", "draft")
      .ilike("invoice_number", "%/2022/%")
      .select("invoice_number");

    if (error) {
      console.error("update-draft-invoices: error", error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("update-draft-invoices: done", { updated: data?.length || 0 });

    return new Response(
      JSON.stringify({ success: true, updated: data?.length || 0, invoices: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("update-draft-invoices: fatal", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
