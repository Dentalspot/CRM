import React, { useState, useEffect } from 'react';
import { Bot, Mic, MessageSquare, Sparkles, FileText, RefreshCw, AlertTriangle, Database, Brain, GraduationCap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useAiDashboard } from '../hooks/useAiDashboard';
import { aiToolsApi } from '../api/aiToolsApi';
import AiQuickNav from '../components/AiQuickNav';
import { supabase } from '@/lib/supabaseClient';

const AiDashboardPage = () => {
  const { metrics, models, loading, error, refresh } = useAiDashboard();
  const [edgeFunctions, setEdgeFunctions] = useState([]);
  const [trainingData, setTrainingData] = useState({ paci: 0, tea: 0, templates: 0, notiz: 0 });

  useEffect(() => {
    aiToolsApi.fetchEdgeFunctions().then(setEdgeFunctions).catch(() => {});
    fetchTrainingStats();
  }, []);

  const fetchTrainingStats = async () => {
    const [paciRes, teaRes, templatesRes, notizRes, evidenceChatRes] = await Promise.all([
      supabase.from('paci_training_examples').select('id', { count: 'exact', head: true }),
      supabase.from('tea_training_examples').select('id', { count: 'exact', head: true }),
      supabase.from('generated_templates').select('id', { count: 'exact', head: true }),
      supabase.from('notiz_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('evidence_chat_training').select('id', { count: 'exact', head: true }),
    ]);
    setTrainingData({
      paci: paciRes.count || 0,
      tea: teaRes.count || 0,
      templates: templatesRes.count || 0,
      notiz: notizRes.count || 0,
      evidenceChat: evidenceChatRes?.count || 0,
    });
  };

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Bot className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Herramientas IA</h1>
              <p className="text-muted-foreground mt-0.5">Uso de herramientas de inteligencia artificial en la plataforma</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} /> Actualizar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Error al cargar datos.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">Reintentar</Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Notiz Sessions</p>
                  <p className="text-2xl font-bold">{loading ? '...' : metrics?.notizSessions || 0}</p>
                  <p className="text-xs text-muted-foreground">notas automáticas</p>
                </div>
                <div className="p-2.5 rounded-full bg-purple-100 text-purple-600"><Mic className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plantillas IA</p>
                  <p className="text-2xl font-bold">{loading ? '...' : metrics?.templatesGenerated || 0}</p>
                  <p className="text-xs text-muted-foreground">generadas</p>
                </div>
                <div className="p-2.5 rounded-full bg-teal-100 text-teal-600"><Sparkles className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chat Sessions</p>
                  <p className="text-2xl font-bold">{loading ? '...' : metrics?.chatSessions || 0}</p>
                  <p className="text-xs text-muted-foreground">asistente virtual</p>
                </div>
                <div className="p-2.5 rounded-full bg-blue-100 text-blue-600"><MessageSquare className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Uso Total</p>
                  <p className="text-2xl font-bold">{loading ? '...' : metrics?.totalUsage || 0}</p>
                  <p className="text-xs text-muted-foreground">interacciones IA</p>
                </div>
                <div className="p-2.5 rounded-full bg-cyan-100 text-cyan-600"><Bot className="h-4 w-4" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Models + Edge Functions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4" /> Herramientas Activas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(models || []).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.provider}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">{m.status === 'active' ? 'Activo' : m.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Edge Functions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(edgeFunctions.length ? edgeFunctions : [
                { name: 'process-notiz', description: 'Transcripcion y analisis clinico SOAP', status: 'deployed' },
                { name: 'chat-with-ai', description: 'Chatbot pacientes/terapeutas', status: 'deployed' },
                { name: 'generate-template', description: 'Generador de planes terapeuticos', status: 'deployed' },
              ]).map(fn => (
                <div key={fn.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium font-mono">{fn.name}</p>
                    <p className="text-xs text-gray-500">{fn.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {fn.prompts && <span className="text-xs text-gray-400">{fn.prompts} prompts</span>}
                    <Badge variant="outline" className="text-green-600 border-green-200">{fn.status || 'Deployed'}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Training Data / RAG */}
        <Card className="border-violet-200 bg-violet-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-violet-600" />
              Datos de Entrenamiento (RAG + Fine-tuning)
            </CardTitle>
            <p className="text-xs text-gray-500">Cada interacción validada por dentistas alimenta el RAG y se acumula para futuro fine-tuning.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-white rounded-lg border p-3 text-center">
                <GraduationCap className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-indigo-700">{trainingData.paci}</p>
                <p className="text-[10px] text-gray-500">PACIs validados</p>
                <Badge className="mt-1 bg-indigo-100 text-indigo-700 text-[9px]">PIE Module</Badge>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <Brain className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-700">{trainingData.tea}</p>
                <p className="text-[10px] text-gray-500">Análisis TEA</p>
                <Badge className="mt-1 bg-purple-100 text-purple-700 text-[9px]">ADOS-2 + ADI-R</Badge>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <Sparkles className="h-5 w-5 text-teal-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-teal-700">{trainingData.templates}</p>
                <p className="text-[10px] text-gray-500">Planificaciones</p>
                <Badge className="mt-1 bg-teal-100 text-teal-700 text-[9px]">RAG activo</Badge>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <Mic className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-primary">{trainingData.notiz}</p>
                <p className="text-[10px] text-gray-500">Sesiones Notiz</p>
                <Badge className="mt-1 bg-primary text-primary text-[9px]">Transcripciones</Badge>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <MessageSquare className="h-5 w-5 text-cyan-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-cyan-700">{trainingData.evidenceChat || 0}</p>
                <p className="text-[10px] text-gray-500">Chat Evidencia</p>
                <Badge className="mt-1 bg-cyan-100 text-cyan-700 text-[9px]">Q&A artículos</Badge>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-violet-700 bg-violet-100 rounded-lg px-3 py-2">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              <span>Total: <strong>{trainingData.paci + trainingData.tea + trainingData.templates + trainingData.notiz + (trainingData.evidenceChat || 0)}</strong> ejemplos de entrenamiento. RAG activo en PACI, TEA, Planificaciones y Chat Evidencia.</span>
            </div>
          </CardContent>
        </Card>

        <Separator />
        <AiQuickNav />
      </div>
    </PermissionGuard>
  );
};

export default AiDashboardPage;
