import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const QuickSuggestions = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2 px-2">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className="text-xs h-auto py-1.5 px-3 rounded-full bg-white/50 hover:bg-indigo-50 border-indigo-100 text-indigo-700 hover:text-indigo-800 transition-all shadow-sm"
          >
            {suggestion}
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default QuickSuggestions;