import { Upload, Edit, Trash2, Plus, Palette, Image as ImageIcon, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockSprueche } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export const Settings = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Themen');
  const [templateTheme, setTemplateTheme] = useState('');
  const [templateOccasion, setTemplateOccasion] = useState('');
  const [templateSeason, setTemplateSeason] = useState('');
  const [templateHtml, setTemplateHtml] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssets();
    loadTemplates();
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

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('invoice_templates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading templates:', error);
    } else {
      setTemplates(data || []);
    }
  };

  const handleOpenTemplateDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setTemplateCategory(template.category || 'Themen');
      setTemplateTheme(template.theme || '');
      setTemplateOccasion(template.occasion || '');
      setTemplateSeason(template.season || '');
      setTemplateHtml(template.html_template || '');
    } else {
      setEditingTemplate(null);
      setTemplateName('');
      setTemplateCategory('Themen');
      setTemplateTheme('');
      setTemplateOccasion('');
      setTemplateSeason('');
      setTemplateHtml('<div style="padding: 20px;">Rechnungsvorlage</div>');
    }
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateName) {
      toast.error('Bitte Template-Name eingeben');
      return;
    }

    try {
      const templateData = {
        name: templateName,
        category: templateCategory,
        theme: templateTheme || null,
        occasion: templateOccasion || null,
        season: templateSeason || null,
        html_template: templateHtml,
        active: true,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('invoice_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) throw error;
        toast.success('Template aktualisiert');
      } else {
        const { error } = await supabase
          .from('invoice_templates')
          .insert(templateData);
        
        if (error) throw error;
        toast.success('Template erstellt');
      }

      setTemplateDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      console.error('Save template error:', error);
      toast.error('Fehler beim Speichern: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('invoice_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Template gelöscht');
      loadTemplates();
    } catch (error: any) {
      console.error('Delete template error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Bitte neues Passwort eingeben und bestätigen');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Passwort erfolgreich geändert');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error('Passwort konnte nicht geändert werden: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setChangingPassword(false);
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

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      toast.error('Ungültiges Dateiformat. Erlaubt: XLS, XLSX, CSV');
      return;
    }

    setImporting(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          console.log('Parsed data:', jsonData);

          // Transform InvoiceHome format to our format
          const importData = jsonData.map((row: any) => ({
            customerName: row['Kunde'] || '',
            invoiceNumber: row['Nummer'] || '',
            invoiceDate: row['Datum'] || '',
            paidDate: row['Bezahlt am'] || null,
            dueDate: row['Fällig am'] || null,
            subtotal: parseFloat(row['Betrag']) || 0,
            taxAmount: parseFloat(row['Steuer']) || 0,
            totalAmount: parseFloat(row['Gesamt']) || 0,
            currency: row['Währung'] || 'EUR',
            paymentMethod: row['Zahlungsmethode'] || '',
            status: row['Bezahlt am'] ? 'bezahlt' : 'offen'
          }));

          console.log('Transformed data:', importData);

          // Call edge function
          const { data: result, error } = await supabase.functions.invoke('import-invoicehome', {
            body: {
              data: importData,
              importType: 'invoicehome_excel'
            }
          });

          if (error) throw error;

          toast.success(
            `Import erfolgreich! ${result.successful} von ${result.processed} Rechnungen importiert.`
          );

          if (result.failed > 0) {
            console.error('Import errors:', result.errors);
            toast.warning(`${result.failed} Rechnungen konnten nicht importiert werden.`);
          }
        } catch (error: any) {
          console.error('Parse error:', error);
          toast.error('Fehler beim Verarbeiten der Datei: ' + error.message);
        } finally {
          setImporting(false);
          if (importInputRef.current) {
            importInputRef.current.value = '';
          }
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Fehler beim Import: ' + error.message);
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Einstellungen</h2>
        <p className="text-muted-foreground">Konfigurieren Sie Ihr CRM-System</p>
      </div>

      {/* Passwort ändern */}
      <Card>
        <CardHeader>
          <CardTitle>Passwort ändern</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">Neues Passwort</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mind. 8 Zeichen"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Passwort bestätigen</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword || !confirmPassword}>
              {changingPassword ? 'Wird aktualisiert...' : 'Passwort speichern'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
          <Button onClick={() => handleOpenTemplateDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Neues Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Noch keine Templates vorhanden</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div 
                      className="aspect-[3/4] rounded-lg mb-3 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5"
                    >
                      <Palette className="h-12 w-12 text-primary opacity-50" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      {(template.theme || template.occasion || template.season) && (
                        <div className="flex gap-1 flex-wrap">
                          {template.theme && <Badge variant="outline" className="text-xs">{template.theme}</Badge>}
                          {template.occasion && <Badge variant="outline" className="text-xs">{template.occasion}</Badge>}
                          {template.season && <Badge variant="outline" className="text-xs">{template.season}</Badge>}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleOpenTemplateDialog(template)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Bearbeiten
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie eine Rechnungsvorlage mit HTML/CSS
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name *</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="z.B. Weihnachts-Rechnung"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-category">Kategorie</Label>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger id="template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Themen">Themen</SelectItem>
                    <SelectItem value="Jahreszeiten">Jahreszeiten</SelectItem>
                    <SelectItem value="Anlässe">Anlässe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-theme">Thema</Label>
                <Input
                  id="template-theme"
                  value={templateTheme}
                  onChange={(e) => setTemplateTheme(e.target.value)}
                  placeholder="z.B. Weihnachten"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-occasion">Anlass</Label>
                <Input
                  id="template-occasion"
                  value={templateOccasion}
                  onChange={(e) => setTemplateOccasion(e.target.value)}
                  placeholder="z.B. Feiertag"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-season">Saison</Label>
                <Input
                  id="template-season"
                  value={templateSeason}
                  onChange={(e) => setTemplateSeason(e.target.value)}
                  placeholder="z.B. Winter"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-html">HTML Template</Label>
              <Textarea
                id="template-html"
                value={templateHtml}
                onChange={(e) => setTemplateHtml(e.target.value)}
                placeholder="<div>...</div>"
                className="font-mono text-sm"
                rows={12}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveTemplate}>
              {editingTemplate ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <input
            ref={importInputRef}
            type="file"
            accept=".xls,.xlsx,.csv"
            onChange={handleImportFile}
            className="hidden"
            disabled={importing}
          />
          <div 
            onClick={() => !importing && importInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {importing ? 'Import läuft...' : 'InvoiceHome Datei importieren'}
            </p>
            <p className="text-xs text-muted-foreground">
              Unterstützte Formate: XLS, XLSX, CSV
            </p>
            <Button className="mt-4" disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Wird importiert...' : 'Datei auswählen'}
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Tipp:</strong> Sie können mehrere Dateien nacheinander hochladen (z.B. 2025, dann 2024, dann 2023)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
