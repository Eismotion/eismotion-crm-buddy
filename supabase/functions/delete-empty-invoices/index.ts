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

    console.log("delete-empty-invoices: start");

    // Find invoices with empty/null invoice_number AND zero amounts
    const { data: emptyInvoices, error: fetchErr } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount")
      .or("invoice_number.is.null,invoice_number.eq.")
      .eq("total_amount", 0);

    if (fetchErr) {
      console.error("delete-empty-invoices: fetch error", fetchErr);
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ids = (emptyInvoices ?? []).map(inv => inv.id);
    let deleted = 0;

    if (ids.length > 0) {
      // Delete invoice_items first (foreign key constraint)
      const { error: itemsErr } = await supabase
        .from("invoice_items")
        .delete()
        .in("invoice_id", ids);
      
      if (itemsErr) {
        console.error("delete-empty-invoices: items delete error", itemsErr);
      }

      // Delete invoices
      const { error: deleteErr } = await supabase
        .from("invoices")
        .delete()
        .in("id", ids);

      if (deleteErr) {
        console.error("delete-empty-invoices: delete error", deleteErr);
        return new Response(JSON.stringify({ success: false, error: deleteErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      deleted = ids.length;
    }

    console.log("delete-empty-invoices: done", { found: ids.length, deleted });

    return new Response(
      JSON.stringify({ success: true, found: ids.length, deleted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("delete-empty-invoices: fatal", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});