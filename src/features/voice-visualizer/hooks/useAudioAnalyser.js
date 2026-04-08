import { useState, useRef, useCallback, useEffect } from 'react';

const FFT_SIZE = 2048;

export const useAudioAnalyser = () => {
  const [isActive, setIsActive] = useState(false);
  const [sampleRate, setSampleRate] = useState(44100);
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const waveformDataRef = useRef(new Float32Array(FFT_SIZE));
  const frequencyDataRef = useRef(new Uint8Array(FFT_SIZE / 2));

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      setSampleRate(audioContext.sampleRate);

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      waveformDataRef.current = new Float32Array(analyser.frequencyBinCount);
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      setIsActive(true);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.'
          : err.name === 'NotFoundError'
          ? 'No se encontró un micrófono conectado.'
          : err.message || 'No se pudo acceder al micrófono.';
      setError(msg);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    sourceRef.current = null;
    setIsActive(false);
  }, []);

  const getWaveform = useCallback(() => {
    if (!analyserRef.current) return waveformDataRef.current;
    analyserRef.current.getFloatTimeDomainData(waveformDataRef.current);
    return waveformDataRef.current;
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current) return frequencyDataRef.current;
    analyserRef.current.getByteFrequencyData(frequencyDataRef.current);
    return frequencyDataRef.current;
  }, []);

  const getVolume = useCallback(() => {
    const data = waveformDataRef.current;
    if (!data.length) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    sampleRate,
    fftSize: FFT_SIZE,
    error,
    start,
    stop,
    getWaveform,
    getFrequencyData,
    getVolume,
  };
};
