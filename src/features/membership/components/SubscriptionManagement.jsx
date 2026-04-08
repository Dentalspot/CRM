import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CreditCard, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SubscriptionManagement = ({ subscription, onCancel, onReactivate, isProcessing }) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (subscription?.isFree) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-600" /> Gestionar Suscripción
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription?.cancel_at_period_end ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Suscripción programada para cancelar</p>
                <p className="text-sm text-amber-700 mt-1">
                  Tu suscripción se cancelará el {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}.
                  Hasta entonces, seguirás teniendo acceso a todas las funciones.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100"
                  onClick={onReactivate}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Reactivar Suscripción
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Cancelar Suscripción
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tu suscripción se cancelará al final del período actual
                    ({subscription?.current_period_end && format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}).
                    Hasta entonces, seguirás teniendo acceso a todas las funciones.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mantener Suscripción</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => { onCancel(); setShowCancelDialog(false); }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sí, Cancelar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManagement;
