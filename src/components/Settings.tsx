import { Upload, Snowflake, Sun, Leaf, Flower } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const Settings = () => {
  const seasonalTemplates = [
    { season: 'Winter', icon: Snowflake, color: 'text-season-winter' },
    { season: 'Sommer', icon: Sun, color: 'text-season-summer' },
    { season: 'Herbst', icon: Leaf, color: 'text-season-autumn' },
    { season: 'Frühling', icon: Flower, color: 'text-season-spring' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Einstellungen</h2>
        <p className="text-muted-foreground">Konfigurieren Sie Ihr CRM-System</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Rechnungsvorlagen</CardTitle>
            <p className="text-sm text-muted-foreground">
              Passen Sie Ihre saisonalen Rechnungsdesigns an
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {seasonalTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.season}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${template.color}`} />
                    <span className="font-medium">{template.season}-Design</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Bearbeiten
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Data Import */}
        <Card>
          <CardHeader>
            <CardTitle>Datenimport</CardTitle>
            <p className="text-sm text-muted-foreground">
              Importieren Sie Daten aus externen Quellen
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              InvoiceHome CSV importieren
            </Button>
            <p className="text-sm text-muted-foreground">
              Unterstützte Formate: CSV, Excel (.xlsx)
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                Datei hier ablegen oder klicken zum Auswählen
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Maximale Dateigröße: 10 MB
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
