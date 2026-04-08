import React, { useState, useEffect } from 'react'; //sección de Personalización Visual — donde el terapeuta configura colores (primario, secundario, acento) y tipografía para su landing page pública. Es una sección válida del perfil.
import  useTherapistProfile  from '@/hooks/useTherapistProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import SectionWrapper from './SectionWrapper';

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Moderna)' },
  { value: 'Merriweather', label: 'Merriweather (Clásica)' },
  { value: 'Roboto', label: 'Roboto (Neutral)' },
  { value: 'Open Sans', label: 'Open Sans (Amigable)' },
  { value: 'Lato', label: 'Lato (Limpia)' },
  { value: 'Montserrat', label: 'Montserrat (Geométrica)' },
];

const VisualCustomizationSection = () => {
  const { user } = useAuth();
  const { profile, loading, saveBranding, isSaving } = useTherapistProfile(user?.id);
  
  const [formData, setFormData] = useState({
    primary_color: '#000000',
    secondary_color: '#ffffff',
    font_family: 'Inter',
    accent_color: '#3b82f6'
  });

  useEffect(() => {
    if (profile?.branding) {
      setFormData({
        primary_color: profile.branding.primary_color || '#000000',
        secondary_color: profile.branding.secondary_color || '#ffffff',
        font_family: profile.branding.font_family || 'Inter',
        accent_color: profile.branding.accent_color || '#3b82f6'
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveBranding(formData);
  };

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <SectionWrapper title="Personalización Visual" description="Define la apariencia de tu perfil público y landing page.">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Color Primario</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                id="primary_color" 
                name="primary_color" 
                value={formData.primary_color} 
                onChange={handleChange} 
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input 
                type="text" 
                value={formData.primary_color} 
                onChange={handleChange} 
                name="primary_color"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Usado en botones principales y encabezados.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Color Secundario</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                id="secondary_color" 
                name="secondary_color" 
                value={formData.secondary_color} 
                onChange={handleChange} 
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input 
                type="text" 
                value={formData.secondary_color} 
                onChange={handleChange} 
                name="secondary_color"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Usado en fondos y elementos de contraste.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">Color de Acento</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                id="accent_color" 
                name="accent_color" 
                value={formData.accent_color} 
                onChange={handleChange} 
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input 
                type="text" 
                value={formData.accent_color} 
                onChange={handleChange} 
                name="accent_color"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Usado para destacar elementos importantes.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font_family">Tipografía</Label>
            <Select 
              value={formData.font_family} 
              onValueChange={(val) => handleSelectChange('font_family', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una fuente" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Define el estilo de texto de tu página.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSaving} className="bg-primary text-white">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </SectionWrapper>
  );
};

export default VisualCustomizationSection;