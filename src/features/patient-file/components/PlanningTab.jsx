import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PlusCircle,
  Calendar,
  Target,
  FileText,
  Store,
  Eye,
  Clock,
  CheckCircle2,
  ArrowRight,
  Edit,
  MoreVertical,
  Trash2,
  Copy,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabaseClient';
import TreatmentPlanBuilderModal from './TreatmentPlanBuilderModal';
import SessionManagerModal from './SessionManagerModal';
import logger from '@/lib/utils/logger';

const PlanningTab = ({
  patientId,
  patientName,
  goals,
  plans,
  templates = [],
  onRefresh
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Modal states
  const [isPlanBuilderOpen, setIsPlanBuilderOpen] = useState(false);
  const [isSessionManagerOpen, setIsSessionManagerOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Delete confirmation states
  const [deleteTemplate, setDeleteTemplate] = useState(null);
  const [deleteAssignedPlan, setDeleteAssignedPlan] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit existing assigned plan
  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setSelectedTemplate(null);
    setIsPlanBuilderOpen(true);
  };

  // Create new plan from scratch
  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setSelectedTemplate(null);
    setIsPlanBuilderOpen(true);
  };

  // Edit template
  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setSelectedPlan(null);
    setIsPlanBuilderOpen(true);
  };

  // Use template (assign to patient)
  const handleUseTemplate = (template) => {
    setSelectedTemplate(template);
    setSelectedPlan(null);
    setIsPlanBuilderOpen(true);
  };

  // Duplicate template
  const handleDuplicateTemplate = async (template) => {
    try {
      const { id, created_at, updated_at, marketplace_items, ...templateData } = template;

      const { data, error } = await supabase
        .from('treatment_plans')
        .insert({
          ...templateData,
          name: `${template.name} (copia)`,
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "✅ Plantilla duplicada" });
      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error('Error duplicating template:', error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo duplicar" });
    }
  };

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!deleteTemplate) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .delete()
        .eq('id', deleteTemplate.id);

      if (error) throw error;

      toast({ title: "✅ Plantilla eliminada" });
      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error('Error deleting template:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setDeleting(false);
      setDeleteTemplate(null);
    }
  };

  // Delete assigned plan (with sessions and appointments)
  const handleDeleteAssignedPlan = async () => {
    if (!deleteAssignedPlan) return;

    setDeleting(true);
    try {
      // 1. Delete related appointments (using recurring_group_id)
      await supabase
        .from('appointments')
        .delete()
        .eq('recurring_group_id', deleteAssignedPlan.id);

      // 2. Delete session_activities for this plan's sessions
      const { data: sessions } = await supabase
        .from('plan_sessions')
        .select('id')
        .eq('assigned_plan_id', deleteAssignedPlan.id);

      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        await supabase
          .from('session_activities')
          .delete()
          .in('session_id', sessionIds);
      }

      // 3. Delete plan_sessions
      await supabase
        .from('plan_sessions')
        .delete()
        .eq('assigned_plan_id', deleteAssignedPlan.id);

      // 4. Delete clinical_history entries related to this plan
      await supabase
        .from('clinical_history')
        .delete()
        .eq('assigned_plan_id', deleteAssignedPlan.id);

      // 5. Finally delete the assigned plan
      const { error } = await supabase
        .from('patient_assigned_plans')
        .delete()
        .eq('id', deleteAssignedPlan.id);

      if (error) throw error;

      toast({ title: "✅ Plan eliminado", description: "Se eliminaron todas las sesiones y citas asociadas." });
      if (onRefresh) onRefresh();
    } catch (error) {
      logger.error('Error deleting assigned plan:', error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setDeleting(false);
      setDeleteAssignedPlan(null);
    }
  };

  // Open session manager for a plan
  const handleManageSessions = (plan) => {
    setSelectedPlan(plan);
    setIsSessionManagerOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      active: { label: 'Activo', className: 'bg-green-50 text-green-700 border-green-200' },
      completed: { label: 'Completado', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      paused: { label: 'Pausado', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      cancelled: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    return configs[status] || configs.active;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Planificación Terapéutica</h2>
          <p className="text-xs sm:text-sm text-gray-500">Gestiona los planes de tratamiento y objetivos.</p>
        </div>
        <Button onClick={handleCreatePlan} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Plan
        </Button>
      </div>

      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="assigned">Planes Asignados ({plans?.length || 0})</TabsTrigger>
          <TabsTrigger value="templates">Mis Plantillas ({templates?.length || 0})</TabsTrigger>
        </TabsList>

        {/* ==================== ASSIGNED PLANS TAB ==================== */}
        <TabsContent value="assigned" className="mt-6 space-y-4">
          {plans && plans.length > 0 ? (
            plans.map((plan) => {
              const statusConfig = getStatusConfig(plan.status);

              return (
                <Card key={plan.id} className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs uppercase tracking-wide ${statusConfig.className}`}>
                            {statusConfig.label}
                          </Badge>
                          <span className="text-xs text-gray-400 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(plan.start_date)}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-teal-900">{plan.name}</CardTitle>
                        <CardDescription>
                          {plan.total_sessions ? `${plan.total_sessions} Sesiones estimadas` : 'Duración indefinida'}
                        </CardDescription>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleManageSessions(plan)}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Gestionar Sesiones
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Plan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteAssignedPlan(plan)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Target className="h-4 w-4 text-teal-500" />
                        <span>Progreso: {plan.progress_percentage || 0}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{plan.completed_sessions || 0} / {plan.total_sessions || '?'} sesiones</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 mt-3">
                      <div
                        className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${plan.progress_percentage || 0}%` }}
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 border-t bg-gray-50/50 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleManageSessions(plan)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Ver Sesiones
                    </Button>
                    <Button
                      variant="link"
                      className="text-teal-600 p-0 h-auto font-semibold"
                      onClick={() => handleEditPlan(plan)}
                    >
                      Ver detalles <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No hay planes activos</h3>
              <p className="text-gray-500 mb-4">Crea un plan de tratamiento para comenzar el seguimiento.</p>
              <Button onClick={handleCreatePlan} variant="outline">
                Comenzar Plan
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ==================== TEMPLATES TAB ==================== */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates && templates.length > 0 ? (
              templates.map((template) => {
                const marketplaceItem = template.marketplace_items?.[0];
                const isPublished = marketplaceItem?.is_active && marketplaceItem?.is_approved;

                return (
                  <Card key={template.id} className="flex flex-col h-full hover:border-teal-300 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold text-gray-800 line-clamp-2">
                          {template.name}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                          {isPublished && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 shrink-0">
                              En Tienda
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteTemplate(template)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs mt-1">
                        {template.description || "Sin descripción"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="flex-grow">
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {template.duration_weeks && (
                          <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {template.duration_weeks} semanas
                          </span>
                        )}
                        {template.recommended_sessions && (
                          <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> {template.recommended_sessions} sesiones
                          </span>
                        )}
                        {template.target_diagnosis && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center">
                            <Target className="w-3 h-3 mr-1" /> {template.target_diagnosis}
                          </span>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-3 border-t bg-gray-50/30 flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-800"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Usar
                      </Button>

                      {isPublished && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                          onClick={() => navigate(`/dashboard/marketplace/listings/${marketplaceItem.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Tienda
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No tienes plantillas</h3>
                <p className="text-gray-500 mb-4">Guarda tus planes como plantillas para reutilizarlos.</p>
                <Button onClick={handleCreatePlan} variant="outline">
                  Crear Primera Plantilla
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Treatment Plan Builder Modal */}
      {isPlanBuilderOpen && (
        <TreatmentPlanBuilderModal
          isOpen={isPlanBuilderOpen}
          onClose={() => {
            setIsPlanBuilderOpen(false);
            setSelectedPlan(null);
            setSelectedTemplate(null);
          }}
          patientId={patientId}
          patientName={patientName}
          initialData={selectedTemplate || selectedPlan}
          onSuccess={() => {
            setIsPlanBuilderOpen(false);
            setSelectedPlan(null);
            setSelectedTemplate(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Session Manager Modal */}
      {isSessionManagerOpen && selectedPlan && (
        <SessionManagerModal
          open={isSessionManagerOpen}
          onOpenChange={(open) => {
            setIsSessionManagerOpen(open);
            if (!open) setSelectedPlan(null);
          }}
          plan={selectedPlan}
          onUpdate={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Delete Template Confirmation */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La plantilla "{deleteTemplate?.name}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Assigned Plan Confirmation */}
      <AlertDialog open={!!deleteAssignedPlan} onOpenChange={() => setDeleteAssignedPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              ¿Eliminar plan asignado?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta acción eliminará permanentemente:</p>
              <ul className="list-disc list-inside text-sm space-y-1 bg-red-50 p-3 rounded-md">
                <li>El plan "{deleteAssignedPlan?.name}"</li>
                <li>Todas las sesiones programadas</li>
                <li>Las citas asociadas en el calendario</li>
                <li>Los registros en el historial clínico</li>
              </ul>
              <p className="font-medium text-red-600">Esta acción no se puede deshacer.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignedPlan}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlanningTab;