import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  category: string;
  background_base64: string | null;
  created_at: string;
}

export const InvoiceDesignStudio = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("invoice_templates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Load error:", error);
      toast.error("Fehler beim Laden");
      return;
    }
    
    setTemplates(data || []);
    if (data && data.length > 0) {
      setSelected(data[0]);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-1/4 border-r bg-card p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4 text-foreground">Rechnungsvorlagen</h2>
        <div className="space-y-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className={`w-full text-left border rounded-lg p-2 transition-colors ${
                selected?.id === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="text-sm font-semibold mb-1 text-foreground">{t.name}</div>
              {t.background_base64 && (
                <img
                  src={t.background_base64}
                  alt={t.name}
                  className="w-full h-24 object-contain rounded"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vorschau */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-6">
        {selected ? (
          <div className="shadow-lg border border-border bg-card p-4 rounded-lg">
            <h3 className="font-bold mb-3 text-center text-foreground">{selected.name}</h3>
            {selected.background_base64 ? (
              <img
                src={selected.background_base64}
                alt={selected.name}
                className="w-[210mm] h-[297mm] object-contain"
              />
            ) : (
              <div className="w-[210mm] h-[297mm] flex items-center justify-center bg-muted text-muted-foreground">
                Kein Hintergrundbild
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground italic">
            Keine Templates vorhanden
          </p>
        )}
      </div>
    </div>
  );
};
