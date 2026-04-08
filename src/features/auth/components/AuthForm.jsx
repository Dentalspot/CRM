
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Mail, Lock, CheckCircle2, AlertCircle, Gift, Eye, EyeOff } from 'lucide-react';
import { getPublicRoles } from '@/constants/roles';
import { cleanRut, formatRut, validateRut } from '@/utils/rutUtils';
import logger from '@/lib/utils/logger';
import { supabase } from '@/lib/supabaseClient';

const AuthForm = ({ isLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const urlInviteCode = queryParams.get('invite');
  const urlPlan = queryParams.get('plan');
  const isPaidPlan = urlPlan && urlPlan !== 'free' && urlPlan !== 'gratis';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'patient',
    rut: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [rutError, setRutError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  // Invitation state
  const [inviteCode, setInviteCode] = useState(urlInviteCode ? urlInviteCode.toUpperCase() : '');
  const [inviteStatus, setInviteStatus] = useState('none'); // none, loading, valid, invalid, expired
  const [inviterName, setInviterName] = useState(null);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountStatus, setDiscountStatus] = useState('none'); // none, loading, valid, invalid
  const [discountInfo, setDiscountInfo] = useState(null);

  const availableRoles = getPublicRoles();

  useEffect(() => {
    const validateInvite = async () => {
      if (!inviteCode || isLogin) {
        setInviteStatus('none');
        setInviterName(null);
        return;
      }

      setInviteStatus('loading');
      try {
        const { data, error } = await supabase
          .from('therapist_invitations')
          .select('*, inviter:inviter_id(full_name)')
          .eq('invite_code', inviteCode)
          .eq('status', 'pending')
          .single();

        if (error || !data) {
          setInviteStatus('invalid');
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setInviteStatus('expired');
          return;
        }

        setInviteStatus('valid');
        setInviterName(data.inviter?.full_name || 'un colega');
        
        // Auto select therapist role if valid invitation
        setFormData(prev => ({ ...prev, role: 'therapist' }));
      } catch (err) {
        logger.error('Error validating invite code:', err);
        setInviteStatus('invalid');
      }
    };

    const timeoutId = setTimeout(validateInvite, 500);
    return () => clearTimeout(timeoutId);
  }, [inviteCode, isLogin]);

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    if (field === 'rut') {
      const formattedRut = formatRut(value);
      setFormData(prev => ({ ...prev, rut: formattedRut }));

      if (formattedRut) {
        const cleaned = cleanRut(formattedRut);
        setRutError(!validateRut(cleaned) ? 'RUT inválido' : '');
      } else {
        setRutError('');
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  // ============ LOGIN ============
  const handleLogin = async () => {
    const { error } = await signIn(formData.email, formData.password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: error.message === "Invalid login credentials"
          ? "Credenciales incorrectas. Verifica tu email y contraseña."
          : error.message
      });
      return;
    }

    toast({
      title: "¡Bienvenido!",
      description: "Has iniciado sesión exitosamente.",
    });
    // Redirect to dashboard after successful login
    navigate('/dashboard', { replace: true });
  };

  // ============ REGISTER ============
  const handleRegister = async () => {
    if (!formData.fullName.trim()) {
      toast({
        variant: "destructive",
        title: "Campo requerido",
        description: "Por favor ingresa tu nombre completo"
      });
      return;
    }

    if (formData.rut) {
      const cleanedRut = cleanRut(formData.rut);
      if (!validateRut(cleanedRut)) {
        setRutError('RUT inválido. Por favor, corrígelo.');
        toast({
          variant: "destructive",
          title: "RUT inválido",
          description: "Por favor verifica el RUT ingresado"
        });
        return;
      }
    }

    const metadata = {
      full_name: formData.fullName.trim(),
      role: formData.role,
      rut: formData.rut ? cleanRut(formData.rut) : null
    };

    if (inviteCode && inviteStatus === 'valid') {
      metadata.invite_code = inviteCode;
    }

    if (discountCode) {
      metadata.discount_code = discountCode;
    }

    const { error, needsEmailConfirmation, data } = await signUp(
      formData.email,
      formData.password,
      metadata
    );

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message
      });
      return;
    }

    // Handle valid invitation update
    if (inviteCode && inviteStatus === 'valid') {
      try {
        const inviteeId = data?.user?.id || null;

        const updateData = {
          status: 'accepted',
          invitee_email: formData.email.toLowerCase().trim(),
          accepted_at: new Date().toISOString(),
        };
        if (inviteeId) updateData.invitee_id = inviteeId;

        // Try update — if RLS blocks, retry with a direct match
        const { error: updateError } = await supabase
          .from('therapist_invitations')
          .update(updateData)
          .eq('invite_code', inviteCode)
          .eq('status', 'pending');

        if (updateError) {
          logger.error('Direct update failed, trying RPC fallback:', updateError);
          // Fallback: use SECURITY DEFINER RPC
          const { error: rpcError } = await supabase.rpc('accept_invitation', {
            p_invite_code: inviteCode,
            p_invitee_email: formData.email.toLowerCase().trim(),
            p_invitee_id: inviteeId,
          });
          if (rpcError) logger.error('RPC fallback also failed:', rpcError);
        }

        if (!updateError) {
          toast({
            title: "¡Bienvenido! Tu invitación ha sido registrada",
            description: "Se ha aplicado el código correctamente."
          });
        }
      } catch (inviteError) {
        logger.error('Failed to update invitation status:', inviteError);
      }
    }

    if (needsEmailConfirmation) {
      navigate('/auth/confirm-email', { state: { email: formData.email } });
      return;
    } else {
      toast({
        title: "¡Cuenta creada!",
        description: "Bienvenido a DentalSpot.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setRutError('');

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      logger.error('[AuthForm] Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message || "Por favor intenta de nuevo más tarde"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============ FORGOT PASSWORD ============
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido'
      });
      return;
    }

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;

      toast({
        title: '📧 Email enviado',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña'
      });

      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
      }, 2000);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar el email'
      });
    } finally {
      setSendingReset(false);
    }
  };

  const isRutFieldValid = !formData.rut || (formData.rut && !rutError);
  // DentalSpot: registro abierto para dentistas, sin invitacion obligatoria
  const needsInvitation = false;
  const isSubmitDisabled = isLoading || !isRutFieldValid;

  if (showForgotPassword) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={sendingReset}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={sendingReset}>
              {sendingReset ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button
            variant="link"
            className="p-0 h-auto text-sm text-muted-foreground"
            onClick={() => setShowForgotPassword(false)}
          >
            Volver a iniciar sesión
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </CardTitle>
        <CardDescription>
          {isLogin
            ? 'Ingresa tus credenciales para acceder'
            : 'Completa el formulario para registrarte'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Invitation logic UI */}
        {!isLogin && (
          urlInviteCode ? (
            <Alert className={`mb-4 ${inviteStatus === 'valid' ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
              <Gift className={`h-4 w-4 ${inviteStatus === 'valid' ? 'text-teal-600' : 'text-amber-600'}`} />
              <AlertDescription className={`ml-2 ${inviteStatus === 'valid' ? 'text-teal-800' : 'text-amber-800'}`}>
                {inviteStatus === 'loading' && <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Validando código de invitación...</span>}
                {inviteStatus === 'valid' && `✓ Invitación válida de ${inviterName}`}
                {(inviteStatus === 'invalid' || inviteStatus === 'expired') && (
                  <div className="space-y-2">
                    <p className="font-medium">Este código de invitación ya fue utilizado o expiró.</p>
                    <p className="text-sm">Si ya te registraste, puedes iniciar sesión directamente:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1 border-amber-300 text-amber-900 hover:bg-amber-100"
                      onClick={() => navigate('/auth/login')}
                    >
                      Ir a Iniciar Sesión
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <Collapsible className="mb-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-slate-600 font-normal hover:bg-transparent p-0 h-auto">
                  <Gift className="mr-2 h-4 w-4 text-primary" />
                  ¿Tienes un codigo de descuento?
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-2">
                <div className="relative">
                  <Input
                    placeholder="Ej: DENTAL20"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    disabled={isLoading}
                    maxLength={20}
                    className="font-mono tracking-widest uppercase"
                  />
                </div>
                {discountCode && (
                  <p className="text-xs text-slate-500">
                    El descuento se aplicara al momento de elegir tu plan.
                  </p>
                )}
              </CollapsibleContent>
            </Collapsible>
          )
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez González"
                  value={formData.fullName}
                  onChange={handleChange('fullName')}
                  className="pl-10"
                  required={!isLogin}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange('email')}
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange('password')}
                className="pl-10 pr-10"
                required
                minLength={6}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Cuenta *</Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
                disabled={isLoading || inviteStatus === 'valid'} // Lock role if valid invite
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isLogin && formData.role === 'therapist' && (
            <div className="space-y-2">
              <Label htmlFor="rut">
                RUT <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <div className="relative">
                <Input
                  id="rut"
                  type="text"
                  placeholder="12.345.678-9"
                  value={formData.rut}
                  onChange={handleChange('rut')}
                  disabled={isLoading}
                  className={rutError ? 'border-red-500' : ''}
                  maxLength={12}
                />
                {formData.rut && (
                  <div className="absolute right-3 top-3">
                    {!rutError ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {rutError && (
                <p className="text-xs text-red-500">{rutError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Puedes agregarlo después en tu perfil
              </p>
            </div>
          )}

          {!isLogin && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="accept-terms"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="accept-terms" className="text-xs text-muted-foreground">
                Acepto los{' '}
                <a href="/legal/terminos-condiciones" target="_blank" className="text-primary underline hover:text-primary/80">
                  Términos y Condiciones
                </a>{' '}y la{' '}
                <a href="/legal/politica-privacidad" target="_blank" className="text-primary underline hover:text-primary/80">
                  Política de Privacidad
                </a>
              </label>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitDisabled}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? 'Iniciando sesión...' : 'Registrando...'}
              </>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Registrarse'
            )}
          </Button>
        </form>

        {/* Google Sign-In */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">o continua con</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-medium"
          disabled={isLoading || googleLoading}
          onClick={async () => {
            setGoogleLoading(true);
            const { error } = await signInWithGoogle();
            if (error) {
              toast({ variant: 'destructive', title: 'Error', description: error.message });
              setGoogleLoading(false);
            }
          }}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {googleLoading ? 'Conectando...' : 'Google'}
        </Button>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <Button
            variant="link"
            className="p-0 h-auto font-semibold"
            onClick={() => navigate(isLogin ? '/auth/register' : '/auth/login')}
            disabled={isLoading}
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </Button>
        </p>

        {isLogin && (
          <p className="text-sm text-muted-foreground">
            ¿Olvidaste tu contraseña?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-semibold text-pink-500 hover:text-pink-600"
              onClick={() => setShowForgotPassword(true)}
              disabled={isLoading}
            >
              Recupérala aquí
            </Button>
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default AuthForm;
