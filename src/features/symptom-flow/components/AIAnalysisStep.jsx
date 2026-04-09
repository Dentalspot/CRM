import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, AlertTriangle, Clock, CheckCircle, FileDown, FileImage } from 'lucide-react';
import { motion } from 'framer-motion';
import { DENTAL_SYMPTOMS } from './SymptomStep';

// Local AI classification (v1 — rule-based, will be replaced by edge function)
const classifySymptoms = (symptoms, description) => {
  const text = [...symptoms, description.toLowerCase()].join(' ');

  // Urgency
  let urgency = 'preventivo';

  // Category & specialties
  const categories = [];
  const specialties = [];

  // === DOLOR ===
  if (text.includes('dolor_muela') || text.includes('dolor') || text.includes('muela') || text.includes('duele')) {
    categories.push('Posible caries o infeccion');
    specialties.push('endodoncia', 'odontologia_general');
    urgency = 'moderado';
  }

  // === FRACTURA ===
  if (text.includes('diente_roto') || text.includes('roto') || text.includes('fractur') || text.includes('quebr') || text.includes('partido')) {
    categories.push('Fractura dental');
    specialties.push('rehabilitacion_oral', 'estetica_dental');
    urgency = 'moderado';
  }

  // === SANGRADO / ENCIAS ===
  if (text.includes('sangrado_encias') || text.includes('sangrado') || text.includes('encias') || text.includes('encia')) {
    categories.push('Problema periodontal');
    specialties.push('periodoncia');
    urgency = 'moderado';
  }

  // === SENSIBILIDAD ===
  if (text.includes('sensibilidad') || text.includes('frio') || text.includes('calor') || text.includes('sensible')) {
    categories.push('Sensibilidad dental');
    specialties.push('endodoncia', 'odontologia_general');
  }

  // === MAL ALIENTO ===
  if (text.includes('mal_aliento') || text.includes('aliento') || text.includes('halitosis')) {
    categories.push('Halitosis');
    specialties.push('periodoncia', 'odontologia_general');
  }

  // === ESTETICA: blanqueamiento, carillas, manchas ===
  if (text.includes('mancha_color') || text.includes('mancha') || text.includes('color') || text.includes('amarill') ||
      text.includes('blanque') || text.includes('blanco') || text.includes('carill') || text.includes('estetica') ||
      text.includes('sonrisa') || text.includes('diseño') || text.includes('bonit')) {
    categories.push('Estetica dental');
    specialties.push('estetica_dental', 'blanqueamiento');
  }

  // === ORTODONCIA ===
  if (text.includes('chueco') || text.includes('torcid') || text.includes('brackets') || text.includes('ortodoncia') ||
      text.includes('alinead') || text.includes('mordida') || text.includes('apiñ')) {
    categories.push('Ortodoncia');
    specialties.push('ortodoncia');
  }

  // === IMPLANTES ===
  if (text.includes('implante') || text.includes('falta diente') || text.includes('perdi') || text.includes('protesis') || text.includes('sin diente')) {
    categories.push('Implantologia');
    specialties.push('rehabilitacion_oral', 'cirugia_maxilofacial');
  }

  // === HINCHAZON / URGENCIA ===
  if (text.includes('hinchazon') || text.includes('hinch') || text.includes('inflamad') || text.includes('absceso') || text.includes('pus')) {
    categories.push('Posible infeccion/absceso');
    specialties.push('cirugia_maxilofacial', 'endodoncia');
    urgency = 'urgente';
  }

  // === LIMPIEZA ===
  if (text.includes('limpieza') || text.includes('sarro') || text.includes('control') || text.includes('revision') || text.includes('chequeo')) {
    categories.push('Limpieza y prevencion');
    specialties.push('odontologia_general');
  }

  // === BRUXISMO ===
  if (text.includes('bruxismo') || text.includes('apriet') || text.includes('rechina') || text.includes('mandibula')) {
    categories.push('Bruxismo');
    specialties.push('odontologia_general', 'rehabilitacion_oral');
  }

  // === URGENCIA combinada ===
  if (text.includes('hinchazon') && (text.includes('dolor') || text.includes('fiebre'))) {
    urgency = 'urgente';
  }

  if (categories.length === 0) {
    categories.push('Evaluacion general');
    specialties.push('odontologia_general');
  }

  // Determine if X-ray is recommended
  let needsXray = false;
  let xrayType = null;
  let xrayReason = '';

  if (text.includes('dolor_muela') || text.includes('dolor') || text.includes('muela') || text.includes('sensibilidad')) {
    needsXray = true;
    xrayType = 'Radiografia periapical';
    xrayReason = 'Para evaluar la raiz del diente y detectar posibles infecciones o caries profundas.';
  }
  if (text.includes('diente_roto') || text.includes('roto') || text.includes('fractur')) {
    needsXray = true;
    xrayType = 'Radiografia periapical';
    xrayReason = 'Para evaluar si la fractura compromete la raiz o el hueso.';
  }
  if (text.includes('hinchazon') || text.includes('hinch')) {
    needsXray = true;
    xrayType = 'Radiografia panoramica';
    xrayReason = 'Para evaluar la extension de la infeccion y estructuras oseas.';
  }
  if (text.includes('sangrado') || text.includes('encias')) {
    needsXray = true;
    xrayType = 'Radiografia panoramica';
    xrayReason = 'Para evaluar el nivel de hueso y descartar enfermedad periodontal avanzada.';
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
    needsXray,
    xrayType,
    xrayReason,
  };
};

