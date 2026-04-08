// Shared utilities
export {
  DENTALSPOT_COLORS,
  BADGE_CONFIG,
  hexToRgb,
  formatPrice,
  normalizeDetails,
  SectionBadge,
  SectionTitle,
  SectionSubtitle,
} from './shared/utils';

// Sections
export { default as HeroSection } from './HeroSection';
export { default as AboutSection } from './AboutSection';
export { default as ConditionsSection } from './ConditionsSection';
export { default as EducationSection } from './EducationSection';
export { default as ServicesSection } from './ServicesSection';
export { default as TestimonialsSection } from './TestimonialsSection';
export { default as ClinicsAndBookingSection } from './ClinicsAndBookingSection';

// CTA, Navigation, States
export {
  BookingCTASection,
  StickyActionBar,
  FooterSection,
  LoadingSkeleton,
  NotFoundState,
} from './CTAAndNavigation';