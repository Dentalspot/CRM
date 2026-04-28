
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Save, Loader2, Trash2 } from 'lucide-react';
import ClinicCard from '@/components/therapist-profile/ClinicCard';
import ClinicSearchStep from '@/components/clinic/ClinicSearchStep';
import { cleanRutEmpresa } from '@/services/clinicDetectionService';
import logger from '@/lib/utils/logger';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MAX_CLINICS = 10;

const MyClinicsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [showSearchStep, setShowSearchStep] = useState(false);

  const fetchClinics = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clinics')
      .select('*, therapist_availabilities(*)')
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las clínicas.", variant: "destructive" });
    } else {
      setClinics(data?.map(c => ({...c, is_new: false, type: c.type || 'consulta_privada'})) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchClinics();
  }, [fetchClinics]);

  const handleAddClinic = () => {
    if (clinics.length >= MAX_CLINICS) {
      toast({ title: "Límite alcanzado", description: `No puedes agregar más de ${MAX_CLINICS} lugares.`, variant: "destructive" });
      return;
    }
    setShowSearchStep(true);
  };

  const handleCreateNewFromSearch = (prefill = {}) => {
    const newClinic = {
      id: `new-${Date.now()}`,
      therapist_id: user.id,
      name: prefill.name || '',
      rut_empresa: prefill.rutEmpresa || '',
      address: '',
      city_id: null,
      region_id: null,
      modality: 'presencial',
      is_public: true,
      type: 'consulta_privada',
      rbd: '',
      therapist_availabilities: [],
      is_new: true,
    };
    setClinics(prev => [...prev, newClinic]);
    setShowSearchStep(false);
  };

  const handleUpdateClinic = (updatedClinic) => {
    setClinics(prev => prev.map(c => c.id === updatedClinic.id ? updatedClinic : c));
  };

  const openDeleteDialog = (clinic) => {
    setClinicToDelete(clinic);
  };

  const handleDeleteClinic = async () => {
    if (!clinicToDelete) return;

    if (clinicToDelete.is_new) {
      setClinics(prev => prev.filter(c => c.id !== clinicToDelete.id));
      setClinicToDelete(null);
      return;
    }

    const { error } = await supabase.from('clinics').delete().eq('id', clinicToDelete.id);
    if (error) {
      toast({ title: "Error", description: `No se pudo eliminar el lugar: ${error.message}`, variant: "destructive" });
    } else {
      toast({ title: "✅ Éxito", description: "Lugar eliminado correctamente." });
      setClinics(prev => prev.filter(c => c.id !== clinicToDelete.id));
    }
    setClinicToDelete(null);
  };

  // Vincular terapeuta a clínica existente (por RUT) como pendiente de aprobación
  const linkToExistingClinic = async (rutEmpresa) => {
    try {
      const { data: existingClinic } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('rut_empresa', rutEmpresa)
        .maybeSingle();

      if (!existingClinic) return false;

      // Verificar si ya está vinculado
      const { data: existing } = await supabase
        .from('clinic_therapists')
        .select('id, is_active')
        .eq('clinic_id', existingClinic.id)
        .eq('therapist_id', user.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: existing.is_active ? 'Ya vinculado' : 'Solicitud pendiente',
          description: existing.is_active
            ? `Ya estás vinculado a "${existingClinic.name}".`
            : `Tu solicitud para "${existingClinic.name}" está pendiente de aprobación.`,
        });
        return true;
      }

      // Crear vínculo como inactivo (pendiente de aprobación por la clínica)
      const { error: linkError } = await supabase
        .from('clinic_therapists')
        .insert({
          clinic_id: existingClinic.id,
          therapist_id: user.id,
          is_active: false, // pendiente hasta que la clínica apruebe
        });

      if (linkError) throw linkError;

      toast({
        title: '📩 Solicitud enviada',
        description: `Se envió tu solicitud para unirte a "${existingClinic.name}". La clínica debe aprobarla.`,
      });
      return true;
    } catch (err) {
      logger.error('Error linking to existing clinic:', err);
      return false;
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);

    for (const clinic of clinics) {
      const { is_new, therapist_availabilities, ...clinicData } = clinic;
  
      if (!clinicData.name || !clinicData.address || !clinicData.city_id) {
        toast({ title: "❌ Campos incompletos", description: `Completa nombre, dirección y ciudad para el lugar "${clinicData.name || 'Nuevo Lugar'}".`, variant: "destructive" });
        setIsSaving(false);
        return;
      }
  
      let savedClinicId = clinic.id;
      // Explicitly include type and rbd as requested
      const payloadToSave = {
        ...clinicData,
        type: clinic.type || 'consulta_privada',
        rbd: clinic.type === 'colegio' ? clinic.rbd : null,
        rut_empresa: clinic.rut_empresa?.trim() ? cleanRutEmpresa(clinic.rut_empresa) : null,
      };

      if (is_new) {
        const { id, ...insertData } = payloadToSave;
        const { data: newClinic, error } = await supabase.from('clinics').insert(insertData).select().maybeSingle();
        if (error) {
          // Si el RUT ya existe, vincular al terapeuta a la clínica existente como pendiente
          if (error.message?.includes('idx_clinics_rut_empresa') && payloadToSave.rut_empresa) {
            const linked = await linkToExistingClinic(payloadToSave.rut_empresa);
            if (linked) continue;
          }
          toast({ title: "Error al crear lugar", description: error.message, variant: "destructive" });
          setIsSaving(false);
          return;
        }
        savedClinicId = newClinic.id;
      } else {
        const { error } = await supabase.from('clinics').update(payloadToSave).eq('id', clinic.id);
        if (error) {
          // Si el RUT ya existe en otra clínica, vincular como pendiente
          if (error.message?.includes('idx_clinics_rut_empresa') && payloadToSave.rut_empresa) {
            const linked = await linkToExistingClinic(payloadToSave.rut_empresa);
            if (linked) continue;
          }
          toast({ title: "Error al actualizar lugar", description: error.message, variant: "destructive" });
          setIsSaving(false);
          return;
        }
      }

      // --- LUGAR EXACTO DONDE LA CLÍNICA ES GUARDADA EXITOSAMENTE ---
      // Task 1 & 2: Verificar si es colegio y realizar upsert silencioso en pie_therapist_schools
      if (user?.id && savedClinicId && payloadToSave.type === 'colegio') {
        try {
          const { error: pieError } = await supabase
            .from('pie_therapist_schools')
            .upsert(
              {
                therapist_id: user.id,
                school_id: savedClinicId,
                hours_assigned: 0,
                academic_year: new Date().getFullYear()
              },
              { onConflict: 'therapist_id,school_id,academic_year', ignoreDuplicates: true }
            );
            
          if (pieError) {
            logger.error("Error silent upsert in pie_therapist_schools:", pieError);
          }
        } catch (err) {
          logger.error("Exception silent upsert in pie_therapist_schools:", err);
        }
      }
  
      const { error: deleteError } = await supabase.from('therapist_availabilities').delete().eq('clinic_id', savedClinicId);
      if(deleteError && !is_new) logger.error("Error cleaning schedules: ", deleteError);

      if (therapist_availabilities && therapist_availabilities.length > 0) {
          const schedulesToInsert = therapist_availabilities.map(s => ({
              clinic_id: savedClinicId,
              therapist_id: user.id,
              day_of_week: s.day_of_week,
              start_time: s.start_time,
              end_time: s.end_time,
              is_active: s.is_active,
              modality: clinic.modality,
          }));
        const { error: schedulesError } = await supabase
          .from('therapist_availabilities')
          .insert(schedulesToInsert);
          if (schedulesError) {
              toast({ title: "Error al guardar horarios", description: schedulesError.message, variant: "destructive" });
              setIsSaving(false);
              return;
          }
      }
    }
  
    toast({ title: "✅ ¡Guardado!", description: "Tus lugares y horarios se han actualizado." });
    await fetchClinics();
    setIsSaving(false);
  };

  return (
    <Card className="overflow-hidden rounded-lg shadow-lg border-t-4 border-primary">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 border-b border-gray-100">
        <CardTitle className="text-2xl font-extrabold text-gray-800 tracking-tight">Mis Lugares de Atención</CardTitle>
        <CardDescription className="mt-2 text-md text-gray-600 leading-relaxed">Registra los lugares donde atiendes y tus horarios de disponibilidad.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 bg-white">

      {loading ? (
         <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {showSearchStep && (
            <ClinicSearchStep
              onCreateNew={handleCreateNewFromSearch}
              onJoinExisting={(clinicId) => {
                toast({ title: '✅ Te has unido a la clínica' });
                setShowSearchStep(false);
                fetchClinics();
              }}
            />
          )}
          <AnimatePresence>
            {clinics.map((clinic, index) => (
              <motion.div
                key={clinic.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className={`rounded-2xl ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50 dark:bg-gray-800/50'}`}
              >
                <ClinicCard
                  clinic={clinic}
                  onUpdate={handleUpdateClinic}
                  onDelete={() => openDeleteDialog(clinic)}
                  isExpandedDefault={clinic.is_new || clinics.length === 1}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-8 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={handleAddClinic} disabled={isSaving || clinics.length >= MAX_CLINICS} className="text-gray-800 dark:text-gray-200">
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Lugar
        </Button>
        <Button onClick={handleSaveAll} disabled={isSaving || loading} size="lg" className="w-full sm:w-auto bg-[#ff74c3] text-white hover:bg-gradient-to-r hover:from-[#ff74c3] hover:to-[#33e1d1]">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Guardando...' : 'Guardar Todo'}
        </Button>
      </div>

      <Dialog open={!!clinicToDelete} onOpenChange={() => setClinicToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Estás seguro de que quieres eliminar este lugar?</DialogTitle>
            <DialogDescription>Esta acción no se puede deshacer. Se eliminarán permanentemente el lugar y todos sus horarios asociados.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClinicToDelete(null)}>Cancelar</Button>
            <Button onClick={handleDeleteClinic} variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </CardContent>
    </Card>
  );
};

export default MyClinicsSection;
