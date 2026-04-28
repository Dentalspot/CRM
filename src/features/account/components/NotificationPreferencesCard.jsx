import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Bell } from 'lucide-react';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

const TOGGLES = [
  { key: 'email_appointments', label: 'Citas y agendamientos', desc: 'Confirmaciones, recordatorios de citas.', channel: 'Email' },
  { key: 'email_budgets', label: 'Presupuestos y pagos', desc: 'Cuando recibes un presupuesto o se registra un pago.', channel: 'Email' },
  { key: 'email_messages', label: 'Mensajes', desc: 'Cuando recibes un mensaje o respuesta.', channel: 'Email' },
  { key: 'email_system', label: 'Avisos del sistema', desc: 'Actualizaciones importantes de la plataforma.', channel: 'Email' },
  { key: 'email_marketing', label: 'Marketing y novedades', desc: 'Promociones y novedades comerciales (opcional).', channel: 'Email' },
];

const NotificationPreferencesCard = () => {
  const { prefs, loading, saving, updatePref } = useNotificationPreferences();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 mt-0.5">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Preferencias de comunicación</CardTitle>
            <CardDescription>
              Elige qué emails y notificaciones quieres recibir. Puedes cambiarlas cuando quieras.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {TOGGLES.map((t) => (
              <div key={t.key} className="flex items-start justify-between gap-3 border-b last:border-b-0 pb-3 last:pb-0">
                <div className="flex-1 min-w-0">
                  <Label htmlFor={t.key} className="text-sm font-medium cursor-pointer">
                    {t.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    id={t.key}
                    checked={!!prefs[t.key]}
                    onCheckedChange={(v) => updatePref(t.key, v)}
                    disabled={saving}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;
