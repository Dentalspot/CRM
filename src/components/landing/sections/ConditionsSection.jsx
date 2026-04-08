/**
 * @file src/components/landing/sections/ConditionsSection.jsx
 * 
 * CONDITIONS SECTION — What the therapist treats
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
  ScaleOnHover
} from '@/components/landing/LandingAnimations';
import { hexToRgb, getConditionIcon, SectionBadge, SectionTitle, SectionSubtitle } from './shared/utils';

const ConditionsSection = ({ conditions, branding, onBookClick }) => {
  if (!conditions || conditions.length === 0) return null;
  const { primaryColor, secondaryColor } = branding;
  const rgb = hexToRgb(primaryColor);

  return (
    <section className="py-14 md:py-18 bg-white">
      <div className="container mx-auto max-w-6xl px-4">
        <AnimatedSection>
          <div className="text-center mb-10">
            <SectionBadge icon={Heart} label="¿En qué puedo ayudarte?" primaryColor={primaryColor} rgb={rgb} />
            <SectionTitle className="text-slate-900">
              Condiciones que Trato
            </SectionTitle>
            <SectionSubtitle>
              Si tú o tu hijo presentan alguna de estas dificultades, estoy aquí para ayudarte
            </SectionSubtitle>
          </div>
        </AnimatedSection>

        <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {conditions.map((condition, index) => {
            const IconComponent = getConditionIcon(condition);
            return (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl p-4 text-center shadow-md border border-slate-100 hover:shadow-lg transition-all cursor-default"
                >
                  <motion.div
                    whileHover={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.4 }}
                    className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: `rgba(${rgb}, 0.1)` }}
                  >
                    <IconComponent className="w-6 h-6" style={{ color: primaryColor }} />
                  </motion.div>
                  <h4 className="font-semibold text-slate-800 text-sm">{condition}</h4>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <AnimatedSection delay={0.3}>
          <div className="text-center mt-8">
            <ScaleOnHover>
              <Button
                onClick={onBookClick}
                size="lg"
                className="rounded-full px-7 h-11 font-bold shadow-lg text-white"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
              >
                Consulta si puedo ayudarte
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </ScaleOnHover>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ConditionsSection;