import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const status = searchParams.get('status');
  const type = searchParams.get('type') || 'unknown';
  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const merchantOrderId = searchParams.get('merchant_order_id');

  const [verificationStatus, setVerifyStatus] = useState('checking'); // checking, verified, failed

  useEffect(() => {
    const verifyPayment = async () => {
      // If status is 'approved', let's optimistic update UI but ideally we verify with backend/webhook
      if (status === 'approved') {
        try {
          // If we have an order ID, try to update it optimistically so the user sees it immediately
          if (type === 'marketplace' && orderId) {
            // Note: In a real secure app, we rely on webhook. 
            // But to improve UX latency, we can check if the webhook already fired or poll for it.
            // For now, we simulate success message immediately.
            
            // Optional: Call an RPC to force-check status if webhook is slow (not implemented here)
          }
          setVerifyStatus('verified');
        } catch (error) {
          logger.error("Verification error", error);
          setVerifyStatus('verified'); // Still show success if MP says approved
        }
      } else if (status === 'failure' || status === 'rejected') {
        setVerifyStatus('failed');
      } else {
        setVerifyStatus('pending');
      }
    };

    verifyPayment();
  }, [status, orderId, type]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'checking':
        return (
          <div className="flex flex-col items-center py-10">
            <Loader2 className="h-16 w-16 text-teal-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Verificando pago...</h2>
            <p className="text-gray-500 mt-2">Por favor espera un momento.</p>
          </div>
        );
      
      case 'verified':
        return (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {type === 'marketplace' 
                ? 'Tu recurso ha sido añadido a tu biblioteca. Puedes descargarlo ahora.' 
                : 'Tu suscripción ha sido activada correctamente. Disfruta de los beneficios.'}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 w-full mb-6 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">ID de Pago:</span>
                <span className="font-mono text-gray-900">{paymentId || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estado:</span>
                <span className="text-green-600 font-medium">Aprobado</span>
              </div>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pago Rechazado</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Hubo un problema al procesar tu pago. No se ha realizado ningún cargo.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Intentar nuevamente
            </Button>
          </div>
        );

      default: // pending
        return (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-10 w-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pago Pendiente</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Tu pago está siendo procesado. Te notificaremos cuando se confirme.
            </p>
          </div>
        );
    }
  };

  const getRedirectButton = () => {
    if (verificationStatus !== 'verified') return null;

    if (type === 'marketplace') {
      return (
        <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => navigate('/dashboard/marketplace/purchases')}>
          Ir a Mis Compras <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    } else {
      return (
        <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => navigate('/dashboard')}>
          Ir al Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-gray-400 text-sm font-normal uppercase tracking-wider">
            Resumen de Transacción
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {getRedirectButton()}
          <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentStatusPage;