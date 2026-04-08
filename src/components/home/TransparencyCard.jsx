import React from 'react';
import { motion } from 'framer-motion';

const TransparencyCard = ({ icon, title, description }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 text-center"
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100 text-emerald-600 mb-4">
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export default TransparencyCard;