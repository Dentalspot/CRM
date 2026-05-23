import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TimePicker from '@/components/ui/time-picker';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Send, Plus, RefreshCw, Mail, Clock, CheckCircle,
  AlertTriangle, X, Eye, Loader2, Users, Play, Pencil, Save,
  Zap, Calendar, Timer, GitBranch, UserPlus, UserMinus, Trash2,
  Copy, ChevronDown, ChevronUp, Settings, FileText
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { marketingApi } from '../api/marketingApi';
import { sanitizeHTML } from '@/lib/utils/sanitize';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  sent: 'bg-green-100 text-green-700',
  paused: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  sending: 'bg-blue-100 text-blue-700',
};

const SEGMENTS = [
  { value: 'all_with_email', label: 'Todos con email' },
  { value: 'new', label: 'Leads nuevos' },
  { value: 'contacted', label: 'Contactados' },
  { value: 'in_conversation', label: 'En conversacion' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'registered', label: 'Registrados en DentalSpot' },
];

const TRIGGERS = [
  { value: 'manual', label: 'Manual (enviar cuando quiera)', icon: '✋' },
  { value: 'on_register', label: 'Al registrarse en DentalSpot', icon: '🚀' },
  { value: 'on_tag_added', label: 'Al agregar a un embudo', icon: '🏷️' },
  { value: 'on_import', label: 'Al importar nuevo lead', icon: '📥' },
  { value: 'on_inactive_30d', label: 'Inactivo 30+ dias', icon: '💤' },
  { value: 'on_purchase', label: 'Despues de una compra', icon: '🛒' },
  { value: 'scheduled_date', label: 'Fecha programada', icon: '📅' },
  { value: 'recurring', label: 'Recurrente (semanal/mensual)', icon: '🔄' },
];

const INTERVALS = [
  { value: 'daily', label: 'Cada dia' },
  { value: 'every_3_days', label: 'Cada 3 dias' },
  { value: 'weekly', label: 'Cada semana' },
  { value: 'biweekly', label: 'Cada 2 semanas' },
  { value: 'monthly', label: 'Cada mes' },
];

const FUNNEL_GROUPS = {
  afi: { label: 'AFI — Programa Fundadoras', icon: '🏅', color: 'border-l-emerald-500 bg-emerald-50/30' },
  onboarding: { label: 'Onboarding', icon: '🚀', color: 'border-l-teal-500 bg-teal-50/30' },
  cold: { label: 'Frio (Cold Outreach)', icon: '❄️', color: 'border-l-blue-500 bg-blue-50/30' },
  'ados-2': { label: 'ADOS-2', icon: '🧩', color: 'border-l-purple-500 bg-purple-50/30' },
  communicare: { label: 'Communicare', icon: '📦', color: 'border-l-amber-500 bg-amber-50/30' },
  estudiantes: { label: 'Estudiantes', icon: '🎓', color: 'border-l-indigo-500 bg-indigo-50/30' },
  reactivacion: { label: 'Reactivacion', icon: '🔄', color: 'border-l-orange-500 bg-orange-50/30' },
};

const SOURCES = ['supersalud', 'doctoralia', 'woocommerce', 'communicare', 'csv_import', 'manual', 'dentalspot'];