// Generate X-ray order PDF
const generateXrayOrder = async (analysis, patientData) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  const symptoms = patientData.symptoms
    .map(id => DENTAL_SYMPTOMS.find(s => s.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  // Header
  doc.setFillColor(69, 181, 196);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('DentalSpot', 20, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Orden de Radiografia Dental', 20, 23);
  doc.text(`Fecha: ${date}`, 20, 30);

  // Body
  doc.setTextColor(30, 30, 30);
  let y = 50;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDEN DE EXAMEN RADIOGRAFICO', 20, y);
  y += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de examen solicitado:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text(analysis.xrayType || 'Radiografia periapical', 20, y);
  y += 15;

  doc.setFont('helvetica', 'bold');
  doc.text('Motivo clinico:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  const reasonLines = doc.splitTextToSize(analysis.xrayReason || 'Evaluacion diagnostica', 170);
  doc.text(reasonLines, 20, y);
  y += reasonLines.length * 6 + 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Sintomas reportados por el paciente:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  const symptomsText = symptoms || patientData.description || 'No especificados';
  const symptomLines = doc.splitTextToSize(symptomsText, 170);
  doc.text(symptomLines, 20, y);
  y += symptomLines.length * 6 + 10;

  if (patientData.description) {
    doc.setFont('helvetica', 'bold');
    doc.text('Descripcion adicional:', 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(patientData.description, 170);
    doc.text(descLines, 20, y);
    y += descLines.length * 6 + 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Nivel de urgencia:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(analysis.urgency === 'urgente' ? 'URGENTE' : analysis.urgency === 'moderado' ? 'Moderado' : 'Preventivo', 75, y);
  y += 20;

  // Instructions box
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(15, y, 180, 35, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTRUCCIONES PARA EL PACIENTE:', 20, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Lleve esta orden a un centro radiologico dental.', 20, y + 16);
  doc.text('2. Solicite el examen indicado arriba.', 20, y + 22);
  doc.text('3. Suba la imagen a dentalspot.cl o llevela a su cita.', 20, y + 28);
  y += 45;

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Esta orden es orientativa y fue generada por DentalSpot basada en sintomas reportados por el paciente.', 20, y);
  doc.text('No reemplaza la orden de un profesional. El dentista tratante puede solicitar examenes adicionales.', 20, y + 5);
  doc.text('dentalspot.cl — Odontologia inteligente', 20, y + 12);

  doc.save('orden-radiografia-dentalspot.pdf');
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

      {/* X-ray recommendation */}
      {result.needsXray && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <FileImage className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Radiografia recomendada</h3>
              <p className="text-sm text-violet-700 font-medium">{result.xrayType}</p>
              <p className="text-xs text-slate-600 mt-1">{result.xrayReason}</p>
            </div>
          </div>

          <Button
            onClick={() => generateXrayOrder(result, data)}
            variant="outline"
            className="w-full border-violet-300 text-violet-700 hover:bg-violet-100 rounded-xl"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Descargar orden de radiografia (PDF)
          </Button>

          <p className="text-xs text-slate-400 text-center">
            Puedes llevar esta orden a cualquier laboratorio dental o centro radiologico.
          </p>
        </motion.div>
      )}

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
