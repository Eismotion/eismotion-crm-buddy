import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, Package, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProductEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  categories: string[];
  onSave: () => void;
}

export const ProductEditDialog = ({ open, onOpenChange, product, categories, onSave }: ProductEditDialogProps) => {
  const [formData, setFormData] = useState<any>({
    product_id: '',
    name: '',
    category: '',
    description: '',
    size: '',
    material: '',
    thickness: '',
    quantity: '',
    price: '',
    supplier: '',
    supplier_product_id: '',
    supplier_price: '',
    image_url: '',
    active: true,
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (product) {
      setFormData(product);
      setImagePreview(product.image_url || '');
    } else {
      // Generiere neue Produkt-ID für neues Produkt
      setFormData({
        product_id: '',
        name: '',
        category: categories[0] || '',
        description: '',
        size: '',
        material: '',
        thickness: '',
        quantity: '',
        price: '',
        supplier: '',
        supplier_product_id: '',
        supplier_price: '',
        image_url: '',
        active: true,
      });
      setImagePreview('');
    }
  }, [product, categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild ist zu groß (max. 5 MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilddateien sind erlaubt');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${formData.product_id || Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast.error('Fehler beim Hochladen: ' + error.message);
      return formData.image_url;
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (formData.image_url) {
      try {
        const path = formData.image_url.split('/product-images/')[1];
        if (path) {
          await supabase.storage.from('product-images').remove([path]);
        }
      } catch (error) {
        console.error('Fehler beim Löschen:', error);
      }
    }
    setImageFile(null);
    setImagePreview('');
    setFormData({ ...formData, image_url: '' });
  };

  const calculateMargin = () => {
    const price = parseFloat(formData.price) || 0;
    const supplierPrice = parseFloat(formData.supplier_price) || 0;
    if (price === 0) return 0;
    return (((price - supplierPrice) / price) * 100).toFixed(1);
  };

  const handleSave = async () => {
    if (!formData.product_id || !formData.name || !formData.category) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setUploading(true);
    try {
      // Upload image if changed
      const imageUrl = await uploadImage();

      const dataToSave = {
        ...formData,
        image_url: imageUrl,
        price: formData.price ? parseFloat(formData.price) : null,
        supplier_price: formData.supplier_price ? parseFloat(formData.supplier_price) : null,
      };

      if (product) {
        // Update existing
        const { error } = await supabase
          .from('products')
          .update(dataToSave)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Produkt aktualisiert');
      } else {
        // Create new
        const { error } = await supabase
          .from('products')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Produkt erstellt');
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Produkt bearbeiten' : 'Neues Produkt'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Grunddaten */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Grunddaten</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Produkt-ID *</Label>
                <Input
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  disabled={!!product}
                  placeholder="ES-1001"
                  className={!!product ? 'bg-muted' : ''}
                />
              </div>
              <div>
                <Label>Kategorie *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Produktname *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={200}
              />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          {/* Spezifikationen */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Spezifikationen</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Größe</Label>
                <Input
                  value={formData.size || ''}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  placeholder="10x21 cm"
                />
              </div>
              <div>
                <Label>Material</Label>
                <Input
                  value={formData.material || ''}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="Acrylglas"
                />
              </div>
              <div>
                <Label>Stärke</Label>
                <Input
                  value={formData.thickness || ''}
                  onChange={(e) => setFormData({ ...formData, thickness: e.target.value })}
                  placeholder="3mm"
                />
              </div>
              <div>
                <Label>Menge</Label>
                <Input
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1 Stück"
                />
              </div>
            </div>
          </div>

          {/* Preise */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Preise
              {formData.price && formData.supplier_price && (
                <Badge variant="outline" className="ml-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Marge: {calculateMargin()}%
                </Badge>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Verkaufspreis (Netto)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Einkaufspreis</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.supplier_price || ''}
                  onChange={(e) => setFormData({ ...formData, supplier_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Lieferant */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Lieferant</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lieferant</Label>
                <Input
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Firma XY"
                />
              </div>
              <div>
                <Label>Artikel-Nr. beim Lieferanten</Label>
                <Input
                  value={formData.supplier_product_id || ''}
                  onChange={(e) => setFormData({ ...formData, supplier_product_id: e.target.value })}
                  placeholder="ART-12345"
                />
              </div>
            </div>
          </div>

          {/* Produktbild */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Produktbild</h3>
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Produktbild"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 flex items-center justify-center bg-muted rounded border">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  Max. 5 MB, JPG, PNG oder WebP
                </p>
              </div>
            </div>
          </div>

          {/* Aktionen */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
