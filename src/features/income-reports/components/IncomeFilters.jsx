import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAYMENT_METHODS = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
];

const fmtISO = (d) => d.toISOString().slice(0, 10);

const presets = {
  today: () => {
    const t = fmtISO(new Date());
    return { dateFrom: t, dateTo: t };
  },
  last7: () => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    return { dateFrom: fmtISO(from), dateTo: fmtISO(to) };
  },
  thisMonth: () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: fmtISO(from), dateTo: fmtISO(now) };
  },
  thisYear: () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), 0, 1);
    return { dateFrom: fmtISO(from), dateTo: fmtISO(now) };
  },
};

const IncomeFilters = ({ filters, setFilters, therapists = [], showTherapistFilter = false }) => {
  const applyPreset = (preset) => {
    const range = presets[preset]();
    setFilters({ ...filters, ...range });
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => applyPreset('today')}>Hoy</Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('last7')}>Últimos 7d</Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('thisMonth')}>Este mes</Button>
          <Button size="sm" variant="outline" onClick={() => applyPreset('thisYear')}>Este año</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label htmlFor="date-from" className="text-xs">Desde</Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value || null })}
              className="h-9"
            />
          </div>
          <div>
            <Label htmlFor="date-to" className="text-xs">Hasta</Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value || null })}
              className="h-9"
            />
          </div>

          <div>
            <Label htmlFor="method" className="text-xs">Método</Label>
            <Select
              value={filters.method || 'all'}
              onValueChange={(v) => setFilters({ ...filters, method: v === 'all' ? null : v })}
            >
              <SelectTrigger id="method" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showTherapistFilter && (
            <div>
              <Label htmlFor="therapist" className="text-xs">Dentista</Label>
              <Select
                value={filters.therapistId || 'all'}
                onValueChange={(v) => setFilters({ ...filters, therapistId: v === 'all' ? null : v })}
              >
                <SelectTrigger id="therapist" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los dentistas</SelectItem>
                  {therapists.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeFilters;
