import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";

interface TemplateBackgroundUploaderProps {
  templateName: string;
  onUploadComplete?: () => void;
}

export default function TemplateBackgroundUploader({ 
  templateName, 
  onUploadComplete 
}: TemplateBackgroundUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validierung
    if (!file.type.startsWith("image/")) {
      toast.error("Bitte nur Bilddateien hochladen (PNG, JPG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei zu groß (max. 5 MB)");
      return;
    }

    setUploading(true);
    toast.info("Bild wird verarbeitet...");

    try {
      // Konvertiere zu Base64
      const base64 = await toBase64(file);
      console.log("Base64 conversion complete, length:", base64.length);

      // Erstelle Thumbnail für Vorschau
      const thumbnail = await createThumbnail(file);
      console.log("Thumbnail created");

      // Lade aktuelles Template
      const { data: template, error: fetchError } = await supabase
        .from("invoice_templates")
        .select("html_template, css_styles")
        .eq("name", templateName)
        .single();

      if (fetchError) throw fetchError;

      // Speichere Base64 und Thumbnail
      const { error: updateError } = await supabase
        .from("invoice_templates")
        .update({ 
          background_base64: base64,
          thumbnail_base64: thumbnail,
          updated_at: new Date().toISOString()
        })
        .eq("name", templateName);

      if (updateError) throw updateError;

      toast.success("Hintergrundbild erfolgreich gespeichert!");
      onUploadComplete?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  // Erstelle ein verkleinertes Thumbnail für die Vorschau
  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Thumbnail-Größe (max 300px Breite, A4-Verhältnis beibehalten)
          const maxWidth = 300;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL(file.type));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-card">
      <div>
        <Label htmlFor="bg-upload" className="text-sm font-medium">
          Hintergrundbild hochladen (Base64)
        </Label>
        <p className="text-xs text-muted-foreground mt-1">
          PNG oder JPG, max. 5 MB
        </p>
      </div>
      
      <div className="flex gap-2">
        <Input
          id="bg-upload"
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={handleFileUpload}
          disabled={uploading}
          className="flex-1"
        />
        <Button disabled={uploading} size="icon" variant="secondary">
          <Upload className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
