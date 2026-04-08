import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Check, X, Loader2, AlertCircle } from 'lucide-react';

const TYPE_LABELS = {
  fonoaudiologo: 'Odontólogo/a',
  psicologo: 'Psicólogo/a',
  terapeuta_ocupacional: 'Terapeuta Ocupacional',
  neurologo: 'Neurólogo/a',
  psiquiatra: 'Psiquiatra',
  pediatra: 'Pediatra',
  educador_diferencial: 'Educador/a Diferencial',
  kinesiologo: 'Kinesiólogo/a',
  otro: 'Otro profesional',
};

const PendingReferrals = ({ referrals = [], onAccept, onReject }) => {
  const [processingId, setProcessingId] = useState(null);

  if (!referrals.length) return null;

  const handleAction = async (id, action) => {
    setProcessingId(id);
    try {
      if (action === 'accept') await onAccept(id);
      else await onReject(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {referrals.map((ref) => {
        const details = ref.details || {};
        const typeLabel = TYPE_LABELS[details.referral_type] || details.referral_type || 'Profesional';
        const professionalName = details.referred_professional_name || typeLabel;
        const referredBy = ref.therapist?.full_name || details.referred_by_name || 'Tu dentista';
        const isProcessing = processingId === ref.id;
        const date = ref.entry_date
          ? new Date(ref.entry_date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
          : '';

        return (
          <Card key={ref.id} className="border-purple-200 bg-purple-50/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-purple-100 flex-shrink-0">
                  <UserPlus className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm text-purple-900">Nueva Derivación</h4>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
                      Pendiente
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">{referredBy}</span> te ha derivado a{' '}
                    <span className="font-medium text-purple-800">{professionalName}</span>
                  </p>
                  {details.referral_reason && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      Motivo: {details.referral_reason}
                    </p>
                  )}
                  {date && <p className="text-xs text-gray-400 mt-1">{date}</p>}

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white text-xs"
                      onClick={() => handleAction(ref.id, 'accept')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                      Aceptar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                      onClick={() => handleAction(ref.id, 'reject')}
                      disabled={isProcessing}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2 bg-amber-50 rounded-md border border-amber-200 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-700">
                  Al aceptar, tu historial clínico se compartirá con el nuevo profesional.
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PendingReferrals;
