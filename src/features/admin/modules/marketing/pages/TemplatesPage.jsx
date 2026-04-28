import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Eye, EyeOff, Copy, Send, Loader2, Plus, Pencil } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { marketingApi } from '../api/marketingApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';
import { sanitizeHTML } from '@/lib/utils/sanitize';

const FUNNEL_CONFIG = {
  all: { label: 'Todos', color: 'bg-gray-100 text-gray-700' },
  cold: { label: 'Cold Outreach', color: 'bg-blue-100 text-blue-700' },
  'ados-2': { label: 'ADOS-2', color: 'bg-purple-100 text-purple-700' },
  adir: { label: 'ADI-R', color: 'bg-indigo-100 text-indigo-700' },
  tea: { label: 'TEA General', color: 'bg-green-100 text-green-700' },
  sensorial: { label: 'Perfil Sensorial', color: 'bg-orange-100 text-orange-700' },
  communicare: { label: 'Communicare', color: 'bg-teal-100 text-teal-700' },
  estudiantes: { label: 'Estudiantes', color: 'bg-primary text-primary' },
  onboarding: { label: 'Onboarding', color: 'bg-emerald-100 text-emerald-700' },
  reactivacion: { label: 'Reactivación', color: 'bg-amber-100 text-amber-700' },
  other: { label: 'Otros', color: 'bg-slate-100 text-slate-700' },
};

// Extract funnel group from template_name (e.g., "cold_01_intro" → "cold")
const getFunnelGroup = (templateName) => {
  if (!templateName) return 'other';
  const prefix = templateName.split('_')[0];
  // Map ados2 → ados-2
  if (prefix === 'ados2') return 'ados-2';
  if (FUNNEL_CONFIG[prefix]) return prefix;
  return 'other';
};

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await marketingApi.fetchTemplates();
      setTemplates(data || []);
    } catch (err) {
      logger.error('Error loading templates:', err);
      toast({ variant: 'destructive', title: 'Error al cargar templates' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (activeTab === 'all') return templates;
    return templates.filter(t => getFunnelGroup(t.template_name) === activeTab);
  }, [templates, activeTab]);

  // Get available funnel tabs based on templates that exist
  const availableTabs = useMemo(() => {
    const groups = new Set(templates.map(t => getFunnelGroup(t.template_name)));
    return ['all', ...Object.keys(FUNNEL_CONFIG).filter(k => k !== 'all' && groups.has(k))];
  }, [templates]);

  const handleCopy = (html, id) => {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
      toast({ title: 'HTML copiado al portapapeles' });
    });
  };

  const handleUseInCampaign = (template) => {
    const params = new URLSearchParams({
      subject: template.subject_template || '',
      body: template.body_html_template || '',
    });
    navigate(`/admin/marketing/campaigns?${params.toString()}`);
  };

  const handleSave = async () => {
    if (!editData?.template_name || !editData?.subject_template) {
      toast({ variant: 'destructive', title: 'Nombre y asunto son obligatorios' });
      return;
    }
    setSaving(true);
    try {
      await marketingApi.saveTemplate(editData);
      toast({ title: editData.id ? 'Template actualizado' : 'Template creado' });
      setEditModal(false);
      setEditData(null);
      loadTemplates();
    } catch (err) {
      logger.error('Error saving template:', err);
      toast({ variant: 'destructive', title: 'Error al guardar template' });
    } finally {
      setSaving(false);
    }
  };

  const openNewTemplate = () => {
    setEditData({
      template_name: '',
      notification_type: 'marketing',
      subject_template: '',
      body_html_template: '',
      body_text_template: '',
      variables: {},
      is_active: true,
    });
    setEditModal(true);
  };

  const openEditTemplate = (template) => {
    setEditData({ ...template });
    setEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" /> Biblioteca de Templates
          </h1>
          <Badge variant="outline">{templates.length} plantillas</Badge>
        </div>
        <Button onClick={openNewTemplate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Template
        </Button>
      </div>

      <p className="text-sm text-gray-500">
        Plantillas HTML organizadas por embudo de marketing. Personaliza las variables como <code className="bg-gray-100 px-1 rounded text-xs">{'{{nombre}}'}</code> antes de enviar.
      </p>

      {/* Funnel tabs */}
      {availableTabs.length > 2 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            {availableTabs.map(tab => (
              <TabsTrigger key={tab} value={tab} className="text-xs">
                {FUNNEL_CONFIG[tab]?.label || tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {filteredTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {activeTab === 'all' ? 'No hay templates' : `No hay templates de ${FUNNEL_CONFIG[activeTab]?.label}`}
            </h3>
            <p className="text-sm text-muted-foreground">Crea tu primer template o ejecuta la migración de seeds.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map(t => {
            const funnel = getFunnelGroup(t.template_name);
            const funnelConfig = FUNNEL_CONFIG[funnel] || FUNNEL_CONFIG.other;
            return (
              <Card key={t.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{t.template_name}</CardTitle>
                      <Badge className={`text-[10px] mt-1 ${funnelConfig.color}`}>{funnelConfig.label}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditTemplate(t)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Asunto</p>
                    <p className="text-xs text-gray-700 truncate">{t.subject_template}</p>
                  </div>

                  {preview === t.id && (
                    <div className="border rounded overflow-hidden">
                      <div className="bg-gray-100 px-3 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Vista previa</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setPreview(null)}>
                          <EyeOff className="h-3 w-3 mr-1" /> Cerrar
                        </Button>
                      </div>
                      <div
                        className="p-3 max-h-64 overflow-y-auto bg-white text-xs"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(t.body_html_template) }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setPreview(preview === t.id ? null : t.id)}
                    >
                      {preview === t.id ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                      {preview === t.id ? 'Ocultar' : 'Preview'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleCopy(t.body_html_template, t.id)}
                      title="Copiar HTML"
                    >
                      <Copy className="h-3 w-3" />
                      {copied === t.id ? ' ✓' : ''}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleUseInCampaign(t)}
                    >
                      <Send className="h-3 w-3 mr-1" /> Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Modal */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData?.id ? 'Editar Template' : 'Nuevo Template'}</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del template</Label>
                  <Input
                    placeholder="ej: cold_01_intro"
                    value={editData.template_name}
                    onChange={e => setEditData({ ...editData, template_name: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa formato: embudo_orden_nombre (ej: ados2_01_info)
                  </p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={editData.notification_type || 'marketing'}
                    onValueChange={v => setEditData({ ...editData, notification_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="system_update">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Asunto</Label>
                <Input
                  placeholder="Asunto del email con {{nombre}} variables"
                  value={editData.subject_template}
                  onChange={e => setEditData({ ...editData, subject_template: e.target.value })}
                />
              </div>
              <div>
                <Label>HTML del email</Label>
                <Textarea
                  placeholder="<html>...</html>"
                  value={editData.body_html_template}
                  onChange={e => setEditData({ ...editData, body_html_template: e.target.value })}
                  rows={12}
                  className="font-mono text-xs"
                />
              </div>
              <div>
                <Label>Texto plano (opcional)</Label>
                <Textarea
                  placeholder="Versión texto plano del email"
                  value={editData.body_text_template || ''}
                  onChange={e => setEditData({ ...editData, body_text_template: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editData?.id ? 'Guardar cambios' : 'Crear template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplatesPage;
