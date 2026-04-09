import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DENTAL_SYMPTOMS } from './SymptomStep';

// Local AI classification (v1 — no API needed)
const classifySymptoms = (symptoms, description) => {
  const text = [...symptoms, description.toLowerCase()].join(' ');

  // Urgency
  let urgency = 'preventivo';
  if (text.includes('hinchazon') || text.includes('dolor') || text.includes('roto') || text.includes('sangrado')) {
    urgency = 'moderado';
  }
  if (text.includes('hinchazon') && text.includes('dolor')) {
    urgency = 'urgente';
  }

  // Category & specialties
  const categories = [];
  const specialties = [];

  if (text.includes('dolor_muela') || text.includes('dolor') || text.includes('muela')) {
    categories.push('Posible caries o infeccion');
    specialties.push('endodoncia', 'odontologia_general');
  }
  if (text.includes('diente_roto') || text.includes('roto') || text.includes('fractur')) {
    categories.push('Fractura dental');
    specialties.push('rehabilitacion_oral', 'estetica_dental');
  }
  if (text.includes('sangrado') || text.includes('encias')) {
    categories.push('Problema periodontal');
    specialties.push('periodoncia');
  }
  if (text.includes('sensibilidad') || text.includes('frio') || text.includes('calor')) {
    categories.push('Sensibilidad dental');
    specialties.push('endodoncia', 'odontologia_general');
  }
  if (text.includes('mal_aliento') || text.includes('aliento')) {
    categories.push('Halitosis');
    specialties.push('periodoncia', 'odontologia_general');
  }
  if (text.includes('mancha') || text.includes('color') || text.includes('amarill')) {
    categories.push('Estetica dental');
    specialties.push('estetica_dental');
  }
  if (text.includes('hinchazon') || text.includes('hinch')) {
    categories.push('Posible infeccion/absceso');
    specialties.push('cirugia_maxilofacial', 'endodoncia');
    urgency = 'urgente';
  }
  if (text.includes('limpieza') || text.includes('sarro') || text.includes('control')) {
    categories.push('Limpieza y prevencion');
    specialties.push('odontologia_general');
  }

  if (categories.length === 0) {
    categories.push('Evaluacion general');
    specialties.push('odontologia_general');
  }

  // Advice
  const adviceMap = {
    urgente: 'Te recomendamos consultar lo antes posible. Mientras tanto, evita alimentos muy calientes o frios y no te automediques.',
    moderado: 'Es importante agendar una evaluacion pronto. Mantén buena higiene oral y evita masticar del lado afectado.',
    preventivo: 'No es urgente, pero es bueno hacer un control. La prevencion ahorra tiempo y dinero.',
  };

  return {
    categories: [...new Set(categories)],
    specialties: [...new Set(specialties)],
    urgency,
    advice: adviceMap[urgency],
  };
};

const URGENCY_CONFIG = {
  urgente: { label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle className="w-5 h-5" /> },
  moderado: { label: 'Moderado', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-5 h-5" /> },
  preventivo: { label: 'Preventivo', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-5 h-5" /> },
};

const AIAnalysisStep = ({ data, onNext, onBack }) => {
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    // Simulate AI processing delay for UX
    const timer = setTimeout(() => {
      const analysis = classifySymptoms(data.symptoms, data.description);
      setResult(analysis);
      setAnalyzing(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [data]);

  if (analyzing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <p className="text-lg font-semibold text-slate-700">Analizando tus sintomas con IA...</p>
        <p className="text-sm text-slate-400">Esto toma solo unos segundos</p>
      </motion.div>
    );
  }

  const urgencyInfo = URGENCY_CONFIG[result.urgency];
  const symptomLabels = data.symptoms.map(id => DENTAL_SYMPTOMS.find(s => s.id === id)?.label).filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Resultado del analisis</h2>
        <p className="text-slate-500">Orientacion preliminar basada en tus sintomas</p>
      </div>

      {/* Urgency badge */}
      <div className="flex justify-center">
        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border ${urgencyInfo.color} font-semibold text-sm`}>
          {urgencyInfo.icon}
          Nivel de urgencia: {urgencyInfo.label}
        </div>
      </div>

      {/* Analysis card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {/* What you told us */}
        {symptomLabels.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tus sintomas</p>
            <div className="flex flex-wrap gap-2">
              {symptomLabels.map((label, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Classification */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Posible diagnostico</p>
          <div className="flex flex-wrap gap-2">
            {result.categories.map((cat, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium">{cat}</span>
            ))}
          </div>
        </div>

        {/* Advice */}
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-sm text-slate-700 leading-relaxed">💡 {result.advice}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center">
          ⚕️ Este analisis es orientativo y no reemplaza la evaluacion de un profesional.
        </p>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          onClick={() => onNext({ ...data, analysis: result })}
          size="lg"
          className="h-14 px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 text-base"
        >
          Ver dentistas recomendados <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button variant="outline" onClick={onBack} className="rounded-2xl">
          Volver a editar sintomas
        </Button>
      </div>
    </motion.div>
  );
};

export default AIAnalysisStep;
