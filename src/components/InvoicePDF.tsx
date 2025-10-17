import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  customer_address?: string;
  customer_postal_code?: string;
  customer_city?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  custom_message?: string;
}

interface InvoicePDFProps {
  invoiceData: InvoiceData;
  templateName?: string;
}

export default function InvoicePDF({ invoiceData, templateName = "Eismotion – Headerbild" }: InvoicePDFProps) {
  const [backgroundBase64, setBackgroundBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Hintergrund laden (aus Supabase background_base64 Feld)
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from("invoice_templates")
          .select("background_base64")
          .eq("name", templateName)
          .single();

        if (error) {
          console.error("Template load error:", error);
          return;
        }

        if (data?.background_base64) {
          setBackgroundBase64(data.background_base64);
          console.log("Background Base64 loaded from DB field");
        }
      } catch (err) {
        console.error("Error loading template:", err);
      }
    };
    loadTemplate();
  }, [templateName]);

  // PDF-Erzeugung
  const generatePDF = async () => {
    if (!pdfRef.current) {
      toast.error("PDF-Vorschau nicht verfügbar");
      return;
    }

    setLoading(true);
    toast.info("PDF wird erstellt...");

    try {
      const opt = {
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `Eismotion_Rechnung_${invoiceData.invoice_number}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { 
          scale: 3, 
          useCORS: true,
          logging: false,
          letterRendering: true
        },
        jsPDF: { 
          unit: "mm" as const, 
          format: "a4" as const, 
          orientation: "portrait" as const
        },
      };

      await html2pdf().set(opt).from(pdfRef.current).save();
      toast.success("PDF erfolgreich exportiert!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Fehler beim PDF-Export");
    } finally {
      setLoading(false);
    }
  };

  // Hintergrund-Style
  const bgStyle = backgroundBase64
    ? {
        backgroundImage: `url(${backgroundBase64})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "top center",
        width: "210mm",
        minHeight: "297mm",
        position: "relative" as const,
        backgroundColor: "transparent",
      }
    : {
        width: "210mm",
        minHeight: "297mm",
        position: "relative" as const,
        background: "#ffffff",
      };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* PDF Vorschau */}
      <div 
        ref={pdfRef} 
        style={bgStyle} 
        className="shadow-2xl"
      >
        {/* Content Layer - darüber liegend */}
        <div style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
        }}>
          {/* Rechnungsdaten */}
          <div style={{
            position: "absolute",
            top: "80mm",
            left: "20mm",
            right: "20mm",
            fontSize: "11pt",
            lineHeight: "1.6",
            color: "#1a1a1a"
          }}>
            {/* Rechnungskopf */}
            <div style={{ marginBottom: "8mm" }}>
              <p style={{ margin: "2mm 0", fontWeight: "bold", fontSize: "13pt" }}>
                Rechnung Nr. {invoiceData.invoice_number}
              </p>
              <p style={{ margin: "1mm 0" }}>
                Datum: {new Date(invoiceData.invoice_date).toLocaleDateString("de-DE")}
              </p>
            </div>

            {/* Kundeninfo */}
            <div style={{ marginBottom: "10mm" }}>
              <p style={{ fontWeight: "bold", margin: "1mm 0" }}>{invoiceData.customer_name}</p>
              {invoiceData.customer_address && (
                <p style={{ margin: "1mm 0" }}>{invoiceData.customer_address}</p>
              )}
              {(invoiceData.customer_postal_code || invoiceData.customer_city) && (
                <p style={{ margin: "1mm 0" }}>
                  {invoiceData.customer_postal_code} {invoiceData.customer_city}
                </p>
              )}
            </div>

            {/* Positionen */}
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              marginBottom: "8mm",
              fontSize: "10pt"
            }}>
              <thead>
                <tr style={{ 
                  borderBottom: "2px solid #333",
                  fontWeight: "bold"
                }}>
                  <th style={{ textAlign: "left", padding: "3mm 0" }}>Artikel</th>
                  <th style={{ textAlign: "center", padding: "3mm 0" }}>Menge</th>
                  <th style={{ textAlign: "right", padding: "3mm 0" }}>Einzelpreis</th>
                  <th style={{ textAlign: "right", padding: "3mm 0" }}>Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "2mm 0" }}>{item.description}</td>
                    <td style={{ textAlign: "center", padding: "2mm 0" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "2mm 0" }}>
                      {item.unit_price.toFixed(2)} €
                    </td>
                    <td style={{ textAlign: "right", padding: "2mm 0" }}>
                      {item.total_price.toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summen */}
            <div style={{ 
              marginLeft: "auto", 
              width: "60mm",
              fontSize: "10pt"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: "1mm 0"
              }}>
                <span>Zwischensumme:</span>
                <span>{invoiceData.subtotal.toFixed(2)} €</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: "1mm 0"
              }}>
                <span>MwSt. ({invoiceData.tax_rate}%):</span>
                <span>{invoiceData.tax_amount.toFixed(2)} €</span>
              </div>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between",
                padding: "3mm 0",
                borderTop: "2px solid #333",
                fontWeight: "bold",
                fontSize: "12pt"
              }}>
                <span>Gesamtbetrag:</span>
                <span>{invoiceData.total_amount.toFixed(2)} €</span>
              </div>
            </div>

            {/* Custom Message */}
            {invoiceData.custom_message && (
              <div style={{ 
                marginTop: "10mm",
                padding: "5mm",
                background: "#f9f9f9",
                borderLeft: "3px solid #333"
              }}>
                <p style={{ margin: 0, fontSize: "10pt" }}>
                  {invoiceData.custom_message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <Button
        onClick={generatePDF}
        disabled={loading}
        size="lg"
        className="gap-2"
      >
        <Download className="h-5 w-5" />
        {loading ? "PDF wird erstellt..." : "📄 PDF exportieren"}
      </Button>
    </div>
  );
}
