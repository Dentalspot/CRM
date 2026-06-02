import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/calendar/BoxSelector.jsx
 *
 * Selector de box para asignar a una cita. Carga los boxes activos de
 * la clinic seleccionada, ordenados por nombre.
 *
 * Props:
 *  - clinicId: string | null — si null, no se muestra el selector
 *  - value: string | null — box_id actual
 *  - onChange(boxId): callback. Pasa null si el user elige "Sin box específico"
 *  - disabled: boolean
 *  - label: string (default "Box")
 *
 * Comportamiento:
 *  - Si la clinic NO tiene boxes activos → muestra texto informativo "Sin boxes"
 *    y no renderiza dropdown (no es required)
 *  - Si tiene boxes → dropdown con "Sin box específico" + lista
 *  - Loading state mientras fetcha
 */

const NO_BOX_VALUE = '__none__';

const BOX_TYPE_LABELS = {
  general: 'General',
  ortodoncia: 'Ortodoncia',
  cirugia: 'Cirugía',
  radiologia: 'Radiología',
  otro: 'Otro',
};

const BoxSelector = ({ clinicId, value, onChange, disabled = false, label = 'Box', required = false }) => {
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clinicId) {
      setBoxes([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('clinic_boxes')
          .select('id, name, box_type')
          .eq('clinic_id', clinicId)
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        if (!cancelled) setBoxes(data || []);
      } catch (err) {
        logger.warn('[BoxSelector] fetch error:', err.message);
        if (!cancelled) setBoxes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  // Sin clinic seleccionada → no renderizar nada
  if (!clinicId) return null;

  // Loading → placeholder mínimo
  if (loading) {
    return (
      <div className="space-y-1">
        <Label className="text-sm">{label}</Label>
        <div className="h-9 rounded-md bg-muted/40 animate-pulse" />
      </div>
    );
  }

  // Sin boxes → informativo, no required
  if (boxes.length === 0) {
    return (
      <div className="space-y-1">
        <Label className="text-sm flex items-center gap-1 text-muted-foreground">
          <Settings className="h-3 w-3" /> {label}
        </Label>
        <p className="text-xs text-muted-foreground italic">
          Esta clínica todavía no tiene boxes configurados. Puedes agregarlos desde Gestión de Clínicas.
        </p>
      </div>
    );
  }

  // Si required y no hay valor → marcar como vacío para que el placeholder se vea destacado.
  // Si no required → fallback a NO_BOX_VALUE para mantener la opción "Sin box específico".
  const selectValue = value || (required ? '' : NO_BOX_VALUE);

  return (
    <div className="space-y-1">
      <Label className="text-sm flex items-center gap-1">
        <Settings className="h-3 w-3" /> {label}{required && ' *'}
      </Label>
      <Select
        value={selectValue}
        onValueChange={(v) => onChange(v === NO_BOX_VALUE ? null : v)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={required ? 'Seleccionar box' : 'Sin box específico'} />
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value={NO_BOX_VALUE}>
              <span className="text-muted-foreground italic">Sin box específico</span>
            </SelectItem>
          )}
          {boxes.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
              <span className="text-xs text-muted-foreground ml-1">
                · {BOX_TYPE_LABELS[b.box_type] || b.box_type}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BoxSelector;
