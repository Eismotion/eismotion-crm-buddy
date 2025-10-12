import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, Image as ImageIcon, Type, Layout, Save, Eye, 
  ZoomIn, ZoomOut, Maximize2, Upload, Heart, Gift, Sun, 
  Snowflake, Leaf, Flower
} from 'lucide-react';
import { mockSprueche } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InvoiceTemplate {
  id: string;
  name: string;
  category: string;
  season?: string;
  theme?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  html_template: string;
}

export const InvoiceDesignStudio = () => {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [zoom, setZoom] = useState(100);
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_templates')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates = data.map(template => {
        // Extract colors from HTML template if not set in database
        let colors = { primary: '#1565C0', secondary: '#E3F2FD', accent: '#0D47A1' };
        
        if (template.colors && Object.keys(template.colors).length > 0) {
          colors = template.colors as any;
        } else if (template.html_template) {
          // Try to extract colors from CSS in HTML template based on template name
          if (template.name === 'Eismotion Classic') {
            colors = { primary: '#0ea5e9', secondary: '#eff6ff', accent: '#0284c7' };
          } else if (template.name === 'Eismotion Elegant') {
            colors = { primary: '#d4af37', secondary: '#fffbf0', accent: '#2c3e50' };
          } else if (template.name === 'Eismotion Winter') {
            colors = { primary: '#60a5fa', secondary: '#dbeafe', accent: '#93c5fd' };
          } else {
            // Generic extraction
            const colorMatches = template.html_template.match(/#([0-9a-fA-F]{6})/g);
            if (colorMatches && colorMatches.length >= 2) {
              colors.primary = colorMatches[0];
              colors.secondary = colorMatches[1];
              if (colorMatches.length >= 3) colors.accent = colorMatches[2];
            }
          }
        }

        return {
          id: template.id,
          name: template.name,
          category: template.category || 'Themen',
          season: template.season,
          theme: template.theme,
          colors,
          html_template: template.html_template
        };
      });

      setTemplates(formattedTemplates);
      if (formattedTemplates.length > 0) {
        setSelectedTemplate(formattedTemplates[0]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Fehler',
        description: 'Vorlagen konnten nicht geladen werden',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const zoomLevels = [50, 75, 100, 125, 150];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Winter': return <Snowflake className="h-4 w-4" />;
      case 'Sommer': return <Sun className="h-4 w-4" />;
      case 'Herbst': return <Leaf className="h-4 w-4" />;
      case 'Frühling': return <Flower className="h-4 w-4" />;
      case 'Geburtstag': return <Gift className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Lade Vorlagen...</p>
      </div>
    );
  }

  if (!selectedTemplate) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Keine Vorlagen verfügbar</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold">Rechnungsdesign-Studio</h2>
          <p className="text-sm text-muted-foreground">Erstellen Sie einzigartige Rechnungen</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Vorschau
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Template speichern
          </Button>
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Template Library */}
        <div className="w-80 border-r flex flex-col bg-muted/30 overflow-hidden">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold mb-3">Design-Bibliothek</h3>
            <Tabs defaultValue="themen" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="saisonal">Saisonal</TabsTrigger>
                <TabsTrigger value="themen">Themen</TabsTrigger>
                <TabsTrigger value="anlaesse">Anlässe</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="h-[calc(100vh-200px)] mt-4">
                <TabsContent value="saisonal" className="space-y-3 mt-0">
                  {templates.filter(t => t.category === 'Saisonal' || t.category === 'Jahreszeiten').map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate.id === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-[3/4] bg-gradient-to-br from-muted to-background rounded mb-2 flex items-center justify-center">
                          {getCategoryIcon(template.season || '')}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{template.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {template.season}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="themen" className="space-y-3 mt-0">
                  {templates.filter(t => t.category === 'Themen').map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate.id === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-[3/4] bg-gradient-to-br from-muted to-background rounded mb-2 flex items-center justify-center">
                          <Layout className="h-6 w-6" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{template.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {template.theme}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="anlaesse" className="space-y-3 mt-0">
                  {templates.filter(t => t.category === 'Anlässe').map((template) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTemplate.id === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardContent className="p-4">
                        <div className="aspect-[3/4] bg-gradient-to-br from-muted to-background rounded mb-2 flex items-center justify-center">
                          <Gift className="h-6 w-6" />
                        </div>
                        <span className="font-medium text-sm">{template.name}</span>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        {/* Middle Panel: Live Preview */}
        <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden min-w-0">
          {/* Zoom Controls */}
          <div className="p-4 border-b flex items-center justify-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            {zoomLevels.map((level) => (
              <Button
                key={level}
                variant={zoom === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setZoom(level)}
              >
                {level}%
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setZoom(Math.min(150, zoom + 25))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas */}
          <ScrollArea className="flex-1 p-8 overflow-auto">
            <div className="flex items-center justify-center min-h-full py-8">
              <Card 
                className="bg-white shadow-2xl"
                style={{
                  width: `${210 * (zoom / 100)}mm`,
                  minHeight: `${297 * (zoom / 100)}mm`,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center'
                }}
              >
                <CardContent className="p-8">
                  {/* Header */}
                  <div 
                    className="border-b-4 pb-6 mb-6"
                    style={{ borderColor: selectedTemplate.colors.primary }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-4xl font-bold" style={{ color: selectedTemplate.colors.primary }}>
                          Eismotion
                        </h1>
                        <p className="text-sm text-muted-foreground">Ihr Eisgenuss-Partner</p>
                      </div>
                      <div 
                        className="p-4 rounded-full"
                        style={{ backgroundColor: selectedTemplate.colors.secondary }}
                      >
                        {getCategoryIcon(selectedTemplate.season || selectedTemplate.theme || '')}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                      <p className="text-sm font-semibold mb-2">Rechnung an:</p>
                      <p className="text-sm">Max Mustermann</p>
                      <p className="text-sm">Musterstraße 123</p>
                      <p className="text-sm">12345 Berlin</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm"><span className="font-semibold">Rechnungsnr.:</span> 2025-001</p>
                      <p className="text-sm"><span className="font-semibold">Datum:</span> 11.10.2025</p>
                      <p className="text-sm"><span className="font-semibold">Fällig am:</span> 25.10.2025</p>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full mb-8">
                    <thead>
                      <tr style={{ backgroundColor: selectedTemplate.colors.secondary }}>
                        <th className="text-left p-2">Position</th>
                        <th className="text-right p-2">Menge</th>
                        <th className="text-right p-2">Preis</th>
                        <th className="text-right p-2">Gesamt</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">Vanilleeis - 2 Kugeln</td>
                        <td className="text-right p-2">2</td>
                        <td className="text-right p-2">€4,50</td>
                        <td className="text-right p-2">€9,00</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">Schokoladeneis - 2 Kugeln</td>
                        <td className="text-right p-2">1</td>
                        <td className="text-right p-2">€4,50</td>
                        <td className="text-right p-2">€4,50</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end mb-8">
                    <div className="w-64">
                      <div className="flex justify-between mb-2">
                        <span>Zwischensumme:</span>
                        <span>€13,50</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>MwSt. 19%:</span>
                        <span>€2,57</span>
                      </div>
                      <div 
                        className="flex justify-between text-lg font-bold pt-2 border-t-2"
                        style={{ borderColor: selectedTemplate.colors.primary }}
                      >
                        <span>Gesamt:</span>
                        <span style={{ color: selectedTemplate.colors.primary }}>€16,07</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Message */}
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: selectedTemplate.colors.secondary }}
                  >
                    <p className="font-medium" style={{ color: selectedTemplate.colors.primary }}>
                      {customText || 'Vielen Dank für Ihren Einkauf!'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel: Design Editor */}
        <div className="w-96 border-l flex flex-col bg-muted/30 overflow-hidden">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold">Design-Editor</h3>
          </div>

          <ScrollArea className="flex-1 overflow-auto">
            <Tabs defaultValue="farben" className="p-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="farben">
                  <Palette className="h-4 w-4 mr-2" />
                  Farben
                </TabsTrigger>
                <TabsTrigger value="bilder">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Bilder
                </TabsTrigger>
              </TabsList>

              <TabsContent value="farben" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Farbpalette</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Primärfarbe</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: selectedTemplate.colors.primary }}
                        />
                        <Input 
                          type="text" 
                          value={selectedTemplate.colors.primary}
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Sekundärfarbe</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: selectedTemplate.colors.secondary }}
                        />
                        <Input 
                          type="text" 
                          value={selectedTemplate.colors.secondary}
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Akzentfarbe</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: selectedTemplate.colors.accent }}
                        />
                        <Input 
                          type="text" 
                          value={selectedTemplate.colors.accent}
                          readOnly
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Sprüche & Texte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mockSprueche.slice(0, 3).map((spruch, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        className="w-full text-left justify-start h-auto p-3"
                        onClick={() => setCustomText(spruch.text)}
                      >
                        <div className="text-xs">
                          <Badge variant="secondary" className="mb-1 text-xs">
                            {spruch.category}
                          </Badge>
                          <p className="text-wrap">{spruch.text}</p>
                        </div>
                      </Button>
                    ))}
                    <div className="pt-2">
                      <Label>Eigener Text</Label>
                      <Input 
                        placeholder="Eigenen Spruch eingeben..."
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bilder" className="space-y-6 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bilder hochladen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Klicken oder Dateien hierher ziehen
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, SVG bis 5MB
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Icon-Bibliothek</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" size="icon">
                        <Snowflake className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Sun className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Leaf className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Flower className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Gift className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Heart className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
