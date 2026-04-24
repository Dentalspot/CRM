/**
 * @file src/components/clinic/profile/ClinicInfoSection.jsx
 *
 * Tab "Datos de la Clínica" para users clinic. Unifica:
 * 1. Datos de la clínica (identidad, ubicación, contacto, descripción, redes)
 * 2. Responsable legal (persona física a cargo — Ley 20.584 art. 5)
 *
 * Replaces el antiguo split donde "Sobre Mí" era un tab separado — ese tab
 * se oculta para users clinic en TherapistProfileDashboardPage.
 *
 * Save atómico: el botón único al final persiste:
 *   - Tabla `clinics` (upsert por therapist_id) — campos de clínica + responsible_role
 *   - Tabla `profiles` (update por id=user.id) — full_name, rut, phone
 *
 * Si alguno falla muestra toast de error indicando qué parte. Retry del user
 * reintenta ambos. Best-effort (sin transacción DB cross-table) — el form se
 * guarda poco frecuentemente, riesgo de inconsistencia es bajo.
 *
 * RUT validation: client-side via `@/utils/rutUtils` (formato + dígito
 * verificador). Evita el error genérico "Database error saving new user"
 * que aparece cuando el constraint unique falla.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Save,
  Building2,
  Globe,
  Link2,
  Phone,
  Mail,
  MapPin,
  Clock,
} from 'lucide-react';
import useLocation from '@/hooks/useLocation';
import { formatRutEmpresa, cleanRutEmpresa } from '@/services/clinicDetectionService';
import { validateRut, cleanRut, formatRut } from '@/utils/rutUtils';
import ResponsibleCard from './ResponsibleCard';

const ClinicInfoSection = () => {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { regions, cities, loadingRegions, loadingCities, fetchCities } = useLocation();

  const [clinicId, setClinicId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [rutError, setRutError] = useState('');

  const [form, setForm] = useState({
    // Clinic fields
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
    responsible_role: '',
    // Profile fields (responsable legal — persistidos en tabla profiles)
    full_name: '',
    rut: '',
    phone_responsable: '',
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch clinic + profile en paralelo
    const [clinicRes, profileRes] = await Promise.all([
      supabase
        .from('clinics')
        .select(
          'id, name, rut_empresa, razon_social, address, region_id, city_id, phone, email, description, schedule_text, website, instagram, facebook, responsible_role'
        )
        .eq('therapist_id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name, rut, phone')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    if (clinicRes.error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de la clínica.',
        variant: 'destructive',
      });
    }
    if (profileRes.error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos del responsable.',
        variant: 'destructive',
      });
    }

    const clinicData = clinicRes.data;
    const profileData = profileRes.data;

    if (clinicData) {
      setClinicId(clinicData.id);
      if (clinicData.region_id) fetchCities(clinicData.region_id);
    }

    setForm({
      // Clinic
      name: clinicData?.name || '',
      rut_empresa: clinicData?.rut_empresa ? formatRutEmpresa(clinicData.rut_empresa) : '',
      razon_social: clinicData?.razon_social || '',
      address: clinicData?.address || '',
      region_id: clinicData?.region_id?.toString() || '',
      city_id: clinicData?.city_id?.toString() || '',
      phone: clinicData?.phone || '',
      email: clinicData?.email || '',
      description: clinicData?.description || '',
      schedule_text: clinicData?.schedule_text || '',
      website: clinicData?.website || '',
      instagram: clinicData?.instagram || '',
      facebook: clinicData?.facebook || '',
      responsible_role: clinicData?.responsible_role || '',
      // Profile
      full_name: profileData?.full_name || '',
      rut: profileData?.rut ? formatRut(profileData.rut) : '',
      phone_responsable: profileData?.phone || '',
    });

    setLoading(false);
  }, [user, toast, fetchCities]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear RUT error on edit
    if (field === 'rut' && rutError) setRutError('');
  };

  const handleRegionChange = (regionId) => {
    setForm((prev) => ({ ...prev, region_id: regionId, city_id: '' }));
    fetchCities(Number(regionId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación clínica
    if (!form.name) {
      toast({
        title: 'Falta el nombre',
        description: 'El nombre de la clínica es obligatorio.',
        variant: 'destructive',
      });
      return;
    }

    // Validación responsable
    if (!form.full_name?.trim()) {
      toast({
        title: 'Falta el nombre del responsable',
        description: 'El nombre completo del responsable es obligatorio.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.rut?.trim()) {
      setRutError('El RUT del responsable es obligatorio.');
      return;
    }

    if (!validateRut(form.rut)) {
      setRutError('RUT inválido. Verifica el número y el dígito verificador.');
      return;
    }

    if (!form.responsible_role) {
      toast({
        title: 'Falta el cargo del responsable',
        description: 'Indica si eres Dueño/a, Director/a técnico/a, Administrador/a u Otro.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    // 1) Payload clinic
    const clinicPayload = {
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
      responsible_role: form.responsible_role,
    };

    // 2) Payload profile
    const profilePayload = {
      full_name: form.full_name.trim(),
      rut: cleanRut(form.rut),
      phone: form.phone_responsable || null,
    };

    // Ejecutar save clínica primero — si falla, no tocamos profile
    let clinicError = null;
    let newClinicId = clinicId;

    if (clinicId) {
      const { error } = await supabase
        .from('clinics')
        .update(clinicPayload)
        .eq('id', clinicId);
      clinicError = error;
    } else {
      const { data: newClinic, error: insertError } = await supabase
        .from('clinics')
        .insert({ ...clinicPayload, therapist_id: user.id, is_active: true, is_public: true })
        .select('id')
        .maybeSingle();
      clinicError = insertError;
      if (newClinic) {
        newClinicId = newClinic.id;
        setClinicId(newClinic.id);
      }
    }

    if (clinicError) {
      let msg = clinicError.message;
      if (clinicError.message?.includes('idx_clinics_rut_empresa')) {
        msg = 'Ya existe una clínica registrada con este RUT de empresa. Verifica el RUT ingresado o contacta soporte.';
      } else if (clinicError.message?.includes('duplicate key')) {
        msg = 'Este registro ya existe. Verifica los datos ingresados.';
      } else if (clinicError.message?.includes('responsible_role')) {
        msg = 'La columna responsible_role aún no está aplicada en la base de datos. Aplica la migration 20260423000003 y reintenta.';
      }
      toast({ title: 'Error al guardar la clínica', description: msg, variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    // Save profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', user.id);

    if (profileError) {
      let msg = profileError.message;
      if (profileError.message?.includes('profiles_rut_key') || profileError.message?.includes('duplicate')) {
        msg = 'Este RUT ya está registrado en otra cuenta. Verifica el RUT o contacta soporte.';
      }
      toast({
        title: 'Datos de clínica guardados, pero falló el responsable',
        description: msg,
        variant: 'destructive',
      });
      setIsSaving(false);
      return;
    }

    // Refresh profile en context para que se propague a otros lugares
    if (typeof refreshProfile === 'function') {
      try {
        await refreshProfile();
      } catch (_) {
        // best-effort
      }
    }

    toast({
      title: '✅ ¡Guardado!',
      description: 'Los datos de la clínica y del responsable se actualizaron correctamente.',
    });
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
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Datos de la Clínica
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Información pública de tu centro que verán los pacientes, y datos legales del responsable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ==================== CLÍNICA ==================== */}

        {/* Identificación */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Identificación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-primary">RUT Empresa</Label>
              <Input
                value={form.rut_empresa}
                onChange={(e) => handleChange('rut_empresa', formatRutEmpresa(e.target.value))}
                placeholder="76.123.456-7"
                maxLength={12}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-primary">Razón Social</Label>
              <Input
                value={form.razon_social}
                onChange={(e) => handleChange('razon_social', e.target.value)}
                placeholder="Ej: Clínica Fonovida SpA"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-primary">Nombre del Centro *</Label>
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Ubicación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-primary">Dirección</Label>
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
              <Label className="text-primary">Región</Label>
              <Select value={form.region_id} onValueChange={handleRegionChange}>
                <SelectTrigger disabled={loadingRegions}>
                  <SelectValue placeholder={loadingRegions ? 'Cargando...' : 'Selecciona una región'} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-primary">Ciudad</Label>
              <Select
                value={form.city_id}
                onValueChange={(v) => handleChange('city_id', v)}
                disabled={!form.region_id || loadingCities}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCities ? 'Cargando...' : 'Selecciona una ciudad'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-primary">Teléfono</Label>
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
              <Label className="text-primary">Email de Contacto</Label>
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Descripción y Horario
          </h3>
          <div className="space-y-2">
            <Label className="text-primary">Descripción del Centro</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe tu clínica, especialidades, enfoque terapéutico..."
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-primary">Horario de Atención</Label>
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
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">
            Redes Sociales y Web
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-primary">Sitio Web</Label>
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
              <Label className="text-primary">Instagram</Label>
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
              <Label className="text-primary">Facebook</Label>
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

        {/* ==================== RESPONSABLE ==================== */}
        <ResponsibleCard
          form={form}
          userEmail={user?.email}
          rutError={rutError}
          onChange={handleChange}
        />

        {/* Save button (atómico clinic + profile) */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="submit"
            disabled={isSaving}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ClinicInfoSection;
