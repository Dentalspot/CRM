import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Tag, Percent, Calendar, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/adminUtils';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const CouponDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (id) loadCoupon();
  }, [id]);

  const loadCoupon = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setCoupon(data);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al cargar cupón' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const newValue = !coupon.is_active;
      const { error } = await supabase
        .from('discount_coupons')
        .update({ is_active: newValue })
        .eq('id', id);
      if (error) throw error;
      toast({ title: newValue ? 'Cupón activado' : 'Cupón desactivado' });
      loadCoupon();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al actualizar cupón' });
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Cupón no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/marketplace/coupons')}>
          Volver
        </Button>
      </div>
    );
  }

  const isExpired = coupon.expiration_date && new Date(coupon.expiration_date) < new Date();
  const isPercentage = coupon.discount_type === 'percentage';
  const usagePercent = coupon.max_uses ? Math.min((coupon.current_uses / coupon.max_uses) * 100, 100) : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPlans = (plans) => {
    if (!plans || (Array.isArray(plans) && plans.length === 0)) return 'Todos los planes';
    if (Array.isArray(plans)) return plans.join(', ');
    return String(plans);
  };

  return (
    <PermissionGuard module="marketplace">
      <div className="space-y-6 max-w-3xl mx-auto">
        <Button variant="ghost" className="pl-0" onClick={() => navigate('/admin/marketplace/coupons')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a cupones
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Tag className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold font-mono tracking-wide">{coupon.code}</h1>
            </div>
            {coupon.description && (
              <p className="text-muted-foreground text-sm mt-1">{coupon.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isExpired && <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Expirado</Badge>}
            <Badge className={coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}>
              {coupon.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>

        {/* Discount Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" /> Descuento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Tipo de descuento</p>
                <p className="text-sm font-medium mt-1">
                  {isPercentage ? 'Porcentaje' : 'Monto fijo'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold mt-1">
                  {isPercentage ? `${coupon.discount_value}%` : formatCurrency(coupon.discount_value || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Compra mínima</p>
                <p className="text-sm font-medium mt-1">
                  {coupon.min_purchase_amount ? formatCurrency(coupon.min_purchase_amount) : 'Sin mínimo'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descuento máximo</p>
                <p className="text-sm font-medium mt-1">
                  {coupon.max_discount_amount ? formatCurrency(coupon.max_discount_amount) : 'Sin límite'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Vigencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Válido desde</p>
                <p className="text-sm font-medium mt-1">{formatDate(coupon.valid_from)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de expiración</p>
                <p className="text-sm font-medium mt-1">{formatDate(coupon.expiration_date)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Planes aplicables</p>
                <p className="text-sm font-medium mt-1">{formatPlans(coupon.applicable_plans)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Usos actuales</p>
                <p className="text-2xl font-bold mt-1">
                  {coupon.current_uses ?? 0}
                  {coupon.max_uses ? (
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ {coupon.max_uses}</span>
                  ) : (
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ Ilimitado</span>
                  )}
                </p>
              </div>
              {coupon.max_uses > 0 && (
                <p className="text-sm text-muted-foreground">{Math.round(usagePercent)}%</p>
              )}
            </div>

            {coupon.max_uses > 0 && (
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {coupon.is_active ? 'El cupón está activo y puede ser utilizado.' : 'El cupón está desactivado.'}
                </p>
              </div>
              <Button
                variant={coupon.is_active ? 'outline' : 'default'}
                className={coupon.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : ''}
                onClick={handleToggleActive}
                disabled={toggling}
              >
                {toggling && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {coupon.is_active ? 'Desactivar Cupón' : 'Activar Cupón'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default CouponDetailPage;
