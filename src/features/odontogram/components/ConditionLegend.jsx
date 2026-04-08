import React from 'react';
import { DENTAL_CONDITIONS } from '@/constants/dentalConstants';

const ConditionLegend = ({ selectedCondition, onSelect }) => {
  const conditions = Object.values(DENTAL_CONDITIONS);

  return (
    <div className="flex flex-wrap gap-2">
      {conditions.map((condition) => (
        <button
          key={condition.id}
          onClick={() => onSelect(condition.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            selectedCondition === condition.id
              ? 'ring-2 ring-primary ring-offset-1 border-primary bg-primary/5'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <span
            className="w-3 h-3 rounded-sm border border-slate-300 flex-shrink-0"
            style={{ backgroundColor: condition.color }}
          />
          {condition.label}
        </button>
      ))}
    </div>
  );
};

export default ConditionLegend;
