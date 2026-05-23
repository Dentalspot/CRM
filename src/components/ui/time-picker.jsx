import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * @file src/components/ui/time-picker.jsx
 *
 * Time picker basado en un único Select con slots pre-generados.
 * Reemplazo del input type="time" nativo (que tenía highlight azul
 * confuso de selección del segmento de minutos).
 *
 * Por default genera slots cada 30 minutos (alineado con el grid de
 * la agenda WeeklyAgendaView). Si se necesitan slots más finos, pasar
 * step=15.
 *
 * Props:
 *  - value: string formato "HH:mm" (ej: "14:30")
 *  - onChange(timeString): callback con el nuevo valor "HH:mm"
 *  - step: 15 | 30 | 60 — incremento de minutos (default 30)
 *  - minHour: 0..23 (default 0)
 *  - maxHour: 0..23 (default 23)
 *  - disabled: boolean
 *  - className
 *
 * Comportamiento:
 *  - Si value no coincide con un slot del step, se muestra igual
 *    (no se descarta) — útil cuando viene de DB con minutos arbitrarios
 */

const pad = (n) => String(n).padStart(2, '0');

const TimePicker = ({
  value,
  onChange,
  step = 30,
  minHour = 0,
  maxHour = 23,
  disabled = false,
  className,
}) => {
  // Generar todos los slots HH:mm posibles entre minHour y maxHour
  const slots = useMemo(() => {
    const arr = [];
    for (let h = minHour; h <= maxHour; h++) {
      for (let m = 0; m < 60; m += step) {
        arr.push(`${pad(h)}:${pad(m)}`);
      }
    }
    return arr;
  }, [step, minHour, maxHour]);

  // Si el value actual no coincide con un slot del step (ej. viene de DB
  // con minutos arbitrarios), lo incluimos al inicio para no perderlo.
  const slotsWithValue = useMemo(() => {
    if (!value || slots.includes(value)) return slots;
    return [value, ...slots];
  }, [slots, value]);

  return (
    <div className={cn(className)}>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-9 text-sm">
          <SelectValue placeholder="--:--" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {slotsWithValue.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimePicker;
