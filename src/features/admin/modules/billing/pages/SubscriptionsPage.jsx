import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/adminUtils';
import {
  Search, RefreshCw, Loader2, Users, CreditCard, AlertTriangle,
  CheckCircle2, XCircle, Eye, Edit2, Ban, RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const STATUS_MAP = {
  active: { label: 'Activa', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  expired: { label: 'Vencida', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle },
  suspended: { label: 'Suspendida', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
};

const SubscriptionsPage = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [plans, setPlans] = useState([]);

  // Stats
  const [stats, setStats] = useState({ active: 0, pastDue: 0, canceled: 0, mrr: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('therapist_subscriptions')
        .select('*, therapist:profiles!therapist_subscriptions_therapist_id_fkey(full_name, email)')
        .order('created_at', { ascending: false });

      // Always fetch ALL for stats
      const { data: allData, error: allError } = await supabase
        .from('therapist_subscriptions')
        .select('status, price')

      if (!allError && allData) {
        setStats({
          active: allData.filter(s => s.status === 'active').length,
          pastDue: allData.filter(s => s.status === 'expired').length,
          canceled: allData.filter(s => s.status === 'cancelled').length,
          mrr: allData.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.price || 0), 0),
        });
      }

      // Filtered data for table
      if (filter !== 'all') query = query.eq('status', filter);

      const { data, error } = await query;
      if (error) throw error;
      setSubscriptions(data || []);

      // Fetch plans for edit modal
      const { data: plansData } = await supabase
        .from('subscription_plans')
        .select('id, name, slug, price')
        .eq('is_active', true)
        .order('sort_order');
      setPlans(plansData || []);
    } catch (err) {
      logger.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (id, newStatus) => {
    setProcessing(id);
    try {
      const updates = { status: newStatus };
      if (newStatus === 'cancelled') {
        updates.cancelled_at = new Date().toISOString();
        updates.cancel_at_period_end = true;
      }
      if (newStatus === 'active') {
        updates.cancelled_at = null;
        updates.cancel_at_period_end = false;
      }

      const { error } = await supabase
        .from('therapist_subscriptions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast({ title: `Suscripción ${newStatus === 'active' ? 'activada' : newStatus === 'cancelled' ? 'cancelada' : 'actualizada'}` });
      loadData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setProcessing(null);
    }
  };

  const handlePlanChange = async () => {
    if (!editModal) return;
    setProcessing(editModal.id);
    try {
      const plan = plans.find(p => p.slug === editModal.newPlan);
      const { error } = await supabase
        .from('therapist_subscriptions')
        .update({
          plan_name: editModal.newPlan,
          price: plan?.price || editModal.price,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editModal.id);

      if (error) throw error;
      toast({ title: 'Plan actualizado' });
      setEditModal(null);
      loadData();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setProcessing(null);
    }
  };

  const filtered = search
    ? subscriptions.filter(s =>
        s.therapist?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.therapist?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : subscriptions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suscripciones y Pagos</h1>
          <p className="text-muted-foreground text-sm">Gestiona las suscripciones activas de la plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.mrr)}</p>
                <p className="text-xs text-muted-foreground">MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pastDue}</p>
                <p className="text-xs text-muted-foreground">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.canceled}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o email..." className="pl-9" />
        </div>
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="expired">Vencidas</TabsTrigger>
            <TabsTrigger value="canceled">Canceladas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay suscripciones</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Terapeuta</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(sub => {
                  const statusCfg = STATUS_MAP[sub.status] || STATUS_MAP.active;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{sub.therapist?.full_name || 'Sin nombre'}</span>
                          <p className="text-xs text-muted-foreground">{sub.therapist?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium capitalize">{sub.plan_name}</TableCell>
                      <TableCell>{formatCurrency(sub.price || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {sub.current_period_start && sub.current_period_end ? (
                          <>{format(new Date(sub.current_period_start), 'dd MMM', { locale: es })} → {format(new Date(sub.current_period_end), 'dd MMM yy', { locale: es })}</>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {format(new Date(sub.created_at), 'dd MMM yy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" title="Cambiar plan"
                            onClick={() => setEditModal({ id: sub.id, currentPlan: sub.plan_name, newPlan: sub.plan_name, price: sub.price })}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {sub.status === 'active' && (
                            <Button size="sm" variant="ghost" className="text-red-500" title="Cancelar"
                              onClick={() => handleStatusChange(sub.id, 'cancelled')} disabled={processing === sub.id}>
                              {processing === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                          {sub.status === 'cancelled' && (
                            <Button size="sm" variant="ghost" className="text-green-600" title="Reactivar"
                              onClick={() => handleStatusChange(sub.id, 'active')} disabled={processing === sub.id}>
                              {processing === sub.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Change Plan Modal */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Plan</DialogTitle>
          </DialogHeader>
          {editModal && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Plan actual: <span className="font-bold capitalize">{editModal.currentPlan}</span></Label>
              </div>
              <div className="space-y-2">
                <Label>Nuevo plan</Label>
                <Select value={editModal.newPlan} onValueChange={(v) => setEditModal(prev => ({ ...prev, newPlan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name} — {formatCurrency(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>Cancelar</Button>
            <Button onClick={handlePlanChange} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Cambiar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionsPage;