const CampaignsPage = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  // Edit/Create
  const [editCampaign, setEditCampaign] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [segmentCount, setSegmentCount] = useState(null);

  // Manage emails
  const [showEmailManager, setShowEmailManager] = useState(null);
  const [emailInput, setEmailInput] = useState('');

  // Templates for selector
  const [templates, setTemplates] = useState([]);

  // Collapsed groups
  const [collapsed, setCollapsed] = useState({});

  // Campaign analytics
  const [viewStats, setViewStats] = useState(null);
  const [statsData, setStatsData] = useState(null);

  const openStats = async (campaign) => {
    setViewStats(campaign);
    const { data } = await supabase
      .from('email_notifications')
      .select('id, recipient_email, status, sent_at, opened_at, clicked_at')
      .eq('campaign_id', campaign.id)
      .order('sent_at', { ascending: false })
      .limit(500);

    const recipients = data || [];
    setStatsData({
      total: recipients.length,
      sent: recipients.filter(r => r.status === 'sent' || r.status === 'delivered').length,
      delivered: recipients.filter(r => r.status === 'delivered').length,
      opened: recipients.filter(r => r.opened_at).length,
      clicked: recipients.filter(r => r.clicked_at).length,
      failed: recipients.filter(r => r.status === 'failed' || r.status === 'bounced').length,
      recipients,
    });
  };

  useEffect(() => {
    fetchCampaigns();
    marketingApi.fetchTemplates().then(data => setTemplates(data || [])).catch(() => {});
    // Auto-open editor if URL has template params (from TemplatesPage "Usar" button)
    const urlSubject = searchParams.get('subject');
    const urlBody = searchParams.get('body');
    if (urlSubject || urlBody) {
      setForm({
        name: '', subject: urlSubject || '', body_html: urlBody || '', segment: 'all_with_email',
        source_filter: '', tags_filter: [], campaign_type: 'one_time', trigger_type: 'manual',
        trigger_config: {}, delay_days: 0, send_time: '09:00', repeat_interval: '',
        sequence_group: '', sequence_order: 1, is_active: true, excluded_emails: [], included_emails: [],
      });
      setEditCampaign('new');
      setSearchParams({}, { replace: true });
    }
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from('marketing_campaigns').select('*').order('sequence_group').order('sequence_order');
    setCampaigns(data || []);
    setLoading(false);
  };

  const fetchCount = async (segment, source, tags) => {
    let q = supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('email', 'is', null).neq('status', 'unsubscribed');
    if (segment && segment !== 'all_with_email') q = q.eq('status', segment);
    if (source) q = q.eq('source', source);
    if (tags?.length) { for (const t of tags) q = q.contains('tags', JSON.stringify([t])); }
    const { count } = await q;
    setSegmentCount(count || 0);
  };

  // Open editor
  const openEditor = (campaign = null) => {
    if (campaign) {
      setForm({ ...campaign, tags_filter: campaign.tags_filter || [], excluded_emails: campaign.excluded_emails || [], included_emails: campaign.included_emails || [] });
      setEditCampaign(campaign);
    } else {
      setForm({
        name: '', subject: '', body_html: '', segment: 'all_with_email', source_filter: '',
        tags_filter: [], campaign_type: 'one_time', trigger_type: 'manual', trigger_config: {},
        delay_days: 0, send_time: '09:00', repeat_interval: '', sequence_group: '',
        sequence_order: 1, is_active: true, excluded_emails: [], included_emails: [],
      });
      setEditCampaign('new');
    }
    fetchCount(campaign?.segment, campaign?.source_filter, campaign?.tags_filter);
  };

  const saveForm = async () => {
    if (!form.name || !form.subject || !form.body_html) {
      toast({ variant: 'destructive', title: 'Campos requeridos', description: 'Nombre, asunto y cuerpo son obligatorios' });
      return;
    }
    setSaving(true);

    const payload = {
      name: form.name, subject: form.subject, body_html: form.body_html,
      segment: form.segment, source_filter: form.source_filter || null,
      tags_filter: form.tags_filter || [], campaign_type: form.campaign_type,
      trigger_type: form.trigger_type, trigger_config: form.trigger_config || {},
      delay_days: form.delay_days || 0, send_time: form.send_time || '09:00',
      repeat_interval: form.repeat_interval || null, sequence_group: form.sequence_group || null,
      sequence_order: form.sequence_order || 1, is_active: form.is_active,
      excluded_emails: form.excluded_emails || [], included_emails: form.included_emails || [],
      updated_at: new Date().toISOString(),
    };

    if (editCampaign === 'new') {
      const { data: { user } } = await supabase.auth.getUser();
      payload.created_by = user?.id;
      payload.status = 'draft';
      const { error } = await supabase.from('marketing_campaigns').insert(payload);
      if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); }
      else { toast({ title: 'Campana creada' }); }
    } else {
      const { error } = await supabase.from('marketing_campaigns').update(payload).eq('id', editCampaign.id);
      if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); }
      else { toast({ title: 'Campana actualizada' }); }
    }

    setSaving(false);
    setEditCampaign(null);
    fetchCampaigns();
  };

  const sendCampaign = async (id) => {
    setSending(id);
    try {
      await supabase.from('marketing_campaigns').update({ status: 'sending' }).eq('id', id);
      const { error } = await supabase.functions.invoke('send-marketing-campaign', { body: { campaign_id: id } });
      if (error) throw error;
      toast({ title: 'Campana enviada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
    setSending(null);
    fetchCampaigns();
  };

  const duplicateCampaign = async (c) => {
    const { id, created_at, updated_at, sent_at, sent_count, failed_count, recipient_count, status, ...rest } = c;
    const { error } = await supabase.from('marketing_campaigns').insert({ ...rest, name: `${c.name} (copia)`, status: 'draft' });
    if (!error) { toast({ title: 'Campana duplicada' }); fetchCampaigns(); }
  };

  const deleteCampaign = async (id) => {
    await supabase.from('marketing_campaigns').delete().eq('id', id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Campana eliminada' });
  };

  const toggleActive = async (id, current) => {
    await supabase.from('marketing_campaigns').update({ is_active: !current, status: !current ? 'active' : 'paused' }).eq('id', id);
    fetchCampaigns();
  };

  // Group by sequence_group
  const groups = {};
  campaigns.forEach(c => {
    const g = c.sequence_group || 'sin_grupo';
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Send className="h-6 w-6 text-primary" /> Campanas</h1>
          <Badge variant="outline">{campaigns.length} campanas</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => openEditor()}><Plus className="h-4 w-4 mr-1" /> Nueva Campana</Button>
        </div>
      </div>

      {/* Campaign list grouped by funnel */}
      {loading ? (
        <div className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : (
        Object.entries(groups).map(([group, items]) => {
          const info = FUNNEL_GROUPS[group] || { label: group, icon: '📧', color: 'border-l-gray-300' };
          const isCollapsed = collapsed[group];

          return (
            <Card key={group} className="overflow-hidden">
              <button onClick={() => setCollapsed(p => ({ ...p, [group]: !isCollapsed }))}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 border-l-4 ${info.color}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.icon}</span>
                  <span className="font-bold text-sm">{info.label}</span>
                  <Badge variant="outline" className="text-xs">{items.length} emails</Badge>
                  {items.some(i => i.trigger_type !== 'manual') && (
                    <Badge className="text-[10px] bg-green-100 text-green-700"><Zap className="h-2.5 w-2.5 mr-0.5" /> Automatizado</Badge>
                  )}
                </div>
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronUp className="h-4 w-4 text-gray-400" />}
              </button>

              {!isCollapsed && (
                <div className="divide-y">
                  {items.sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0)).map(c => (
                    <div key={c.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group border-l-4 ${info.color}`}>
                      {/* Sequence number */}
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                        {c.sequence_order || '—'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-sm truncate">{c.name}</p>
                          <Badge className={`text-[10px] ${STATUS_COLORS[c.status] || STATUS_COLORS.draft}`}>{c.status}</Badge>
                          {!c.is_active && <Badge className="text-[10px] bg-gray-200 text-gray-500">Pausada</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.subject}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                          {c.trigger_type && c.trigger_type !== 'manual' && (
                            <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5" /> {TRIGGERS.find(t => t.value === c.trigger_type)?.label}</span>
                          )}
                          {c.delay_days > 0 && <span className="flex items-center gap-0.5"><Timer className="h-2.5 w-2.5" /> +{c.delay_days} dias</span>}
                          {c.send_time && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {c.send_time}</span>}
                          {c.sent_count > 0 && <span className="text-green-600">{c.sent_count} enviados</span>}
                          {c.failed_count > 0 && <span className="text-red-500">{c.failed_count} fallidos</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Editar" onClick={() => openEditor(c)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Duplicar" onClick={() => duplicateCampaign(c)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        {(c.status === 'sent' || c.sent_count > 0) && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Ver stats" onClick={() => openStats(c)}>
                            <Eye className="h-3 w-3 text-blue-500" />
                          </Button>
                        )}
                        {c.status === 'draft' && (
                          <Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary" onClick={() => sendCampaign(c.id)} disabled={sending === c.id}>
                            {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" /> Enviar</>}
                          </Button>
                        )}
                        {c.campaign_type === 'sequence' && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={c.is_active ? 'Pausar' : 'Activar'}
                            onClick={() => toggleActive(c.id, c.is_active)}>
                            <Play className={`h-3 w-3 ${c.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" title="Eliminar" onClick={() => deleteCampaign(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* Editor Modal */}
      {editCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditCampaign(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {editCampaign === 'new' ? 'Nueva Campana' : 'Editar Campana'}
              </h2>
              <button onClick={() => setEditCampaign(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Nombre de la campana *</label>
                  <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: ADOS-2 Email 1 - Modulo" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">Asunto del email *</label>
                  <Input value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Ej: Evalua TEA con ADOS-2 digital en DentalSpot" />
                </div>
              </div>

              {/* Template selector */}
              {templates.length > 0 && (
                <div className="bg-purple-50/50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-700 flex items-center gap-1 mb-2">
                    <FileText className="h-3.5 w-3.5 text-purple-600" /> Cargar desde template
                  </label>
                  <select
                    value=""
                    onChange={e => {
                      const t = templates.find(tpl => tpl.id === e.target.value);
                      if (t) {
                        setForm(f => ({
                          ...f,
                          subject: t.subject_template || f.subject,
                          body_html: t.body_html_template || f.body_html,
                        }));
                      }
                    }}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  >
                    <option value="">Seleccionar template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.template_name} — {t.subject_template?.slice(0, 50)}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">Al seleccionar, se rellena el asunto y cuerpo HTML</p>
                </div>
              )}

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-700">Cuerpo HTML *</label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setPreviewMode(p => !p)}>
                    <Eye className="h-3 w-3 mr-1" /> {previewMode ? 'Editar' : 'Vista previa'}
                  </Button>
                </div>
                {previewMode ? (
                  <div className="border rounded p-4 min-h-[200px] bg-white prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHTML(form.body_html || '') }} />
                ) : (
                  <textarea rows={8} value={form.body_html || ''} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
                    className="w-full border rounded p-3 text-xs font-mono resize-y focus:ring-2 focus:ring-primary"
                    placeholder="<h2>Hola {{nombre}}</h2><p>...</p>" />
                )}
                <p className="text-[10px] text-gray-400 mt-1">Variables: {'{{nombre}}'}, {'{{ciudad}}'}, {'{{email}}'}, {'{{unsubscribe_url}}'}</p>
              </div>

              {/* Audience */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold flex items-center gap-1"><Users className="h-4 w-4" /> Audiencia</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Segmento</label>
                    <select value={form.segment || 'all_with_email'} onChange={e => { setForm(f => ({ ...f, segment: e.target.value })); fetchCount(e.target.value, form.source_filter, form.tags_filter); }}
                      className="w-full border rounded px-2 py-1.5 text-sm">
                      {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Filtrar por fuente</label>
                    <select value={form.source_filter || ''} onChange={e => { setForm(f => ({ ...f, source_filter: e.target.value })); fetchCount(form.segment, e.target.value, form.tags_filter); }}
                      className="w-full border rounded px-2 py-1.5 text-sm">
                      <option value="">Todas</option>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Filtrar por embudo (tags)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['ados-2', 'adir', 'tea', 'sensorial', 'marketplace', 'membership', 'newsletter'].map(tag => {
                      const active = (form.tags_filter || []).includes(tag);
                      return (
                        <button key={tag} onClick={() => {
                          const newTags = active ? form.tags_filter.filter(t => t !== tag) : [...(form.tags_filter || []), tag];
                          setForm(f => ({ ...f, tags_filter: newTags }));
                          fetchCount(form.segment, form.source_filter, newTags);
                        }} className={`text-xs px-2 py-1 rounded-full border ${active ? 'bg-primary border-primary text-primary' : 'border-gray-200 hover:bg-gray-100'}`}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{segmentCount !== null ? segmentCount.toLocaleString() : '...'}</span>
                  <span className="text-gray-500">destinatarios estimados</span>
                </div>

                {/* Include/Exclude specific emails */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 flex items-center gap-1 mb-1"><UserPlus className="h-3 w-3" /> Incluir emails adicionales</label>
                    <div className="flex gap-1">
                      <Input placeholder="email@ejemplo.com" value={emailInput} onChange={e => setEmailInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && emailInput.includes('@')) { setForm(f => ({ ...f, included_emails: [...(f.included_emails || []), emailInput.trim()] })); setEmailInput(''); } }}
                        className="text-xs" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(form.included_emails || []).map(e => (
                        <Badge key={e} variant="outline" className="text-[10px] gap-1 pr-1 bg-green-50">{e}
                          <button onClick={() => setForm(f => ({ ...f, included_emails: f.included_emails.filter(x => x !== e) }))}><X className="h-2.5 w-2.5" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 flex items-center gap-1 mb-1"><UserMinus className="h-3 w-3" /> Excluir emails</label>
                    <div className="flex gap-1">
                      <Input placeholder="excluir@ejemplo.com" value={''} onChange={() => {}}
                        onKeyDown={e => { if (e.key === 'Enter' && e.target.value.includes('@')) { setForm(f => ({ ...f, excluded_emails: [...(f.excluded_emails || []), e.target.value.trim()] })); e.target.value = ''; } }}
                        className="text-xs" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(form.excluded_emails || []).map(e => (
                        <Badge key={e} variant="outline" className="text-[10px] gap-1 pr-1 bg-red-50">{e}
                          <button onClick={() => setForm(f => ({ ...f, excluded_emails: f.excluded_emails.filter(x => x !== e) }))}><X className="h-2.5 w-2.5" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Automation */}
              <div className="bg-purple-50/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-bold flex items-center gap-1"><Zap className="h-4 w-4 text-purple-600" /> Automatizacion</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Trigger (disparo)</label>
                    <select value={form.trigger_type || 'manual'} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
                      className="w-full border rounded px-2 py-1.5 text-sm">
                      {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Tipo</label>
                    <select value={form.campaign_type || 'one_time'} onChange={e => setForm(f => ({ ...f, campaign_type: e.target.value }))}
                      className="w-full border rounded px-2 py-1.5 text-sm">
                      <option value="one_time">Envio unico</option>
                      <option value="sequence">Secuencia (embudo)</option>
                      <option value="recurring">Recurrente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Esperar X dias</label>
                    <Input type="number" min="0" value={form.delay_days || 0} onChange={e => setForm(f => ({ ...f, delay_days: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Hora de envio</label>
                    <TimePicker value={form.send_time || '09:00'} onChange={(v) => setForm(f => ({ ...f, send_time: v }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Repetir cada</label>
                    <select value={form.repeat_interval || ''} onChange={e => setForm(f => ({ ...f, repeat_interval: e.target.value }))}
                      className="w-full border rounded px-2 py-1.5 text-sm">
                      <option value="">No repetir</option>
                      {INTERVALS.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                </div>

                {form.campaign_type === 'sequence' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Grupo de secuencia</label>
                      <select value={form.sequence_group || ''} onChange={e => setForm(f => ({ ...f, sequence_group: e.target.value }))}
                        className="w-full border rounded px-2 py-1.5 text-sm">
                        <option value="">Sin grupo</option>
                        {Object.entries(FUNNEL_GROUPS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">Orden en secuencia</label>
                      <Input type="number" min="1" value={form.sequence_order || 1} onChange={e => setForm(f => ({ ...f, sequence_order: parseInt(e.target.value) || 1 }))} />
                    </div>
                  </div>
                )}

                {form.trigger_type === 'scheduled_date' && (
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Fecha programada</label>
                    <Input type="datetime-local" value={form.scheduled_at || ''} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t bg-gray-50 sticky bottom-0">
              <Button variant="outline" onClick={() => setEditCampaign(null)}>Cancelar</Button>
              <Button className="bg-primary hover:bg-primary" onClick={saveForm} disabled={saving}>
                {saving ? 'Guardando...' : <><Save className="h-4 w-4 mr-1" /> Guardar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {viewStats && statsData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setViewStats(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2"><Eye className="h-5 w-5 text-blue-600" /> Stats: {viewStats.name}</h2>
                <p className="text-xs text-gray-500">{viewStats.subject}</p>
              </div>
              <button onClick={() => setViewStats(null)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-5 gap-3 p-5">
              {[
                { label: 'Enviados', value: statsData.sent, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Entregados', value: statsData.delivered, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Abiertos', value: statsData.opened, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Clicks', value: statsData.clicked, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Fallidos', value: statsData.failed, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(k => (
                <div key={k.label} className={`p-3 rounded-lg ${k.bg} text-center`}>
                  <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                  <p className="text-[10px] text-gray-500">{k.label}</p>
                  {statsData.total > 0 && <p className="text-[10px] text-gray-400">{Math.round(k.value / statsData.total * 100)}%</p>}
                </div>
              ))}
            </div>

            {/* Recipient list */}
            <div className="px-5 pb-5">
              <p className="text-sm font-medium mb-2">Destinatarios ({statsData.total})</p>
              <div className="max-h-64 overflow-y-auto border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-500">
                      <th className="p-2">Email</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2">Enviado</th>
                      <th className="p-2">Abierto</th>
                      <th className="p-2">Click</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {statsData.recipients.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="p-2 font-mono">{r.recipient_email}</td>
                        <td className="p-2">
                          {r.opened_at ? <Badge className="text-[9px] bg-green-100 text-green-700">Abierto</Badge> :
                            r.status === 'delivered' ? <Badge className="text-[9px] bg-blue-100 text-blue-700">Entregado</Badge> :
                            r.status === 'sent' ? <Badge className="text-[9px] bg-gray-100 text-gray-700">Enviado</Badge> :
                            <Badge className="text-[9px] bg-red-100 text-red-700">{r.status}</Badge>}
                        </td>
                        <td className="p-2 text-gray-400">{r.sent_at ? new Date(r.sent_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                        <td className="p-2">{r.opened_at ? <span className="text-green-600">{new Date(r.opened_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> : '—'}</td>
                        <td className="p-2">{r.clicked_at ? <span className="text-purple-600">{new Date(r.clicked_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</span> : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
