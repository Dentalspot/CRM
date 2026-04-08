/**
 * @file ProductsPendingPanel.jsx
 * @description Panel lateral con productos pendientes de aprobación.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ProductsPendingPanel = ({ products = [], loading = false }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-500" />
          Productos por Aprobar
          {products.length > 0 && (
            <Badge variant="secondary" className="text-xs">{products.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin productos pendientes
          </p>
        ) : (
          products.map((p) => (
            <Link
              key={p.id}
              to={`/admin/marketplace/products/${p.id}`}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.title || p.name || 'Sin título'}</p>
                <p className="text-xs text-muted-foreground">
                  {p.seller?.full_name || 'Vendedor desconocido'}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">Revisar</Badge>
            </Link>
          ))
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/marketplace/products">Ver Productos</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProductsPendingPanel;