import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, XCircle, Mail, CalendarClock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import logger from '@/lib/utils/logger';
import { es } from 'date-fns/locale';

const ClinicInvitationsPanel = ({ clinicId }) => {
  const { toast } = useToast();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('clinic-invitations', {
        body: { action: 'list', clinic_id: clinicId }
      });

      if (error) throw error;
      if (data && data.success) {
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      logger.error("Error fetching invitations:", error);
      toast({
        variant: "destructive",
        title: "Error de carga",
        description: "No se pudieron cargar las invitaciones."
      });
    } finally {
      setLoading(false);
    }
  }, [clinicId, toast]);

  useEffect(() => {
    if (clinicId) {
      fetchInvitations();
    }
  }, [clinicId, fetchInvitations]);

  const handleCancel = async (invitationId) => {
    setActionLoading(invitationId);
    try {
      const { data, error } = await supabase.functions.invoke('clinic-invitations', {
        body: { action: 'cancel', invite_id: invitationId }
      });

      if (error || !data?.success) throw new Error("Failed to cancel");

      toast({ title: "Invitación cancelada" });
      fetchInvitations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cancelar la invitación"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      accepted: "bg-green-100 text-green-800 hover:bg-green-200",
      rejected: "bg-red-100 text-red-800 hover:bg-red-200",
      cancelled: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
    const labels = {
      pending: "Pendiente",
      accepted: "Aceptada",
      rejected: "Rechazada",
      cancelled: "Cancelada",
    };
    return (
      <Badge variant="outline" className={`${styles[status] || styles.pending} border-0`}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <Mail className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 font-medium">No hay invitaciones enviadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-500">Historial de Invitaciones</h3>
        <Button variant="ghost" size="sm" onClick={fetchInvitations} title="Recargar">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid gap-3">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="overflow-hidden">
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{invitation.email}</span>
                  {getStatusBadge(invitation.status)}
                </div>
                <div className="flex items-center text-xs text-gray-500 gap-3">
                  <span className="flex items-center">
                    <CalendarClock className="h-3 w-3 mr-1" />
                    Enviada: {format(new Date(invitation.created_at), "d MMM yyyy", { locale: es })}
                  </span>
                  {invitation.status === 'accepted' && invitation.accepted_at && (
                    <span className="text-green-600">
                      Aceptada: {format(new Date(invitation.accepted_at), "d MMM", { locale: es })}
                    </span>
                  )}
                </div>
              </div>

              {invitation.status === 'pending' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 w-full sm:w-auto"
                    onClick={() => handleCancel(invitation.id)}
                    disabled={actionLoading === invitation.id}
                  >
                    {actionLoading === invitation.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Ban className="h-3 w-3 mr-1" /> Cancelar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClinicInvitationsPanel;