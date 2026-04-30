import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Trash2,
  Target,
  Dumbbell,
  Calendar,
  GripVertical,
  Save,
  Loader2,
  UserPlus,
  Clock,
  CalendarDays,
  CheckCircle2,
  Store,
  Upload
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { format, addWeeks, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import logger from "@/lib/utils/logger";
import {
  createClinicalEntry
} from '@/lib/clinicalPlanningApi';

// Day options for scheduling
const DAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
];

const TreatmentPlanBuilderModal = ({
  isOpen,
  onClose,
  initialData = null,
  onSuccess,
  patientId = null,
  patientName = null
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null); // 'save', 'assign', 'publish'
  const [activeTab, setActiveTab] = useState('details');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_weeks: 4,
    recommended_sessions: 8,
    session_duration_minutes: 45,
    general_objective: '',
    target_population: '',
    diagnosis_scope: '',
  });

  const [objectives, setObjectives] = useState([]);

  // Assignment configuration state
  const [assignmentConfig, setAssignmentConfig] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    createSessions: true,
    createAppointments: false,
    preferredDay: 2,
    preferredTime: '17:00',
    clinicId: '',
  });

  // Clinics for appointment scheduling
  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(false);

  // Check if already published
  const [isPublished, setIsPublished] = useState(false);
  const [marketplaceItemId, setMarketplaceItemId] = useState(null);

  // Load clinics when assignment tab is active
  useEffect(() => {
    if (isOpen && patientId && activeTab === 'assign') {
      loadClinics();
    }
  }, [isOpen, patientId, activeTab, user?.id]);

  // Check marketplace status
  useEffect(() => {
    if (isOpen && initialData?.id) {
      checkMarketplaceStatus();
    }
  }, [isOpen, initialData?.id]);

  const checkMarketplaceStatus = async () => {
    if (!initialData?.id) return;

    try {
      const { data, error } = await supabase
        .from('marketplace_items')
        .select('id, is_active, is_approved')
        .or(`plan_template_id.eq.${initialData.id},therapist_plan_template_id.eq.${initialData.id}`)
        .maybeSingle();

      if (!error && data) {
        setIsPublished(data.is_active);
        setMarketplaceItemId(data.id);
      }
    } catch (err) {
      logger.error('Error checking marketplace status:', err);
    }
  };

  const loadClinics = async () => {
    if (!user?.id) return;
    setLoadingClinics(true);
    try {
      // Combinar owned + linked (multi-clinica)
      const [ownedRes, linkedRes] = await Promise.all([
        supabase
          .from('clinics')
          .select('id, name, address')
          .eq('therapist_id', user.id)
          .eq('is_active', true),
        supabase
          .from('clinic_therapists')
          .select('clinic:clinics(id, name, address, is_active)')
          .eq('therapist_id', user.id)
          .eq('is_active', true),
      ]);
      const owned = ownedRes.data || [];
      const linked = (linkedRes.data || []).map(r => r.clinic).filter(c => c && c.is_active !== false);
      const all = [...owned, ...linked];
      const unique = Array.from(new Map(all.map(c => [c.id, c])).values());
      unique.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setClinics(unique);
    } catch (err) {
      logger.error('Error loading clinics:', err);
    } finally {
      setLoadingClinics(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          duration_weeks: initialData.duration_weeks || 4,
          recommended_sessions: initialData.recommended_sessions || 8,
          session_duration_minutes: initialData.session_duration_minutes || 45,
          general_objective: initialData.general_objective || '',
          target_population: initialData.target_population || '',
          diagnosis_scope: initialData.diagnosis_scope || '',
        });

        if (initialData.specific_objectives) {
          let loadedObjectives = initialData.specific_objectives;
          if (typeof loadedObjectives === 'string') {
            try { loadedObjectives = JSON.parse(loadedObjectives); } catch (e) { }
          }

          const formattedObjectives = Array.isArray(loadedObjectives)
            ? loadedObjectives.map(obj => ({
              id: obj.id || crypto.randomUUID(),
              title: typeof obj === 'string' ? obj : (obj.title || ''),
              description: obj.description || '',
              activities: obj.activities || []
            }))
            : [];

          setObjectives(formattedObjectives);
        }
      } else {
        // Reset form
        setFormData({
          name: '',
          description: '',
          duration_weeks: 4,
          recommended_sessions: 8,
          session_duration_minutes: 45,
          general_objective: '',
          target_population: '',
          diagnosis_scope: '',
        });
        setObjectives([]);
        setIsPublished(false);
        setMarketplaceItemId(null);
      }
      setAssignmentConfig({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        createSessions: true,
        createAppointments: false,
        preferredDay: 2,
        preferredTime: '17:00',
        clinicId: '',
      });
      setActiveTab('details');
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (field, value) => {
    setAssignmentConfig(prev => ({ ...prev, [field]: value }));
  };

  // Objectives Management
  const addObjective = () => {
    setObjectives(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: '', description: '', activities: [] }
    ]);
  };

  const updateObjective = (id, field, value) => {
    setObjectives(prev => prev.map(obj =>
      obj.id === id ? { ...obj, [field]: value } : obj
    ));
  };

  const removeObjective = (id) => {
    setObjectives(prev => prev.filter(obj => obj.id !== id));
  };

  // Activities Management
  const addActivityToObjective = (objectiveId) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          activities: [
            ...(obj.activities || []),
            { id: crypto.randomUUID(), name: '', description: '', duration_minutes: 15, materials: '' }
          ]
        };
      }
      return obj;
    }));
  };

  const updateActivity = (objectiveId, activityId, field, value) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id === objectiveId) {
        return {
          ...obj,
          activities: obj.activities.map(act =>
            act.id === activityId ? { ...act, [field]: value } : act
          )
        };
      }
      return obj;
    }));
  };

  const removeActivity = (objectiveId, activityId) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id === objectiveId) {
        return { ...obj, activities: obj.activities.filter(act => act.id !== activityId) };
      }
      return obj;
    }));
  };

  // Generate sessions preview
  const getSessionsPreview = () => {
    const { startDate, preferredDay, preferredTime } = assignmentConfig;
    const totalSessions = formData.recommended_sessions;

    if (!startDate) return [];

    const sessions = [];
    let currentDate = new Date(startDate);

    const currentDay = currentDate.getDay();
    const daysUntilPreferred = (preferredDay - currentDay + 7) % 7;
    if (daysUntilPreferred > 0) {
      currentDate = addDays(currentDate, daysUntilPreferred);
    }

    const previewCount = Math.min(totalSessions, 4);
    for (let i = 0; i < previewCount; i++) {
      sessions.push({
        number: i + 1,
        date: format(currentDate, "EEE d MMM", { locale: es }),
        time: preferredTime
      });
      currentDate = addWeeks(currentDate, 1);
    }

    return sessions;
  };

  // ==================== SAVE TEMPLATE ONLY ====================
  const handleSaveTemplate = async () => {
    if (!formData.name) {
      toast({ variant: 'destructive', title: 'El nombre es obligatorio' });
      return;
    }

    setLoadingAction('save');
    try {
      const planData = {
        therapist_id: user.id,
        name: formData.name,
        description: formData.description,
        duration_weeks: parseInt(formData.duration_weeks),
        recommended_sessions: parseInt(formData.recommended_sessions),
        session_duration_minutes: parseInt(formData.session_duration_minutes),
        general_objective: formData.general_objective,
        target_population: formData.target_population,
        diagnosis_scope: formData.diagnosis_scope,
        is_template: true,
        specific_objectives: objectives,
        is_active: true
      };

      let savedPlan;

      if (initialData?.id) {
        const { data, error } = await supabase
          .from('treatment_plans')
          .update(planData)
          .eq('id', initialData.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error("No se pudo actualizar la plantilla (no encontrada).");
        savedPlan = data;
        toast({ title: '✅ Plantilla actualizada' });
      } else {
        const { data, error } = await supabase
          .from('treatment_plans')
          .insert(planData)
          .select()
          .maybeSingle();

        if (error) throw error;
        savedPlan = data;
        toast({ title: '✅ Plantilla creada' });
      }

      if (onSuccess) onSuccess(savedPlan);
      onClose();

    } catch (error) {
      logger.error('Error saving template:', error);
      toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
    } finally {
      setLoadingAction(null);
    }
  };

  // ==================== SAVE AND ASSIGN ====================
  const handleSaveAndAssign = async () => {
    if (!formData.name) {
      toast({ variant: 'destructive', title: 'El nombre es obligatorio' });
      return;
    }
    if (!patientId) {
      toast({ variant: 'destructive', title: 'No hay paciente seleccionado' });
      return;
    }

    // Obtener organization_id del paciente
    const { data: patOrg } = await supabase
      .from('patients').select('organization_id').eq('id', patientId).maybeSingle();
    const orgId = patOrg?.organization_id || null;

    setLoadingAction('assign');
    try {
      // 1. Save/Update template first
      const planData = {
        therapist_id: user.id,
        name: formData.name,
        description: formData.description,
        duration_weeks: parseInt(formData.duration_weeks),
        recommended_sessions: parseInt(formData.recommended_sessions),
        session_duration_minutes: parseInt(formData.session_duration_minutes),
        general_objective: formData.general_objective,
        target_population: formData.target_population,
        diagnosis_scope: formData.diagnosis_scope,
        is_template: true,
        specific_objectives: objectives,
        is_active: true
      };

      let savedTemplate;

      if (initialData?.id) {
        const { data, error } = await supabase
          .from('treatment_plans')
          .update(planData)
          .eq('id', initialData.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("No se pudo actualizar la plantilla (no encontrada).");
        savedTemplate = data;
      } else {
        const { data, error } = await supabase
          .from('treatment_plans')
          .insert(planData)
          .select()
          .maybeSingle();
        if (error) throw error;
        savedTemplate = data;
      }

      // 2. Create patient_assigned_plan
      const { data: assignedPlan, error: assignError } = await supabase
        .from('patient_assigned_plans')
        .insert({
          patient_id: patientId,
          therapist_id: user.id,
          plan_template_id: savedTemplate.id,
          name: savedTemplate.name,
          start_date: assignmentConfig.startDate,
          status: 'active',
          total_sessions: savedTemplate.recommended_sessions,
          completed_sessions: 0,
          progress_percentage: 0
        })
        .select()
        .maybeSingle();

      if (assignError) throw assignError;

      // 3. Create plan_sessions if enabled
      if (assignmentConfig.createSessions) {
        const sessionsToCreate = [];
        let currentDate = new Date(assignmentConfig.startDate);

        const currentDay = currentDate.getDay();
        const daysUntilPreferred = (assignmentConfig.preferredDay - currentDay + 7) % 7;
        if (daysUntilPreferred > 0) {
          currentDate = addDays(currentDate, daysUntilPreferred);
        }

        for (let i = 1; i <= savedTemplate.recommended_sessions; i++) {
          sessionsToCreate.push({
            assigned_plan_id: assignedPlan.id,
            session_number: i,
            scheduled_date: format(currentDate, 'yyyy-MM-dd'),
            status: 'pending'
          });
          currentDate = addWeeks(currentDate, 1);
        }

        const { error: sessionsError } = await supabase
          .from('plan_sessions')
          .insert(sessionsToCreate);

        if (sessionsError) logger.error('Error creating sessions:', sessionsError);
      }

      // 4. Create appointments if enabled
      if (assignmentConfig.createAppointments) {
        const appointmentsToCreate = [];
        let currentDate = new Date(assignmentConfig.startDate);

        const currentDay = currentDate.getDay();
        const daysUntilPreferred = (assignmentConfig.preferredDay - currentDay + 7) % 7;
        if (daysUntilPreferred > 0) {
          currentDate = addDays(currentDate, daysUntilPreferred);
        }

        const endTime = calculateEndTime(assignmentConfig.preferredTime, savedTemplate.session_duration_minutes);

        for (let i = 0; i < savedTemplate.recommended_sessions; i++) {
          appointmentsToCreate.push({
            patient_id: patientId,
            therapist_id: user.id,
            clinic_id: assignmentConfig.clinicId || null,
            organization_id: orgId,
            date: format(currentDate, 'yyyy-MM-dd'),
            start_time: assignmentConfig.preferredTime,
            end_time: endTime,
            status: 'scheduled',
            duration_minutes: savedTemplate.session_duration_minutes,
            notes: `${savedTemplate.name} - Sesión ${i + 1}`,
            recurring_group_id: assignedPlan.id,
            modality_patient: assignmentConfig.clinicId ? 'presencial' : 'online'
          });
          currentDate = addWeeks(currentDate, 1);
        }

        const { error: apptError } = await supabase
          .from('appointments')
          .insert(appointmentsToCreate);

        if (apptError) logger.warn('Error creating appointments:', apptError);
      }

      // 5. Create clinical_history entry for plan assignment
      try {
        await createClinicalEntry({
          patient_id: patientId,
          therapist_id: user.id,
          entry_type: 'plan_tratamiento',
          entry_date: new Date().toISOString(),
          summary: `Plan asignado: ${savedTemplate.name}`,
          session_notes: `Se asignó el plan "${savedTemplate.name}" con ${savedTemplate.recommended_sessions} sesiones programadas. Inicio: ${format(new Date(assignmentConfig.startDate), "d 'de' MMMM, yyyy", { locale: es })}.`,
          assigned_plan_id: assignedPlan.id,
          details: {
            plan_id: assignedPlan.id,
            template_id: savedTemplate.id,
            total_sessions: savedTemplate.recommended_sessions,
            start_date: assignmentConfig.startDate
          }
        });
      } catch (historyError) {
        logger.warn('Error creating clinical history entry:', historyError);
      }

      toast({
        title: '✅ Plan asignado',
        description: `Se crearon ${savedTemplate.recommended_sessions} sesiones para ${patientName || 'el paciente'}.`
      });

      if (onSuccess) onSuccess(savedTemplate);
      onClose();

    } catch (error) {
      logger.error('Error assigning plan:', error);
      toast({ variant: 'destructive', title: 'Error al asignar', description: error.message });
    } finally {
      setLoadingAction(null);
    }
  };

  // ==================== PUBLISH TO MARKETPLACE ====================
  const handlePublishToMarketplace = async () => {
    if (!formData.name) {
      toast({ variant: 'destructive', title: 'Guarda la plantilla primero' });
      return;
    }

    // First save the template if not saved
    if (!initialData?.id) {
      toast({ variant: 'destructive', title: 'Guarda la plantilla antes de publicar' });
      return;
    }

    setLoadingAction('publish');
    try {
      // Create marketplace_plans entry
      const { data: marketplacePlan, error: mpError } = await supabase
        .from('marketplace_plans')
        .insert({
          original_plan_id: initialData.id,
          author_id: user.id,
          author_name: user.user_metadata?.full_name || user.email,
          name: formData.name,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          description: formData.description,
          duration_weeks: parseInt(formData.duration_weeks),
          total_sessions: parseInt(formData.recommended_sessions),
          objectives_preview: objectives.slice(0, 3).map(o => ({ title: o.title })),
          price_clp: 0,
          is_free: true,
          status: 'draft',
          language: 'es'
        })
        .select()
        .maybeSingle();

      if (mpError) throw mpError;

      // Also create in marketplace_items for compatibility
      const { error: miError } = await supabase
        .from('marketplace_items')
        .insert({
          seller_id: user.id,
          plan_template_id: initialData.id,
          item_type: 'plan',
          title: formData.name,
          description: formData.description,
          price: 0,
          currency: 'CLP',
          is_active: false, // Draft until approved
          is_approved: false
        });

      if (miError) logger.warn('Error creating marketplace_items entry:', miError);

      toast({
        title: '✅ Enviado a Marketplace',
        description: 'Tu plantilla está en revisión. Te notificaremos cuando sea aprobada.'
      });

      setIsPublished(true);
      if (onSuccess) onSuccess(initialData);
      onClose();

    } catch (error) {
      logger.error('Error publishing to marketplace:', error);
      toast({ variant: 'destructive', title: 'Error al publicar', description: error.message });
    } finally {
      setLoadingAction(null);
    }
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const sessionsPreview = getSessionsPreview();
  const isLoading = loadingAction !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {initialData ? 'Editar Plantilla de Tratamiento' : 'Nueva Plantilla de Tratamiento'}
          </DialogTitle>
          <DialogDescription>
            {patientId
              ? `Diseña el plan y asígnalo a ${patientName || 'este paciente'}.`
              : 'Diseña un plan terapéutico reutilizable para tus pacientes.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 border-b bg-gray-50/50">
              <TabsList className={`grid w-full max-w-lg ${patientId ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="structure">Estructura</TabsTrigger>
                {patientId && (
                  <TabsTrigger value="assign" className="flex items-center gap-1">
                    <UserPlus className="h-3.5 w-3.5" />
                    Asignar
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              {/* ==================== TAB 1: DETAILS ==================== */}
              <TabsContent value="details" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 md:col-span-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Plan *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ej: Plan de Estimulación del Lenguaje Nivel 1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe brevemente el enfoque y propósito de este plan..."
                        className="h-24"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="general_objective">Objetivo General</Label>
                      <Textarea
                        id="general_objective"
                        name="general_objective"
                        value={formData.general_objective}
                        onChange={handleChange}
                        placeholder="¿Qué se espera lograr al finalizar el plan?"
                        className="h-24"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="target_population">Población Objetivo</Label>
                      <Input
                        id="target_population"
                        name="target_population"
                        value={formData.target_population}
                        onChange={handleChange}
                        placeholder="Ej: Niños de 3-5 años con TEL"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis_scope">Diagnósticos Relacionados</Label>
                      <Input
                        id="diagnosis_scope"
                        name="diagnosis_scope"
                        value={formData.diagnosis_scope}
                        onChange={handleChange}
                        placeholder="Ej: TEL, TEA, Retraso del lenguaje"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Logística</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Duración (semanas)</Label>
                        <Select
                          value={formData.duration_weeks.toString()}
                          onValueChange={(val) => handleSelectChange('duration_weeks', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[4, 8, 12, 16, 24].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} semanas</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recommended_sessions">Sesiones Totales</Label>
                        <Input
                          type="number"
                          id="recommended_sessions"
                          name="recommended_sessions"
                          value={formData.recommended_sessions}
                          onChange={handleChange}
                          min={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Duración Sesión (min)</Label>
                        <Select
                          value={formData.session_duration_minutes.toString()}
                          onValueChange={(val) => handleSelectChange('session_duration_minutes', val)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[30, 45, 60, 90].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} minutos</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ==================== TAB 2: STRUCTURE ==================== */}
              <TabsContent value="structure" className="mt-0 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">Objetivos Específicos</h3>
                    <p className="text-sm text-gray-500">Define los hitos a lograr y las actividades para cada uno.</p>
                  </div>
                  <Button onClick={addObjective} size="sm" className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-2" /> Agregar Objetivo
                  </Button>
                </div>

                {objectives.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                    <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No has definido objetivos aún.</p>
                    <Button variant="outline" onClick={addObjective} className="mt-4">
                      Agregar Objetivo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {objectives.map((objective, index) => (
                      <div key={objective.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        <div className="bg-gray-50/80 p-4 border-b flex gap-3 items-start">
                          <div className="mt-2 text-gray-400"><GripVertical className="h-5 w-5" /></div>
                          <div className="flex-1 space-y-3">
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <Label className="text-xs text-gray-500 mb-1 block">Objetivo {index + 1}</Label>
                                <Input
                                  value={objective.title}
                                  onChange={(e) => updateObjective(objective.id, 'title', e.target.value)}
                                  placeholder="Ej: Incrementar vocabulario expresivo"
                                  className="font-medium"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-red-500 h-8 w-8 mt-6"
                                onClick={() => removeObjective(objective.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Textarea
                              value={objective.description}
                              onChange={(e) => updateObjective(objective.id, 'description', e.target.value)}
                              placeholder="Descripción del objetivo..."
                              className="h-16 resize-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium flex items-center gap-2 text-gray-700">
                              <Dumbbell className="h-4 w-4 text-teal-600" />
                              Actividades
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-teal-600 h-7 text-xs"
                              onClick={() => addActivityToObjective(objective.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Actividad
                            </Button>
                          </div>

                          {(!objective.activities || objective.activities.length === 0) ? (
                            <div className="text-center py-4 bg-gray-50 rounded border border-dashed text-xs text-gray-400">
                              Sin actividades
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {objective.activities.map((activity) => (
                                <div key={activity.id} className="group relative bg-gray-50 p-3 rounded-md border">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={() => removeActivity(objective.id, activity.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                  <div className="grid grid-cols-12 gap-2">
                                    <div className="col-span-5">
                                      <Input
                                        value={activity.name}
                                        onChange={(e) => updateActivity(objective.id, activity.id, 'name', e.target.value)}
                                        placeholder="Nombre"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="col-span-5">
                                      <Input
                                        value={activity.materials}
                                        onChange={(e) => updateActivity(objective.id, activity.id, 'materials', e.target.value)}
                                        placeholder="Materiales"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <Input
                                        type="number"
                                        value={activity.duration_minutes}
                                        onChange={(e) => updateActivity(objective.id, activity.id, 'duration_minutes', e.target.value)}
                                        className="h-8 text-sm"
                                        placeholder="min"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* ==================== TAB 3: ASSIGN ==================== */}
              {patientId && (
                <TabsContent value="assign" className="mt-0 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-teal-600" />
                      Configurar Asignación para {patientName || 'Paciente'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="date"
                        value={assignmentConfig.startDate}
                        onChange={(e) => handleAssignmentChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Día Preferido</Label>
                      <Select
                        value={String(assignmentConfig.preferredDay)}
                        onValueChange={(v) => handleAssignmentChange('preferredDay', parseInt(v))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Hora de Sesión</Label>
                      <Input
                        type="time"
                        value={assignmentConfig.preferredTime}
                        onChange={(e) => handleAssignmentChange('preferredTime', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lugar</Label>
                      <Select
                        value={assignmentConfig.clinicId || "online"}
                        onValueChange={(v) => handleAssignmentChange('clinicId', v === "online" ? "" : v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Online" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          {clinics.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                      <Checkbox
                        id="createSessions"
                        checked={assignmentConfig.createSessions}
                        onCheckedChange={(checked) => handleAssignmentChange('createSessions', checked)}
                      />
                      <Label htmlFor="createSessions" className="cursor-pointer">
                        <span className="font-medium flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Generar sesiones programadas
                        </span>
                        <span className="block text-xs text-gray-500">
                          Se crearán {formData.recommended_sessions} sesiones
                        </span>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Checkbox
                        id="createAppointments"
                        checked={assignmentConfig.createAppointments}
                        onCheckedChange={(checked) => handleAssignmentChange('createAppointments', checked)}
                      />
                      <Label htmlFor="createAppointments" className="cursor-pointer">
                        <span className="font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          Crear citas en calendario
                        </span>
                        <span className="block text-xs text-gray-500">
                          Se agendarán automáticamente
                        </span>
                      </Label>
                    </div>
                  </div>

                  {sessionsPreview.length > 0 && (
                    <Card>
                      <CardContent className="p-3 space-y-1">
                        <Label className="text-xs text-gray-500">Vista previa</Label>
                        {sessionsPreview.map((s, i) => (
                          <div key={i} className="flex justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                            <span>Sesión {s.number}</span>
                            <span className="capitalize">{s.date}</span>
                            <span>{s.time}</span>
                          </div>
                        ))}
                        {formData.recommended_sessions > 4 && (
                          <p className="text-xs text-gray-500 text-center">... y {formData.recommended_sessions - 4} más</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}
            </ScrollArea>
          </Tabs>
        </div>

        {/* ==================== FOOTER WITH MULTIPLE ACTIONS ==================== */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-wrap gap-2">
          <div className="flex items-center gap-2 mr-auto">
            {/* Publish to Marketplace - only for existing templates */}
            {initialData?.id && !isPublished && (
              <Button
                variant="outline"
                onClick={handlePublishToMarketplace}
                disabled={isLoading}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {loadingAction === 'publish' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Store className="h-4 w-4 mr-2" />
                )}
                Publicar en Marketplace
              </Button>
            )}
            {isPublished && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Publicado
              </Badge>
            )}
          </div>

          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>

          {/* Save Template Only */}
          <Button
            variant="outline"
            onClick={handleSaveTemplate}
            disabled={isLoading}
          >
            {loadingAction === 'save' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar Plantilla
          </Button>

          {/* Save and Assign - only if patientId */}
          {patientId && (
            <Button
              onClick={handleSaveAndAssign}
              disabled={isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loadingAction === 'assign' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Guardar y Asignar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TreatmentPlanBuilderModal;