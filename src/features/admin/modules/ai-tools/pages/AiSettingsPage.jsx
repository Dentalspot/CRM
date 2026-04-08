import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { ArrowLeft, Key, Shield, Settings, Save, Loader2, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const AiSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [healthChecks, setHealthChecks] = useState({});

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('ai_settings').select('*').order('category').order('key');
    setSettings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = async () => {
    setSaving(true);
    for (const s of settings) {
      await supabase.from('ai_settings').update({ value: s.value, updated_at: new Date().toISOString() }).eq('key', s.key);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const checkHealth = async (name, url) => {
    setHealthChecks(prev => ({ ...prev, [name]: 'checking' }));
    try {
      const { error } = await supabase.functions.invoke(name, { body: { health: true } });
      setHealthChecks(prev => ({ ...prev, [name]: error ? 'error' : 'ok' }));
    } catch {
      setHealthChecks(prev => ({ ...prev, [name]: 'error' }));
    }
  };

  const limits = settings.filter(s => s.category === 'limits');
  const models = settings.filter(s => s.category === 'models');

  const EDGE_FUNCTIONS = [
    { name: 'process-notiz', label: 'Notiz (Transcripción)', usage: 'Whisper + GPT' },
    { name: 'chat-with-ai', label: 'Asistente Virtual', usage: 'GPT / Claude' },
    { name: 'generate-template', label: 'Generador de Plantillas', usage: 'GPT-4' },
    { name: 'ai-inference', label: 'AI Inference', usage: 'General' },
    { name: 'recommend-therapists', label: 'Recomendador', usage: 'Heurísticas' },
  ];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;

  return (
    <PermissionGuard module="ai_tools" action="write">
      <div className="space-y-6 max-w-4xl">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Configuración IA</h1>

        {/* Edge Functions Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-500" /> Edge Functions</CardTitle>
            <CardDescription>Estado de las funciones IA desplegadas en Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EDGE_FUNCTIONS.map(fn => (
              <div key={fn.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-mono font-medium">{fn.name}</p>
                  <p className="text-xs text-gray-500">{fn.label} — {fn.usage}</p>
                </div>
                <div className="flex items-center gap-2">
                  {healthChecks[fn.name] === 'ok' && <Badge className="bg-green-100 text-green-700">OK</Badge>}
                  {healthChecks[fn.name] === 'error' && <Badge className="bg-red-100 text-red-700">Error</Badge>}
                  {healthChecks[fn.name] === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!healthChecks[fn.name] && <Badge variant="outline">Sin verificar</Badge>}
                  <Button variant="ghost" size="sm" onClick={() => checkHealth(fn.name)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-amber-500" /> Límites de Uso</CardTitle>
            <CardDescription>Configuración editable — los cambios aplican a todos los usuarios</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {limits.map(s => (
              <div key={s.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.description}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.key}</p>
                </div>
                <Input value={s.value} onChange={e => updateSetting(s.key, e.target.value)} className="w-40 text-right font-mono" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Models */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4 text-blue-500" /> Modelos por Defecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {models.map(s => (
              <div key={s.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.description}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.key}</p>
                </div>
                <Input value={s.value} onChange={e => updateSetting(s.key, e.target.value)} className="w-40 text-right font-mono" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saved ? 'Guardado' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default AiSettingsPage;
