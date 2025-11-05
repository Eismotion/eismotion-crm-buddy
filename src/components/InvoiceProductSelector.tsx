import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatCurrency } from '@/data/mockData';

interface InvoiceProductSelectorProps {
  invoiceId: string;
  onItemsChange?: () => void;
}

export const InvoiceProductSelector = ({ invoiceId, onItemsChange }: InvoiceProductSelectorProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadInvoiceItems();
  }, [invoiceId]);

  useEffect(() => {
    if (selectedCategory) {
      loadProductsByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        setSelectedProduct(product);
        setUnitPrice(product.price?.toString() || '');
      }
    }
  }, [selectedProductId, products]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('active', true)
        .order('category');

      if (error) throw error;
      const uniqueCategories = Array.from(new Set(data.map(p => p.category))).filter(Boolean);
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProductsByCategory = async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .eq('active', true)
        .order('product_id');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadInvoiceItems = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at');

      if (error) throw error;
      setInvoiceItems(data || []);
    } catch (error) {
      console.error('Error loading invoice items:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast.error('Bitte wählen Sie ein Produkt');
      return;
    }

    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      toast.error('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    if (quantity <= 0) {
      toast.error('Menge muss größer als 0 sein');
      return;
    }

    setLoading(true);
    try {
      const price = parseFloat(unitPrice);
      const total = price * quantity;

      const { error } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: invoiceId,
          product_id: selectedProduct.id,
          description: selectedProduct.name,
          quantity: quantity,
          unit_price: price,
          total_price: total,
          size: selectedProduct.size,
          material: selectedProduct.material,
          thickness: selectedProduct.thickness,
        });

      if (error) throw error;

      toast.success('Position hinzugefügt');
      await loadInvoiceItems();
      
      // Reset form
      setSelectedCategory('');
      setSelectedProductId('');
      setSelectedProduct(null);
      setQuantity(1);
      setUnitPrice('');
      
      onItemsChange?.();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Position entfernt');
      await loadInvoiceItems();
      onItemsChange?.();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Produktauswahl */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Produkt hinzufügen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Kategorie */}
            <div>
              <Label>Kategorie *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Produkt */}
            <div>
              <Label>Produkt *</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedCategory ? "Produkt wählen" : "Zuerst Kategorie wählen"} />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_id} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Produktdetails */}
          {selectedProduct && (
            <div className="bg-muted/50 p-4 rounded-lg mb-4">
              <div className="flex items-start gap-4">
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                ) : (
                  <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{selectedProduct.name}</h4>
                  {selectedProduct.description && (
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.size && (
                      <Badge variant="outline">Größe: {selectedProduct.size}</Badge>
                    )}
                    {selectedProduct.material && (
                      <Badge variant="outline">Material: {selectedProduct.material}</Badge>
                    )}
                    {selectedProduct.thickness && (
                      <Badge variant="outline">Stärke: {selectedProduct.thickness}</Badge>
                    )}
                    {selectedProduct.quantity && (
                      <Badge variant="outline">Menge: {selectedProduct.quantity}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Menge und Preis */}
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Anzahl *</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label>Einzelpreis (Netto) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Gesamtpreis (Netto)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-semibold">
                  {formatCurrency((parseFloat(unitPrice) || 0) * quantity)}
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleAddProduct} 
            disabled={!selectedProduct || loading}
            className="w-full mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Position hinzufügen
          </Button>
        </CardContent>
      </Card>

      {/* Rechnungspositionen */}
      {invoiceItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Rechnungspositionen</h3>
            
            <div className="space-y-4">
              {invoiceItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{index + 1}.</span>
                        <h4 className="font-semibold">{item.description}</h4>
                        {item.product_id && (
                          <Badge variant="outline" className="text-xs">
                            {item.product_id}
                          </Badge>
                        )}
                      </div>
                      
                      {(item.size || item.material || item.thickness) && (
                        <div className="text-sm text-muted-foreground mb-2">
                          {item.size && <span>Größe: {item.size}</span>}
                          {item.size && item.material && <span> | </span>}
                          {item.material && <span>Material: {item.material}</span>}
                          {item.material && item.thickness && <span> | </span>}
                          {item.thickness && <span>Stärke: {item.thickness}</span>}
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="text-muted-foreground">Menge:</span> {item.quantity} × {formatCurrency(item.unit_price)} = 
                        <span className="font-semibold ml-1">{formatCurrency(item.total_price)}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Summe */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Zwischensumme (Netto):</span>
                  <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
