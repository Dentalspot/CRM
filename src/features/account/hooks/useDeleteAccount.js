import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook para self-delete de cuenta con re-prompt de password.
 *
 * Flujo:
 *   1. Re-verifica password vía signInWithPassword (sesión activa requerida)
 *   2. Llama RPC request_account_deletion (anonimiza datos)
 *   3. Dispara email de confirmación (fire-and-forget)
 *   4. Hace signOut
 *
 * Devuelve { ok, error } al caller para manejar UI.
 */
export const useDeleteAccount = () => {
  const [submitting, setSubmitting] = useState(false);

  const deleteAccount = async ({ password }) => {
    if (!password) {
      return { ok: false, error: new Error('Password requerido') };
    }
    setSubmitting(true);

    try {
      // 1) Obtener sesión actual y email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Sesión no válida. Vuelve a iniciar sesión.');
      }

      // 2) Re-verificar password (intento de signIn con email actual)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (signInErr) {
        throw new Error('La contraseña es incorrecta.');
      }

      // 3) Ejecutar RPC de eliminación (anonimiza profiles + patients + branding)
      const { data, error: rpcErr } = await supabase.rpc('request_account_deletion');
      if (rpcErr) throw rpcErr;

      // 4) Liberar el email en auth.users (permite re-registro futuro con mismo email)
      try {
        await supabase.functions.invoke('release-account-email', { body: {} });
      } catch (releaseErr) {
        // Non-blocking: si falla, la cuenta queda anonimizada igual pero el email
        // queda ocupado en auth.users hasta resolución manual.
        logger.warn('[useDeleteAccount] release-email failed (non-blocking):', releaseErr.message);
      }

      // 5) Disparar email de confirmación (fire-and-forget)
      try {
        await supabase.functions.invoke('send-account-deletion-email', {
          body: {
            email: data?.email || user.email,
            full_name: data?.full_name || 'Usuario',
          },
        });
      } catch (emailErr) {
        logger.warn('[useDeleteAccount] email failed (non-blocking):', emailErr.message);
      }

      // 6) Logout y redirección
      await supabase.auth.signOut();

      return { ok: true };
    } catch (err) {
      logger.error('[useDeleteAccount] error:', err);
      return { ok: false, error: err };
    } finally {
      setSubmitting(false);
    }
  };

  return { deleteAccount, submitting };
};
