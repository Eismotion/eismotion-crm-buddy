import { Filter, Plus, Edit, Trash2, Package, Snowflake, Sun, Leaf, Flower } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockProducts, formatCurrency } from '@/data/mockData';

export const ProductManagement = () => {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Produktverwaltung</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihr Produktsortiment</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Nach Saison
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neues Produkt
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getSeasonIcon(product.season)}
                </div>
              </div>
              
              <div className="mb-4">
                <Badge 
                  variant="outline" 
                  className={getSeasonColor(product.season)}
                >
                  {product.season}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
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
    </div>
  );
};
