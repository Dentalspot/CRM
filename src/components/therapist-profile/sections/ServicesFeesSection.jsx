import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import ProfileSectionCard from '@/components/therapist-profile/ProfileSectionCard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Save, Loader2, DollarSign } from 'lucide-react';
import logger from '@/lib/utils/logger';
import { fromDbRow, fetchServices, saveServices, deleteService } from './services-fees.utils';

const INSURANCE_OPTIONS = [
  'FONASA',
  'Banmédica',
  'VidaTres',
  'Cruz Blanca',
  'Consalud',
  'Colmena',
  'Isapre Fundación',
  'Nueva Más Vida',
  'Capredena',
  'Dipreca'
];

const ServicesFeesSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState(fromDbRow(null));

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchServices(user.id);
      const formattedData = fromDbRow(data);
      setServices(formattedData.length > 0 ? formattedData : fromDbRow(null));
    } catch (error) {
      logger.error('Error loading services:', error);
      toast({
        title: 'Error al cargar',
        description: 'No se pudieron cargar tus servicios.',
        variant: 'destructive'
      });
      setServices(fromDbRow(null));
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleChange = (index, field, value) => {
    setServices(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addService = () => {
    setServices(prev => [
      ...prev,
      {
        id: null,
        service_name: '',
        duration_minutes: 60,
        price_clp: null,
        price_usd: null,
        service_description: '',
        service_category: '',
        modality: '',
        is_public: false,
        is_active: true,
        insurance_providers: [],
      },
    ]);
  };

  const removeService = async (index) => {
    const service = services[index];
    if (service.id) {
      try {
        setSaving(true);
        await deleteService(service.id);
        toast({
          title: '✅ Eliminado',
          description: 'El servicio se eliminó correctamente.'
        });
        await loadData();
      } catch (error) {
        toast({
          title: '❌ Error al eliminar',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setSaving(false);
      }
    } else {
      const next = services.filter((_, i) => i !== index);
      setServices(next.length === 0 ? fromDbRow(null) : next);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: '⚠️ Error',
        description: 'No se ha detectado usuario autenticado.',
        variant: 'destructive'
      });
      return;
    }

    const hasValid = services.some(s => (s.service_name ?? '').trim().length > 0);
    if (!hasValid) {
      toast({
        title: '⚠️ Campo requerido',
        description: 'Debes completar al menos el nombre del servicio.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      await saveServices(services, user.id);
      toast({
        title: '✅ Guardado exitoso',
        description: 'Tus servicios se han actualizado correctamente.'
      });
      await loadData();
    } catch (error) {
      logger.error('Error al guardar:', error);
      toast({
        title: '❌ Error al guardar',
        description: error.message || 'Ocurrió un error al guardar los servicios.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProfileSectionCard
        id="services-fees"
        title="Prestaciones y Aranceles"
        description="Define los servicios que ofreces y sus valores."
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
      id="services-fees"
      title="Prestaciones y Aranceles"
      description="Define los servicios que ofreces y sus valores."
      className="bg-muted/20"
    >
      <div className="space-y-4">
        {services.map((service, index) => (
          <div
            key={service.id || `new-${index}`}
            className="p-6 bg-background rounded-xl border shadow-sm space-y-4 relative"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-primary flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Prestación #{index + 1}
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeService(index)}
                className="text-destructive hover:text-destructive/80"
                disabled={saving}
                aria-label="Eliminar servicio"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor={`service-name-${index}`}>
                  Nombre de la Prestación <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`service-name-${index}`}
                  value={service.service_name ?? ''}
                  onChange={(e) => handleChange(index, 'service_name', e.target.value)}
                  placeholder="Ej: Limpieza Dental Profesional"
                  className="bg-background"
                  required
                />
              </div>

              <div>
                <Label htmlFor={`service-category-${index}`}>Categoría</Label>
                <Select
                  value={service.service_category ?? ''}
                  onValueChange={(value) => handleChange(index, 'service_category', value)}
                >
                  <SelectTrigger id={`service-category-${index}`}>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="evaluacion">Evaluación</SelectItem>
                    <SelectItem value="terapia_individual">Terapia Individual</SelectItem>
                    <SelectItem value="terapia_grupal">Terapia Grupal</SelectItem>
                    <SelectItem value="talleres">Talleres</SelectItem>
                    <SelectItem value="capacitacion">Capacitación</SelectItem>
                    <SelectItem value="asesoria">Asesoría</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`service-duration-${index}`}>Duración (minutos)</Label>
                <Select
                  value={String(service.duration_minutes ?? '')}
                  onValueChange={(value) => handleChange(index, 'duration_minutes', Number(value))}
                >
                  <SelectTrigger id={`service-duration-${index}`}>
                    <SelectValue placeholder="Selecciona duración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                    <SelectItem value="120">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor={`service-price-${index}`}>Precio (CLP)</Label>
                <Input
                  id={`service-price-${index}`}
                  type="number"
                  value={service.price_clp ?? ''}
                  onChange={(e) => handleChange(index, 'price_clp', e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Ej: 35000"
                  className="bg-background"
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor={`service-modality-${index}`}>Modalidad</Label>
                <Select
                  value={service.modality ?? ''}
                  onValueChange={(value) => handleChange(index, 'modality', value)}
                >
                  <SelectTrigger id={`service-modality-${index}`}>
                    <SelectValue placeholder="Selecciona modalidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>Previsiones (puedes seleccionar más de una)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {INSURANCE_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`insurance-${index}-${option}`}
                      checked={service.insurance_providers?.includes(option) || false}
                      onCheckedChange={(checked) => {
                        handleChange(
                          index,
                          'insurance_providers',
                          checked
                            ? [...(service.insurance_providers || []), option]
                            : (service.insurance_providers || []).filter((p) => p !== option)
                        );
                      }}
                    />
                    <Label htmlFor={`insurance-${index}-${option}`} className="text-sm cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor={`service-description-${index}`}>Descripción</Label>
              <Textarea
                id={`service-description-${index}`}
                value={service.service_description ?? ''}
                onChange={(e) => handleChange(index, 'service_description', e.target.value)}
                placeholder="Describe en qué consiste este servicio..."
                className="bg-background"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id={`is-public-${index}`}
                checked={!!service.is_public}
                onCheckedChange={(checked) => handleChange(index, 'is_public', !!checked)}
              />
              <Label htmlFor={`is-public-${index}`} className="cursor-pointer text-sm">
                Hacer este servicio visible en mi perfil público
              </Label>
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addService}
          className="w-full"
          disabled={saving}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Otra Prestación
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
                Guardar Prestaciones
              </>
            )}
          </Button>
        </div>
      </div>
    </ProfileSectionCard>
  );
};

export default ServicesFeesSection;