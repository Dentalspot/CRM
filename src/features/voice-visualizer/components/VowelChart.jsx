import React, { useRef, useEffect } from 'react';
import { VOWEL_REFERENCES } from '../hooks/useFormantAnalysis';

// Convenciones fonéticas: eje X = F2 (más alto a la izquierda), eje Y = F1 (más alto abajo)
const PAD = 44;
const CANVAS_SIZE = 420;

const F1_MIN = 200;
const F1_MAX = 1000;
const F2_MIN = 500;
const F2_MAX = 3300;

const mapX = (f2) =>
  PAD + (1 - (f2 - F2_MIN) / (F2_MAX - F2_MIN)) * (CANVAS_SIZE - PAD * 2);

const mapY = (f1) =>
  PAD + ((f1 - F1_MIN) / (F1_MAX - F1_MIN)) * (CANVAS_SIZE - PAD * 2);

const drawChart = (ctx, currentF1, currentF2, targetVowel) => {
  const W = CANVAS_SIZE;
  const H = CANVAS_SIZE;

  // Fondo
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, W, H);

  // Borde del área
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, PAD, W - PAD * 2, H - PAD * 2);

  // Grid
  const GRID = 5;
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = '#1e293b';
  for (let i = 1; i < GRID; i++) {
    const x = PAD + (i / GRID) * (W - PAD * 2);
    const y = PAD + (i / GRID) * (H - PAD * 2);
    ctx.beginPath();
    ctx.moveTo(x, PAD);
    ctx.lineTo(x, H - PAD);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(W - PAD, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Etiquetas de ejes
  ctx.fillStyle = '#475569';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';

  const f2Steps = [3000, 2500, 2000, 1500, 1000];
  for (const f2 of f2Steps) {
    const x = mapX(f2);
    ctx.fillText(f2, x, H - PAD + 14);
  }

  ctx.textAlign = 'right';
  const f1Steps = [300, 500, 700, 900];
  for (const f1 of f1Steps) {
    const y = mapY(f1);
    ctx.fillText(f1, PAD - 6, y + 4);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillText('F2 (Hz) →', W / 2, H - 4);

  ctx.save();
  ctx.translate(10, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('F1 (Hz) ↓', 0, 0);
  ctx.restore();

  // Zona de vocal objetivo (halo)
  if (targetVowel && VOWEL_REFERENCES[targetVowel]) {
    const tv = VOWEL_REFERENCES[targetVowel];
    const tx = mapX(tv.F2);
    const ty = mapY(tv.F1);

    const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 60);
    grad.addColorStop(0, tv.color + '35');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tx, ty, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = tv.color + '70';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(tx, ty, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Vocales de referencia
  Object.entries(VOWEL_REFERENCES).forEach(([key, vowel]) => {
    const x = mapX(vowel.F2);
    const y = mapY(vowel.F1);
    const isTarget = targetVowel === key;
    const radius = isTarget ? 18 : 14;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isTarget ? vowel.color + 'cc' : vowel.color + '55';
    ctx.fill();

    if (isTarget) {
      ctx.strokeStyle = vowel.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.fillStyle = isTarget ? '#fff' : '#e2e8f0';
    ctx.font = `${isTarget ? 'bold ' : ''}${isTarget ? 14 : 12}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(vowel.label, x, y);
  });

  // Punto de posición actual
  if (currentF1 != null && currentF2 != null) {
    const cx = mapX(Math.max(F2_MIN, Math.min(F2_MAX, currentF2)));
    const cy = mapY(Math.max(F1_MIN, Math.min(F1_MAX, currentF1)));

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, PAD);
    ctx.lineTo(cx, H - PAD);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD, cy);
    ctx.lineTo(W - PAD, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
};

const VowelChart = ({ currentF1, currentF2, targetVowel }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawChart(ctx, currentF1, currentF2, targetVowel);
  }, [currentF1, currentF2, targetVowel]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      className="w-full h-auto rounded-xl"
      style={{ maxWidth: `${CANVAS_SIZE}px` }}
    />
  );
};

export default VowelChart;
