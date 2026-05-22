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
  AlertCircle,
} from 'lucide-react';
import logger from '@/lib/utils/logger';
import ClinicBoxesModal from '@/components/clinic/ClinicBoxesModal';

const ClinicLocationsPage = () => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [boxCountsByClinic, setBoxCountsByClinic] = useState({});
  const [therapistCountsByClinic, setTherapistCountsByClinic] = useState({});
  // max_boxes del plan activo (null = unlimited). Se carga via query a
  // user_subscriptions + subscription_plans. Si falla, queda como null
  // (fail-safe OPEN coherente con useActivePlanLimits).
  const [maxBoxes, setMaxBoxes] = useState(null);

  // Modal state
  const [boxesModalOpen, setBoxesModalOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);

  const fetchData = useCallback(async () => {
    if (!currentOrganizationId) {
      setLoading(false);
      return;
    }
    setRefreshing(true);
    try {
      // 0) Max boxes del plan activo (best-effort, fail-open si no se puede)
      try {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plan_id, subscription_plans(max_boxes)')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subData?.subscription_plans?.max_boxes !== undefined) {
          setMaxBoxes(subData.subscription_plans.max_boxes);
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
          Necesitás tener una clínica registrada para gestionar sucursales y boxes.
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
              Sucursales y boxes de tu organización · {clinics.length} sucursal
              {clinics.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={refreshing} title="Refrescar">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Nota legal admin */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-700 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            Acá gestionás <strong>sucursales</strong> y <strong>boxes</strong> de tu clínica. Para
            crear sucursales nuevas, usá el flow de "Mi Perfil → Agenda → Mis Lugares de Atención"
            (próximamente se unificará). Los boxes son las salas físicas donde se atiende a los pacientes.
          </p>
        </div>

        {/* Cards de sucursales */}
        {clinics.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Aún no hay sucursales</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Andá a tu Perfil → Agenda → Mis Lugares de Atención para registrar la primera.
              </p>
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
                        <Settings className="h-3.5 w-3.5" />
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

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleOpenBoxes(clinic)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gestionar boxes
                    </Button>
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
    </>
  );
};

export default ClinicLocationsPage;
