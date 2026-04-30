import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar } from 'lucide-react';
import AvailabilityManager from '@/components/therapist-profile/sections/AvailabilityManager';

/**
 * Modal para que la clínica admin edite el horario de un dentista
 * en SU clínica específica. Reusa AvailabilityManager con prop
 * `therapistIdOverride` para apuntar al dentista correcto.
 */
const TherapistScheduleModal = ({
  open,
  onOpenChange,
  therapist,        // { id, full_name }
  clinicId,
  clinicName,
  clinicModality = 'presencial',
}) => {
  if (!therapist || !clinicId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>
                Horario de {therapist.full_name || 'el dentista'}
              </DialogTitle>
              <DialogDescription>
                Define los días y horas en que este dentista atiende en
                {clinicName ? ` "${clinicName}"` : ' tu clínica'}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <AvailabilityManager
          clinicId={clinicId}
          clinicModality={clinicModality}
          therapistIdOverride={therapist.id}
          readOnlyTitle={`Horario en ${clinicName || 'esta clínica'}`}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TherapistScheduleModal;
