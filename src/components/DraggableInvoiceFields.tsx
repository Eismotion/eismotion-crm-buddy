import { useEffect, useState } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Edit, RotateCcw } from "lucide-react";

type Field = { 
  field_name: string; 
  x: number; 
  y: number;
  label: string;
  value: string;
};

interface DraggableInvoiceFieldsProps {
  templateName?: string;
  showBackground?: boolean;
}

const DEFAULT_FIELDS: Field[] = [
  { field_name: "customer_name", x: 100, y: 180, label: "Kundenname", value: "Max Mustermann" },
  { field_name: "customer_address", x: 100, y: 210, label: "Adresse", value: "Musterstraße 123" },
  { field_name: "customer_city", x: 100, y: 240, label: "Stadt", value: "12345 Berlin" },
  { field_name: "invoice_number", x: 100, y: 80, label: "Rechnungsnr.", value: "RE-2024-001" },
  { field_name: "invoice_date", x: 100, y: 110, label: "Datum", value: "15.01.2024" },
  { field_name: "due_date", x: 100, y: 140, label: "Fällig am", value: "31.01.2024" },
  { field_name: "items_table", x: 100, y: 300, label: "Positionen", value: "[Tabelle hier]" },
  { field_name: "total_amount", x: 400, y: 650, label: "Gesamtbetrag", value: "148,75 €" },
];

export default function DraggableInvoiceFields({ 
  templateName = "Eismotion – Headerbild",
  showBackground = true
}: DraggableInvoiceFieldsProps) {
  const [fields, setFields] = useState<Field[]>(DEFAULT_FIELDS);
  const [editMode, setEditMode] = useState(true);
  const [backgroundBase64, setBackgroundBase64] = useState<string | null>(null);

  // Template-Hintergrund laden
  useEffect(() => {
    if (!showBackground) return;
    
    const loadBackground = async () => {
      try {
        const { data, error } = await supabase
          .from("invoice_templates")
          .select("background_base64")
          .eq("name", templateName)
          .maybeSingle();
        
        if (error) {
          console.error("Error loading background:", error);
          return;
        }

        if (data?.background_base64) {
          setBackgroundBase64(data.background_base64);
        }
      } catch (err) {
        console.error("Error loading background:", err);
      }
    };
    loadBackground();
  }, [templateName, showBackground]);

  // Feldpositionen laden
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const { data, error } = await supabase
          .from("invoice_field_positions")
          .select("*")
          .eq("template_name", templateName);
        
        if (error) {
          console.error("Error loading positions:", error);
          return;
        }

        if (data && data.length > 0) {
          setFields((prev) =>
            prev.map((f) => {
              const saved = data.find((d) => d.field_name === f.field_name);
              return saved ? { ...f, x: Number(saved.x), y: Number(saved.y) } : f;
            })
          );
        }
      } catch (err) {
        console.error("Error loading positions:", err);
      }
    };
    loadPositions();
  }, [templateName]);

  // Speichern bei Loslassen
  const handleStop = (fieldName: string, x: number, y: number) => {
    // Update local state immediately for responsive UI
    setFields((prev) =>
      prev.map((f) =>
        f.field_name === fieldName ? { ...f, x, y } : f
      )
    );

    // Save to database asynchronously
    (async () => {
      try {
        const { error } = await supabase
          .from("invoice_field_positions")
          .upsert({
            template_name: templateName,
            field_name: fieldName,
            x,
            y,
          }, {
            onConflict: "template_name,field_name"
          });

        if (error) {
          console.error("Error saving position:", error);
          toast.error("Fehler beim Speichern");
          return;
        }
      } catch (err) {
        console.error("Error saving position:", err);
        toast.error("Fehler beim Speichern");
      }
    })();
  };

  // Layout zurücksetzen
  const handleReset = async () => {
    try {
      const { error } = await supabase
        .from("invoice_field_positions")
        .delete()
        .eq("template_name", templateName);

      if (error) {
        console.error("Error resetting layout:", error);
        toast.error("Fehler beim Zurücksetzen");
        return;
      }

      setFields(DEFAULT_FIELDS);
      toast.success("Layout zurückgesetzt");
    } catch (err) {
      console.error("Error resetting layout:", err);
      toast.error("Fehler beim Zurücksetzen");
    }
  };

  const containerStyle = showBackground && backgroundBase64 
    ? {
        backgroundImage: `url(${backgroundBase64})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top center",
      }
    : {};

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="flex items-center justify-between gap-2 bg-muted p-3 rounded-lg">
        <div className="text-sm font-medium">
          {editMode ? "🟣 Bearbeitungsmodus" : "👁️ Vorschau"}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {editMode ? (
              <>
                <Eye className="h-4 w-4" />
                Vorschau
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" />
                Bearbeiten
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div 
        className="relative w-[210mm] h-[297mm] border bg-white overflow-hidden shadow-lg"
        style={containerStyle}
      >
        {editMode && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-50">
            💡 Tipp: Felder mit Maus verschieben
          </div>
        )}
        
        {fields.map((f) => (
          editMode ? (
            <Draggable
              key={f.field_name}
              position={{ x: f.x, y: f.y }}
              onStop={(e, d) => handleStop(f.field_name, d.x, d.y)}
              bounds="parent"
            >
              <div
                className="absolute bg-yellow-200/90 border-2 border-yellow-500 rounded px-3 py-2 cursor-move hover:bg-yellow-300 transition-colors shadow-lg select-none"
                style={{ fontSize: 14 }}
              >
                <div className="font-bold text-xs text-gray-600 mb-1">{f.label}</div>
                <div className="text-gray-900">{f.value}</div>
              </div>
            </Draggable>
          ) : (
            <div
              key={f.field_name}
              className="absolute"
              style={{
                left: f.x,
                top: f.y,
                fontSize: 14,
                fontWeight: 500,
                color: "#333",
                pointerEvents: "none",
              }}
            >
              {f.value}
            </div>
          )
        ))}
      </div>
    </div>
  );
}
