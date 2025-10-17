import { useEffect, useState } from "react";
import Draggable from "react-draggable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Field = { 
  field_name: string; 
  x: number; 
  y: number;
  label: string;
  value: string;
};

interface DraggableInvoiceFieldsProps {
  templateName?: string;
}

export default function DraggableInvoiceFields({ 
  templateName = "Eismotion – Headerbild" 
}: DraggableInvoiceFieldsProps) {
  const [fields, setFields] = useState<Field[]>([
    { field_name: "customer_name", x: 100, y: 180, label: "Kundenname", value: "Max Mustermann" },
    { field_name: "customer_address", x: 100, y: 210, label: "Adresse", value: "Musterstraße 123" },
    { field_name: "customer_city", x: 100, y: 240, label: "Stadt", value: "12345 Berlin" },
    { field_name: "invoice_number", x: 100, y: 80, label: "Rechnungsnr.", value: "RE-2024-001" },
    { field_name: "invoice_date", x: 100, y: 110, label: "Datum", value: "15.01.2024" },
    { field_name: "items_table", x: 100, y: 300, label: "Positionen", value: "[Tabelle hier]" },
    { field_name: "total_amount", x: 400, y: 650, label: "Gesamtbetrag", value: "148,75 €" },
  ]);

  // Positionen laden
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
          toast.success("Feldpositionen geladen");
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
        
        toast.success(`${fields.find(f => f.field_name === fieldName)?.label} Position gespeichert`);
      } catch (err) {
        console.error("Error saving position:", err);
        toast.error("Fehler beim Speichern");
      }
    })();
  };

  return (
    <div className="relative w-[210mm] h-[297mm] border bg-white overflow-hidden">
      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded z-50">
        💡 Tipp: Felder mit Maus verschieben
      </div>
      
      {fields.map((f) => (
        <Draggable
          key={f.field_name}
          position={{ x: f.x, y: f.y }}
          onStop={(e, d) => handleStop(f.field_name, d.x, d.y)}
          bounds="parent"
        >
          <div
            className="absolute bg-yellow-200/90 border-2 border-yellow-500 rounded px-3 py-2 cursor-move hover:bg-yellow-300 transition-colors shadow-lg"
            style={{ fontSize: 14 }}
          >
            <div className="font-bold text-xs text-gray-600 mb-1">{f.label}</div>
            <div className="text-gray-900">{f.value}</div>
          </div>
        </Draggable>
      ))}
    </div>
  );
}
