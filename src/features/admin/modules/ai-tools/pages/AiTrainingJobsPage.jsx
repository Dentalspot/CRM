import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Database, Target, TrendingUp, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const AiTrainingJobsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [notiz, templates, ados, adir, clinical] = await Promise.all([
        supabase.from('notiz_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('treatment_plans').select('*', { count: 'exact', head: true }),
        supabase.from('ados2_evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('adir_evaluations').select('*', { count: 'exact', head: true }),
        supabase.from('clinical_history').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        notizSessions: notiz.count || 0,
        treatmentPlans: templates.count || 0,
        ados2Evals: ados.count || 0,
        adirEvals: adir.count || 0,
        clinicalRecords: clinical.count || 0,
        total: (notiz.count || 0) + (templates.count || 0) + (ados.count || 0) + (adir.count || 0) + (clinical.count || 0),
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const ROADMAP = [
    { name: 'Modelo de Transcripción Odontológica', desc: 'Fine-tune de Whisper con terminología de odontología chilena', requirement: '500+ sesiones Notiz', current: stats?.notizSessions || 0, needed: 500, status: 'collecting' },
    { name: 'Generador de Informes Clínicos', desc: 'Modelo especializado en redacción de informes odontológicos', requirement: '200+ registros clínicos', current: stats?.clinicalRecords || 0, needed: 200, status: 'collecting' },
    { name: 'Asistente de Evaluación TEA', desc: 'Modelo entrenado con resultados ADOS-2 y ADI-R para sugerencias', requirement: '100+ evaluaciones TEA', current: (stats?.ados2Evals || 0) + (stats?.adirEvals || 0), needed: 100, status: 'collecting' },
    { name: 'Recomendador Inteligente de Planes', desc: 'Sugiere planes terapéuticos basado en historial de éxito', requirement: '300+ planes de tratamiento', current: stats?.treatmentPlans || 0, needed: 300, status: 'collecting' },
  ];

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Cpu className="h-6 w-6 text-purple-500" /> Entrenamiento IA</h1>
        <p className="text-muted-foreground">Datos disponibles y roadmap para fine-tuning de modelos especializados</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : (
          <>
            {/* Data KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Sesiones Notiz', value: stats?.notizSessions, icon: '🎙️' },
                { label: 'Planes Terapéuticos', value: stats?.treatmentPlans, icon: '📋' },
                { label: 'Evaluaciones ADOS-2', value: stats?.ados2Evals, icon: '🧩' },
                { label: 'Evaluaciones ADI-R', value: stats?.adirEvals, icon: '📊' },
                { label: 'Registros Clínicos', value: stats?.clinicalRecords, icon: '📁' },
              ].map(k => (
                <Card key={k.label}>
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl">{k.icon}</span>
                    <p className="text-2xl font-bold mt-1">{k.value}</p>
                    <p className="text-xs text-gray-500">{k.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total */}
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-teal-500" />
                  <div>
                    <p className="font-semibold">Total datos de entrenamiento disponibles</p>
                    <p className="text-sm text-gray-500">Datos que se usarán para fine-tuning cuando alcancen masa crítica</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-teal-600">{stats?.total}</span>
              </CardContent>
            </Card>

            {/* Roadmap */}
            <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="h-5 w-5" /> Roadmap de Modelos</h2>
            <div className="grid gap-4">
              {ROADMAP.map(model => {
                const progress = Math.min(100, Math.round((model.current / model.needed) * 100));
                return (
                  <Card key={model.name}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{model.desc}</p>
                        </div>
                        <Badge className={progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {progress >= 100 ? 'Listo' : 'Recolectando'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">{model.current}/{model.needed}</span>
                        <span className="text-xs text-gray-400">({progress}%)</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Requisito: {model.requirement}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default AiTrainingJobsPage;
