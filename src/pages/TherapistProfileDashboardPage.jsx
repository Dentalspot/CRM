import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import {
  Loader2,
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  DollarSign,
  FileText,
  Palette,
  CreditCard,
  Award,
  Shield,
  ShieldCheck,
  Landmark,
  Building2,
  Users,
  Gift
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import useCurrentOrganization from '@/hooks/useCurrentOrganization';
import { Card, CardContent } from '@/components/ui/card';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { checkAndCreditInviteReward } from '@/features/invitations/utils/inviteRewardService';
import { exportTherapistCV } from '@/components/landing/TherapistCVExport';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';
import { normalizeDetails, DENTALSPOT_COLORS } from '@/components/landing/sections/shared/utils';

// Lazy loaded components
const AcademicFormationSection = lazy(() => import('@/components/therapist-profile/sections/AcademicFormationSection'));
const MyClinicsSection = lazy(() => import('@/components/therapist-profile/sections/MyClinicsSection'));
const PersonalInfoSection = lazy(() => import('@/components/therapist-profile/sections/PersonalInfoSection'));
const ServicesFeesSection = lazy(() => import('@/components/therapist-profile/sections/ServicesFeesSection'));
const SpecialtiesConditionsSection = lazy(() => import('@/components/therapist-profile/sections/SpecialtiesConditionsSection'));
const WorkExperienceSection = lazy(() => import('@/components/therapist-profile/sections/WorkExperienceSection'));
const VisualCustomizationSection = lazy(() => import('@/components/therapist-profile/sections/VisualCustomizationSection'));
const ImagesSection = lazy(() => import('@/components/therapist-profile/sections/ImagesSection'));
const PatientDocsSection = lazy(() => import('@/components/therapist-profile/sections/PatientDocsSection'));
const CustomMaterialsSection = lazy(() => import('@/components/therapist-profile/sections/CustomMaterialsSection'));
const MyMarketplaceResourcesSection = lazy(() => import('@/components/therapist-profile/sections/MyMarketplaceResourcesSection'));
const MembershipPlansPage = lazy(() => import('@/features/membership/pages/MembershipPlansPage'));

// Clinic Profile Components
const ClinicInfoSection = lazy(() => import('@/components/clinic/profile/ClinicInfoSection'));
const ClinicTeamSection = lazy(() => import('@/components/clinic/profile/ClinicTeamSection'));

// New Settings Components
const AccountSecuritySettings = lazy(() => import('@/features/settings/components/AccountSecuritySettings'));
const PrivacySection = lazy(() => import('@/features/account/components/PrivacySection'));
const BankTransferInfoForm = lazy(() => import('@/features/settings/components/BankTransferInfoForm'));

// Reputation & Growth Components
const ReputationDashboard = lazy(() => import('@/components/reputation/ReputationDashboard'));
const GrowthPanel = lazy(() => import('@/components/reputation/GrowthPanel'));
const InvitationsPanel = lazy(() => import('@/features/invitations/components/InvitationsPanel'));
const MyClinicInvitationsPanel = lazy(() => import('@/features/dashboard/components/MyClinicInvitationsPanel'));

const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[280px]">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const Chunk = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export default function TherapistProfileDashboardPage() {
  const { user, profile, loading, isTherapist, isClinic } = useAuth();
  const { userOrgRoles = [] } = useCurrentOrganization();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  // Default active tab logic
  // Clinic users no longer see "Sobre Mí" (its data lives in "Datos de la Clínica" → Responsable).
  // Default to 'clinic-info' para users clinic; 'personal-info' para el resto.
  const defaultTabFallback = isClinic ? 'clinic-info' : 'personal-info';
  const defaultTab = searchParams.get('tab') || defaultTabFallback;
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Check and credit invite reward on profile page load
  useEffect(() => {
    if (!user?.id) return;
    checkAndCreditInviteReward(user.id).then(result => {
      if (result.credited) {
        toast({
          title: '¡Recompensa acreditada!',
          description: result.message
        });
      }
    });
  }, [user?.id]);

  // Sync state with URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Guard: si un clinic user llega con ?tab=personal-info (stale URL de antes
  // del rediseño), redirigirlo a 'clinic-info' que es su tab default.
  useEffect(() => {
    if (isClinic && activeTab === 'personal-info') {
      setActiveTab('clinic-info');
      setSearchParams({ tab: 'clinic-info' });
    }
  }, [isClinic, activeTab, setSearchParams]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const [cvLoading, setCvLoading] = useState(false);

  const handleDownloadCV = async () => {
    if (!user?.id) return;
    setCvLoading(true);
    try {
      const [profileRes, brandingRes, educationRes, experienceRes, servicesRes, conditionsRes, specialtiesRes, specialtyBadgesRes] = await Promise.all([
        supabase.from('profiles').select(`id, full_name, email, phone, therapist_details!fk_therapist_profile (*)`).eq('id', user.id).maybeSingle(),
        supabase.from('therapist_branding').select('avatar_url, primary_color, secondary_color, text_color, background_color').eq('therapist_id', user.id).maybeSingle(),
        supabase.from('therapist_education').select('*').eq('therapist_id', user.id).order('graduation_year', { ascending: false }),
        supabase.from('therapist_experience').select('*').eq('therapist_id', user.id).order('start_date', { ascending: false }),
        supabase.from('therapist_services').select('*').eq('therapist_id', user.id).eq('is_active', true),
        supabase.from('therapist_conditions').select('condition_name').eq('therapist_id', user.id),
        supabase.from('therapist_specialties').select('specialties(id, name)').eq('therapist_id', user.id),
        supabase.from('therapist_specialty_badges').select('specialty, badge, final_score').eq('therapist_id', user.id).order('final_score', { ascending: false }),
      ]);

      const details = normalizeDetails(profileRes.data?.therapist_details);
      const branding = brandingRes.data || {};
      const specialties = (specialtiesRes.data || []).map(s => s.specialties?.name).filter(Boolean);
      const conditions = (conditionsRes.data || []).map(c => c.condition_name).filter(Boolean);
      const specialtyBadges = specialtyBadgesRes.data || [];
      const mainBadge = specialtyBadges[0] || null;

      let languages = [];
      if (details.languages) {
        if (Array.isArray(details.languages)) {
          languages = details.languages.map(l => typeof l === 'string' ? { language: l, level: 5 } : l);
        }
      }
      if (!languages.length) languages = [{ language: 'Español', level: 5 }];

      exportTherapistCV({
        therapist: {
          ...profileRes.data,
          therapist_details: details,
          avatar_url: branding.avatar_url,
          badge_label: mainBadge?.badge || null,
          final_score: mainBadge?.final_score || null,
        },
        branding: {
          primaryColor: branding.primary_color || DENTALSPOT_COLORS.primary,
          secondaryColor: branding.secondary_color || DENTALSPOT_COLORS.secondary,
        },
        education: educationRes.data || [],
        experience: experienceRes.data || [],
        services: servicesRes.data || [],
        specialties,
        conditions,
        specialtyBadges,
        languages,
      });
    } catch (err) {
      logger.error('Error generating CV:', err);
      toast({ variant: 'destructive', title: 'Error al generar CV' });
    } finally {
      setCvLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No se pudo cargar tu perfil. Intenta recargar la página.
      </div>
    );
  }

  // Base tabs for all users (including patients)
  const baseTabs = [
    { key: 'personal-info', label: 'Sobre Mí', icon: <User className="h-4 w-4" /> },
  ];

  // Professional tabs (Therapists & Clinics)
  const professionalTabs = [
    { key: 'academic', label: 'Formación', icon: <GraduationCap className="h-4 w-4" /> },
    { key: 'dentallevel', label: 'DentalLevel', icon: <Award className="h-4 w-4" />, highlight: true },
    { key: 'clinics-availability', label: 'Agenda', icon: <MapPin className="h-4 w-4" /> },
    { key: 'docs', label: 'Plantillas', icon: <FileText className="h-4 w-4" /> },
    { key: 'membership', label: 'Mi Plan', icon: <CreditCard className="h-4 w-4" /> },
    { key: 'invitations', label: 'Mis Invitaciones', icon: <Gift className="h-4 w-4" /> },
  ];

  // Clinic-specific tabs
  const clinicTabs = [
    { key: 'clinic-info', label: 'Datos de la Clínica', icon: <Building2 className="h-4 w-4" /> },
    { key: 'clinic-team', label: 'Nuestro Equipo', icon: <Users className="h-4 w-4" /> },
    { key: 'services', label: 'Servicios y Aranceles', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'billing', label: 'Facturación', icon: <Landmark className="h-4 w-4" /> },
    { key: 'customization', label: 'Personalización Visual', icon: <Palette className="h-4 w-4" /> },
    { key: 'membership', label: 'Mi Plan', icon: <CreditCard className="h-4 w-4" /> },
  ];

  // Tabs comunes a TODOS los roles: cuenta/seguridad y privacidad/datos
  const accountTabs = [
    { key: 'security', label: 'Cuenta y Seguridad', icon: <Shield className="h-4 w-4" /> },
    { key: 'privacy', label: 'Privacidad y Datos', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  // Clinic users: clinicTabs + accountTabs
  // Therapists: baseTabs + professionalTabs + accountTabs
  // Patients: baseTabs + accountTabs
  const tabs = isClinic
    ? [...clinicTabs, ...accountTabs]
    : isTherapist
      ? [...baseTabs, ...professionalTabs, ...accountTabs]
      : [...baseTabs, ...accountTabs];

  // B11a banner (followup #4 spec 023): mostrar siempre que el user pro
  // (therapist/clinic) NO haya completado wizard de clínica, sin importar
  // si vino con ?onboarding=required en URL (antes solo aparecía vía
  // redirect de RoleGuard, no si el user navegaba directo al profile
  // desde el sidebar — falsa sensación de estado completo).
  //
  // Auto-desaparece cuando el user completa el wizard (insert en clinics
  // dispara trigger auto_create_organization_for_clinic que crea
  // organization_members.clinic_admin, lo cual hace userOrgRoles.length > 0
  // sin necesidad de refresh).
  const showOnboardingBanner =
    (isTherapist || isClinic) && userOrgRoles.length === 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {showOnboardingBanner && (
        <div className="mb-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Building2 className="h-6 w-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Completa los datos de tu clínica para usar DentalSpot
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                {isClinic
                  ? 'Antes de poder gestionar pacientes y agenda, registra los datos de tu clínica abajo. Es un paso único — después tu equipo puede empezar a operar.'
                  : 'Para crear pacientes, agendar citas y registrar pagos necesitamos saber dónde atiendes. Agrega tu primer lugar de atención abajo (puede ser tu consulta privada o una clínica donde trabajas).'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <Card className="mb-8 overflow-hidden bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-none shadow-md">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white dark:ring-slate-800 shadow-lg overflow-hidden">
                <ProfileAvatar
                  profile={profile}
                  src={profile?.avatar_url}
                  className="h-full w-full"
                />
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 bg-green-500 rounded-full border-4 border-white dark:border-slate-800 shadow-sm" title="Online"></div>
            </div>
            
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.full_name || 'Tu Nombre'}
                </h1>
                {(isTherapist || isClinic) && (
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200">
                    Profesional Verificado
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <p className="text-gray-500 dark:text-gray-400">
                  {profile.email} • {profile.rut || 'RUT no informado'}
                </p>
                {isTherapist && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCV}
                    disabled={cvLoading}
                    className="rounded-full text-xs"
                  >
                    {cvLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                    Descargar CV
                  </Button>
                )}
              </div>

              {(isTherapist || isClinic) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 text-sm">
                  {profile.specialization_areas?.map((area, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col gap-6"
      >
        {/* Horizontal scrollable tabs — all screen sizes */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm py-2 -mt-2">
          <TabsList className="inline-flex gap-1 p-1.5 bg-muted/30 rounded-xl h-auto min-w-max">
            {tabs.map(t => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all
                  data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary
                  hover:bg-slate-100 dark:hover:bg-slate-800
                  ${t.highlight ? 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-50 data-[state=active]:to-primary data-[state=active]:text-purple-700' : ''}`}
              >
                <span className={`p-1 sm:p-1.5 rounded-md ${activeTab === t.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                  {t.icon}
                </span>
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.label.split(' ')[0]}</span>
                {t.highlight && (
                  <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-primary bg-clip-text text-transparent">
                    Único
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">

          {/* Información Personal */}
          <TabsContent value="personal-info" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'personal-info' && (
              <div className="space-y-6">
                <Chunk><PersonalInfoSection /></Chunk>
                {(isTherapist || isClinic) && (
                  <>
                    <Chunk><ImagesSection /></Chunk>
                    <Chunk><VisualCustomizationSection /></Chunk>
                    <Chunk><BankTransferInfoForm /></Chunk>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          {/* Cuenta y Seguridad (todos los roles) */}
          <TabsContent value="security" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Chunk><AccountSecuritySettings /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Privacidad y Datos (todos los roles) */}
          <TabsContent value="privacy" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <Chunk><PrivacySection /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Especialidades y Formación (Experiencia + Académica) */}
          <TabsContent value="academic" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'academic' && (
              <div className="space-y-6">
                <Chunk><WorkExperienceSection /></Chunk>
                <Chunk><AcademicFormationSection /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* DentalLevel - Sistema de Reputación Clínica */}
          <TabsContent value="dentallevel" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'dentallevel' && (
              <div className="space-y-8">
                {/* Hero Banner DentalLevel */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-primary p-8 shadow-xl">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-xl" />
                    <div className="absolute -bottom-8 right-20 w-72 h-72 bg-primary rounded-full mix-blend-overlay filter blur-xl" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">DentalLevel</h2>
                        <p className="text-purple-100 text-sm font-medium">
                          Sistema de Reputación Clínica Cuantificada
                        </p>
                      </div>
                      <span className="ml-auto hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                        🌎 Único en LATAM
                      </span>
                    </div>
                    <p className="text-purple-100 text-sm max-w-2xl leading-relaxed">
                      Tu nivel profesional se calcula automáticamente combinando tu formación académica (40%)
                      y experiencia clínica (60%). Mientras más completo tu perfil, más alto tu nivel.
                      Los pacientes ven tus insignias al buscar profesionales.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                        <GraduationCap className="h-4 w-4 text-purple-200" />
                        <span className="text-xs text-white font-medium">Formación = 40%</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 backdrop-blur-sm">
                        <Briefcase className="h-4 w-4 text-purple-200" />
                        <span className="text-xs text-white font-medium">Experiencia = 60%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Especialidades + Condiciones */}
                <Chunk><SpecialtiesConditionsSection /></Chunk>

                {/* Reputación Dashboard Completo */}
                <Chunk><ReputationDashboard /></Chunk>

                {/* Plan de Crecimiento */}
                <Chunk><GrowthPanel /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Clínicas, Horarios y Servicios */}
          <TabsContent value="clinics-availability" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'clinics-availability' && (
              <div className="space-y-6">
                <Chunk><MyClinicsSection /></Chunk>
                <Chunk><ServicesFeesSection /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Datos de la Clínica (clinic role only) */}
          <TabsContent value="clinic-info" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'clinic-info' && (
              <div className="space-y-6">
                <Chunk><ClinicInfoSection /></Chunk>
                {/* ImagesSection — foto del responsable + logo de marca.
                    Heredado del flow therapist (mismo componente). Saves a
                    therapist_branding con therapist_id=clinic_admin.user_id. */}
                <Chunk><ImagesSection /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Nuestro Equipo (clinic role only) */}
          <TabsContent value="clinic-team" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'clinic-team' && <Chunk><ClinicTeamSection /></Chunk>}
          </TabsContent>

          {/* Servicios y Aranceles (standalone for clinic role) */}
          <TabsContent value="services" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'services' && <Chunk><ServicesFeesSection /></Chunk>}
          </TabsContent>

          {/* Documentos y Materiales */}
          <TabsContent value="docs" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'docs' && (
              <div className="space-y-6">
                <Chunk><PatientDocsSection /></Chunk>
                <Chunk><CustomMaterialsSection /></Chunk>
                <Chunk><MyMarketplaceResourcesSection /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Mi Plan / Membresía + Programa de Referidos */}
          <TabsContent value="membership" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'membership' && (
              <div className="space-y-6">
                <Chunk><MembershipPlansPage /></Chunk>
                <Chunk><InvitationsPanel /></Chunk>
              </div>
            )}
          </TabsContent>

          {/* Mis Invitaciones — invitaciones a clínicas (recibidas) */}
          <TabsContent value="invitations" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeTab === 'invitations' && <Chunk><MyClinicInvitationsPanel /></Chunk>}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}