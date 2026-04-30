import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';

/**
 * Hook que carga invitaciones de clínica pendientes para el usuario actual
 * (matching por email del profile). Permite aceptar/rechazar via la edge
 * function `clinic-invitations` (misma usada por InviteAcceptPage).
 */
export const useClinicInvitations = () => {
  const { user, profile } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(null); // id en proceso

  const userEmail = profile?.email || user?.email;

  const fetchInvitations = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      // 1) Cargar invitaciones pendientes
      const { data: invs, error } = await supabase
        .from('clinic_invitations')
        .select('id, token, email, message, status, created_at, clinic_id, invited_by')
        .eq('status', 'pending')
        .ilike('email', userEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2) Cargar datos de las clínicas + invitadores en queries separadas
      const list = invs || [];
      const clinicIds = [...new Set(list.map(i => i.clinic_id).filter(Boolean))];
      const inviterIds = [...new Set(list.map(i => i.invited_by).filter(Boolean))];

      const [clinicsRes, invitersRes] = await Promise.all([
        clinicIds.length > 0
          ? supabase.from('clinics').select('id, name, address').in('id', clinicIds)
          : Promise.resolve({ data: [] }),
        inviterIds.length > 0
          ? supabase.from('profiles').select('id, full_name').in('id', inviterIds)
          : Promise.resolve({ data: [] }),
      ]);
      const clinicsById = (clinicsRes.data || []).reduce((a, c) => { a[c.id] = c; return a; }, {});
      const invitersById = (invitersRes.data || []).reduce((a, p) => { a[p.id] = p; return a; }, {});

      const data = list.map(inv => ({
        ...inv,
        clinics: clinicsById[inv.clinic_id] || null,
        inviter: invitersById[inv.invited_by] || null,
      }));

      setInvitations(data || []);
    } catch (err) {
      logger.warn('[useClinicInvitations] fetch error:', err.message);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => { fetchInvitations(); }, [fetchInvitations]);

  const respondToInvitation = useCallback(async (invitationId, action) => {
    const inv = invitations.find(i => i.id === invitationId);
    if (!inv) return { ok: false, error: new Error('Invitación no encontrada') };

    setProcessing(invitationId);
    try {
      const { data, error } = await supabase.functions.invoke('clinic-invitations', {
        body: { action, token: inv.token },
      });
      if (error || !data?.success) {
        throw new Error(data?.message || error?.message || 'Error al procesar');
      }
      // Optimistic remove de la lista
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      return { ok: true, data };
    } catch (err) {
      logger.error('[useClinicInvitations] respond error:', err);
      return { ok: false, error: err };
    } finally {
      setProcessing(null);
    }
  }, [invitations]);

  return {
    invitations,
    loading,
    processing,
    refresh: fetchInvitations,
    accept: (id) => respondToInvitation(id, 'accept'),
    reject: (id) => respondToInvitation(id, 'reject'),
  };
};
