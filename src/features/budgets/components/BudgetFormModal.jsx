import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Send, FileDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

import { useBudgetForm } from '../hooks/useBudgetForm';
import { createBudget, updateBudget, fetchBudgetWithItems } from '../hooks/useBudgets';
import BudgetFormContent from './BudgetFormContent';
import { generateBudgetPdf } from '../lib/budgetPdfGenerator';
import { supabase } from '@/lib/supabaseClient';

/**
 * Modal para crear o editar un presupuesto.
 * - Crear: pasar `patientId`, dejar `budgetId` undefined
 * - Editar: pasar `budgetId` (carga datos automáticamente)
 *
 * En el futuro, BudgetFormContent puede reusarse en una página dedicada
 * sin tocar la lógica del hook.
 */
const BudgetFormModal = ({ open, onOpenChange, patientId, budgetId, onCreated, onUpdated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const form = useBudgetForm(user?.id);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const isEditMode = Boolean(budgetId);
  const [editingBudget, setEditingBudget] = useState(null);

  // Spec 030 followup Ley 20.584 art. 12: el budget debe ir a la clínica del
  // paciente, NO a otra clínica del dentista. Resolvemos al abrir el modal en
  // modo CREATE y forzamos esa clinic en el form (readonly UI).
  const [lockedClinic, setLockedClinic] = useState(null); // { id, name }
  const [resolvingClinic, setResolvingClinic] = useState(false);

  useEffect(() => {
    if (!open || isEditMode || !patientId) return;
    let cancelled = false;
    setResolvingClinic(true);
    (async () => {
      try {
        const { data: pat } = await supabase
          .from('patients')
          .select('organization_id')
          .eq('id', patientId)
          .maybeSingle();
        if (cancelled) return;
        if (!pat?.organization_id) {
          setLockedClinic(null);
          return;
        }
        // Tomar la clínica más antigua de la org del paciente. En la mayoría
        // de orgs hay una sola; si hubiera varias, el founder de la clínica
        // arrancó con la primera.
        const { data: clinic } = await supabase
          .from('clinics')
          .select('id, name')
          .eq('organization_id', pat.organization_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (clinic?.id) {
          setLockedClinic(clinic);
          form.setClinicId(clinic.id);
        }
      } finally {
        if (!cancelled) setResolvingClinic(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, patientId]);

  // Cargar datos cuando se abre en modo edit
  useEffect(() => {
    if (!open || !budgetId) return;
    let mounted = true;
    setLoadingExisting(true);
    fetchBudgetWithItems(budgetId)
      .then((data) => {
        if (!mounted) return;
        setEditingBudget(data.budget);
        form.loadFromBudget(data);
      })
      .catch((err) => {
        logger.error('[BudgetFormModal] error loading budget for edit:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar el presupuesto.',
        });
        onOpenChange(false);
      })
      .finally(() => {
        if (mounted) setLoadingExisting(false);
      });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budgetId]);

  const handleCreate = async (statusToSet, { downloadPdf = false } = {}) => {
    if (!form.validation.valid) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: form.validation.errors[0] });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form.buildPayload(),
        patient_id: patientId,
        therapist_id: user.id,
        status: statusToSet,
      };
      const created = await createBudget(payload);
      toast({
        title: statusToSet === 'enviado' ? 'Presupuesto enviado' : 'Borrador guardado',
        description: `Presupuesto #${created.budget_number} — ${created.title}`,
      });

      // Spec 030 followup: opcional descargar PDF inmediato
      if (downloadPdf) {
        try {
          await generateBudgetPdf({
            budgetId: created.id,
            patientId,
            dentistId: user.id,
            clinicId: lockedClinic?.id || created.clinic_id || null,
          });
          toast({ title: '✓ PDF descargado' });
        } catch (pdfErr) {
          logger.error('[BudgetFormModal] PDF generation failed:', pdfErr);
          toast({
            variant: 'destructive',
            title: 'El presupuesto se guardó pero el PDF falló',
            description: pdfErr.message,
          });
        }
      }

      form.reset();
      onOpenChange(false);
      if (onCreated) onCreated(created);
    } catch (err) {
      logger.error('[BudgetFormModal] error creating budget:', err);
      toast({ variant: 'destructive', title: 'Error al crear', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async ({ downloadPdf = false, sendToPatient = false } = {}) => {
    if (!form.validation.valid) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: form.validation.errors[0] });
      return;
    }
    setSubmitting(true);
    try {
      await updateBudget(budgetId, form.buildPayload());

      // Si el dentista eligió "enviar al paciente" desde el modo edit + el
      // budget aún está en borrador, transicionamos a enviado.
      if (sendToPatient && editingBudget?.status === 'borrador') {
        const { updateBudgetStatus } = await import('../hooks/useBudgets');
        await updateBudgetStatus(budgetId, 'enviado');
      }

      toast({
        title: sendToPatient ? 'Presupuesto enviado al paciente' : 'Cambios guardados',
        description: `Presupuesto #${editingBudget?.budget_number} actualizado.`,
      });

      // Spec 030 followup: opcional descargar PDF inmediato después de actualizar
      if (downloadPdf) {
        try {
          await generateBudgetPdf({
            budgetId,
            patientId,
            dentistId: user.id,
            clinicId: lockedClinic?.id || editingBudget?.clinic_id || null,
          });
          toast({ title: '✓ PDF descargado' });
        } catch (pdfErr) {
          logger.error('[BudgetFormModal] PDF generation failed:', pdfErr);
          toast({
            variant: 'destructive',
            title: 'Cambios guardados pero el PDF falló',
            description: pdfErr.message,
          });
        }
      }

      form.reset();
      setEditingBudget(null);
      onOpenChange(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      logger.error('[BudgetFormModal] error updating budget:', err);
      toast({ variant: 'destructive', title: 'Error al guardar', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    form.reset();
    setEditingBudget(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? `Editar presupuesto${editingBudget ? ` #${editingBudget.budget_number}` : ''}`
              : 'Nuevo presupuesto'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifica los servicios y montos cotizados.'
              : 'Crea un presupuesto con los servicios cotizados para este paciente.'}
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <BudgetFormContent
            form={form}
            lockedClinic={lockedClinic}
            resolvingClinic={resolvingClinic}
          />
        )}

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="ghost" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>

          {isEditMode ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleUpdate()}
                disabled={submitting || !form.validation.valid || loadingExisting}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar cambios
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdate({ downloadPdf: true })}
                disabled={submitting || !form.validation.valid || loadingExisting}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Guardar y descargar PDF
              </Button>
              {editingBudget?.status === 'borrador' && (
                <Button
                  onClick={() => handleUpdate({ sendToPatient: true })}
                  disabled={submitting || !form.validation.valid || loadingExisting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar al paciente
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleCreate('borrador')}
                disabled={submitting || !form.validation.valid}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar borrador
              </Button>
              <Button
                variant="outline"
                onClick={() => handleCreate('borrador', { downloadPdf: true })}
                disabled={submitting || !form.validation.valid}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                Guardar y descargar PDF
              </Button>
              <Button
                onClick={() => handleCreate('enviado')}
                disabled={submitting || !form.validation.valid}
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar al paciente
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetFormModal;
