import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, User, CreditCard, Package, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { formatCurrency } from '@/lib/adminUtils';
import logger from '@/lib/utils/logger';

const COMMISSION_RATE = 0.10;

const statusLabels = {
  completed: 'Completada', pending: 'Pendiente', failed: 'Fallida', refunded: 'Reembolsada',
};
const statusColors = {
  completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700', refunded: 'bg-gray-100 text-gray-600',
};
const methodLabels = {
  free: 'Gratis', wallet: 'Billetera DentalSpot', mercadopago: 'MercadoPago',
};

const formatDate = (d) => d ? new Date(d).toLocaleString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const SaleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);

  const loadSale = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_purchases')
        .select(`
          *,
          buyer:profiles!marketplace_purchases_buyer_id_fkey(full_name, email),
          plan:marketplace_plans!marketplace_purchases_marketplace_plan_id_fkey(name, author_name, price_clp, cover_image_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        const { data: fb } = await supabase.from('marketplace_purchases').select('*').eq('id', id).single();
        setSale(fb);
      } else {
        setSale(data);
      }
    } catch (err) {
      logger.error('Error loading sale:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadSale(); }, [loadSale]);

  const handleRefund = async () => {
    if (!confirm('¿Estás seguro de marcar esta venta como reembolsada?')) return;
    setRefunding(true);
    try {
      const { error } = await supabase
        .from('marketplace_purchases')
        .update({ payment_status: 'refunded' })
        .eq('id', id);
      if (error) throw error;
      await loadSale();
    } catch (err) {
      logger.error('Refund error:', err);
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!sale) {
    return (
      <div className="text-center py-32">
        <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-muted-foreground">Venta no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/marketplace/sales')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const commission = sale.payment_method !== 'free' ? Math.round((sale.price_paid || 0) * COMMISSION_RATE) : 0;
  const netToSeller = (sale.price_paid || 0) - commission;

  return (
    <PermissionGuard module="marketplace" action="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/marketplace/sales')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Detalle de Venta</h1>
              <p className="text-sm text-muted-foreground font-mono">{id}</p>
            </div>
          </div>
          {sale.payment_status === 'completed' && sale.payment_method !== 'free' && (
            <Button variant="destructive" size="sm" onClick={handleRefund} disabled={refunding}>
              {refunding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Reembolsar
            </Button>
          )}
        </div>

        <div className={`p-4 rounded-lg flex items-center gap-3 ${statusColors[sale.payment_status] || 'bg-gray-100'}`}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">{statusLabels[sale.payment_status] || sale.payment_status}</span>
          <span className="text-sm ml-auto">{formatDate(sale.completed_at || sale.created_at)}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-teal-500" /> Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sale.plan?.cover_image_url && <img src={sale.plan.cover_image_url} alt="" className="w-full h-32 object-cover rounded-lg" />}
              <p className="font-semibold">{sale.plan?.name || 'Producto'}</p>
              {sale.plan?.author_name && <p className="text-sm text-muted-foreground">por {sale.plan.author_name}</p>}
              <p className="text-xs text-muted-foreground font-mono">ID: {sale.marketplace_plan_id}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-blue-500" /> Comprador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{sale.buyer?.full_name || '—'}</p>
              <p className="text-sm text-muted-foreground">{sale.buyer?.email || '—'}</p>
              <p className="text-xs text-muted-foreground font-mono">ID: {sale.buyer_id}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-purple-500" /> Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Método</span><Badge variant="outline">{methodLabels[sale.payment_method] || sale.payment_method}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monto</span><span className="font-bold">{sale.price_paid === 0 ? 'Gratis' : formatCurrency(sale.price_paid || 0)}</span></div>
                {commission > 0 && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Comisión (10%)</span><span className="text-green-600 font-medium">{formatCurrency(commission)}</span></div>
                    <div className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Neto vendedor</span><span className="font-medium">{formatCurrency(netToSeller)}</span></div>
                  </>
                )}
                {sale.payment_reference && <div className="flex justify-between"><span className="text-muted-foreground">Referencia</span><span className="font-mono text-xs">{sale.payment_reference}</span></div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-orange-500" /> Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div><p className="text-sm font-medium">Creada</p><p className="text-xs text-muted-foreground">{formatDate(sale.created_at)}</p></div>
                </div>
                {sale.completed_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div><p className="text-sm font-medium">Completada</p><p className="text-xs text-muted-foreground">{formatDate(sale.completed_at)}</p></div>
                  </div>
                )}
                {sale.license_type && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <div><p className="text-sm font-medium">Licencia: {sale.license_type}</p></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default SaleDetailPage;
