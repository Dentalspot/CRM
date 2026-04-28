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
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Paciente</TableHead>
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

          {/* Totales */}
          <TableRow className="bg-muted/30 font-semibold">
            <TableCell colSpan={4} className="text-right">Totales:</TableCell>
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
  );
};

export default IncomeTable;
