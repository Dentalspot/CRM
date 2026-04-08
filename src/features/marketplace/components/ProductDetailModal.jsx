import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/adminUtils';
import { Package } from 'lucide-react';

const ProductDetailModal = ({ product, isOpen, onClose, onPurchase }) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{product.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {(product.image_url || (Array.isArray(product.gallery_urls) && product.gallery_urls.length > 0)) ? (
            <img src={product.image_url || product.gallery_urls[0]} alt={product.title} className="w-full h-48 object-cover rounded-lg" />
          ) : (
            <div className="w-full h-48 bg-slate-100 rounded-lg flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-300" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="outline">{product.item_type || 'Material'}</Badge>
            {product.category && <Badge variant="secondary">{product.category}</Badge>}
          </div>
          <p className="text-sm text-gray-600">{product.description || 'Sin descripción'}</p>
          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-2xl font-bold">{formatCurrency(product.price || 0)}</span>
            {onPurchase && (
              <Button onClick={() => onPurchase(product)}>Ver recurso</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
