
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Save, Loader2, Trash2, Building2, ExternalLink, MapPin, UserCheck } from 'lucide-react';
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
  const { userOrgRoles = [] } = useCurrentOrganization();
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [showSearchStep, setShowSearchStep] = useState(false);
  // Clinics donde soy invitado (clinic_therapists.is_active=true) pero NO
  // soy dueño (clinics.therapist_id != user.id). Read-only en este UI.
  const [externalClinics, setExternalClinics] = useState([]);

  // Paso 2 spec "Gestión de Clínicas" — el dentista que ES admin de su org
  // (dual role) ve un banner que lo dirige al nuevo lugar centralizado.
  // Acá sigue pudiendo gestionar (no rompemos flow existente), pero le
  // mostramos dónde está la fuente oficial para boxes + sucursales múltiples.
  const isAdmin = userOrgRoles.includes('clinic_admin');

  const fetchClinics = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Query A: clinics donde soy dueño (therapist_id = user.id)
    const { data: ownedData, error: ownedErr } = await supabase
      .from('clinics')
      .select('*, therapist_availabilities(*)')
      .eq('therapist_id', user.id)
      .order('created_at', { ascending: true });

    if (ownedErr) {
      toast({ title: "Error", description: "No se pudieron cargar las clínicas.", variant: "destructive" });
      setLoading(false);
      return;
    }

    setClinics(ownedData?.map(c => ({...c, is_new: false, type: c.type || 'consulta_privada'})) || []);

    // Query B: clinics donde soy invitado (clinic_therapists.is_active=true)
    // pero NO dueño. Excluye las propias para evitar duplicación.
    // RLS de clinics permite leer las clinics de cualquier org donde es member.
    const ownedIds = (ownedData || []).map(c => c.id);
    try {
      const { data: invitedData, error: invitedErr } = await supabase
        .from('clinic_therapists')
        .select(`
          clinic_id,
          joined_at,
          clinics:clinic_id (
            id, name, address, type, is_active, organization_id, therapist_id
          )
        `)
        .eq('therapist_id', user.id)
        .eq('is_active', true);

      if (invitedErr) {
        logger.warn('[MyClinicsSection] invited clinics fetch (non-fatal):', invitedErr.message);
        setExternalClinics([]);
      } else {
        // Filtrar: solo las que NO son propias (therapist_id != user.id)
        // y que tengan datos de clinic (defensive)
        const external = (invitedData || [])
          .filter(row => row.clinics && !ownedIds.includes(row.clinic_id) && row.clinics.therapist_id !== user.id)
          .map(row => ({ ...row.clinics, joined_at: row.joined_at }));
        setExternalClinics(external);
      }
    } catch (err) {
      logger.warn('[MyClinicsSection] external clinics exception:', err.message);
      setExternalClinics([]);
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

  // Feature: dentista freelance/honorarios sin lugar fijo. Crea una "consulta
  // personal" minimalista (solo nombre) directamente — sin pasar por el form
  // completo de clínica. El trigger DB auto_create_organization_for_clinic
  // (B11) se encarga de crear la organization + roles clinic_admin/dentist,
  // así las RLS de pacientes/agenda/pagos funcionan igual que con una clínica.
  const handleCreatePersonalPractice = async () => {
    setIsSaving(true);
    try {
      const { data: newClinic, error } = await supabase
        .from('clinics')
        .insert({
          therapist_id: user.id,
          name: 'Mi consulta personal',
          // type debe ser uno de los valores del CHECK clinics_type_check
          // ('consulta_privada','colegio','clinica','hospital','otro').
          // Una consulta personal ES conceptualmente una consulta privada;
          // lo que la distingue (minimalista, sin datos empresa, no pública)
          // vive en is_public=false + ausencia de rut_empresa/address.
          type: 'consulta_privada',
          modality: 'presencial',
          is_public: false, // no aparece en el directorio público
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // El trigger B11 ya creó org + clinic_admin + dentist. Refrescamos.
      toast({
        title: '✅ Consulta personal creada',
        description: 'Ya puedes gestionar pacientes y agenda. Puedes editar el nombre y agregar más datos cuando quieras.',
      });
      setShowSearchStep(false);
      await fetchClinics();
    } catch (err) {
      logger.error('[MyClinicsSection] error creando consulta personal:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudo crear la consulta personal.',
      });
    } finally {
      setIsSaving(false);
    }
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
      // is_owner es flag de UI (no es columna en `clinics`), se procesa aparte
      const { is_new, therapist_availabilities, is_owner: _ownerFlag, ...clinicData } = clinic;
  
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

      // Fix D: Si el dentista marcó "Soy dueño/a", registrarlo como clinic_admin
      // en organization_members (idempotente). También asegurar membership como dentist.
      if (user?.id && savedClinicId && clinic.is_owner) {
        try {
          // 1) Obtener organization_id de la clínica (debería existir tras backfill)
          const { data: clinicRow } = await supabase
            .from('clinics')
            .select('organization_id')
            .eq('id', savedClinicId)
            .maybeSingle();

          let orgId = clinicRow?.organization_id;

          // 2) Si la clínica NO tiene org (caso raro post-backfill), crearla
          if (!orgId) {
            const { data: newOrg, error: orgErr } = await supabase
              .from('organizations')
              .insert({ name: payloadToSave.name })
              .select('id')
              .single();
            if (orgErr) throw orgErr;
            orgId = newOrg.id;
            // Linkear org a la clínica
            await supabase
              .from('clinics')
              .update({ organization_id: orgId })
              .eq('id', savedClinicId);
          }

          // 3) Insertar (o ignorar duplicado) row clinic_admin en organization_members
          const { error: adminErr } = await supabase
            .from('organization_members')
            .upsert(
              { organization_id: orgId, user_id: user.id, role: 'clinic_admin', is_active: true },
              { onConflict: 'organization_id,user_id,role', ignoreDuplicates: true }
            );
          if (adminErr) {
            logger.warn('[MyClinicsSection] org_members clinic_admin upsert error:', adminErr.message);
          }

          // 4) Asegurar también role='dentist' (sigue siendo profesional de su propia clínica)
          await supabase
            .from('organization_members')
            .upsert(
              { organization_id: orgId, user_id: user.id, role: 'dentist', is_active: true },
              { onConflict: 'organization_id,user_id,role', ignoreDuplicates: true }
            );
        } catch (err) {
          logger.warn('[MyClinicsSection] is_owner setup failed (non-blocking):', err?.message);
          toast({
            variant: 'destructive',
            title: 'Aviso',
            description: 'La clínica se guardó pero no pudimos otorgar acceso de admin automáticamente. Contacta soporte.',
          });
        }
      }

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

      {/* Paso 2 — Banner CTA a "Gestión de Clínicas" para admins.
          No bloquea el flow actual (algunos users prefieren editar acá);
          solo informa que existe el nuevo lugar centralizado para boxes y
          sucursales múltiples. Se oculta para dentistas que NO son admin
          (esos solo ven sus horarios y no tienen acceso al nuevo lugar). */}
      {isAdmin && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Building2 className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-0.5">
                  ¿Buscás gestionar boxes o sucursales múltiples?
                </p>
                <p className="text-blue-800">
                  La sección <strong>Gestión de Clínicas</strong> (menú lateral) es el lugar centralizado
                  para configurar boxes/salas físicas y administrar sucursales. Acá podés seguir editando
                  datos básicos y tus horarios de disponibilidad.
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white border-blue-300 text-blue-700 hover:bg-blue-100 flex-shrink-0"
            >
              <Link to="/dashboard/clinic/locations">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Ir a Gestión de Clínicas
              </Link>
            </Button>
          </div>
        </div>
      )}

      {loading ? (
         <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {showSearchStep && (
            <ClinicSearchStep
              onCreateNew={handleCreateNewFromSearch}
              onCreatePersonal={handleCreatePersonalPractice}
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

          {/* Clínicas donde soy invitado (read-only). Antes este flow no las
              mostraba porque la query solo traía clinics WHERE therapist_id=user.id.
              Ahora cada dentista ve TODOS los lugares donde trabaja, sin importar
              quién sea dueño. La edición de datos del lugar queda bloqueada por
              RLS — el dueño es el único que puede editar. El dentista invitado
              puede editar sus horarios personales desde el componente de
              disponibilidad (futuro followup, no en este commit). */}
          {externalClinics.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Clínicas donde trabajás como invitado
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Sos parte del equipo en estos lugares pero no podés editar sus datos. Para configurar tus horarios personales, contactá al admin de la clínica.
              </p>
              <div className="space-y-3">
                {externalClinics.map((clinic) => (
                  <Card key={clinic.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-semibold text-sm truncate" title={clinic.name}>{clinic.name}</h5>
                            {clinic.address && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{clinic.address}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Invitado
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 mt-8 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={handleAddClinic} disabled={isSaving || clinics.length >= MAX_CLINICS} className="text-gray-800 dark:text-gray-200">
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Lugar
        </Button>
        <Button onClick={handleSaveAll} disabled={isSaving || loading} size="lg" className="w-full sm:w-auto">
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
