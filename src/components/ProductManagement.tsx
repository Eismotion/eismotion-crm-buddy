import { Filter, Plus, Edit, Trash2, Package, Snowflake, Sun, Leaf, Flower } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockProducts, formatCurrency } from '@/data/mockData';

export const ProductManagement = () => {
  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'Winter': return <Snowflake className="h-5 w-5 text-season-winter" />;
      case 'Sommer': return <Sun className="h-5 w-5 text-season-summer" />;
      case 'Herbst': return <Leaf className="h-5 w-5 text-season-autumn" />;
      case 'Frühling': return <Flower className="h-5 w-5 text-season-spring" />;
      default: return <Package className="h-5 w-5 text-season-yearround" />;
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
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
                {getSeasonIcon(product.season)}
                <span className="text-sm font-medium">{product.season}</span>
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
