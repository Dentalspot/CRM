
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MapPin, Building2, Globe, Building } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/lib/utils/logger';
import { cleanRutEmpresa, formatRutEmpresa } from '@/services/clinicDetectionService';

const CreateClinicModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [formData, setFormData] = useState({
    rut_empresa: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    modalidad: 'presencial',
    region_id: '',
    city_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        rut_empresa: '',
        name: '',
        address: '',
        phone: '',
        email: user?.email || '',
        modalidad: 'presencial',
        region_id: '',
        city_id: ''
      });
      fetchRegions();
    }
  }, [isOpen, user]);

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      logger.error('Error fetching regions:', error);
    }
  };

  const fetchCities = async (regionId) => {
    if (!regionId) { setCities([]); return; }
    setLoadingCities(true);
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .eq('region_id', regionId)
        .order('name');
      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      logger.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleRegionChange = (regionId) => {
    setFormData(prev => ({ ...prev, region_id: regionId, city_id: '' }));
    setCities([]);
    fetchCities(regionId);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast({ variant: "destructive", title: "Falta el nombre", description: "El nombre de la clínica es obligatorio." });
    
    setLoading(true);
    try {
      // 1. Create Clinic
      // Using .select() instead of .select().single() to gracefully handle returned arrays and prevent "multiple rows" edge case errors.
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          therapist_id: user.id,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          region_id: formData.region_id ? parseInt(formData.region_id) : null,
          city_id: formData.city_id ? parseInt(formData.city_id) : null,
          modalidad: formData.modalidad,
          is_active: true,
          is_public: true,
          rut_empresa: cleanRutEmpresa(formData.rut_empresa) || null,
          razon_social: formData.name,
        })
        .select();

      if (clinicError) throw clinicError;
      
      const clinic = clinicData?.[0];
      if (!clinic) throw new Error("Error al obtener los datos de la clínica recién creada.");

      // 2. Link Therapist (Owner) to Clinic
      const { error: linkError } = await supabase
        .from('clinic_therapists')
        .insert({
          clinic_id: clinic.id,
          therapist_id: user.id,
          is_active: true
        });

      if (linkError) throw linkError;

      toast({
        title: "¡Clínica Creada!",
        description: `Has registrado "${clinic.name}" exitosamente.`
      });

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      logger.error('Error creating clinic:', error);
      let msg = error.message || "No se pudo crear la clínica.";
      if (error.message?.includes('idx_clinics_rut_empresa')) {
        msg = 'Ya existe una clínica registrada con este RUT de empresa. Verifica el RUT ingresado.';
      } else if (error.message?.includes('duplicate key')) {
        msg = 'Este registro ya existe. Verifica los datos ingresados.';
      }
      toast({
        variant: "destructive",
        title: "Error al crear",
        description: msg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Nueva Clínica</DialogTitle>
              <DialogDescription>Configura los datos básicos de tu centro.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">

          <div className="space-y-2">
            <Label htmlFor="rut_empresa">RUT Empresa</Label>
            <Input
              id="rut_empresa"
              placeholder="76.123.456-7"
              value={formData.rut_empresa}
              onChange={(e) => handleInputChange('rut_empresa', formatRutEmpresa(e.target.value))}
              maxLength={12}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">RUT de la empresa, clínica o institución</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Centro / Clínica *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Ej: Centro de Terapia Integral"
                className="pl-9"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select 
                value={formData.modalidad} 
                onValueChange={(val) => handleInputChange('modalidad', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="online">Online / Remoto</SelectItem>
                  <SelectItem value="ambas">Híbrido (Ambas)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Región</Label>
              <Select
                value={formData.region_id}
                onValueChange={handleRegionChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar región..." />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Select
              value={formData.city_id}
              onValueChange={(val) => handleInputChange('city_id', val)}
              disabled={!formData.region_id || loadingCities}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingCities ? "Cargando..." : !formData.region_id ? "Selecciona región primero" : "Seleccionar ciudad..."} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id.toString()}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                placeholder="Av. Providencia 1234, Of. 505"
                className="pl-9"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono de Contacto</Label>
            <Input
              id="phone"
              placeholder="+56 9 1234 5678"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Registrar Clínica'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClinicModal;
