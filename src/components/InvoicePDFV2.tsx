import { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import { useTemplates, getBackgroundImageUrl } from "@/contexts/TemplateContext";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function InvoicePDFV2({ invoiceData, templateName = "Eismotion – Headerbild" }: InvoicePDFProps) {
  const { templates, selectedTemplate, selectTemplateByName, isLoading: templatesLoading } = useTemplates();
  const [loading, setLoading] = useState(false);
  const [imagePreloaded, setImagePreloaded] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Select template by name when component mounts or templateName changes
  useEffect(() => {
    if (!templatesLoading && templates.length > 0) {
      selectTemplateByName(templateName);
    }
  }, [templateName, templatesLoading, templates]);

  // Preload background image
  useEffect(() => {
    const backgroundUrl = getBackgroundImageUrl(selectedTemplate);
    if (backgroundUrl) {
      const img = new Image();
      img.onload = () => {
        setImagePreloaded(true);
        console.log(`✅ PDF background image preloaded: ${selectedTemplate?.name}`);
      };
      img.onerror = () => {
        console.error(`❌ Failed to preload PDF background: ${selectedTemplate?.name}`);
        setImagePreloaded(false);
      };
      img.src = backgroundUrl;
    }
  }, [selectedTemplate, getBackgroundImageUrl(selectedTemplate)]);

  // PDF-Erzeugung
  const generatePDF = async () => {
    if (!pdfRef.current) {
      toast.error("PDF-Vorschau nicht verfügbar");
      return;
    }

    if (!getBackgroundImageUrl(selectedTemplate)) {
      toast.error("Kein Template-Hintergrund verfügbar");
      return;
    }

    if (!imagePreloaded) {
      toast.error("Hintergrundbild wird noch geladen, bitte warten...");
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
          letterRendering: true,
          allowTaint: true, // Allow Base64 images
        },
        jsPDF: { 
          unit: "mm" as const, 
          format: "a4" as const, 
          orientation: "portrait" as const
        },
      };

      await html2pdf().set(opt).from(pdfRef.current).save();
      toast.success("PDF erfolgreich exportiert!");
      console.log(`✅ PDF exported: Rechnung_${invoiceData.invoice_number}.pdf`);
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      toast.error("Fehler beim PDF-Export");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (templatesLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Templates werden geladen...</p>
      </div>
    );
  }

  // No template selected
  if (!selectedTemplate) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full min-h-[400px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Template "{templateName}" nicht gefunden.
            <br />
            Bitte erstellen Sie das Template in den Einstellungen.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Hintergrund-Style
  const backgroundUrl = getBackgroundImageUrl(selectedTemplate);
  const bgStyle = backgroundUrl
    ? {
        backgroundImage: `url(${backgroundUrl})`,
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
      {/* Preload indicator */}
      {selectedTemplate.background_base64 && !imagePreloaded && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Hintergrundbild wird geladen...</span>
        </div>
      )}

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
        disabled={loading || !imagePreloaded}
        size="lg"
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            PDF wird erstellt...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            📄 PDF exportieren
          </>
        )}
      </Button>

      {!imagePreloaded && selectedTemplate.background_base64 && (
        <p className="text-xs text-muted-foreground">
          Bitte warten Sie, bis das Hintergrundbild vollständig geladen ist.
        </p>
      )}
    </div>
  );
}
