/**
 * @file src/features/odontogram/components/AddBudgetItemModal.jsx
 *
 * Spec 030 — US3: modal para agregar tratamiento al presupuesto del paciente
 * desde el odontograma. Cumple FR-004 (marcar tratamiento → crear item).
 *
 * Estrategia:
 * - Datalist HTML5 con tratamientos odonto comunes en Chile (autocomplete).
 * - Si el dentista tiene el tratamiento configurado en therapist_services,
 *   se autocompleta el precio al elegir/escribir el nombre (lookup ILIKE).
 * - Si no hay match, input precio queda en blanco para que el dentista lo
 *   complete manualmente.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  createBudgetItemFromOdontogram,
  findServiceByTreatmentName,
} from '../api/budgetSyncApi';

// Sugerencias para datalist HTML5 — tratamientos odonto chilenos comunes
const COMMON_TREATMENTS = [
  'Endodoncia',
  'Limpieza completa',
  'Obturación',
  'Obturación con resina',
  'Extracción',
  'Extracción complicada',
  'Corona',
  'Corona cerámica',
  'Implante',
  'Sellante',
  'Restauración',
  'Blanqueamiento',
  'Consulta ortodoncia',
  'Periodoncia',
  'Cirugía menor',
  'Radiografía',
  'Profilaxis',
];

const AddBudgetItemModal = ({
  isOpen,
  onClose,
  patientId,
  patientFullName,
  toothNumbers = [], // array de numeros validos para datalist
  onItemAdded,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tooth, setTooth] = useState('');
  const [treatment, setTreatment] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [priceAutoFilled, setPriceAutoFilled] = useState(false);

  const handleClose = () => {
    setTooth('');
    setTreatment('');
    setPrice('');
    setSaving(false);
    setPriceAutoFilled(false);
    onClose();
  };

  // Cuando el dentista escribe el tratamiento, lookup en therapist_services
  const handleTreatmentBlur = async () => {
    if (!treatment.trim() || !user?.id) return;
    if (price && !priceAutoFilled) return; // Respetar precio manual

    try {
      const { service_id, unit_price } = await findServiceByTreatmentName(
        user.id,
        treatment.trim()
      );
      if (service_id && unit_price > 0) {
        setPrice(String(unit_price));
        setPriceAutoFilled(true);
      }
    } catch {
      // silent: si falla el lookup, el precio queda manual
    }
  };

  const handleSubmit = async () => {
    if (!treatment.trim()) {
      toast({ variant: 'destructive', title: 'Escribe el tratamiento.' });
      return;
    }

    setSaving(true);
    try {
      // Lookup organization_id + clinic_id del paciente
      const { data: pat, error: patErr } = await supabase
        .from('patients')
        .select('organization_id')
        .eq('id', patientId)
        .single();
      if (patErr || !pat?.organization_id) {
        throw new Error('No se pudo determinar la organización del paciente');
      }

      // Necesitamos clinic_id. Tomamos la primera clinic del dentista en esa org.
      // En la práctica, el dentista típicamente atiende en una sola clínica de
      // la org; si tiene varias, tomamos la más antigua.
      const { data: clinic } = await supabase
        .from('clinics')
        .select('id')
        .eq('organization_id', pat.organization_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!clinic?.id) {
        throw new Error('No se encontró la clínica para crear el presupuesto');
      }

      const { item, budget, wasNewBudget } = await createBudgetItemFromOdontogram({
        patientId,
        therapistId: user.id,
        clinicId: clinic.id,
        patientFullName,
        tooth: tooth.trim() || null,
        treatment: treatment.trim(),
      });

      // Override del precio si el dentista lo editó manualmente
      const overridePrice = parseInt(price, 10);
      if (overridePrice > 0 && overridePrice !== Number(item.unit_price)) {
        const { error: upErr } = await supabase
          .from('treatment_budget_items')
          .update({
            unit_price: overridePrice,
            subtotal: overridePrice * (item.quantity || 1),
          })
          .eq('id', item.id);
        if (upErr) {
          toast({
            variant: 'destructive',
            title: 'El item se agregó pero no se pudo actualizar el precio',
            description: upErr.message,
          });
        }
      }

      toast({
        title: '✓ Item agregado al presupuesto',
        description: `${item.description} — ${formatCurrency(
          overridePrice > 0 ? overridePrice : Number(item.unit_price)
        )}${wasNewBudget ? ' (presupuesto nuevo)' : ''}`,
      });

      onItemAdded?.({ item, budget });
      handleClose();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo agregar el item',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar tratamiento al presupuesto</DialogTitle>
          <DialogDescription>
            Quedará pendiente hasta que lo marqués completado en la sesión.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm font-medium">Diente (opcional)</Label>
            <Input
              list="odontogram-teeth"
              value={tooth}
              onChange={(e) => setTooth(e.target.value)}
              placeholder="Ej: 36"
              className="mt-1"
            />
            <datalist id="odontogram-teeth">
              {toothNumbers.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <p className="text-xs text-gray-500 mt-1">
              Dejá vacío si es general (ej. limpieza completa).
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium">Tratamiento *</Label>
            <Input
              list="common-treatments"
              value={treatment}
              onChange={(e) => {
                setTreatment(e.target.value);
                setPriceAutoFilled(false);
              }}
              onBlur={handleTreatmentBlur}
              placeholder="Ej: Endodoncia"
              className="mt-1"
            />
            <datalist id="common-treatments">
              {COMMON_TREATMENTS.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Precio (CLP){' '}
              {priceAutoFilled && (
                <span className="text-xs text-teal-600 font-normal">
                  · autocompletado del catálogo
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setPriceAutoFilled(false);
              }}
              placeholder="80000"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si dejás $0, lo podrás editar después desde el presupuesto.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !treatment.trim()}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Agregar al presupuesto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddBudgetItemModal;
