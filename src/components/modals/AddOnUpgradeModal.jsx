import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  ArrowRight,
  Check,
  Brain,
  Mic,
  Loader2,
  Tag,
  X,
} from 'lucide-react';
import { formatPriceCLP } from '@/utils/planHelpers';
import { ADD_ON_CONFIG } from '@/constants/addOnFeatures';
import { useToast } from '@/components/ui/use-toast';
import { createSubscriptionCheckout } from '@/api/subscriptionApi';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

const ICONS = {
  Sparkles,
  Brain,
  Mic
};

/**
 * Modal to purchase an add-on feature.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {function} props.onClose - Close handler
 * @param {string} props.addOnId - ID of the add-on to purchase (e.g., 'notiz')
 */
const AddOnUpgradeModal = ({
  isOpen,
  onClose,
  addOnId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const config = ADD_ON_CONFIG[addOnId];

  if (!config) return null;

  const IconComponent = ICONS[config.icon] || Sparkles;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('discount_coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({ variant: 'destructive', title: 'Cupón no válido', description: 'El código ingresado no existe o está inactivo.' });
        setCouponApplied(null);
        return;
      }

      if (data.expiration_date && new Date(data.expiration_date) < new Date()) {
        toast({ variant: 'destructive', title: 'Cupón expirado', description: 'Este cupón ya no está vigente.' });
        setCouponApplied(null);
        return;
      }

      if (data.max_uses && (data.current_uses || 0) >= data.max_uses) {
        toast({ variant: 'destructive', title: 'Cupón agotado', description: 'Este cupón ya alcanzó el límite de usos.' });
        setCouponApplied(null);
        return;
      }

      setCouponApplied(data);
      const isPct = data.discount_type === 'percent' || data.discount_type === 'percentage';
      toast({ title: 'Cupón aplicado', description: `Descuento de ${isPct ? `${data.discount_value}%` : formatPriceCLP(data.discount_value)}` });
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

  const isPercentCoupon = (c) => c?.discount_type === 'percent' || c?.discount_type === 'percentage';

  const getCouponDiscount = (price) => {
    if (!couponApplied) return 0;
    if (isPercentCoupon(couponApplied)) {
      return Math.round(price * couponApplied.discount_value / 100);
    }
    return Math.min(couponApplied.discount_value, price);
  };

  const discount = getCouponDiscount(config.price);
  const finalPrice = config.price - discount;

  const activateFreeAddon = async () => {
    // Check if already redeemed
    const { data: existingRedemption } = await supabase
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_id', couponApplied.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingRedemption) {
      throw new Error('Ya utilizaste este cupón anteriormente.');
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check existing addon
    const { data: existing } = await supabase
      .from('user_addons')
      .select('id')
      .eq('user_id', user.id)
      .eq('addon_key', addOnId)
      .maybeSingle();

    if (existing) {
      await supabase.from('user_addons')
        .update({
          status: 'active',
          price: 0,
          current_period_start: now.toISOString().split('T')[0],
          current_period_end: periodEnd.toISOString().split('T')[0],
          external_reference: `coupon_${couponApplied.code}_${user.id}`,
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id);
    } else {
      const { error } = await supabase.from('user_addons').insert({
        user_id: user.id,
        addon_key: addOnId,
        status: 'active',
        price: 0,
        currency: 'CLP',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        external_reference: `coupon_${couponApplied.code}_${user.id}`,
      });
      if (error) throw error;
    }

    // Record redemption
    await supabase.from('coupon_redemptions').insert({
      coupon_id: couponApplied.id,
      user_id: user.id,
      plan_name: addOnId,
    });

    // Increment usage
    await supabase.rpc('increment_coupon_usage', { p_coupon_id: couponApplied.id });
  };

  const handlePurchase = async () => {
    try {
      setIsProcessing(true);

      // If price is 0 (100% coupon), activate directly without MercadoPago
      if (finalPrice <= 0 && couponApplied) {
        await activateFreeAddon();
        toast({ title: '🎉 ¡Activado!', description: `${config.name} está activo por 30 días.` });
        onClose(false);
        // Reload to refresh access
        window.location.reload();
        return;
      }

      const result = await createSubscriptionCheckout({
        userId: user.id,
        planId: addOnId,
        email: user.email,
        fullName: user.full_name
      });

      if (result?.success && result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('No se pudo iniciar el checkout');
      }

    } catch (error) {
      logger.error('Purchase error:', error);
      toast({
        title: "Error al activar",
        description: error.message || "Intenta nuevamente más tarde.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && onClose(open)}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
            <IconComponent className="h-8 w-8 text-indigo-600" />
          </div>

          <DialogTitle className="text-xl">
            Activar {config.name}
          </DialogTitle>

          <DialogDescription className="pt-2">
            Potencia tu práctica clínica con esta herramienta exclusiva.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-4">
          <div className="border-2 border-indigo-100 rounded-xl p-5 bg-indigo-50/30">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">
                  Suscripción Mensual
                </h4>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
              <div className="text-right">
                {couponApplied ? (
                  <>
                    <span className="text-sm text-gray-400 line-through block">
                      {formatPriceCLP(config.price)}
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatPriceCLP(finalPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-indigo-600">
                    {formatPriceCLP(config.price)}
                  </span>
                )}
                <span className="text-xs text-gray-500 block">/mes</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-indigo-100">
              <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                Incluye:
              </span>
              <ul className="space-y-2">
                {config.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Coupon section */}
        <div className="border-t pt-4">
          {couponApplied ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <Tag className="h-4 w-4 text-green-600 flex-shrink-0" />
              <Badge variant="default" className="gap-1.5 px-3 py-1 bg-green-600">
                <Check className="h-3.5 w-3.5" />
                {couponApplied.code} — {isPercentCoupon(couponApplied) ? `${couponApplied.discount_value}% dcto` : `${formatPriceCLP(couponApplied.discount_value)} dcto`}
              </Badge>
              <button onClick={removeCoupon} className="ml-auto text-gray-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : showCoupon ? (
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Código de cupón"
                className="h-9 flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={validatingCoupon || !couponCode.trim()}>
                {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
              </Button>
              <button onClick={() => { setShowCoupon(false); setCouponCode(''); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCoupon(true)}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Tag className="h-4 w-4" />
              Tengo un cupón de descuento
            </button>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                {finalPrice <= 0 && couponApplied
                  ? '🎉 Activar gratis por 30 días'
                  : couponApplied
                    ? `Suscribirse por ${formatPriceCLP(finalPrice)}/mes`
                    : 'Suscribirse ahora'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onClose(false)}
            disabled={isProcessing}
            className="w-full text-gray-500"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddOnUpgradeModal;