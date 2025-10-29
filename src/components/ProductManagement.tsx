import { Plus, Edit, Trash2, Package, Snowflake, Sun, Leaf, Flower, RefreshCw, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const ProductManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeason, setFilterSeason] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = filterSeason === 'all' 
    ? products 
    : products.filter(p => p.season === filterSeason);

  const seasons = ['Ganzjährig', 'Winter', 'Frühling', 'Sommer', 'Herbst'];

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'Winter': return <Snowflake className="h-5 w-5 text-season-winter" />;
      case 'Sommer': return <Sun className="h-5 w-5 text-season-summer" />;
      case 'Herbst': return <Leaf className="h-5 w-5 text-season-autumn" />;
      case 'Frühling': return <Flower className="h-5 w-5 text-season-spring" />;
      default: return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'Winter': return 'bg-season-winter/10 text-season-winter border-season-winter/20';
      case 'Sommer': return 'bg-season-summer/10 text-season-summer border-season-summer/20';
      case 'Herbst': return 'bg-season-autumn/10 text-season-autumn border-season-autumn/20';
      case 'Frühling': return 'bg-season-spring/10 text-season-spring border-season-spring/20';
      default: return 'bg-muted/50 text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Produktverwaltung</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihr Produktsortiment ({products.length} Produkte)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadProducts} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Aktualisieren</span>
          </Button>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="all">Alle Saisons</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="sm:inline">Neues Produkt</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-8">Laden...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">Keine Produkte gefunden</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getSeasonIcon(product.season)}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge 
                    variant="outline" 
                    className={getSeasonColor(product.season)}
                  >
                    {product.season}
                  </Badge>
                  {product.is_tax_exempt && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" />
                      MwSt-frei
                    </Badge>
                  )}
                  {product.production_country && product.production_country !== 'DE' && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {product.production_country}
                    </Badge>
                  )}
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  {!product.is_tax_exempt && (
                    <span className="text-xs text-muted-foreground">zzgl. MwSt</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};