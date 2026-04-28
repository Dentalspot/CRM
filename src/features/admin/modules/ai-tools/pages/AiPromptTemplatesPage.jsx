import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Edit, Loader2, Save, CheckCircle2, Thermometer, Hash, FlaskConical, Copy, CheckCheck, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const CATEGORIES = [
  { value: 'notiz', label: 'Notiz', color: 'bg-purple-100 text-purple-700' },
  { value: 'chatbot', label: 'Chatbot', color: 'bg-amber-100 text-amber-700' },
  { value: 'templates', label: 'Plantillas', color: 'bg-teal-100 text-teal-700' },
  { value: 'informes', label: 'Informes', color: 'bg-blue-100 text-blue-700' },
  { value: 'evidence', label: 'Evidencia', color: 'bg-green-100 text-green-700' },
  { value: 'progress', label: 'Progreso', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'treatment', label: 'Tratamiento', color: 'bg-primary text-primary' },
  { value: 'material', label: 'Material', color: 'bg-orange-100 text-orange-700' },
  { value: 'evaluation', label: 'Evaluacion', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'matching', label: 'Matching', color: 'bg-primary text-primary' },
];

const REAL_MODELS = [
  { value: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B (Gratis)' },
  { value: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek V3 (Gratis)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Pagado)' },
  { value: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B (Gratis)' },
  { value: 'openai/whisper-large-v3-turbo', label: 'Whisper Large v3 (Transcripcion)' },
];

const AiPromptTemplatesPage = () => {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testModal, setTestModal] = useState(false);
  const [testPrompt, setTestPrompt] = useState(null);
  const [testVars, setTestVars] = useState({});
  const [copied, setCopied] = useState(null); // 'system' | 'user' | 'full'

  const SAMPLE_VALUES = {
    transcription: 'Paciente de 5 anos con dificultades en la articulacion del fonema /r/. Madre reporta que no pronuncia bien desde los 3 anos.',
    patient_name: 'Maria Lopez',
    patient_age: '5 anos',
    diagnosis: 'Trastorno de los sonidos del habla',
    session_notes: 'Se trabajo articulacion del fonema /r/ en posicion inicial. Paciente logro 60% de producciones correctas.',
    goals: 'Produccion correcta del fonema /r/ en posicion inicial en 80% de intentos.',
    context: 'Sesion individual de 30 minutos en consultorio.',
    language: 'espanol',
    age: '5',
    name: 'Maria Lopez',
    evaluation_data: 'TEPROSIF-R: percentil 25. TECAL: percentil 30.',
    question: 'Como puedo mejorar la produccion del fonema /s/?',
    topic: 'Trastornos del lenguaje infantil',
    content: 'Informe de evaluacion odontologica...',
    area: 'Lenguaje expresivo',
    text: 'Texto de ejemplo para analisis.',
  };

  const getVariablesArray = (prompt) => {
    if (!prompt) return [];
    const vars = prompt.variables;
    if (Array.isArray(vars)) return vars;
    try { return JSON.parse(vars || '[]'); } catch { return []; }
  };

  const openTest = (prompt) => {
    const vars = getVariablesArray(prompt);
    const defaults = {};
    vars.forEach(v => { defaults[v] = SAMPLE_VALUES[v] || `[valor de ${v}]`; });
    setTestVars(defaults);
    setTestPrompt(prompt);
    setTestModal(true);
    setCopied(null);
  };

  const interpolate = (template, vars) => {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
  };

  const interpolatedSystem = useMemo(() => testPrompt ? interpolate(testPrompt.system_prompt, testVars) : '', [testPrompt, testVars]);
  const interpolatedUser = useMemo(() => testPrompt ? interpolate(testPrompt.user_prompt_template, testVars) : '', [testPrompt, testVars]);
  const fullPrompt = useMemo(() => {
    const parts = [];
    if (interpolatedSystem) parts.push(`[SYSTEM]\n${interpolatedSystem}`);
    if (interpolatedUser) parts.push(`[USER]\n${interpolatedUser}`);
    return parts.join('\n\n---\n\n');
  }, [interpolatedSystem, interpolatedUser]);

  const copyToClipboard = async (text, label) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const fetchPrompts = async () => {
    setLoading(true);
    let query = supabase.from('ai_prompt_templates').select('*').order('category').order('name');
    if (filter !== 'all') query = query.eq('category', filter);
    const { data } = await query;
    setPrompts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPrompts(); }, [filter]);

  const openEdit = (prompt = null) => {
    setEditForm(prompt ? { ...prompt } : {
      name: '', slug: '', category: 'notiz', system_prompt: '', user_prompt_template: '',
      description: '', variables: '[]', temperature: 0.3, max_tokens: 2000, model: 'meta-llama/Llama-3.3-70B-Instruct', is_active: true
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...editForm,
      variables: typeof editForm.variables === 'string' ? JSON.parse(editForm.variables || '[]') : editForm.variables,
      updated_at: new Date().toISOString(),
    };
    delete data.created_at;

    if (editForm.id) {
      await supabase.from('ai_prompt_templates').update(data).eq('id', editForm.id);
    } else {
      delete data.id;
      await supabase.from('ai_prompt_templates').insert(data);
    }
    setSaving(false);
    setEditModal(false);
    fetchPrompts();
  };

  const catColor = (cat) => CATEGORIES.find(c => c.value === cat)?.color || 'bg-gray-100 text-gray-600';

  return (
    <PermissionGuard module="ai_tools" action="write">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Prompt Engineering</h1>
            <p className="text-muted-foreground">Gestión de prompts con guardrails anti-alucinación</p>
          </div>
          <Button onClick={() => openEdit()} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Prompt
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Todos</Button>
          {CATEGORIES.map(c => (
            <Button key={c.value} variant={filter === c.value ? 'default' : 'outline'} size="sm" onClick={() => setFilter(c.value)}>{c.label}</Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid gap-4">
            {prompts.map(p => (
              <Card key={p.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      {p.slug && <p className="text-xs font-mono text-gray-400">{p.slug}</p>}
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={catColor(p.category)}>{p.category}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => openTest(p)} title="Probar Prompt"><FlaskConical className="h-4 w-4 text-teal-600" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">System Prompt:</p>
                      <pre className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-24 overflow-hidden">{p.system_prompt}</pre>
                    </div>
                    {p.user_prompt_template && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">User Template:</p>
                        <pre className="bg-blue-50 p-3 rounded text-xs font-mono text-blue-600 whitespace-pre-wrap max-h-20 overflow-hidden">{p.user_prompt_template}</pre>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Thermometer className="h-3 w-3" /> temp: {p.temperature}</span>
                    <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> max: {p.max_tokens} tokens</span>
                    <span>modelo: {p.model}</span>
                    <span>variables: {Array.isArray(p.variables) ? p.variables.join(', ') : p.variables}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={editModal} onOpenChange={setEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editForm?.id ? 'Editar Prompt' : 'Nuevo Prompt'}</DialogTitle>
            </DialogHeader>
            {editForm && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Nombre</label>
                    <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Slug (clave unica)</label>
                    <Input
                      value={editForm.slug || ''}
                      onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
                      placeholder="ej: process-notiz.soap"
                      className="font-mono text-sm"
                      disabled={!!editForm.id && editForm.slug?.includes('.')}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Categoría</label>
                    <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Descripción</label>
                  <Input value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">System Prompt (instrucciones y guardrails)</label>
                  <Textarea value={editForm.system_prompt} onChange={e => setEditForm(f => ({ ...f, system_prompt: e.target.value }))} rows={6} className="font-mono text-sm" />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">User Prompt Template (usa {`{{variable}}`})</label>
                  <Textarea value={editForm.user_prompt_template || ''} onChange={e => setEditForm(f => ({ ...f, user_prompt_template: e.target.value }))} rows={4} className="font-mono text-sm" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-1">Temperatura (0-1)</label>
                    <Input type="number" step="0.1" min="0" max="1" value={editForm.temperature} onChange={e => setEditForm(f => ({ ...f, temperature: parseFloat(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Max Tokens</label>
                    <Input type="number" value={editForm.max_tokens} onChange={e => setEditForm(f => ({ ...f, max_tokens: parseInt(e.target.value) }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1">Modelo</label>
                    <Select value={editForm.model} onValueChange={v => setEditForm(f => ({ ...f, model: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REAL_MODELS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1">Variables (JSON array)</label>
                  <Input value={typeof editForm.variables === 'string' ? editForm.variables : JSON.stringify(editForm.variables)} onChange={e => setEditForm(f => ({ ...f, variables: e.target.value }))} className="font-mono text-sm" placeholder='["transcription", "patient_name"]' />
                </div>

                <Button onClick={handleSave} disabled={saving || !editForm.name || !editForm.system_prompt} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Test Prompt Modal */}
        <Dialog open={testModal} onOpenChange={setTestModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-600" />
                Probar Prompt: {testPrompt?.name}
              </DialogTitle>
            </DialogHeader>
            {testPrompt && (
              <Tabs defaultValue="variables" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="variables" className="flex-1">Variables de Prueba</TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">Vista Previa</TabsTrigger>
                </TabsList>

                {/* Variables Tab */}
                <TabsContent value="variables" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">Completa las variables para generar la vista previa del prompt interpolado.</p>
                  {getVariablesArray(testPrompt).length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Este prompt no tiene variables definidas.</p>
                  ) : (
                    <div className="space-y-3">
                      {getVariablesArray(testPrompt).map(v => (
                        <div key={v}>
                          <label className="text-sm font-medium block mb-1 font-mono text-teal-700">{`{{${v}}}`}</label>
                          <Textarea
                            value={testVars[v] || ''}
                            onChange={e => setTestVars(prev => ({ ...prev, [v]: e.target.value }))}
                            rows={2}
                            className="text-sm"
                            placeholder={SAMPLE_VALUES[v] || `Valor para ${v}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs font-medium text-gray-500">Metadata del prompt</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                      <span><Thermometer className="h-3 w-3 inline mr-1" />temp: {testPrompt.temperature}</span>
                      <span><Hash className="h-3 w-3 inline mr-1" />max: {testPrompt.max_tokens} tokens</span>
                      <span>modelo: {testPrompt.model}</span>
                    </div>
                  </div>
                </TabsContent>

                {/* Preview Tab */}
                <TabsContent value="preview" className="space-y-4 mt-4">
                  {/* System Prompt Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-500">System Prompt (interpolado)</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(interpolatedSystem, 'system')}
                        className="h-7 text-xs"
                      >
                        {copied === 'system' ? <CheckCheck className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied === 'system' ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                    <pre className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto border">{interpolatedSystem}</pre>
                  </div>

                  {/* User Template Preview */}
                  {testPrompt.user_prompt_template && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-500">User Template (interpolado)</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(interpolatedUser, 'user')}
                          className="h-7 text-xs"
                        >
                          {copied === 'user' ? <CheckCheck className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
                          {copied === 'user' ? 'Copiado' : 'Copiar'}
                        </Button>
                      </div>
                      <pre className="bg-blue-50 p-3 rounded text-xs font-mono text-blue-700 whitespace-pre-wrap max-h-40 overflow-y-auto border border-blue-100">{interpolatedUser}</pre>
                    </div>
                  )}

                  {/* Full Prompt Copy + External Links */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    <Button
                      onClick={() => copyToClipboard(fullPrompt, 'full')}
                      className="bg-teal-600 hover:bg-teal-700"
                      size="sm"
                    >
                      {copied === 'full' ? <CheckCheck className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied === 'full' ? 'Prompt Completo Copiado' : 'Copiar Prompt Completo'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href="https://openrouter.ai/playground" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Probar en OpenRouter
                      </a>
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
};

export default AiPromptTemplatesPage;
