/**
 * @file src/pages/TherapistPublicProfilePage.jsx
 *
 * LANDING PAGE DE CONVERSIÓN — DentalSpot 2.0 (Modular Architecture)
 * 
 * REFACTORED: All sections extracted into individual modules at:
 * src/components/landing/sections/
 * 
 * This file only handles:
 * - Route params & navigation
 * - Data fetching from Supabase
 * - Section composition & ordering
 * - SEO metadata
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Instagram, Facebook, Linkedin, Twitter } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useMetaTracking } from '@/hooks/useMetaTracking';
import { getTherapistAvailability } from '@/features/therapist/services/therapist.api';
import { exportTherapistCV } from '@/components/landing/TherapistCVExport';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// MODULAR SECTION IMPORTS
// ============================================================================
import logger from '@/lib/utils/logger';
import {
  DENTALSPOT_COLORS,
  hexToRgb,
  normalizeDetails,
  // Sections
  HeroSection,
  AboutSection,
  ConditionsSection,
  EducationSection,
  ServicesSection,
  TestimonialsSection,
  ClinicsAndBookingSection,
  // CTA & Navigation
  BookingCTASection,
  StickyActionBar,
  FooterSection,
  LoadingSkeleton,
  NotFoundState,
} from '@/components/landing/sections';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const TherapistPublicProfilePage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackEvent } = useMetaTracking();

  // State
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [copied, setCopied] = useState(false);

  // Refs
  const bookingSectionRef = useRef(null);

  // ══════════════════════════════════════════════════════════════════
  // SCROLL LISTENER
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ══════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(slug);
        let therapistId;

        if (isUuid) {
          therapistId = slug;
        } else {
          // FIX: Use maybeSingle() to avoid PGRST116 error on 0 results
          const { data: slugData, error: slugError } = await supabase
            .from('therapist_details')
            .select('user_id')
            .eq('slug', slug)
            .maybeSingle();

          if (slugError) throw slugError;
          
          if (!slugData) {
            // Gracefully handle not found without throwing
            setData(null);
            setLoading(false);
            return;
          }
          therapistId = slugData.user_id;
        }

        // Parallel fetch
        const [
          profileRes,
          brandingRes,
          landingRes,
          clinicsRes,
          educationRes,
          experienceRes,
          servicesRes,
          conditionsRes,
          specialtyBadgesRes,
        ] = await Promise.all([
          supabase.from('profiles').select(`
            id, full_name, email, phone,
            therapist_details!fk_therapist_profile (
              professional_title, about_me, headline_statement,
              years_experience, languages, specialization_areas,
              registration_supersalud, registration_secreduc,
              university, graduation_year, slug,
              social_instagram_url, social_facebook_url,
              social_linkedin_url, social_twitter_url,
              public_email, accepts_online_booking
            ),
            therapist_specialties ( specialties (id, name) )
          `).eq('id', therapistId).maybeSingle(), // Changed to maybeSingle for safety

          supabase.from('therapist_branding')
            .select('avatar_url, logo_url, primary_color, secondary_color, accent_color, text_color, background_color, font_family')
            .eq('therapist_id', therapistId)
            .maybeSingle(),

          supabase.from('therapist_landing_pages')
            .select('hero_title, hero_subtitle, hero_image_url, testimonials_section, theme_options, meta_title, meta_description')
            .eq('therapist_id', therapistId)
            .maybeSingle(),

          supabase.from('clinics')
            .select('id, name, address, modality, phone, city:cities(name)')
            .eq('therapist_id', therapistId)
            .eq('is_active', true),

          supabase.from('therapist_education')
            .select('*')
            .eq('therapist_id', therapistId)
            .order('graduation_year', { ascending: false }),

          supabase.from('therapist_experience')
            .select('*')
            .eq('therapist_id', therapistId)
            .order('start_date', { ascending: false }),

          supabase.from('therapist_services')
            .select('*')
            .eq('therapist_id', therapistId)
            .eq('is_active', true)
            .eq('is_public', true)
            .order('price_clp', { ascending: true }),

          supabase.from('therapist_conditions')
            .select('condition_name')
            .eq('therapist_id', therapistId)
            .eq('is_public', true),

          supabase.from('therapist_specialty_badges')
            .select('therapist_id, specialty, badge, final_score')
            .eq('therapist_id', therapistId)
            .order('final_score', { ascending: false }),
        ]);

        if (profileRes.error) throw profileRes.error;
        
        // Handle case where profile doesn't exist (e.g. deleted user)
        if (!profileRes.data) {
          setData(null);
          setLoading(false);
          return;
        }

        const profile = profileRes.data;
        const branding = brandingRes.data || {};
        const landing = landingRes.data || {};
        const clinics = clinicsRes.data || [];
        const details = normalizeDetails(profile.therapist_details);

        const specialties = profile.therapist_specialties
          ?.map(s => s.specialties?.name)
          .filter(Boolean) || [];

        const conditions = (conditionsRes.data || [])
          .map(c => c.condition_name)
          .filter(Boolean);

        const services = servicesRes.data || [];
        const education = educationRes.data || [];
        const experience = experienceRes.data || [];

        // Specialty badges — show ALL (not filtered by >=25 anymore)
        const specialtyBadges = specialtyBadgesRes.data || [];
        const mainBadge = specialtyBadges.length > 0 ? specialtyBadges[0] : null;

        // Parse languages
        let languages = [];
        if (details.languages) {
          if (Array.isArray(details.languages)) {
            languages = details.languages.map(lang => {
              if (typeof lang === 'string') return { language: lang, level: 5 };
              return lang;
            });
          } else if (typeof details.languages === 'string') {
            languages = details.languages.split(',').map(lang => ({
              language: lang.trim(),
              level: 5
            }));
          }
        }
        if (languages.length === 0) {
          languages = [{ language: 'Español', level: 5 }];
        }

        // Testimonials
        let testimonials = [];
        if (landing.testimonials_section) {
          const ts = typeof landing.testimonials_section === 'string'
            ? JSON.parse(landing.testimonials_section)
            : landing.testimonials_section;
          if (Array.isArray(ts)) testimonials = ts;
          else if (ts.items && Array.isArray(ts.items)) testimonials = ts.items;
        }

        // Theme
        let theme = {};
        if (landing.theme_options) {
          theme = typeof landing.theme_options === 'string'
            ? JSON.parse(landing.theme_options)
            : landing.theme_options;
        }

        // Colors
        const primaryColor = theme.primary_color || branding.primary_color || DENTALSPOT_COLORS.primary;
        const secondaryColor = theme.secondary_color || branding.secondary_color || DENTALSPOT_COLORS.secondary;
        const bgColor = branding.background_color || '#FFFFFF';
        const textColor = branding.text_color || DENTALSPOT_COLORS.dark;

        // Availability
        let nextSlots = [];
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          const availability = await getTherapistAvailability(therapistId, null, today, 14);
          const todayStr = today;
          const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

          for (const day of (availability || [])) {
            const slots = (day.time_slots || [])
              .filter(s => s.available !== false)
              .map(s => typeof s === 'string' ? s : String(s.time || ''))
              .filter(Boolean)
              .slice(0, 4);

            if (!slots.length) continue;

            let label;
            if (day.availability_date === todayStr) label = 'Hoy';
            else if (day.availability_date === tomorrowStr) label = 'Mañana';
            else {
              const d = new Date(day.availability_date + 'T12:00:00');
              label = format(d, "EEEE d 'de' MMMM", { locale: es });
              label = label.charAt(0).toUpperCase() + label.slice(1);
            }

            nextSlots.push({ date: day.availability_date, label, slots });
            if (nextSlots.length >= 3) break;
          }
        } catch (e) {
          logger.warn('Error fetching availability:', e);
        }

        // Modalities
        const hasOnline = clinics.some(c => c.modality === 'online' || c.modality === 'ambas');
        const hasPresencial = clinics.some(c => c.modality === 'presencial' || c.modality === 'ambas');
        const hasInsurance = services.some(s => s.insurance_coverage || (s.insurance_providers && s.insurance_providers.length > 0));

        // Social
        const socialLinks = [
          { url: details.social_instagram_url, icon: Instagram, label: 'Instagram' },
          { url: details.social_facebook_url, icon: Facebook, label: 'Facebook' },
          { url: details.social_linkedin_url, icon: Linkedin, label: 'LinkedIn' },
          { url: details.social_twitter_url, icon: Twitter, label: 'Twitter' },
        ].filter(s => s.url);

        // Therapist object
        const therapist = {
          ...profile,
          therapist_details: details,
          avatar_url: branding.avatar_url || details.avatar_url,
          hero_title: landing.hero_title,
          hero_subtitle: landing.hero_subtitle || details.headline_statement,
          hasOnline,
          hasPresencial,
          hasInsurance,
          badge_label: mainBadge?.badge || null,
          final_score: mainBadge?.final_score || null,
        };

        // Branding config
        const brandingConfig = {
          primaryColor,
          secondaryColor,
          bgColor,
          textColor,
          rgb: hexToRgb(primaryColor),
          rgbSecondary: hexToRgb(secondaryColor),
          logoUrl: branding.logo_url,
          heroImage: landing.hero_image_url,
          fontFamily: branding.font_family,
        };

        setData({
          therapistId,
          therapist,
          branding: brandingConfig,
          specialties,
          conditions,
          services,
          education,
          experience,
          testimonials,
          clinics,
          nextSlots,
          socialLinks,
          specialtyBadges,
          languages,
          meta: {
            title: landing.meta_title,
            description: landing.meta_description,
          },
        });

      } catch (error) {
        logger.error('Error loading profile:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchData();
  }, [slug, location.search]);

  // ══════════════════════════════════════════════════════════════════
  // META PIXEL TRACKING
  // ══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (data?.therapist?.full_name) {
      trackEvent('ViewContent', { content_name: `Perfil: ${data.therapist.full_name}`, content_category: 'Therapist Profile' });
    }
  }, [data?.therapist?.full_name]);

  // ══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════
  const handleBookClick = () => {
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownloadCV = () => {
    if (data) exportTherapistCV(data);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.therapist.full_name} - Dentista`,
          url,
        });
      } catch (e) { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: '¡Link copiado!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // LOADING & ERROR
  // ══════════════════════════════════════════════════════════════════
  if (loading) return <LoadingSkeleton />;
  if (!data) return <NotFoundState />;

  const { therapist, branding } = data;
  const details = normalizeDetails(therapist.therapist_details);

  // ══════════════════════════════════════════════════════════════════
  // RENDER — Clean section composition
  // ══════════════════════════════════════════════════════════════════
  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>
          {data.meta.title || `${therapist.full_name} — Dentista | DentalSpot`}
        </title>
        <meta
          name="description"
          content={
            data.meta.description ||
            therapist.hero_subtitle ||
            `Agenda tu cita con ${therapist.full_name}, dentista verificado en DentalSpot.`
          }
        />
        <meta property="og:title" content={`${therapist.full_name} - Dentista`} />
        <meta property="og:description" content={therapist.hero_subtitle || 'Agenda tu cita'} />
        {therapist.avatar_url && <meta property="og:image" content={therapist.avatar_url} />}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" rel="stylesheet" />
      </Helmet>

      {/* MAIN */}
      <div
        className="min-h-screen"
        style={{
          '--lp-primary': branding.primaryColor,
          '--lp-secondary': branding.secondaryColor,
          backgroundColor: branding.bgColor,
          color: branding.textColor,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* 1. HERO — Compact, no wasted space */}
        <HeroSection
          therapist={therapist}
          branding={branding}
          onBookClick={handleBookClick}
          onShareClick={handleShare}
          onDownloadCV={handleDownloadCV}
          copied={copied}
        />

        {/* 2. ABOUT + DENTALLEVEL — Unified section */}
        <AboutSection
          bio={details.about_me}
          branding={branding}
          therapist={therapist}
          specialtyBadges={data.specialtyBadges}
          languages={data.languages}
        />
        {/* 8. CTA */}
        <BookingCTASection
          branding={branding}
          onBookClick={handleBookClick}
        />

        {/* 3. CONDITIONS */}
        <ConditionsSection
          conditions={data.conditions}
          branding={branding}
          onBookClick={handleBookClick}
        />

        {/* 4. EDUCATION & EXPERIENCE — Hierarchical, shows ALL */}
        <EducationSection
          education={data.education}
          experience={data.experience}
          branding={branding}
        />

        {/* 5. SERVICES — Starbucks-style interactive cards */}
        <ServicesSection
          services={data.services}
          branding={branding}
          onBookClick={handleBookClick}
        />

        {/* 6. TESTIMONIALS */}
        <TestimonialsSection
          testimonials={data.testimonials}
          branding={branding}
        />

        {/* 7. CLINICS + BOOKING — Unified section */}
        <ClinicsAndBookingSection
          ref={bookingSectionRef}
          therapistId={data.therapistId}
          clinics={data.clinics}
          branding={branding}
          therapistName={therapist.full_name?.split(' ')[0]}
          acceptsOnlineBooking={details.accepts_online_booking === true}
        />

       
        {/* 9. FOOTER */}
        <FooterSection
          socialLinks={data.socialLinks}
          branding={branding}
        />

        {/* STICKY BAR */}
        <StickyActionBar
          therapist={therapist}
          branding={branding}
          isVisible={showStickyBar}
          onBookClick={handleBookClick}
        />
      </div>
    </>
  );
};

export default TherapistPublicProfilePage;