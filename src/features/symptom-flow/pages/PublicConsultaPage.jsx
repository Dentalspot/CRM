import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import SymptomStep from '../components/SymptomStep';
import AIAnalysisStep from '../components/AIAnalysisStep';
import DentistMatchStep from '../components/DentistMatchStep';

const STEPS = ['sintomas', 'analisis', 'dentistas'];

const PublicConsultaPage = () => {
  const [step, setStep] = useState('sintomas');
  const [flowData, setFlowData] = useState({});

  const currentIndex = STEPS.indexOf(step);

  return (
    <>
      <Helmet>
        <title>Consulta dental con IA | DentalSpot</title>
        <meta name="description" content="Describe tu sintoma dental y recibe orientacion con inteligencia artificial. Encuentra el dentista ideal cerca de ti." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo-dentalspot.svg" alt="DentalSpot" className="h-8 w-8" />
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Dental<span className="font-light">Spot</span>
              </span>
            </a>
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s} className={`h-1.5 w-8 sm:w-12 rounded-full transition-all ${
                  i <= currentIndex ? 'bg-primary' : 'bg-slate-200'
                }`} />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
          {step === 'sintomas' && (
            <SymptomStep
              onNext={(data) => {
                setFlowData(data);
                setStep('analisis');
              }}
            />
          )}

          {step === 'analisis' && (
            <AIAnalysisStep
              data={flowData}
              onNext={(data) => {
                setFlowData(data);
                setStep('dentistas');
              }}
              onBack={() => setStep('sintomas')}
            />
          )}

          {step === 'dentistas' && (
            <DentistMatchStep
              data={flowData}
              onBack={() => setStep('analisis')}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PublicConsultaPage;
