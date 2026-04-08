import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Package, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { formatCurrency } from '@/lib/adminUtils';
import logger from '@/lib/utils/logger';

const COMMISSION_RATE = 0.10;

const VendorPerformancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load marketplace items with seller info
      const { data: items, error: itemsErr } = await supabase
        .from('marketplace_items')
        .select('id, seller_id, status, profiles!marketplace_items_seller_id_fkey(full_name, email)');

      if (itemsErr) {
        logger.warn('Items join failed, trying without join:', itemsErr.message);
        // Fallback without join
        const { data: fallbackItems, error: fbErr } = await supabase
          .from('marketplace_items')
          .select('id, seller_id, status');
        if (fbErr) throw fbErr;
        // We'll need profiles separately
        const sellerIds = [...new Set((fallbackItems || []).map(i => i.seller_id).filter(Boolean))];
        const { data: profiles } = sellerIds.length > 0
          ? await supabase.from('profiles').select('id, full_name, email').in('id', sellerIds)
          : { data: [] };
        const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
        // Attach profiles manually
        for (const item of (fallbackItems || [])) {
          item.profiles = profileMap[item.seller_id] || null;
        }
        // Continue with fallback data
        processVendors(fallbackItems || []);
        return;
      }

      processVendors(items || []);
    } catch (err) {
      logger.error('Error loading vendor performance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const processVendors = useCallback(async (items) => {
    try {
      // Group items by seller
      const sellerMap = {};
      for (const item of items) {
        const sid = item.seller_id;
        if (!sid) continue;
        if (!sellerMap[sid]) {
          sellerMap[sid] = {
            sellerId: sid,
            name: item.profiles?.full_name || 'Sin nombre',
            email: item.profiles?.email || '',
            totalProducts: 0,
            activeProducts: 0,
            totalSales: 0,
            totalRevenue: 0,
            totalCommissions: 0,
          };
        }
        sellerMap[sid].totalProducts += 1;
        if (item.status === 'published') sellerMap[sid].activeProducts += 1;
      }

      // Load purchases joined with plans to get author_id
      const { data: purchases, error: purchErr } = await supabase
        .from('marketplace_purchases')
        .select('id, price_paid, payment_status, payment_method, marketplace_plan_id, plan:marketplace_plans!marketplace_purchases_marketplace_plan_id_fkey(author_id)')
        .eq('payment_status', 'completed');

      if (purchErr) {
        logger.warn('Purchases join failed, trying without join:', purchErr.message);
        // Fallback: load purchases and plans separately
        const { data: rawPurchases } = await supabase
          .from('marketplace_purchases')
          .select('id, price_paid, payment_status, payment_method, marketplace_plan_id')
          .eq('payment_status', 'completed');

        const planIds = [...new Set((rawPurchases || []).map(p => p.marketplace_plan_id).filter(Boolean))];
        const { data: plans } = planIds.length > 0
          ? await supabase.from('marketplace_plans').select('id, author_id').in('id', planIds)
          : { data: [] };
        const planMap = Object.fromEntries((plans || []).map(p => [p.id, p]));

        for (const p of (rawPurchases || [])) {
          const plan = planMap[p.marketplace_plan_id];
          const authorId = plan?.author_id;
          if (authorId && sellerMap[authorId]) {
            sellerMap[authorId].totalSales += 1;
            sellerMap[authorId].totalRevenue += (p.price_paid || 0);
            if (p.payment_method !== 'free') {
              sellerMap[authorId].totalCommissions += Math.round((p.price_paid || 0) * COMMISSION_RATE);
            }
          }
        }
      } else {
        // Use joined data
        for (const p of (purchases || [])) {
          const authorId = p.plan?.author_id;
          if (authorId && sellerMap[authorId]) {
            sellerMap[authorId].totalSales += 1;
            sellerMap[authorId].totalRevenue += (p.price_paid || 0);
            if (p.payment_method !== 'free') {
              sellerMap[authorId].totalCommissions += Math.round((p.price_paid || 0) * COMMISSION_RATE);
            }
          }
        }
      }

      // Sort by total revenue descending
      const sorted = Object.values(sellerMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
      setVendors(sorted);
    } catch (err) {
      logger.error('Error processing vendor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Summary stats
  const totalVendors = vendors.length;
  const totalRevenue = vendors.reduce((sum, v) => sum + v.totalRevenue, 0);
  const totalSales = vendors.reduce((sum, v) => sum + v.totalSales, 0);
  const totalProducts = vendors.reduce((sum, v) => sum + v.totalProducts, 0);

  return (
    <PermissionGuard module="marketplace" action="read">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/marketplace')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Rendimiento de Vendedores</h1>
            <p className="text-muted-foreground text-sm">Ranking de vendedores por ingresos generados</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-teal-500" />
                    <p className="text-sm text-muted-foreground">Vendedores</p>
                  </div>
                  <p className="text-2xl font-bold">{totalVendors}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-purple-500" />
                    <p className="text-sm text-muted-foreground">Total Productos</p>
                  </div>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <p className="text-sm text-muted-foreground">Total Ventas</p>
                  </div>
                  <p className="text-2xl font-bold">{totalSales}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                  </div>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Vendor Ranking Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ranking de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {vendors.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">No hay vendedores con productos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Productos</TableHead>
                        <TableHead className="text-right">Activos</TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Comisiones (10%)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((v, idx) => (
                        <TableRow key={v.sellerId}>
                          <TableCell>
                            {idx < 3 ? (
                              <Badge variant={idx === 0 ? 'default' : 'outline'} className="text-xs">
                                {idx + 1}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">{idx + 1}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{v.name}</p>
                            {v.email && (
                              <p className="text-xs text-muted-foreground">{v.email}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{v.totalProducts}</TableCell>
                          <TableCell className="text-right">{v.activeProducts}</TableCell>
                          <TableCell className="text-right font-medium">{v.totalSales}</TableCell>
                          <TableCell className="text-right font-bold">{formatCurrency(v.totalRevenue)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatCurrency(v.totalCommissions)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground text-right">
              {vendors.length} vendedores registrados
            </p>
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default VendorPerformancePage;
