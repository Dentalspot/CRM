import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2, Crown, CreditCard, ChevronRight, Shield, TrendingUp, FileText, Headphones, Tag, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import {
  getCurrentSubscription, getUsageStats, subscribeToPlan, activateFreeCouponPlan,
  cancelSubscription, reactivateSubscription,
  PLAN_PRICING, PLAN_NAMES,
} from '../api/membershipApi';
import useClinicMembership from '@/hooks/useClinicMembership';
import { getClinicDiscount, calculateDiscountedPrice } from '@/constants/planFeatures';

import CurrentPlanHeader from '../components/CurrentPlanHeader';
import ActiveServices from '../components/ActiveServices';
import PlanUpgradeCard from '../components/PlanUpgradeCard';
import BillingHistory from '../components/BillingHistory';
import SubscriptionManagement from '../components/SubscriptionManagement';
import logger from '@/lib/utils/logger';

const MembershipPlansPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [subscription, setSubscription] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [isYearly, setIsYearly] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [dynamicPlans, setDynamicPlans] = useState(null);

  const { clinicData } = useClinicMembership(user?.id);
  const discount = clinicData ? getClinicDiscount(clinicData.activeTherapists) : null;

  useEffect(() => {
    if (user) loadData();
    fetchDynamicPlans();
  }, [user]);

  const fetchDynamicPlans = async () => {
    try {
      const { data } = await supabase
        .from('subscription_plans')
        .select('name, slug, price, description, features, max_patients, max_clinics, max_users, max_storage_mb')
        .eq('is_active', true)
        .order('sort_order');
      if (data) {
        const mapped = {};
        data.forEach(p => {
          mapped[p.slug] = p;
        });
        setDynamicPlans(mapped);
      }
    } catch (err) {
      logger.warn('Could not fetch dynamic plans:', err);
    }
  };

  const loadData = async () => {
    try {
      const [subData, statsData] = await Promise.all([
        getCurrentSubscription(user.id),
        getUsageStats(user.id),
      ]);
      setSubscription(subData);
      setStats(statsData);
    } catch (error) {
      logger.error('Error loading membership data:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar la información de membresía' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('coupon_type', 'membership')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({ variant: 'destructive', title: 'Cupón no válido', description: 'El código ingresado no existe o está inactivo.' });
        setCouponApplied(null);
        return;
      }

      // Check expiration
      if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
        toast({ variant: 'destructive', title: 'Cupón expirado', description: 'Este cupón ya no está vigente.' });
        setCouponApplied(null);
        return;
      }

      // Check max uses
      if (data.max_uses && (data.current_uses || 0) >= data.max_uses) {
        toast({ variant: 'destructive', title: 'Cupón agotado', description: 'Este cupón ya alcanzó el límite de usos.' });
        setCouponApplied(null);
        return;
      }

      // Check if user already redeemed this coupon (single use per user)
      const { data: redemption } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', data.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (redemption) {
        toast({ variant: 'destructive', title: 'Cupón ya utilizado', description: 'Ya utilizaste este cupón anteriormente.' });
        setCouponApplied(null);
        return;
      }

      setCouponApplied(data);
      toast({ title: 'Cupón aplicado', description: `Descuento de ${isPercentCoupon(data) ? `${data.discount_value}%` : `$${data.discount_value.toLocaleString('es-CL')}`}` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
  };

  const isPercentCoupon = (coupon) => coupon?.discount_type === 'percent' || coupon?.discount_type === 'percentage';

  const getCouponDiscount = (price) => {
    if (!couponApplied) return 0;
    if (isPercentCoupon(couponApplied)) {
      return Math.round(price * couponApplied.discount_value / 100);
    }
    return Math.min(couponApplied.discount_value, price);
  };

  const handleSelectPlan = async (planId) => {
    if (planId === PLAN_NAMES.CENTER) {
      window.location.href = '/contacto?subject=Plan%20Centro%20de%20Salud';
      return;
    }
    if (subscription?.plan_name === planId && subscription?.isActive) {
      toast({ title: 'Ya tienes este plan', description: 'Actualmente estás suscrito a este plan.' });
      return;
    }

    setProcessingPlan(planId);
    try {
      const planPricing = PLAN_PRICING[planId];
      const finalPrice = discount && discount.discount > 0
        ? calculateDiscountedPrice(planPricing.priceCLP, clinicData.activeTherapists)
        : planPricing.priceCLP;

      // Apply coupon discount
      const couponDiscount = getCouponDiscount(finalPrice);
      const priceAfterCoupon = finalPrice - couponDiscount;

      // If price is 0 (100% coupon), activate directly without MercadoPago
      if (priceAfterCoupon <= 0 && couponApplied) {
        const result = await activateFreeCouponPlan(user.id, {
          planSlug: planId,
          couponId: couponApplied.id,
          couponCode: couponApplied.code,
          durationDays: 30,
        });

        if (result.success) {
          toast({ title: '🎉 ¡Plan activado!', description: `Tu plan ${planId} está activo por 30 días.` });
          setCouponApplied(null);
          setCouponCode('');
          await loadData();
        }
      } else {
        const result = await subscribeToPlan(user.id, {
          id: planId,
          email: user.email,
          fullName: profile?.full_name || user.email,
          clinic_id: clinicData?.clinicId || null,
          discount_percent: discount?.discount || 0,
          final_price: priceAfterCoupon,
          original_price: planPricing.priceCLP,
          coupon_id: couponApplied?.id || null,
          coupon_code: couponApplied?.code || null,
        });

        // Increment coupon usage
        if (couponApplied && result.success) {
          await supabase
            .from('discount_coupons')
            .update({ current_uses: (couponApplied.current_uses || 0) + 1 })
            .eq('id', couponApplied.id);
        }

        if (result.success && result.init_point) {
          toast({ title: 'Abriendo MercadoPago', description: 'Se abrirá una nueva ventana para completar el pago...' });
          window.open(result.init_point, '_blank');
        }
      }
    } catch (error) {
      logger.error('Error:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo procesar la solicitud' });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;
    setProcessingPlan('cancel');
    try {
      await cancelSubscription(subscription.id);
      toast({ title: 'Suscripción cancelada', description: 'Tu suscripción se cancelará al final del período actual.' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.id) return;
    setProcessingPlan('reactivate');
    try {
      await reactivateSubscription(subscription.id);
      toast({ title: '¡Suscripción reactivada!', description: 'Tu suscripción continuará normalmente.' });
      loadData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = subscription?.plan_name || PLAN_NAMES.FREE;
  const upgradePlans = [PLAN_NAMES.INDIVIDUAL, PLAN_NAMES.PROFESSIONAL, PLAN_NAMES.CENTER];

  return (
    <Card className="overflow-hidden rounded-lg shadow-lg border-t-4 border-pink-500">
      <Helmet><title>Mi Membresía | DentalSpot</title></Helmet>

      <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
        <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">Mi Membresía</CardTitle>
        <CardDescription className="mt-2 text-md text-gray-600 leading-relaxed">Gestiona tu plan y facturación</CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white space-y-6">

      <CurrentPlanHeader subscription={subscription} stats={stats} onManage={() => setActiveTab('plans')} dynamicPlan={dynamicPlans?.[subscription?.plan_name]} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Shield className="h-4 w-4" /><span className="hidden sm:inline">Servicios</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <TrendingUp className="h-4 w-4" /><span className="hidden sm:inline">Planes</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" /><span className="hidden sm:inline">Facturación</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ActiveServices planName={currentPlan} />
          <SubscriptionManagement
            subscription={subscription}
            onCancel={handleCancelSubscription}
            onReactivate={handleReactivateSubscription}
            isProcessing={processingPlan === 'cancel' || processingPlan === 'reactivate'}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-4 bg-gray-100 rounded-full p-2">
              <span className={cn("text-sm font-medium px-4 py-2 rounded-full transition-all", !isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}>
                Mensual
              </span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} />
              <span className={cn("text-sm font-medium px-4 py-2 rounded-full transition-all", isYearly ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}>
                Anual
              </span>
              {isYearly && <Badge className="bg-green-100 text-green-700 border-0">2 meses gratis</Badge>}
            </div>
          </div>

          {discount && discount.discount > 0 && (
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    🏥 Descuento Clínica: {Math.round(discount.discount * 100)}%
                  </h3>
                  <p className="text-teal-100 mt-1">
                    Tu clínica "{clinicData.clinicName}" tiene {clinicData.activeTherapists} terapeutas activos.
                  </p>
                </div>
                {clinicData.activeTherapists < 6 && (
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-sm">
                    <span className="font-semibold">Invita {6 - clinicData.activeTherapists} más → desbloquea -35%</span>
                  </div>
                )}
                {clinicData.activeTherapists >= 6 && clinicData.activeTherapists < 11 && (
                  <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2 text-sm">
                    <span className="font-semibold">Invita {11 - clinicData.activeTherapists} más → desbloquea -50%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Coupon Input */}
          <Card className="border-dashed">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  {couponApplied ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="gap-1.5 px-3 py-1">
                        <Check className="h-3.5 w-3.5" />
                        {couponApplied.code} — {isPercentCoupon(couponApplied) ? `${couponApplied.discount_value}% dcto` : `$${couponApplied.discount_value.toLocaleString('es-CL')} dcto`}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-red-500 text-xs">Quitar</Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Código de cupón"
                        className="max-w-[200px] h-9"
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode.trim()}>
                        {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {upgradePlans.map((planId) => (
              <PlanUpgradeCard
                key={planId}
                planId={planId}
                currentPlan={currentPlan}
                isYearly={isYearly}
                onSelect={handleSelectPlan}
                isProcessing={processingPlan}
                discount={discount}
                clinicData={clinicData}
                couponDiscount={couponApplied ? getCouponDiscount(PLAN_PRICING[planId]?.priceCLP || 0) : 0}
                dynamicPlan={dynamicPlans?.[planId]}
              />
            ))}
          </div>

          <p className="text-center text-sm text-gray-500">
            Todos los planes incluyen 14 dias de prueba. Cancela cuando quieras.
          </p>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" /> Historial de Facturación
              </CardTitle>
              <CardDescription>Tus facturas y pagos recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <BillingHistory userId={user?.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-primary/5 to-pink-500/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">¿Necesitas ayuda?</h3>
                <p className="text-sm text-gray-600">Estamos aquí para resolver tus dudas</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a href="/contacto">Contactar Soporte <ChevronRight className="h-4 w-4 ml-1" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>
      </CardContent>
    </Card>
  );
};

export default MembershipPlansPage;
