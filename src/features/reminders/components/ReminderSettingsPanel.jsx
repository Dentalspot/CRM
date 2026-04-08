import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Clock, CheckCircle, AlertCircle, History, Globe, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { useReminders } from '../hooks/useReminders';

const TIMEZONES = [
  { value: 'America/Santiago', label: '🇨🇱 Chile (Santiago)' },
  { value: 'America/Punta_Arenas', label: '🇨🇱 Chile (Magallanes)' },
  { value: 'Pacific/Easter', label: '🇨🇱 Chile (Isla de Pascua)' },
  { value: 'America/Argentina/Buenos_Aires', label: '🇦🇷 Argentina' },
  { value: 'America/Lima', label: '🇵🇪 Perú' },
  { value: 'America/Bogota', label: '🇨🇴 Colombia' },
  { value: 'America/Guayaquil', label: '🇪🇨 Ecuador' },
  { value: 'America/La_Paz', label: '🇧🇴 Bolivia' },
  { value: 'America/Caracas', label: '🇻🇪 Venezuela' },
  { value: 'America/Mexico_City', label: '🇲🇽 México' },
  { value: 'America/New_York', label: '🇺🇸 USA (Este)' },
  { value: 'America/Chicago', label: '🇺🇸 USA (Centro)' },
  { value: 'America/Los_Angeles', label: '🇺🇸 USA (Pacífico)' },
  { value: 'Europe/Madrid', label: '🇪🇸 España' },
  { value: 'UTC', label: '🌐 UTC' },
];

const ReminderSettingsPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({
    email_enabled: true,
    timing_hours: 24,
    test_email: user?.email || ''
  });
  const [timezone, setTimezone] = useState('America/Santiago');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { logs, sendTestReminder } = useReminders(user?.id);

  // --- 1. Load Data ---
  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        // Load reminder preferences
        const { data: detailsData } = await supabase
          .from('therapist_details')
          .select('reminder_preferences')
          .eq('user_id', user.id)
          .single();
        
        if (detailsData?.reminder_preferences) {
          setPrefs(prev => ({ ...prev, ...detailsData.reminder_preferences }));
        }

        // Load timezone from profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('timezone')
          .eq('id', user.id)
          .single();
        
        if (profileData?.timezone) {
          setTimezone(profileData.timezone);
        }
      };
      loadData();
    }
  }, [user]);

  // --- 2. Timer for Local Time Display ---
  useEffect(() => {
    const updateTime = () => {
      try {
        const timeString = new Date().toLocaleTimeString('es-CL', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        setCurrentTime(timeString);
      } catch (e) {
        setCurrentTime('--:--');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  // --- 3. Save Handlers ---
  const handleSave = async () => {
    setLoading(true);
    try {
      // Update preferences
      const { error: prefsError } = await supabase
        .from('therapist_details')
        .update({ reminder_preferences: prefs })
        .eq('user_id', user.id);

      if (prefsError) throw prefsError;

      // Update timezone
      const { error: tzError } = await supabase
        .from('profiles')
        .update({ timezone: timezone })
        .eq('id', user.id);

      if (tzError) throw tzError;

      toast({ 
        title: 'Configuración guardada', 
        description: `Zona horaria establecida a ${timezone} y preferencias actualizadas.` 
      });
    } catch (error) {
      logger.error('Error saving settings:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error al guardar', 
        description: 'No se pudieron guardar los cambios. Intenta nuevamente.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!prefs.test_email) {
      toast({ variant: 'destructive', title: 'Falta email', description: 'Ingresa un email para la prueba.' });
      return;
    }

    const { data } = await supabase
      .from('appointments')
      .select('id')
      .eq('therapist_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!data) {
      toast({ variant: 'destructive', title: 'Sin citas', description: 'Necesitas al menos una cita creada para probar el sistema.' });
      return;
    }

    toast({ title: 'Enviando...', description: 'Procesando envío de prueba.' });
    await sendTestReminder(data.id, prefs.test_email);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* --- Section: Timezone Settings --- */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Zona Horaria Regional</CardTitle>
          </div>
          <CardDescription>
            Asegura que tus recordatorios lleguen a la hora correcta sincronizando tu ubicación.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="w-full md:w-2/3 space-y-2">
              <Label>Selecciona tu ubicación</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona zona horaria" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between border">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hora local
              </span>
              <span className="text-xl font-bold font-mono tracking-wider text-blue-700 dark:text-blue-400">
                {currentTime}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Section: Reminder Preferences --- */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Automatización de Recordatorios</CardTitle>
          </div>
          <CardDescription>Configura cuándo y cómo se envían las notificaciones a tus pacientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Activar correos automáticos</Label>
              <p className="text-sm text-muted-foreground">Envía un email recordatorio antes de cada cita agendada.</p>
            </div>
            <Switch
              checked={prefs.email_enabled}
              onCheckedChange={(c) => setPrefs(p => ({ ...p, email_enabled: c }))}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Antelación del envío</Label>
              <Select
                value={String(prefs.timing_hours)}
                onValueChange={(v) => setPrefs(p => ({ ...p, timing_hours: parseInt(v) }))}
                disabled={!prefs.email_enabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora antes</SelectItem>
                  <SelectItem value="2">2 horas antes</SelectItem>
                  <SelectItem value="4">4 horas antes</SelectItem>
                  <SelectItem value="12">12 horas antes</SelectItem>
                  <SelectItem value="24">24 horas antes (1 día)</SelectItem>
                  <SelectItem value="48">48 horas antes (2 días)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Recomendamos 24 horas para reducir inasistencias.</p>
            </div>

            <div className="space-y-2">
              <Label>Email para pruebas</Label>
              <div className="flex gap-2">
                <Input
                  value={prefs.test_email}
                  onChange={e => setPrefs(p => ({ ...p, test_email: e.target.value }))}
                  placeholder="ejemplo@correo.com"
                />
                <Button variant="outline" size="icon" onClick={handleTest} title="Enviar prueba ahora">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Usa este email para verificar el formato del recordatorio.</p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <Button className="w-full md:w-auto" onClick={handleSave} disabled={loading}>
              {loading ? (
                <>Guardando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Guardar Preferencias</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Section: History Logs --- */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            <CardTitle className="text-lg">Historial de Envíos</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900/20">
                <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                <p>No hay registros de envíos recientes.</p>
              </div>
            ) : (
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {log.appointment?.patient?.profile?.full_name || 'Paciente desconocido'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.sent_at).toLocaleString('es-CL')}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {log.delivery_status === 'sent' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" /> Falló
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReminderSettingsPanel;