/**
 * @file src/features/auth/pages/AcceptPatientInvitationPage.jsx
 *
 * Spec 030 followup: página de aceptación de invitación de paciente.
 *
 * Flow:
 * 1. URL: /auth/accept-invitation?token=xxx
 * 2. Al montar, llama RPC validate_patient_invitation(token) para verificar
 *    que el token está vigente + obtener nombre del paciente/dentista/clínica.
 * 3. Si válido: muestra form con [RUT + email + password + términos].
 * 4. Submit → supabase.auth.signUp() con email/password.
 * 5. Después de signUp exitoso → RPC link_patient_to_invitation(token, rut).
 * 6. Si match RUT → ya estás logueado y vinculado, redirect a /dashboard/patient/my-treatment.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatRut, cleanRut, validateRut } from '@/lib/utils/formatters';

const AcceptPatientInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const token = searchParams.get('token');

  const [validating, setValidating] = useState(true);
  const [invitation, setInvitation] = useState(null); // { patient_name, dentist_name, organization_name }
  const [errorState, setErrorState] = useState(null); // 'expired' | 'already_accepted' | 'not_found'

  const [rut, setRut] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validar token al montar
  useEffect(() => {
    // Spec 030 followup fix: limpiar token viejo de clinic-invitations (spec 023)
    // que el AuthForm lee de localStorage al detectar nueva session. Sin esto,
    // el AuthForm intercepta el signUp y intenta accept en clinic-invitations
    // (no aplica a paciente) → 400 → redirect a /dashboard sobre mi flow.
    try {
      localStorage.removeItem('pending_invitation_token');
    } catch {
      /* noop */
    }

    if (!token) {
      setValidating(false);
      setErrorState('not_found');
      return;
    }
    let cancelled = false;
    supabase
      .rpc('validate_patient_invitation', { p_token: token })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setErrorState('not_found');
          setValidating(false);
          return;
        }
        if (!data?.valid) {
          setErrorState(data?.reason || 'not_found');
          setValidating(false);
          return;
        }
        setInvitation(data);
        setValidating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateRut(rut)) {
      toast({ variant: 'destructive', title: 'RUT inválido', description: 'Revisá los dígitos.' });
      return;
    }
    if (!email || !email.includes('@')) {
      toast({ variant: 'destructive', title: 'Email inválido' });
      return;
    }
    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Contraseña corta',
        description: 'Mínimo 8 caracteres.',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Las contraseñas no coinciden' });
      return;
    }
    if (!acceptTerms) {
      toast({ variant: 'destructive', title: 'Tenés que aceptar los términos' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. signUp en Supabase Auth
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            role: 'patient',
            full_name: invitation?.patient_name || null,
            origin_app: 'dentalspot',
          },
        },
      });

      if (signUpErr) {
        // Si el email ya existe, intentamos signIn y después link
        if (signUpErr.message?.toLowerCase().includes('already registered')) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (signInErr) {
            throw new Error(
              'Ese email ya tiene cuenta. La contraseña que ingresaste no coincide.'
            );
          }
        } else {
          throw signUpErr;
        }
      }

      // 2. Vincular patient.profile_id (RPC valida RUT match)
      const { data: linkData, error: linkErr } = await supabase.rpc(
        'link_patient_to_invitation',
        {
          p_token: token,
          p_rut: cleanRut(rut),
        }
      );

      if (linkErr) throw linkErr;
      if (!linkData?.ok) {
        if (linkData?.reason === 'rut_mismatch') {
          throw new Error(
            'El RUT no coincide con el de la ficha. Verificá con tu dentista.'
          );
        }
        if (linkData?.reason === 'expired') {
          throw new Error('La invitación expiró. Pedile a tu dentista que te envíe una nueva.');
        }
        if (linkData?.reason === 'already_accepted') {
          throw new Error('Esta invitación ya fue aceptada antes.');
        }
        throw new Error('No se pudo activar la cuenta. Intentá de nuevo.');
      }

      toast({
        title: '✓ Cuenta activada',
        description: 'Te llevamos a tu plan de tratamiento.',
      });

      // Confirm sign-up email viene por mail aparte, pero igual auto-login
      // si Supabase lo permite. Si confirmation requerido, signUp devuelve
      // session=null y signedIn=false. En ese caso, redirect a login.
      if (signUpData?.session) {
        navigate('/dashboard/patient/my-treatment', { replace: true });
      } else {
        // Esperar a que la session se establezca
        const { data: sessionCheck } = await supabase.auth.getSession();
        if (sessionCheck?.session) {
          navigate('/dashboard/patient/my-treatment', { replace: true });
        } else {
          // Email confirmation requerido — redirect a login
          toast({
            title: 'Cuenta creada',
            description: 'Revisá tu email para confirmar y luego iniciá sesión.',
          });
          navigate('/auth/login', { replace: true });
        }
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'No se pudo activar la cuenta',
        description: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (errorState) {
    const messages = {
      expired: {
        title: 'Esta invitación expiró',
        desc: 'Las invitaciones duran 7 días. Pedile a tu dentista que te envíe una nueva.',
      },
      already_accepted: {
        title: 'Esta invitación ya fue aceptada',
        desc: 'Si ya tenés cuenta, iniciá sesión. Si perdiste el acceso, contactá a tu dentista.',
      },
      not_found: {
        title: 'Invitación no encontrada',
        desc: 'El link puede estar roto o haber sido revocado. Pedile a tu dentista una nueva invitación.',
      },
    };
    const msg = messages[errorState] || messages.not_found;
    return (
      <>
        <Helmet>
          <title>Invitación inválida | DentalSpot</title>
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{msg.title}</h2>
            <p className="text-slate-600 mb-6">{msg.desc}</p>
            <Link to="/auth/login">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                Ir a iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Activar mi cuenta | DentalSpot</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-teal-600" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
            Activá tu cuenta en DentalSpot
          </h2>
          <p className="text-sm text-slate-500 text-center mb-2">
            Hola <strong>{invitation?.patient_name}</strong>.
          </p>
          <p className="text-sm text-slate-500 text-center mb-6">
            <strong>{invitation?.dentist_name}</strong> de{' '}
            <strong>{invitation?.organization_name}</strong> te invitó.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rut" className="text-sm">
                Tu RUT
              </Label>
              <Input
                id="rut"
                value={rut}
                onChange={(e) => setRut(formatRut(e.target.value))}
                placeholder="12.345.678-9"
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Lo usamos para validar tu identidad con la ficha.
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm">
                Tu email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.cl"
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="mt-1"
                required
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm">
                Repetí la contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí la contraseña"
                className="mt-1"
                required
                minLength={8}
              />
            </div>

            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={setAcceptTerms}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-xs font-normal cursor-pointer leading-relaxed">
                Acepto los{' '}
                <Link to="/legal/terminos" className="text-teal-600 hover:underline" target="_blank">
                  términos
                </Link>{' '}
                y la{' '}
                <Link to="/legal/privacidad" className="text-teal-600 hover:underline" target="_blank">
                  política de privacidad
                </Link>{' '}
                de DentalSpot.
              </Label>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Activar mi cuenta
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-6">
            Si tenés problemas, escribinos a{' '}
            <a href="mailto:soporte@dentalspot.cl" className="text-teal-600 hover:underline">
              soporte@dentalspot.cl
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
};

export default AcceptPatientInvitationPage;
