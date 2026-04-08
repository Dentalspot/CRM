import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, User, ArrowLeft, ClipboardList, Plus, Eye, CheckCircle2, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

import PieDataTab from '@/features/pie/PieDataTab.jsx';
import PiePaciTab from '@/features/pie/PiePaciTab.jsx';
import PieSessionsTab from '@/features/pie/PieSessionsTab.jsx';
import PieReportsTab from '@/features/pie/PieReportsTab.jsx';
import logger from '@/lib/utils/logger';

export default function PieDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedPatientData, setSelectedPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pieStatus, setPieStatus] = useState(null);
  const [evalsByTest, setEvalsByTest] = useState({});

  useEffect(() => {
    if (user?.id) loadPatients();
  }, [user?.id]);

  useEffect(() => {
    if (selectedPatient) loadPieStatus(selectedPatient);
  }, [selectedPatient]);

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, profile:profiles!patients_profile_id_fkey(full_name, rut)')
      .eq('therapist_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setPatients(data || []);
    setLoading(false);
  };

  const loadPieStatus = async (patientId) => {
    // Check if patient is enrolled in PIE
    const { data } = await supabase
      .from('pie_student_data')
      .select('*')
      .eq('patient_id', patientId)
      .eq('therapist_id', user.id)
      .maybeSingle();

    if (data) {
      setPieStatus(data);
    } else {
      // Auto-enroll
      const { data: newData, error } = await supabase
        .from('pie_student_data')
        .insert({ patient_id: patientId, therapist_id: user.id, active: true })
        .select()
        .single();

      if (!error) {
        setPieStatus(newData);
        toast({ title: 'Paciente agregado al módulo PIE' });
      } else {
        logger.error('Error enrolling in PIE:', error);
        setPieStatus(null);
      }
    }

    const patient = patients.find(p => p.id === patientId);
    setSelectedPatientData(patient);

    // Load latest evaluation per test for this patient
    const selectFields = {
      tecal: 'id, status, resultado_total',
      stsg: 'id, status, resultado_receptivo',
      teprosif: 'id, status, resultado',
    };
    const evalResults = {};
    for (const test of ['tecal', 'stsg', 'teprosif']) {
      const { data: evalData } = await supabase
        .from(`${test}_evaluations`)
        .select(selectFields[test])
        .eq('therapist_id', user.id)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      evalResults[test] = evalData || null;
    }
    setEvalsByTest(evalResults);
  };

  const handleSelectPatient = (patientId) => {
    setSelectedPatient(patientId);
    setPieStatus(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-indigo-600" />
          Módulo PIE
        </h1>
        <p className="text-muted-foreground">Gestiona datos, PACI, sesiones e informes de tus estudiantes</p>
      </div>

      {/* Patient Selector */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label className="shrink-0 font-medium">Paciente:</Label>
            <Select value={selectedPatient} onValueChange={handleSelectPatient}>
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Seleccionar paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.profile?.full_name || 'Sin nombre'}
                    {p.profile?.rut ? ` · ${p.profile.rut}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pieStatus && (
              <div className="flex gap-2 ml-auto">
                {pieStatus.course && pieStatus.course !== 'Sin asignar' && (
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {pieStatus.course}
                  </Badge>
                )}
                {pieStatus.nee_type && pieStatus.nee_type !== 'No especificado' && (
                  <Badge variant="outline">{pieStatus.nee_type}</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {!selectedPatient ? (
        <Card className="text-center py-16">
          <CardContent>
            <GraduationCap className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Selecciona un paciente</h3>
            <p className="text-gray-500 mt-2">Elige un paciente para gestionar sus datos PIE</p>
          </CardContent>
        </Card>
      ) : !pieStatus ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="datos" className="w-full">
              <div className="border-b bg-slate-50/80 px-4 py-3">
                <TabsList className="grid w-full max-w-3xl grid-cols-5 bg-slate-200/50">
                  <TabsTrigger value="datos" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">Datos</TabsTrigger>
                  <TabsTrigger value="evaluaciones" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">Evaluaciones</TabsTrigger>
                  <TabsTrigger value="paci" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">PAI / PACI</TabsTrigger>
                  <TabsTrigger value="sesiones" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">Sesiones</TabsTrigger>
                  <TabsTrigger value="informes" className="data-[state=active]:bg-white data-[state=active]:text-indigo-600">Informes</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="datos" className="mt-0">
                  <PieDataTab patientId={selectedPatient} />
                </TabsContent>
                <TabsContent value="evaluaciones" className="mt-0">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Evaluaciones estandarizadas para el diagnóstico fonoaudiológico PIE.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { key: 'tecal', label: 'TECAL', desc: 'Comprensión Auditiva del Lenguaje', resultField: 'resultado_total' },
                        { key: 'stsg', label: 'STSG', desc: 'Screening Test of Spanish Grammar', resultField: 'resultado_receptivo' },
                        { key: 'teprosif', label: 'TEPROSIF-R', desc: 'Procesos de Simplificación Fonológica', resultField: 'resultado' },
                      ].map(test => {
                        const evaluation = evalsByTest[test.key];
                        const isComplete = evaluation?.status === 'completada';
                        const resultado = evaluation?.[test.resultField];

                        return (
                          <Card key={test.key} className={`relative overflow-hidden ${isComplete ? 'border-green-200 bg-green-50/30' : ''}`}>
                            <div className="absolute top-3 right-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                isComplete ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                              </div>
                            </div>

                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">{test.label}</CardTitle>
                              <CardDescription className="text-xs">{test.desc}</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              {evaluation ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={isComplete ? 'default' : 'outline'}>
                                      {isComplete ? 'Completada' : 'Borrador'}
                                    </Badge>
                                    {resultado && (
                                      <Badge variant={resultado === 'deficitario' ? 'destructive' : resultado === 'riesgo' ? 'outline' : 'secondary'}
                                        className={resultado === 'riesgo' ? 'bg-amber-100 text-amber-800 border-amber-200' : resultado === 'normal' ? 'bg-green-100 text-green-800 border-green-200' : ''}>
                                        {resultado.charAt(0).toUpperCase() + resultado.slice(1)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="flex-1" asChild>
                                      <Link to={`/dashboard/therapist/pie/${test.key}/${evaluation.id}`}>
                                        <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                                      </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" className="flex-1"
                                      onClick={() => navigate(`/dashboard/therapist/pie/${test.key}/new?patient=${selectedPatient}`)}>
                                      <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-500">Sin evaluación registrada</p>
                                  <Button size="sm" className="w-full" asChild>
                                    <Link to={`/dashboard/therapist/pie/${test.key}/new?patient=${selectedPatient}`}>
                                      <Plus className="h-3.5 w-3.5 mr-1" /> Iniciar {test.label}
                                    </Link>
                                  </Button>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="paci" className="mt-0">
                  <PiePaciTab patientId={selectedPatient} />
                </TabsContent>
                <TabsContent value="sesiones" className="mt-0">
                  <PieSessionsTab patientId={selectedPatient} />
                </TabsContent>
                <TabsContent value="informes" className="mt-0">
                  <PieReportsTab patientId={selectedPatient} patientName={selectedPatientData?.profile?.full_name} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
