import React from 'react';
import { motion } from 'framer-motion';

const FeatureHighlightCard = ({ icon, title, description, gradient = "from-primary to-secondary" }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all duration-300"
    >
      {/* Gradient glow effect on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

      <div className="relative z-10">
        {/* Icon container with gradient */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white mb-4 shadow-lg`}>
          {icon}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default FeatureHighlightCard;