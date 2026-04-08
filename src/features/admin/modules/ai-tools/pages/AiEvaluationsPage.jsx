import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, FlaskConical, CheckCircle2, XCircle, Loader2, ThumbsUp, ThumbsDown, BarChart3 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import PermissionGuard from '@/features/admin/permissions/PermissionGuard';

const AiEvaluationsPage = () => {
  const [stats, setStats] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: feedback } = await supabase
        .from('ai_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (feedback) {
        // Group by feedback_type and calculate acceptance rates
        const byType = {};
        feedback.forEach(f => {
          const type = f.feedback_type || f.suggestion_type || 'general';
          if (!byType[type]) byType[type] = { total: 0, accepted: 0, rejected: 0, modified: 0 };
          byType[type].total++;
          if (f.status === 'accepted') byType[type].accepted++;
          if (f.status === 'rejected') byType[type].rejected++;
          if (f.status === 'modified') byType[type].modified++;
        });

        const evaluations = Object.entries(byType).map(([type, counts]) => ({
          name: typeLabels[type] || type,
          type,
          total: counts.total,
          accepted: counts.accepted,
          rejected: counts.rejected,
          rate: counts.total > 0 ? Math.round((counts.accepted / counts.total) * 100) : 0,
          status: counts.total > 0 && (counts.accepted / counts.total) >= 0.7 ? 'passed' : 'review',
        }));

        setStats(evaluations);
        setRecentFeedback(feedback.slice(0, 20));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const typeLabels = {
    generate_template: 'Generador de Plantillas',
    notiz: 'Notiz - Notas Clinicas',
    chat: 'Chatbot Asistente',
    treatment: 'Sugerencia de Tratamiento',
    evaluation: 'Interpretacion de Evaluaciones',
    material: 'Material Terapeutico',
    progress: 'Analisis de Progreso',
    general: 'General',
  };

  return (
    <PermissionGuard module="ai_tools" action="read">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/ai-tools"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link></Button>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6 text-amber-500" /> Evaluaciones IA</h1>
        <p className="text-sm text-muted-foreground">Tasa de aceptacion real basada en feedback de dentistas (ai_feedback)</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
        ) : !stats?.length ? (
          <Card><CardContent className="p-8 text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Sin datos de feedback aun</p>
            <p className="text-sm mt-1">Las evaluaciones se calculan automaticamente cuando los dentistas usan las herramientas IA</p>
          </CardContent></Card>
        ) : (
          <>
            {/* Acceptance rates by type */}
            <div className="grid gap-4">
              {stats.map(e => (
                <Card key={e.type}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {e.status === 'passed'
                        ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                        : <XCircle className="h-5 w-5 text-amber-500" />
                      }
                      <div>
                        <p className="font-medium text-sm">{e.name}</p>
                        <p className="text-xs text-gray-500">
                          {e.total} interacciones: {e.accepted} aceptadas, {e.rejected} rechazadas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{e.rate}%</span>
                      <Badge className={e.status === 'passed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {e.status === 'passed' ? 'Aprobado' : 'En revision'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent feedback */}
            <Card>
              <CardHeader><CardTitle className="text-base">Feedback Reciente</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {recentFeedback.map(f => (
                  <div key={f.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm">
                    {f.status === 'accepted'
                      ? <ThumbsUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                      : <ThumbsDown className="h-4 w-4 text-red-500 flex-shrink-0" />
                    }
                    <span className="text-gray-600 flex-1 truncate">{f.feedback_type || f.suggestion_type || 'general'}</span>
                    <Badge variant="outline" className="text-xs">{f.status}</Badge>
                    <span className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString('es-CL')}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default AiEvaluationsPage;
