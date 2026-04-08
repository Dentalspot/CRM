/**
 * @file src/components/landing/sections/TestimonialsSection.jsx
 * TESTIMONIALS SECTION — Patient reviews
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/landing/LandingAnimations';
import { hexToRgb, SectionBadge, SectionTitle } from './shared/utils';

const TestimonialsSection = ({ testimonials, branding }) => {
  if (!testimonials || testimonials.length === 0) return null;
  const { primaryColor, secondaryColor } = branding;
  const rgb = hexToRgb(primaryColor);

  return (
    <section className="py-12 md:py-16" style={{ backgroundColor: `rgba(${rgb}, 0.03)` }}>
      <div className="container mx-auto max-w-6xl px-4">
        <AnimatedSection>
          <div className="text-center mb-10">
            <SectionBadge icon={Star} label="Testimonios" primaryColor={primaryColor} rgb={rgb} />
            <SectionTitle className="text-slate-900">Lo que dicen mis pacientes</SectionTitle>
          </div>
        </AnimatedSection>

        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 shadow-lg h-full flex flex-col">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-4 flex-grow italic text-sm">
                  "{testimonial.text || testimonial.comment || testimonial.content}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {(testimonial.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{testimonial.name || 'Paciente'}</p>
                    <p className="text-[10px] text-slate-400">Paciente verificado</p>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TestimonialsSection;