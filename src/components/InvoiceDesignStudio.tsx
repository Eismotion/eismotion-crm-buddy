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
import { getSeasonInfo, sortTemplatesBySeason } from '@/lib/seasonUtils';

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
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const seasonInfo = getSeasonInfo();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      renderPreview(selectedTemplate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate, customText]);

  const loadTemplates = async () => {
    try {
      // Ensure Eismotion template with header image exists
      const { data: existing } = await supabase
        .from('invoice_templates')
        .select('id')
        .eq('name', 'Eismotion – Headerbild')
        .maybeSingle();

      if (!existing) {
        const eismotionHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      color: #222; 
      margin: 0;
      padding: 0;
    }
    .page-container { 
      max-width: 900px; 
      margin: 0 auto; 
      min-height: 100vh;
      background-image: url('/templates/eismotion-header-background.png');
      background-size: cover;
      background-repeat: no-repeat;
      background-position: top center;
      position: relative;
    }
    .content-wrapper {
      padding-top: 250px;
      padding-bottom: 150px;
      padding-left: 48px;
      padding-right: 48px;
    }
    .top-address { 
      text-align: center; 
      font-size: 12px; 
      color: #333; 
      padding: 10px 20px; 
      margin-bottom: 20px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 4px;
    }
    .content { 
      background: rgba(255, 255, 255, 0.98);
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .title { 
      font-size: 26px; 
      color: #5b2c7d; 
      margin-bottom: 16px; 
      font-weight: 700;
    }
    .details { 
      display: flex; 
      justify-content: space-between; 
      gap: 24px; 
      margin: 18px 0 24px; 
    }
    .details .box { width: 50%; }
    .label { font-weight: 700; color: #333; }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-top: 24px; 
    }
    th { 
      background: #5b2c7d; 
      color: #fff; 
      text-align: left; 
      padding: 10px; 
      font-weight: 500; 
    }
    td { 
      padding: 10px; 
      border-bottom: 1px solid #e5e7eb; 
    }
    .totals { 
      margin-top: 18px; 
      text-align: right; 
    }
    .totals .row { margin: 6px 0; }
    .totals .final { 
      margin-top: 10px; 
      font-weight: 700; 
      color: #5b2c7d; 
      font-size: 18px; 
    }
    .footer { 
      display: grid; 
      grid-template-columns: 1fr 1fr 1fr; 
      gap: 24px; 
      margin-top: 32px;
      padding: 24px 32px; 
      font-size: 12px; 
      color: #333; 
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
    }
    .footer h4 { 
      font-size: 12px; 
      margin-bottom: 8px; 
      color: #5b2c7d; 
      font-weight: 700;
    }
    .note { 
      margin-top: 24px; 
      padding: 16px; 
      background: #f5e6fa; 
      border-left: 4px solid #5b2c7d; 
      color: #5b2c7d; 
      font-style: italic; 
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="content-wrapper">
      <div class="top-address">Eismotion.de – Juan Chabas 4 – 03700 Denia</div>
      
      <div class="content">
        <h1 class="title">Rechnung {{invoice_number}}</h1>
        
        <div class="details">
          <div class="box">
            <div><span class="label">Kunde:</span> {{customer_name}}</div>
            <div>{{customer_address}}</div>
            <div>{{customer_postal_code}} {{customer_city}}</div>
          </div>
          <div class="box" style="text-align:right">
            <div><span class="label">Rechnungsdatum:</span> {{invoice_date}}</div>
            <div><span class="label">Fälligkeitsdatum:</span> {{due_date}}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th style="text-align:right;width:100px;">Menge</th>
              <th style="text-align:right;width:120px;">Einzelpreis</th>
              <th style="text-align:right;width:120px;">Gesamt</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{description}}</td>
              <td style="text-align:right;">{{quantity}}</td>
              <td style="text-align:right;">{{unit_price}} €</td>
              <td style="text-align:right;">{{total_price}} €</td>
            </tr>
            {{/each}}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="row"><span class="label">Zwischensumme:</span> {{subtotal}} €</div>
          <div class="row"><span class="label">MwSt. ({{tax_rate}}%):</span> {{tax_amount}} €</div>
          <div class="row final"><span class="label">Gesamtbetrag:</span> {{total_amount}} €</div>
        </div>
        
        {{#if custom_message}}
        <div class="note">{{custom_message}}</div>
        {{/if}}
      </div>
      
      <div class="footer">
        <div>
          <h4>Eismotion.de</h4>
          <div>Sabrina Caberlotto</div>
          <div>Carrer Georges Bernanos 60</div>
          <div>07015 Palma de Mallorca</div>
        </div>
        <div>
          <h4>Kontakt</h4>
          <div>Tel. +49 151 6333 1700</div>
          <div>Email: info@eismotion.de</div>
          <div>Web: www.eismotion.de</div>
        </div>
        <div>
          <h4>Bankverbindung</h4>
          <div>Banco Sabadell</div>
          <div>IBAN: ES9300810159690001802781</div>
          <div>BIC: BSABESBB</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

        await supabase.from('invoice_templates').insert({
          name: 'Eismotion – Headerbild',
          category: 'Themen',
          season: 'Sommer',
          theme: 'Eiscafe',
          html_template: eismotionHtml,
          css_styles: '',
          colors: { primary: '#5b2c7d', secondary: '#e8d5f2', accent: '#f5e6fa' },
          active: true,
          is_public: true
        });
      }

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
          html_template: template.html_template,
          occasion: template.occasion
        };
      });

      // Sortiere Templates nach aktueller Saison - passende Templates kommen zuerst
      const sortedTemplates = sortTemplatesBySeason(formattedTemplates);
      
      setTemplates(sortedTemplates);
      if (sortedTemplates.length > 0) {
        // Wähle automatisch das erste (passendste) Template
        setSelectedTemplate(sortedTemplates[0]);
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

  const renderPreview = async (template: InvoiceTemplate) => {
    setPreviewLoading(true);
    try {
      const body = {
        templateId: template.id,
        invoiceId: null,
        customizations: {
          colors: template.colors,
          custom_message: customText
        }
      } as any;

      const { data, error } = await supabase.functions.invoke('render-invoice-template', {
        body
      });

      if (error) throw error as any;
      const html = (data as any)?.html || (typeof data === 'string' ? data : template.html_template);
      // Base href für root-relative Assets + führendes IMG als Hintergrund umwandeln
      const ensureBase = (raw: string) => {
        if (!raw) return raw;
        if (!raw.includes('<base ')) {
          raw = raw.includes('</head>') ? raw.replace('</head>', '<base href="/" />\n</head>') : `<head><base href="/" /></head>${raw}`;
        }
        return raw;
      };
      const transformLeadingImage = (raw: string) => {
        try {
          const docIdx = raw.search(/<!DOCTYPE|<html/i);
          const prefix = docIdx > -1 ? raw.slice(0, docIdx) : raw;
          const body = docIdx > -1 ? raw.slice(docIdx) : '';
          const m = prefix.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
          if (!m) return raw;
          const url = m[1];
          const cleaned = (docIdx > -1 ? prefix.replace(m[0], '') + body : raw.replace(m[0], ''));
          const css = `.header{background-image:url('${url}') !important;background-size:cover;background-position:center;}
.page{position:relative;}
.page::before{content:"";position:absolute;inset:0 0 auto 0;height:230px;background:url('${url}') center/cover no-repeat;z-index:0;}
.top-address,.content,.footer,.footer-bar{position:relative;z-index:1;background:transparent;}`;
          const inject = (htmlStr: string, cssStr: string) => htmlStr.includes('</head>')
            ? htmlStr.replace('</head>', `<style>${cssStr}</style></head>`)
            : `<head><style>${cssStr}</style></head>${htmlStr}`;
          return inject(cleaned, css);
        } catch {
          return raw;
        }
      };
      const processed = transformLeadingImage(ensureBase(html));
      setPreviewHtml(processed);
    } catch (err) {
      console.warn('Preview render failed, falling back to raw template:', err);
      setPreviewHtml(template.html_template);
    } finally {
      setPreviewLoading(false);
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
          <p className="text-sm text-muted-foreground">
            Erstellen Sie einzigartige Rechnungen • Aktuelle Saison: {seasonInfo.occasion || seasonInfo.season}
          </p>
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
              <div 
                className="bg-white shadow-2xl rounded overflow-hidden"
                style={{
                  width: `${210 * (zoom / 100)}mm`,
                  height: `${297 * (zoom / 100)}mm`,
                }}
              >
                {previewLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Vorschau wird gerendert ...
                  </div>
                ) : (
                  <iframe
                    title={`Vorschau ${selectedTemplate.name}`}
                    srcDoc={previewHtml || selectedTemplate.html_template}
                    className="w-full h-full"
                  />
                )}
              </div>
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
