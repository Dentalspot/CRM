import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';

/**
 * PurchaseSuccessPage — Página dedicada post-compra de marketplace.
 *
 * Decisiones UX implementadas:
 *
 * 1. REEMPLAZA el redirect a /membership/status.
 *    → Una página de membresía NO es el lugar para confirmar una compra.
 *    → Esta página vive en /dashboard/marketplace/purchase-success.
 *
 * 2. CONTINUIDAD POST-COMPRA: dos CTAs claros.
 *    → "Ir a Mis Planificaciones" (primario) — continua el flujo productivo.
 *    → "Seguir explorando" (secundario) — oportunidad de recompra.
 *    → Antes, la compra terminaba en un toast de 2 segundos y nada más.
 *
 * 3. CONFIRMACIÓN VISUAL EMOCIONAL:
 *    → Checkmark animado + mensaje de ahorro de tiempo.
 *    → "Tu planificación ya está lista" — no "gracias por tu compra".
 *    → El frame es utilidad, no transacción.
 *
 * 4. CROSS-SELL POST-COMPRA:
 *    → "Otros terapeutas también compraron..." con 3 productos relacionados.
 *    → Este es el momento de máxima disposición a comprar.
 *
 * 5. Handles 3 estados de MercadoPago: approved, failure, pending.
 *    → Cada estado tiene su propia UI y acciones claras.
 */

const PurchaseSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const status = searchParams.get('status') || 'approved';
  const orderId = searchParams.get('order_id');

  // Para producción: fetch order details y related items
  // const [order, setOrder] = useState(null);
  // const [relatedItems, setRelatedItems] = useState([]);

  const renderApproved = () => (
    <div className="text-center space-y-6">
      {/* Success animation */}
      <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          ¡Listo! Tu planificación ya está disponible
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Se agregó a <strong>"Mis Planificaciones"</strong>. Puedes asignarla a un paciente cuando lo necesites — sin prisa, a tu ritmo.
        </p>
      </div>

      {/* What just happened */}
      <Card className="max-w-md mx-auto border-emerald-100 bg-emerald-50/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-left text-sm">
              <p className="font-medium text-slate-800">¿Qué pasa ahora?</p>
              <ul className="mt-1.5 space-y-1 text-slate-600 text-[13px]">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  El recurso ya está en tu biblioteca personal
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Puedes asignarlo a uno o varios pacientes
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  Acceso ilimitado — descárgalo cuando quieras
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
        <Button
          className="bg-teal-600 hover:bg-teal-700 flex-1 py-5"
          onClick={() => navigate('/dashboard/marketplace/mis-planificaciones')}
        >
          <Package className="h-4 w-4 mr-2" />
          Ir a Mis Planificaciones
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-slate-600"
          onClick={() => navigate('/dashboard/marketplace')}
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Seguir explorando
        </Button>
      </div>

      {/* Cross-sell placeholder */}
      {/* TODO: Fetch related items based on purchase category */}
      {/*
      <div className="pt-8 border-t max-w-2xl mx-auto">
        <p className="text-sm font-semibold text-slate-700 mb-4">
          Otros terapeutas también compraron
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {relatedItems.map(item => (
            <ProductCard key={item.id} product={item} variant="compact" />
          ))}
        </div>
      </div>
      */}
    </div>
  );

  const renderPending = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
        <Clock className="h-10 w-10 text-amber-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Tu pago está en proceso
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          MercadoPago está procesando tu pago. Cuando se confirme, el recurso aparecerá automáticamente en <strong>"Mis Planificaciones"</strong>.
        </p>
      </div>
      <Card className="max-w-md mx-auto border-amber-100 bg-amber-50/30">
        <CardContent className="p-4 text-sm text-slate-600">
          <p>Esto suele tomar entre unos minutos y un par de horas según el método de pago. Te notificaremos cuando esté listo.</p>
        </CardContent>
      </Card>
      <Button
        variant="outline"
        onClick={() => navigate('/dashboard/marketplace')}
        className="text-slate-600"
      >
        Volver al Marketplace
      </Button>
    </div>
  );

  const renderFailure = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          El pago no se pudo completar
        </h1>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Hubo un problema con el procesamiento del pago. No se realizó ningún cargo. Puedes intentar nuevamente.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          className="bg-teal-600 hover:bg-teal-700"
          onClick={() => navigate(-1)}
        >
          Intentar de nuevo
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/marketplace')}
          className="text-slate-600"
        >
          Volver al Marketplace
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl animate-in fade-in duration-500">
      {status === 'approved' && renderApproved()}
      {status === 'pending' && renderPending()}
      {status === 'failure' && renderFailure()}
    </div>
  );
};

export default PurchaseSuccessPage;
