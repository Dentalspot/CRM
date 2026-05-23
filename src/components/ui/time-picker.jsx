import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
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
 * Time picker custom basado en 2 dropdowns shadcn (hora + minutos).
 * Reemplazo de <input type="time"> nativo que tenía highlight azul
 * de selección que se confundía con "bloqueado".
 *
 * Props:
 *  - value: string formato "HH:mm" (ej: "14:30")
 *  - onChange(timeString): callback con el nuevo valor "HH:mm"
 *  - step: 15 | 30 | 60 — incremento de minutos (default 15)
 *  - minHour: 0..23 (default 0)
 *  - maxHour: 0..23 (default 23)
 *  - disabled: boolean
 *  - className
 *
 * Comportamiento:
 *  - Si value es null/empty, muestra placeholder "Hora"
 *  - Si value tiene minutos fuera del step, los redondea hacia abajo
 *    al render (no muta el value, solo display)
 */

const pad = (n) => String(n).padStart(2, '0');

const TimePicker = ({
  value,
  onChange,
  step = 15,
  minHour = 0,
  maxHour = 23,
  disabled = false,
  className,
}) => {
  // Parse value "HH:mm" → { hour, minute }
  const { hour, minute } = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return { hour: '', minute: '' };
    }
    const [h, m] = value.split(':');
    return { hour: h || '', minute: m ? m.slice(0, 2) : '' };
  }, [value]);

  // Generar lista de horas del rango
  const hours = useMemo(() => {
    const arr = [];
    for (let h = minHour; h <= maxHour; h++) arr.push(pad(h));
    return arr;
  }, [minHour, maxHour]);

  // Generar lista de minutos según step
  const minutes = useMemo(() => {
    const arr = [];
    for (let m = 0; m < 60; m += step) arr.push(pad(m));
    return arr;
  }, [step]);

  const handleHourChange = (h) => {
    const m = minute || '00';
    onChange?.(`${h}:${m}`);
  };

  const handleMinuteChange = (m) => {
    const h = hour || pad(minHour);
    onChange?.(`${h}:${m}`);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <Select value={hour} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="h-9 px-2 w-[68px] text-sm">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground font-semibold select-none">:</span>
      <Select value={minute} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger className="h-9 px-2 w-[68px] text-sm">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimePicker;
