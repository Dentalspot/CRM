import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMarketplaceAccess } from '@/hooks/useMarketplaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import MarketplaceAccessAlert from '@/components/MarketplaceAccessAlert';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ShoppingBag, DollarSign, BarChart2, Package, Wallet, Loader2, Upload, TrendingUp } from 'lucide-react';

const EarningsTab = lazy(() => import('./tabs/EarningsTab'));
const WalletTab = lazy(() => import('./tabs/WalletTab'));

const TabLoader = () => (
  <div className="flex justify-center py-16">
    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
  </div>
);

const formatCLP = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v);

const TherapistMarketplacePage = () => {
  const { canSell, restrictions, isLoading } = useMarketplaceAccess();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [stats, setStats] = useState({ revenue: 0, salesCount: 0, activeProducts: 0, pendingProducts: 0, recentSales: [] });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadSellerStats = useCallback(async () => {
    if (!user?.id) return;
    setStatsLoading(true);
    try {
      // Products by this seller
      const { data: products } = await supabase
        .from('marketplace_items')
        .select('id, is_active, is_approved')
        .eq('seller_id', user.id);

      const activeProducts = (products || []).filter(p => p.is_active && p.is_approved).length;
      const pendingProducts = (products || []).filter(p => p.is_active && !p.is_approved).length;

      // Sales of this seller's plans (via marketplace_plans.author_id)
      const { data: plans } = await supabase
        .from('marketplace_plans')
        .select('id')
        .eq('author_id', user.id);

      let revenue = 0;
      let salesCount = 0;
      let recentSales = [];

      if (plans?.length) {
        const planIds = plans.map(p => p.id);
        const { data: purchases } = await supabase
          .from('marketplace_purchases')
          .select('id, price_paid, payment_status, payment_method, created_at')
          .in('marketplace_plan_id', planIds)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);

        const completedPurchases = purchases || [];
        // Revenue = 90% (after 10% commission)
        revenue = completedPurchases.reduce((sum, p) => sum + Math.round((p.price_paid || 0) * 0.9), 0);
        salesCount = completedPurchases.length;
        recentSales = completedPurchases;
      }

      setStats({ revenue, salesCount, activeProducts, pendingProducts, recentSales });
    } catch (err) {
      console.error('Error loading seller stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadSellerStats(); }, [loadSellerStats]);

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 min-h-screen">
      <DashboardHeader title="Panel de Vendedor" />
      <main className="p-6 space-y-6">
        {!canSell && (
          <MarketplaceAccessAlert restrictions={restrictions} className="mb-6" />
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <BarChart2 className="h-4 w-4" /> Resumen
              </TabsTrigger>
              <TabsTrigger value="earnings" className="gap-2">
                <DollarSign className="h-4 w-4" /> Mis Ventas
              </TabsTrigger>
              <TabsTrigger value="wallet" className="gap-2">
                <Wallet className="h-4 w-4" /> Billetera
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              <Button variant="outline" asChild disabled={!canSell}>
                <Link to="/dashboard/therapist/marketplace/products">
                  <Package className="mr-2 h-4 w-4" /> Mis Productos
                </Link>
              </Button>
              <Button asChild disabled={!canSell} className={!canSell ? 'opacity-50 cursor-not-allowed' : ''}>
                <Link to={canSell ? "/dashboard/therapist/marketplace/create" : "#"}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                </Link>
              </Button>
              <Button variant="outline" asChild disabled={!canSell}>
                <Link to="/dashboard/therapist/marketplace/import">
                  <Upload className="mr-2 h-4 w-4" /> Importar
                </Link>
              </Button>
            </div>
          </div>

          {/* Tab: Resumen */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!canSell ? 'opacity-60 pointer-events-none filter grayscale-[0.5]' : ''}`}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                      <div className="text-2xl font-bold">{formatCLP(stats.revenue)}</div>
                      <p className="text-xs text-muted-foreground">Después de comisión (10%)</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Completadas</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                    <>
                      <div className="text-2xl font-bold">{stats.salesCount}</div>
                      <p className="text-xs text-muted-foreground">Total de compras recibidas</p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Productos Activos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                    <>
                      <div className="text-2xl font-bold">{stats.activeProducts}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingProducts > 0 ? `${stats.pendingProducts} pendiente${stats.pendingProducts > 1 ? 's' : ''} de aprobación` : 'Todos aprobados'}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-7 ${!canSell ? 'opacity-60 pointer-events-none' : ''}`}>
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : stats.salesCount === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground bg-slate-50 rounded-md border border-dashed">
                      <BarChart2 className="h-10 w-10 mb-2 text-gray-300" />
                      <p className="text-sm">Publica tu primer producto para empezar a vender.</p>
                      <Button variant="outline" size="sm" className="mt-3" asChild>
                        <Link to="/dashboard/therapist/marketplace/create"><Plus className="h-4 w-4 mr-1" /> Crear Producto</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm text-green-700">Ingreso promedio por venta</span>
                        <span className="font-bold text-green-700">{formatCLP(Math.round(stats.revenue / stats.salesCount))}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-700">Productos publicados</span>
                        <span className="font-bold text-blue-700">{stats.activeProducts}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                        <span className="text-sm text-teal-700">Tasa de conversión</span>
                        <span className="font-bold text-teal-700">{stats.activeProducts > 0 ? (stats.salesCount / stats.activeProducts).toFixed(1) : '—'} ventas/producto</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Ventas Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : stats.recentSales.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-8">
                      No hay ventas recientes.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {stats.recentSales.map(sale => (
                        <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{formatCLP(sale.price_paid || 0)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sale.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {sale.payment_method === 'free' ? 'Gratis' : sale.payment_method === 'wallet' ? 'Billetera' : 'MercadoPago'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Mis Ventas */}
          <TabsContent value="earnings" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'earnings' && <EarningsTab />}
            </Suspense>
          </TabsContent>

          {/* Tab: Billetera */}
          <TabsContent value="wallet" className="mt-6">
            <Suspense fallback={<TabLoader />}>
              {activeTab === 'wallet' && <WalletTab />}
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TherapistMarketplacePage;
