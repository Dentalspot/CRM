/**
 * @file src/pages/PendingApprovalPage.jsx
 *
 * Página fullscreen para usuarios profesionales (therapist/clinic) cuyo
 * signup aún no fue aprobado por un admin. RoleGuard los redirige acá
 * cuando profile.approval_status !== 'approved'.
 *
 * Estados visibles:
 *   - pending: "Tu cuenta está en revisión"
 *   - rejected: "Tu solicitud fue rechazada" + razón si existe
 *
 * Acciones disponibles:
 *   - Cerrar sesión (único camino fuera de esta página)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Clock, ShieldCheck, LogOut, XCircle, Mail } from 'lucide-react';

const PendingApprovalPage = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const status = profile?.approval_status || 'pending';
  const rejectionReason = profile?.approval_rejection_reason;
  const isRejected = status === 'rejected';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login', { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>{isRejected ? 'Cuenta no aprobada' : 'Cuenta en revisión'} | DentalSpot</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50 px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 sm:p-10">
          <div className="text-center">
            {isRejected ? (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isRejected ? 'Tu solicitud no fue aprobada' : 'Tu cuenta está en revisión'}
            </h1>

            <p className="text-gray-600 leading-relaxed">
              {isRejected
                ? 'Lamentablemente no pudimos aprobar tu solicitud de registro en DentalSpot.'
                : 'Estamos verificando los datos de tu cuenta. Esto es parte de nuestro proceso de seguridad para proteger los datos de los pacientes (Ley 21.719).'}
            </p>
          </div>

          {isRejected && rejectionReason && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 mb-1">Razón</p>
              <p className="text-sm text-red-800">{rejectionReason}</p>
            </div>
          )}

          {!isRejected && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">¿Qué sigue?</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-800">
                    <li>Un administrador revisa tu cuenta (suele tomar menos de 24h)</li>
                    <li>Te llegará un email cuando esté aprobada</li>
                    <li>Después puedes ingresar normalmente</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 bg-slate-50 rounded-lg p-4">
            <p className="text-xs text-slate-500 mb-1">Email registrado</p>
            <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {user?.email}
            </p>
          </div>

          {isRejected && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Si crees que es un error, escríbenos a{' '}
              <a href="mailto:soporte@dentalspot.cl" className="text-teal-600 hover:underline">
                soporte@dentalspot.cl
              </a>
            </p>
          )}

          <div className="mt-8">
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PendingApprovalPage;
