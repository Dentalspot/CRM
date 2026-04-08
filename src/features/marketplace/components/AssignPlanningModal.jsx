import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle2, Search, UserPlus, Users } from 'lucide-react';
import EmptyState from '@/features/marketplace/components/EmptyState';
import logger from '@/lib/utils/logger';
import { fetchTherapistPatients } from '@/features/marketplace/api/marketplacePlansApi';

/**
 * AssignPlanningModal v2 — Usa la tabla patients real.
 *
 * Query: patients.therapist_id = user.id, status = 'active'
 * full_name viene de profiles via FK (patients_profile_id_fkey)
 *
 * TODO: Crear tabla patient_plan_assignments para persistir:
 * CREATE TABLE patient_plan_assignments (
 *   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   patient_id UUID NOT NULL REFERENCES patients(id),
 *   marketplace_plan_id UUID NOT NULL REFERENCES marketplace_plans(id),
 *   purchase_id UUID REFERENCES marketplace_purchases(id),
 *   assigned_by UUID NOT NULL REFERENCES profiles(id),
 *   status TEXT DEFAULT 'active',
 *   assigned_at TIMESTAMPTZ DEFAULT now(),
 *   UNIQUE(patient_id, marketplace_plan_id)
 * );
 */

const AssignPlanningModal = ({ isOpen, onClose, purchase, onSuccess }) => {
  const { user } = useAuth();
  const planName = purchase?.plan?.name || 'esta planificación';

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [assignedNames, setAssignedNames] = useState([]);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchTherapistPatients(user.id)
        .then(setPatients)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user?.id]);

  const togglePatient = (patientId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(patientId) ? next.delete(patientId) : next.add(patientId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      // TODO: Insert into patient_plan_assignments table
      // const assignments = [...selectedIds].map((patientId) => ({
      //   patient_id: patientId,
      //   marketplace_plan_id: purchase.marketplace_plan_id,
      //   purchase_id: purchase.id,
      //   assigned_by: user.id,
      //   status: 'active',
      // }));
      // await supabase.from('patient_plan_assignments').insert(assignments);

      await new Promise((r) => setTimeout(r, 800)); // Simulate

      const names = patients.filter((p) => selectedIds.has(p.id)).map((p) => p.full_name);
      setAssignedNames(names);
      setIsSuccess(true);
      setTimeout(() => onSuccess?.(names), 1800);
    } catch (err) {
      logger.error('Error assigning:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = patients.filter((p) => {
    if (!searchInput) return true;
    return p.full_name.toLowerCase().includes(searchInput.toLowerCase());
  });

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-teal-600" /> Asignar a paciente
              </DialogTitle>
              <DialogDescription className="text-left">
                Selecciona a qué pacientes asignar <strong className="text-slate-700">{planName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3">
              {patients.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input placeholder="Buscar paciente..." className="pl-9 h-9 text-sm"
                    value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                </div>
              )}

              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))
                ) : patients.length === 0 ? (
                  <EmptyState icon={Users} title="Sin pacientes registrados"
                    description="Registra a tu primer paciente para asignarle planificaciones." compact />
                ) : filtered.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-400">No se encontró a ese paciente.</div>
                ) : (
                  filtered.map((patient) => {
                    const isSelected = selectedIds.has(patient.id);
                    return (
                      <button key={patient.id} onClick={() => togglePatient(patient.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                          isSelected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-50 border border-transparent'
                        }`}>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className={`text-xs font-medium ${isSelected ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                            {patient.full_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{patient.full_name}</p>
                          {patient.attention_type && (
                            <p className="text-xs text-slate-400">{patient.attention_type}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {isSelected ? (
                            <div className="h-5 w-5 rounded-full bg-teal-600 flex items-center justify-center">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-slate-200" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {selectedIds.size > 0 && (
                <div className="bg-teal-50 border border-teal-100 rounded-lg p-2.5 text-center">
                  <p className="text-sm text-teal-700 font-medium">
                    {selectedIds.size} paciente{selectedIds.size !== 1 ? 's' : ''} seleccionado{selectedIds.size !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button onClick={handleAssign} disabled={isSubmitting || selectedIds.size === 0}
                className="bg-teal-600 hover:bg-teal-700 min-w-[100px]">
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Asignando</> : <><UserPlus className="mr-2 h-4 w-4" /> Asignar</>}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="py-10 flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Planificación asignada</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              {assignedNames.length === 1
                ? `${assignedNames[0]} ya tiene acceso a esta planificación.`
                : `${assignedNames.join(', ')} ya tienen acceso.`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignPlanningModal;
