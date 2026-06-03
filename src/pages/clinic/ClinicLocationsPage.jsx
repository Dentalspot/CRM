/**
 * @file src/pages/clinic/ClinicLocationsPage.jsx
 *
 * "Gestión de Clínicas" — vista admin-level para gestionar las sucursales
 * de la organización + sus boxes.
 *
 * Scope MVP (Paso 1):
 *  - Lista de sucursales (clinics WHERE organization_id = current)
 *  - Por sucursal: nombre, dirección, status, contador de boxes/dentistas
 *  - CTA "Gestionar boxes" → abre ClinicBoxesModal
 *
 * Out of scope MVP (futuro):
 *  - Agregar/eliminar sucursales completas (hoy el flow está en wizard
 *    "Mi Perfil → Agenda → Mis Lugares de Atención" — se refactoriza
 *    en Paso 2)
 *  - Asignación dentista ↔ box (schedule semanal)
 *  - Vista agenda por box (Gantt)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Users,
  Loader2,
  RefreshCw,
  Settings,
  Armchair,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import logger from '@/lib/utils/logger';
import ClinicBoxesModal from '@/components/clinic/ClinicBoxesModal';
import ClinicLocationFormModal from '@/components/clinic/ClinicLocationFormModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ClinicLocationsPage = () => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [boxCountsByClinic, setBoxCountsByClinic] = useState({});
  const [therapistCountsByClinic, setTherapistCountsByClinic] = useState({});
  // max_boxes + max_clinics del plan activo (null = unlimited). Se carga
  // via query a subscriptions + subscription_plans. Fail-safe OPEN si falla.
  const [maxBoxes, setMaxBoxes] = useState(null);
  const [maxClinics, setMaxClinics] = useState(null);

  // Modal state
  const [boxesModalOpen, setBoxesModalOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  // CRUD sucursales (cierre del círculo Gestión de Clínicas)
  const [locationFormOpen, setLocationFormOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState(null);
  const [clinicToDelete, setClinicToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentOrganizationId) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      // 0) Limits del plan activo (best-effort, fail-open si no se puede)
      try {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plan_id, subscription_plans(max_boxes, max_clinics)')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subData?.subscription_plans?.max_boxes !== undefined) {
          setMaxBoxes(subData.subscription_plans.max_boxes);
        }
        if (subData?.subscription_plans?.max_clinics !== undefined) {
          setMaxClinics(subData.subscription_plans.max_clinics);
        }
      } catch (planErr) {
        logger.warn('[ClinicLocationsPage] plan lookup (non-fatal):', planErr.message);
      }

      // 1) Clinics de la org
      const { data: clinicsData, error: clinicsErr } = await supabase
        .from('clinics')
        .select('id, name, address, city_id, region_id, type, is_active, organization_id')
        .eq('organization_id', currentOrganizationId)
        .order('name');
      if (clinicsErr) throw clinicsErr;

      const list = clinicsData || [];
      setClinics(list);

      const clinicIds = list.map((c) => c.id);
      if (clinicIds.length === 0) {
        setBoxCountsByClinic({});
        setTherapistCountsByClinic({});
        return;
      }

      // 2) Conteo de boxes por sucursal
      const { data: boxesData, error: boxesErr } = await supabase
        .from('clinic_boxes')
        .select('clinic_id')
        .in('clinic_id', clinicIds);
      if (boxesErr) {
        logger.warn('[ClinicLocationsPage] boxes count (non-fatal):', boxesErr.message);
      }
      const boxMap = {};
      for (const row of boxesData || []) {
        boxMap[row.clinic_id] = (boxMap[row.clinic_id] || 0) + 1;
      }
      setBoxCountsByClinic(boxMap);

      // 3) Conteo de dentistas (clinic_therapists activos) por sucursal
      const { data: ctData, error: ctErr } = await supabase
        .from('clinic_therapists')
        .select('clinic_id')
        .in('clinic_id', clinicIds)
        .eq('is_active', true);
      if (ctErr) {
        logger.warn('[ClinicLocationsPage] therapist count (non-fatal):', ctErr.message);
      }
      const tMap = {};
      for (const row of ctData || []) {
        tMap[row.clinic_id] = (tMap[row.clinic_id] || 0) + 1;
      }
      setTherapistCountsByClinic(tMap);
    } catch (err) {
      logger.error('[ClinicLocationsPage] fetch:', err.message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'No se pudieron cargar las sucursales.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentOrganizationId, user?.id, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenBoxes = (clinic) => {
    setSelectedClinic(clinic);
    setBoxesModalOpen(true);
  };

  const handleOpenNewLocation = () => {
    if (maxClinics !== null && clinics.length >= maxClinics) {
      toast({
        variant: 'destructive',
        title: 'Límite del plan alcanzado',
        description: `Tu plan permite máximo ${maxClinics} sucursal${maxClinics !== 1 ? 'es' : ''}. Mejora tu plan para agregar más.`,
      });
      return;
    }
    setLocationToEdit(null);
    setLocationFormOpen(true);
  };

  const handleEditLocation = (clinic) => {
    setLocationToEdit(clinic);
    setLocationFormOpen(true);
  };

  // Soft delete: marca is_active=false en vez de DELETE. Es defensivo —
  // la clinic tiene muchas FK (boxes, appointments, patients, etc.) y
  // un hard delete puede romper datos clínicos. Si el user quiere hard
  // delete, lo hace desde la página de profile o se hace via support.
  const handleConfirmDelete = async () => {
    if (!clinicToDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ is_active: false })
        .eq('id', clinicToDelete.id);
      if (error) throw error;
      toast({
        title: 'Sucursal desactivada',
        description: 'Si necesitas eliminarla definitivamente, contacta a soporte.',
      });
      setClinicToDelete(null);
      await fetchData();
    } catch (err) {
      logger.error('[ClinicLocationsPage] delete:', err.message);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentOrganizationId) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Sin organización activa</h2>
        <p className="text-muted-foreground mt-2">
          Necesitas tener una clínica registrada para gestionar sucursales y boxes.
        </p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestión de Clínicas | DentalSpot</title>
      </Helmet>

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Clínicas</h1>
            <p className="text-muted-foreground mt-1">
              Sucursales y boxes de tu organización · {clinics.length}
              {maxClinics !== null && ` / ${maxClinics}`} sucursal{clinics.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={refreshing} title="Refrescar">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleOpenNewLocation} className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Nueva sucursal
            </Button>
          </div>
        </div>

        {/* Nota legal admin */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            Aquí gestionas <strong>sucursales</strong> y <strong>boxes</strong> de tu clínica. Para
            configuración avanzada de una sucursal (mapa, fotos, horarios públicos), también puedes
            ir a "Mi Perfil → Agenda → Mis Lugares de Atención".
          </p>
        </div>

        {/* Cards de sucursales */}
        {clinics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aún no hay sucursales</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Agregá tu primera sucursal para empezar a gestionar boxes y citas.
              </p>
              <Button onClick={handleOpenNewLocation}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primera sucursal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {clinics.map((clinic) => {
              const boxCount = boxCountsByClinic[clinic.id] || 0;
              const therapistCount = therapistCountsByClinic[clinic.id] || 0;
              return (
                <Card
                  key={clinic.id}
                  className={`transition-shadow hover:shadow-md ${
                    !clinic.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate" title={clinic.name}>
                            {clinic.name}
                          </h3>
                          {clinic.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{clinic.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          clinic.is_active
                            ? 'bg-green-100 text-green-700 border-0'
                            : 'bg-gray-200 text-gray-600 border-0'
                        }
                      >
                        {clinic.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Armchair className="h-3.5 w-3.5" />
                        <span>
                          {boxCount} {boxCount === 1 ? 'box' : 'boxes'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {therapistCount} dentista{therapistCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOpenBoxes(clinic)}
                      >
                        <Armchair className="h-4 w-4 mr-2" />
                        Gestionar boxes
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditLocation(clinic)}
                        title="Editar datos"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setClinicToDelete(clinic)}
                        title="Desactivar sucursal"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={!clinic.is_active}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ClinicBoxesModal
        isOpen={boxesModalOpen}
        onClose={() => setBoxesModalOpen(false)}
        clinic={selectedClinic}
        maxBoxes={maxBoxes}
        onChanged={fetchData}
      />

      <ClinicLocationFormModal
        isOpen={locationFormOpen}
        onClose={() => setLocationFormOpen(false)}
        clinic={locationToEdit}
        organizationId={currentOrganizationId}
        onSaved={fetchData}
      />

      <AlertDialog open={!!clinicToDelete} onOpenChange={(open) => !open && setClinicToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar esta sucursal?</AlertDialogTitle>
            <AlertDialogDescription>
              "{clinicToDelete?.name}" se marcará como inactiva. Ya no se podrán agendar
              citas nuevas en esta sucursal, pero los datos históricos (boxes, citas pasadas,
              pacientes) se preservan. Puedes reactivarla después desde el botón "Editar".
              <br /><br />
              Para eliminarla definitivamente, contactá a soporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desactivando...
                </>
              ) : (
                'Desactivar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ClinicLocationsPage;
