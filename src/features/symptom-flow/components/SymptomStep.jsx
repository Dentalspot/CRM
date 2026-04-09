import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const DENTAL_SYMPTOMS = [
  { id: 'dolor_muela', emoji: '😣', label: 'Dolor de muela' },
  { id: 'diente_roto', emoji: '💔', label: 'Diente roto o fracturado' },
  { id: 'sangrado_encias', emoji: '🩸', label: 'Sangrado de encias' },
  { id: 'sensibilidad', emoji: '🥶', label: 'Sensibilidad al frio/calor' },
  { id: 'mal_aliento', emoji: '💨', label: 'Mal aliento persistente' },
  { id: 'mancha_color', emoji: '🟡', label: 'Mancha o cambio de color' },
  { id: 'hinchazon', emoji: '😰', label: 'Hinchazon en la cara' },
  { id: 'limpieza', emoji: '✨', label: 'Necesito una limpieza dental' },
];

const SymptomStep = ({ onNext }) => {
  const [selected, setSelected] = useState([]);
  const [description, setDescription] = useState('');

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const canContinue = selected.length > 0 || description.trim().length > 10;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">¿Que te esta pasando?</h2>
        <p className="text-slate-500">Selecciona tus sintomas o describelo con tus palabras</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DENTAL_SYMPTOMS.map((s) => (
          <button
            key={s.id}
            onClick={() => toggle(s.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
              selected.includes(s.id)
                ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(69,181,196,0.2)]'
                : 'border-slate-100 bg-white hover:border-slate-200'
            }`}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span className="text-xs sm:text-sm font-medium text-slate-700">{s.label}</span>
          </button>
        ))}
      </div>

      <div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O describelo con tus palabras... ej: 'me duele una muela al masticar desde hace 3 dias'"
          className="w-full h-24 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => onNext({ symptoms: selected, description })}
          disabled={!canContinue}
          size="lg"
          className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 text-base disabled:opacity-40"
        >
          Analizar con IA <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};

export { DENTAL_SYMPTOMS };
export default SymptomStep;
