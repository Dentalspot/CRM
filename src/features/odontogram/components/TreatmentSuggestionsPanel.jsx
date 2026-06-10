/**
 * @file src/features/odontogram/components/TreatmentSuggestionsPanel.jsx
 *
 * Spec 030 followup mejora 1: panel lateral derecho del odontograma con
 * sugerencias automáticas de tratamiento generadas desde el diagnóstico.
 *
 * Cada sugerencia:
 *  - Descripción "Tratamiento diente N"
 *  - Origen (condiciones que la dispararon: "caries M+D")
 *  - Precio editable inline (autocompletado desde therapist_services si match)
 *  - Botón descartar (sticky en la sesión, no persiste)
 *
 * Footer:
 *  - Total
 *  - Botón "Guardar al presupuesto" → batch INSERT en treatment_budget_items
 *    del budget activo del paciente (lo crea si no existe).
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Sparkles,
  ClipboardList,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils/formatters';
import { getOrCreateActiveBudget } from '@/lib/api/budgetApi';

const SHORT_CONDITION_LABELS = {
  caries: 'caries',
  fracture: 'fractura',
  periapical: 'lesión periapical',
  extraction: 'requiere extracción',
};

const TreatmentSuggestionsPanel = ({
  suggestions,
  onDismiss,
  patientId,
  patientFullName,
  onSaved,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Precio overrides por key (key → string)
  const [priceOverrides, setPriceOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState(new Set());

  const handlePriceChange = (key, value) => {
    setPriceOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const getEffectivePrice = (suggestion) => {
    const override = priceOverrides[suggestion.key];
    if (override !== undefined && override !== '') {
      return parseInt(override, 10) || 0;
    }
    return Number(suggestion.unit_price) || 0;
  };

  // Total de las sugerencias visibles (no descartadas, no guardadas)
  const pendingSuggestions = suggestions.filter((s) => !savedKeys.has(s.key));
  const totalAmount = pendingSuggestions.reduce(
    (sum, s) => sum + getEffectivePrice(s),
    0
  );

  const handleSaveAll = async () => {
    if (!patientId) {
      toast({ variant: 'destructive', title: 'No hay paciente activo' });
      return;
    }
    if (pendingSuggestions.length === 0) return;

    // Validar que no haya items con precio = 0
    const zeroPriced = pendingSuggestions.filter((s) => getEffectivePrice(s) <= 0);
    if (zeroPriced.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Falta precio',
        description: `${zeroPriced.length} sugerencia(s) tienen precio en $0. Editá o descartá antes de guardar.`,
      });
      return;
    }

    setSaving(true);
    try {
      // Lookup org/clinic del paciente
      const { data: pat, error: patErr } = await supabase
        .from('patients')
        .select('organization_id')
        .eq('id', patientId)
        .single();
      if (patErr || !pat?.organization_id) {
        throw new Error('No se pudo determinar la organización del paciente');
      }
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('organization_id', pat.organization_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!clinic?.id) {
        throw new Error('No se encontró la clínica');
      }

      // Get or create budget activo
      const budget = await getOrCreateActiveBudget({
        patientId,
        therapistId: user.id,
        clinicId: clinic.id,
        patientFullName,
      });

      // Batch INSERT items
      const itemsPayload = pendingSuggestions.map((s, idx) => {
        const price = getEffectivePrice(s);
        return {
          budget_id: budget.id,
          service_id: s.service_id || null,
          description: s.description,
          quantity: 1,
          unit_price: price,
          subtotal: price,
          sort_order: idx,
          status: 'pending',
        };
      });

      const { error: insErr } = await supabase
        .from('treatment_budget_items')
        .insert(itemsPayload);

      if (insErr) throw insErr;

      // Marcar como guardadas (sticky visual chip verde)
      const newSaved = new Set(savedKeys);
      pendingSuggestions.forEach((s) => newSaved.add(s.key));
      setSavedKeys(newSaved);

      toast({
        title: `✓ ${pendingSuggestions.length} tratamiento(s) agregado(s) al presupuesto`,
        description: `Total ${formatCurrency(totalAmount)}${budget.isNew ? ' (presupuesto nuevo)' : ''}`,
      });

      onSaved?.({ budget, count: pendingSuggestions.length });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar el plan',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Render
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
        <div className="flex items-start gap-2 text-sm text-slate-500">
          <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400" />
          <div>
            <p className="font-medium text-slate-700">Plan de tratamiento sugerido</p>
            <p className="text-xs mt-1">
              Marcá una condición tratable (caries, fractura, lesión periapical, extracción) y vas a ver acá la propuesta automática para el presupuesto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/30 overflow-hidden">
      <div className="bg-purple-100/60 border-b border-purple-200 px-4 py-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-700" />
        <h4 className="text-sm font-semibold text-purple-900">
          Plan sugerido ({pendingSuggestions.length})
        </h4>
      </div>

      <div className="p-3 space-y-2 max-h-[480px] overflow-y-auto">
        {suggestions.map((s) => {
          const isSaved = savedKeys.has(s.key);
          const effectivePrice = getEffectivePrice(s);
          const hasNoPrice = effectivePrice <= 0;
          return (
            <div
              key={s.key}
              className={`rounded-lg border p-2.5 ${
                isSaved
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isSaved && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium truncate ${
                        isSaved ? 'text-green-800' : 'text-slate-900'
                      }`}
                    >
                      {s.description}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sugerido por:{' '}
                    {s.conditions
                      .map((c) => SHORT_CONDITION_LABELS[c] || c)
                      .join(' + ')}
                  </p>
                </div>
                {!isSaved && (
                  <button
                    type="button"
                    onClick={() => onDismiss(s.key)}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                    title="Descartar sugerencia"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!isSaved && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Precio CLP</span>
                  <Input
                    type="number"
                    value={
                      priceOverrides[s.key] !== undefined
                        ? priceOverrides[s.key]
                        : s.unit_price
                        ? String(s.unit_price)
                        : ''
                    }
                    onChange={(e) => handlePriceChange(s.key, e.target.value)}
                    placeholder="0"
                    className="h-7 text-xs"
                  />
                  {hasNoPrice && (
                    <AlertCircle
                      className="h-3.5 w-3.5 text-amber-500 flex-shrink-0"
                      aria-label="Falta precio"
                    />
                  )}
                </div>
              )}

              {isSaved && (
                <div className="text-[11px] text-green-700 mt-1">
                  {formatCurrency(effectivePrice)} · agregado al presupuesto
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pendingSuggestions.length > 0 && (
        <div className="border-t border-purple-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Total sugerido</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <ClipboardList className="h-4 w-4 mr-1.5" />
            )}
            Guardar al presupuesto
          </Button>
        </div>
      )}
    </div>
  );
};

export default TreatmentSuggestionsPanel;
