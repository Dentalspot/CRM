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
import { Loader2, Save, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

import { useBudgetForm } from '../hooks/useBudgetForm';
import { createBudget, updateBudget, fetchBudgetWithItems } from '../hooks/useBudgets';
import BudgetFormContent from './BudgetFormContent';

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

  const handleCreate = async (statusToSet) => {
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

  const handleUpdate = async () => {
    if (!form.validation.valid) {
      toast({ variant: 'destructive', title: 'Datos incompletos', description: form.validation.errors[0] });
      return;
    }
    setSubmitting(true);
    try {
      await updateBudget(budgetId, form.buildPayload());
      toast({
        title: 'Cambios guardados',
        description: `Presupuesto #${editingBudget?.budget_number} actualizado.`,
      });
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
          <BudgetFormContent form={form} />
        )}

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button variant="ghost" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>

          {isEditMode ? (
            <Button onClick={handleUpdate} disabled={submitting || !form.validation.valid || loadingExisting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar cambios
            </Button>
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
