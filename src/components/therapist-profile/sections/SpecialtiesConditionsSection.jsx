/**
 * @file src/components/therapist-profile/sections/SpecialtiesConditionsSection.jsx
 * 
 * ACTUALIZADO: Las especialidades ahora son CALCULADAS automáticamente
 * por el sistema de reputación (basado en diagnósticos, citas, planes, etc.)
 * El terapeuta solo puede editar las "condiciones de interés" manualmente.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, XCircle, Save, Loader2, Info, Award } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useTherapistReputation } from '@/hooks/useTherapistReputation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logger from '@/lib/utils/logger';
import { Progress } from '@/components/ui/progress';

// ============================================
// COMPONENTE DE BARRA DE PROGRESO DE SCORE
// ============================================

const ScoreProgressBar = ({ score, color, size = 'md' }) => {
  const getColorClass = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const sizeClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className="w-full">
      <Progress value={score} className={sizeClass} />
    </div>
  );
};

// ============================================
// COMPONENTE DE LISTA DINÁMICA (condiciones)
// ============================================

const DynamicInputList = ({ items, setItems, placeholder, label, description }) => {
  const handleAddItem = () => setItems([...items, '']);
  const handleRemoveItem = (index) => setItems(items.filter((_, i) => i !== index));
  const handleChangeItem = (index, value) => setItems(items.map((item, i) => (i === index ? value : item)));

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            value={item}
            onChange={(e) => handleChangeItem(index, e.target.value)}
            placeholder={`${placeholder} #${index + 1}`}
            className="bg-background"
          />
          {items.length > 1 && (
            <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive hover:text-destructive/80 shrink-0">
              <XCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
        <PlusCircle className="mr-2 h-4 w-4" /> Añadir
      </Button>
    </div>
  );
};

// ============================================
// BADGE STYLES MAP
// ============================================

const BADGE_COLOR_MAP = {
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const SpecialtiesConditionsSection = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { reputation, loading: loadingReputation } = useTherapistReputation(user?.id);

  const [conditions, setConditions] = useState(['']);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar condiciones existentes
  useEffect(() => {
    if (profile?.specialization_areas) {
      setConditions(
        profile.specialization_areas.length > 0
          ? profile.specialization_areas
          : ['']
      );
    }
  }, [profile?.specialization_areas]);

  // Guardar solo condiciones (especialidades son automáticas)
  const handleSave = async () => {
    if (!user?.id) {
      toast({ title: 'Error', description: 'Usuario no encontrado.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { error: conditionsError } = await supabase
        .from('therapist_details')
        .update({
          specialization_areas: conditions.filter(c => c.trim() !== ''),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (conditionsError) throw conditionsError;

      toast({ title: '¡Éxito!', description: 'Tus condiciones de interés han sido guardadas.' });
    } catch (error) {
      logger.error('Error saving conditions:', error);
      toast({ title: 'Error', description: 'No se pudieron guardar las condiciones.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Datos de reputación
  const specialties = reputation?.specialties || [];
  const activeSpecs = specialties.filter(s => s.final_score > 0);
  const inactiveSpecs = specialties.filter(s => s.final_score === 0);

  return (
    <ProfileSectionCard
      id="specialties-conditions"
      title="Carrera Profesional"
      description="Tus especialidades se calculan automáticamente según tu actividad clínica en DentalSpot."
      className="bg-muted/20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ============================================
            COLUMNA IZQUIERDA: Especialidades (read-only)
            ============================================ */}
        <div className="p-6 bg-background rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Mis Especialidades
              </h3>
              <p className="text-sm text-muted-foreground">
                Calculadas automáticamente por tu práctica clínica.
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Tu especialidad se determina por los diagnósticos que registras,
                    citas que completas, planes de tratamiento, evaluaciones e informes clínicos.
                    No necesitas seleccionarlas manualmente.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {loadingReputation ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600 mr-2" />
              <span className="text-sm text-gray-500">Calculando especialidades...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Especialidades activas con score */}
              {activeSpecs.length > 0 ? (
                activeSpecs.map((spec) => {
                  const colorClass = BADGE_COLOR_MAP[spec.badge_color] || BADGE_COLOR_MAP.gray;
                  return (
                    <div
                      key={spec.specialty_slug}
                      className={`p-3 rounded-lg border ${colorClass}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{spec.specialty_icon}</span>
                          <span className="font-medium text-sm">{spec.specialty_name}</span>
                        </div>
                        <span className="text-sm font-bold">{spec.final_score}/100</span>
                      </div>
                      <ScoreProgressBar
                        score={spec.final_score}
                        color={spec.badge_color}
                        size="sm"
                      />
                      <p className="text-[10px] mt-1 opacity-60">
                        {spec.badge_emoji} {spec.badge_label}
                      </p>
                    </div>
                  );
                })
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Tus especialidades aparecerán aquí cuando registres diagnósticos, completes
                    citas y documentes tu trabajo clínico en DentalSpot.
                  </AlertDescription>
                </Alert>
              )}

              {/* Especialidades sin actividad */}
              {inactiveSpecs.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-gray-400 mb-2">Registradas sin actividad:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {inactiveSpecs.map((spec) => (
                      <span
                        key={spec.specialty_slug}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 border text-gray-400"
                      >
                        {spec.specialty_icon} {spec.specialty_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================
            COLUMNA DERECHA: Condiciones (editable)
            ============================================ */}
        <div className="p-6 bg-background rounded-xl border shadow-sm">
          <DynamicInputList
            items={conditions}
            setItems={setConditions}
            placeholder="Ej: Trastorno del Espectro Autista"
            label="Condiciones que Trato"
            description="Añade las condiciones específicas en las que te especializas."
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Condiciones
            </>
          )}
        </Button>
      </div>
    </ProfileSectionCard>
  );
};

export default SpecialtiesConditionsSection;