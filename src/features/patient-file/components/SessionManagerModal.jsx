/**
 * SessionManagerModal Component
 * 
 * Modal para gestionar sesiones de un plan de tratamiento.
 * Permite agregar actividades, registrar logros y completar sesiones.
 * 
 * @module features/sessions/components/SessionManagerModal
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Target,
  ClipboardList,
  AlertCircle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ✅ Imports centralizados
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

// ✅ Constants centralizados
import {
  SESSION_STATUS,
  SESSION_STATUS_LABELS,
  ACHIEVEMENT_LEVELS,
  ACHIEVEMENT_LEVEL_LABELS
} from '@/lib/constants/enums';
import {
  SESSION_STATUS_BADGE_STYLES,
  ACHIEVEMENT_LEVEL_BADGE_STYLES
} from '@/lib/constants/config';

// ✅ Utils centralizados
import { formatDate } from '@/lib/utils/formatters';
import { calculatePlanProgress } from '@/lib/utils/calculations';

// Componente de actividades
import ActivityInputWithLibrary from './ActivityInputWithLibrary';
import logger from '@/lib/utils/logger';

// ============================================
// CONSTANTS
// ============================================

// Configuración de estados de sesión con iconos
const SESSION_STATUS_CONFIG = {
  [SESSION_STATUS.PENDING]: {
    icon: Circle,
    iconColor: 'text-gray-400'
  },
  [SESSION_STATUS.SCHEDULED]: {
    icon: Calendar,
    iconColor: 'text-blue-500'
  },
  [SESSION_STATUS.COMPLETED]: {
    icon: CheckCircle2,
    iconColor: 'text-green-500'
  },
  [SESSION_STATUS.CANCELLED]: {
    icon: Circle,
    iconColor: 'text-red-400'
  },
  [SESSION_STATUS.RESCHEDULED]: {
    icon: Calendar,
    iconColor: 'text-orange-500'
  },
  // Fallback para status legacy
  pending: { icon: Circle, iconColor: 'text-gray-400' },
  scheduled: { icon: Calendar, iconColor: 'text-blue-500' },
  completed: { icon: CheckCircle2, iconColor: 'text-green-500' }
};

// Configuración de niveles de logro para el RadioGroup
const ACHIEVEMENT_CONFIG = {
  [ACHIEVEMENT_LEVELS.LOGRADO]: {
    shortLabel: 'L',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500 text-white'
  },
  [ACHIEVEMENT_LEVELS.EN_PROCESO]: {
    shortLabel: 'EP',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500 text-white'
  },
  [ACHIEVEMENT_LEVELS.NO_LOGRADO]: {
    shortLabel: 'NL',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500 text-white'
  },
  [ACHIEVEMENT_LEVELS.SUPERADO]: {
    shortLabel: 'S',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500 text-white'
  },
  // Legacy mappings
  'L': { shortLabel: 'L', borderColor: 'border-green-500', bgColor: 'bg-green-500 text-white' },
  'LP': { shortLabel: 'LP', borderColor: 'border-yellow-500', bgColor: 'bg-yellow-500 text-white' },
  'NL': { shortLabel: 'NL', borderColor: 'border-red-500', bgColor: 'bg-red-500 text-white' }
};

// Default form values
const DEFAULT_SESSION_FORM = {
  scheduled_date: '',
  notes: '',
  duration_minutes: 45, // Default duration
  activities: []
};

// ============================================
// COMPONENT
// ============================================

const SessionManagerModal = ({
  open,
  onOpenChange,
  plan,
  onUpdate
}) => {
  const { toast } = useToast();
  const { user } = useAuth();

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  // Session form state
  const [sessionForm, setSessionForm] = useState(DEFAULT_SESSION_FORM);

  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================

  useEffect(() => {
    if (open && plan?.id) {
      loadSessions();
    }
  }, [open, plan?.id]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_sessions')
        .select(`
          *,
          activities:session_activities(*),
          clinical_history:clinical_history(id, summary)
        `)
        .eq('assigned_plan_id', plan.id)
        .order('session_number');

      if (error) throw error;

      setSessions(data || []);

      // Auto-select first pending/scheduled session
      const firstActive = (data || []).find(s => s.status !== 'completed');
      if (firstActive) {
        handleSelectSession(firstActive);
      } else if (data?.length > 0) {
        handleSelectSession(data[data.length - 1]);
      }
    } catch (error) {
      logger.error('Error loading sessions:', error);
      toast({ variant: "destructive", title: "Error al cargar sesiones" });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MEMOIZED DATA
  // ============================================

  // Get activities available from the plan template
  const planActivities = useMemo(() => {
    if (!plan?.template?.objectives) return [];

    return plan.template.objectives.flatMap(obj =>
      (obj.activities || []).map(act => ({
        ...act,
        id: act.id,
        name: act.name,
        description: act.description,
        instructions: act.instructions,
        duration_minutes: act.duration_minutes || 15,
        materials: act.materials,
        objective_title: obj.title,
        category_name: obj.title
      }))
    );
  }, [plan?.template?.objectives]);

  // Selected session
  const selectedSession = useMemo(() => {
    return sessions.find(s => s.id === selectedSessionId);
  }, [sessions, selectedSessionId]);

  // ✅ Progress calculation using centralized function
  const progressData = useMemo(() => {
    return calculatePlanProgress(sessions, 'completed');
  }, [sessions]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectSession = (session) => {
    setSelectedSessionId(session.id);

    // Load session data into form
    setSessionForm({
      scheduled_date: session.scheduled_date || '',
      notes: session.notes || '',
      duration_minutes: session.duration_minutes || 45,
      activities: (session.activities || []).map(a => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        instructions: a.instructions || '',
        duration_minutes: a.duration_minutes || 15,
        materials: a.materials || '',
        achievement_level: a.achievement_level || null,
        // FIX: Determine source type based on which ID is present
        source_activity_id: a.activity_id || a.exercise_id,
        source_type: a.activity_id ? 'plan' : (a.exercise_id ? 'library' : 'manual')
      }))
    });
  };

  const handleActivitiesChange = (newActivities) => {
    setSessionForm(prev => ({
      ...prev,
      activities: newActivities.map((a, idx) => ({
        ...a,
        display_order: idx + 1
      }))
    }));
  };

  const handleActivityAchievementChange = (activityIndex, level) => {
    setSessionForm(prev => ({
      ...prev,
      activities: prev.activities.map((a, idx) =>
        idx === activityIndex ? { ...a, achievement_level: level } : a
      )
    }));
  };

  const handleSaveSession = async () => {
    if (!selectedSession) return;

    setSaving(true);
    try {
      // Determine status based on scheduled_date
      const newStatus = sessionForm.scheduled_date ? SESSION_STATUS.SCHEDULED : SESSION_STATUS.PENDING;

      // Update session
      const { error: sessionError } = await supabase
        .from('plan_sessions')
        .update({
          scheduled_date: sessionForm.scheduled_date || null,
          notes: sessionForm.notes || null,
          duration_minutes: parseInt(sessionForm.duration_minutes) || 45,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSession.id);

      if (sessionError) throw sessionError;

      // Delete existing activities
      await supabase
        .from('session_activities')
        .delete()
        .eq('session_id', selectedSession.id);

      // Insert new activities
      if (sessionForm.activities.length > 0) {
        const activitiesData = sessionForm.activities.slice(0, 3).map((a, idx) => ({
          session_id: selectedSession.id,
          // FIX: Map to correct column based on source type
          activity_id: a.source_type === 'plan' ? a.source_activity_id : null,
          exercise_id: a.source_type === 'library' ? a.source_activity_id : null,
          objective_id: null,
          name: a.name,
          description: a.description || null,
          instructions: a.instructions || null,
          duration_minutes: a.duration_minutes || 15,
          materials: a.materials || null,
          display_order: idx + 1,
          achievement_level: a.achievement_level || null,
          status: a.achievement_level ? 'completed' : 'pending'
        }));

        const { error: actError } = await supabase
          .from('session_activities')
          .insert(activitiesData);

        if (actError) throw actError;
      }

      toast({ title: "✓ Sesión guardada" });
      loadSessions();
      onUpdate?.();
    } catch (error) {
      logger.error('Error saving session:', error);
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;

    // Validate
    if (sessionForm.activities.length === 0) {
      toast({ variant: "destructive", title: "Agrega al menos una actividad" });
      return;
    }

    const unratedActivities = sessionForm.activities.filter(a => !a.achievement_level);
    if (unratedActivities.length > 0) {
      toast({
        variant: "destructive",
        title: "Completa los niveles de logro",
        description: "Todas las actividades deben tener un nivel de logro asignado"
      });
      return;
    }

    setCompleting(true);
    try {
      // First save the session
      await handleSaveSession();

      // Update session status to completed
      const { error: completeError } = await supabase
        .from('plan_sessions')
        .update({
          status: SESSION_STATUS.COMPLETED,
          completed_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSession.id);

      if (completeError) throw completeError;

      toast({ title: "✓ Sesión completada y registrada en historial" });
      loadSessions();
      onUpdate?.();
    } catch (error) {
      logger.error('Error completing session:', error);
      toast({ variant: "destructive", title: "Error al completar", description: error.message });
    } finally {
      setCompleting(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Get session status config with icon
   */
  const getSessionStatusConfig = (status) => {
    return SESSION_STATUS_CONFIG[status] || SESSION_STATUS_CONFIG[SESSION_STATUS.PENDING];
  };

  /**
   * Get session status badge styles
   * ✅ Uses centralized config
   */
  const getSessionStatusBadge = (status) => {
    // Handle legacy status values
    const statusMap = {
      'pending': SESSION_STATUS.PENDING,
      'scheduled': SESSION_STATUS.SCHEDULED,
      'completed': SESSION_STATUS.COMPLETED,
      'cancelled': SESSION_STATUS.CANCELLED,
      'rescheduled': SESSION_STATUS.RESCHEDULED
    };

    const normalizedStatus = statusMap[status] || status;
    return SESSION_STATUS_BADGE_STYLES[normalizedStatus] || SESSION_STATUS_BADGE_STYLES[SESSION_STATUS.PENDING];
  };

  /**
   * Get achievement level config
   */
  const getAchievementConfig = (level) => {
    return ACHIEVEMENT_CONFIG[level] || ACHIEVEMENT_CONFIG[ACHIEVEMENT_LEVELS.EN_PROCESO];
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" />
            Sesiones del Plan: {plan?.name || plan?.template?.name}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              {progressData.completed} / {progressData.total} completadas
            </span>
            <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 transition-all"
                style={{ width: `${progressData.percentage}%` }}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Sessions List - Left Panel */}
          <div className="w-64 border-r bg-gray-50 flex flex-col">
            <div className="p-3 border-b bg-white">
              <h3 className="font-medium text-sm text-gray-700">Sesiones</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No hay sesiones
                  </div>
                ) : (
                  sessions.map((session) => {
                    const statusConfig = getSessionStatusConfig(session.status);
                    const StatusIcon = statusConfig.icon;
                    const isSelected = selectedSessionId === session.id;

                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          isSelected
                            ? "bg-teal-100 border border-teal-300"
                            : "bg-white border border-gray-200 hover:border-teal-200 hover:bg-teal-50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <StatusIcon className={cn("h-4 w-4 shrink-0", statusConfig.iconColor)} />
                          <span className="font-medium text-sm">
                            Sesión {session.session_number}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 ml-6">
                          {/* ✅ Using centralized formatDate */}
                          {formatDate(session.scheduled_date || session.completed_date, 'd MMM yyyy') || 'Sin programar'}
                        </div>
                        {session.activities?.length > 0 && (
                          <div className="mt-1 ml-6">
                            <Badge variant="outline" className="text-[10px] h-4">
                              {session.activities.length} actividad{session.activities.length !== 1 ? 'es' : ''}
                            </Badge>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Session Detail - Right Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            {selectedSession ? (
              <>
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-6">
                    {/* Session Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          Sesión {selectedSession.session_number}
                        </h2>
                        {/* ✅ Badge with centralized styles */}
                        <Badge className={cn("border", getSessionStatusBadge(selectedSession.status).color)}>
                          {getSessionStatusBadge(selectedSession.status).label}
                        </Badge>
                      </div>
                      {selectedSession.clinical_history?.id && (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Registrada en historial
                        </Badge>
                      )}
                    </div>

                    {/* Schedule Date & Duration */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          Fecha Programada
                        </Label>
                        <Input
                          type="date"
                          value={sessionForm.scheduled_date}
                          onChange={(e) => setSessionForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                          disabled={selectedSession.status === 'completed'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          Duración (min)
                        </Label>
                        <Input
                          type="number"
                          min="15"
                          step="15"
                          value={sessionForm.duration_minutes}
                          onChange={(e) => setSessionForm(prev => ({ ...prev, duration_minutes: e.target.value }))}
                          disabled={selectedSession.status === 'completed'}
                        />
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-500" />
                        Actividades de la Sesión
                        <span className="text-xs text-gray-400">(máximo 3)</span>
                      </Label>

                      {selectedSession.status !== 'completed' ? (
                        <ActivityInputWithLibrary
                          value={sessionForm.activities}
                          onChange={handleActivitiesChange}
                          maxActivities={3}
                          planActivities={planActivities}
                          placeholder="Busca en la biblioteca o escribe una actividad..."
                        />
                      ) : (
                        // Read-only view for completed sessions
                        <div className="space-y-2">
                          {sessionForm.activities.map((activity, idx) => {
                            const achievementStyle = ACHIEVEMENT_LEVEL_BADGE_STYLES[activity.achievement_level];
                            return (
                              <Card key={idx} className="bg-gray-50">
                                <CardContent className="p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-medium">{activity.name}</span>
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        {activity.duration_minutes} min
                                      </Badge>
                                    </div>
                                    {activity.achievement_level && achievementStyle && (
                                      <Badge className={cn("border", achievementStyle.color)}>
                                        {achievementStyle.label}
                                      </Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}

                      {/* Achievement Level Selection */}
                      {selectedSession.status !== 'completed' && sessionForm.activities.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                          <Label className="text-sm font-medium mb-3 block">
                            Nivel de Logro por Actividad
                          </Label>
                          <div className="space-y-3">
                            {sessionForm.activities.map((activity, idx) => {
                              return (
                                <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                                  <span className="text-sm truncate flex-1">{activity.name}</span>
                                  <RadioGroup
                                    value={activity.achievement_level || ''}
                                    onValueChange={(v) => handleActivityAchievementChange(idx, v)}
                                    className="flex gap-2"
                                  >
                                    {Object.entries(ACHIEVEMENT_LEVELS).map(([key, value]) => {
                                      const config = getAchievementConfig(value);
                                      return (
                                        <div key={value} className="flex items-center">
                                          <RadioGroupItem
                                            value={value}
                                            id={`${activity.id}-${value}`}
                                            className={cn("border-2", config.borderColor)}
                                          />
                                          <Label
                                            htmlFor={`${activity.id}-${value}`}
                                            className={cn(
                                              "ml-1 text-xs cursor-pointer px-2 py-0.5 rounded",
                                              activity.achievement_level === value && config.bgColor
                                            )}
                                          >
                                            {config.shortLabel}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </RadioGroup>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label>Notas de la Sesión</Label>
                      <Textarea
                        value={sessionForm.notes}
                        onChange={(e) => setSessionForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Observaciones, progreso del paciente, ajustes realizados..."
                        rows={4}
                        disabled={selectedSession.status === 'completed'}
                      />
                    </div>
                  </div>
                </ScrollArea>

                {/* Actions Footer */}
                {selectedSession.status !== 'completed' && (
                  <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {sessionForm.activities.length === 0 && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          Agrega actividades para continuar
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleSaveSession}
                        disabled={saving}
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Guardar Borrador
                      </Button>
                      <Button
                        onClick={handleCompleteSession}
                        disabled={completing || sessionForm.activities.length === 0}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {completing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Completar Sesión
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Selecciona una sesión para ver los detalles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionManagerModal;