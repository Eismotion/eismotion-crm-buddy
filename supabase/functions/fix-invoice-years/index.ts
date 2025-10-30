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
    const { dryRun = false } = (await req.json().catch(() => ({}))) as { dryRun?: boolean };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("fix-invoice-years: start");

    // Find invoices whose number clearly indicates 2022 but date is NOT in 2022
    let { data: badInvoices, error: fetchErr } = await supabase
      .from("invoices")
      .select("id, invoice_number, invoice_date")
      .ilike("invoice_number", "%/2022/%")
      .or("invoice_date.lt.2022-01-01,invoice_date.gt.2022-12-31");

    if (fetchErr) {
      console.error("fix-invoice-years: fetch error", fetchErr);
      return new Response(JSON.stringify({ success: false, error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: Array<{ id: string; newDate: string; from: string }> = [];

    for (const inv of badInvoices ?? []) {
      const num: string = inv.invoice_number ?? "";
      // Try to parse MM/YYYY from number like "06/2022/045"
      const m = num.match(/^(\d{2})\/(\d{4})\//);
      let targetDate = "2022-01-01";
      if (m) {
        const mm = Math.min(Math.max(parseInt(m[1], 10), 1), 12);
        const yyyy = parseInt(m[2], 10);
        if (yyyy === 2022) {
          // set to 15th of that month for neutrality
          targetDate = `${yyyy}-${String(mm).padStart(2, "0")}-15`;
        }
      }
      updates.push({ id: inv.id, newDate: targetDate, from: inv.invoice_date });
    }

    let updated = 0;
    if (!dryRun) {
      for (const u of updates) {
        const { error: updErr } = await supabase
          .from("invoices")
          .update({ invoice_date: u.newDate })
          .eq("id", u.id);
        if (updErr) {
          console.error("fix-invoice-years: update failed", u.id, updErr);
        } else {
          updated += 1;
        }
      }
    }

    console.log("fix-invoice-years: done", { found: updates.length, updated });

    return new Response(
      JSON.stringify({ success: true, found: updates.length, updated, dryRun }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fix-invoice-years: fatal", e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});