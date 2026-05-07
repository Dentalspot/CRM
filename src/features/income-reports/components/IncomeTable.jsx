import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta_debito: 'T. Débito',
  tarjeta_credito: 'T. Crédito',
};

const STATUS_LABELS = {
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  aceptado: { label: 'Aceptado', color: 'bg-emerald-100 text-emerald-700' },
  en_progreso: { label: 'En progreso', color: 'bg-amber-100 text-amber-800' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
};

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

/**
 * Tabla de pagos con columnas adaptadas según rol.
 * @param {string} role - 'therapist' | 'clinic' | 'assistant'
 */
const IncomeTable = ({ rows, loading, role }) => {
  const isClinic = role === 'clinic' || role === 'assistant';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">No hay pagos en el período seleccionado.</p>
      </div>
    );
  }

  // Totales del filtro aplicado
  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + Number(r.amount || 0),
      commission: acc.commission + Number(r.commission_amount || 0),
      net: acc.net + Number(r.net_amount || 0),
    }),
    { gross: 0, commission: 0, net: 0 }
  );

  return (
    <>
      {/* MOBILE — cards apilados (la tabla horizontal se rompe <md). */}
      <div className="md:hidden space-y-3">
        {rows.map((r) => {
          const statusInfo = STATUS_LABELS[r.budget_status] || STATUS_LABELS.enviado;
          const mainAmount = isClinic ? r.commission_amount : r.net_amount;
          const mainLabel = isClinic ? 'Comisión' : 'Neto';
          return (
            <div key={r.payment_id} className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
              {/* Header: paciente + estado */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.patient_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(r.payment_date), 'dd MMM yyyy', { locale: es })}
                    {r.clinic_name && r.clinic_name !== 'Sin clínica' && (
                      <> · <span className="truncate">{r.clinic_name}</span></>
                    )}
                  </p>
                </div>
                <Badge className={`${statusInfo.color} text-[10px] shrink-0`}>{statusInfo.label}</Badge>
              </div>

              {/* Montos: bruto + neto/comisión + comisión% */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Bruto</p>
                  <p className="text-sm font-mono font-semibold">${formatCLP(r.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{mainLabel}</p>
                  <p className="text-sm font-mono font-semibold text-emerald-700">${formatCLP(mainAmount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Comisión</p>
                  <p className="text-sm font-mono font-semibold text-muted-foreground">{Number(r.commission_percent).toFixed(0)}%</p>
                </div>
              </div>

              {/* Footer: método + presupuesto */}
              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>{METHOD_LABELS[r.payment_method] || r.payment_method}</span>
                {r.budget_number && <span className="truncate">#{r.budget_number}</span>}
              </div>
            </div>
          );
        })}

        {/* Total mobile */}
        <div className="rounded-xl bg-muted/40 p-4 font-semibold">
          <div className="flex items-center justify-between text-sm">
            <span>Total bruto</span>
            <span className="font-mono">${formatCLP(totals.gross)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-emerald-700 mt-1">
            <span>{isClinic ? 'Total comisión' : 'Total neto'}</span>
            <span className="font-mono">${formatCLP(isClinic ? totals.commission : totals.net)}</span>
          </div>
        </div>
      </div>

      {/* DESKTOP — tabla clásica. */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Clínica</TableHead>
            <TableHead>Presupuesto</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-right">Bruto</TableHead>
            <TableHead className="text-right">Comisión %</TableHead>
            {isClinic ? (
              <TableHead className="text-right">Comisión $</TableHead>
            ) : (
              <TableHead className="text-right">Neto</TableHead>
            )}
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const statusInfo = STATUS_LABELS[r.budget_status] || STATUS_LABELS.enviado;
            return (
              <TableRow key={r.payment_id}>
                <TableCell className="text-xs">
                  {format(new Date(r.payment_date), 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell className="text-sm">{r.patient_name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.clinic_name || 'Sin clínica'}
                </TableCell>
                <TableCell className="text-sm">
                  {r.budget_number ? `#${r.budget_number}` : '—'}{' '}
                  <span className="text-muted-foreground text-xs truncate">{r.budget_title}</span>
                </TableCell>
                <TableCell className="text-xs">
                  {METHOD_LABELS[r.payment_method] || r.payment_method}
                </TableCell>
                <TableCell className="text-right font-mono">${formatCLP(r.amount)}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {Number(r.commission_percent).toFixed(0)}%
                </TableCell>
                {isClinic ? (
                  <TableCell className="text-right font-mono text-emerald-700">
                    ${formatCLP(r.commission_amount)}
                  </TableCell>
                ) : (
                  <TableCell className="text-right font-mono text-emerald-700">
                    ${formatCLP(r.net_amount)}
                  </TableCell>
                )}
                <TableCell>
                  <Badge className={`${statusInfo.color} text-xs`}>{statusInfo.label}</Badge>
                </TableCell>
              </TableRow>
            );
          })}

          {/* Totales (colSpan ajustado: 5 cols antes de "Bruto" — fecha,
              paciente, clínica, presupuesto, método). */}
          <TableRow className="bg-muted/30 font-semibold">
            <TableCell colSpan={5} className="text-right">Totales:</TableCell>
            <TableCell className="text-right font-mono">${formatCLP(totals.gross)}</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right font-mono text-emerald-700">
              ${formatCLP(isClinic ? totals.commission : totals.net)}
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>
    </>
  );
};

export default IncomeTable;
