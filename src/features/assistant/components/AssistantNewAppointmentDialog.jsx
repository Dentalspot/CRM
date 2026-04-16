import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';

const AssistantNewAppointmentDialog = ({ isOpen, onOpenChange, selectedDate, onCreated }) => {
  const { currentOrganizationId } = useCurrentOrganization();
  const { toast } = useToast();

  const [dentists, setDentists] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    dentist_id: '',
    patient_id: '',
    date: selectedDate || '',
    start_time: '',
    end_time: '',
    notes: '',
  });

  useEffect(() => {
    if (selectedDate) setForm(f => ({ ...f, date: selectedDate }));
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen || !currentOrganizationId) return;

    const fetchData = async () => {
      setLoading(true);
      const [dentistsRes, patientsRes] = await Promise.all([
        supabase.from('organization_members')
          .select('user_id, profiles(full_name)')
          .eq('organization_id', currentOrganizationId)
          .eq('role', 'dentist')
          .eq('is_active', true),
        supabase.from('patients_admin_view')
          .select('id, full_name, phone')
          .eq('organization_id', currentOrganizationId)
          .order('full_name'),
      ]);

      setDentists((dentistsRes.data || []).map(d => ({
        id: d.user_id,
        name: d.profiles?.full_name || 'Sin nombre',
      })));
      setPatients(patientsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [isOpen, currentOrganizationId]);

  const handleSubmit = async () => {
    if (!form.dentist_id || !form.patient_id || !form.date || !form.start_time) {
      toast({ variant: 'destructive', title: 'Campos obligatorios', description: 'Completa dentista, paciente, fecha y hora de inicio.' });
      return;
    }
    if (!currentOrganizationId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo determinar la organización.' });
      return;
    }

    setSubmitting(true);
    try {
      const endTime = form.end_time || calculateEndTime(form.start_time, 30);

      const { error } = await supabase.from('appointments').insert({
        therapist_id: form.dentist_id,
        patient_id: form.patient_id,
        organization_id: currentOrganizationId,
        date: form.date,
        start_time: form.start_time,
        end_time: endTime,
        status: 'scheduled',
        notes: form.notes || null,
        duration_minutes: 30,
      });

      if (error) throw error;

      toast({ title: 'Cita agendada correctamente' });
      onOpenChange(false);
      onCreated?.();
      setForm({ dentist_id: '', patient_id: '', date: selectedDate || '', start_time: '', end_time: '', notes: '' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al agendar', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentOrganizationId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Agendar cita</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Dentista *</Label>
              <Select value={form.dentist_id} onValueChange={v => setForm(f => ({ ...f, dentist_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar dentista" /></SelectTrigger>
                <SelectContent>
                  {dentists.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Paciente *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(f => ({ ...f, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}{p.phone ? ` · ${p.phone}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Inicio *</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Fin</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} placeholder="Auto" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas administrativas..." rows={2} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function calculateEndTime(startTime, durationMinutes) {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + durationMinutes;
  const eh = Math.floor(totalMin / 60) % 24;
  const em = totalMin % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export default AssistantNewAppointmentDialog;
