import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, MapPin, Video, Building2,
  Zap, RotateCcw, Clock, Phone
} from 'lucide-react';
import { AnimatedSection } from '@/components/landing/LandingAnimations';
import { hexToRgb, SectionBadge, SectionTitle, SectionSubtitle } from './shared/utils';
import LandingBookingCalendar from '@/components/calendar/LandingBookingCalendar';

const ClinicCard = ({ clinic, isSelected, onSelect, primaryColor }) => {
  const rgb = hexToRgb(primaryColor);
  const isOnline = clinic.modality === 'online';

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(clinic)}
      className={`
        w-full text-left rounded-xl p-4 border-2 transition-all duration-200
        ${isSelected
          ? 'bg-white shadow-lg border-current'
          : 'bg-white/60 shadow-sm border-slate-100 hover:border-slate-200 hover:bg-white'
        }
      `}
      style={{
        borderColor: isSelected ? primaryColor : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isSelected ? `rgba(${rgb}, 0.1)` : '#f1f5f9',
          }}
        >
          {isOnline ? (
            <Video
              className="w-5 h-5"
              style={{ color: isSelected ? primaryColor : '#94a3b8' }}
            />
          ) : (
            <MapPin
              className="w-5 h-5"
              style={{ color: isSelected ? primaryColor : '#94a3b8' }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-900 text-sm">{clinic.name}</h4>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {isOnline
              ? 'Atención remota desde cualquier lugar'
              : <>{clinic.address}{clinic.city?.name ? `, ${clinic.city.name}` : ''}</>
            }
          </p>
        </div>
        <motion.div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            borderColor: isSelected ? primaryColor : '#d1d5db',
          }}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
        </motion.div>
      </div>
    </motion.button>
  );
};

const ModalityIndicator = ({ selectedClinic, primaryColor }) => {
  const rgb = hexToRgb(primaryColor);
  const isOnline = selectedClinic?.modality === 'online';

  return (
    <motion.div
      layout
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
      style={{
        backgroundColor: `rgba(${rgb}, 0.08)`,
        color: primaryColor,
      }}
    >
      {isOnline ? (
        <>
          <Video className="w-4 h-4" />
          <span>Videollamada</span>
        </>
      ) : (
        <>
          <MapPin className="w-4 h-4" />
          <span>Presencial en {selectedClinic?.name}</span>
        </>
      )}
    </motion.div>
  );
};

const TrustBadges = ({ primaryColor, secondaryColor }) => (
  <div className="flex flex-wrap gap-6 justify-center mt-8 pt-6 border-t border-slate-100">
    {[
      { icon: Zap, label: 'Sujeto a confirmación del profesional', color: primaryColor },
      { icon: Clock, label: 'Recordatorios automáticos', color: secondaryColor },
      { icon: RotateCcw, label: 'Reprogramación flexible', color: primaryColor },
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 + i * 0.1 }}
        className="flex items-center gap-2 text-sm text-slate-500"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${item.color}12` }}
        >
          <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
        </div>
        <span className="text-xs font-medium">{item.label}</span>
      </motion.div>
    ))}
  </div>
);

const ClinicsAndBookingSection = forwardRef(({
  therapistId,
  clinics = [],
  branding = {},
  therapistName = '',
  acceptsOnlineBooking = false,
  bookingInstructions = ''
}, ref) => {
  const { primaryColor = '#E11D48', secondaryColor = '#0F172A' } = branding;
  const rgb = hexToRgb(primaryColor);

  const hasOnline = clinics.some(c => ['online', 'ambas'].includes(c.modality)) || clinics.length === 0;
  const presencialClinics = clinics.filter(c => ['presencial', 'ambas'].includes(c.modality));

  const clinicOptions = [
    ...presencialClinics.map(c => ({
      ...c,
      displayType: 'presencial',
    })),
    ...(hasOnline ? [{
      id: null,
      name: 'Consulta Online',
      address: 'Atención por videollamada',
      modality: 'online',
      displayType: 'online',
    }] : []),
  ];

  const [selectedClinic, setSelectedClinic] = useState(clinicOptions[0] || null);

  const activeClinicId = selectedClinic?.modality === 'online' ? null : selectedClinic?.id;
  const activeModality = selectedClinic?.modality === 'online' ? 'online' : 'presencial';

  // Gate self-booking: si el dentista no activó "Aceptar reservas online",
  // no mostramos la sección de reserva. El visitante igual puede contactarlo
  // por los otros medios del perfil (teléfono, redes). Se ubica tras los hooks
  // para no violar las reglas de hooks de React.
  if (!acceptsOnlineBooking) return null;

  return (
    <section
      ref={ref}
      id="booking"
      className="py-14 md:py-20 bg-slate-50/80 relative overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: primaryColor }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        <AnimatedSection className="text-center mb-10">
          <SectionBadge icon={Calendar} label="Agenda Tu Hora" primaryColor={primaryColor} rgb={rgb} />
          <SectionTitle className="text-slate-900">Reserva tu Cita</SectionTitle>
          <SectionSubtitle>
            Selecciona dónde quieres atenderte y encuentra un horario disponible
            {therapistName && ` con ${therapistName}`}
          </SectionSubtitle>
        </AnimatedSection>

        <div className="grid lg:grid-cols-12 gap-6">
          <AnimatedSection delay={0.1} className="lg:col-span-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Dónde atenderte
                </h3>
              </div>

              <div className="space-y-2.5">
                {clinicOptions.map((clinic, i) => (
                  <motion.div
                    key={clinic.id || 'online'}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                  >
                    <ClinicCard
                      clinic={clinic}
                      isSelected={
                        clinic.modality === 'online'
                          ? selectedClinic?.modality === 'online'
                          : selectedClinic?.id === clinic.id
                      }
                      onSelect={setSelectedClinic}
                      primaryColor={primaryColor}
                    />
                  </motion.div>
                ))}
              </div>

              {selectedClinic && (
                <motion.div layout className="pt-2">
                  <ModalityIndicator
                    selectedClinic={selectedClinic}
                    primaryColor={primaryColor}
                  />
                </motion.div>
              )}

              {selectedClinic?.phone && (
                <a
                  href={`tel:${selectedClinic.phone}`}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {selectedClinic.phone}
                </a>
              )}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="lg:col-span-8">
            <motion.div
              layout
              className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
            >
              <LandingBookingCalendar
                therapistId={therapistId}
                branding={branding}
                clinicId={activeClinicId}
                modality={activeModality}
                bookingInstructions={bookingInstructions}
              />
            </motion.div>
          </AnimatedSection>
        </div>

        <TrustBadges primaryColor={primaryColor} secondaryColor={secondaryColor} />
      </div>
    </section>
  );
});

ClinicsAndBookingSection.displayName = 'ClinicsAndBookingSection';

export default ClinicsAndBookingSection;