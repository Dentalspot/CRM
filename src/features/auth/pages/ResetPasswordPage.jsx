import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  Lock, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import logger from '@/lib/utils/logger';
import { motion, AnimatePresence } from 'framer-motion';
import AuthBackground from '@/features/auth/components/AuthBackground';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [tokenChecking, setTokenChecking] = useState(true);
  const [success, setSuccess] = useState(false);

  // Password Requirements State
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [strength, setStrength] = useState(0); // 0-4

  useEffect(() => {
    // Check for recovery token in URL hash
    const checkSession = async () => {
      // 1. Check direct hash presence for 'type=recovery' or 'access_token'
      const hash = window.location.hash;
      const hasRecoveryToken = hash && (hash.includes('type=recovery') || hash.includes('access_token'));
      
      // 2. Also check if Supabase session is already established (client handles hash automatically)
      const { data: { session } } = await supabase.auth.getSession();

      if (hasRecoveryToken || session) {
        setValidToken(true);
      } else {
        setValidToken(false);
      }
      setTokenChecking(false);
    };

    checkSession();
  }, []);

  // Real-time validation
  useEffect(() => {
    const reqs = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };
    setRequirements(reqs);

    // Calculate strength
    let score = 0;
    if (reqs.length) score++;
    if (reqs.uppercase) score++;
    if (reqs.number) score++;
    if (reqs.special) score++;
    setStrength(score);

  }, [password]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    // Final Validation
    if (password !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor verifica que ambos campos sean iguales.",
        variant: "destructive"
      });
      return;
    }

    if (strength < 4) {
      toast({
        title: "Contraseña débil",
        description: "Por favor cumple con todos los requisitos de seguridad.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "¡Contraseña actualizada!",
        description: "Has recuperado el acceso a tu cuenta exitosamente.",
        className: "bg-green-50 border-green-200"
      });

      // Redirect after delay
      setTimeout(() => {
        navigate('/auth/login');
      }, 2500);

    } catch (error) {
      logger.error('Error resetting password:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo cambiar la contraseña. Intenta solicitar un nuevo enlace.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case 0: return { label: 'Muy Débil', color: 'bg-slate-200 text-slate-500' };
      case 1: return { label: 'Débil', color: 'bg-red-500 text-red-600' };
      case 2: return { label: 'Regular', color: 'bg-orange-500 text-orange-600' };
      case 3: return { label: 'Buena', color: 'bg-yellow-500 text-yellow-600' };
      case 4: return { label: 'Segura', color: 'bg-green-500 text-green-600' };
      default: return { label: '', color: '' };
    }
  };

  const strengthInfo = getStrengthLabel();

  // Loading State for Token Check
  if (tokenChecking) {
    return (
      <AuthBackground showLogo={false}>
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </AuthBackground>
    );
  }

  // Invalid Token State
  if (!validToken) {
    return (
      <AuthBackground logoSize="medium">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Enlace inválido o expirado</CardTitle>
            <CardDescription className="pt-2">
              No se encontró un token de recuperación válido. Es posible que el enlace haya expirado o ya haya sido utilizado.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pt-6">
            <Button onClick={() => navigate('/auth/login')} variant="default" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al inicio de sesión
            </Button>
          </CardFooter>
        </Card>
      </AuthBackground>
    );
  }

  // Success State
  if (success) {
    return (
      <AuthBackground logoSize="medium">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="pt-10 pb-10 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              type="spring"
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
              <Check className="h-10 w-10 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Contraseña Restablecida!</h2>
            <p className="text-gray-500 mb-6">
              Tu contraseña ha sido actualizada correctamente. <br/>
              Serás redirigido al login en unos segundos...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </CardContent>
        </Card>
      </AuthBackground>
    );
  }

  // Main Form
  return (
    <AuthBackground logoSize="medium">
      <div className="w-full max-w-md mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Restablecer Contraseña</h1>
        <p className="text-gray-600 mt-2">Crea una nueva clave segura para tu cuenta</p>
      </div>

      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl shadow-2xl border-0 overflow-hidden">
        <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Nueva Credencial
          </CardTitle>
          <CardDescription>
            Ingresa y confirma tu nueva contraseña a continuación.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-10 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus-visible:ring-red-200' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 flex items-center mt-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="h-3 w-3 mr-1" /> Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Strength Meter */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Seguridad de la contraseña</span>
                <span className={`font-bold ${strengthInfo.color.split(' ')[1]}`}>{strengthInfo.label}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
                {[1, 2, 3, 4].map((level) => (
                  <div 
                    key={level}
                    className={`flex-1 h-full transition-all duration-500 ease-out ${
                      strength >= level ? strengthInfo.color.split(' ')[0] : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <RequirementItem met={requirements.length} label="Mínimo 8 caracteres" />
              <RequirementItem met={requirements.uppercase} label="Una mayúscula" />
              <RequirementItem met={requirements.number} label="Un número" />
              <RequirementItem met={requirements.special} label="Un carácter especial" />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-medium py-2.5 h-auto shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
              disabled={loading || strength < 4 || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Establecer Nueva Contraseña'
              )}
            </Button>

          </form>
        </CardContent>
        <CardFooter className="bg-gray-50/50 py-4 flex justify-center border-t border-gray-100">
          <button
            onClick={() => navigate('/auth/login')}
            className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center"
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> Volver al inicio de sesión
          </button>
        </CardFooter>
      </Card>
    </AuthBackground>
  );
};

// Helper Component for Checklist
const RequirementItem = ({ met, label }) => (
  <div className={`flex items-center gap-1.5 transition-colors duration-300 ${met ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
    {met ? (
      <Check className="h-3.5 w-3.5" />
    ) : (
      <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
    )}
    <span>{label}</span>
  </div>
);

export default ResetPasswordPage;