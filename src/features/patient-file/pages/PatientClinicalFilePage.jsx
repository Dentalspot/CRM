import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ClinicalConsentGate from '@/components/consent/ClinicalConsentGate';
import { supabase } from '@/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, Mail, Phone, Calendar, FileText,
  AlertTriangle, History, Activity, Save, Edit2,
  Stethoscope, AlertCircle, X, Loader2,
  Share2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatRut, validateRut } from '@/utils/rutUtils';
import { isValidEmail } from '@/lib/utils/validators';
import { formatPhone } from '@/lib/utils/formatters';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Passport components
import useClinicalTimeline from '@/features/clinical-passport/hooks/useClinicalTimeline';
import PassportHeader from '@/features/clinical-passport/components/PassportHeader';
import ClinicalTimeline from '@/features/clinical-passport/components/ClinicalTimeline';
import AccessGrantsManager from '@/features/clinical-passport/components/AccessGrantsManager';
import SharePassportModal from '@/features/clinical-passport/components/SharePassportModal';
import logger from '@/lib/utils/logger';

const PatientClinicalFilePage = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data States
  const [profileData, setProfileData] = useState({});
  const [medicalData, setMedicalData] = useState({});
  const [diagnoses, setDiagnoses] = useState([]);
  const [therapist, setTherapist] = useState(null);
  const [patientId, setPatientId] = useState(null);

  // Edit Modes
  const [editPersonal, setEditPersonal] = useState(false);

  // Form States
  const [personalForm, setPersonalForm] = useState({});
  const [medicalForm, setMedicalForm] = useState({});
  const [emergencyForm, setEmergencyForm] = useState({ name: '', phone: '', relationship: '' });

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Share Modal
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profile) {
        setProfileData(profile);
        setPersonalForm({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          rut: profile.rut || '',
          birthdate: profile.birthdate || '',
          gender: profile.gender || '',
        });
      }

      // A patient may have multiple records (e.g., after referrals to other therapists)
      // Use the primary one (first created, or the one with a therapist_id)
      const { data: patientRecords, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: true });

      const patientRecord = (patientRecords || []).find(p => p.therapist_id) || patientRecords?.[0] || null;

      if (!patientError && patientRecord) {
        setMedicalData(patientRecord);
        setPatientId(patientRecord.id);

        // Add patient-specific fields to personalForm
        setPersonalForm(prev => ({
          ...prev,
          patient_type: patientRecord.patient_type || 'privado',
          responsible_name: patientRecord.responsible_name || '',
          responsible_rut: patientRecord.responsible_rut || '',
        }));

        setMedicalForm({
          allergies: patientRecord.allergies || '',
          medical_history: patientRecord.medical_history || '',
          other_info: patientRecord.other_info || '',
        });

        const emergency = patientRecord.alerts?.emergency_contact || { name: '', phone: '', relationship: '' };
        setEmergencyForm(emergency);

        if (patientRecord.therapist_id) {
          const { data: therapistData } = await supabase
            .from('profiles')
            .select(`*, therapist_details!therapist_details_user_id_fkey (*)`)
            .eq('id', patientRecord.therapist_id)
            .maybeSingle();

          if (therapistData) setTherapist(therapistData);
        }

        // Fetch diagnoses from patient_diagnoses table
        const { data: diagnosesData } = await supabase
          .from('patient_diagnoses')
          .select('*')
          .eq('patient_id', patientRecord.id);

        // Also fetch ADOS-2 evaluations with results as diagnoses
        const { data: ados2Data } = await supabase
          .from('ados2_evaluations')
          .select('id, fecha_evaluacion, module, rango_preocupacion, total_global, status, therapist_id, observaciones')
          .eq('patient_id', patientRecord.id)
          .in('status', ['completada', 'revisada']);

        // Also fetch clinical_history diagnosis entries
        const { data: chDiagData } = await supabase
          .from('clinical_history')
          .select('id, summary, session_notes, entry_date, created_at, entry_type')
          .eq('patient_id', patientRecord.id)
          .eq('entry_type', 'diagnostico');

        // Merge all diagnosis sources
        const allDiagnoses = [...(diagnosesData || [])];

        // Convert ADOS-2 evaluations to diagnosis-like objects
        const rangoLabels = { autismo: 'Autismo', espectro_autista: 'Espectro Autista', no_tea: 'No TEA', moderada_severa: 'Preocupación Moderada-Severa', leve_moderada: 'Preocupación Leve-Moderada', poco_ninguna: 'Poco/Ninguna Preocupación' };
        (ados2Data || []).forEach(ev => {
          allDiagnoses.push({
            id: `ados2-${ev.id}`,
            diagnosis_name: `ADOS-2 — Módulo ${ev.module}`,
            clinical_description: ev.rango_preocupacion ? `Resultado: ${rangoLabels[ev.rango_preocupacion] || ev.rango_preocupacion} (Total: ${ev.total_global ?? '—'})` : 'Evaluación completada',
            diagnosed_at: ev.fecha_evaluacion,
            severity: ev.rango_preocupacion === 'autismo' || ev.rango_preocupacion === 'moderada_severa' ? 'severe' : ev.rango_preocupacion === 'espectro_autista' || ev.rango_preocupacion === 'leve_moderada' ? 'moderate' : 'mild',
            _source: 'ados2',
          });
        });

        // Convert clinical_history diagnosis entries
        (chDiagData || []).forEach(ch => {
          allDiagnoses.push({
            id: `ch-${ch.id}`,
            diagnosis_name: ch.summary || 'Diagnóstico',
            clinical_description: ch.session_notes || '',
            diagnosed_at: ch.entry_date || ch.created_at?.split('T')[0],
            severity: 'mild',
            _source: 'clinical_history',
          });
        });

        setDiagnoses(allDiagnoses);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Timeline hook
  const { loading: timelineLoading, grouped, stats, events, filter, setFilter } = useClinicalTimeline({
    patientId,
    profileId: user?.id,
    isPatientView: true,
  });

  const handlePersonalSave = async () => {
    const newErrors = {};
    if (!personalForm.full_name) newErrors.full_name = 'El nombre es obligatorio';
    if (!isValidEmail(personalForm.email)) newErrors.email = 'Email inválido';
    if (personalForm.rut && !validateRut(personalForm.rut)) newErrors.rut = 'RUT inválido';

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: personalForm.full_name,
          phone: personalForm.phone,
          rut: personalForm.rut,
          birthdate: personalForm.birthdate || null,
          gender: personalForm.gender || null,
        })
        .eq('id', user.id)
        .select('id');
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('No se pudo confirmar el guardado: ninguna fila fue actualizada.');
      }

      await refreshProfile();
      setProfileData({ ...profileData, ...personalForm });
      setEditPersonal(false);
      toast({ title: "Guardado", description: "Tus datos personales han sido actualizados." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="p-8 space-y-4">
      <Skeleton className="h-12 w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 w-full md:col-span-2" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>;
  }

  return (
    <ClinicalConsentGate>
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mi Ficha Clínica</h1>
          <p className="text-muted-foreground">Tu información personal, médica e historial clínico en un solo lugar</p>
        </div>
        <div className="flex gap-2">
          {patientId && (
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" /> Compartir con terapeuta
            </Button>
          )}
          {therapist && (
            <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-sm border">
              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={therapist.therapist_details?.avatar_url} />
                <AvatarFallback>{therapist.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium leading-none">{therapist.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{therapist.therapist_details?.professional_title || 'Terapeuta'}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Passport Stats */}
      {patientId && stats && (
        <PassportHeader
          patientName={user?.full_name}
          stats={stats}
          isPatientView={true}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="personal">Datos Personales</TabsTrigger>
              <TabsTrigger value="medical">Info Médica</TabsTrigger>
              <TabsTrigger value="timeline">Historial</TabsTrigger>
              <TabsTrigger value="diagnoses">Diagnósticos</TabsTrigger>
            </TabsList>

            {/* Timeline Tab (from Passport) */}
            <TabsContent value="timeline">
              {patientId ? (
                <ClinicalTimeline
                  grouped={grouped}
                  loading={timelineLoading}
                  filter={filter}
                  setFilter={setFilter}
                  totalEvents={events.length}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Tu historial estará disponible cuando un terapeuta registre tu primera sesión.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Personal Data Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle>Datos Personales</CardTitle>
                    <CardDescription>Información básica de tu perfil</CardDescription>
                  </div>
                  {!editPersonal ? (
                    <Button variant="outline" size="sm" onClick={() => setEditPersonal(true)}>
                      <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditPersonal(false)} disabled={saving}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handlePersonalSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Guardar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Nombre Completo</Label>
                      <Input disabled={!editPersonal} value={personalForm.full_name} onChange={(e) => setPersonalForm({...personalForm, full_name: e.target.value})} />
                      {errors.full_name && <span className="text-xs text-red-500">{errors.full_name}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> RUT</Label>
                      <Input disabled={!editPersonal} value={personalForm.rut} onChange={(e) => setPersonalForm({...personalForm, rut: formatRut(e.target.value)})} />
                      {errors.rut && <span className="text-xs text-red-500">{errors.rut}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Email</Label>
                      <Input disabled={!editPersonal} value={personalForm.email} onChange={(e) => setPersonalForm({...personalForm, email: e.target.value})} />
                      {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Teléfono</Label>
                      <Input disabled={!editPersonal} value={personalForm.phone} onChange={(e) => setPersonalForm({...personalForm, phone: formatPhone(e.target.value)})} placeholder="9 1234 5678" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> Fecha de Nacimiento</Label>
                      <Input type="date" disabled={!editPersonal} value={personalForm.birthdate} onChange={(e) => setPersonalForm({...personalForm, birthdate: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Género</Label>
                      {editPersonal ? (
                        <Select value={personalForm.gender} onValueChange={(val) => setPersonalForm({...personalForm, gender: val})}>
                          <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="femenino">Femenino</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm py-2 capitalize">{personalForm.gender || 'No especificado'}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Medical Info Tab */}
            <TabsContent value="medical">
              <Card>
                <CardHeader className="space-y-0 pb-4">
                  <CardTitle>Información Médica</CardTitle>
                  <CardDescription>
                    Esta información solo puede ser editada por tu profesional tratante.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-amber-600 font-medium"><AlertTriangle className="h-4 w-4" /> Alergias</Label>
                    <Textarea disabled value={medicalForm.allergies} placeholder="Sin información registrada." className="min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><History className="h-4 w-4 text-muted-foreground" /> Antecedentes Médicos</Label>
                    <Textarea disabled value={medicalForm.medical_history} placeholder="Sin información registrada." className="min-h-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Activity className="h-4 w-4 text-muted-foreground" /> Otros Tratamientos / Medicamentos</Label>
                    <Textarea disabled value={medicalForm.other_info} placeholder="Sin información registrada." className="min-h-[100px]" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagnoses Tab */}
            <TabsContent value="diagnoses">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnósticos Clínicos</CardTitle>
                  <CardDescription>Historial de diagnósticos registrados por tu especialista</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnoses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No hay diagnósticos registrados aún.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {diagnoses.map((diag) => (
                        <div key={diag.id} className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50/50">
                          <div className={`p-2 rounded-full mt-1 ${
                            diag.severity === 'severe' ? 'bg-red-100 text-red-600' :
                            diag.severity === 'moderate' ? 'bg-amber-100 text-amber-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            <Activity className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-gray-900">{diag.diagnosis_name}</h4>
                              <Badge variant={diag.severity === 'severe' ? 'destructive' : diag.severity === 'moderate' ? 'secondary' : 'outline'} className="capitalize">
                                {diag.severity || 'Leve'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{diag.clinical_description}</p>
                            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(diag.diagnosed_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Access Control (from Passport) */}
          {patientId && (
            <AccessGrantsManager patientId={patientId} profileId={user?.id} />
          )}

          {/* Emergency Contact */}
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Contacto Emergencia
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Esta información solo puede ser editada por tu profesional tratante.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <p className="font-medium">{emergencyForm.name || 'No registrado'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{emergencyForm.phone || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Parentesco</Label>
                <p className="font-medium">{emergencyForm.relationship || '-'}</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Share Modal */}
      {patientId && (
        <SharePassportModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          patientId={patientId}
          profileId={user?.id}
        />
      )}
    </div>
    </ClinicalConsentGate>
  );
};

export default PatientClinicalFilePage;
