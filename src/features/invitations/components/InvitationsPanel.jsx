
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Copy, 
  Check, 
  Users, 
  Loader2, 
  AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

// Helpers
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getInviteLink = (code) => {
  return `${window.location.origin}/auth/register?invite=${code}`;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function InvitationsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quota, setQuota] = useState({ used_this_month: 0, monthly_limit: 10 });
  const [invitations, setInvitations] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch or create quota
      let { data: quotaData, error: quotaError } = await supabase
        .from('therapist_invite_quotas')
        .select('*')
        .eq('therapist_id', user.id)
        .single();

      if (quotaError && quotaError.code === 'PGRST116') {
        // Not found, create default quota
        const { data: newQuota, error: insertError } = await supabase
          .from('therapist_invite_quotas')
          .insert({
            therapist_id: user.id,
            monthly_limit: 10,
            used_this_month: 0,
            last_reset_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        quotaData = newQuota;
      } else if (quotaError) {
        throw quotaError;
      }

      // Auto-reset monthly quota if last_reset_at is from a previous month
      if (quotaData) {
        const lastReset = new Date(quotaData.last_reset_at);
        const now = new Date();
        const isDifferentMonth = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();

        if (isDifferentMonth && quotaData.used_this_month > 0) {
          const { data: resetData } = await supabase
            .from('therapist_invite_quotas')
            .update({
              used_this_month: 0,
              last_reset_at: now.toISOString(),
            })
            .eq('therapist_id', user.id)
            .select()
            .single();

          if (resetData) quotaData = resetData;
        }
      }

      setQuota(quotaData);

      // 2. Fetch invitations with invitee profile data
      const { data: invData, error: invError } = await supabase
        .from('therapist_invitations')
        .select('*, invitee:invitee_id(full_name, email, role)')
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (invError) throw invError;
      setInvitations(invData || []);

    } catch (error) {
      logger.error('Error loading invitations:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar',
        description: 'No pudimos cargar tu panel de invitaciones.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (quota.used_this_month >= quota.monthly_limit) {
      toast({
        variant: 'destructive',
        title: 'Límite alcanzado',
        description: 'Has alcanzado tu límite de invitaciones de este mes.'
      });
      return;
    }

    try {
      setGenerating(true);
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

      // Insert invitation
      const { error: insertError } = await supabase
        .from('therapist_invitations')
        .insert({
          invite_code: code,
          inviter_id: user.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) throw insertError;

      // Update quota
      const { error: updateError } = await supabase
        .from('therapist_invite_quotas')
        .update({ used_this_month: quota.used_this_month + 1 })
        .eq('therapist_id', user.id);

      if (updateError) throw updateError;

      toast({
        title: '¡Invitación generada!',
        description: 'El enlace está listo para ser compartido.',
      });

      // Reload data to reflect changes
      await loadData();
      
      // Auto-copy the newly generated link
      copyToClipboard(code);

    } catch (error) {
      logger.error('Error generating invite:', error);
      toast({
        variant: 'destructive',
        title: 'Error al generar',
        description: 'Ocurrió un problema al crear la invitación.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (code) => {
    const link = getInviteLink(code);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      toast({
        title: '¡Enlace copiado!',
        description: 'El enlace de invitación ha sido copiado al portapapeles.',
      });
      setTimeout(() => {
        setCopiedCode(null);
      }, 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error al copiar',
        description: 'No se pudo copiar el enlace al portapapeles.',
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200">Aceptada</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Pendiente</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="text-gray-500">Expirada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const limitReached = quota.used_this_month >= quota.monthly_limit;
  const progressPercentage = (quota.used_this_month / quota.monthly_limit) * 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Resumen y Generador */}
      <Card className="border-teal-100 shadow-sm overflow-hidden">
        <div className="bg-teal-50/50 px-6 py-4 border-b border-teal-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-teal-100 p-2 rounded-lg">
              <Gift className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-teal-900">Programa de Referidos</CardTitle>
              <CardDescription className="text-teal-700/70">Invita a otros profesionales a unirse a DentalSpot</CardDescription>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            
            {/* Quota info */}
            <div className="w-full md:w-1/2 space-y-3">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-700">Invitaciones mensuales</span>
                <span className="text-sm font-bold text-teal-700">
                  {quota.used_this_month} / {quota.monthly_limit}
                </span>
              </div>
              
              <Progress value={progressPercentage} className="h-2.5 bg-gray-100 [&>div]:bg-teal-500" />
              
              {limitReached ? (
                <div className="flex items-start gap-2 text-amber-600 text-xs mt-2 bg-amber-50 p-2.5 rounded-md border border-amber-200">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Has agotado tus invitaciones por este mes. Tu cuota se renovará automáticamente el día 1 del próximo mes.</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Tu cuota se renueva el día 1 de cada mes.
                </p>
              )}
            </div>

            {/* Action */}
            <div className="w-full md:w-auto flex flex-col items-center">
              <Button 
                onClick={handleGenerateInvite} 
                disabled={generating || limitReached}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all w-full md:w-auto flex gap-2 h-12 px-6"
              >
                {generating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LinkIcon className="h-5 w-5" />
                )}
                <span>Generar Enlace Único</span>
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Historial de Invitaciones */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <CardTitle className="text-base text-gray-800">Tus Invitaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {invitations.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-500 flex flex-col items-center">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Gift className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-600">Aún no has generado invitaciones</p>
              <p className="text-sm mt-1">Comparte DentalSpot con tus colegas generando tu primer enlace arriba.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {invitations.map((invite) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={invite.id} 
                  className="p-4 md:px-6 hover:bg-gray-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm font-bold tracking-wider text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {invite.invite_code}
                      </span>
                      {getStatusBadge(invite.status)}
                    </div>

                    {/* Invitee info */}
                    {invite.status === 'accepted' && (invite.invitee || invite.invitee_email) ? (
                      <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-teal-600" />
                          <span className="text-sm font-medium text-teal-900">
                            {invite.invitee?.full_name || invite.invitee_email}
                          </span>
                        </div>
                        {invite.invitee?.email && (
                          <p className="text-xs text-teal-700 ml-5.5">{invite.invitee.email}</p>
                        )}
                        <div className="flex items-center gap-2 ml-5.5">
                          {invite.reward_credited ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">
                              $10.000 acreditados en billetera
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">
                              Pendiente: invitado debe completar perfil para acreditar $10.000
                            </Badge>
                          )}
                        </div>
                        {invite.accepted_at && (
                          <p className="text-[10px] text-teal-600 ml-5.5">Aceptada: {formatDate(invite.accepted_at)}</p>
                        )}
                      </div>
                    ) : invite.status === 'pending' ? (
                      <div className="text-xs text-gray-500 flex items-center gap-4">
                        <span>Creada: {formatDate(invite.created_at)}</span>
                        <span className="text-amber-600">Esperando que alguien use este código</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        <span>Creada: {formatDate(invite.created_at)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={copiedCode === invite.invite_code ? "default" : "outline"}
                      size="sm"
                      onClick={() => copyToClipboard(invite.invite_code)}
                      disabled={invite.status === 'accepted' || invite.status === 'expired'}
                      className={
                        copiedCode === invite.invite_code 
                          ? "bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto" 
                          : "text-gray-600 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 w-full sm:w-auto"
                      }
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copiedCode === invite.invite_code ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Copiado</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="copy"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            <span>Copiar Enlace</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
