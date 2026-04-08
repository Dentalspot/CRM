import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Mic, FileText, Brain, ClipboardList, Loader2, HardDrive } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const AiDatasetListPage = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      const queries = [
        { name: 'Sesiones Notiz', table: 'notiz_sessions', icon: Mic, color: 'purple', desc: 'Transcripciones de audio y resúmenes de sesiones terapéuticas', useCase: 'Fine-tune de modelo de transcripción odontológica' },
        { name: 'Registros Clínicos', table: 'clinical_history', icon: ClipboardList, color: 'teal', desc: 'Notas de evolución, diagnósticos y observaciones clínicas', useCase: 'Generador automático de informes clínicos' },
        { name: 'Planes Terapéuticos', table: 'treatment_plans', icon: FileText, color: 'blue', desc: 'Planes de tratamiento con objetivos, actividades y duración', useCase: 'Recomendador inteligente de planes por diagnóstico' },
        { name: 'Evaluaciones ADOS-2', table: 'ados2_evaluations', icon: Brain, color: 'amber', desc: 'Resultados de evaluaciones ADOS-2 con puntajes por dominio', useCase: 'Asistente de evaluación TEA' },
        { name: 'Evaluaciones ADI-R', table: 'adir_evaluations', icon: Brain, color: 'orange', desc: 'Resultados de evaluaciones ADI-R con scoring por período', useCase: 'Asistente de evaluación TEA' },
        { name: 'Preguntas de Pacientes', table: 'patient_questions', icon: Database, color: 'pink', desc: 'Consultas de pacientes y familias sobre odontología', useCase: 'Entrenamiento del chatbot con preguntas frecuentes reales' },
      ];

      const results = await Promise.all(
        queries.map(async (q) => {
          const { count, error } = await supabase.from(q.table).select('*', { count: 'exact', head: true });
          return { ...q, records: error ? 0 : (count || 0), error: !!error };
        })
      );

      setSources(results);
      setLoading(false);
    };
    fetchSources();
  }, []);

  const totalRecords = sources.reduce((sum, s) => sum + s.records, 0);

  const ICON_COLORS = {
    purple: 'bg-purple-100 text-purple-600',
    teal: 'bg-teal-100 text-teal-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Database className="h-6 w-6 text-green-500" /> Datasets</h1>
        <p className="text-muted-foreground">Fuentes de datos para entrenamiento de modelos especializados en odontología</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : (
          <>
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-6 w-6 text-teal-500" />
                  <div>
                    <p className="font-semibold">Total de registros disponibles</p>
                    <p className="text-sm text-gray-500">{sources.length} fuentes de datos conectadas</p>
                  </div>
                </div>
                <span className="text-3xl font-bold text-teal-600">{totalRecords.toLocaleString()}</span>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {sources.map(s => (
                <Card key={s.table}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg shrink-0 ${ICON_COLORS[s.color]}`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{s.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{s.records}</span>
                            <Badge variant="outline" className={s.records > 0 ? 'border-green-200 text-green-600' : 'border-gray-200 text-gray-400'}>
                              {s.records > 0 ? 'Con datos' : 'Vacío'}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">Tabla: {s.table}</Badge>
                          <span className="text-xs text-gray-400">Uso: {s.useCase}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default AiDatasetListPage;
