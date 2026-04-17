import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, ChevronLeft, ChevronRight, Save, FileText, Trash2, Plus,
  ClipboardCheck, Stethoscope, DollarSign, Check
} from 'lucide-react';
import { DENTAL_CONDITIONS } from '@/constants/dentalConstants';
import Odontogram from '../components/Odontogram';
import {
  fetchEvaluationById, createEvaluation, updateEvaluation,
  saveReportToFicha, fetchTherapistServices
} from '../api/odontogramEvalApi';
import logger from '@/lib/utils/logger';
import useClinicalAccessLogger from '@/lib/audit/useClinicalAccessLogger';

const STEPS = [
  { key: 'config', label: 'Configuración', icon: ClipboardCheck },
  { key: 'odontogram', label: 'Odontograma', icon: Stethoscope },
  { key: 'results', label: 'Resultados y Presupuesto', icon: DollarSign },
];

const OdontogramEvaluationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id && id !== 'nueva';

  // Wizard step
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Step 1: Config
  const [patients, setPatients] = useState([]);
  const [setup, setSetup] = useState({
    patient_id: '',
    evaluation_type: 'inicial',
    evaluation_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Step 2: Odontogram data (managed by Odontogram component via ref pattern)
  const [teethData, setTeethData] = useState({});
  const [evaluationId, setEvaluationId] = useState(null);
  const [patientOrgId, setPatientOrgId] = useState(null);

  // Step 3: Treatments & Budget
  const [treatments, setTreatments] = useState([]);
  const [services, setServices] = useState([]);
  const [reportSaved, setReportSaved] = useState(false);

  // Patient info for display
  const [patientInfo, setPatientInfo] = useState(null);

  // ============================================================
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    if (user?.id) {
      loadPatients();
      loadServices();
    }
  }, [user?.id]);

  useEffect(() => {
    if (isEditing) loadEvaluation();
  }, [id]);

  useClinicalAccessLogger({
    patientId: isEditing && evaluationId ? setup.patient_id || null : null,
    action: 'view_record',
    resourceType: 'odontogram',
    resourceId: evaluationId || null,
  });

  const loadPatients = async () => {
    const { data } = await supabase
      .from('patients')
      .select('id, profiles(full_name, rut, birthdate)')
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: false });

    setPatients((data || []).map((p) => ({
      id: p.id,
      name: p.profiles?.full_name || 'Sin nombre',
      rut: p.profiles?.rut || '',
    })));
  };

  const loadServices = async () => {
    const { data } = await fetchTherapistServices(user.id);
    setServices(data);
  };

  const loadEvaluation = async () => {
    setLoading(true);
    const { data, error } = await fetchEvaluationById(id);
    if (error || !data) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se encontró la evaluación' });
      navigate('/dashboard/odontograma');
      return;
    }

    setEvaluationId(data.id);
    setPatientOrgId(data.organization_id || null);
    setSetup({
      patient_id: data.patient_id,
      evaluation_type: data.evaluation_type,
      evaluation_date: data.evaluation_date,
      notes: data.notes || '',
    });
    setTeethData(data.teeth_data || {});
    setTreatments(data.treatments || []);
    setPatientInfo({
      name: data.patient_name,
      rut: data.patient_rut,
    });

    // Jump to step 2 if borrador, step 3 if completada
    setStep(data.status === 'completada' ? 3 : 2);
    setLoading(false);
  };

  // ============================================================
  // STEP 1: START EVALUATION
  // ============================================================

  const handleStartEvaluation = async () => {
    if (!setup.patient_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selecciona un paciente' });
      return;
    }

    setSaving(true);
    try {
      // Heredar organization_id del paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select('organization_id')
        .eq('id', setup.patient_id)
        .maybeSingle();

      const orgId = patientData?.organization_id || null;
      setPatientOrgId(orgId);

      const { data, error } = await createEvaluation({
        therapist_id: user.id,
        patient_id: setup.patient_id,
        organization_id: orgId,
        evaluation_type: setup.evaluation_type,
        evaluation_date: setup.evaluation_date,
        notes: setup.notes,
        status: 'borrador',
      });

      if (error) throw error;

      setEvaluationId(data.id);
      const patient = patients.find((p) => p.id === setup.patient_id);
      setPatientInfo({ name: patient?.name, rut: patient?.rut });
      setStep(2);

      // Update URL without full navigation
      window.history.replaceState(null, '', `/dashboard/odontograma/${data.id}`);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // STEP 2: SAVE ODONTOGRAM DATA
  // ============================================================

  const handleTeethChange = useCallback((newTeethData) => {
    setTeethData(newTeethData);
  }, []);

  const handleSaveDraft = async () => {
    if (!evaluationId) return;
    setSaving(true);
    try {
      const { error } = await updateEvaluation(evaluationId, {
        teeth_data: teethData,
        notes: setup.notes,
      });
      if (error) throw error;
      toast({ title: 'Borrador guardado' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleGoToResults = async () => {
    await handleSaveDraft();
    // Generate treatment suggestions from teeth data
    generateTreatmentSuggestions();
    setStep(3);
  };

  const generateTreatmentSuggestions = () => {
    if (treatments.length > 0) return; // Don't overwrite existing treatments

    const suggested = [];
    const conditionToService = {
      caries: 'Restauración / Obturación',
      extraction: 'Extracción Dental',
      endodontics: 'Tratamiento de Conducto',
      crown: 'Corona Dental',
      implant: 'Implante Dental',
      fracture: 'Restauración por Fractura',
      periapical: 'Tratamiento Periapical',
    };

    Object.entries(teethData).forEach(([tooth, surfaces]) => {
      Object.entries(surfaces).forEach(([surface, condition]) => {
        if (condition && condition !== 'healthy' && conditionToService[condition]) {
          // Check if already suggested for this tooth+procedure
          const procedure = conditionToService[condition];
          const exists = suggested.some((t) => t.tooth === tooth && t.procedure === procedure);
          if (!exists) {
            // Find matching service price
            const matchedService = services.find((s) =>
              s.service_name.toLowerCase().includes(procedure.toLowerCase().split(' ')[0])
            );
            suggested.push({
              tooth,
              surface,
              condition,
              procedure,
              price: matchedService?.price || 0,
              service_id: matchedService?.id || null,
            });
          }
        }
      });
    });

    setTreatments(suggested);
  };

  // ============================================================
  // STEP 3: BUDGET & REPORT
  // ============================================================

  const budgetTotal = treatments.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const addTreatment = () => {
    setTreatments([...treatments, { tooth: '', procedure: '', price: 0, service_id: null }]);
  };

  const updateTreatment = (index, field, value) => {
    const updated = [...treatments];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill price when selecting a service
    if (field === 'procedure') {
      const matchedService = services.find((s) => s.service_name === value);
      if (matchedService) {
        updated[index].price = matchedService.price;
        updated[index].service_id = matchedService.id;
      }
    }

    setTreatments(updated);
  };

  const removeTreatment = (index) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!evaluationId) return;
    setSaving(true);
    try {
      const { error } = await updateEvaluation(evaluationId, {
        teeth_data: teethData,
        treatments,
        budget_total: budgetTotal,
        notes: setup.notes,
        status: 'completada',
      });
      if (error) throw error;
      toast({ title: 'Evaluación completada' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToFicha = async () => {
    if (!evaluationId) return;
    setSaving(true);
    try {
      const evaluation = { ...setup, status: 'completada' };
      const { error } = await saveReportToFicha({
        evaluationId,
        patientId: setup.patient_id,
        therapistId: user.id,
        organizationId: patientOrgId,
        evaluation,
        treatments,
      });
      if (error) throw error;
      setReportSaved(true);
      toast({ title: 'Informe guardado en la ficha del paciente' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/odontograma')}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEditing ? 'Evaluación Odontológica' : 'Nueva Evaluación'}
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const isActive = step === i + 1;
          const isCompleted = step > i + 1;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && <div className={`h-0.5 w-8 sm:w-16 ${isCompleted ? 'bg-pink-500' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive ? 'bg-pink-500 text-white' : isCompleted ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-400'
              }`}>
                <StepIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Step 1: Configuration */}
      {step === 1 && (
        <Card className="overflow-hidden rounded-lg shadow-lg border-t-4 border-pink-500">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
            <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">Configuración</CardTitle>
            <CardDescription className="mt-2 text-md text-gray-600">Selecciona el paciente y tipo de evaluación</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <Select value={setup.patient_id} onValueChange={(v) => setSetup({ ...setup, patient_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.rut ? `(${p.rut})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fecha de Evaluación</Label>
                <Input
                  type="date"
                  value={setup.evaluation_date}
                  onChange={(e) => setSetup({ ...setup, evaluation_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Evaluación</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'inicial', title: 'Inicial', desc: 'Diagnóstico del estado dental al ingreso del paciente' },
                  { value: 'tratamiento', title: 'Tratamiento', desc: 'Registro de procedimientos realizados o planificados' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSetup({ ...setup, evaluation_type: type.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      setup.evaluation_type === type.value
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{type.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                value={setup.notes}
                onChange={(e) => setSetup({ ...setup, notes: e.target.value })}
                placeholder="Observaciones generales sobre la evaluación..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStartEvaluation}
              disabled={saving || !setup.patient_id}
              className="w-full h-11 bg-pink-500 hover:bg-pink-600"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              Iniciar Evaluación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Odontogram */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Patient info bar */}
          {patientInfo && (
            <div className="flex items-center gap-4 p-4 bg-pink-50 rounded-xl border border-pink-200">
              <div>
                <p className="font-semibold text-gray-900">{patientInfo.name}</p>
                {patientInfo.rut && <p className="text-sm text-gray-500">RUT: {patientInfo.rut}</p>}
              </div>
              <Badge variant="outline" className={setup.evaluation_type === 'inicial' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                {setup.evaluation_type === 'inicial' ? 'Inicial' : 'Tratamiento'}
              </Badge>
              <p className="text-sm text-gray-500 ml-auto">{setup.evaluation_date}</p>
            </div>
          )}

          <Card className="overflow-hidden rounded-lg shadow-lg border-t-4 border-pink-500">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">Odontograma</CardTitle>
              <CardDescription className="mt-2 text-md text-gray-600">
                Selecciona una condición y haz clic en las superficies dentales
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <Odontogram
                patientId={setup.patient_id}
                externalTeethData={teethData}
                onTeethChange={handleTeethChange}
                evaluationMode
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Borrador'}
            </Button>
            <Button onClick={handleGoToResults} disabled={saving} className="flex-1 bg-pink-500 hover:bg-pink-600">
              Resultados <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results & Budget */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="overflow-hidden rounded-lg shadow-lg border-t-4 border-pink-500">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">Presupuesto</CardTitle>
                  <CardDescription className="mt-2 text-md text-gray-600">
                    {patientInfo?.name} — {setup.evaluation_type === 'inicial' ? 'Evaluación Inicial' : 'Plan de Tratamiento'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-3xl font-bold text-pink-600">${budgetTotal.toLocaleString('es-CL')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white space-y-4">
              {/* Treatments Table */}
              {treatments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay tratamientos registrados</p>
                  <p className="text-sm mt-1">Agrega procedimientos manualmente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {treatments.map((t, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border bg-gray-50">
                      <div className="col-span-2">
                        <Label className="text-[10px] text-gray-500 uppercase">Diente</Label>
                        <Input
                          value={t.tooth}
                          onChange={(e) => updateTreatment(i, 'tooth', e.target.value)}
                          placeholder="11"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-5">
                        <Label className="text-[10px] text-gray-500 uppercase">Procedimiento</Label>
                        <Select value={t.procedure} onValueChange={(v) => updateTreatment(i, 'procedure', v)}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((s) => (
                              <SelectItem key={s.id} value={s.service_name}>
                                {s.service_name} (${s.price?.toLocaleString('es-CL')})
                              </SelectItem>
                            ))}
                            <SelectItem value="Otro">Otro procedimiento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-[10px] text-gray-500 uppercase">Precio (CLP)</Label>
                        <Input
                          type="number"
                          value={t.price || ''}
                          onChange={(e) => updateTreatment(i, 'price', Number(e.target.value))}
                          placeholder="0"
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end pt-4">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => removeTreatment(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" onClick={addTreatment} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Agregar Procedimiento
              </Button>

              {/* Notes */}
              <div className="space-y-2 pt-4 border-t">
                <Label>Observaciones</Label>
                <Textarea
                  value={setup.notes}
                  onChange={(e) => setSetup({ ...setup, notes: e.target.value })}
                  placeholder="Observaciones clínicas adicionales..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="sm:flex-1">
              <ChevronLeft className="h-4 w-4 mr-2" /> Volver al Odontograma
            </Button>
            <Button onClick={handleComplete} disabled={saving} className="sm:flex-1 bg-pink-500 hover:bg-pink-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Completar Evaluación
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveToFicha}
              disabled={saving || reportSaved}
              className="sm:flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {reportSaved ? 'Guardado en Ficha' : 'Guardar en Ficha'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OdontogramEvaluationPage;
