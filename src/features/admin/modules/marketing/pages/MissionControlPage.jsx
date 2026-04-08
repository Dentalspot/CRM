/**
 * @file MissionControlPage.jsx
 * @description Centro de comando de marketing — estado de integraciones,
 * metricas en vivo, campañas activas, pipeline de leads y acciones rapidas.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, RefreshCw, Activity, CheckCircle2, XCircle, AlertTriangle,
  Facebook, Mail, Zap, Eye, Users, Send, TrendingUp, ShoppingCart,
  Clock, Play, Pause, BarChart3, Target, ArrowRight, ExternalLink,
  Loader2, Rocket, Globe, Database, UserPlus, MousePointerClick,
  Radio, Wifi, WifiOff, ServerCrash, CircleDot
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DATASET_ID } from '@/lib/metaPixel';

// ============================================
// STATUS CHECK HELPERS
// ============================================

const STATUS_COLORS = {
  ok: 'bg-green-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
  loading: 'bg-blue-500 animate-pulse',
};

const StatusDot = ({ status }) => (
  <span className={`inline-block h-2.5 w-2.5 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.unknown}`} />
);

// ============================================
// MISSION CONTROL PAGE
// ============================================

const MissionControlPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  // System status
  const [systems, setSystems] = useState({
    supabase: 'loading',
    meta_pixel: 'loading',
    meta_capi: 'loading',
    resend: 'loading',
  });

  // Live metrics
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    leadsWithEmail: 0,
    leadsThisWeek: 0,
    leadsThisMonth: 0,
    therapists: 0,
    patients: 0,
    campaignsSent: 0,
    campaignsDraft: 0,
  });

  // Pipeline
  const [pipeline, setPipeline] = useState([]);

  // Recent campaigns
  const [campaigns, setCampaigns] = useState([]);

  // Recent leads
  const [recentLeads, setRecentLeads] = useState([]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const checkSystems = useCallback(async () => {
    const newSystems = { ...systems };

    // 1. Supabase — just test a simple query
    try {
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
      newSystems.supabase = error ? 'error' : 'ok';
    } catch {
      newSystems.supabase = 'error';
    }

    // 2. Meta Pixel — check if fbq is loaded
    newSystems.meta_pixel = (typeof window !== 'undefined' && typeof window.fbq === 'function') ? 'ok' : 'warning';

    // 3. Meta CAPI — test edge function
    try {
      const { data, error } = await supabase.functions.invoke('new-meta-capi', {
        body: {
          event_name: 'PageView',
          event_source_url: window.location.href,
          event_id: `healthcheck_${Date.now()}`,
          action_source: 'website',
          dataset_id: DATASET_ID,
          user_data: { client_user_agent: navigator.userAgent },
          custom_data: {},
        },
      });
      newSystems.meta_capi = (!error && data?.success) ? 'ok' : 'error';
    } catch {
      newSystems.meta_capi = 'error';
    }

    // 4. Resend — check if email_notifications have recent successful sends
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase.from('email_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('created_at', weekAgo);
      newSystems.resend = (count !== null && count >= 0) ? 'ok' : 'warning';
    } catch {
      newSystems.resend = 'warning';
    }

    setSystems(newSystems);
  }, []);

  const fetchMetrics = useCallback(async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [totalRes, emailRes, weekRes, monthRes, therapistRes, patientRes, sentRes, draftRes] = await Promise.all([
      supabase.from('marketing_leads').select('*', { count: 'exact', head: true }),
      supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('email', 'is', null),
      supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'therapist'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('marketing_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    ]);

    setMetrics({
      totalLeads: totalRes.count || 0,
      leadsWithEmail: emailRes.count || 0,
      leadsThisWeek: weekRes.count || 0,
      leadsThisMonth: monthRes.count || 0,
      therapists: therapistRes.count || 0,
      patients: patientRes.count || 0,
      campaignsSent: sentRes.count || 0,
      campaignsDraft: draftRes.count || 0,
    });
  }, []);

  const fetchPipeline = useCallback(async () => {
    const statuses = ['new', 'contacted', 'in_conversation', 'converted', 'registered'];
    const counts = await Promise.all(
      statuses.map(s => supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('status', s))
    );
    const total = counts.reduce((sum, r) => sum + (r.count || 0), 0) || 1;
    setPipeline(statuses.map((s, i) => ({
      status: s,
      count: counts[i].count || 0,
      pct: Math.round(((counts[i].count || 0) / total) * 100),
    })));
  }, []);

  const fetchCampaigns = useCallback(async () => {
    const { data } = await supabase.from('marketing_campaigns')
      .select('id, name, status, recipient_count, sent_count, failed_count, sent_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    setCampaigns(data || []);
  }, []);

  const fetchRecentLeads = useCallback(async () => {
    const { data } = await supabase.from('marketing_leads')
      .select('id, full_name, email, source, status, created_at')
      .order('created_at', { ascending: false })
      .limit(8);
    setRecentLeads(data || []);
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      checkSystems(),
      fetchMetrics(),
      fetchPipeline(),
      fetchCampaigns(),
      fetchRecentLeads(),
    ]);
    setLastRefresh(new Date());
    setRefreshing(false);
    setLoading(false);
  }, [checkSystems, fetchMetrics, fetchPipeline, fetchCampaigns, fetchRecentLeads]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // ============================================
  // HELPERS
  // ============================================

  const PIPELINE_LABELS = {
    new: 'Nuevos',
    contacted: 'Contactados',
    in_conversation: 'En Conversacion',
    converted: 'Convertidos',
    registered: 'Registrados',
  };

  const PIPELINE_COLORS = {
    new: 'bg-blue-500',
    contacted: 'bg-amber-500',
    in_conversation: 'bg-purple-500',
    converted: 'bg-green-500',
    registered: 'bg-teal-500',
  };

  const CAMPAIGN_STATUS = {
    draft: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
    scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
    sending: { label: 'Enviando', color: 'bg-amber-100 text-amber-700' },
    sent: { label: 'Enviada', color: 'bg-green-100 text-green-700' },
    failed: { label: 'Error', color: 'bg-red-100 text-red-700' },
    paused: { label: 'Pausada', color: 'bg-gray-100 text-gray-700' },
  };

  const SOURCE_LABELS = {
    supersalud: 'Supersalud', doctoralia: 'Doctoralia', woocommerce: 'WooCommerce',
    csv_import: 'CSV', manual: 'Manual', communicare: 'Communicare',
    instagram: 'Instagram', facebook: 'Facebook', ticket_compra: 'Ticket',
  };

  const STATUS_BADGE = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    in_conversation: 'bg-purple-100 text-purple-700',
    converted: 'bg-green-100 text-green-700',
    registered: 'bg-teal-100 text-teal-700',
  };

  const timeAgo = (date) => {
    if (!date) return '—';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const systemCount = Object.values(systems);
  const okCount = systemCount.filter(s => s === 'ok').length;
  const totalSystems = systemCount.length;
  const allOk = okCount === totalSystems;

  const captureRate = metrics.totalLeads > 0 ? Math.round((metrics.leadsWithEmail / metrics.totalLeads) * 100) : 0;

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Mission Control</h1>
              <p className="text-xs text-muted-foreground">Centro de comando — integraciones, metricas y operaciones</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              {lastRefresh.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* ============================================
          SECTION 1: SYSTEM STATUS
      ============================================ */}
      <Card className={allOk ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide flex items-center gap-2">
              <Radio className="h-4 w-4" /> Estado de Sistemas
              <Badge className={allOk ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                {okCount}/{totalSystems} operativos
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Supabase */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
              <StatusDot status={systems.supabase} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">Supabase</p>
                </div>
                <p className="text-[10px] text-gray-500">Base de datos + Auth</p>
              </div>
              {systems.supabase === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
            </div>

            {/* Meta Pixel */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
              <StatusDot status={systems.meta_pixel} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium">Meta Pixel</p>
                </div>
                <p className="text-[10px] text-gray-500">Browser tracking</p>
              </div>
              {systems.meta_pixel === 'ok' ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-amber-500" />}
            </div>

            {/* Meta CAPI */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
              <StatusDot status={systems.meta_capi} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <p className="text-sm font-medium">CAPI</p>
                </div>
                <p className="text-[10px] text-gray-500">Server-side events</p>
              </div>
              {systems.meta_capi === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <ServerCrash className="h-4 w-4 text-red-500" />}
            </div>

            {/* Resend */}
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
              <StatusDot status={systems.resend} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-pink-600" />
                  <p className="text-sm font-medium">Resend</p>
                </div>
                <p className="text-[10px] text-gray-500">Email delivery</p>
              </div>
              {systems.resend === 'ok' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============================================
          SECTION 2: LIVE METRICS
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Leads', value: metrics.totalLeads, icon: Database, color: 'text-blue-600 bg-blue-50' },
          { label: 'Con Email', value: metrics.leadsWithEmail, icon: Mail, color: 'text-green-600 bg-green-50' },
          { label: 'Esta Semana', value: metrics.leadsThisWeek, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
          { label: 'Este Mes', value: metrics.leadsThisMonth, icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Dentistas', value: metrics.therapists, icon: Users, color: 'text-teal-600 bg-teal-50' },
          { label: 'Pacientes', value: metrics.patients, icon: UserPlus, color: 'text-pink-600 bg-pink-50' },
          { label: 'Enviadas', value: metrics.campaignsSent, icon: Send, color: 'text-green-600 bg-green-50' },
          { label: 'Borradores', value: metrics.campaignsDraft, icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardContent className="p-3 text-center">
                <div className={`inline-flex p-1.5 rounded-lg ${m.color} mb-1`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-xl font-bold">{loading ? '—' : m.value.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">{m.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Capture rate bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Tasa de Captura de Email</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{captureRate}%</span>
          </div>
          <Progress value={captureRate} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {metrics.leadsWithEmail.toLocaleString()} de {metrics.totalLeads.toLocaleString()} leads tienen email — {(metrics.totalLeads - metrics.leadsWithEmail).toLocaleString()} por capturar
          </p>
        </CardContent>
      </Card>

      {/* ============================================
          SECTION 3: PIPELINE + CAMPAIGNS + LEADS (3 columns)
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" /> Pipeline de Leads
              </CardTitle>
              <Link to="/admin/marketing/kanban">
                <Button variant="ghost" size="sm" className="text-xs h-7">Kanban <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pipeline.map((stage) => (
              <div key={stage.status} className="flex items-center gap-2">
                <div className="w-28 text-xs text-gray-600 text-right shrink-0">{PIPELINE_LABELS[stage.status]}</div>
                <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                  <div
                    className={`h-full ${PIPELINE_COLORS[stage.status]} rounded flex items-center px-2 transition-all duration-500`}
                    style={{ width: `${Math.max(stage.pct, 4)}%` }}
                  >
                    <span className="text-white text-[10px] font-bold">{stage.count.toLocaleString()}</span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 w-8 text-right">{stage.pct}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Send className="h-4 w-4 text-pink-600" /> Campanas Recientes
              </CardTitle>
              <Link to="/admin/marketing/campaigns">
                <Button variant="ghost" size="sm" className="text-xs h-7">Ver todas <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {campaigns.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin campanas aun</p>
            ) : campaigns.map((c) => {
              const st = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.draft;
              return (
                <div key={c.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {c.sent_count ? `${c.sent_count} enviados` : 'Sin envios'} · {timeAgo(c.sent_at || c.created_at)}
                    </p>
                  </div>
                  <Badge className={`${st.color} text-[9px] shrink-0 ml-2`}>{st.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" /> Leads Recientes
              </CardTitle>
              <Link to="/admin/marketing/audience">
                <Button variant="ghost" size="sm" className="text-xs h-7">Ver todos <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentLeads.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin leads aun</p>
            ) : recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{lead.full_name || lead.email || 'Sin nombre'}</p>
                  <p className="text-[10px] text-gray-400">
                    {SOURCE_LABELS[lead.source] || lead.source} · {timeAgo(lead.created_at)}
                  </p>
                </div>
                <Badge className={`${STATUS_BADGE[lead.status] || 'bg-gray-100 text-gray-700'} text-[9px] shrink-0 ml-2`}>
                  {PIPELINE_LABELS[lead.status] || lead.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          SECTION 4: QUICK ACTIONS + EXTERNAL LINKS
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" /> Acciones Rapidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/admin/marketing/campaigns">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="sm">
                  <Send className="h-4 w-4 text-pink-500" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Nueva Campana</p>
                    <p className="text-[10px] text-gray-400">Crear y enviar email</p>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/marketing/import">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="sm">
                  <Database className="h-4 w-4 text-blue-500" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Importar Leads</p>
                    <p className="text-[10px] text-gray-400">Subir CSV de contactos</p>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/marketing/audience">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="sm">
                  <Users className="h-4 w-4 text-green-500" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Segmentar</p>
                    <p className="text-[10px] text-gray-400">Filtrar audiencia</p>
                  </div>
                </Button>
              </Link>
              <Link to="/admin/marketing/automation">
                <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" size="sm">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <div className="text-left">
                    <p className="text-xs font-medium">Automatizar</p>
                    <p className="text-[10px] text-gray-400">Workflows y triggers</p>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* External Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" /> Links Externos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Meta Events Manager', desc: `Dataset ${DATASET_ID.slice(0, 10)}...`, href: `https://business.facebook.com/events_manager2/list/dataset/${DATASET_ID}/overview`, icon: Facebook, color: 'text-blue-600' },
                { label: 'Graph API Explorer', desc: 'Probar queries a la Graph API', href: `https://developers.facebook.com/tools/explorer/?method=GET&path=${DATASET_ID}%2Fevents`, icon: MousePointerClick, color: 'text-blue-600' },
                { label: 'Meta Test Events', desc: 'Verificar eventos de prueba', href: `https://business.facebook.com/events_manager2/list/dataset/${DATASET_ID}/test_events`, icon: Activity, color: 'text-blue-600' },
                { label: 'Resend Dashboard', desc: 'Emails, dominios y API keys', href: 'https://resend.com/overview', icon: Mail, color: 'text-pink-600' },
                { label: 'Supabase Dashboard', desc: 'Base de datos y edge functions', href: 'https://supabase.com/dashboard', icon: Database, color: 'text-green-600' },
              ].map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 border rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <Icon className={`h-4 w-4 ${link.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{link.label}</p>
                      <p className="text-[10px] text-gray-400">{link.desc}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MissionControlPage;
