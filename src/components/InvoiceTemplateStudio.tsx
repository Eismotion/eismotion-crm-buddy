import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, ArrowLeft } from "lucide-react";
import DraggableInvoiceFields from "./DraggableInvoiceFields";

const uploadSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich").max(100, "Name zu lang"),
  category: z.string().trim().max(50, "Kategorie zu lang").optional(),
});

interface Template {
  id: string;
  name: string;
  category: string | null;
  background_base64: string | null;
  created_at: string;
}

export default function InvoiceTemplateStudio() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingFields, setEditingFields] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    loadInvoices();
  }, []);

  // Auto-select first template if none selected
  useEffect(() => {
    if (templates.length > 0 && !selected) {
      setSelected(templates[0]);
    }
  }, [templates, selected]);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("invoice_templates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Load error:", error);
      toast.error("Fehler beim Laden der Templates");
      return;
    }
    
    setTemplates(data || []);
  };

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        customer:customers(name, address, city, postal_code)
      `)
      .order("invoice_date", { ascending: false })
      .limit(50);
    
    if (error) {
      console.error("Load invoices error:", error);
      return;
    }
    
    setInvoices(data || []);
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleUpload = async () => {
    if (!file) {
      toast.error("Bitte wählen Sie eine Datei aus");
      return;
    }

    const validation = uploadSchema.safeParse({ name, category });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Datei ist zu groß (max. 10MB)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Nur Bilddateien sind erlaubt");
      return;
    }

    setUploading(true);
    try {
      const base64 = await toBase64(file);
      const { error } = await supabase.from("invoice_templates").insert({
        name: validation.data.name,
        category: validation.data.category || null,
        background_base64: base64,
      });
      
      if (error) throw error;
      
      setFile(null);
      setName("");
      setCategory("");
      await loadTemplates();
      toast.success("Template erfolgreich hochgeladen");
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {!editingFields ? (
        <>
          {/* Sidebar */}
          <div className="w-1/4 border-r bg-card p-4 overflow-y-auto">
            <h2 className="font-bold text-lg mb-4 text-foreground">Rechnungsvorlagen</h2>

            {/* Upload-Bereich */}
            <div className="border rounded-lg p-3 mb-6 bg-muted/50">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name des Templates"
                className="mb-2"
                maxLength={100}
              />
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Kategorie (optional)"
                className="mb-2"
                maxLength={50}
              />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mb-2 w-full text-sm text-muted-foreground"
              />
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? "Wird hochgeladen..." : "Template speichern"}
              </Button>
            </div>

            {/* Template-Liste */}
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground mb-2 px-1">
                {templates.length} Template(s) verfügbar
              </div>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left border-2 rounded-lg p-3 transition-all ${
                    selected?.id === t.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:bg-accent hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    {selected?.id === t.id && (
                      <div className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Ausgewählt
                      </div>
                    )}
                  </div>
                  {t.background_base64 && (
                    <img
                      src={t.background_base64}
                      alt={t.name}
                      className="w-full h-24 object-contain rounded border border-border/50"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Hauptbereich: Vorschau */}
          <div className="flex-1 flex flex-col bg-muted/30 p-6">
            {selected ? (
              <div className="space-y-4">
                <div className="flex gap-4 items-center">
                  <Button
                    onClick={() => setEditingFields(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Felder platzieren
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Rechnung für Vorschau:</label>
                    <select
                      value={selectedInvoice || ""}
                      onChange={(e) => setSelectedInvoice(e.target.value || null)}
                      className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                    >
                      <option value="">-- Demo-Daten --</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} - {inv.customer?.name || 'Unbekannt'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-center overflow-auto">
                  <DraggableInvoiceFields 
                    templateId={selected?.id || ""} 
                    templateName={selected?.name || ""}
                    showBackground={true}
                    invoiceId={selectedInvoice}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground italic">
                  Wählen Sie ein Template aus oder laden Sie eines hoch.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Felder-Editor */
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-4">
            <Button
              onClick={() => setEditingFields(false)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </div>
          <div className="flex justify-center">
            <DraggableInvoiceFields 
              templateId={selected?.id || ""} 
              templateName={selected?.name || ""}
              showBackground={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
