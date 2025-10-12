import { Upload, Edit, Trash2, Plus, Palette, Image as ImageIcon, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockTemplates, mockSprueche } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const Settings = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const { data, error } = await supabase
      .from('design_assets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading assets:', error);
    } else {
      setAssets(data || []);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Datei ist zu groß. Maximale Größe: 5MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpg|jpeg|svg\+xml)$/)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: PNG, JPG, SVG');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'Logos');
      formData.append('name', file.name);

      const { data, error } = await supabase.functions.invoke('upload-design-asset', {
        body: formData,
      });

      if (error) throw error;

      toast.success('Bild erfolgreich hochgeladen!');
      loadAssets();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAsset = async (assetId: string, filePath: string) => {
    try {
      // Delete from storage
      const fileName = filePath.split('/').pop();
      const category = filePath.split('/')[0];
      if (fileName) {
        await supabase.storage
          .from('design-assets')
          .remove([`${category}/${fileName}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from('design_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;

      toast.success('Bild gelöscht');
      loadAssets();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Einstellungen</h2>
        <p className="text-muted-foreground">Konfigurieren Sie Ihr CRM-System</p>
      </div>

      {/* Template Library */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Rechnungsvorlagen
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Verwalten Sie Ihre Design-Templates
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neues Template
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div 
                    className="aspect-[3/4] rounded-lg mb-3 flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${template.colors.secondary} 0%, ${template.colors.primary} 100%)`
                    }}
                  >
                    <Palette className="h-12 w-12 text-white opacity-50" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{template.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Bearbeiten
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Design Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bild-Bibliothek
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Verwalten Sie Ihre hochgeladenen Bilder
            </p>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpg,image/jpeg,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                {uploading ? 'Wird hochgeladen...' : 'Bilder hochladen'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, SVG bis 5MB
              </p>
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>{assets.length}</strong> Bilder hochgeladen
              </p>
            </div>
            
            {assets.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="relative group border rounded-lg overflow-hidden">
                    <img 
                      src={asset.file_url} 
                      alt={asset.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteAsset(asset.id, asset.file_url)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="p-2 bg-background">
                      <p className="text-xs truncate">{asset.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Sprüche-Sammlung
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Ihre eigenen Texte und Sprüche
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockSprueche.slice(0, 4).map((spruch, idx) => (
              <div 
                key={idx}
                className="p-3 border rounded-lg flex items-start justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <Badge variant="secondary" className="mb-1 text-xs">
                    {spruch.category}
                  </Badge>
                  <p className="text-sm">{spruch.text}</p>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Neuen Spruch hinzufügen
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Import */}
      <Card>
        <CardHeader>
          <CardTitle>Datenimport</CardTitle>
          <p className="text-sm text-muted-foreground">
            Importieren Sie Daten aus InvoiceHome
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">InvoiceHome CSV importieren</p>
            <p className="text-xs text-muted-foreground">
              Unterstützte Formate: CSV, Excel (.xlsx)
            </p>
            <Button className="mt-4">
              <Upload className="h-4 w-4 mr-2" />
              Datei auswählen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
