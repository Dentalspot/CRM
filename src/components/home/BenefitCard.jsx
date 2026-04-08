import React from 'react';
import { motion } from 'framer-motion';

const BenefitCard = ({ icon, title, description }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-center"
    >
      {/* Icon container */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {React.cloneElement(icon, { className: "w-7 h-7" })}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export default BenefitCard;