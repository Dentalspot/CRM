import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, LogIn, UserPlus, FileText, Calendar, Stethoscope } from 'lucide-react';

const AcceptPassportPage = () => {
  const { token } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [grantData, setGrantData] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Validate token
  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);

        const { data: grant, error: grantError } = await supabase
          .from('patient_access_grants')
          .select('*, patient:patient_id(id, profile_id, profiles:profile_id(full_name))')
          .eq('share_token', token)
          .maybeSingle();

        if (grantError) throw grantError;

        if (!grant) {
          setError('Este enlace no existe o ya fue utilizado.');
          return;
        }

        if (grant.is_active) {
          setError('Este enlace ya fue aceptado previamente.');
          return;
        }

        if (grant.token_expires_at && new Date(grant.token_expires_at) < new Date()) {
          setError('Este enlace ha expirado. Pide al paciente que genere uno nuevo.');
          return;
        }

        setGrantData(grant);
        setPatientName(grant.patient?.profiles?.full_name || 'Paciente');
      } catch (err) {
        logger.error('Error validating passport token:', err);
        setError('No se pudo validar el enlace.');
      } finally {
        setLoading(false);
      }
    };

    if (token) validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!user || !grantData) return;

    setProcessing(true);
    try {
      // 1. Activate the grant and assign to this therapist
      const { error: updateError } = await supabase
        .from('patient_access_grants')
        .update({
          granted_to: user.id,
          is_active: true,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', grantData.id);

      if (updateError) throw updateError;

      // 2. Link patient to therapist if not already linked
      const patientId = grantData.patient_id;

      // RLS filtra por care_team + org membership
      const { data: existingLink } = await supabase
        .from('patients')
        .select('id')
        .eq('id', patientId)
        .maybeSingle();

      if (!existingLink) {
        // Get the patient's profile_id to create a new patient record for this therapist
        const patientProfileId = grantData.patient?.profile_id || grantData.profile_id;

        if (patientProfileId) {
          await supabase
            .from('patients')
            .insert({
              profile_id: patientProfileId,
              therapist_id: user.id,
              status: 'active',
            });
        }
      }

      // 3. Log the acceptance
      await supabase.from('clinical_access_log').insert({
        patient_id: patientId,
        accessed_by: user.id,
        action: 'grant',
        details: { token, accepted_by_name: profile?.full_name || user.email },
      });

      setAccepted(true);
      toast({
        title: 'Acceso concedido',
        description: `${patientName} ahora aparece en tu lista de pacientes.`,
      });

      setTimeout(() => navigate('/dashboard/patients'), 3000);
    } catch (err) {
      logger.error('Error accepting passport:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  // Loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Enlace Inválido</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>Volver al Inicio</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Accepted
  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-800 text-2xl">Acceso Concedido</CardTitle>
            <CardDescription className="text-green-600 text-lg mt-2">
              {patientName} ha sido vinculado a tu lista de pacientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-gray-500">
            Redirigiendo a tus pacientes...
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 to-white p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="bg-teal-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Pasaporte Clínico Compartido</CardTitle>
          <CardDescription className="text-base mt-2">
            <span className="font-semibold text-gray-800">{patientName}</span> te ha compartido su historia clínica
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 pb-2">
          {/* What you'll access */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Al aceptar podrás ver:</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-500" />
                <span>Sesiones anteriores</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-teal-500" />
                <span>Diagnósticos</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-500" />
                <span>Planes de tratamiento</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <span>Notas clínicas</span>
              </div>
            </div>
          </div>

          {!user ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
                Necesitas una cuenta en DentalSpot para aceptar este acceso.
              </div>
              <div className="grid gap-3">
                <Button className="w-full" asChild>
                  <Link to={`/auth/login?redirectTo=/accept-passport/${token}`}>
                    <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/auth/register?redirectTo=/accept-passport/${token}&invite=`}>
                    <UserPlus className="mr-2 h-4 w-4" /> Crear Cuenta Profesional
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Has iniciado sesión como:</p>
                <p className="font-medium">{profile?.full_name || user.email}</p>
              </div>

              <Button
                onClick={handleAccept}
                disabled={processing}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-4 w-4" /> Aceptar y Vincular Paciente</>
                )}
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center pt-2">
          <Link to="/" className="text-xs text-gray-400 hover:underline">Volver al inicio</Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AcceptPassportPage;
