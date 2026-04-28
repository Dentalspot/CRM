import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useDataAccessLog } from '../hooks/useDataAccessLog';

const TABLE_LABELS = {
  patients: 'Ficha del paciente',
  treatment_budgets: 'Presupuesto',
  treatment_budget_items: 'Item de presupuesto',
  patient_payments: 'Pago',
  profiles: 'Perfil',
};

const ACTION_LABELS = {
  insert: 'Creó',
  update: 'Modificó',
  delete: 'Eliminó',
  delete_account: 'Eliminó cuenta',
};

const ROLE_LABELS = {
  therapist: 'Dentista',
  patient: 'Paciente',
  assistant: 'Asistente',
  clinic: 'Clínica',
  admin: 'Admin',
  superadmin: 'Admin',
  system: 'Sistema',
};

/**
 * Card con el log de accesos/modificaciones a los datos del paciente.
 * Solo aplica a rol patient.
 */
const DataAccessLogCard = () => {
  const { entries, loading } = useDataAccessLog(20, true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">¿Quién accedió a mis datos?</CardTitle>
            <CardDescription>
              Registro de las últimas modificaciones realizadas a tu información clínica y financiera.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Aún no hay registros de acceso a tus datos.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {entries.map((e, i) => (
              <div key={`${e.occurred_at}-${i}`} className="border rounded-md p-2.5 text-sm bg-muted/20">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {ACTION_LABELS[e.action] || e.action}{' '}
                    <span className="text-muted-foreground">
                      {TABLE_LABELS[e.table_name] || e.table_name}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(e.occurred_at), 'dd MMM yyyy HH:mm', { locale: es })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {e.actor_name} <span className="opacity-60">({ROLE_LABELS[e.actor_role] || e.actor_role})</span>
                </p>
                {e.changed_fields?.length > 0 && (
                  <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                    Campos: {e.changed_fields.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataAccessLogCard;
