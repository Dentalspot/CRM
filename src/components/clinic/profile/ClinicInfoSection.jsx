import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Building2, Globe, Link2, Phone, Mail, MapPin, Clock } from 'lucide-react';
import useLocation from '@/hooks/useLocation';
import { formatRutEmpresa, cleanRutEmpresa } from '@/services/clinicDetectionService';

const ClinicInfoSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { regions, cities, loadingRegions, loadingCities, fetchCities } = useLocation();

  const [clinicId, setClinicId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    rut_empresa: '',
    razon_social: '',
    address: '',
    region_id: '',
    city_id: '',
    phone: '',
    email: '',
    description: '',
    schedule_text: '',
    website: '',
    instagram: '',
    facebook: '',
  });

  const fetchClinic = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clinics')
      .select('id, name, rut_empresa, razon_social, address, region_id, city_id, phone, email, description, schedule_text, website, instagram, facebook')
      .eq('therapist_id', user.id)
      .maybeSingle();

    if (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar los datos de la clínica.', variant: 'destructive' });
    } else if (data) {
      setClinicId(data.id);
      setForm({
        name: data.name || '',
        rut_empresa: data.rut_empresa ? formatRutEmpresa(data.rut_empresa) : '',
        razon_social: data.razon_social || '',
        address: data.address || '',
        region_id: data.region_id?.toString() || '',
        city_id: data.city_id?.toString() || '',
        phone: data.phone || '',
        email: data.email || '',
        description: data.description || '',
        schedule_text: data.schedule_text || '',
        website: data.website || '',
        instagram: data.instagram || '',
        facebook: data.facebook || '',
      });
      if (data.region_id) fetchCities(data.region_id);
    }
    setLoading(false);
  }, [user, toast, fetchCities]);

  useEffect(() => { fetchClinic(); }, [fetchClinic]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRegionChange = (regionId) => {
    setForm(prev => ({ ...prev, region_id: regionId, city_id: '' }));
    fetchCities(Number(regionId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      toast({ title: 'Falta el nombre', description: 'El nombre de la clínica es obligatorio.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);

    const payload = {
      name: form.name,
      rut_empresa: form.rut_empresa ? cleanRutEmpresa(form.rut_empresa) : null,
      razon_social: form.razon_social || form.name,
      address: form.address || null,
      region_id: form.region_id ? Number(form.region_id) : null,
      city_id: form.city_id ? Number(form.city_id) : null,
      phone: form.phone || null,
      email: form.email || null,
      description: form.description || null,
      schedule_text: form.schedule_text || null,
      website: form.website || null,
      instagram: form.instagram || null,
      facebook: form.facebook || null,
    };

    let error;
    if (clinicId) {
      ({ error } = await supabase.from('clinics').update(payload).eq('id', clinicId));
    } else {
      const { data: newClinic, error: insertError } = await supabase
        .from('clinics')
        .insert({ ...payload, therapist_id: user.id, is_active: true, is_public: true })
        .select('id')
        .maybeSingle();
      error = insertError;
      if (newClinic) setClinicId(newClinic.id);
    }

    if (error) {
      let msg = error.message;
      if (error.message?.includes('idx_clinics_rut_empresa')) {
        msg = 'Ya existe una clínica registrada con este RUT de empresa. Verifica el RUT ingresado o contacta soporte.';
      } else if (error.message?.includes('duplicate key')) {
        msg = 'Este registro ya existe. Verifica los datos ingresados.';
      }
      toast({ title: 'Error al guardar', description: msg, variant: 'destructive' });
    } else {
      toast({ title: '✅ ¡Guardado!', description: 'Los datos de la clínica se actualizaron correctamente.' });
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Datos de la Clínica</h2>
        <p className="mt-2 text-lg text-muted-foreground">Información pública de tu centro que verán los pacientes.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Identificación */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>RUT Empresa</Label>
              <Input
                value={form.rut_empresa}
                onChange={(e) => handleChange('rut_empresa', formatRutEmpresa(e.target.value))}
                placeholder="76.123.456-7"
                maxLength={12}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Razón Social</Label>
              <Input
                value={form.razon_social}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                placeholder="Ej: Clínica Fonovida SpA"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label style={{ color: '#ff74c3' }}>Nombre del Centro *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: Centro Médico Fonovida"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Ubicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label style={{ color: '#ff74c3' }}>Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Av. Providencia 1234, Of. 505"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Región</Label>
              <Select value={form.region_id} onValueChange={handleRegionChange}>
                <SelectTrigger disabled={loadingRegions}>
                  <SelectValue placeholder={loadingRegions ? 'Cargando...' : 'Selecciona una región'} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Ciudad</Label>
              <Select value={form.city_id} onValueChange={(v) => handleChange('city_id', v)} disabled={!form.region_id || loadingCities}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCities ? 'Cargando...' : 'Selecciona una ciudad'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Email de Contacto</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contacto@miclínica.cl"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Descripción y Horario */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Descripción y Horario</h3>
          <div className="space-y-2">
            <Label style={{ color: '#ff74c3' }}>Descripción del Centro</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe tu clínica, especialidades, enfoque terapéutico..."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label style={{ color: '#ff74c3' }}>Horario de Atención</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={form.schedule_text}
                onChange={(e) => handleChange('schedule_text', e.target.value)}
                placeholder="Ej: Lunes a Viernes 9:00 – 19:00"
                className="pl-9"
              />
            </div>
          </div>
        </section>

        {/* Redes Sociales */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Redes Sociales y Web</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Sitio Web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://miclínica.cl"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Instagram</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.instagram}
                  onChange={(e) => handleChange('instagram', e.target.value)}
                  placeholder="@miclínica"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label style={{ color: '#ff74c3' }}>Facebook</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={form.facebook}
                  onChange={(e) => handleChange('facebook', e.target.value)}
                  placeholder="facebook.com/miclínica"
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="submit" disabled={isSaving} size="lg" className="bg-[#ff74c3] text-white hover:bg-gradient-to-r hover:from-[#ff74c3] hover:to-[#33e1d1]">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClinicInfoSection;
