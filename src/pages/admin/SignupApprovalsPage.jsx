/**
 * @file src/pages/admin/SignupApprovalsPage.jsx
 *
 * Página admin para revisar y aprobar/rechazar signups pro pendientes.
 * Gate de seguridad pre-launch: cada signup de role 'therapist' o 'clinic'
 * queda en approval_status='pending' (vía trigger DB) y solo un admin con
 * permiso module='all' AND can_write=true puede aprobar/rechazar.
 *
 * Compliance Ley 21.719: verificación humana antes de acceso a PHI.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Mail,
  Phone,
  IdCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';

const SignupApprovalsPage = () => {
  const { toast } = useToast();
  const [pendings, setPendings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // user_id while approving/rejecting
  const [rejectModal, setRejectModal] = useState({ open: false, user: null, reason: '' });

  const fetchPendings = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, rut, phone, created_at, approval_status')
        .eq('approval_status', 'pending')
        .in('role', ['therapist', 'clinic'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendings(data || []);
    } catch (err) {
      logger.error('[SignupApprovalsPage] fetch error:', err);
      toast({
        variant: 'destructive',
        title: 'Error al cargar pendings',
        description: err.message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPendings();
  }, [fetchPendings]);

  const sendApprovalEmail = async (user) => {
    try {
      await supabase.functions.invoke('send-signup-approval', {
        body: {
          email: user.email,
          full_name: user.full_name || user.email,
          role: user.role,
        },
      });
    } catch (err) {
      // No bloqueante — el approve ya se hizo en DB. El email es notificación.
      logger.warn('[SignupApprovalsPage] approval email failed (non-blocking):', err?.message);
    }
  };

  const handleApprove = async (user) => {
    setActionLoading(user.id);
    try {
      const { error } = await supabase.rpc('approve_signup', { p_user_id: user.id });
      if (error) throw error;

      // Fire-and-forget email
      sendApprovalEmail(user);

      toast({
        title: 'Cuenta aprobada',
        description: `${user.full_name || user.email} ahora puede ingresar.`,
      });
      await fetchPendings();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error al aprobar',
        description: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenReject = (user) => {
    setRejectModal({ open: true, user, reason: '' });
  };

  const handleConfirmReject = async () => {
    const { user, reason } = rejectModal;
    if (!user) return;

    setActionLoading(user.id);
    try {
      const { error } = await supabase.rpc('reject_signup', {
        p_user_id: user.id,
        p_reason: reason?.trim() || null,
      });
      if (error) throw error;

      toast({
        title: 'Solicitud rechazada',
        description: `${user.full_name || user.email} fue notificado.`,
      });
      setRejectModal({ open: false, user: null, reason: '' });
      await fetchPendings();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error al rechazar',
        description: err.message,
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Aprobaciones de Signup | Admin DentalSpot</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-teal-600" />
              Aprobaciones de Signup
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Revisá y aprobá las solicitudes de registro de profesionales antes de que accedan al sistema.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPendings} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {pendings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Sin solicitudes pendientes
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cuando un dentista o clínica se registre, aparecerá acá para tu revisión.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-700" />
                <span className="text-sm text-amber-900">
                  <strong>{pendings.length}</strong> {pendings.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'} de revisión.
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendings.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{u.full_name || '(Sin nombre)'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> {u.email}
                        </div>
                        {u.phone && (
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3" /> {u.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.rut ? (
                          <div className="text-sm text-gray-700 flex items-center gap-1.5">
                            <IdCard className="h-3.5 w-3.5" /> {u.rut}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-700">Sin RUT</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {u.role === 'therapist' ? 'Dentista' : 'Clínica'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(u.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReject(u)}
                            disabled={actionLoading === u.id}
                            className="text-red-700 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(u)}
                            disabled={actionLoading === u.id}
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Aprobar
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject confirmation modal */}
      <Dialog
        open={rejectModal.open}
        onOpenChange={(open) => !open && setRejectModal({ open: false, user: null, reason: '' })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              Esta acción notifica al usuario que su solicitud no fue aprobada. La razón se incluye en su pantalla de espera.
            </DialogDescription>
          </DialogHeader>

          {rejectModal.user && (
            <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-0.5">
              <div className="font-medium text-gray-900">{rejectModal.user.full_name}</div>
              <div className="text-gray-600">{rejectModal.user.email}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Razón (opcional, visible para el usuario)
            </label>
            <Textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Ej: No pudimos verificar tu título profesional con los datos provistos."
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectModal({ open: false, user: null, reason: '' })}
              disabled={actionLoading === rejectModal.user?.id}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={actionLoading === rejectModal.user?.id}
            >
              {actionLoading === rejectModal.user?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Rechazar solicitud'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignupApprovalsPage;
