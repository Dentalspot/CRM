import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Loader2, User, Building } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { getOrgClinics, getOrgDentists } from '@/lib/api/org.api';
import TherapistScheduleModal from '@/components/clinic/TherapistScheduleModal';
import logger from '@/lib/utils/logger';

/**
 * @file src/pages/clinic/ClinicSchedulesPage.jsx
 *
 * Página acotada "Horarios del Equipo". Permite al clinic_admin Y a la
 * asistente editar los horarios de disponibilidad de cada dentista de la
 * organización — SIN exponer las acciones de gestión de personal
 * (invitar / revocar / reactivar), que viven en ClinicTherapistsManagementPage.
 *
 * Principio de mínimo privilegio (decisión founder 2026-05-24):
 *  - El dentista invitado NO controla sus horarios (RLS migration 20260522000005)
 *  - El clinic_admin y la asistente SÍ (RLS: availabilities_clinic_admin_manage
 *    + availabilities_assistant_manage migration 20260524000005)
 *  - Esta página es la UI de edición para ambos roles
 *
 * Compliance: la disponibilidad es dato OPERATIVO, no PHI clínica. No toca
 * Ley 20.584/21.719 (no es ficha del paciente).
 */
const ClinicSchedulesPage = () => {
  const { currentOrganizationId } = useCurrentOrganization();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [clinics, setClinics] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState('');

  // Modal de edición de horario por dentista
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState(null);

  const loadData = useCallback(async () => {
    if (!currentOrganizationId) return;
    setLoading(true);
    try {
      const [clinicsData, dentistsData] = await Promise.all([
        getOrgClinics(currentOrganizationId),
        getOrgDentists(currentOrganizationId),
      ]);
      setClinics(clinicsData || []);
      setDentists(dentistsData || []);
      // Auto-seleccionar la primera clínica
      if (clinicsData && clinicsData.length > 0) {
        setSelectedClinicId((prev) => prev || clinicsData[0].id);
      }
    } catch (error) {
      logger.error('[ClinicSchedulesPage] load failed:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los horarios del equipo.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentOrganizationId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId) || null;

  const handleEditSchedule = (dentist) => {
    setSelectedDentist(dentist);
    setScheduleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-800">Horarios del Equipo</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Define los días y horas en que cada dentista atiende en la clínica.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selector de clínica (solo si hay más de una) */}
            {clinics.length > 1 && (
              <Card>
                <CardContent className="p-4">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                    <Building className="h-4 w-4 text-primary" /> Clínica
                  </label>
                  <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Lista de dentistas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Dentistas
                  {selectedClinic && (
                    <span className="text-sm font-normal text-muted-foreground">
                      · {selectedClinic.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dentists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay dentistas activos en esta organización.
                  </p>
                ) : (
                  <div className="divide-y">
                    {dentists.map((dentist) => (
                      <div
                        key={dentist.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-full bg-primary/10 p-2 shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{dentist.full_name}</p>
                            {dentist.email && (
                              <p className="text-xs text-muted-foreground truncate">{dentist.email}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 shrink-0"
                          disabled={!selectedClinicId}
                          onClick={() => handleEditSchedule(dentist)}
                        >
                          <Calendar className="h-4 w-4" />
                          Editar Horarios
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <TherapistScheduleModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        therapist={selectedDentist}
        clinicId={selectedClinicId}
        clinicName={selectedClinic?.name}
        clinicModality="presencial"
      />
    </div>
  );
};

export default ClinicSchedulesPage;
