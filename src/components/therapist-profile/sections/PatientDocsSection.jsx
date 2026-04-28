import React, { useState, useEffect } from 'react';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, FileText, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
// Fixed import path: pointing to the correct location in 'patient' folder
import TemplateBuilderModal from '@/components/patient/TemplateBuilderModal';
import logger from '@/lib/utils/logger';

const CATEGORIES = {
  anamnesis: { label: 'Anamnesis', color: 'bg-blue-100 text-blue-700' },
  evaluacion: { label: 'Evaluación', color: 'bg-purple-100 text-purple-700' },
  informe: { label: 'Informe', color: 'bg-green-100 text-green-700' },
  evolucion: { label: 'Evolución', color: 'bg-yellow-100 text-yellow-700' },
  consentimiento: { label: 'Consentimiento', color: 'bg-orange-100 text-orange-700' },
  certificado: { label: 'Certificado', color: 'bg-primary text-primary' },
  otro: { label: 'Otro', color: 'bg-gray-100 text-gray-700' },
};

const PatientDocsSection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicating, setDuplicating] = useState(null);
  
  // Modal states
  const [isBuilderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, template: null });

  useEffect(() => {
    if (user?.id) {
      loadTemplates();
    }
  }, [user?.id]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_document_templates')
        .select('*')
        .eq('therapist_id', user.id)
        .eq('is_global', false)
        .order('category')
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      logger.error('Error loading templates:', error);
      toast({ variant: "destructive", title: "Error al cargar plantillas" });
    } finally {
      setLoading(false);
    }
  };

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setBuilderOpen(true);
  };

  const handleEditTemplate = (template) => {
    // Check if it's a global template not owned by user
    if (template.is_global && template.therapist_id !== user.id) {
      toast({
        title: "Plantilla del sistema",
        description: "No puedes editar plantillas globales. Usa el botón 'Copiar' para crear tu propia versión.",
      });
      return;
    }
    setEditingTemplate(template);
    setBuilderOpen(true);
  };

  const handleDuplicateTemplate = async (template) => {
    setDuplicating(template.id);
    try {
      // Create a copy with the user as owner
      const newTemplate = {
        therapist_id: user.id,
        name: `${template.name} (Mi copia)`,
        category: template.category,
        content: template.content,
        variables: template.variables,
        is_global: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('patient_document_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) throw error;

      toast({ title: "✅ Plantilla duplicada", description: "Ahora puedes editarla libremente." });
      loadTemplates();

      // Optionally open the editor with the new template
      // setEditingTemplate(data);
      // setBuilderOpen(true);

    } catch (error) {
      logger.error('Error duplicating template:', error);
      toast({ variant: "destructive", title: "Error al duplicar", description: error.message });
    } finally {
      setDuplicating(null);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteConfirm.template) return;
    
    try {
      const { error } = await supabase
        .from('patient_document_templates')
        .delete()
        .eq('id', deleteConfirm.template.id);

      if (error) throw error;
      
      toast({ title: "✅ Plantilla eliminada" });
      loadTemplates();
    } catch (error) {
      toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
    } finally {
      setDeleteConfirm({ open: false, template: null });
    }
  };

  const handleDownload = (template) => {
    const blob = new Blob([JSON.stringify(template.variables, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "✅ Plantilla descargada" });
  };

  const getFieldCount = (template) => {
    try {
      const vars = typeof template.variables === 'string' 
        ? JSON.parse(template.variables) 
        : template.variables;
      return vars?.fields?.length || 
             vars?.structure?.length ||
             vars?.sections?.reduce((acc, s) => acc + (s.fields?.length || 0), 0) || 0;
    } catch {
      return 0;
    }
  };

  const isOwnTemplate = (template) => {
    return template.therapist_id === user.id;
  };

  const isSystemTemplate = (template) => {
    return template.is_global && template.therapist_id !== user.id;
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, t) => {
    const cat = t.category || 'otro';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <>
      <ProfileSectionCard
        id="patient-docs"
        title="Plantillas de Anamnesis y Evaluaciones"
        description="Genera plantillas de informes y certificados que puedes utilizar directo en tus fichas clínicas o vender en marketplace."
      >
        <div className="mb-6 flex justify-end">
          <Button onClick={handleNewTemplate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Plantilla
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Templates grouped by category */}
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={CATEGORIES[category]?.color || 'bg-gray-100'}>
                    {CATEGORIES[category]?.label || category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {categoryTemplates.length} plantilla{categoryTemplates.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {categoryTemplates.map((template) => (
                    <div 
                      key={template.id} 
                      className="flex items-center justify-between p-3 border rounded-md bg-background/50 hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-center min-w-0">
                        <FileText className="h-6 w-6 mr-3 text-primary shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{template.name}</span>
                            {isSystemTemplate(template) && (
                              <Badge variant="outline" className="text-[10px] shrink-0">Sistema</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {template.content || `${getFieldCount(template)} campos`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                        {isOwnTemplate(template) ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit className="mr-1 h-4 w-4" /> Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirm({ open: true, template })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <FileText className="mr-1 h-4 w-4" /> Ver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No tienes plantillas creadas aún.</p>
                <p className="text-sm">Crea tu primera plantilla para comenzar.</p>
              </div>
            )}
          </div>
        )}

      </ProfileSectionCard>

      {/* Template Builder Modal */}
      <TemplateBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditingTemplate(null);
        }}
        therapistId={user?.id}
        existingTemplate={editingTemplate}
        onSaved={loadTemplates}
      />

      {/* Delete Confirmation */}
      <AlertDialog 
        open={deleteConfirm.open} 
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, template: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Plantilla</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{deleteConfirm.template?.name}"? 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PatientDocsSection;