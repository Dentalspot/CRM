/**
 * @file src/pages/StatusPage.jsx
 *
 * Página pública de status del sistema. Permite a usuarios verificar
 * rápidamente si "es DentalSpot o es mi internet" cuando algo no carga.
 *
 * Hace 3 health checks ligeros:
 *   1. App build cargado (true por definición — si esta página renderiza, el app vive).
 *   2. Supabase REST reachable (HEAD a /rest/v1/).
 *   3. Supabase Auth reachable (HEAD a /auth/v1/health).
 *
 * No requiere login. Pública en /status.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const checkSupabaseRest = async () => {
  const start = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: ANON_KEY },
    });
    return { ok: res.ok || res.status === 404, ms: Date.now() - start, status: res.status };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: err.message };
  }
};

const checkSupabaseAuth = async () => {
  const start = Date.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: ANON_KEY },
    });
    return { ok: res.ok, ms: Date.now() - start, status: res.status };
  } catch (err) {
    return { ok: false, ms: Date.now() - start, error: err.message };
  }
};

const StatusRow = ({ label, state }) => {
  if (!state) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-gray-100">
        <span className="text-sm">{label}</span>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2 text-sm">
        {state.ok ? (
          <>
            <span className="text-xs text-muted-foreground tabular-nums">{state.ms}ms</span>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">Operativo</span>
          </>
        ) : (
          <>
            {state.status && <span className="text-xs text-muted-foreground tabular-nums">HTTP {state.status}</span>}
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-700 font-medium">Caído</span>
          </>
        )}
      </span>
    </div>
  );
};

const StatusPage = () => {
  const [rest, setRest] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);

  const runChecks = async () => {
    setLoading(true);
    setRest(null);
    setAuth(null);
    const [r, a] = await Promise.all([checkSupabaseRest(), checkSupabaseAuth()]);
    setRest(r);
    setAuth(a);
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => { runChecks(); }, []);

  const allOk = rest?.ok && auth?.ok;

  return (
    <>
      <Helmet>
        <title>Status del sistema | DentalSpot</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border p-6 sm:p-8">
          <div className="flex items-center justify-center mb-6">
            <Logo />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-center mb-1">Status del sistema</h1>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center mb-6">Verificando servicios...</p>
          ) : (
            <p className={`text-sm text-center mb-6 font-semibold ${allOk ? 'text-green-700' : 'text-red-700'}`}>
              {allOk ? 'Todos los servicios operativos' : 'Hay un servicio con problemas'}
            </p>
          )}

          <div className="space-y-0">
            <StatusRow label="Aplicación web" state={{ ok: true, ms: 0 }} />
            <StatusRow label="Base de datos (Supabase REST)" state={rest} />
            <StatusRow label="Autenticación (Supabase Auth)" state={auth} />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {lastCheck ? `Última verificación: ${lastCheck.toLocaleTimeString('es-CL')}` : ''}
            </span>
            <Button variant="outline" size="sm" onClick={runChecks} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Verificar de nuevo
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-muted-foreground">
              ¿Sigue con problemas? Escribinos a{' '}
              <a href="mailto:dentalspot.cl@gmail.com" className="text-primary underline">
                dentalspot.cl@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatusPage;
