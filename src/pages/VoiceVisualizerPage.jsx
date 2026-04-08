import React from 'react';
import { Mic, Info } from 'lucide-react';
import VoiceVisualizer from '@/features/voice-visualizer/components/VoiceVisualizer';
import PhonemeDiscriminator from '@/features/voice-visualizer/components/PhonemeDiscriminator';

const VoiceVisualizerPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">Visualizador de Voz</h1>
              <p className="text-slate-400 text-sm">
                Análisis acústico y discriminación de fonemas en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Módulos en dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <VoiceVisualizer />
          <PhonemeDiscriminator />
        </div>

        {/* Panel informativo */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <p className="text-sm font-medium">Acerca de esta herramienta</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-500 leading-relaxed">
            <div>
              <p className="text-slate-400 font-medium mb-1">Visualizador en tiempo real</p>
              <p>
                Muestra la onda de presión sonora (dominio del tiempo) o el espectro de frecuencias
                (FFT) captado por el micrófono. Útil para observar la intensidad, el ritmo y la
                continuidad de la voz del paciente.
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Discriminador de fonemas</p>
              <p>
                Estima los formantes F1 y F2 de la voz mediante análisis de picos espectrales y los
                compara con valores de referencia de las vocales del español. El gráfico de vocales
                muestra la posición acústica en tiempo real.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Nota técnica: el análisis formántico es una aproximación basada en FFT. La precisión
            puede variar según el micrófono, el ambiente acústico y las características individuales
            de la voz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceVisualizerPage;
