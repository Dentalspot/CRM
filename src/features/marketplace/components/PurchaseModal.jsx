import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, CreditCard, ShieldCheck, Wallet, Package, ArrowRight } from 'lucide-react';
import { fetchWallet, purchaseWithWallet } from '@/features/wallet/api/walletApi';
import {
  createMarketplacePurchase, purchaseWithMercadoPago,
} from '@/features/marketplace/api/marketplacePlansApi';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useNavigate } from 'react-router-dom';

/**
 * PurchaseModal v2
 *
 * Cambios vs v1:
 * 1. Escribe en marketplace_purchases (no solo marketplace_orders)
 * 2. NO usa test@user.com — usa user.email real
 * 3. NO tiene selector de cantidad (producto digital = 1)
 * 4. backUrls apuntan a /marketplace/purchase-success (no /membership/status)
 * 5. Success state muestra CTA "Ir a Mis Planificaciones" (no solo checkmark)
 * 6. Wallet purchase también crea en marketplace_purchases
 */

const formatCurrency = (amount, currency = 'CLP') =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

const PurchaseModal = ({ isOpen, onClose, item, onSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [walletBalance, setWalletBalance] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      setLoadingWallet(true);
      fetchWallet(user.id)
        .then((wallet) => setWalletBalance(wallet?.balance ?? 0))
        .catch(() => setWalletBalance(0))
        .finally(() => setLoadingWallet(false));
    }
  }, [isOpen, user?.id]);

  const handleConfirm = async () => {
    if (!user?.id || !user?.email) {
      logger.error('No user or email available');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');
    try {
      if (item.price === 0) {
        // Free item — complete immediately
        let planId = item.marketplace_plan_id || item.id;

        // For templates, find the matching marketplace_plans entry by slug
        if (isTemplate && !item.marketplace_plan_id) {
          const { data: plan } = await supabase
            .from('marketplace_plans')
            .select('id')
            .eq('slug', item.slug)
            .maybeSingle();
          if (plan) planId = plan.id;
        }

        try {
          await createMarketplacePurchase(user.id, {
            id: planId,
            name: item.title,
            price_clp: 0,
            is_free: true,
          }, 'free');
        } catch (purchaseErr) {
          // If purchase record fails (FK issue), still proceed for templates
          if (!isTemplate) throw purchaseErr;
          logger.warn('Purchase record failed, proceeding with template clone:', purchaseErr);
        }

        // If it's a template/evaluation, clone to buyer's templates
        if (isTemplate) await cloneTemplateToBuyer();

        setIsSuccess(true);
        setTimeout(() => onSuccess?.(), 2500);

      } else if (paymentMethod === 'wallet') {
        // Wallet purchase
        await purchaseWithWallet(user.id, item.price, item.id, item.title, item.seller_id);

        // Create in marketplace_purchases as completed
        await createMarketplacePurchase(user.id, {
          id: item.id,
          name: item.title,
          price_clp: item.price,
          is_free: false,
        }, 'wallet');

        setIsSuccess(true);
        setTimeout(() => onSuccess?.(), 2500);

      } else {
        // MercadoPago — redirect to payment
        const preferenceData = await purchaseWithMercadoPago(user.id, {
          id: item.id,
          name: item.title,
          description: item.description,
          price_clp: item.price,
          is_free: false,
          cover_image_url: item.image_url,
        }, user.email); // ← REAL email, never test@user.com

        if (preferenceData?.init_point) {
          window.location.href = preferenceData.init_point;
        } else {
          throw new Error('No se pudo obtener el enlace de pago');
        }
      }
    } catch (error) {
      logger.error('Purchase error:', error);
      setErrorMsg(error.message || 'Hubo un error al procesar la compra. Intenta de nuevo.');
      setIsProcessing(false);
    }
  };

  if (!item) return null;

  const hasSufficientBalance = walletBalance !== null && walletBalance >= item.price;
  const isFree = item.price === 0;
  const isTemplate = item?.item_type === 'evaluation' || item?.category === 'evaluacion';

  // Clone template to buyer's patient_document_templates
  const cloneTemplateToBuyer = async () => {
    try {
      // Find the source template via marketplace_items.therapist_plan_template_id
      const { data: mpItem } = await supabase
        .from('marketplace_items')
        .select('therapist_plan_template_id')
        .eq('id', item.id)
        .maybeSingle();

      const templateId = mpItem?.therapist_plan_template_id;
      if (!templateId) return;

      const { data: sourceTemplate } = await supabase
        .from('patient_document_templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle();

      if (!sourceTemplate) return;

      await supabase.from('patient_document_templates').insert({
        therapist_id: user.id,
        name: sourceTemplate.name,
        category: sourceTemplate.category,
        content: sourceTemplate.content,
        variables: sourceTemplate.variables,
        is_global: false,
      });
    } catch (e) {
      logger.warn('Error cloning template to buyer:', e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isProcessing ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {isTemplate
                  ? (isFree ? 'Agregar plantilla' : 'Adquirir plantilla')
                  : (isFree ? 'Obtener recurso' : 'Confirmar compra')}
              </DialogTitle>
              <DialogDescription>
                {isTemplate
                  ? 'Se agregará a tus Plantillas para completar con datos de cada paciente.'
                  : (isFree ? 'Este recurso es gratuito.' : 'Estás por adquirir el siguiente recurso.')}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {/* Item summary */}
              <div className="flex gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                {item.image_url ? (
                  <img src={item.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-teal-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm line-clamp-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.seller_name}</p>
                </div>
              </div>

              {/* Price */}
              {!isFree && (
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total a pagar</span>
                    <span className="font-bold text-lg text-slate-900">{formatCurrency(item.price)}</span>
                  </div>
                  <Separator />
                </div>
              )}

              {/* Payment methods — only for paid items */}
              {!isFree && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 mb-3">Método de pago:</p>

                  <button type="button"
                    onClick={() => hasSufficientBalance && setPaymentMethod('wallet')}
                    disabled={!hasSufficientBalance}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'wallet'
                        ? 'border-teal-500 bg-teal-50'
                        : hasSufficientBalance ? 'border-slate-200 hover:border-slate-300 bg-white' : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                    }`}>
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-teal-600" />
                      <div>
                        <p className="font-medium text-sm text-slate-900">Billetera DentalSpot</p>
                        <p className="text-xs text-slate-500">
                          {loadingWallet ? 'Cargando...' :
                            `Saldo: ${formatCurrency(walletBalance ?? 0)}${!hasSufficientBalance ? ' · Insuficiente' : ''}`}
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && <div className="h-4 w-4 rounded-full bg-teal-500" />}
                  </button>

                  <button type="button"
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === 'mercadopago' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm text-slate-900">MercadoPago</p>
                        <p className="text-xs text-slate-500">Tarjeta, débito o transferencia</p>
                      </div>
                    </div>
                    {paymentMethod === 'mercadopago' && <div className="h-4 w-4 rounded-full bg-blue-500" />}
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={isProcessing}
                className="bg-teal-600 hover:bg-teal-700 min-w-[120px]">
                {isProcessing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando</>
                ) : isFree ? (
                  isTemplate ? 'Agregar a mis Plantillas' : 'Obtener gratis'
                ) : (
                  'Confirmar y Pagar'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          /* ── Success State con continuidad ── */
          <div className="py-8 flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {isTemplate ? '¡Plantilla agregada!' : (isFree ? '¡Recurso agregado!' : '¡Compra exitosa!')}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs mb-5">
              {isTemplate
                ? 'Ya está disponible en tu sección de Plantillas. Puedes completarla con datos de cada paciente.'
                : 'Ya está disponible en Mis Planificaciones. Puedes asignarlo a un paciente cuando lo necesites.'}
            </p>
            <div className="flex gap-2 w-full max-w-xs">
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 gap-1.5"
                onClick={() => { const dest = isTemplate ? '/dashboard/profile?tab=docs' : '/dashboard/marketplace/mis-planificaciones'; onClose(); setTimeout(() => navigate(dest), 100); }}>
                <Package className="h-4 w-4" /> {isTemplate ? 'Mis Plantillas' : 'Mis Planificaciones'}
              </Button>
              <Button variant="outline" className="gap-1" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseModal;
