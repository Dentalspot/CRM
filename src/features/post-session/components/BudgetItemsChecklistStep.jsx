/**
 * @file src/features/post-session/components/BudgetItemsChecklistStep.jsx
 *
 * Spec 030 — Step "Items" del wizard PostSession.
 *
 * Funcionalidad:
 * - Lista items pending del budget activo del paciente.
 * - Permite tildar los que se hicieron en la sesion.
 * - Si paciente tiene multiples budgets → selector con default = mas reciente.
 * - Si paciente NO tiene budget → UI alternativa: crear presupuesto rapido O saltar.
 * - Items sin precio (FR-007): input inline editable.
 * - Footer: total seleccionado + "Continuar al pago".
 * - Submit: markBudgetItemsCompleted batch + onComplete(suggestedAmount, budgetId).
 * - Reversión (FR-016): permite des-tildar items ya completed de ESTA cita.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils';
import {
  getActiveBudgetsForPatient,
  getBudgetItems,
  markBudgetItemsCompleted,
  revertBudgetItem,
  createQuickBudgetForSession,
} from '@/lib/api/budgetApi';

const BudgetItemsChecklistStep = ({
  patientId,
  appointmentId,
  patientFullName,
  therapistId,
  clinicId,
  organizationId,
  onComplete,
  onSkip,
}) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [items, setItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [editingPrices, setEditingPrices] = useState({}); // { itemId: stringValue }
  const [saving, setSaving] = useState(false);

  // Edge case "sin budget" (FR-022)
  const [quickDescription, setQuickDescription] = useState('');
  const [quickPrice, setQuickPrice] = useState('');

  // Initial fetch de budgets del paciente
  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    getActiveBudgetsForPatient(patientId)
      .then((data) => {
        setBudgets(data || []);
        if (data && data.length > 0) {
          setSelectedBudgetId(data[0].id);
        }
      })
      .catch((err) => {
        toast({
          variant: 'destructive',
          title: 'No se pudieron cargar los presupuestos',
          description: err.message,
        });
      })
      .finally(() => setLoading(false));
  }, [patientId, toast]);

  // Fetch items cuando cambia el budget seleccionado
  useEffect(() => {
    if (!selectedBudgetId) {
      setItems([]);
      return;
    }
    getBudgetItems(selectedBudgetId)
      .then((data) => {
        setItems(data || []);
        // Pre-check items que ya estan completed en ESTA cita (re-edicion)
        const preChecked = new Set(
          (data || [])
            .filter((i) => i.completed_in_appointment_id === appointmentId)
            .map((i) => i.id)
        );
        setCheckedIds(preChecked);
      })
      .catch((err) => {
        toast({
          variant: 'destructive',
          title: 'No se pudieron cargar los items del presupuesto',
          description: err.message,
        });
      });
  }, [selectedBudgetId, appointmentId, toast]);

  // Items visibles: pending + completed-de-esta-cita (los completed de OTRAS citas no se muestran)
  const visibleItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.status === 'pending' ||
        (i.status === 'completed' && i.completed_in_appointment_id === appointmentId)
    );
  }, [items, appointmentId]);

  // Total seleccionado: SUM(unit_price * quantity) de los tildados
  const totalSelected = useMemo(() => {
    return visibleItems
      .filter((i) => checkedIds.has(i.id))
      .reduce((acc, i) => {
        const overriddenPrice = editingPrices[i.id];
        const price = overriddenPrice !== undefined
          ? parseInt(overriddenPrice, 10) || 0
          : Number(i.unit_price) || 0;
        const qty = Number(i.quantity) || 1;
        return acc + price * qty;
      }, 0);
  }, [visibleItems, checkedIds, editingPrices]);

  // Toggle checkbox: si esta tildado y status='completed', revierte primero
  const handleToggle = async (item) => {
    const isChecked = checkedIds.has(item.id);

    // Caso 1: des-tildar un item que ya esta completed en esta cita → revertir DB
    if (isChecked && item.status === 'completed') {
      try {
        await revertBudgetItem(item.id, {
          organizationId,
          userId: therapistId,
          patientId,
          originalAppointmentId: appointmentId,
        });
        // Refresh item local
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'pending', completed_at: null, completed_in_appointment_id: null }
              : i
          )
        );
        const next = new Set(checkedIds);
        next.delete(item.id);
        setCheckedIds(next);
        toast({ title: 'Item revertido a pendiente' });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'No se pudo revertir',
          description: err.message,
        });
      }
      return;
    }

    // Caso 2: toggle normal en estado local (aun no committed)
    const next = new Set(checkedIds);
    if (isChecked) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    setCheckedIds(next);
  };

  // Submit: persistir items tildados como completed
  const handleSubmit = async () => {
    // Filtrar items que NO estan ya completed (los que ya lo estan no se re-marcan)
    const newCheckedIds = Array.from(checkedIds).filter((id) => {
      const item = items.find((i) => i.id === id);
      return item && item.status === 'pending';
    });

    if (newCheckedIds.length === 0) {
      // Si nada nuevo se tildo → solo avanzar con monto = 0
      onComplete(totalSelected, selectedBudgetId);
      return;
    }

    // Validar items sin precio (FR-007)
    const itemsToValidate = visibleItems.filter((i) => newCheckedIds.includes(i.id));
    const itemsWithoutPrice = itemsToValidate.filter((i) => {
      const overridden = editingPrices[i.id];
      const finalPrice = overridden !== undefined ? parseInt(overridden, 10) || 0 : Number(i.unit_price) || 0;
      return finalPrice <= 0;
    });

    if (itemsWithoutPrice.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Items sin precio',
        description: `${itemsWithoutPrice.length} item(s) no tienen precio. Editalos antes de continuar.`,
      });
      return;
    }

    setSaving(true);
    try {
      // Actualizar precios overridden ANTES de marcar completed
      const priceUpdates = Object.entries(editingPrices).filter(([id]) =>
        newCheckedIds.includes(id)
      );
      if (priceUpdates.length > 0) {
        await Promise.all(
          priceUpdates.map(async ([id, value]) => {
            const newPrice = parseInt(value, 10) || 0;
            const item = items.find((i) => i.id === id);
            if (!item || newPrice === item.unit_price) return;
            const { error } = await import('@/lib/supabaseClient').then(({ supabase }) =>
              supabase
                .from('treatment_budget_items')
                .update({
                  unit_price: newPrice,
                  subtotal: newPrice * (item.quantity || 1),
                })
                .eq('id', id)
            );
            if (error) throw error;
          })
        );
      }

      // Marcar como completed
      await markBudgetItemsCompleted(newCheckedIds, appointmentId, {
        organizationId,
        userId: therapistId,
        patientId,
      });

      toast({
        title: `${newCheckedIds.length} item(s) marcado(s) como completado(s)`,
        description: `Total: ${formatCurrency(totalSelected)}`,
      });

      onComplete(totalSelected, selectedBudgetId);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudieron marcar los items',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Quick budget (FR-022): crear inline + marcar completed + avanzar al pago
  const handleQuickBudget = async () => {
    const desc = quickDescription.trim();
    const price = parseInt(quickPrice, 10);

    if (!desc) {
      toast({ variant: 'destructive', title: 'Escribe una descripción' });
      return;
    }
    if (!price || price <= 0) {
      toast({ variant: 'destructive', title: 'Escribe un precio válido' });
      return;
    }

    setSaving(true);
    try {
      const { budget, item } = await createQuickBudgetForSession(
        {
          patientId,
          therapistId,
          clinicId,
          patientFullName,
          description: desc,
          unitPrice: price,
          appointmentId,
        },
        { organizationId, userId: therapistId }
      );

      toast({
        title: 'Presupuesto rápido creado',
        description: `${item.description} — ${formatCurrency(price)}`,
      });

      onComplete(price, budget.id);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo crear el presupuesto rápido',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───
  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center gap-2 text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Cargando presupuesto...</p>
      </div>
    );
  }

  // Caso A: paciente SIN budget → UI alternativa (FR-022)
  if (budgets.length === 0) {
    return (
      <div className="space-y-4 py-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Este paciente no tiene presupuesto.</p>
            <p className="text-xs mt-0.5">
              Crea uno rápido para esta sesión o salta al pago.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-white p-3">
          <div>
            <Label className="text-sm font-medium">Descripción</Label>
            <Input
              value={quickDescription}
              onChange={(e) => setQuickDescription(e.target.value)}
              placeholder="Ej: Consulta inicial, limpieza, etc."
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Precio (CLP)</Label>
            <Input
              type="number"
              value={quickPrice}
              onChange={(e) => setQuickPrice(e.target.value)}
              placeholder="35000"
              className="mt-1"
            />
          </div>
          <Button
            onClick={handleQuickBudget}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            <Sparkles className="h-4 w-4 mr-1" />
            Crear y marcar completado
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            Saltar al pago
          </Button>
          <span className="text-xs text-gray-400">o usa el formulario de arriba</span>
        </div>
      </div>
    );
  }

  // Caso B: paciente con budget(s) → checklist
  const hasNoItemsVisible = visibleItems.length === 0;

  return (
    <div className="space-y-4 py-2">
      {/* Selector de budget si hay multiples */}
      {budgets.length > 1 && (
        <div>
          <Label className="text-xs text-gray-500">Presupuesto</Label>
          <Select
            value={selectedBudgetId || ''}
            onValueChange={setSelectedBudgetId}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.title} ({b.item_count_pending} pendiente{b.item_count_pending === 1 ? '' : 's'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="text-sm font-medium block mb-2">
          ¿Qué intervenciones realizaste en esta sesión?
        </Label>

        {hasNoItemsVisible ? (
          <p className="text-sm text-gray-500 italic bg-gray-50 rounded p-3">
            No hay intervenciones pendientes en este presupuesto.
          </p>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {visibleItems.map((item) => {
              const isChecked = checkedIds.has(item.id);
              const isCompletedHere =
                item.status === 'completed' && item.completed_in_appointment_id === appointmentId;
              const overriddenPrice = editingPrices[item.id];
              const currentPrice = overriddenPrice !== undefined
                ? parseInt(overriddenPrice, 10) || 0
                : Number(item.unit_price) || 0;
              const hasNoPrice = currentPrice === 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border p-2.5 transition-colors',
                    isCompletedHere
                      ? 'bg-green-50 border-green-200'
                      : isChecked
                        ? 'bg-teal-50 border-teal-200'
                        : 'bg-white hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={isChecked}
                    onCheckedChange={() => handleToggle(item)}
                    disabled={saving}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-sm font-medium truncate',
                          isCompletedHere ? 'text-green-800' : 'text-gray-900'
                        )}
                      >
                        {item.description}
                      </span>
                      {isCompletedHere && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      )}
                    </div>

                    {hasNoPrice ? (
                      <div className="mt-1">
                        <Label className="text-xs text-amber-600">
                          Sin precio configurado — escribe el precio:
                        </Label>
                        <Input
                          type="number"
                          value={overriddenPrice ?? ''}
                          onChange={(e) =>
                            setEditingPrices((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="mt-1 h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <span
                        className={cn(
                          'text-xs text-gray-500 block mt-0.5',
                          isCompletedHere && 'line-through'
                        )}
                      >
                        {formatCurrency(currentPrice)}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </span>
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer total */}
      <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 p-3">
        <span className="text-sm font-medium text-gray-700">Total seleccionado</span>
        <span className="text-lg font-bold text-teal-700">
          {formatCurrency(totalSelected)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onSkip} disabled={saving}>
          Saltar al pago
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          Continuar al pago
        </Button>
      </div>
    </div>
  );
};

export default BudgetItemsChecklistStep;
