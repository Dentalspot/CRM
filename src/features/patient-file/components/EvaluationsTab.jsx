import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, ClipboardList, Plus, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateAdos2Report, generateAdirReport, generateSensorialReport } from '@/features/tea/utils/reportGenerator';
import logger from '@/lib/utils/logger';
import { SENSORIAL_SECTIONS } from '@/features/sensorial-profile/constants/sensorialItems';
import Odontogram from '@/features/odontogram/components/Odontogram';

const EVAL_TYPES = [
  {
    key: 'adir',
    label: 'ADI-R',
    description: 'Entrevista diagnóstica revisada',
    table: 'adir_evaluations',
    newPath: '/dashboard/therapist/adir/new',
    viewPath: '/dashboard/therapist/adir',
    resultField: 'clasificacion',
    resultLabels: { autism: 'Autismo', non_spectrum: 'No espectro', inconclusive: 'No concluyente' },
    resultColors: { autism: 'destructive', non_spectrum: 'outline', inconclusive: 'secondary' },
    generateReport: (ev, patientName, therapistName, pd) => generateAdirReport({ evaluation: ev, patientName, therapistName, patientData: pd }),
  },
  {
    key: 'ados2',
    label: 'ADOS-2',
    description: 'Escala de observación diagnóstica',
    table: 'ados2_evaluations',
    newPath: '/dashboard/therapist/ados2/new',
    viewPath: '/dashboard/therapist/ados2',
    resultField: 'rango_preocupacion',
    resultLabels: { autismo: 'Autismo', espectro_autista: 'Espectro', no_tea: 'No TEA', moderada_severa: 'Moderada-Severa', leve_moderada: 'Leve-Moderada', poco_ninguna: 'Poco/Ninguna' },
    resultColors: { autismo: 'destructive', espectro_autista: 'default', no_tea: 'outline', moderada_severa: 'destructive', leve_moderada: 'default', poco_ninguna: 'outline' },
    generateReport: (ev, patientName, therapistName, pd, td) => generateAdos2Report({ evaluation: ev, patientName, therapistName, patientData: pd, therapistData: td }),
  },
  {
    key: 'sensorial',
    label: 'Perfil Sensorial',
    description: 'Procesamiento sensorial (Dunn)',
    table: 'sensorial_evaluations',
    newPath: '/dashboard/therapist/sensorial/new',
    viewPath: '/dashboard/therapist/sensorial',
    resultField: 'overall_classification',
    resultLabels: { tipico: 'Típico', leve: 'Diferencia Leve', moderado: 'Moderado', significativo: 'Significativo' },
    resultColors: { tipico: 'outline', leve: 'secondary', moderado: 'default', significativo: 'destructive' },
    generateReport: (ev, patientName, therapistName, pd) => generateSensorialReport({ evaluation: ev, patientName, therapistName, sections: SENSORIAL_SECTIONS, patientData: pd }),
  },
];

const EvaluationsTab = ({ patientId, patientName }) => {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(true);
  const [therapistData, setTherapistData] = useState({});
  const [patientData, setPatientData] = useState({});

  useEffect(() => {
    if (patientId) loadEvaluations();
  }, [patientId]);

  // Load patient profile data (rut, birthdate) for report generation
  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const { data } = await supabase
        .from('patients')
        .select('profile:profiles!patients_profile_id_fkey(rut, birthdate, full_name)')
        .eq('id', patientId)
        .maybeSingle();
      setPatientData({ rut: data?.profile?.rut, birthdate: data?.profile?.birthdate });
    })();
  }, [patientId]);

  // Load therapist profile for report generation
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const [profileRes, brandingRes, detailsRes] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, rut').eq('id', user.id).maybeSingle(),
        supabase.from('therapist_branding').select('avatar_url').eq('therapist_id', user.id).maybeSingle(),
        supabase.from('therapist_details').select('professional_title, headline, registro_supersalud, registro_secreduc, address').eq('profile_id', user.id).maybeSingle(),
      ]);
      setTherapistData({
        full_name: profileRes.data?.full_name || user.user_metadata?.full_name || '',
        phone: profileRes.data?.phone || '',
        avatar_url: brandingRes.data?.avatar_url || '',
        professional_title: detailsRes.data?.professional_title || '',
        headline: detailsRes.data?.headline || '',
        registro_supersalud: detailsRes.data?.registro_supersalud || '',
        registro_secreduc: detailsRes.data?.registro_secreduc || '',
        address: detailsRes.data?.address || '',
      });
    })();
  }, [user?.id]);

  const loadEvaluations = async () => {
    setLoading(true);
    try {
      const results = {};
      for (const type of EVAL_TYPES) {
        // ADOS-2 needs responses for detailed report
        const selectQuery = type.key === 'ados2' ? '*, responses:ados2_item_responses(*)' : '*';
        const { data } = await supabase
          .from(type.table)
          .select(selectQuery)
          .eq('patient_id', patientId)
          .eq('therapist_id', user.id)
          .order('created_at', { ascending: false });
        results[type.key] = data || [];
      }
      setEvaluations(results);
    } catch (err) {
      logger.error('Error loading evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalEvals = Object.values(evaluations).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Evaluaciones Clínicas
          </h3>
          <p className="text-sm text-muted-foreground">Tests diagnósticos aplicados a este paciente</p>
        </div>
      </div>

      {/* Odontograma — Evaluacion dental principal */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                🦷 Odontograma
              </CardTitle>
              <p className="text-xs text-muted-foreground">Diagrama dental interactivo — registro de estado por diente y superficie</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Odontogram patientId={patientId} />
        </CardContent>
      </Card>

      {EVAL_TYPES.map((type) => {
        const evals = evaluations[type.key] || [];

        return (
          <Card key={type.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{type.label}</CardTitle>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to={type.newPath}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {evals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin evaluaciones registradas</p>
              ) : (
                <div className="space-y-2">
                  {evals.map((ev) => {
                    const resultValue = ev[type.resultField];
                    const resultLabel = type.resultLabels[resultValue];
                    const resultColor = type.resultColors[resultValue] || 'outline';
                    const isComplete = ev.status === 'completada' || ev.status === 'revisada';

                    return (
                      <div key={ev.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {ev.fecha_evaluacion ? format(new Date(ev.fecha_evaluacion), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
                              </span>
                              <Badge variant={isComplete ? 'default' : 'outline'} className="text-[10px]">
                                {isComplete ? 'Completada' : 'Borrador'}
                              </Badge>
                            </div>
                            {resultLabel && (
                              <Badge variant={resultColor} className="text-[10px] mt-1">{resultLabel}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                            <Link to={`${type.viewPath}/${ev.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {isComplete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => type.generateReport(ev, patientName, user?.user_metadata?.full_name || '', patientData, therapistData)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default EvaluationsTab;
