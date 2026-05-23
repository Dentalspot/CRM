import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import TimePicker from '@/components/ui/time-picker';

const BlockTimeForm = ({ slotInfo, clinics = [], onSuccess, setIsSubmitting }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Default values if slotInfo is null
  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultStartTime = '09:00';
  const defaultEndTime = '10:00';

  const [blockData, setBlockData] = useState({
    date: slotInfo?.date || today,
    start_time: slotInfo?.startTime || defaultStartTime,
    end_time: slotInfo?.endTime || defaultEndTime,
    reason: '',
    clinic_id: slotInfo?.clinicId || (clinics.length === 1 ? clinics[0]?.id : 'all'),
  });

  // Update form when slotInfo changes
  useEffect(() => {
    if (slotInfo) {
      setBlockData(prev => ({
        ...prev,
        date: slotInfo.date || prev.date,
        start_time: slotInfo.startTime || prev.start_time,
        end_time: slotInfo.endTime || prev.end_time,
        clinic_id: slotInfo.clinicId || prev.clinic_id,
      }));
    }
  }, [slotInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlockData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setBlockData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlockTime = async () => {
    if (!blockData.reason) {
      toast({
        title: 'Error',
        description: 'Debes ingresar un motivo para el bloqueo.',
        variant: 'destructive',
      });
      return;
    }

    if (!blockData.date) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una fecha.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('blocked_times').insert({
        therapist_id: user.id,
        clinic_id: (blockData.clinic_id && blockData.clinic_id !== 'all') ? blockData.clinic_id : null,
        start_time: `${blockData.date}T${blockData.start_time}`,
        end_time: `${blockData.date}T${blockData.end_time}`,
        reason: blockData.reason,
      });

      if (error) throw error;

      toast({
        title: '¡Horario Bloqueado!',
        description: 'El tiempo ha sido bloqueado en tu agenda.',
      });

      onSuccess?.();

    } catch (error) {
      toast({
        title: 'Error',
        description: `No se pudo bloquear el horario: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date picker - always show when slotInfo doesn't have a date */}
      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          name="date"
          type="date"
          value={blockData.date}
          onChange={handleChange}
          min={today}
        />
      </div>

      {clinics.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="clinic_id">Clínica</Label>
          <Select
            name="clinic_id"
            onValueChange={(value) => handleSelectChange('clinic_id', value)}
            value={blockData.clinic_id || 'all'}
          >
            <SelectTrigger id="clinic_id">
              <SelectValue placeholder="Seleccionar clínica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Clínicas</SelectItem>
              {clinics.map(clinic => (
                <SelectItem key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Hora Inicio</Label>
          <TimePicker
            value={blockData.start_time}
            onChange={(v) => setBlockData((prev) => ({ ...prev, start_time: v }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Hora Fin</Label>
          <TimePicker
            value={blockData.end_time}
            onChange={(v) => setBlockData((prev) => ({ ...prev, end_time: v }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo del Bloqueo *</Label>
        <Textarea
          id="reason"
          name="reason"
          value={blockData.reason}
          onChange={handleChange}
          placeholder="Ej: Almuerzo, reunión, diligencia personal..."
        />
      </div>

      <button
        id="block-time-submit"
        onClick={handleBlockTime}
        className="hidden"
      >
        Submit
      </button>
    </div>
  );
};

export default BlockTimeForm;