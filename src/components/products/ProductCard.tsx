import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCartStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  availableColors?: string[];
  sizes?: string[];
  stock: number;
}

export function ProductCard({
  id,
  name,
  description,
  category,
  price,
  imageUrl,
  availableColors,
  sizes,
  stock,
}: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string | undefined>(availableColors?.[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(sizes?.[0]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const { toast } = useToast();

  const handleAddToCart = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    addItem({
      productId: id,
      productName: name,
      quantity: 1,
      color: selectedColor,
      size: selectedSize,
      unitPrice: price,
      imageUrl,
    });

    toast({
      title: 'Added to cart',
      description: `${name} has been added to your cart.`,
    });
  };

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <div className="aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <Badge variant="secondary" className="mb-2">
          {category}
        </Badge>
        <h3 className="font-semibold text-lg text-foreground">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
        )}
        <p className="text-xl font-bold text-foreground mt-2">${price.toFixed(2)}</p>
        
        <div className="mt-3 space-y-2">
          {availableColors && availableColors.length > 0 && (
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {availableColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {sizes && sizes.length > 0 && (
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={handleAddToCart}
          disabled={stock === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
