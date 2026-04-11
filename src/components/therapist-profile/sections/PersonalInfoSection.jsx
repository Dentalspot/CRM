import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import SectionWrapper from './SectionWrapper';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelectCombobox } from '@/components/public/MultiSelectCombobox';
import { fromDbRow, fetchTherapistDetails, saveTherapistProfile } from './personal-info.utils.js';
import useDebounce from '@/hooks/useDebounce';
import logger from '@/lib/utils/logger';

const languageOptions = [
  { value: 'Español', label: 'Español' },
  { value: 'Inglés', label: 'Inglés' },
  { value: 'Portugués', label: 'Portugués' },
  { value: 'Francés', label: 'Francés' },
  { value: 'Alemán', label: 'Alemán' },
  { value: 'Italiano', label: 'Italiano' },
  { value: 'Mapudungún', label: 'Mapudungún' },
  { value: 'Chino Mandarín', label: 'Chino Mandarín' },
  { value: 'Japonés', label: 'Japonés' },
  { value: 'Coreano', label: 'Coreano' },
  { value: 'Árabe', label: 'Árabe' },
  { value: 'Lengua de Señas Chilena', label: 'Lengua de Señas Chilena' },
];

const PersonalInfoForm = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Manual save loading state
  const [autoSaving, setAutoSaving] = useState(false); // Auto save loading state
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved', 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [formData, setFormData] = useState(fromDbRow(null));
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use a ref to track if changes are from user input vs initial load
  const isUserChange = useRef(false);

  // Debounced value for auto-save
  const debouncedFormData = useDebounce(formData, 1000); // 1 second delay for better UX

  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData = await fetchTherapistDetails(user.id);
      const initialData = fromDbRow(profileData);
      setFormData(initialData);
      setLastSavedAt(new Date());
      const { data: regionsData } = await supabase
        .from('regions')
        .select('id, name');

      setRegions(regionsData || []);

      if (profileData?.region_id) {
        const { data: citiesData } = await supabase
          .from('cities')
          .select('id, name')
          .eq('region_id', profileData.region_id);

        setCities(citiesData || []);
      }

      // Mark as initialized after data is loaded so we don't trigger auto-save on mount
      setTimeout(() => setIsInitialized(true), 500);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar tu perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-save effect
  useEffect(() => {
    // Skip if not initialized or if this change wasn't triggered by user interaction
    if (!isInitialized || !isUserChange.current) return;

    const performAutoSave = async () => {
      if (!user) return;

      setAutoSaving(true);
      setSaveStatus('saving');

      try {
        await saveTherapistProfile(user.id, debouncedFormData);
        setSaveStatus('saved');
        setLastSavedAt(new Date());
        // We don't show a toast for auto-save to avoid annoyance, just the visual indicator
      } catch (error) {
        logger.error("Auto-save failed:", error);
        setSaveStatus('error');
        toast({
          title: "Error al guardar",
          description: "No se pudieron guardar los cambios automáticamente.",
          variant: "destructive"
        });
      } finally {
        setAutoSaving(false);
        isUserChange.current = false; // Reset flag after save
      }
    };

    performAutoSave();

  }, [debouncedFormData, user, isInitialized, toast]);

  const fetchCitiesForRegion = async (regionId) => {
    if (!regionId) return setCities([]);

    try {
      const { data: citiesData } = await supabase
        .from('cities')
        .select('id, name')
        .eq('region_id', regionId);

      setCities(citiesData || []);

    } catch (error) {
      logger.error("Error fetching cities:", error);
    }
  };

  const handleChange = (e) => {
    isUserChange.current = true;
    setSaveStatus('unsaved');
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    isUserChange.current = true;
    setSaveStatus('unsaved');
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'region_id') {
        updated.city_id = '';
        fetchCitiesForRegion(value);
      }

      return updated;
    });
  };

  const handleCheckboxChange = (checked) => {
    isUserChange.current = true;
    setSaveStatus('unsaved');
    setFormData(prev => ({ ...prev, is_public: checked }));
  };

  const handleMultiSelectChange = (selected) => {
    isUserChange.current = true;
    setSaveStatus('unsaved');
    setFormData(prev => ({ ...prev, languages: selected }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await saveTherapistProfile(user.id, formData);

      toast({
        title: "Perfil actualizado",
        description: "Tu información se ha guardado correctamente."
      });

      setSaveStatus('saved');
      setLastSavedAt(new Date());
      await refreshProfile();
      // We don't reload data here to prevent jumping UI, just refresh context

    } catch (error) {
      setSaveStatus('error');
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Status Indicator Component
  const SaveStatusIndicator = () => {
    if (saveStatus === 'saving' || autoSaving) {
      return (
        <span className="flex items-center text-xs text-muted-foreground animate-pulse">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Guardando...
        </span>
      );
    }
    if (saveStatus === 'error') {
      return (
        <span className="flex items-center text-xs text-destructive font-medium">
          <AlertCircle className="h-3 w-3 mr-1" />
          Error al guardar
        </span>
      );
    }
    if (saveStatus === 'unsaved') {
      return (
        <span className="flex items-center text-xs text-amber-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-amber-500 mr-2" />
          Cambios sin guardar
        </span>
      );
    }
    if (saveStatus === 'saved' && lastSavedAt) {
      return (
        <span className="flex items-center text-xs text-green-600 font-medium transition-opacity duration-500">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Guardado
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <SectionWrapper
        title="Información Pública del Perfil"
        description="Estos datos serán visibles para otros usuarios."
        action={<SaveStatusIndicator />}
      >
        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Identidad Profesional</h4>

            <div>
              <Label>Nombre Completo</Label>
              <Input name="full_name" value={formData.full_name} onChange={handleChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Título Profesional</Label>
                <Input name="professional_title" value={formData.professional_title} onChange={handleChange} />
              </div>
              <div>
                <Label>Titular (Headline)</Label>
                <Input name="headline" value={formData.headline} onChange={handleChange} />
              </div>
            </div>

            <div>
              <Label>Sobre Mí</Label>
              <Textarea name="about_me" value={formData.about_me} onChange={handleChange} rows={4} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Registros y Credenciales</h4>

            <div>
              <Label>Registro Superintendencia de Salud</Label>
              <Input name="registration_supersalud" value={formData.registration_supersalud} onChange={handleChange} placeholder="Ej: 12345" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Universidad</Label>
                <Input name="university" value={formData.university} onChange={handleChange} placeholder="Universidad de egreso" />
              </div>
              <div>
                <Label>Año de Egreso</Label>
                <Input name="graduation_year" type="number" value={formData.graduation_year} onChange={handleChange} placeholder="Ej: 2015" />
              </div>
            </div>

            <div>
              <Label>Años de experiencia</Label>
              <Input name="years_experience" type="number" value={formData.years_experience} onChange={handleChange} placeholder="Ej: 8" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Información Personal y Contacto</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>RUT</Label>
                <Input name="rut" value={formData.rut} onChange={handleChange} placeholder="12.345.678-9" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+56 9 1234 5678" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha de Nacimiento</Label>
                <Input name="birthdate" type="date" value={formData.birthdate} onChange={handleChange} />
              </div>
              <div>
                <Label>Género</Label>
                <Select onValueChange={(v) => handleSelectChange("gender", v)} value={formData.gender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="No binario">No binario</SelectItem>
                    <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Email público</Label>
              <Input name="public_email" type="email" value={formData.public_email} onChange={handleChange} placeholder="contacto@ejemplo.com" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Habilidades</h4>

            <div>
              <Label>Idiomas</Label>
              <MultiSelectCombobox
                options={languageOptions}
                selected={formData.languages}
                onChange={handleMultiSelectChange}
                placeholder="Selecciona idiomas..."
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Redes Sociales</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Instagram</Label>
                <Input name="social_instagram_url" value={formData.social_instagram_url || ''} onChange={handleChange} placeholder="URL perfil Instagram" />
              </div>
              <div>
                <Label>Facebook</Label>
                <Input name="social_facebook_url" value={formData.social_facebook_url || ''} onChange={handleChange} placeholder="URL perfil Facebook" />
              </div>
              <div>
                <Label>Twitter/X</Label>
                <Input name="social_twitter_url" value={formData.social_twitter_url || ''} onChange={handleChange} placeholder="URL perfil Twitter" />
              </div>
              <div>
                <Label>LinkedIn</Label>
                <Input name="social_linkedin_url" value={formData.social_linkedin_url || ''} onChange={handleChange} placeholder="URL perfil LinkedIn" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur py-4 z-10">
            <div className="flex items-center gap-2">
              <Checkbox id="is_public" checked={formData.is_public} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="is_public" className="cursor-pointer">Hacer mi perfil público</Label>
            </div>

            <div className="flex items-center gap-4">
              <SaveStatusIndicator />
              <Button type="submit" disabled={saving || autoSaving} className="bg-primary text-white">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Manualmente
              </Button>
            </div>
          </div>

        </form>
      </SectionWrapper>
    </>
  );
};

export default PersonalInfoForm;