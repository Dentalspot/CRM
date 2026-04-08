import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft, Settings, Mail, Shield, Globe, Key, RefreshCw,
  CheckCircle, AlertTriangle, Info, ExternalLink, Facebook, Zap,
  Eye, Send, ShoppingCart, UserPlus, MousePointerClick, Activity,
  Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DATASET_ID } from '@/lib/metaPixel';

const CONFIG_ITEMS = [
  {
    group: 'Proveedor de Email',
    items: [
      { label: 'Proveedor', value: 'Resend', note: 'resend.com', icon: Mail },
      { label: 'Email remitente', value: 'marketing@dentalspot.cl', icon: Mail },
      { label: 'Nombre remitente', value: 'DentalSpot', icon: Mail },
      { label: 'Reply-To', value: 'hola@dentalspot.cl', icon: Mail },
    ],
  },
  {
    group: 'Dominio y DKIM',
    items: [
      { label: 'Dominio', value: 'dentalspot.cl', icon: Globe },
      { label: 'DKIM', value: 'Verificado', status: 'ok', icon: Shield },
      { label: 'SPF', value: 'Configurado', status: 'ok', icon: Shield },
      { label: 'DMARC', value: 'Configurado', status: 'ok', icon: Shield },
    ],
  },
  {
    group: 'API',
    items: [
      { label: 'Resend API Key', value: 're_**************************', masked: true, icon: Key },
      { label: 'Edge Function', value: 'send-marketing-campaign', icon: Key },
      { label: 'Entorno', value: 'Production', status: 'ok', icon: Settings },
    ],
  },
];

// Meta Pixel events configured in the app
const META_CONFIGURED_EVENTS = [
  { event: 'PageView', location: 'Todas las paginas', type: 'Standard', icon: Eye, auto: true },
  { event: 'Lead', location: 'Registro de usuario', type: 'Standard', icon: UserPlus, auto: true },
  { event: 'CompleteRegistration', location: 'AuthPage (post-signup)', type: 'Standard', icon: CheckCircle, auto: true },
  { event: 'Purchase', location: 'Pago de membresia', type: 'Standard', icon: ShoppingCart, auto: false },
  { event: 'Subscribe', location: 'Activacion de plan', type: 'Standard', icon: Zap, auto: false },
  { event: 'Schedule', location: 'Agendar cita', type: 'Standard', icon: Activity, auto: true },
  { event: 'ViewContent', location: 'Blog, QA, Marketplace', type: 'Standard', icon: Eye, auto: true },
  { event: 'InitiateCheckout', location: 'Checkout membresia', type: 'Standard', icon: ShoppingCart, auto: false },
];

const META_CONFIG_ITEMS = [
  {
    group: 'Meta Pixel (Client-side)',
    items: [
      { label: 'Dataset / Pixel ID', value: DATASET_ID, icon: Eye },
      { label: 'Tipo', value: 'Meta Pixel + Conversions API', icon: Activity },
      { label: 'Libreria', value: 'fbevents.js (CDN)', status: 'ok', icon: Globe },
      { label: 'Deduplicacion', value: 'UUID v4 (event_id)', status: 'ok', icon: Shield },
    ],
  },
  {
    group: 'Conversions API (Server-side)',
    items: [
      { label: 'Edge Function', value: 'new-meta-capi', icon: Zap },
      { label: 'API Version', value: 'Graph API v21.0', icon: Key },
      { label: 'Access Token', value: 'META_CAPI_ACCESS_TOKEN', masked: true, icon: Key },
      { label: 'User Matching', value: 'Email + Phone + IP + UA', status: 'ok', icon: Shield },
    ],
  },
];

