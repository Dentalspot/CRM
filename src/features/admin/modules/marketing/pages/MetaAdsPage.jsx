/**
 * @file MetaAdsPage.jsx
 * @description Admin page for managing Meta Ads — campaigns, ad sets, ads, insights.
 * All operations go through the meta-ads-manager edge function.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, RefreshCw, Facebook, TrendingUp, DollarSign, Eye, MousePointerClick,
  Users, Play, Pause, Trash2, Plus, BarChart3, Target, Loader2, AlertTriangle,
  CheckCircle2, XCircle, ExternalLink, Megaphone, Layers, ImageIcon, ArrowUpRight,
  PauseCircle, PlayCircle, Settings, Sparkles, Copy, Check, Wand2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { metaAdsApi } from '../api/metaAdsApi';
import { DATASET_ID } from '@/lib/metaPixel';

// ============================================
// STATUS / OBJECTIVE MAPS
// ============================================

const CAMPAIGN_STATUS = {
  ACTIVE: { label: 'Activa', color: 'bg-green-100 text-green-700', icon: PlayCircle },
  PAUSED: { label: 'Pausada', color: 'bg-amber-100 text-amber-700', icon: PauseCircle },
  DELETED: { label: 'Eliminada', color: 'bg-red-100 text-red-700', icon: XCircle },
  ARCHIVED: { label: 'Archivada', color: 'bg-gray-100 text-gray-700', icon: Settings },
};

const OBJECTIVES = {
  OUTCOME_AWARENESS: 'Reconocimiento',
  OUTCOME_ENGAGEMENT: 'Interaccion',
  OUTCOME_TRAFFIC: 'Trafico',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_APP_PROMOTION: 'App',
  OUTCOME_SALES: 'Ventas',
};

const DATE_PRESETS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last_7d', label: '7 dias' },
  { value: 'last_14d', label: '14 dias' },
  { value: 'last_30d', label: '30 dias' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'last_month', label: 'Mes pasado' },
  { value: 'last_90d', label: '90 dias' },
];

// ============================================
// HELPERS
// ============================================

const formatCurrency = (value, currency = 'CLP') => {
  if (!value) return '$0';
  // Meta returns amounts in cents for most currencies
  const amount = Number(value) / 100;
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
};

const formatNumber = (val) => {
  if (!val) return '0';
  return Number(val).toLocaleString('es-CL');
};

const formatPct = (val) => {
  if (!val) return '0%';
  return `${Number(val).toFixed(2)}%`;
};

// ============================================
// MAIN COMPONENT
// ============================================

// ============================================
// AUDIENCES TAB COMPONENT
// ============================================

const LEAD_SOURCES = [
  { value: 'all', label: 'Todas las fuentes' },
  { value: 'registered_therapists', label: 'Terapeutas Registrados (DentalSpot)' },
  { value: 'supersalud', label: 'Supersalud' },
  { value: 'doctoralia', label: 'Doctoralia' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'communicare', label: 'Communicare' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'manual', label: 'Manual' },
  { value: 'ticket_compra', label: 'Ticket de Compra' },
];

const LEAD_STATUSES = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'new', label: 'Nuevos' },
  { value: 'contacted', label: 'Contactados' },
  { value: 'in_conversation', label: 'En Conversacion' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'registered', label: 'Registrados' },
];

// ============================================
// RETARGETING PRESETS
// ============================================
const RETARGETING_PRESETS = [
  {
    key: 'landing_no_registro',
    title: 'Visitantes Landing (no registro)',
    desc: 'Visitaron /registro-profesional pero no completaron el registro.',
    url_contains: '/registro-profesional',
    retention_days: 30,
    icon: Target,
    color: '#00BCB5',
  },
  {
    key: 'pricing_no_registro',
    title: 'Visitantes Pricing (no registro)',
    desc: 'Vieron la pagina de precios pero no se registraron.',
    url_contains: '/planes',
    retention_days: 14,
    icon: DollarSign,
    color: '#ff74c3',
  },
  {
    key: 'blog_no_registro',
    title: 'Visitantes Blog (no registro)',
    desc: 'Lectores del blog que no se registraron.',
    url_contains: '/blog',
    retention_days: 60,
    icon: Eye,
    color: '#00BCB5',
  },
];

const AudiencesTab = ({ audiences, fetchAudiences, error, setError }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [audienceName, setAudienceName] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [includePhones, setIncludePhones] = useState(true);
  const [previewCount, setPreviewCount] = useState(null);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState('config'); // config | uploading | done
  const [uploadProgress, setUploadProgress] = useState('');
  const [retargetingLoading, setRetargetingLoading] = useState(null);
  const [retargetingSuccess, setRetargetingSuccess] = useState(null);
  const [csvExporting, setCsvExporting] = useState(false);
  const [csvSourceFilter, setCsvSourceFilter] = useState('all');

  const handleExportCsv = async () => {
    setCsvExporting(true);
    try {
      const result = await metaAdsApi.exportLeadsCsv({ source: csvSourceFilter });
      if (!result?.csv) throw new Error('No se generó el CSV');

      // Download CSV file
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dentalspot_leads_meta_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setCsvExporting(false);
    }
  };

  const handleCreateRetargetingAudience = async (preset) => {
    setRetargetingLoading(preset.key);
    setRetargetingSuccess(null);
    try {
      const name = `Retargeting — ${preset.title} — ${new Date().toISOString().slice(0, 10)}`;
      await metaAdsApi.createWebsiteAudience({
        name,
        url_contains: preset.url_contains,
        retention_days: preset.retention_days,
        description: `${preset.desc} (${preset.retention_days} dias)`,
      });
      setRetargetingSuccess(preset.key);
      fetchAudiences();
      setTimeout(() => setRetargetingSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetargetingLoading(null);
    }
  };

  // Fetch contacts via edge function (uses service role, bypasses RLS)
  const fetchContacts = async (countOnly = false) => {
    try {
      const result = await metaAdsApi.fetchLeads({
        source: sourceFilter,
        status: statusFilter,
        count_only: countOnly,
      });
      if (countOnly) return result?.total_count || 0;
      return { emails: result?.emails || [], phones: result?.phones || [] };
    } catch (err) {
      console.error('[fetchContacts] Error:', err);
      return countOnly ? 0 : { emails: [], phones: [] };
    }
  };

  // Preview count of contacts matching filter
  const previewLeads = async () => {
    const count = await fetchContacts(true);
    setPreviewCount(count || 0);
  };

  useEffect(() => {
    if (showCreateModal) previewLeads();
  }, [showCreateModal, sourceFilter, statusFilter]);

  const handleCreateAudience = async () => {
    if (!audienceName || previewCount === 0) return;
    setCreating(true);
    setStep('uploading');

    try {
      // 1. Fetch contacts
      setUploadProgress('Obteniendo contactos...');
      const { emails, phones } = await fetchContacts(false);
      const phonesToSend = includePhones ? phones : [];

      if (emails.length === 0) throw new Error('No hay contactos con email para subir');

      // 2. Create audience in Meta
      setUploadProgress(`Creando audiencia en Meta (${emails.length} emails${phonesToSend.length ? ` + ${phonesToSend.length} telefonos` : ''})...`);
      const sourceLabel = sourceFilter === 'registered_therapists' ? 'terapeutas registrados' :
        sourceFilter === 'all' ? 'terapeutas + leads' :
        sourceFilter;
      const description = `DentalSpot — ${sourceLabel}${statusFilter !== 'all' ? `, ${statusFilter}` : ''} — ${new Date().toLocaleDateString('es-CL')}`;
      const createResult = await metaAdsApi.createAudience(audienceName, description);
      const audienceId = createResult?.id;
      if (!audienceId) throw new Error('No se pudo crear la audiencia en Meta');

      // 3. Upload hashed users
      setUploadProgress(`Subiendo ${emails.length} contactos (hasheados SHA-256)...`);
      await metaAdsApi.addUsersToAudience(audienceId, emails, phonesToSend);

      setStep('done');
      setUploadProgress(`Audiencia creada con ${emails.length} contactos`);

      // Refresh audiences list
      setTimeout(() => {
        fetchAudiences();
        setShowCreateModal(false);
        resetForm();
      }, 2000);

    } catch (err) {
      const msg = err.message || '';
      // Detect TOS error (error code 1870090)
      if (msg.includes('1870090') || msg.toLowerCase().includes('terms of service') || msg.toLowerCase().includes('custom audience tos')) {
        setTosError(true);
      }
      setError(msg);
      setStep('config');
    } finally {
      setCreating(false);
    }
  };

  const [tosError, setTosError] = useState(false);

  const resetForm = () => {
    setAudienceName('');
    setSourceFilter('all');
    setStatusFilter('all');
    setIncludePhones(true);
    setPreviewCount(null);
    setStep('config');
    setUploadProgress('');
  };

  const handleDeleteAudience = async (audienceId) => {
    try {
      await metaAdsApi.removeAudience(audienceId);
      fetchAudiences();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {/* TOS Warning */}
      {tosError && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Terminos de Servicio de Custom Audiences</p>
              <p className="text-xs text-amber-700 mt-1">
                Para crear audiencias de tipo "Lista de clientes" necesitas aceptar los TOS de Custom Audiences en Meta Business Suite.
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href="https://business.facebook.com/ads/manage/customaudiences/tos/?act=277002818308529"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline" className="text-xs border-amber-400 text-amber-700 hover:bg-amber-100">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Aceptar TOS en Meta
                  </Button>
                </a>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => setTosError(false)}>
                  Cerrar
                </Button>
              </div>
              <p className="text-[10px] text-amber-600 mt-2">
                Mientras tanto, puedes usar las audiencias de Retargeting (basadas en Pixel) que no requieren estos TOS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retargeting Automatico */}
      <Card className="border-[#00BCB5]/30 bg-[#d2f2f0]/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Target className="h-5 w-5" style={{ color: '#00BCB5' }} />
            Retargeting Automatico
          </CardTitle>
          <CardDescription className="text-xs">
            Crea audiencias basadas en el Pixel de Meta. Incluye visitantes que NO completaron el registro — ideal para campanas de recuperacion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RETARGETING_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isLoading = retargetingLoading === preset.key;
              const isSuccess = retargetingSuccess === preset.key;
              return (
                <div
                  key={preset.key}
                  className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  style={{ borderColor: `${preset.color}40` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${preset.color}18` }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: preset.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight">{preset.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{preset.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className="text-[10px] bg-gray-100 text-gray-600">{preset.retention_days} dias</Badge>
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Creada
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isLoading}
                        onClick={() => handleCreateRetargetingAudience(preset)}
                        style={{ borderColor: preset.color, color: preset.color }}
                        className="hover:text-white text-xs h-7"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = preset.color; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = preset.color; }}
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                        Crear Audiencia
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export CSV for Meta */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Facebook className="h-5 w-5 text-blue-600" />
            Exportar Leads para Meta (CSV)
          </CardTitle>
          <CardDescription className="text-xs">
            Descarga tus leads en formato CSV compatible con Meta Ads Manager. Luego sube el archivo en Meta → Audiencias → Crear Audiencia → Lista de clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={csvSourceFilter} onValueChange={setCsvSourceFilter}>
              <SelectTrigger className="w-[200px] text-sm h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              onClick={handleExportCsv}
              disabled={csvExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {csvExporting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generando...</>
              ) : (
                <><ArrowUpRight className="h-4 w-4 mr-2" /> Descargar CSV para Meta</>
              )}
            </Button>
            <a
              href="https://business.facebook.com/latest/audiences/create/custom-audience/customer-list"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="text-xs">
                Subir en Meta <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          </div>
          <p className="text-[10px] text-blue-600 mt-2">
            El CSV incluye: email, telefono, nombre, apellido, ciudad, region, pais y valor. Meta hashea automaticamente los datos al subirlos.
          </p>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Audiencias desde Leads (CRM)</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Existing audiences */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide">
              Audiencias en Meta ({audiences.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAudiences}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" /> Crear desde Leads
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {audiences.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">No hay audiencias personalizadas</p>
              <p className="text-xs text-gray-400 mt-1">Crea una audiencia desde tus leads de marketing para segmentar tus anuncios.</p>
              <Button size="sm" className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-1" /> Crear Audiencia desde Leads
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {audiences.map((aud) => {
                // Use correct Meta fields for audience size
                const lower = aud.approximate_count_lower_bound || 0;
                const upper = aud.approximate_count_upper_bound || 0;
                const sizeLabel = lower > 0 ? (lower === upper ? formatNumber(lower) : `${formatNumber(lower)} - ${formatNumber(upper)}`) : '—';

                // Status from delivery_status or operation_status
                const statusCode = aud.delivery_status?.code || aud.operation_status?.code;
                const statusDesc = aud.delivery_status?.description || aud.operation_status?.description || 'Pendiente';

                // Subtype badge colors
                const subtypeColors = {
                  CUSTOM: 'bg-purple-100 text-purple-700',
                  WEBSITE: 'bg-blue-100 text-blue-700',
                  LOOKALIKE: 'bg-teal-100 text-teal-700',
                  ENGAGEMENT: 'bg-primary text-primary',
                  SUBSCRIBER_LIST: 'bg-orange-100 text-orange-700',
                };

                return (
                  <div key={aud.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <Users className="h-4 w-4 text-purple-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{aud.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`${subtypeColors[aud.subtype] || 'bg-gray-100 text-gray-700'} text-[9px] px-1.5 py-0`}>
                          {aud.subtype}
                        </Badge>
                        <span className="text-[10px] text-gray-400">ID: {aud.id}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{sizeLabel}</p>
                      <p className="text-[10px] text-gray-400">personas</p>
                    </div>
                    <Badge className={
                      statusCode === 200 ? 'bg-green-100 text-green-700 text-[10px]' :
                      statusCode === 300 ? 'bg-amber-100 text-amber-700 text-[10px]' :
                      'bg-gray-100 text-gray-700 text-[10px]'
                    }>
                      {statusCode === 200 ? 'Lista' :
                       statusCode === 300 ? 'Procesando' :
                       statusDesc}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm(`¿Eliminar audiencia "${aud.name}"?`)) return;
                        try {
                          await metaAdsApi.removeAudience(aud.id);
                          fetchAudiences();
                        } catch (err) {
                          setError(`Error al eliminar: ${err.message}`);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-purple-800 mb-2">Como funciona la vinculacion Leads → Meta Audience</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { step: '1', title: 'Filtrar', desc: 'Selecciona fuente y estado de leads' },
              { step: '2', title: 'Hashear', desc: 'Emails se hashean con SHA-256 (privacidad)' },
              { step: '3', title: 'Subir', desc: 'Se crea Custom Audience en Meta' },
              { step: '4', title: 'Segmentar', desc: 'Usa la audiencia en tus campanas' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="h-8 w-8 rounded-full bg-purple-600 text-white text-sm font-bold flex items-center justify-center mx-auto mb-1">{s.step}</div>
                <p className="text-xs font-medium text-purple-800">{s.title}</p>
                <p className="text-[10px] text-purple-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Audience Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { if (!creating) { setShowCreateModal(open); if (!open) resetForm(); } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" /> Crear Audiencia Personalizada
            </DialogTitle>
            <DialogDescription>
              Selecciona la fuente de contactos para crear una Custom Audience en Meta. Incluye terapeutas registrados y leads importados. Los emails se hashean con SHA-256.
            </DialogDescription>
          </DialogHeader>

          {step === 'config' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de la audiencia</Label>
                <Input
                  value={audienceName}
                  onChange={(e) => setAudienceName(e.target.value)}
                  placeholder="Ej: Odontologos Supersalud — Abril 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Fuente</Label>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Estado</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhones}
                  onChange={(e) => setIncludePhones(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Incluir telefonos (mejora match rate)</span>
              </label>
              {previewCount !== null && (
                <div className={`p-3 rounded-lg text-center ${previewCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-2xl font-bold ${previewCount > 0 ? 'text-green-700' : 'text-red-700'}`}>{previewCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">
                    contactos con email {sourceFilter === 'registered_therapists' ? '(terapeutas registrados)' : sourceFilter === 'all' ? '(terapeutas + leads)' : `(${sourceFilter})`}
                  </p>
                </div>
              )}
            </div>
          )}

          {(step === 'uploading' || step === 'done') && (
            <div className="py-8 text-center space-y-4">
              {step === 'uploading' ? (
                <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              )}
              <p className="text-sm font-medium">{uploadProgress}</p>
              {step === 'done' && <p className="text-xs text-gray-400">Meta puede tardar unos minutos en procesar la audiencia completamente.</p>}
            </div>
          )}

          <DialogFooter>
            {step === 'config' && (
              <>
                <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={handleCreateAudience} disabled={creating || !audienceName || previewCount === 0}>
                  <Users className="h-4 w-4 mr-1" />
                  Crear Audiencia ({previewCount?.toLocaleString() || 0} contactos)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MetaAdsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Account data
  const [account, setAccount] = useState(null);
  const [insights, setInsights] = useState(null);
  const [datePreset, setDatePreset] = useState('last_30d');

  // Campaigns
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsInsights, setCampaignsInsights] = useState([]);

  // Ad Sets & Ads
  const [adSets, setAdSets] = useState([]);
  const [ads, setAds] = useState([]);

  // Audiences
  const [audiences, setAudiences] = useState([]);

  // Create campaign modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'OUTCOME_LEADS', daily_budget: '', status: 'PAUSED' });
  const [creating, setCreating] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accountData, insightsData, campaignsData] = await Promise.allSettled([
        metaAdsApi.getAccount(),
        metaAdsApi.accountInsights(datePreset),
        metaAdsApi.listCampaigns({ limit: 50 }),
      ]);

      if (accountData.status === 'fulfilled') setAccount(accountData.value);
      if (insightsData.status === 'fulfilled') setInsights(insightsData.value?.data?.[0] || null);
      if (campaignsData.status === 'fulfilled') setCampaigns(campaignsData.value?.data || []);

      // If any critical call failed, show error
      if (accountData.status === 'rejected') {
        setError(accountData.reason?.message || 'Error al conectar con Meta');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  const fetchCampaignsInsights = useCallback(async () => {
    try {
      const data = await metaAdsApi.campaignsBreakdown(datePreset);
      setCampaignsInsights(data?.data || []);
    } catch { /* silent */ }
  }, [datePreset]);

  const fetchAdSets = useCallback(async () => {
    try {
      const data = await metaAdsApi.listAdSets({ limit: 50 });
      setAdSets(data?.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchAds = useCallback(async () => {
    try {
      const data = await metaAdsApi.listAds({ limit: 50 });
      setAds(data?.data || []);
    } catch { /* silent */ }
  }, []);

  const fetchAudiences = useCallback(async () => {
    try {
      const data = await metaAdsApi.listAudiences();
      console.log('[MetaAds] Audiences response:', data);
      setAudiences(data?.data || []);
    } catch (err) {
      console.error('[MetaAds] fetchAudiences error:', err);
      setError(`Error al cargar audiencias: ${err.message}`);
    }
  }, []);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaignsInsights();
    if (activeTab === 'adsets') fetchAdSets();
    if (activeTab === 'ads') fetchAds();
    if (activeTab === 'audiences') fetchAudiences();
  }, [activeTab, fetchCampaignsInsights, fetchAdSets, fetchAds, fetchAudiences]);

  // ============================================
  // ACTIONS
  // ============================================

  const toggleCampaignStatus = async (campaign) => {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setActionLoading(campaign.id);
    try {
      await metaAdsApi.updateCampaign(campaign.id, { status: newStatus });
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) return;
    setCreating(true);
    try {
      const budget = newCampaign.daily_budget ? Number(newCampaign.daily_budget) * 100 : undefined; // Convert to cents
      await metaAdsApi.createCampaign({
        name: newCampaign.name,
        objective: newCampaign.objective,
        status: newCampaign.status,
        daily_budget: budget,
      });
      setShowCreateModal(false);
      setNewCampaign({ name: '', objective: 'OUTCOME_LEADS', daily_budget: '', status: 'PAUSED' });
      fetchOverview();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    setActionLoading(campaignId);
    try {
      await metaAdsApi.deleteCampaign(campaignId);
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdSetStatus = async (adset) => {
    const newStatus = adset.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setActionLoading(adset.id);
    try {
      await metaAdsApi.updateAdSet(adset.id, { status: newStatus });
      setAdSets(prev => prev.map(a => a.id === adset.id ? { ...a, status: newStatus } : a));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAdStatus = async (ad) => {
    const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setActionLoading(ad.id);
    try {
      await metaAdsApi.updateAd(ad.id, { status: newStatus });
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, status: newStatus } : a));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============================================
  // AI COPY GENERATOR
  // ============================================

  const [copyForm, setCopyForm] = useState({
    product: 'DentalSpot — plataforma digital para odontologos con fichas clinicas, agenda, IA y marketplace',
    audience: 'Odontologos en Chile',
    objective: 'leads',
    tone: 'profesional y cercano',
    count: 3,
    extra_context: '',
  });
  const [copyResults, setCopyResults] = useState([]);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateCopy = async () => {
    setCopyLoading(true);
    setCopyResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-copy', {
        body: copyForm,
      });
      if (error) throw error;
      if (data?.variations) {
        setCopyResults(data.variations);
      }
    } catch (err) {
      setError(err.message || 'Error generando copy');
    } finally {
      setCopyLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ============================================
  // RENDER
  // ============================================

  const adAccountId = metaAdsApi.getAdAccountId();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Facebook className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meta Ads Manager</h1>
              <p className="text-xs text-muted-foreground">
                {account?.name || 'Cargando...'} · {adAccountId}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map(dp => (
                <SelectItem key={dp.value} value={dp.value}>{dp.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchOverview} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <a
            href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId?.replace('act_', '')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              Ads Manager <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </a>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => setError(null)}>Cerrar</Button>
        </div>
      )}

      {/* Account KPIs */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Gastado', value: formatCurrency(insights.spend, account?.currency), icon: DollarSign, color: 'text-red-600 bg-red-50' },
            { label: 'Impresiones', value: formatNumber(insights.impressions), icon: Eye, color: 'text-blue-600 bg-blue-50' },
            { label: 'Alcance', value: formatNumber(insights.reach), icon: Users, color: 'text-purple-600 bg-purple-50' },
            { label: 'Clicks', value: formatNumber(insights.clicks), icon: MousePointerClick, color: 'text-green-600 bg-green-50' },
            { label: 'CTR', value: formatPct(insights.ctr), icon: ArrowUpRight, color: 'text-teal-600 bg-teal-50' },
            { label: 'CPC', value: formatCurrency(insights.cpc, account?.currency), icon: Target, color: 'text-amber-600 bg-amber-50' },
            { label: 'Frecuencia', value: Number(insights.frequency || 0).toFixed(1), icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label}>
                <CardContent className="p-3 text-center">
                  <div className={`inline-flex p-1.5 rounded-lg ${kpi.color} mb-1`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-lg font-bold">{loading ? '—' : kpi.value}</p>
                  <p className="text-[10px] text-gray-500">{kpi.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5"><Megaphone className="h-3.5 w-3.5" /> Campanas</TabsTrigger>
          <TabsTrigger value="adsets" className="gap-1.5"><Layers className="h-3.5 w-3.5" /> Ad Sets</TabsTrigger>
          <TabsTrigger value="ads" className="gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Anuncios</TabsTrigger>
          <TabsTrigger value="audiences" className="gap-1.5"><Users className="h-3.5 w-3.5" /> Audiencias</TabsTrigger>
          <TabsTrigger value="ai-copy" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> IA Copy</TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW TAB ============ */}
        <TabsContent value="overview" className="space-y-6">
          {/* Account info */}
          {account && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Cuenta Publicitaria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Nombre</p>
                    <p className="text-sm font-medium">{account.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Business</p>
                    <p className="text-sm font-medium">{account.business_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Moneda</p>
                    <p className="text-sm font-medium">{account.currency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Zona Horaria</p>
                    <p className="text-sm font-medium">{account.timezone_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Gastado</p>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(account.amount_spent, account.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-sm font-medium">{formatCurrency(account.balance, account.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estado</p>
                    <Badge className={account.account_status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      {account.account_status === 1 ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Campanas</p>
                    <p className="text-sm font-medium">{campaigns.length} total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campaigns summary */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Campanas ({campaigns.length})</CardTitle>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nueva Campana
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
              ) : campaigns.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay campanas en esta cuenta</p>
              ) : (
                <div className="space-y-2">
                  {campaigns.slice(0, 10).map((c) => {
                    const st = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.PAUSED;
                    const StIcon = st.icon;
                    return (
                      <div key={c.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                        <StIcon className="h-4 w-4 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {OBJECTIVES[c.objective] || c.objective} · ID: {c.id}
                          </p>
                        </div>
                        {c.daily_budget && (
                          <span className="text-xs text-gray-500">{formatCurrency(c.daily_budget, account?.currency)}/dia</span>
                        )}
                        <Badge className={`${st.color} text-[10px]`}>{st.label}</Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={actionLoading === c.id}
                            onClick={() => toggleCampaignStatus(c)}
                          >
                            {actionLoading === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : c.status === 'ACTIVE' ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions breakdown from insights */}
          {insights?.actions && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Conversiones por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {insights.actions.map((action) => (
                    <div key={action.action_type} className="p-3 border rounded-lg text-center">
                      <p className="text-lg font-bold">{formatNumber(action.value)}</p>
                      <p className="text-[10px] text-gray-500">{action.action_type.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ CAMPAIGNS TAB ============ */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">{campaigns.length} campanas encontradas</p>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nueva Campana
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campana</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Presupuesto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const st = CAMPAIGN_STATUS[c.status] || CAMPAIGN_STATUS.PAUSED;
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-[10px] text-gray-400">ID: {c.id}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{OBJECTIVES[c.objective] || c.objective}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.daily_budget ? `${formatCurrency(c.daily_budget, account?.currency)}/dia` : c.lifetime_budget ? formatCurrency(c.lifetime_budget, account?.currency) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${st.color} text-[10px]`}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actionLoading === c.id} onClick={() => toggleCampaignStatus(c)}>
                              {actionLoading === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : c.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" disabled={actionLoading === c.id} onClick={() => handleDeleteCampaign(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Per-campaign insights */}
          {campaignsInsights.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide">Performance por Campana</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campana</TableHead>
                      <TableHead className="text-right">Impresiones</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Gastado</TableHead>
                      <TableHead className="text-right">CPC</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignsInsights.map((ci) => (
                      <TableRow key={ci.campaign_id}>
                        <TableCell className="text-sm font-medium">{ci.campaign_name}</TableCell>
                        <TableCell className="text-right text-sm">{formatNumber(ci.impressions)}</TableCell>
                        <TableCell className="text-right text-sm">{formatNumber(ci.clicks)}</TableCell>
                        <TableCell className="text-right text-sm">{formatPct(ci.ctr)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(ci.spend, account?.currency)}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(ci.cpc, account?.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============ AD SETS TAB ============ */}
        <TabsContent value="adsets" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Conjuntos de Anuncios ({adSets.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {adSets.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay ad sets</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Optimizacion</TableHead>
                      <TableHead>Presupuesto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adSets.map((as) => {
                      const st = CAMPAIGN_STATUS[as.status] || CAMPAIGN_STATUS.PAUSED;
                      return (
                        <TableRow key={as.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{as.name}</p>
                            <p className="text-[10px] text-gray-400">ID: {as.id}</p>
                          </TableCell>
                          <TableCell className="text-xs">{as.optimization_goal?.replace(/_/g, ' ') || '—'}</TableCell>
                          <TableCell className="text-sm">
                            {as.daily_budget ? `${formatCurrency(as.daily_budget, account?.currency)}/dia` : '—'}
                          </TableCell>
                          <TableCell><Badge className={`${st.color} text-[10px]`}>{st.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actionLoading === as.id} onClick={() => toggleAdSetStatus(as)}>
                              {actionLoading === as.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : as.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ ADS TAB ============ */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide">Anuncios ({ads.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ads.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay anuncios</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Anuncio</TableHead>
                      <TableHead>Ad Set ID</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ads.map((ad) => {
                      const st = CAMPAIGN_STATUS[ad.status] || CAMPAIGN_STATUS.PAUSED;
                      return (
                        <TableRow key={ad.id}>
                          <TableCell>
                            <p className="text-sm font-medium">{ad.name}</p>
                            <p className="text-[10px] text-gray-400">ID: {ad.id}</p>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-gray-500">{ad.adset_id}</TableCell>
                          <TableCell><Badge className={`${st.color} text-[10px]`}>{st.label}</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actionLoading === ad.id} onClick={() => toggleAdStatus(ad)}>
                              {actionLoading === ad.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ad.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ AUDIENCES TAB ============ */}
        <TabsContent value="audiences" className="space-y-4">
          <AudiencesTab
            audiences={audiences}
            fetchAudiences={fetchAudiences}
            error={error}
            setError={setError}
          />
        </TabsContent>

        {/* ============ AI COPY TAB ============ */}
        <TabsContent value="ai-copy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-purple-600" /> Configurar Copy
                </CardTitle>
                <CardDescription className="text-xs">Define el contexto y la IA genera variaciones de copy para tus anuncios.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Producto / Servicio</Label>
                  <Textarea
                    value={copyForm.product}
                    onChange={(e) => setCopyForm(prev => ({ ...prev, product: e.target.value }))}
                    rows={2}
                    className="text-sm"
                    placeholder="Describe tu producto o servicio..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Publico Objetivo</Label>
                  <Input
                    value={copyForm.audience}
                    onChange={(e) => setCopyForm(prev => ({ ...prev, audience: e.target.value }))}
                    className="text-sm"
                    placeholder="Ej: Odontologos en Chile"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Objetivo</Label>
                  <Select value={copyForm.objective} onValueChange={(v) => setCopyForm(prev => ({ ...prev, objective: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leads">Leads / Registros</SelectItem>
                      <SelectItem value="awareness">Reconocimiento</SelectItem>
                      <SelectItem value="traffic">Trafico web</SelectItem>
                      <SelectItem value="sales">Ventas</SelectItem>
                      <SelectItem value="engagement">Interaccion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tono</Label>
                  <Select value={copyForm.tone} onValueChange={(v) => setCopyForm(prev => ({ ...prev, tone: v }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profesional y cercano">Profesional y cercano</SelectItem>
                      <SelectItem value="urgente y directo">Urgente y directo</SelectItem>
                      <SelectItem value="emocional y aspiracional">Emocional y aspiracional</SelectItem>
                      <SelectItem value="educativo e informativo">Educativo e informativo</SelectItem>
                      <SelectItem value="humoristico y fresco">Humoristico y fresco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Variaciones</Label>
                  <Select value={String(copyForm.count)} onValueChange={(v) => setCopyForm(prev => ({ ...prev, count: Number(v) }))}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 variaciones</SelectItem>
                      <SelectItem value="3">3 variaciones</SelectItem>
                      <SelectItem value="5">5 variaciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Contexto extra (opcional)</Label>
                  <Textarea
                    value={copyForm.extra_context}
                    onChange={(e) => setCopyForm(prev => ({ ...prev, extra_context: e.target.value }))}
                    rows={2}
                    className="text-sm"
                    placeholder="Ej: Promocion de lanzamiento, descuento 50%..."
                  />
                </div>
                <Button onClick={generateCopy} disabled={copyLoading} className="w-full gap-2">
                  {copyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {copyLoading ? 'Generando...' : 'Generar Copy con IA'}
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-4">
              {copyLoading && (
                <Card>
                  <CardContent className="flex items-center justify-center py-16 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    <p className="text-sm text-gray-500">Generando copy con IA...</p>
                  </CardContent>
                </Card>
              )}

              {!copyLoading && copyResults.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="h-10 w-10 text-purple-300 mb-3" />
                    <p className="text-sm font-medium text-gray-600">Generador de Copy IA</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm">
                      Configura el contexto a la izquierda y haz click en "Generar Copy" para obtener variaciones listas para usar en tus anuncios de Meta.
                    </p>
                  </CardContent>
                </Card>
              )}

              {copyResults.map((variation, idx) => (
                <Card key={idx} className="border-purple-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500" /> Variacion {idx + 1}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => copyToClipboard(
                          `Primary Text: ${variation.primary_text}\nHeadline: ${variation.headline}\nDescription: ${variation.description}\nCTA: ${variation.cta || ''}`,
                          idx
                        )}
                      >
                        {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedIndex === idx ? 'Copiado' : 'Copiar todo'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Primary Text */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] uppercase tracking-wide text-gray-500">Primary Text</Label>
                        <span className="text-[10px] text-gray-400">{variation.primary_text?.length || 0} chars</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border relative group">
                        <p className="text-sm">{variation.primary_text}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(variation.primary_text, `pt-${idx}`)}
                        >
                          {copiedIndex === `pt-${idx}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>

                    {/* Headline + Description row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase tracking-wide text-gray-500">Headline</Label>
                          <span className="text-[10px] text-gray-400">{variation.headline?.length || 0} chars</span>
                        </div>
                        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 relative group">
                          <p className="text-sm font-semibold text-blue-900">{variation.headline}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(variation.headline, `hl-${idx}`)}
                          >
                            {copiedIndex === `hl-${idx}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase tracking-wide text-gray-500">Description</Label>
                          <span className="text-[10px] text-gray-400">{variation.description?.length || 0} chars</span>
                        </div>
                        <div className="p-2.5 bg-gray-50 rounded-lg border relative group">
                          <p className="text-sm text-gray-700">{variation.description}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(variation.description, `desc-${idx}`)}
                          >
                            {copiedIndex === `desc-${idx}` ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* CTA */}
                    {variation.cta && (
                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] uppercase tracking-wide text-gray-500">CTA:</Label>
                        <Badge className="bg-purple-100 text-purple-700 text-xs">{variation.cta}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============ CREATE CAMPAIGN MODAL ============ */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Facebook className="h-5 w-5 text-blue-600" /> Nueva Campana Meta Ads
            </DialogTitle>
            <DialogDescription>
              La campana se crea en estado Pausada. Activa cuando estes lista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre de la campana</Label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: DentalSpot — Leads Terapeutas Abril 2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo</Label>
              <Select value={newCampaign.objective} onValueChange={(v) => setNewCampaign(prev => ({ ...prev, objective: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OBJECTIVES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Presupuesto diario (CLP)</Label>
              <Input
                type="number"
                value={newCampaign.daily_budget}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, daily_budget: e.target.value }))}
                placeholder="Ej: 5000"
              />
              <p className="text-xs text-gray-400">Opcional. Puedes configurarlo despues en Meta Ads Manager.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateCampaign} disabled={creating || !newCampaign.name}>
              {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Crear Campana
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MetaAdsPage;
