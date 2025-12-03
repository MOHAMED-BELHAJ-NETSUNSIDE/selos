import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  productId: number;
  productName: string;
  quantity: number;
  category?: string;
  onSelect?: () => void;
}

export function ProductCard({ 
  productName, 
  quantity, 
  category,
  onSelect 
}: ProductCardProps) {
  const getQuantityColor = (qty: number) => {
    if (qty === 0) return 'bg-red-100 text-red-800 border-red-300';
    if (qty < 10) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:scale-[1.02] border-2"
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{productName}</CardTitle>
            {category && (
              <p className="text-xs text-muted-foreground mt-1">{category}</p>
            )}
          </div>
          <Badge className={cn(getQuantityColor(quantity), "text-sm font-semibold px-3 py-1 rounded-lg ml-4")}>
            {quantity}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

