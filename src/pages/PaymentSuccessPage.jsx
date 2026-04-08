import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { trackPurchaseEvent, formatCLP } from '@/lib/paymentTracking';

const PaymentSuccessPage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { trackEvent } = useMetaTracking();
  const [countdown, setCountdown] = useState(5);

  // Retrieve plan details passed from the checkout process (via navigation state)
  // Fallback values provided for safety
  const planDetails = location.state?.plan || {
    name: 'Suscripción DentalSpot',
    price: 0,
    interval: 'mensual'
  };

  const amountPaid = planDetails.price || 0;

  useEffect(() => {
    // 1. Trigger Confetti on Mount
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00A8CC', '#F2F2F2', '#10B981'] // Brand colors
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00A8CC', '#F2F2F2', '#10B981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // 2. Track Purchase Event (Primary Conversion)
    // We only track if we have a valid amount to avoid skewing data
    if (amountPaid > 0) {
      trackPurchaseEvent(trackEvent, {
        amount: amountPaid,
        currency: 'CLP',
        orderId: orderId,
        planDetails: {
          id: planDetails.id || 'plan_unknown',
          name: planDetails.name,
          interval: planDetails.interval
        }
      });
    }

    // 3. Auto-redirect timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [amountPaid, orderId, planDetails, trackEvent, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col items-center justify-center p-4">
      
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Logo />
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-t-4 border-t-green-500 overflow-hidden">
          <CardHeader className="text-center pt-8 pb-2">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              ¡Pago Exitoso!
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Tu suscripción ha sido activada correctamente.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            
            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">ID de Orden</span>
                <span className="font-mono text-sm font-medium text-gray-700">#{orderId?.slice(0,8).toUpperCase()}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-600 font-medium">{planDetails.name}</span>
                <span className="text-gray-900 font-bold">{formatCLP(amountPaid)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 capitalize">{planDetails.interval}</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">Pagado</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Hemos enviado un comprobante a tu correo electrónico.
            </p>

          </CardContent>

          <CardFooter className="flex flex-col gap-4 bg-gray-50/50 p-6 border-t">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium h-12 text-lg"
              onClick={() => navigate('/dashboard')}
            >
              Ir al Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Redirigiendo en {countdown} segundos...</span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentSuccessPage;