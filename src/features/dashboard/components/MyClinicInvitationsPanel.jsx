import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

import PendingClinicInvitations from './PendingClinicInvitations';

/**
 * Panel completo del tab "Mis Invitaciones" en el perfil del dentista.
 * - Sección "Pendientes" reutiliza PendingClinicInvitations (con botones aceptar/rechazar)
 * - Sección "Histórico" muestra invitaciones aceptadas / rechazadas / canceladas
 */
const STATUS_LABELS = {
  accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Expirada', color: 'bg-amber-100 text-amber-700' },
};

const MyClinicInvitationsPanel = () => {
  const { user, profile } = useAuth();
  const userEmail = profile?.email || user?.email;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (!userEmail) return;
      setLoading(true);
      try {
        const { data: invs } = await supabase
          .from('clinic_invitations')
          .select('id, status, created_at, accepted_at, rejected_at, clinic_id, invited_by')
          .ilike('email', userEmail)
          .neq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(50);

        const list = invs || [];
        if (list.length === 0) { setHistory([]); return; }

        const clinicIds = [...new Set(list.map(i => i.clinic_id).filter(Boolean))];
        const { data: clinics } = await supabase
          .from('clinics')
          .select('id, name, address')
          .in('id', clinicIds);
        const clinicsById = (clinics || []).reduce((a, c) => { a[c.id] = c; return a; }, {});

        setHistory(list.map(i => ({ ...i, clinics: clinicsById[i.clinic_id] || null })));
      } catch (err) {
        logger.warn('[MyClinicInvitationsPanel] history error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [userEmail]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mis Invitaciones</h2>
        <p className="text-sm text-muted-foreground">
          Invitaciones recibidas de clínicas para que te unas a su equipo.
        </p>
      </div>

      {/* Pendientes — reusa el card del dashboard */}
      <PendingClinicInvitations />

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Histórico
          </CardTitle>
          <CardDescription>Invitaciones aceptadas, rechazadas o canceladas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic text-center py-6">
              No tienes invitaciones en el histórico.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((inv) => {
                const statusInfo = STATUS_LABELS[inv.status] || STATUS_LABELS.cancelled;
                return (
                  <div
                    key={inv.id}
                    className="border rounded-lg p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {inv.clinics?.name || 'Clínica'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(inv.accepted_at || inv.rejected_at || inv.created_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${statusInfo.color} text-xs shrink-0`}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyClinicInvitationsPanel;
