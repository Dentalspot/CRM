import { useCallback } from 'react';

// Formantes de referencia de vocales del español (F1, F2 en Hz)
export const VOWEL_REFERENCES = {
  a: { label: '/a/', F1: 800, F2: 1200, color: '#ef4444' },
  e: { label: '/e/', F1: 500, F2: 1800, color: '#f97316' },
  i: { label: '/i/', F1: 280, F2: 2800, color: '#eab308' },
  o: { label: '/o/', F1: 500, F2: 800,  color: '#22c55e' },
  u: { label: '/u/', F1: 280, F2: 700,  color: '#3b82f6' },
};

// Suaviza el array de datos con una ventana móvil para reducir ruido
const smooth = (data, windowSize = 5) => {
  const out = new Float32Array(data.length);
  const half = Math.floor(windowSize / 2);
  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < data.length) {
        sum += data[j];
        count++;
      }
    }
    out[i] = sum / count;
  }
  return out;
};

// Devuelve los N picos más altos en el rango [minBin, maxBin]
const findTopPeaks = (data, minBin, maxBin, topN = 1, minAmplitude = 15) => {
  const peaks = [];
  for (let i = minBin + 1; i < maxBin - 1; i++) {
    if (
      data[i] > data[i - 1] &&
      data[i] > data[i + 1] &&
      data[i] > minAmplitude
    ) {
      peaks.push({ bin: i, value: data[i] });
    }
  }
  peaks.sort((a, b) => b.value - a.value);
  return peaks.slice(0, topN);
};

export const useFormantAnalysis = (sampleRate = 44100, fftSize = 2048) => {
  const binToHz = useCallback(
    (bin) => (bin * sampleRate) / fftSize,
    [sampleRate, fftSize]
  );

  const hzToBin = useCallback(
    (hz) => Math.round((hz * fftSize) / sampleRate),
    [sampleRate, fftSize]
  );

  const analyzeFormants = useCallback(
    (frequencyData) => {
      if (!frequencyData || frequencyData.length === 0) return { F1: null, F2: null };

      // Convertir a Float32Array para suavizar
      const floatData = new Float32Array(frequencyData);
      const smoothed = smooth(floatData, 7);

      const binCount = smoothed.length;

      // F1: 200–1000 Hz
      const f1MinBin = hzToBin(200);
      const f1MaxBin = Math.min(hzToBin(1000), binCount - 1);

      // F2: 700–3500 Hz
      const f2MinBin = hzToBin(700);
      const f2MaxBin = Math.min(hzToBin(3500), binCount - 1);

      const f1Peaks = findTopPeaks(smoothed, f1MinBin, f1MaxBin);
      const f2Peaks = findTopPeaks(smoothed, f2MinBin, f2MaxBin);

      // El F2 no debe solapar con F1
      const F1 = f1Peaks.length > 0 ? binToHz(f1Peaks[0].bin) : null;
      const rawF2 = f2Peaks.length > 0 ? binToHz(f2Peaks[0].bin) : null;
      const F2 = rawF2 && rawF2 > (F1 || 0) * 1.3 ? rawF2 : null;

      return { F1, F2 };
    },
    [binToHz, hzToBin]
  );

  const closestVowel = useCallback((F1, F2) => {
    if (F1 == null || F2 == null) return null;

    let closest = null;
    let minDist = Infinity;

    for (const [key, vowel] of Object.entries(VOWEL_REFERENCES)) {
      // Distancia normalizada: F1 rango ~800 Hz, F2 rango ~2800 Hz
      const dF1 = (F1 - vowel.F1) / 800;
      const dF2 = (F2 - vowel.F2) / 2800;
      const dist = Math.sqrt(dF1 * dF1 + dF2 * dF2);

      if (dist < minDist) {
        minDist = dist;
        closest = { key, ...vowel, distance: dist };
      }
    }

    return closest;
  }, []);

  return { analyzeFormants, closestVowel, binToHz, hzToBin };
};
