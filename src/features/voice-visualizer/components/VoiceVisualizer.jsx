import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Activity } from 'lucide-react';
import { useAudioAnalyser } from '../hooks/useAudioAnalyser';

// ─── Medidor de volumen ───────────────────────────────────────────────────────
const VolumeMeter = ({ level }) => {
  const BARS = 24;
  const active = Math.round(Math.min(level, 1) * BARS);

  return (
    <div className="flex items-end gap-px h-6">
      {Array.from({ length: BARS }).map((_, i) => {
        const isOn = i < active;
        const colorClass = isOn
          ? i < BARS * 0.55
            ? 'bg-emerald-500'
            : i < BARS * 0.8
            ? 'bg-yellow-400'
            : 'bg-red-500'
          : 'bg-slate-700';
        const heightClass = isOn
          ? i < BARS * 0.55
            ? 'h-full'
            : i < BARS * 0.8
            ? 'h-4'
            : 'h-3'
          : 'h-2';
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-all duration-75 ${colorClass} ${heightClass}`}
          />
        );
      })}
    </div>
  );
};

// ─── Dibuja la onda de tiempo ─────────────────────────────────────────────────
const drawWaveform = (ctx, canvas, waveformData) => {
  const { width: W, height: H } = canvas;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, W, H);

  // Línea central sutil
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H / 2);
  ctx.lineTo(W, H / 2);
  ctx.stroke();

  if (!waveformData.length) return;

  const gradient = ctx.createLinearGradient(0, 0, W, 0);
  gradient.addColorStop(0, '#6366f1');
  gradient.addColorStop(0.45, '#8b5cf6');
  gradient.addColorStop(0.85, '#06b6d4');
  gradient.addColorStop(1, '#22d3ee');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  const sliceW = W / (waveformData.length - 1);
  for (let i = 0; i < waveformData.length; i++) {
    const x = i * sliceW;
    const y = H / 2 + waveformData[i] * H * 0.45;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Reflejo inferior tenue
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < waveformData.length; i++) {
    const x = i * sliceW;
    const y = H / 2 + waveformData[i] * H * 0.45;
    const yMirror = H - (y - H / 2) - H / 2 + H / 2;
    i === 0 ? ctx.moveTo(x, yMirror) : ctx.lineTo(x, yMirror);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
};

// ─── Dibuja el espectro de frecuencias ───────────────────────────────────────
const drawSpectrum = (ctx, canvas, freqData) => {
  const { width: W, height: H } = canvas;

  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, W, H);

  if (!freqData.length) return;

  const BARS = Math.min(freqData.length, 100);
  const barW = W / BARS;

  for (let i = 0; i < BARS; i++) {
    const value = freqData[Math.floor((i / BARS) * freqData.length)] / 255;
    const barH = value * H;
    const hue = 220 + (i / BARS) * 100; // azul → violeta → magenta

    // Barra principal
    const gradient = ctx.createLinearGradient(0, H - barH, 0, H);
    gradient.addColorStop(0, `hsla(${hue}, 80%, 70%, 1)`);
    gradient.addColorStop(1, `hsla(${hue}, 60%, 40%, 0.4)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(i * barW + 1, H - barH, barW - 2, barH);
  }
};

// ─── Componente principal ─────────────────────────────────────────────────────
const VoiceVisualizer = () => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [volume, setVolume] = useState(0);
  const [mode, setMode] = useState('waveform'); // 'waveform' | 'spectrum'

  const { isActive, error, start, stop, getWaveform, getFrequencyData, getVolume } =
    useAudioAnalyser();

  // Syncronizar dimensiones CSS → canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sync = () => {
      if (canvas.offsetWidth > 0) canvas.width = canvas.offsetWidth;
      if (canvas.offsetHeight > 0) canvas.height = canvas.offsetHeight;
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const vol = getVolume();
    setVolume(vol);

    if (mode === 'waveform') {
      drawWaveform(ctx, canvas, getWaveform());
    } else {
      drawSpectrum(ctx, canvas, getFrequencyData());
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [mode, getWaveform, getFrequencyData, getVolume]);

  useEffect(() => {
    if (isActive) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      // Limpiar canvas al detener
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      setVolume(0);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isActive, animate]);

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-white flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-violet-400" />
            Visualizador en Tiempo Real
          </CardTitle>

          <div className="flex gap-1.5">
            <Button
              variant={mode === 'waveform' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('waveform')}
              className={`text-xs h-7 ${
                mode === 'waveform' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-400'
              }`}
            >
              Onda
            </Button>
            <Button
              variant={mode === 'spectrum' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setMode('spectrum')}
              className={`text-xs h-7 ${
                mode === 'spectrum' ? 'bg-violet-600/30 text-violet-300' : 'text-slate-400'
              }`}
            >
              Espectro
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Canvas de visualización */}
        <div
          className="relative rounded-xl overflow-hidden bg-[#020617]"
          style={{ height: '180px' }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
          {!isActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <Mic className="w-8 h-8 text-slate-700" />
              <p className="text-slate-600 text-sm">Presiona "Iniciar" para comenzar</p>
            </div>
          )}
        </div>

        {/* Medidor de volumen */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Intensidad de voz</p>
            {isActive && (
              <Badge
                variant="outline"
                className="border-emerald-700 text-emerald-400 text-xs h-5 px-2"
              >
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse inline-block" />
                En vivo
              </Badge>
            )}
          </div>
          <VolumeMeter level={Math.min(volume * 12, 1)} />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-3">
          {!isActive ? (
            <Button
              onClick={start}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Mic className="w-4 h-4 mr-2" />
              Iniciar micrófono
            </Button>
          ) : (
            <Button
              onClick={stop}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-red-400 hover:border-red-800"
            >
              <MicOff className="w-4 h-4 mr-2" />
              Detener
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceVisualizer;
