import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

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
      toast.error("Fehler beim Laden der Templates");
      return;
    }
    
    setTemplates(data || []);
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

      {/* Hauptbereich: Vorschau */}
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
            Wählen Sie ein Template aus oder laden Sie eines hoch.
          </p>
        )}
      </div>
    </div>
  );
}
