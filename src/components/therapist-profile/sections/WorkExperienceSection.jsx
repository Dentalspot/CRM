import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import logger from '@/lib/utils/logger';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';
import {
  fromDbRow,
  fetchWorkExperiences,
  saveWorkExperiences,
  deleteWorkExperience
} from './work-experience.utils';

const WorkExperienceSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experiences, setExperiences] = useState(fromDbRow(null));

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await fetchWorkExperiences(user.id);
      const formattedData = fromDbRow(data);
      if (formattedData.length > 0) {
        setExperiences(formattedData);
      } else {
        setExperiences(fromDbRow(null));
      }
    } catch (error) {
      logger.error("Error loading experiences:", error);
      toast({
        title: "Error al cargar",
        description: "No se pudo cargar tu experiencia laboral.",
        variant: "destructive"
      });
      setExperiences(fromDbRow(null));
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (index, field, value) => {
    setExperiences(prev => {
      const newExperiences = [...prev];
      newExperiences[index] = {
        ...newExperiences[index],
        [field]: value
      };
      return newExperiences;
    });
  };

  const addExperience = () => {
    setExperiences(prev => [...prev, {
      id: null,
      role: '',
      institution: '',
      start_date: '',
      end_date: '',
      location: '',
      description: '',
      is_public: false
    }]);
  };

  const removeExperience = async (index) => {
    const experience = experiences[index];

    // Si la experiencia tiene ID, eliminarla de la BD
    if (experience.id) {
      try {
        setSaving(true);
        await deleteWorkExperience(experience.id);
        toast({
          title: "✅ Eliminado",
          description: "La experiencia se eliminó correctamente."
        });
        await loadData(); // Recargar desde la BD
      } catch (error) {
        toast({
          title: "❌ Error al eliminar",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setSaving(false);
      }
    } else {
      // Si no tiene ID, solo removerla del estado local
      const newExperiences = experiences.filter((_, i) => i !== index);
      if (newExperiences.length === 0) {
        setExperiences(fromDbRow(null)); // Resetear a estado vacío
      } else {
        setExperiences(newExperiences);
      }
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "⚠️ Error",
        description: "No se ha detectado usuario autenticado.",
        variant: "destructive"
      });
      return;
    }

    // Validar que al menos una experiencia tenga datos válidos
    const hasValidData = experiences.some(exp =>
      exp.role?.trim() && exp.institution?.trim()
    );

    if (!hasValidData) {
      toast({
        title: "⚠️ Campos requeridos",
        description: "Debes completar al menos el cargo y la institución.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await saveWorkExperiences(experiences, user.id);
      toast({
        title: "✅ Guardado exitoso",
        description: "Tu experiencia laboral se ha actualizado correctamente."
      });
      await loadData(); // Recargar para obtener IDs actualizados
    } catch (error) {
      logger.error('Error al guardar:', error);
      toast({
        title: "❌ Error al guardar",
        description: error.message || "Ocurrió un error al guardar la experiencia.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProfileSectionCard
        id="work-experience"
        title="Experiencia Laboral"
        description="Describe tus roles y responsabilidades anteriores."
        className="bg-muted/20"
      >
        <div className="flex justify-center items-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ProfileSectionCard>
    );
  }

  return (
    <ProfileSectionCard
      id="work-experience"
      title="Experiencia Laboral"
      description="Describe tus roles y responsabilidades anteriores."
      className="bg-muted/20"
    >
      <div className="space-y-4">
        {experiences.map((experience, index) => (
          <div
            key={experience.id || `new-${index}`}
            className="p-6 bg-background rounded-xl border shadow-sm space-y-4 relative"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeExperience(index)}
              className="absolute top-3 right-3 text-destructive hover:text-destructive/80"
              disabled={saving}
              aria-label="Eliminar experiencia"
            >
              <Trash2 className="h-5 w-5" />
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`role-${index}`}>
                  Cargo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`role-${index}`}
                  value={experience.role}
                  onChange={(e) => handleChange(index, 'role', e.target.value)}
                  placeholder="Ej: Fonoaudiólogo Clínico"
                  className="bg-background"
                  required
                />
              </div>
              <div>
                <Label htmlFor={`institution-${index}`}>
                  Institución / Empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`institution-${index}`}
                  value={experience.institution}
                  onChange={(e) => handleChange(index, 'institution', e.target.value)}
                  placeholder="Ej: Hospital San Juan"
                  className="bg-background"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`start-date-${index}`}>Fecha Inicio</Label>
                <Input
                  id={`start-date-${index}`}
                  type="date"
                  value={experience.start_date}
                  onChange={(e) => handleChange(index, 'start_date', e.target.value)}
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor={`end-date-${index}`}>Fecha Término</Label>
                <Input
                  id={`end-date-${index}`}
                  type="date"
                  value={experience.end_date}
                  onChange={(e) => handleChange(index, 'end_date', e.target.value)}
                  placeholder="Dejar vacío si es actual"
                  className="bg-background"
                />
              </div>
              <div>
                <Label htmlFor={`location-${index}`}>Ubicación</Label>
                <Input
                  id={`location-${index}`}
                  value={experience.location}
                  onChange={(e) => handleChange(index, 'location', e.target.value)}
                  placeholder="Ej: Santiago, Chile"
                  className="bg-background"
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`description-${index}`}>Descripción</Label>
              <Textarea
                id={`description-${index}`}
                value={experience.description}
                onChange={(e) => handleChange(index, 'description', e.target.value)}
                placeholder="Describe tus responsabilidades y logros..."
                rows={3}
                className="bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`is-public-${index}`}
                checked={experience.is_public}
                onCheckedChange={(checked) => handleChange(index, 'is_public', checked)}
              />
              <Label htmlFor={`is-public-${index}`} className="cursor-pointer text-sm">
                Hacer esta experiencia visible en mi perfil público
              </Label>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addExperience}
          className="w-full"
          disabled={saving}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Otra Experiencia
        </Button>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={saving || !user}
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </ProfileSectionCard>
  );
};

export default WorkExperienceSection;