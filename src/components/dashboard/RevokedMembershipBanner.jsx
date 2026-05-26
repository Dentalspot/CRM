import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/utils/logger';

/**
 * @file src/components/dashboard/RevokedMembershipBanner.jsx
 *
 * Muestra un banner informativo cuando el usuario logueado tiene una
 * membresía revocada recientemente (≤ 30 días) en alguna organización.
 *
 * Caso de uso: un asistente o clinic_admin pierde acceso a una clínica
 * (admin clic en "Revocar acceso" → organization_members.is_active=false +
 * deactivated_at=NOW()). El usuario igual puede loguear, pero antes
 * aterrizaba en "Selecciona una organización" sin entender qué pasó.
 *
 * Ahora ve un banner amarillo con:
 *  - "Tu acceso como [asistente|admin] a [Clínica X] fue revocado el [fecha]"
 *  - "Si crees que es un error, contactá a la clínica"
 *  - Botón X para descartar (sessionStorage — vuelve a aparecer en próximo login)
 *
 * Es dismissible por sesión, no spammea. Si tiene múltiples revocaciones
 * recientes, mostramos la más reciente.
 *
 * Importante: NO bloquea el flow normal (el user sigue pudiendo usar la
 * app como paciente si tiene ese rol). Solo informa.
 */

const RECENT_THRESHOLD_DAYS = 30;
const STORAGE_KEY_PREFIX = 'dentalspot_revoked_banner_dismissed:';

const roleLabel = (role) => {
  switch (role) {
    case 'assistant': return 'asistente';
    case 'clinic_admin': return 'administrador';
    case 'dentist': return 'dentista';
    case 'lab': return 'laboratorio';
    default: return role;
  }
};

const RevokedMembershipBanner = () => {
  const { user } = useAuth();
  const [revoked, setRevoked] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Check dismiss state primero
    try {
      const key = `${STORAGE_KEY_PREFIX}${user.id}`;
      if (sessionStorage.getItem(key) === '1') {
        setDismissed(true);
        return;
      }
    } catch { /* private mode */ }

    const load = async () => {
      const threshold = new Date(Date.now() - RECENT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          role,
          deactivated_at,
          organizations:organization_id (name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', false)
        .gte('deactivated_at', threshold)
        .order('deactivated_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.warn('[RevokedMembershipBanner] query error:', error.message);
        return;
      }
      if (data && data.length > 0) {
        setRevoked(data[0]);
      }
    };

    load();
  }, [user?.id]);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${user?.id}`, '1');
    } catch { /* private mode: degrada a in-memory */ }
  };

  if (!revoked || dismissed) return null;

  const clinicName = revoked.organizations?.name || 'la clínica';
  const dateLabel = revoked.deactivated_at
    ? format(new Date(revoked.deactivated_at), "d 'de' MMMM yyyy", { locale: es })
    : 'recientemente';

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm text-amber-900">
          <p className="font-semibold mb-0.5">
            Tu acceso como {roleLabel(revoked.role)} a {clinicName} fue revocado el {dateLabel}.
          </p>
          <p className="text-amber-800">
            Si crees que es un error, contacta a la clínica directamente. Mientras tanto, puedes seguir
            usando DentalSpot con tu cuenta personal.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-amber-700 hover:text-amber-900 transition-colors flex-shrink-0"
          aria-label="Descartar aviso"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default RevokedMembershipBanner;
