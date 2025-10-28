import { useState } from "react";
import { useTemplates, getBackgroundImageUrl, getThumbnailImageUrl } from "@/contexts/TemplateContext";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const InvoiceDesignStudioV2 = () => {
  const { templates, selectedTemplate, isLoading, error, selectTemplate } = useTemplates();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Templates werden geladen...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Fehler beim Laden der Templates:</strong>
            <br />
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty State
  if (templates.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-lg">
            Keine Templates vorhanden
          </p>
          <p className="text-sm text-muted-foreground">
            Bitte erstellen Sie zuerst ein Template in den Einstellungen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-1/4 border-r bg-card p-4 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4 text-foreground">Rechnungsvorlagen</h2>
        <div className="space-y-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                selectTemplate(t.id);
                setImageLoaded(false); // Reset image loaded state
              }}
              className={`w-full text-left border rounded-lg p-2 transition-colors ${
                selectedTemplate?.id === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <div className="text-sm font-semibold mb-1 text-foreground">{t.name}</div>
              {getThumbnailImageUrl(t) ? (
                <img
                  src={getThumbnailImageUrl(t)!}
                  alt={t.name}
                  className="w-full h-24 object-contain rounded"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-muted rounded text-xs text-muted-foreground">
                  Kein Vorschaubild
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vorschau */}
      <div className="flex-1 flex items-center justify-center bg-muted/30 p-6">
        {selectedTemplate ? (
          <div className="shadow-lg border border-border bg-card p-4 rounded-lg">
            <h3 className="font-bold mb-3 text-center text-foreground">{selectedTemplate.name}</h3>
            
            {getBackgroundImageUrl(selectedTemplate) ? (
              <div className="relative">
                {/* Preload image */}
                <img
                  src={getBackgroundImageUrl(selectedTemplate)!}
                  onLoad={() => {
                    setImageLoaded(true);
                    console.log(`✅ Template background loaded: ${selectedTemplate.name}`);
                  }}
                  onError={(e) => {
                    console.error(`❌ Failed to load template background: ${selectedTemplate.name}`);
                    setImageLoaded(false);
                  }}
                  style={{ display: 'none' }}
                  alt="Preload"
                />
                
                {/* Loading indicator */}
                {!imageLoaded && (
                  <div className="w-[210mm] h-[297mm] flex items-center justify-center bg-muted">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">Hintergrundbild wird geladen...</p>
                    </div>
                  </div>
                )}
                
                {/* Actual preview */}
                {imageLoaded && (
                  <div
                    style={{
                      backgroundImage: `url(${getBackgroundImageUrl(selectedTemplate)})`,
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      width: '210mm',
                      height: '297mm',
                    }}
                    className="shadow-inner"
                  />
                )}
              </div>
            ) : (
              <div className="w-[210mm] h-[297mm] flex items-center justify-center bg-muted text-muted-foreground">
                <div className="text-center space-y-2">
                  <AlertCircle className="h-8 w-8 mx-auto" />
                  <p>Kein Hintergrundbild vorhanden</p>
                  <p className="text-xs">Bitte laden Sie ein Hintergrundbild in den Einstellungen hoch.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground italic">
            Bitte wählen Sie ein Template aus
          </p>
        )}
      </div>
    </div>
  );
};
