import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * @file src/components/shared/ScrollProgressBar.jsx
 *
 * Barra de progreso fija al top de la página que muestra cuánto scrolleó
 * el usuario. Usa el hook `useScroll` de Framer Motion (no listener manual)
 * + `useSpring` para suavizar el movimiento (sin jitter).
 *
 * Diseñada para landings públicas (patient home, dentist landing). NO se usa
 * en el dashboard de la app porque ahí no aplica el concepto de "progreso".
 *
 * Posicionamiento: `fixed top-0` con z-index 50 (debajo del header sticky
 * que es z-50). El propio header sticky tiene `border-b` así que la barra
 * de progreso se "pega" visualmente al header sin solaparse.
 */
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent to-primary z-[60] pointer-events-none"
      aria-hidden="true"
    />
  );
};

export default ScrollProgressBar;
