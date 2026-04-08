import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Key,
  Mail,
  Smartphone,
  Monitor,
  Globe,
  ShieldCheck,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  ChevronRight,
  Info
} from 'lucide-react';
import logger from "@/lib/utils/logger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIMEZONES = [
  { value: 'America/Santiago', label: '🇨🇱 Santiago (Chile) - GMT-4/3' },
  { value: 'America/Argentina/Buenos_Aires', label: '🇦🇷 Buenos Aires (Argentina) - GMT-3' },
  { value: 'America/Bogota', label: '🇨🇴 Bogotá (Colombia) - GMT-5' },
  { value: 'America/Lima', label: '🇵🇪 Lima (Perú) - GMT-5' },
  { value: 'America/Mexico_City', label: '🇲🇽 Ciudad de México - GMT-6' },
  { value: 'America/New_York', label: '🇺🇸 New York (USA) - GMT-5/4' },
  { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles (USA) - GMT-8/7' },
  { value: 'Europe/Madrid', label: '🇪🇸 Madrid (España) - GMT+1/2' },
  { value: 'Europe/London', label: '🇬🇧 Londres (UK) - GMT+0/1' },
  { value: 'UTC', label: '🌐 UTC (Universal)' },
];

const AccountSecuritySettings = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Email State
  const [emailForm, setEmailForm] = useState({
    newEmail: '',
    password: ''
  });

  // Timezone State
  const [timezone, setTimezone] = useState('America/Santiago');
  const [loadingTimezone, setLoadingTimezone] = useState(false);

  // 2FA State
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user?.factors?.length > 0) {
      setMfaEnabled(true);
    }

    if (user) {
      // Fetch profile data including timezone
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', user.id)
        .single();
      
      if (profile?.timezone) {
        setTimezone(profile.timezone);
      }
    }
  };

  const isPatient = user?.user_metadata?.role === 'patient';

  // Password validation
  const passwordChecks = {
    length: passwordForm.new.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.new),
    lowercase: /[a-z]/.test(passwordForm.new),
    number: /[0-9]/.test(passwordForm.new),
    special: /[^A-Za-z0-9]/.test(passwordForm.new),
    match: passwordForm.new === passwordForm.confirm && passwordForm.confirm !== ''
  };

  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length;
  const isPasswordValid = passwordChecks.length && passwordChecks.match && passwordStrength >= 4;

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast({ title: "Error", description: "La contraseña no cumple los requisitos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.current
      });
      if (signInError) throw new Error("Contraseña actual incorrecta.");

      const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
      if (error) throw error;

      toast({ title: "✓ Contraseña actualizada", description: "Tu contraseña ha sido cambiada exitosamente." });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setActiveSection(null);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitEmailChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailForm.password
      });
      if (signInError) throw new Error("Contraseña incorrecta.");

      const { error } = await supabase.auth.updateUser({ email: emailForm.newEmail });
      if (error) throw error;

      toast({ title: "📧 Revisa tu correo", description: "Te enviamos un enlace de confirmación.", duration: 6000 });
      setEmailForm({ newEmail: '', password: '' });
      setActiveSection(null);
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const submitTimezoneChange = async () => {
    if (!user) return;
    setLoadingTimezone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ timezone: timezone })
        .eq('id', user.id);

      if (error) throw error;

      toast({ title: "✓ Zona horaria actualizada", description: "Tus preferencias de hora han sido guardadas." });
      setActiveSection(null);
    } catch (error) {
      logger.error('Error updating timezone:', error);
      toast({ title: "Error", description: "No se pudo actualizar la zona horaria.", variant: "destructive" });
    } finally {
      setLoadingTimezone(false);
    }
  };

  const handleLogoutOthers = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'others' });
      toast({ title: "✓ Sesiones cerradas", description: "Se cerró sesión en otros dispositivos." });
    } catch (error) {
      toast({ title: "Info", description: "Operación completada." });
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ id, value, onChange, placeholder, show, onToggle }) => (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 h-11 bg-white border-gray-200 focus:border-teal-500 focus:ring-teal-500/20"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  const CheckItem = ({ checked, label }) => (
    <div className={`flex items-center gap-2 text-sm transition-colors ${checked ? 'text-teal-600' : 'text-gray-400'}`}>
      {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </div>
  );

  const SectionButton = ({ icon: Icon, title, description, onClick, badge }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-200 text-left group"
    >
      <div className="p-2.5 rounded-lg bg-gray-50 group-hover:bg-teal-100/50 transition-colors">
        <Icon className="h-5 w-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{title}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.variant === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-teal-400 transition-colors" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/25">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Seguridad</h1>
          </div>
          <p className="text-gray-500 ml-12">Gestiona la seguridad de tu cuenta</p>
        </div>

        {/* Patient Hint */}
        {isPatient && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/50">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">¿Primera vez ingresando?</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Tu contraseña temporal son los primeros 6 dígitos de tu RUT.
                  <span className="block text-xs text-amber-600 mt-1">Ej: RUT 12.345.678-9 → contraseña: 123456</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!activeSection ? (
          <div className="space-y-3">
            <SectionButton
              icon={Key}
              title="Contraseña"
              description="Cambia tu contraseña de acceso"
              onClick={() => setActiveSection('password')}
            />
            <SectionButton
              icon={Mail}
              title="Email"
              description={user?.email || 'Cargando...'}
              onClick={() => setActiveSection('email')}
            />
            <SectionButton
              icon={Globe}
              title="Zona Horaria"
              description={timezone || "Configura tu zona horaria"}
              onClick={() => setActiveSection('timezone')}
            />
            <SectionButton
              icon={Smartphone}
              title="Autenticación de dos factores"
              description={mfaEnabled ? 'Protección adicional activada' : 'Añade una capa extra de seguridad'}
              badge={mfaEnabled ? { text: 'Activo', variant: 'success' } : null}
              onClick={() => setActiveSection('2fa')}
            />
            <SectionButton
              icon={Monitor}
              title="Sesiones activas"
              description="Gestiona tus dispositivos conectados"
              onClick={() => setActiveSection('sessions')}
            />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Back Button */}
            <button
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Volver
            </button>

            {/* Timezone Section */}
            {activeSection === 'timezone' && (
              <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <Globe className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Zona Horaria</h2>
                      <p className="text-sm text-gray-500">Configura la zona horaria para tus citas y calendario</p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Zona actual detectada</p>
                    <p className="font-medium text-gray-900 font-mono text-sm">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-sm font-medium text-gray-700">
                        Selecciona tu zona horaria
                      </Label>
                      <Select 
                        value={timezone} 
                        onValueChange={setTimezone}
                      >
                        <SelectTrigger id="timezone" className="h-11 bg-white border-gray-200">
                          <SelectValue placeholder="Selecciona una zona horaria" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Las horas de tus citas se mostrarán automáticamente en tu hora local.
                      </p>
                    </div>

                    <Button
                      onClick={submitTimezoneChange}
                      disabled={loadingTimezone}
                      className="w-full h-11 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25"
                    >
                      {loadingTimezone ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar zona horaria'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Password Section */}
            {activeSection === 'password' && (
              <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-teal-100">
                      <Key className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Cambiar contraseña</h2>
                      <p className="text-sm text-gray-500">Elige una contraseña segura</p>
                    </div>
                  </div>

                  <form onSubmit={submitPasswordChange} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="current" className="text-sm font-medium text-gray-700">
                        Contraseña actual
                      </Label>
                      <PasswordInput
                        id="current"
                        value={passwordForm.current}
                        onChange={(v) => handlePasswordChange('current', v)}
                        placeholder={isPatient ? "Ej: 123456" : "••••••••"}
                        show={showPasswords.current}
                        onToggle={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="new" className="text-sm font-medium text-gray-700">
                        Nueva contraseña
                      </Label>
                      <PasswordInput
                        id="new"
                        value={passwordForm.new}
                        onChange={(v) => handlePasswordChange('new', v)}
                        placeholder="••••••••"
                        show={showPasswords.new}
                        onToggle={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                      />

                      {/* Strength Bar */}
                      {passwordForm.new && (
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${passwordStrength >= level
                                    ? passwordStrength <= 2 ? 'bg-red-400'
                                      : passwordStrength <= 3 ? 'bg-amber-400'
                                        : passwordStrength <= 4 ? 'bg-teal-400'
                                          : 'bg-emerald-500'
                                    : 'bg-gray-100'
                                  }`}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <CheckItem checked={passwordChecks.length} label="Mín. 8 caracteres" />
                            <CheckItem checked={passwordChecks.uppercase} label="Una mayúscula" />
                            <CheckItem checked={passwordChecks.number} label="Un número" />
                            <CheckItem checked={passwordChecks.special} label="Un símbolo" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
                        Confirmar contraseña
                      </Label>
                      <PasswordInput
                        id="confirm"
                        value={passwordForm.confirm}
                        onChange={(v) => handlePasswordChange('confirm', v)}
                        placeholder="••••••••"
                        show={showPasswords.confirm}
                        onToggle={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                      />
                      {passwordForm.confirm && !passwordChecks.match && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <X className="h-3.5 w-3.5" /> Las contraseñas no coinciden
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !isPasswordValid}
                      className="w-full h-11 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 transition-all duration-200"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar contraseña'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Email Section */}
            {activeSection === 'email' && (
              <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Cambiar email</h2>
                      <p className="text-sm text-gray-500">Actualiza tu dirección de correo</p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500 mb-1">Email actual</p>
                    <p className="font-medium text-gray-900">{user?.email || 'Cargando...'}</p>
                  </div>

                  <form onSubmit={submitEmailChange} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="newEmail" className="text-sm font-medium text-gray-700">
                        Nuevo email
                      </Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                        placeholder="nuevo@email.com"
                        className="h-11 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailPassword" className="text-sm font-medium text-gray-700">
                        Confirma tu contraseña
                      </Label>
                      <PasswordInput
                        id="emailPassword"
                        value={emailForm.password}
                        onChange={(v) => setEmailForm({ ...emailForm, password: v })}
                        placeholder="••••••••"
                        show={showPasswords.current}
                        onToggle={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-700">
                        Recibirás un enlace de confirmación en tu nuevo email.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cambiar email'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* 2FA Section */}
            {activeSection === '2fa' && (
              <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Autenticación de dos factores</h2>
                      <p className="text-sm text-gray-500">Protege tu cuenta con verificación adicional</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 mb-6">
                    <div>
                      <p className="font-medium text-gray-900">Estado de 2FA</p>
                      <p className="text-sm text-gray-500">
                        {mfaEnabled ? 'Tu cuenta está protegida' : 'No está configurado'}
                      </p>
                    </div>
                    <Switch
                      checked={mfaEnabled}
                      onCheckedChange={() => {
                        if (!mfaEnabled) {
                          toast({ title: "Próximamente", description: "Esta función estará disponible pronto." });
                        } else {
                          toast({ title: "Info", description: "Contacta soporte para desactivar 2FA." });
                        }
                      }}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="flex gap-3">
                      <ShieldCheck className="h-5 w-5 text-purple-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-purple-800">Configuración de 2FA</p>
                        <p className="text-xs text-purple-700 mt-1">
                          Estamos trabajando en la configuración de 2FA desde tu panel. Mientras tanto, puedes contactar a soporte para habilitarla.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sessions Section */}
            {activeSection === 'sessions' && (
              <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Monitor className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">Sesiones activas</h2>
                      <p className="text-sm text-gray-500">Dispositivos donde has iniciado sesión</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Monitor className="h-8 w-8 text-emerald-600" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Este dispositivo</p>
                        <p className="text-xs text-gray-500">Sesión activa ahora</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleLogoutOthers}
                    disabled={loading}
                    className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cerrar otras sesiones'}
                  </Button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    Esto cerrará sesión en todos los demás dispositivos
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Derechos ARCO */}
            <ArcoSection />
          </div>
        )}
      </div>
    </div>
  );
};

// Sección de Derechos ARCO
const ArcoSection = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState('access');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => { fetchMyRequests(); }, []);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('arco_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('requested_at', { ascending: false });
    setMyRequests(data || []);
    setLoadingRequests(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('arco_requests').insert({
        user_id: user.id,
        request_type: requestType,
        description,
        status: 'pending',
      });
      if (error) throw error;
      toast({ title: 'Solicitud enviada', description: 'Recibirás una respuesta en los próximos días hábiles.' });
      setShowForm(false);
      setDescription('');
      fetchMyRequests();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const ARCO_TYPES = [
    { value: 'access', label: 'Acceso', desc: 'Solicitar copia de todos mis datos personales almacenados' },
    { value: 'rectification', label: 'Rectificación', desc: 'Corregir datos personales incorrectos o incompletos' },
    { value: 'cancellation', label: 'Cancelación', desc: 'Eliminar mis datos personales de la plataforma' },
    { value: 'opposition', label: 'Oposición', desc: 'Oponerme al tratamiento de mis datos para ciertos fines' },
    { value: 'portability', label: 'Portabilidad', desc: 'Exportar mis datos en formato estándar (GDPR art. 20)' },
  ];

  const STATUS_LABELS = {
    pending: 'Pendiente',
    in_progress: 'En Proceso',
    completed: 'Completada',
    rejected: 'Rechazada',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Derechos ARCO</h2>
            <p className="text-sm text-gray-500">Acceso, Rectificación, Cancelación y Oposición (Ley 19.628)</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Tienes derecho a solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos personales.
          Las solicitudes serán procesadas en un plazo máximo de 15 días hábiles.
        </p>

        {!showForm ? (
          <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
            Nueva solicitud ARCO
          </Button>
        ) : (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de solicitud</Label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
              >
                {ARCO_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Detalle de la solicitud</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border rounded-md text-sm min-h-[80px]"
                placeholder="Describe tu solicitud con el mayor detalle posible..."
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={submitting || !description.trim()} className="bg-purple-600 hover:bg-purple-700">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar solicitud
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {/* Mis solicitudes */}
        {myRequests.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Mis solicitudes</h3>
            {myRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                <div>
                  <span className="font-medium">{ARCO_TYPES.find(t => t.value === req.request_type)?.label || req.request_type}</span>
                  <span className="text-gray-400 ml-2">{new Date(req.requested_at).toLocaleDateString('es-CL')}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  req.status === 'completed' ? 'bg-green-100 text-green-700' :
                  req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {STATUS_LABELS[req.status] || req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountSecuritySettings;