import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { formatCurrency } from '@/lib/adminUtils';
import logger from '@/lib/utils/logger';

const COMMISSION_RATE = 0.10;

const methodLabels = {
  free: 'Gratis',
  wallet: 'Billetera',
  mercadopago: 'MercadoPago',
};

const statusLabels = {
  completed: 'Completada',
  pending: 'Pendiente',
  failed: 'Fallida',
  refunded: 'Reembolsada',
};

const statusColors = {
  completed: 'text-green-600',
  pending: 'text-yellow-600',
  failed: 'text-red-600',
  refunded: 'text-gray-500',
};

const MarketplaceMetricsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [activeProducts, setActiveProducts] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all purchases
      const { data: purchaseData, error: purchaseErr } = await supabase
        .from('marketplace_purchases')
        .select('*')
        .order('created_at', { ascending: false });

      if (purchaseErr) throw purchaseErr;
      setPurchases(purchaseData || []);

      // Load active product count
      const { count, error: itemsErr } = await supabase
        .from('marketplace_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');

      if (itemsErr) {
        logger.warn('Could not count active products:', itemsErr.message);
      }
      setActiveProducts(count || 0);
    } catch (err) {
      logger.error('Error loading marketplace metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Compute KPIs
  const completed = purchases.filter(p => p.payment_status === 'completed');
  const totalRevenue = completed.reduce((sum, p) => sum + (p.price_paid || 0), 0);
  const paidCompleted = completed.filter(p => p.payment_method !== 'free');
  const totalCommissions = paidCompleted.reduce((sum, p) => sum + Math.round((p.price_paid || 0) * COMMISSION_RATE), 0);

  // Breakdown by payment method
  const methodBreakdown = ['free', 'wallet', 'mercadopago'].map(method => {
    const items = purchases.filter(p => p.payment_method === method);
    const completedItems = items.filter(p => p.payment_status === 'completed');
    const revenue = completedItems.reduce((sum, p) => sum + (p.price_paid || 0), 0);
    return { method, count: items.length, completedCount: completedItems.length, revenue };
  });

  // Breakdown by status
  const statusBreakdown = ['completed', 'pending', 'failed', 'refunded'].map(status => {
    const items = purchases.filter(p => p.payment_status === status);
    const revenue = items.reduce((sum, p) => sum + (p.price_paid || 0), 0);
    return { status, count: items.length, revenue };
  });

  // Breakdown by month (last 6 months)
  const monthlyBreakdown = (() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short' });

      const monthPurchases = purchases.filter(p => {
        const pd = new Date(p.created_at);
        return pd.getFullYear() === year && pd.getMonth() === month;
      });
      const monthCompleted = monthPurchases.filter(p => p.payment_status === 'completed');
      const revenue = monthCompleted.reduce((sum, p) => sum + (p.price_paid || 0), 0);
      const commissions = monthCompleted
        .filter(p => p.payment_method !== 'free')
        .reduce((sum, p) => sum + Math.round((p.price_paid || 0) * COMMISSION_RATE), 0);

      months.push({ key, label, count: monthPurchases.length, revenue, commissions });
    }
    return months;
  })();

  if (loading) {
    return (
      <PermissionGuard module="marketplace" action="read">
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard module="marketplace" action="read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/marketplace')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Metricas del Marketplace</h1>
            <p className="text-muted-foreground text-sm">Vista agregada de ventas, ingresos y comisiones</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-teal-500" />
                <p className="text-sm text-muted-foreground">Total Ventas</p>
              </div>
              <p className="text-2xl font-bold">{purchases.length}</p>
              <p className="text-xs text-muted-foreground">{completed.length} completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Comisiones Totales (10%)</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCommissions)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Productos Activos</p>
              </div>
              <p className="text-2xl font-bold">{activeProducts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown by Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desglose por Metodo de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metodo</TableHead>
                  <TableHead className="text-right">Total Compras</TableHead>
                  <TableHead className="text-right">Completadas</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methodBreakdown.map(row => (
                  <TableRow key={row.method}>
                    <TableCell>
                      <Badge variant="outline">{methodLabels[row.method] || row.method}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.count}</TableCell>
                    <TableCell className="text-right">{row.completedCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Breakdown by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desglose por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statusBreakdown.map(row => (
                <div key={row.status} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className={`text-2xl font-bold ${statusColors[row.status] || ''}`}>{row.count}</p>
                  <p className="text-sm text-muted-foreground">{statusLabels[row.status] || row.status}</p>
                  {row.revenue > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(row.revenue)}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ultimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Comisiones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyBreakdown.map(row => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium capitalize">{row.label}</TableCell>
                    <TableCell className="text-right">{row.count}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.revenue)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(row.commissions)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default MarketplaceMetricsPage;
