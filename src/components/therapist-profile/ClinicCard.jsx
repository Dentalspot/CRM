
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, ChevronDown, Trash2, Clock, PlusCircle, XCircle, Lock } from 'lucide-react';
import useLocation from '@/hooks/useLocation';
import { useAddOnAccess } from '@/hooks/useAddOnAccess';
import UpgradeModal from '@/components/modals/UpgradeModal';
import { Badge } from '@/components/ui/badge';
import { ADD_ON_PIE } from '@/constants/planFeatures';
import { formatRutEmpresa } from '@/services/clinicDetectionService';

const weekDays = [
  { id: 1, name: 'Lunes' }, { id: 2, name: 'Martes' }, { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' }, { id: 5, name: 'Viernes' }, { id: 6, name: 'Sábado' }, { id: 0, name: 'Domingo' }
];

const TimeInput = ({ value, onChange, ...props }) => (
  <Input type="time" value={value || ''} onChange={onChange} className="bg-background w-full" {...props} />
);

const AvailabilityManager = ({ clinic, onUpdate }) => {
  const schedules = clinic.therapist_availabilities || [];

  const handleAddSchedule = () => {
    const newSchedule = {
      id: `temp-${Date.now()}`,
      day_of_week: 1,
      start_time: '09:00',
      end_time: '18:00',
      modality: clinic.modality,
      is_active: true
    };
    onUpdate({ ...clinic, therapist_availabilities: [...schedules, newSchedule] });
  };

  const handleRemoveSchedule = (scheduleId) => {
    const updatedSchedules = schedules.filter(s => (s.id || s.day_of_week) !== scheduleId);
    onUpdate({ ...clinic, therapist_availabilities: updatedSchedules });
  };

  const handleScheduleChange = (scheduleId, field, value) => {
    const updatedSchedules = schedules.map(s => (s.id || s.day_of_week) === scheduleId ? { ...s, [field]: value } : s);
    onUpdate({ ...clinic, therapist_availabilities: updatedSchedules });
  };

  return (
    <div className="space-y-4 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-md text-gray-800 dark:text-gray-200 flex items-center" style={{color: '#ff74c3'}}>
          <Clock className="mr-2 h-5 w-5" /> Horarios de Atención
        </h4>
        <Button variant="outline" size="sm" onClick={handleAddSchedule} className="border-[#33e1d1] text-[#33e1d1] hover:bg-[#33e1d1] hover:text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Horario
        </Button>
      </div>
      {schedules.length === 0 && (
        <p className="text-sm text-center text-muted-foreground py-4">Aún no has agregado horarios para esta clínica.</p>
      )}
      <div className="space-y-3">
        <AnimatePresence>
          {schedules.map((schedule) => (
            <motion.div
              key={schedule.id || schedule.day_of_week}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr,1fr,auto] gap-3 items-center p-3 bg-muted/50 rounded-lg"
            >
              {/* Selector de día */}
              <Select value={String(schedule.day_of_week)} onValueChange={(value) => handleScheduleChange(schedule.id || schedule.day_of_week, 'day_of_week', parseInt(value))}>
                <SelectTrigger><SelectValue placeholder="Día" /></SelectTrigger>
                <SelectContent>
                  {weekDays.map(day => <SelectItem key={day.id} value={String(day.id)}>{day.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Rango de horas */}
              <div className="flex items-center gap-2">
                <TimeInput value={schedule.start_time} onChange={(e) => handleScheduleChange(schedule.id || schedule.day_of_week, 'start_time', e.target.value)} />
                <span>-</span>
                <TimeInput value={schedule.end_time} onChange={(e) => handleScheduleChange(schedule.id || schedule.day_of_week, 'end_time', e.target.value)} />
              </div>

              {/* Botón eliminar */}
              <Button variant="ghost" size="icon" onClick={() => handleRemoveSchedule(schedule.id || schedule.day_of_week)} className="text-destructive hover:bg-destructive/10">
                <XCircle className="h-5 w-5" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ClinicCard = ({ clinic, onUpdate, onDelete, isExpandedDefault = false }) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { regions, cities, loadingRegions, loadingCities, fetchCities } = useLocation();
  const { hasAccess: hasPieAccess } = useAddOnAccess(ADD_ON_PIE);

  useEffect(() => {
    if (clinic.region_id) {
      fetchCities(clinic.region_id);
    }
  }, [clinic.region_id, fetchCities]);

  const handleFieldChange = (field, value) => {
    if (field === 'type') {
      if (value === 'colegio' && !hasPieAccess) {
        setIsUpgradeModalOpen(true);
        return; // Revert/prevent change
      }
      const updates = { [field]: value };
      if (value !== 'colegio') {
        updates.rbd = '';
      }
      onUpdate({ ...clinic, ...updates });
      return;
    }

    if (field === 'modality') {
      const updatedSchedules = (clinic.therapist_availabilities || []).map(schedule => ({
        ...schedule,
        modality: value
      }));
      onUpdate({ ...clinic, [field]: value, therapist_availabilities: updatedSchedules });
    } else {
      onUpdate({ ...clinic, [field]: value });
    }
  };

  const handleRegionChange = (regionId) => {
    const numericRegionId = Number(regionId);
    onUpdate({ ...clinic, region_id: numericRegionId, city_id: null });
    fetchCities(numericRegionId);
  };

  const handleCityChange = (cityId) => {
    onUpdate({ ...clinic, city_id: Number(cityId) });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'colegio':
        return { color: 'bg-green-100 text-green-800 border-green-200', emoji: '🏫', label: 'Colegio' };
      case 'clinica':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', emoji: '🏨', label: 'Clínica' };
      case 'hospital':
        return { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', emoji: '🏥', label: 'Hospital' };
      case 'otro':
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', emoji: '🏢', label: 'Otro' };
      case 'consulta_privada':
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', emoji: '🏥', label: 'Consulta Privada' };
    }
  };

  const badgeInfo = getTypeBadge(clinic.type || 'consulta_privada');

  // Datos de la clínica (RUT, nombre, tipo, dirección, región, ciudad, RBD)
  // sólo se pueden editar si el dentista es:
  //   1. el creador (clinic.is_new — recién agregada, todavía no se guardó)
  //   2. atiende en consulta privada propia (type='consulta_privada')
  //   3. marcó "Soy dueño/a" — declara que administra la clínica
  // En cualquier otro caso (clínica institucional sin ser dueño) los campos
  // generales de la clínica los gestiona el admin de la clínica.
  // Lo que sí puede editar siempre: modalidad, is_public, is_owner (para
  // reclamar dueño), horarios de atención.
  const canEditClinicData =
    !!clinic.is_new || clinic.type === 'consulta_privada' || !!clinic.is_owner;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 relative">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <Building className="h-6 w-6 text-primary" style={{color: '#ff74c3'}} />
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white" style={{color: '#2D2D2D'}}>
              {clinic.name || 'Nueva Clínica'}
            </h3>
            <Badge variant="outline" className={`ml-2 text-xs py-0 h-5 font-normal ${badgeInfo.color}`}>
              <span className="mr-1">{badgeInfo.emoji}</span> {badgeInfo.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-5 w-5" />
          </Button>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-2 space-y-6 border-t border-gray-200 dark:border-gray-700">
              {/* Aviso si la clínica institucional no la administra el dentista. */}
              {!canEditClinicData && (
                <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Datos administrados por la clínica</p>
                    <p className="text-xs text-amber-800/90 mt-0.5">
                      Los datos generales de esta clínica (nombre, RUT, dirección) los gestiona su administración. Tu disponibilidad y horarios sí los puedes editar abajo. Si eres responsable de esta clínica, marca <span className="font-semibold">"Soy dueño/a"</span> más abajo.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label style={{color: '#ff74c3'}}>RUT Empresa</Label>
                  <Input
                    value={clinic.rut_empresa || ''}
                    onChange={(e) => handleFieldChange('rut_empresa', formatRutEmpresa(e.target.value))}
                    placeholder="76.123.456-7"
                    maxLength={12}
                    className="font-mono"
                    disabled={!canEditClinicData}
                  />
                  <p className="text-xs text-muted-foreground">RUT de la empresa o institución (opcional para consulta privada)</p>
                </div>

                <div>
                  <Label htmlFor={`name-${clinic.id}`} style={{color: '#ff74c3'}}>Nombre del Lugar</Label>
                  <Input id={`name-${clinic.id}`} value={clinic.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="Ej: Centro Médico Fonovida" required disabled={!canEditClinicData} />
                </div>

                <div>
                  <Label style={{color: '#ff74c3'}}>Tipo de Lugar</Label>
                  <Select value={clinic.type || 'consulta_privada'} onValueChange={(value) => handleFieldChange('type', value)} disabled={!canEditClinicData}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulta_privada">Consulta Privada</SelectItem>
                      <SelectItem value="colegio">Colegio / Escuela PIE</SelectItem>
                      <SelectItem value="clinica">Clínica</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {clinic.type === 'colegio' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Label htmlFor={`rbd-${clinic.id}`} style={{color: '#ff74c3'}}>RBD del Establecimiento</Label>
                    <Input
                      id={`rbd-${clinic.id}`}
                      value={clinic.rbd || ''}
                      onChange={(e) => handleFieldChange('rbd', e.target.value)}
                      placeholder="Ej: 12345-6"
                      disabled={!canEditClinicData}
                    />
                  </motion.div>
                )}

                <div>
                  <Label htmlFor={`address-${clinic.id}`} style={{color: '#ff74c3'}}>Dirección</Label>
                  <Input id={`address-${clinic.id}`} value={clinic.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} placeholder="Ej: Av. Siempre Viva 742" required disabled={!canEditClinicData} />
                </div>

                <div>
                  <Label style={{color: '#ff74c3'}}>Región</Label>
                  <Select value={clinic.region_id?.toString()} onValueChange={handleRegionChange} disabled={!canEditClinicData}>
                    <SelectTrigger disabled={loadingRegions || !canEditClinicData}>
                      <SelectValue placeholder={loadingRegions ? "Cargando..." : "Selecciona una región"} />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map(region => <SelectItem key={region.id} value={String(region.id)}>{region.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label style={{color: '#ff74c3'}}>Ciudad</Label>
                  <Select value={clinic.city_id?.toString()} onValueChange={handleCityChange} disabled={!clinic.region_id || loadingCities || !canEditClinicData} required>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCities ? "Cargando..." : "Selecciona una ciudad"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => <SelectItem key={city.id} value={String(city.id)}>{city.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label style={{ color: '#ff74c3' }}>Modalidad</Label>
                  <Select value={clinic.modality} onValueChange={(value) => handleFieldChange('modality', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox id={`is_public-${clinic.id}`} checked={clinic.is_public} onCheckedChange={(checked) => handleFieldChange('is_public', checked)} />
                  <Label htmlFor={`is_public-${clinic.id}`} className="font-normal text-gray-700 dark:text-gray-300">Mostrar este lugar en mi perfil y buscador.</Label>
                </div>

                <div className="flex items-start space-x-2 pt-2 col-span-1 md:col-span-2 bg-primary/5 border border-primary/20 rounded-md p-3">
                  <Checkbox
                    id={`is_owner-${clinic.id}`}
                    checked={!!clinic.is_owner}
                    onCheckedChange={(checked) => handleFieldChange('is_owner', !!checked)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={`is_owner-${clinic.id}`} className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                      Soy dueño/a de esta clínica
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Marca esta opción si eres el responsable o propietario. Te dará acceso a la
                      vista de administración (equipo, pacientes consolidados, reportes) además
                      de tu vista de dentista.
                    </p>
                  </div>
                </div>
              </div>
              
              <AvailabilityManager clinic={clinic} onUpdate={onUpdate} />

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        featureName="el módulo PIE Escolar"
        requiredPlan="profesional"
      />
    </div>
  );
};

export default ClinicCard;
