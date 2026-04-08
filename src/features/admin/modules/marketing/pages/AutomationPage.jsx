import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Mail, Clock, RefreshCw, Bell, ShoppingCart, ThumbsUp, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const AUTOMATIONS = [
  {
    id: 'welcome_series',
    name: 'Welcome Series (3 emails)',
    icon: Mail,
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-50',
    description: 'Secuencia automatica de 3 emails para nuevos leads de Meta Ads: bienvenida (inmediato), herramientas IA (dia 2) y social proof (dia 5).',
    trigger: 'Al capturar lead (meta_ads / landing_page)',
    delay: 'Dia 0, 2 y 5',
    template: 'welcome_01, welcome_02, welcome_03',
    implementation: 'DB Trigger + welcome-sequence + process-scheduled-emails',
    status: true,
    stats: { sent: null, openRate: null },
    note: 'Activo. Trigger en marketing_leads → welcome-sequence edge function. Emails dia 2 y 5 procesados por cron cada 15 min.',
  },
  {
    id: 'welcome_email',
    name: 'Email de Bienvenida (Registro)',
    icon: Mail,
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-50',
    description: 'Se envia automaticamente cuando un nuevo usuario se registra en DentalSpot (ya tiene cuenta).',
    trigger: 'Al registrarse',
    delay: 'Inmediato',
    template: 'Bienvenida',
    implementation: 'Edge Function: on-user-created',
    status: true,
    stats: { sent: null, openRate: null },
    note: 'Implementado via trigger de Supabase Auth + Edge Function.',
  },
  {
    id: 'feedback_popup',
    name: 'Popup de Feedback (7 días)',
    icon: ThumbsUp,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    description: 'Muestra un popup pidiendo feedback al usuario activo después de 7 días de uso.',
    trigger: '7 días después del registro',
    delay: '7 días',
    template: 'Popup interno',
    implementation: 'FeedbackPopup.jsx + localStorage',
    status: true,
    stats: { sent: null, openRate: null },
    note: 'Activo en el frontend. Controlado por fecha de creación de cuenta vs fecha actual.',
  },
  {
    id: 'subscription_expiry',
    name: 'Recordatorio de Vencimiento',
    icon: Bell,
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50',
    description: 'Envía un email de recordatorio 7 días y 1 día antes de que venza la suscripción.',
    trigger: '7 días y 1 día antes del vencimiento',
    delay: 'D-7 y D-1',
    template: 'Recordatorio de renovación',
    implementation: 'Cron job + Edge Function',
    status: false,
    stats: { sent: null, openRate: null },
    note: 'Pendiente de implementación. Requiere cron job que revise subscriptions diariamente.',
  },
  {
    id: 'retargeting_pixel',
    name: 'Retargeting Meta Ads (Pixel)',
    icon: RefreshCw,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    description: 'Audiencias automaticas de retargeting basadas en el Pixel: visitantes que no se registraron (Landing, Pricing, Blog).',
    trigger: 'Pixel detecta visita sin CompleteRegistration',
    delay: 'Automatico (Meta)',
    template: 'Custom Audiences (Meta Ads)',
    implementation: 'Meta Pixel + create_website_audience API',
    status: true,
    stats: { sent: null, openRate: null },
    note: 'Activo. Crear audiencias desde Meta Ads → Audiencias → Retargeting Automatico.',
  },
  {
    id: 'retargeting_7days',
    name: 'Retargeting Email (Leads 7+ dias)',
    icon: RefreshCw,
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-50',
    description: 'Email automatico a leads que llevan 7+ dias en estado "nuevo" sin ser contactados.',
    trigger: '7 dias en estado "nuevo"',
    delay: '7 dias',
    template: 'Oferta de Retargeting',
    implementation: 'Cron job + Edge Function',
    status: false,
    stats: { sent: null, openRate: null },
    note: 'Pendiente. Requiere cron diario que filtre leads.status = "new" AND created_at < now-7d.',
  },
  {
    id: 'cart_abandonment',
    name: 'Abandono de Checkout',
    icon: ShoppingCart,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    description: 'Recordatorio a usuarios que iniciaron el proceso de pago pero no completaron la suscripción.',
    trigger: '2 horas después de iniciar checkout sin completar',
    delay: '2 horas',
    template: 'Recuperación de carrito',
    implementation: 'Webhook de Mercado Pago + Edge Function',
    status: false,
    stats: { sent: null, openRate: null },
    note: 'Pendiente. Requiere integración con webhook de estado de pago pendiente.',
  },
  {
    id: 'inactivity_30days',
    name: 'Re-activación (30 días inactivo)',
    icon: Clock,
    iconColor: 'text-gray-600',
    iconBg: 'bg-gray-50',
    description: 'Email a usuarios con suscripción activa que no han iniciado sesión en 30 días.',
    trigger: '30 días sin login',
    delay: '30 días',
    template: 'Re-activación',
    implementation: 'Cron job + Edge Function',
    status: false,
    stats: { sent: null, openRate: null },
    note: 'Pendiente. Requiere cron que compare last_sign_in_at de auth.users.',
  },
];

const AutomationPage = () => {
  const { toast } = useToast();
  const [automations, setAutomations] = useState(AUTOMATIONS);

  const toggleStatus = (id) => {
    setAutomations(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const next = !a.status;
        if (next && !a.implementation.includes('Edge Function: ') && !a.implementation.includes('FeedbackPopup')) {
          toast({
            variant: 'destructive',
            title: 'No disponible',
            description: `Esta automatización requiere implementación adicional: ${a.implementation}`,
          });
          return a;
        }
        toast({ title: next ? `"${a.name}" activada` : `"${a.name}" desactivada` });
        return { ...a, status: next };
      })
    );
  };

  const activeCount = automations.filter(a => a.status).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" /> Automatizaciones
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-700">{activeCount} activas</Badge>
          <Badge variant="outline">{automations.length - activeCount} pendientes</Badge>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">Sobre las automatizaciones</p>
          <p>Las automatizaciones activas ya están implementadas en el sistema. Las pendientes requieren desarrollo adicional (Edge Functions o cron jobs) antes de poder activarse.</p>
        </div>
      </div>

      <div className="space-y-4">
        {automations.map(a => {
          const Icon = a.icon;
          return (
            <Card key={a.id} className={a.status ? 'border-green-200' : 'border-gray-200'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg shrink-0 ${a.iconBg}`}>
                    <Icon className={`h-5 w-5 ${a.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{a.name}</h3>
                          <Badge className={a.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                            {a.status ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                      </div>
                      <button
                        onClick={() => toggleStatus(a.id)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          a.status ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        role="switch"
                        aria-checked={a.status}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                            a.status ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Disparo</p>
                        <p className="text-xs font-medium text-gray-700 mt-0.5">{a.trigger}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Demora</p>
                        <p className="text-xs font-medium text-gray-700 mt-0.5">{a.delay}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Template</p>
                        <p className="text-xs font-medium text-gray-700 mt-0.5">{a.template}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Implementación</p>
                        <p className="text-xs font-medium text-gray-700 mt-0.5 truncate" title={a.implementation}>{a.implementation}</p>
                      </div>
                    </div>

                    {a.note && (
                      <p className="text-[11px] text-gray-400 mt-2 italic">{a.note}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AutomationPage;
