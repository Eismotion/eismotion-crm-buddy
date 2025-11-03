import { Plus, Edit, Trash2, Package, Snowflake, Sun, Leaf, Flower, RefreshCw, ShieldCheck, Search, Upload, Download, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductEditDialog } from './ProductEditDialog';

export const ProductManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadSuppliers();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true })
        .order('product_id', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Fehler beim Laden der Produkte');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .order('category');

      if (error) throw error;
      const uniqueCategories = Array.from(new Set(data.map(p => p.category))).filter(Boolean);
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('supplier')
        .order('supplier');

      if (error) throw error;
      const uniqueSuppliers = Array.from(new Set(data.map(p => p.supplier))).filter(Boolean);
      setSuppliers(uniqueSuppliers as string[]);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;

    try {
      // Lösche Bild falls vorhanden
      if (deleteProduct.image_url) {
        const path = deleteProduct.image_url.split('/product-images/')[1];
        if (path) {
          await supabase.storage.from('product-images').remove([path]);
        }
      }

      // Lösche Produkt
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProduct.id);

      if (error) throw error;

      toast.success('Produkt gelöscht');
      loadProducts();
      loadCategories();
      loadSuppliers();
    } catch (error: any) {
      toast.error('Fehler beim Löschen: ' + error.message);
    } finally {
      setDeleteProduct(null);
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: !product.active })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(product.active ? 'Produkt deaktiviert' : 'Produkt aktiviert');
      loadProducts();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const filteredProducts = products
    .filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false;
      if (filterSupplier !== 'all' && p.supplier !== filterSupplier) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(query) ||
          p.product_id?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.supplier?.toLowerCase().includes(query)
        );
      }
      return true;
    });


  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Produktverwaltung</h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} von {products.length} Produkten
              </p>
            </div>
            <Button onClick={() => { setEditProduct(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Produkt
            </Button>
          </div>

          {/* Filter & Suche */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Lieferant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Lieferanten</SelectItem>
                {suppliers.map(sup => (
                  <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadProducts}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8">Laden...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">Keine Produkte gefunden</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Produktbild */}
                  <div className="mb-4">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted rounded flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        {product.product_id}
                      </Badge>
                      {!product.active && (
                        <Badge variant="secondary">Inaktiv</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-base line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>

                  {/* Spezifikationen */}
                  {(product.size || product.material) && (
                    <div className="mb-3 text-xs text-muted-foreground space-y-1">
                      {product.size && <div>📏 {product.size}</div>}
                      {product.material && <div>🏷️ {product.material}</div>}
                      {product.thickness && <div>📐 {product.thickness}</div>}
                    </div>
                  )}

                  {/* Preis */}
                  <div className="mb-3">
                    {product.price ? (
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(product.price)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Kein Preis hinterlegt</div>
                    )}
                  </div>

                  {/* Lieferant */}
                  {product.supplier && (
                    <div className="mb-3 text-xs text-muted-foreground">
                      🏭 {product.supplier}
                    </div>
                  )}

                  {/* Aktionen */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => { setEditProduct(product); setDialogOpen(true); }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Bearbeiten
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(product)}
                      title={product.active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      {product.active ? '✓' : '✗'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteProduct(product)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialoge */}
      <ProductEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
        categories={categories}
        onSave={() => {
          loadProducts();
          loadCategories();
          loadSuppliers();
        }}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Produkt löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deleteProduct?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};