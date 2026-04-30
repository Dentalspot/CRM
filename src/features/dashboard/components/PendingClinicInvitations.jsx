import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2, X, Loader2, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

import { useClinicInvitations } from '../hooks/useClinicInvitations';

/**
 * Card en dashboard de dentista con invitaciones de clínicas pendientes.
 * Si no hay pendientes → no renderiza nada (silencioso).
 */
const PendingClinicInvitations = () => {
  const { invitations, processing, accept, reject } = useClinicInvitations();
  const { toast } = useToast();

  if (invitations.length === 0) return null;

  const handleAccept = async (id, clinicName) => {
    const r = await accept(id);
    if (r.ok) {
      toast({
        title: '¡Bienvenido al equipo!',
        description: `Te uniste a ${clinicName}.`,
      });
      // Pequeño delay y refresh para que OrganizationSelector recargue contexto
      setTimeout(() => window.location.reload(), 800);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: r.error?.message });
    }
  };

  const handleReject = async (id, clinicName) => {
    if (!window.confirm(`¿Rechazar la invitación de ${clinicName}?`)) return;
    const r = await reject(id);
    if (r.ok) {
      toast({ title: 'Invitación rechazada' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: r.error?.message });
    }
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/15 p-1.5">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">
            {invitations.length === 1
              ? 'Tienes una invitación pendiente'
              : `Tienes ${invitations.length} invitaciones pendientes`}
          </h3>
        </div>

        <div className="space-y-2">
          {invitations.map((inv) => {
            const isProcessing = processing === inv.id;
            const clinicName = inv.clinics?.name || 'Una clínica';
            return (
              <div
                key={inv.id}
                className="bg-white border rounded-lg p-3 flex flex-wrap items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{clinicName}</p>
                  {inv.clinics?.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{inv.clinics.address}</span>
                    </p>
                  )}
                  {inv.inviter?.full_name && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Invitado por <strong>{inv.inviter.full_name}</strong>
                    </p>
                  )}
                  {inv.message && (
                    <p className="text-xs italic text-muted-foreground mt-1 border-l-2 border-muted pl-2">
                      "{inv.message}"
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {format(new Date(inv.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(inv.id, clinicName)}
                    disabled={isProcessing}
                    className="text-destructive"
                  >
                    {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(inv.id, clinicName)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Aceptar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PendingClinicInvitations;
