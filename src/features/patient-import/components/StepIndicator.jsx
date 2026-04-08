import React from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';

const STEPS = ['Subir archivo', 'Mapear columnas', 'Vista previa', 'Importar'];

const StepIndicator = ({ currentStep }) => (
  <div className="flex items-center gap-2">
    {STEPS.map((s, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          i === currentStep ? 'bg-teal-600 text-white' :
          i < currentStep ? 'bg-teal-100 text-teal-700' :
          'bg-gray-100 text-gray-400'
        }`}>
          {i < currentStep && <CheckCircle className="h-3 w-3" />}
          <span>{s}</span>
        </div>
        {i < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-gray-300" />}
      </div>
    ))}
  </div>
);

export default StepIndicator;