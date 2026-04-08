import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Unlock, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';

const UnblockTimeModal = ({ isOpen, onClose, blockedTime, onUnblocked }) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!blockedTime) return null;

  const startDate = new Date(blockedTime.start_time);
  const endDate = new Date(blockedTime.end_time);

  const handleUnblock = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('blocked_times')
        .delete()
        .eq('id', blockedTime.id);

      if (error) throw error;

      toast({
        title: '✅ Horario desbloqueado',
        description: 'El horario está disponible nuevamente para agendar citas.',
      });

      onUnblocked?.();
      onClose();
    } catch (error) {
      logger.error('Error al desbloquear:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo desbloquear el horario.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <Unlock className="h-5 w-5" />
            Desbloquear Horario
          </DialogTitle>
          <DialogDescription>
            ¿Deseas eliminar este bloqueo y liberar el horario?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Info del bloqueo */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Bloqueo actual</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{format(startDate, "EEEE d 'de' MMMM", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</span>
              </div>
            </div>

            {blockedTime.reason && (
              <div className="pt-2 border-t border-red-200">
                <p className="text-xs text-gray-500">Motivo:</p>
                <p className="text-sm text-gray-700">{blockedTime.reason}</p>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-500">
            Al desbloquear, este horario quedará disponible para que los pacientes puedan agendar citas.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            onClick={handleUnblock}
            disabled={isDeleting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Desbloqueando...
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Desbloquear
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnblockTimeModal;