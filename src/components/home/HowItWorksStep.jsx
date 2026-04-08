import React from 'react';
import { motion } from 'framer-motion';

const HowItWorksStep = ({ step, title, description }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative text-center group"
    >
      {/* Connector line for desktop */}
      {step < 3 && (
        <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-primary/10 z-0" />
      )}

      {/* Step number circle */}
      <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-2xl font-bold mb-6 shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
        {step}
      </div>

      {/* Content card */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 group-hover:border-primary/20 group-hover:shadow-lg transition-all duration-300">
        <h3 className="text-xl font-semibold text-slate-900 mb-3">
          {title}
        </h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default HowItWorksStep;