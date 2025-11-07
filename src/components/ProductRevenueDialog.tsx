import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/data/mockData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ProductRevenue {
  rank: number;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

interface ProductRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductRevenueDialog({ open, onOpenChange }: ProductRevenueDialogProps) {
  const [products, setProducts] = useState<ProductRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProductRevenue();
    }
  }, [open]);

  const loadProductRevenue = async () => {
    setLoading(true);
    try {
      // Hole alle Invoice Items mit nicht-stornierten Rechnungen
      const { data: items, error } = await supabase
        .from('invoice_items')
        .select('description, quantity, total_price, unit_price, invoice_id, invoices!inner(status)')
        .neq('invoices.status', 'storniert');

      if (error) throw error;
      if (!items) return;

      // Gruppiere nach Produkt
      const productMap = new Map<string, {
        name: string;
        quantitySold: number;
        totalRevenue: number;
        prices: number[];
      }>();

      items.forEach((item: any) => {
        const productName = item.description || 'Unbekannt';
        const quantity = Number(item.quantity || 0);
        const revenue = Number(item.total_price || 0);
        const unitPrice = Number(item.unit_price || 0);

        const existing = productMap.get(productName);
        if (existing) {
          existing.quantitySold += quantity;
          existing.totalRevenue += revenue;
          existing.prices.push(unitPrice);
        } else {
          productMap.set(productName, {
            name: productName,
            quantitySold: quantity,
            totalRevenue: revenue,
            prices: [unitPrice]
          });
        }
      });

      // Konvertiere zu Array und sortiere nach Umsatz
      const sorted = Array.from(productMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Erstelle Produkt-Array mit Trend (vereinfacht - könnte mit historischen Daten erweitert werden)
      const productList = sorted.map((product, index) => {
        const averagePrice = product.totalRevenue / product.quantitySold;
        
        // Vereinfachter Trend basierend auf Preis-Varianz
        const priceVariance = product.prices.length > 1 
          ? Math.abs(product.prices[product.prices.length - 1] - product.prices[0]) / product.prices[0]
          : 0;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercent = 0;
        
        if (priceVariance > 0.05) {
          if (product.prices[product.prices.length - 1] > product.prices[0]) {
            trend = 'up';
            trendPercent = priceVariance * 100;
          } else {
            trend = 'down';
            trendPercent = -priceVariance * 100;
          }
        }

        return {
          rank: index + 1,
          productName: product.name,
          quantitySold: product.quantitySold,
          totalRevenue: product.totalRevenue,
          averagePrice,
          trend,
          trendPercent
        };
      });

      setProducts(productList);
    } catch (error) {
      console.error('Error loading product revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendText = (trend: 'up' | 'down' | 'stable', percent: number) => {
    if (trend === 'stable') return '0%';
    const sign = trend === 'up' ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Produkt-Umsätze</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Alle Produkte sortiert nach Gesamtumsatz
          </p>
        </DialogHeader>
        
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Laden...</div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Produkt</TableHead>
                  <TableHead className="text-right">Verkauft</TableHead>
                  <TableHead className="text-right">Gesamtumsatz</TableHead>
                  <TableHead className="text-right">Ø Preis</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={`${product.rank}-${product.productName}`}>
                    <TableCell className="text-center font-medium">
                      {product.rank}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.productName}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.quantitySold.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(product.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.averagePrice)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(product.trend)}
                        <span className={`text-sm ${
                          product.trend === 'up' ? 'text-green-600' : 
                          product.trend === 'down' ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {getTrendText(product.trend, product.trendPercent)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