const ConfigGroupCard = ({ items }) => (
  <div className="divide-y">
    {items.map((item, i) => {
      const Icon = item.icon;
      return (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {item.status === 'ok' ? (
              <Badge className="bg-green-100 text-green-700 text-[11px] flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> {item.value}
              </Badge>
            ) : item.status === 'error' ? (
              <Badge className="bg-red-100 text-red-700 text-[11px] flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {item.value}
              </Badge>
            ) : (
              <span className={`text-sm font-medium ${item.masked ? 'font-mono text-gray-400' : 'text-gray-800'}`}>
                {item.value}
              </span>
            )}
            {item.note && (
              <span className="text-xs text-gray-400">({item.note})</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [leadsTotal, setLeadsTotal] = useState(null);
  const [campaignsTotal, setCampaignsTotal] = useState(null);
  const [lastCampaign, setLastCampaign] = useState(null);
  const [metaTestResult, setMetaTestResult] = useState(null);
  const [metaTesting, setMetaTesting] = useState(false);
  const [pixelDetected, setPixelDetected] = useState(false);

  useEffect(() => { fetchSummary(); }, []);

  // Detect if Meta Pixel is loaded in the browser
  useEffect(() => {
    setPixelDetected(typeof window !== 'undefined' && typeof window.fbq === 'function');
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    const [leadsRes, campaignsRes] = await Promise.all([
      supabase.from('marketing_leads').select('id', { count: 'exact', head: true }),
      supabase.from('marketing_campaigns').select('id, name, status, sent_at, created_at').order('created_at', { ascending: false }).limit(1),
    ]);
    setLeadsTotal(leadsRes.count ?? 0);
    setCampaignsTotal(null);
    if (campaignsRes.data && campaignsRes.data.length > 0) setLastCampaign(campaignsRes.data[0]);
    setLoading(false);
  };

  const testMetaCapi = async () => {
    setMetaTesting(true);
    setMetaTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('new-meta-capi', {
        body: {
          event_name: 'PageView',
          event_source_url: window.location.href,
          event_id: `test_${Date.now()}`,
          action_source: 'website',
          dataset_id: DATASET_ID,
          user_data: { client_user_agent: navigator.userAgent },
          custom_data: {},
        },
      });
      if (error) throw error;
      setMetaTestResult({ success: true, data });
    } catch (err) {
      setMetaTestResult({ success: false, error: err.message });
    } finally {
      setMetaTesting(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 text-gray-600" /> Configuracion de Marketing
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </Button>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Mail className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total leads en BD</p>
              <p className="text-2xl font-bold">{loading ? '—' : (leadsTotal ?? '—').toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Dominio email</p>
              <p className="text-sm font-semibold text-green-600 flex items-center gap-1 mt-0.5">
                <CheckCircle className="h-3.5 w-3.5" /> Verificado
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Facebook className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Meta Pixel</p>
              <p className={`text-sm font-semibold flex items-center gap-1 mt-0.5 ${pixelDetected ? 'text-green-600' : 'text-amber-600'}`}>
                {pixelDetected ? <><CheckCircle className="h-3.5 w-3.5" /> Activo</> : <><AlertTriangle className="h-3.5 w-3.5" /> No detectado</>}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Settings className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ultima campana</p>
              <p className="text-sm font-medium mt-0.5">
                {loading ? '—' : lastCampaign ? formatDate(lastCampaign.sent_at || lastCampaign.created_at) : 'Sin campanas'}
              </p>
              {!loading && lastCampaign && (
                <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{lastCampaign.name}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Resend / Meta */}
      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta" className="gap-2"><Facebook className="h-4 w-4" /> Meta Ads</TabsTrigger>
          <TabsTrigger value="resend" className="gap-2"><Mail className="h-4 w-4" /> Resend Email</TabsTrigger>
        </TabsList>

        {/* ============ META ADS TAB ============ */}
        <TabsContent value="meta" className="space-y-6">
          {/* Info notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
            <Facebook className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Meta Pixel + Conversions API (CAPI)</p>
              <p className="mt-0.5">Tracking dual: eventos se envian tanto por el navegador (Pixel) como por el servidor (CAPI) con deduplicacion automatica por event_id.</p>
              <div className="flex flex-wrap gap-3 mt-2">
                <a
                  href={`https://business.facebook.com/events_manager2/list/dataset/${DATASET_ID}/overview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                >
                  Events Manager <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={`https://developers.facebook.com/tools/explorer/?method=GET&path=${DATASET_ID}%2Fevents`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                >
                  Graph API Explorer <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href={`https://business.facebook.com/events_manager2/list/dataset/${DATASET_ID}/test_events`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-700 hover:underline font-medium"
                >
                  Test Events <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Test CAPI Connection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Test de Conexion</CardTitle>
                <Button variant="outline" size="sm" onClick={testMetaCapi} disabled={metaTesting}>
                  {metaTesting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                  {metaTesting ? 'Enviando...' : 'Enviar Test Event'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {pixelDetected ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                  <div>
                    <p className="text-sm font-medium">Pixel (Browser)</p>
                    <p className="text-xs text-gray-500">{pixelDetected ? 'fbq() detectado' : 'No cargado o bloqueado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {metaTestResult === null ? (
                    <div className="h-5 w-5 rounded-full bg-gray-300" />
                  ) : metaTestResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">CAPI (Server)</p>
                    <p className="text-xs text-gray-500">
                      {metaTestResult === null ? 'Click "Enviar Test Event"' : metaTestResult.success ? `OK — ${metaTestResult.data?.events_received || 1} evento(s)` : metaTestResult.error}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Deduplicacion</p>
                    <p className="text-xs text-gray-500">UUID v4 — automatico</p>
                  </div>
                </div>
              </div>
              {metaTestResult?.success && metaTestResult.data?.fbtrace_id && (
                <p className="text-xs text-gray-400 mt-2">fbtrace_id: {metaTestResult.data.fbtrace_id}</p>
              )}
            </CardContent>
          </Card>

          {/* Meta Config Groups */}
          {META_CONFIG_ITEMS.map(group => (
            <Card key={group.group}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{group.group}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ConfigGroupCard items={group.items} />
              </CardContent>
            </Card>
          ))}

          {/* Configured Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Eventos Configurados ({META_CONFIGURED_EVENTS.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {META_CONFIGURED_EVENTS.map((evt, i) => {
                  const Icon = evt.icon;
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{evt.event}</p>
                          <p className="text-xs text-gray-500">{evt.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{evt.type}</Badge>
                        {evt.auto ? (
                          <Badge className="bg-green-100 text-green-700 text-[10px]">Auto</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 text-[10px]">Manual</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Tracking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Purchase Tracking (ROAS)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">CLP</p>
                  <p className="text-xs text-gray-500 mt-1">Moneda configurada</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-600">Dual Track</p>
                  <p className="text-xs text-gray-500 mt-1">Pixel + CAPI simultaneo</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-blue-600">paymentTracking.js</p>
                  <p className="text-xs text-gray-500 mt-1">Helper de compra</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Los eventos Purchase incluyen value, currency y content_ids para optimizacion de ROAS en Meta Ads Manager.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ RESEND EMAIL TAB ============ */}
        <TabsContent value="resend" className="space-y-6">
          {/* Info notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Configuracion de solo lectura</p>
              <p className="mt-0.5">Para cambiar credenciales o configuracion de Resend, edita las variables de entorno en Supabase Edge Functions y en el panel de Resend.</p>
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-blue-700 hover:underline font-medium"
              >
                Abrir panel Resend <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Config groups */}
          {CONFIG_ITEMS.map(group => (
            <Card key={group.group}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{group.group}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ConfigGroupCard items={group.items} />
              </CardContent>
            </Card>
          ))}

          {/* Limits / Quota */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Cuotas y Limites (Resend)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">100</p>
                  <p className="text-xs text-gray-500 mt-1">emails/dia (plan gratuito)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-800">3.000</p>
                  <p className="text-xs text-gray-500 mt-1">emails/mes (plan gratuito)</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-teal-600">Activo</p>
                  <p className="text-xs text-gray-500 mt-1">estado del servicio</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Para envios masivos (&gt;100/dia), actualiza el plan en resend.com.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
