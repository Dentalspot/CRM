import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, ShoppingCart, DollarSign, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import logger from '@/lib/utils/logger';
import { formatCurrency } from '@/lib/adminUtils';

const COMMISSION_RATE = 0.10;

const statusLabels = {
  completed: 'Completada',
  pending: 'Pendiente',
  failed: 'Fallida',
  refunded: 'Reembolsada',
};
const statusColors = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};
const methodLabels = {
  free: 'Gratis',
  wallet: 'Billetera',
  mercadopago: 'MercadoPago',
};

const SalesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ totalSales: 0, totalRevenue: 0, totalCommissions: 0, completedCount: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get purchases with buyer profile info
      let query = supabase
        .from('marketplace_purchases')
        .select(`
          *,
          buyer:profiles!marketplace_purchases_buyer_id_fkey(full_name, email),
          plan:marketplace_plans!marketplace_purchases_marketplace_plan_id_fkey(name, author_name, price_clp)
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      const { data, error } = await query;
      if (error) {
        // Fallback: query without joins if FK names differ
        logger.warn('Purchases join failed, trying without joins:', error.message);
        const { data: fallbackData, error: fbErr } = await supabase
          .from('marketplace_purchases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        if (fbErr) throw fbErr;
        setPurchases(fallbackData || []);
      } else {
        setPurchases(data || []);
      }

      // Calculate stats
      const allPurchases = data || [];
      const completed = allPurchases.filter(p => p.payment_status === 'completed');
      const totalRevenue = completed.reduce((sum, p) => sum + (p.price_paid || 0), 0);
      const paidOnly = completed.filter(p => p.payment_method !== 'free');
      const totalCommissions = paidOnly.reduce((sum, p) => sum + Math.round((p.price_paid || 0) * COMMISSION_RATE), 0);

      setStats({
        totalSales: allPurchases.length,
        totalRevenue,
        totalCommissions,
        completedCount: completed.length,
      });
    } catch (err) {
      logger.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Filters
  const filtered = purchases.filter(p => {
    if (statusFilter !== 'all' && p.payment_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const buyerName = p.buyer?.full_name || '';
      const planName = p.plan?.name || '';
      return buyerName.toLowerCase().includes(q) || planName.toLowerCase().includes(q) || p.id?.includes(q);
    }
    return true;
  });

  return (
    <PermissionGuard module="marketplace" action="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ventas Marketplace</h1>
            <p className="text-muted-foreground text-sm">Todas las compras realizadas en la plataforma</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="h-4 w-4 text-teal-500" />
                <p className="text-sm text-muted-foreground">Total Ventas</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalSales}</p>
              <p className="text-xs text-muted-foreground">{stats.completedCount} completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Ingresos</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Comisiones (10%)</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCommissions)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-purple-500" />
                <p className="text-sm text-muted-foreground">Métodos</p>
              </div>
              <div className="flex gap-1 flex-wrap mt-1">
                {['free', 'wallet', 'mercadopago'].map(m => {
                  const count = purchases.filter(p => p.payment_method === m).length;
                  if (!count) return null;
                  return <Badge key={m} variant="outline" className="text-xs">{methodLabels[m]} ({count})</Badge>;
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por comprador o producto..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="failed">Fallidas</SelectItem>
              <SelectItem value="refunded">Reembolsadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay ventas {statusFilter !== 'all' ? 'con ese estado' : ''}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => {
                    const commission = p.payment_method !== 'free' ? Math.round((p.price_paid || 0) * COMMISSION_RATE) : 0;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">
                          {p.plan?.name || p.marketplace_plan_id?.slice(0, 8) || '—'}
                          {p.plan?.author_name && (
                            <span className="block text-xs text-muted-foreground">por {p.plan.author_name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.buyer?.full_name || '—'}
                          {p.buyer?.email && (
                            <span className="block text-xs text-muted-foreground">{p.buyer.email}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {methodLabels[p.payment_method] || p.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.price_paid === 0 ? 'Gratis' : formatCurrency(p.price_paid || 0)}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {commission > 0 ? formatCurrency(commission) : '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.payment_status] || 'bg-gray-100 text-gray-600'}`}>
                            {statusLabels[p.payment_status] || p.payment_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL') : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-right">
          Mostrando {filtered.length} de {purchases.length} ventas
        </p>
      </div>
    </PermissionGuard>
  );
};

export default SalesPage;
