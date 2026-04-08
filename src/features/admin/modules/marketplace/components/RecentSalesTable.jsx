/**
 * @file RecentSalesTable.jsx
 * @description Tabla de ventas recientes para el dashboard marketplace.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/adminUtils';
import MarketplaceStatusBadge from './MarketplaceStatusBadge';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
};

const RecentSalesTable = ({ sales = [], loading = false }) => {
  const navigate = useNavigate();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          Ventas Recientes
        </CardTitle>
        <Button variant="ghost" size="sm" className="text-primary" asChild>
          <Link to="/admin/marketplace/sales">
            Ver todas <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No hay ventas registradas</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>Vendedor</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow
                  key={sale.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => navigate(`/admin/marketplace/sales/${sale.id}`)}
                >
                  <TableCell className="font-medium">
                    {sale.plan?.name || sale.buyer?.full_name || 'Sin nombre'}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(sale.price_paid || sale.total_amount || 0)}
                  </TableCell>
                  <TableCell>
                    <MarketplaceStatusBadge status={sale.payment_status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(sale.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSalesTable;