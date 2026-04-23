import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle2, XCircle, Building2, LogIn, UserPlus } from 'lucide-react';

const InviteAcceptPage = () => {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [actionComplete, setActionComplete] = useState(null); // 'accepted', 'rejected'

  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('clinic-invitations', {
          body: { action: 'validate', token }
        });

        if (error) throw error;
        if (!data || !data.success) {
          throw new Error(data?.message || "Invitación no válida");
        }

        setInviteData(data.invitation);
      } catch (err) {
        setError(err.message || "No se pudo validar la invitación");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleResponse = async (action) => {
    if (!user) return; // Should be handled by UI state
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('clinic-invitations', {
        body: { 
          action: action, // 'accept' or 'reject'
          token 
        }
      });

      if (error || !data?.success) throw new Error(data?.message || "Error al procesar la solicitud");

      setActionComplete(action === 'accept' ? 'accepted' : 'rejected');

      if (action === 'accept') {
        toast({
          title: "¡Bienvenido al equipo!",
          description: `Te has unido exitosamente a ${inviteData?.clinics?.name || 'la clínica'}.`,
        });
        // Spec 023: el edge function retorna redirect_to contextual según role
        // (ej. /dashboard/assistant para asistentes). Fallback a /dashboard si no viene.
        const dest = data?.redirect_to || '/dashboard';
        setTimeout(() => navigate(dest), 2500);
      } else {
        toast({ title: "Invitación rechazada" });
      }

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  if (actionComplete === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-800 text-2xl">¡Invitación Aceptada!</CardTitle>
            <CardDescription className="text-green-600 text-lg mt-2">
              Te has unido a {inviteData?.clinics?.name}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-gray-500">
            Redirigiendo a tu panel...
          </CardContent>
        </Card>
      </div>
    );
  }

  // Spec 023: contextualizar copy + botones según role de la invitación
  const isAssistant = inviteData?.role === 'assistant';
  const existingPatient = inviteData?.existing_patient === true;
  const inviteEmail = encodeURIComponent(inviteData?.email || '');
  const roleQuery = isAssistant ? '&role=assistant' : '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isAssistant ? 'bg-teal-100' : 'bg-blue-100'}`}>
            <Building2 className={`h-8 w-8 ${isAssistant ? 'text-teal-600' : 'text-blue-600'}`} />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isAssistant ? 'Invitación a colaborar' : 'Invitación a Clínica'}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isAssistant
              ? 'Te invitaron como asistente administrativo a'
              : 'Has sido invitado a formar parte del equipo de'}
          </CardDescription>
          <h2 className="text-xl font-semibold text-primary mt-1">{inviteData?.clinics?.name}</h2>
          {inviteData?.clinics?.address && (
            <p className="text-sm text-gray-500 mt-1">{inviteData.clinics.address}</p>
          )}
          {/* Role badge */}
          {isAssistant && (
            <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold">
              🧑‍💼 Rol: Asistente administrativo
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6 pb-2">
          {/* Nota de permisos si es asistente */}
          {isAssistant && (
            <div className="bg-teal-50 border border-teal-200 rounded-md p-3 mb-4 text-teal-800 text-xs">
              <strong>Como asistente podrás</strong> gestionar agenda y listado de pacientes. La ficha clínica detallada queda reservada a dentistas por Ley 20.584.
            </div>
          )}

          {inviteData?.message && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 italic text-gray-600 text-center">
              "{inviteData.message}"
            </div>
          )}

          {!user ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 text-sm">
                {isAssistant && existingPatient ? (
                  <>Tu email ya tiene cuenta en DentalSpot. <strong>Iniciá sesión</strong> para aceptar la invitación.</>
                ) : (
                  <>Necesitas una cuenta en DentalSpot para aceptar esta invitación.</>
                )}
              </div>
              <div className="grid gap-3">
                {/* Primary: login si existing_patient; register si no */}
                {isAssistant && existingPatient ? (
                  <>
                    <Button className="w-full" asChild>
                      <Link to={`/auth/login?token=${token}&email=${inviteEmail}${roleQuery}`}>
                        <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
                      </Link>
                    </Button>
                    <p className="text-center text-xs text-gray-500">
                      Al iniciar sesión, tu cuenta se amplía para tener acceso como asistente a esta clínica.
                    </p>
                  </>
                ) : (
                  <>
                    <Button className="w-full" asChild>
                      <Link to={`/auth/register?token=${token}&email=${inviteEmail}${roleQuery}`}>
                        <UserPlus className="mr-2 h-4 w-4" /> Crear Cuenta
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/auth/login?token=${token}&email=${inviteEmail}${roleQuery}`}>
                        <LogIn className="mr-2 h-4 w-4" /> Ya tengo cuenta — Iniciar Sesión
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-1">Has iniciado sesión como:</p>
                <p className="font-medium">{user.email}</p>
                {user.email !== inviteData.email && (
                  <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                    Nota: La invitación fue enviada a {inviteData.email}, pero estás aceptando con {user.email}.
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => handleResponse('reject')}
                  disabled={processing}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Rechazar
                </Button>
                <Button 
                  onClick={() => handleResponse('accept')}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Aceptar e Unirme
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center pt-2">
          {!user && (
            <Link to="/" className="text-xs text-gray-400 hover:underline">Volver al inicio</Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default InviteAcceptPage;