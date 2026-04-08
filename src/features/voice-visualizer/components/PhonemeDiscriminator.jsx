import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Shuffle, CheckCircle, AlertCircle, Target, Zap } from 'lucide-react';
import { useAudioAnalyser } from '../hooks/useAudioAnalyser';
import { useFormantAnalysis, VOWEL_REFERENCES } from '../hooks/useFormantAnalysis';
import VowelChart from './VowelChart';

const PHONEMES = Object.keys(VOWEL_REFERENCES);

// Umbral de distancia para feedback
const getFeedback = (distance) => {
  if (distance < 0.18) {
    return {
      label: '¡Excelente!',
      sublabel: 'Fonema correcto',
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-900/60',
      Icon: CheckCircle,
    };
  }
  if (distance < 0.35) {
    return {
      label: 'Muy cerca',
      sublabel: 'Ajusta un poco más',
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/40 border-yellow-900/60',
      Icon: Zap,
    };
  }
  return {
    label: 'Sigue intentando',
    sublabel: 'Escucha y repite el fonema',
    color: 'text-orange-400',
    bg: 'bg-orange-950/40 border-orange-900/60',
    Icon: AlertCircle,
  };
};

const PRACTICE_INTERVAL_MS = 5000;

const PhonemeDiscriminator = () => {
  const [targetIndex, setTargetIndex] = useState(0);
  const [currentF1, setCurrentF1] = useState(null);
  const [currentF2, setCurrentF2] = useState(null);
  const [closestResult, setClosestResult] = useState(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceCountdown, setPracticeCountdown] = useState(PRACTICE_INTERVAL_MS / 1000);

  const animFrameRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const practiceTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const { isActive, sampleRate, fftSize, error, start, stop, getFrequencyData, getVolume } =
    useAudioAnalyser();

  const { analyzeFormants, closestVowel } = useFormantAnalysis(sampleRate, fftSize);

  const targetKey = PHONEMES[targetIndex];
  const targetVowel = VOWEL_REFERENCES[targetKey];

  const nextPhoneme = useCallback(() => {
    setTargetIndex((i) => (i + 1) % PHONEMES.length);
    setClosestResult(null);
  }, []);

  const randomPhoneme = useCallback(() => {
    setTargetIndex((prev) => {
      let next;
      do {
        next = Math.floor(Math.random() * PHONEMES.length);
      } while (next === prev && PHONEMES.length > 1);
      return next;
    });
    setClosestResult(null);
    setPracticeCountdown(PRACTICE_INTERVAL_MS / 1000);
  }, []);

  // Bucle de análisis de formantes (throttled a ~10 fps para no sobrecargar React)
  const analyze = useCallback(() => {
    const freqData = getFrequencyData();
    const vol = getVolume();

    if (vol > 0.008) {
      const now = performance.now();
      if (now - lastUpdateRef.current > 100) {
        lastUpdateRef.current = now;
        const { F1, F2 } = analyzeFormants(freqData);
        if (F1 != null && F2 != null) {
          setCurrentF1(F1);
          setCurrentF2(F2);
          const closest = closestVowel(F1, F2);
          setClosestResult(closest);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(analyze);
  }, [getFrequencyData, getVolume, analyzeFormants, closestVowel]);

  useEffect(() => {
    if (isActive) {
      animFrameRef.current = requestAnimationFrame(analyze);
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setCurrentF1(null);
      setCurrentF2(null);
      setClosestResult(null);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, analyze]);

  // Modo práctica: cambia de fonema automáticamente
  useEffect(() => {
    if (practiceMode && isActive) {
      setPracticeCountdown(PRACTICE_INTERVAL_MS / 1000);

      practiceTimerRef.current = setInterval(() => {
        randomPhoneme();
      }, PRACTICE_INTERVAL_MS);

      countdownRef.current = setInterval(() => {
        setPracticeCountdown((c) => (c <= 1 ? PRACTICE_INTERVAL_MS / 1000 : c - 1));
      }, 1000);
    } else {
      clearInterval(practiceTimerRef.current);
      clearInterval(countdownRef.current);
    }

    return () => {
      clearInterval(practiceTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [practiceMode, isActive, randomPhoneme]);

  const feedback = closestResult ? getFeedback(closestResult.distance) : null;

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-cyan-400" />
            Discriminador de Fonemas
          </CardTitle>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPracticeMode((p) => !p)}
            className={`text-xs h-7 ${
              practiceMode
                ? 'bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shuffle className="w-3 h-3 mr-1" />
            Modo práctica
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fonema objetivo */}
        <div className="flex items-stretch gap-3">
          <button
            className="flex-1 rounded-xl py-5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: targetVowel.color + '18',
              border: `2px solid ${targetVowel.color}55`,
            }}
            onClick={nextPhoneme}
            title="Toca para cambiar al siguiente fonema"
          >
            <span
              className="text-6xl font-bold leading-none"
              style={{ color: targetVowel.color }}
            >
              {targetVowel.label}
            </span>
            {practiceMode && isActive && (
              <span className="text-xs mt-1" style={{ color: targetVowel.color + 'aa' }}>
                Cambia en {practiceCountdown}s
              </span>
            )}
          </button>

          {/* Controles compactos */}
          <div className="flex flex-col gap-2 justify-center">
            {!isActive ? (
              <Button
                onClick={start}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white w-10 h-10 p-0"
                title="Iniciar micrófono"
              >
                <Mic className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={stop}
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-400 hover:border-red-800 hover:text-red-400 w-10 h-10 p-0"
                title="Detener micrófono"
              >
                <MicOff className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={randomPhoneme}
              size="sm"
              variant="ghost"
              className="border border-slate-700 text-slate-400 hover:text-slate-200 w-10 h-10 p-0"
              title="Fonema aleatorio"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-slate-500 text-xs text-center">
          {isActive
            ? 'Pronuncia el fonema mostrado en voz alta'
            : 'Inicia el micrófono y pronuncia el fonema objetivo'}
          {!practiceMode && !isActive && ' · Toca el fonema para cambiar'}
        </p>

        {/* Feedback */}
        {feedback && closestResult && (
          <div
            className={`rounded-lg px-4 py-3 flex items-center gap-3 border ${feedback.bg}`}
          >
            <feedback.Icon className={`w-5 h-5 flex-shrink-0 ${feedback.color}`} />
            <div className="min-w-0">
              <p className={`font-semibold text-sm ${feedback.color}`}>{feedback.label}</p>
              <p className="text-slate-400 text-xs">
                {feedback.sublabel}
                {' · '}
                Detectado:{' '}
                <span
                  className="font-medium"
                  style={{
                    color: VOWEL_REFERENCES[closestResult.key]?.color,
                  }}
                >
                  {closestResult.label}
                </span>
                {closestResult.key === targetKey && (
                  <span className="text-emerald-400 ml-1">✓</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Valores de formantes */}
        {currentF1 != null && currentF2 != null && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800/70 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Formante 1</p>
              <p className="text-base font-bold text-violet-400">{Math.round(currentF1)} Hz</p>
              <p className="text-xs text-slate-600">Obj: {targetVowel.F1} Hz</p>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-2.5 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Formante 2</p>
              <p className="text-base font-bold text-cyan-400">{Math.round(currentF2)} Hz</p>
              <p className="text-xs text-slate-600">Obj: {targetVowel.F2} Hz</p>
            </div>
          </div>
        )}

        {/* Gráfico de vocales */}
        <div className="flex justify-center">
          <VowelChart currentF1={currentF1} currentF2={currentF2} targetVowel={targetKey} />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Estado activo */}
        {isActive && (
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
            <span className="text-emerald-500/70 text-xs">Analizando formantes en tiempo real</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhonemeDiscriminator;
