import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAdminPermissions } from '@/contexts/AdminPermissionContext';
import { permissionMap } from '@/features/admin/permissions/permissionMap';
import StatsCard from '@/components/admin/StatsCard';
import { Activity, Users, CreditCard, AlertCircle, TrendingUp, Building2, Loader2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/adminUtils';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const SuperAdminDashboard = () => {
  const { isSuperAdmin, getAccessibleModules, loading: permsLoading } = useAdminPermissions();

  // Non-super admins: redirect to their module's root route
  if (!permsLoading && !isSuperAdmin) {
    const accessibleKeys = getAccessibleModules();
    if (accessibleKeys.length > 0 && !accessibleKeys.includes('all')) {
      // Find the shortest route (group root) among all accessible modules
      const allRoutes = accessibleKeys
        .map(k => permissionMap[k]?.routes?.[0])
        .filter(Boolean)
        .sort((a, b) => a.length - b.length);
      if (allRoutes[0]) {
        return <Navigate to={allRoutes[0]} replace />;
      }
    }
  }

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    mrr: 0,
    activeSubs: 0,
    totalTherapists: 0,
    totalClinics: 0,
    churnRate: 0,
    failedPayments: 0,
    newTherapistsMonth: 0,
    newSubsMonth: 0,
  });
  const [recentSubs, setRecentSubs] = useState([]);
  const [recentTherapists, setRecentTherapists] = useState([]);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        activeSubsRes,
        totalTherapistsRes,
        totalClinicsRes,
        cancelledRes,
        failedRes,
        newTherapistsRes,
        recentSubsRes,
        recentTherapistsRes,
      ] = await Promise.all([
        supabase.from('therapist_subscriptions').select('price', { count: 'exact' }).eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'therapist'),
        supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('therapist_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'canceled').gte('updated_at', startOfMonth),
        supabase.from('therapist_subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'past_due'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'therapist').gte('created_at', startOfMonth),
        supabase.from('therapist_subscriptions').select('*, therapist:profiles!therapist_subscriptions_therapist_id_fkey(full_name, email)').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id, full_name, email, created_at').eq('role', 'therapist').order('created_at', { ascending: false }).limit(5),
      ]);

      const activeSubs = activeSubsRes.count || 0;
      const mrr = (activeSubsRes.data || []).reduce((sum, s) => sum + (Number(s.price) || 0), 0);
      const cancelled = cancelledRes.count || 0;
      const base = activeSubs + cancelled;
      const churnRate = base > 0 ? ((cancelled / base) * 100) : 0;

      setStats({
        mrr,
        activeSubs,
        totalTherapists: totalTherapistsRes.count || 0,
        totalClinics: totalClinicsRes.count || 0,
        churnRate: Number(churnRate.toFixed(1)),
        failedPayments: failedRes.count || 0,
        newTherapistsMonth: newTherapistsRes.count || 0,
        newSubsMonth: 0,
      });

      setRecentSubs(recentSubsRes.data || []);
      setRecentTherapists(recentTherapistsRes.data || []);
    } catch (err) {
      logger.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS = {
    active: 'bg-green-100 text-green-700',
    past_due: 'bg-red-100 text-red-700',
    canceled: 'bg-gray-100 text-gray-600',
    trialing: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard General</h1>
          <p className="text-muted-foreground text-sm">Resumen financiero y operativo de la plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="MRR (Ingresos Recurrentes)"
              value={loading ? '...' : formatCurrency(stats.mrr)}
              icon={TrendingUp}
              color="green"
            />
            <StatsCard
              title="Suscripciones Activas"
              value={loading ? '...' : stats.activeSubs}
              icon={Activity}
              description="planes vigentes"
              color="blue"
            />
            <StatsCard
              title="Terapeutas Registrados"
              value={loading ? '...' : stats.totalTherapists}
              icon={Users}
              trend="up"
              trendValue={stats.newTherapistsMonth}
              description="nuevos este mes"
              color="purple"
            />
            <StatsCard
              title="Tasa de Cancelación"
              value={loading ? '...' : `${stats.churnRate}%`}
              icon={AlertCircle}
              color={stats.churnRate > 5 ? 'red' : 'green'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Subscriptions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Suscripciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : recentSubs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin suscripciones registradas</p>
                ) : (
                  <div className="space-y-3">
                    {recentSubs.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                        <div>
                          <p className="font-medium text-sm">{sub.therapist?.full_name || sub.therapist?.email || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{sub.plan_name} · {format(new Date(sub.created_at), 'dd MMM yyyy', { locale: es })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{formatCurrency(sub.price || 0)}</span>
                          <Badge variant="outline" className={STATUS_COLORS[sub.status] || ''}>{sub.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Alerts */}
              <Card className={stats.failedPayments > 0 ? 'border-red-200' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-4 w-4" /> Atención Requerida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm p-2 bg-red-50 rounded">
                    <span>Pagos fallidos</span>
                    <span className="font-bold text-red-600">{loading ? '...' : stats.failedPayments}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm p-2 bg-blue-50 rounded">
                    <span>Clínicas activas</span>
                    <span className="font-bold text-blue-600">{loading ? '...' : stats.totalClinics}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Therapists */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Últimos Terapeutas</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    <div className="space-y-2">
                      {recentTherapists.map(t => (
                        <div key={t.id} className="flex items-center justify-between text-sm">
                          <span className="truncate font-medium">{t.full_name || t.email}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">
                            {format(new Date(t.created_at), 'dd MMM', { locale: es })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link to="/admin/billing/plans">Gestionar Planes</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link to="/admin/billing/subscriptions">Suscripciones</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link to="/admin/billing/coupons">Cupones</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <Link to="/admin/support">Soporte</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </div>
  );
};

export default SuperAdminDashboard;
