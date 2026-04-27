import React from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { useBudgets } from '../hooks/useBudgets';
import PatientBudgetCard from './PatientBudgetCard';

/**
 * Bloque del dashboard del paciente con sus presupuestos y pagos.
 * Solo muestra estados visibles: enviado, aceptado, en_progreso, pagado.
 * Si no tiene presupuestos visibles, no renderiza nada.
 */
const VISIBLE_STATUSES = ['enviado', 'aceptado', 'en_progreso', 'pagado'];

const PatientBudgetsBlock = ({ patientId }) => {
  const { budgets, loading, refresh } = useBudgets(patientId);

  const visible = budgets.filter(b => VISIBLE_STATUSES.includes(b.status));

  // Si está cargando inicialmente, mostrar skeleton mínimo
  if (loading && budgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-5 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sin presupuestos visibles → no mostrar la sección
  if (visible.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Mis presupuestos y pagos</h2>
      </div>

      <div className="space-y-3">
        {visible.map((budget) => (
          <PatientBudgetCard
            key={budget.budget_id}
            budget={budget}
            onChanged={refresh}
          />
        ))}
      </div>
    </div>
  );
};

export default PatientBudgetsBlock;
