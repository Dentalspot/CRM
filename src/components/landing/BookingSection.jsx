/**
 * BookingSection.jsx
 * 
 * Sección de reserva de citas para landing pages de terapeutas
 * Versión mejorada con correcciones de UX y accesibilidad
 * 
 * Ubicación: src/components/landing/BookingSection.jsx
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Video,
  Clock,
  RotateCcw,
  Zap,
  ShieldCheck,
  HeartHandshake,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedSection } from '@/components/landing/LandingAnimations';
import { SectionBadge } from '@/components/landing/sections/shared/utils';
import LandingBookingCalendar from '@/components/calendar/LandingBookingCalendar';

// ============================================================================
// UTILITIES
// ============================================================================
const hexToRgb = (hex) => {
  if (!hex) return '255, 116, 195';
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 116, 195';
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const TrustIndicator = ({ icon: Icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    className="flex flex-col items-center text-center p-4"
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon className="w-6 h-6" style={{ color }} />
    </div>
    <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
    <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">{description}</p>
  </motion.div>
);

const FloatingBadge = ({ icon: Icon, title, subtitle, bgColor, iconColor, position, delay }) => (
  <div className={cn("hidden xl:block absolute z-0", position)}>
    <motion.div
      initial={{ opacity: 0, x: position.includes('left') ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring" }}
      whileHover={{ scale: 1.05 }}
      className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3 w-48"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div>
        <p className="font-bold text-slate-800 text-sm">{title}</p>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>
    </motion.div>
  </div>
);

const ModalityButton = ({
  isSelected,
  onClick,
  icon: Icon,
  label,
  subtitle,
  primaryColor,
  secondaryColor
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    aria-pressed={isSelected}
    className={cn(
      "relative group flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-300 min-w-[200px]",
      isSelected
        ? "border-transparent text-white shadow-lg"
        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:shadow-md"
    )}
    style={isSelected ? {
      boxShadow: `0 10px 40px -10px ${primaryColor}40`
    } : {}}
  >
    {isSelected && (
      <motion.div
        layoutId="booking-active-bg"
        className="absolute inset-0 rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <span className="relative z-10 flex items-center gap-3 w-full">
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0 transition-colors",
        isSelected ? "text-white" : "text-slate-400"
      )} />
      <div className="flex flex-col text-left">
        <span className="font-bold text-sm md:text-base leading-tight">{label}</span>
        {subtitle && (
          <span className={cn(
            "text-xs mt-0.5 transition-colors",
            isSelected ? "text-white/80" : "text-slate-400"
          )}>
            {subtitle}
          </span>
        )}
      </div>
    </span>
  </motion.button>
);

const EmptyState = ({ primaryColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-12 px-6 bg-amber-50/50 rounded-3xl border border-amber-200/50"
  >
    <div
      className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
      style={{ backgroundColor: `${primaryColor}15` }}
    >
      <AlertCircle className="w-8 h-8" style={{ color: primaryColor }} />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">
      Disponibilidad no configurada
    </h3>
    <p className="text-slate-500 max-w-md mx-auto">
      Este profesional aún no ha configurado sus horarios de atención.
      Intenta contactarlo directamente para agendar una cita.
    </p>
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function BookingSection({
  therapistId,
  clinics = [],
  branding = {},
  therapistName = ''
}) {
  const { primaryColor = '#E11D48', secondaryColor = '#0F172A' } = branding;
  const rgbPrimary = hexToRgb(primaryColor);

  // Determine available modalities from clinics
  const hasOnline = clinics.some(c => ['online', 'ambas'].includes(c.modality)) || clinics.length === 0;
  const presencialClinics = clinics.filter(c => ['presencial', 'ambas'].includes(c.modality));
  const hasPresencial = presencialClinics.length > 0;

  // State for selection - default to online if available, else first clinic
  const getDefaultSelection = () => {
    if (hasOnline) return 'online';
    if (hasPresencial) return presencialClinics[0].id;
    return null;
  };

  const [selectedType, setSelectedType] = useState(getDefaultSelection);

  // Derived values
  const isOnlineSelected = selectedType === 'online';
  const activeClinicId = isOnlineSelected ? null : selectedType;
  const activeModality = isOnlineSelected ? 'online' : 'presencial';

  // Check if we have any availability options
  const hasAnyOption = hasOnline || hasPresencial;

  return (
    <section
      id="booking"
      className="relative py-24 md:py-32 overflow-hidden bg-slate-50/50"
    >
      {/* --- Fondos Decorativos Animados --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.35, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      <div className="container relative mx-auto max-w-6xl px-4 z-10">

        {/* --- Header Section --- */}
        <AnimatedSection className="text-center mb-16">
          <SectionBadge
            icon={Calendar}
            label="Agenda Tu Hora"
            primaryColor={primaryColor}
            rgb={rgbPrimary}
          />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            Reserva tu Cita
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Selecciona la modalidad que más te acomode y encuentra un horario disponible
            {therapistName && ` con ${therapistName}`} en segundos.
          </p>
        </AnimatedSection>

        {/* --- Selector Visual de Modalidad/Clínica --- */}
        {hasAnyOption && (
          <AnimatedSection delay={0.2} className="mb-12">
            <div className="flex flex-wrap justify-center gap-4">
              {/* Online Option */}
              {hasOnline && (
                <ModalityButton
                  isSelected={isOnlineSelected}
                  onClick={() => setSelectedType('online')}
                  icon={Video}
                  label="Consulta Online"
                  subtitle="Desde cualquier lugar"
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                />
              )}

              {/* Presencial Clinic Options */}
              {presencialClinics.map((clinic) => (
                <ModalityButton
                  key={clinic.id}
                  isSelected={selectedType === clinic.id}
                  onClick={() => setSelectedType(clinic.id)}
                  icon={MapPin}
                  label={clinic.name}
                  subtitle={clinic.address || clinic.city?.name || 'Ver ubicación'}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                />
              ))}
            </div>

            {/* Selected modality indicator (mobile friendly) */}
            <motion.div
              layout
              className="mt-6 flex justify-center"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `rgba(${rgbPrimary}, 0.1)`,
                  color: primaryColor
                }}
              >
                {isOnlineSelected ? (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Atención por videollamada</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span>
                      Atención presencial en {presencialClinics.find(c => c.id === selectedType)?.name}
                    </span>
                  </>
                )}
              </div>
            </motion.div>
          </AnimatedSection>
        )}

        {/* --- Main Calendar Section --- */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-8 lg:col-start-3">
            {hasAnyOption ? (
              <motion.div
                layout
                className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-20"
              >
                <LandingBookingCalendar
                  therapistId={therapistId}
                  branding={branding}
                  clinicId={activeClinicId}
                  modality={activeModality}
                />
              </motion.div>
            ) : (
              <EmptyState primaryColor={primaryColor} />
            )}
          </div>
        </div>

        {/* --- Trust Indicators Grid --- */}
        <AnimatedSection delay={0.3}>
          <div className="grid md:grid-cols-3 gap-8 border-t border-slate-200/60 pt-12">
            <TrustIndicator
              icon={Zap}
              title="Confirmación Inmediata"
              description="Recibe los detalles de tu cita al instante en tu correo electrónico."
              color={primaryColor}
              delay={0.4}
            />
            <TrustIndicator
              icon={Clock}
              title="Recordatorios Automáticos"
              description="Te avisaremos con anticipación para que no olvides tu sesión."
              color={secondaryColor}
              delay={0.5}
            />
            <TrustIndicator
              icon={RotateCcw}
              title="Reprogramación Flexible"
              description="Cambia tu hora fácilmente si surge un imprevisto (hasta 24h antes)."
              color={primaryColor}
              delay={0.6}
            />
          </div>
        </AnimatedSection>

        {/* --- Floating Badges (Desktop only) --- */}
        <FloatingBadge
          icon={ShieldCheck}
          title="Datos Seguros"
          subtitle="Privacidad garantizada"
          bgColor="#dcfce7"
          iconColor="#16a34a"
          position="top-1/3 left-4 xl:left-16"
          delay={0.8}
        />

        <FloatingBadge
          icon={HeartHandshake}
          title="Atención Humana"
          subtitle="Enfoque centrado en ti"
          bgColor="#dbeafe"
          iconColor="#2563eb"
          position="bottom-1/3 right-4 xl:right-16"
          delay={1}
        />

      </div>
    </section>
  );
}