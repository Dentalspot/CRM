/**
 * TEA Report Generator
 *
 * Generates print-optimized HTML reports for:
 * - ADI-R individual report
 * - ADOS-2 individual report
 * - Perfil Sensorial individual report
 * - Consolidated TEA diagnostic report
 *
 * Uses window.open + window.print for PDF export.
 */

import { getScoreDescription } from '@/features/ados2/constants/ados2ScoreDescriptions';
import { supabase } from '@/lib/supabaseClient';
import { escapeHTML } from '@/lib/utils/sanitize';

const BRAND = {
  primary: '#ff74c3',
  secondary: '#00bcb5',
  dark: '#1a1a2e',
};

// ─── Shared HTML wrapper ───
function calcAge(birthdate) {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatRut(rut) {
  if (!rut) return null;
  return rut;
}

function wrapReport(title, patientName, therapistName, date, bodyContent, patientData = {}) {
  const age = patientData.birthdate ? calcAge(patientData.birthdate) : null;
  const patientInfoHtml = `
    <section class="section">
      <h3 class="section-title">Datos del Paciente</h3>
      <table>
        <tr><td><strong>Nombre:</strong> ${escapeHTML(patientName || 'No especificado')}</td><td><strong>RUT:</strong> ${escapeHTML(formatRut(patientData.rut) || 'No registrado')}</td></tr>
        <tr><td><strong>Fecha de Nacimiento:</strong> ${escapeHTML(patientData.birthdate || 'No registrada')}</td><td><strong>Edad:</strong> ${age !== null ? `${age} años` : 'No calculada'}</td></tr>
      </table>
    </section>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${escapeHTML(title)} - ${escapeHTML(patientName || 'Paciente')}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; color: #1e293b; font-size: 11px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 15mm 18mm; }
  @media print { .no-print { display: none !important; } section { page-break-inside: avoid; } }
  .report { max-width: 720px; margin: 60px auto 20px; padding: 20px; }
  @media print { .report { margin-top: 0; } }

  .header { border-bottom: 3px solid ${BRAND.primary}; padding-bottom: 16px; margin-bottom: 20px; }
  .header h1 { font-size: 22px; font-weight: 800; color: ${BRAND.dark}; }
  .header h2 { font-size: 14px; font-weight: 600; color: ${BRAND.primary}; margin-top: 2px; }
  .header .meta { display: flex; gap: 16px; margin-top: 8px; font-size: 10px; color: #64748b; }

  .section { margin-bottom: 18px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND.primary}; border-bottom: 2px solid ${BRAND.primary}20; padding-bottom: 4px; margin-bottom: 10px; }

  .result-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
  .result-positive { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .result-negative { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .result-moderate { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .result-neutral { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 8px 0; }
  th, td { padding: 6px 8px; border: 1px solid #e2e8f0; text-align: left; }
  th { background: #f8fafc; font-weight: 600; color: #475569; }
  td.score { text-align: center; font-weight: 600; }
  td.pass { background: #dcfce7; color: #166534; }
  td.fail { background: #fee2e2; color: #991b1b; }

  .obs { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 10px; color: #334155; white-space: pre-wrap; }
  .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }

  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
  .print-bar button { padding: 8px 24px; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-print { background: ${BRAND.primary}; color: white; }
  .btn-close { background: #334155; color: white; }
  @media print { .print-bar { display: none; } }

  .concordance { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0; }
  .concordance-card { text-align: center; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fafbfc; }
  .concordance-card h4 { font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 6px; }
</style>
</head>
<body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){window.print();})}else{setTimeout(function(){window.print()},500)}">Descargar PDF</button>
  <button class="btn-close" onclick="window.close()">Cerrar</button>
</div>
<div class="report">
  <header class="header">
    <h1>${escapeHTML(title)}</h1>
    <h2>${escapeHTML(patientName)}</h2>
    <div class="meta">
      <span>Profesional: ${escapeHTML(therapistName)}</span>
      <span>Fecha: ${escapeHTML(date)}</span>
      <span>Generado: ${new Date().toLocaleDateString('es-CL')}</span>
    </div>
  </header>
  ${patientInfoHtml}
  ${bodyContent}
  <footer class="footer">
    Informe generado automáticamente por DentalSpot.cl — Este documento es orientativo y no reemplaza el juicio clínico profesional.
  </footer>
</div>
</body>
</html>`;
}

function openReport(html) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    // Don't auto-print — let user click "Descargar PDF" button in the report
    // This prevents Safari from printing a blank page
  }
}

// ═══════════════════════════════════════════
// ADI-R REPORT
// ═══════════════════════════════════════════
export function generateAdirReport({ evaluation, patientName, therapistName, patientData = {} }) {
  const date = evaluation.fecha_evaluacion || '';
  const classCfg = {
    autism: { label: 'Cumple criterios para Autismo', css: 'result-positive' },
    non_spectrum: { label: 'No cumple criterios', css: 'result-negative' },
    inconclusive: { label: 'No concluyente', css: 'result-moderate' },
  };
  const result = classCfg[evaluation.clasificacion] || classCfg.inconclusive;

  const domains = [
    { key: 'A', label: 'Interacción Social Recíproca', score: evaluation.total_a, cutoff: evaluation.verbal_status === 'verbal' ? 10 : 10, meets: evaluation.cumple_criterio_a },
    { key: 'B', label: evaluation.verbal_status === 'verbal' ? 'Comunicación (Verbal)' : 'Comunicación (No Verbal)', score: evaluation.total_b, cutoff: evaluation.verbal_status === 'verbal' ? 8 : 7, meets: evaluation.cumple_criterio_b },
    { key: 'C', label: 'Patrones Restringidos y Repetitivos', score: evaluation.total_c, cutoff: 3, meets: evaluation.cumple_criterio_c },
    { key: 'D', label: 'Alteraciones del Desarrollo', score: evaluation.total_d, cutoff: 1, meets: evaluation.cumple_criterio_d },
  ];

  const body = `
    <section class="section">
      <h3 class="section-title">Información de la Evaluación</h3>
      <table>
        <tr><td><strong>Informante:</strong> ${evaluation.informant_name || 'No especificado'}</td><td><strong>Relación:</strong> ${evaluation.informant_relationship || '—'}</td></tr>
        <tr><td><strong>Estatus verbal:</strong> ${evaluation.verbal_status === 'verbal' ? 'Verbal' : 'No verbal'}</td><td><strong>Examinador:</strong> ${escapeHTML(evaluation.examinador || '—')}</td></tr>
      </table>
    </section>

    <section class="section" style="text-align:center; padding: 16px 0;">
      <h3 class="section-title">Clasificación Diagnóstica</h3>
      <span class="result-badge ${result.css}">${result.label}</span>
    </section>

    <section class="section">
      <h3 class="section-title">Puntajes por Dominio</h3>
      <table>
        <thead><tr><th>Dominio</th><th style="text-align:center">Puntaje</th><th style="text-align:center">Corte</th><th style="text-align:center">¿Cumple?</th></tr></thead>
        <tbody>
          ${domains.map(d => `
            <tr>
              <td>${d.label}</td>
              <td class="score">${d.score ?? '—'}</td>
              <td class="score">${d.cutoff}</td>
              <td class="score ${d.meets ? 'fail' : 'pass'}">${d.meets ? 'Sí' : 'No'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="font-size:9px; color:#94a3b8; margin-top:4px;">Se requiere cumplir los 4 dominios para clasificación de Autismo según ADI-R.</p>
    </section>

    ${evaluation.observaciones ? `
    <section class="section">
      <h3 class="section-title">Observaciones Clínicas</h3>
      <div class="obs">${evaluation.observaciones}</div>
    </section>` : ''}
  `;

  openReport(wrapReport('Informe ADI-R', patientName, therapistName, date, body, patientData));
}

// ═══════════════════════════════════════════
// ADOS-2 REPORT (Formato clínico profesional)
// ═══════════════════════════════════════════
export function generateAdos2Report({ evaluation, patientName, therapistName, patientData = {}, therapistData = {} }) {
  const date = evaluation.fecha_evaluacion || '';
  const responses = evaluation.responses || [];

  // ── Therapist info ──
  const tName = therapistData.full_name || therapistName || evaluation.examinador || '';
  const tTitle = therapistData.professional_title || 'Fonoaudiólogo/a';
  const tHeadline = therapistData.headline || '';
  const tRegistroSS = therapistData.registro_supersalud || '';
  const tRegistroSE = therapistData.registro_secreduc || '';
  const tPhone = therapistData.phone || '';
  const tAddress = therapistData.address || '';
  const tLogoUrl = therapistData.avatar_url || '';

  // ── Patient info ──
  const age = patientData.birthdate ? calcAge(patientData.birthdate) : null;
  const pBirthdate = patientData.birthdate || '';
  const pRut = patientData.rut || '';

  // ── Rango ──
  const rangoCfg = {
    autismo: { label: 'Autismo', css: 'result-positive' },
    espectro_autista: { label: 'Espectro Autista', css: 'result-moderate' },
    no_tea: { label: 'No TEA', css: 'result-negative' },
    moderada_severa: { label: 'Preocupación Moderada-Severa', css: 'result-positive' },
    leve_moderada: { label: 'Preocupación Leve-Moderada', css: 'result-moderate' },
    poco_ninguna: { label: 'Poco/Ninguna Preocupación', css: 'result-negative' },
  };
  const result = rangoCfg[evaluation.rango_preocupacion] || { label: 'No calculado', css: 'result-neutral' };

  // ── Module label ──
  const moduleLabels = {
    T: 'Módulo T: Niños pre-verbales.',
    '1': 'Módulo 1: Pre-verbal o palabras sueltas a partir de 31 meses.',
    '2': 'Módulo 2: Habla con frases.',
    '3': 'Módulo 3: Niños menores de 16 años con lenguaje oral.',
    '4': 'Módulo 4: Adolescentes y adultos con fluidez verbal.',
  };
  const moduleDesc = moduleLabels[evaluation.module] || `Módulo ${evaluation.module}`;

  const isModule4 = evaluation.module === '4';

  // ── Build item rows grouped by domain ──
  const buildDomainRows = (domain, domainLabel) => {
    const items = responses.filter(r => r.domain === domain);
    if (items.length === 0) return '';
    const rows = items.map(r =>
      `<tr><td style="padding-left:20px;">${r.item_name}</td><td class="score" style="width:60px;">(${r.item_code})</td><td class="score" style="width:80px;">${r.algorithm_score ?? r.raw_score ?? '—'}</td></tr>`
    ).join('');
    const total = items.reduce((sum, r) => sum + (r.algorithm_score ?? 0), 0);
    return `
      <tr style="background:#f1f5f9;"><td colspan="2"><strong>${domainLabel}</strong></td><td></td></tr>
      ${rows}
      <tr style="background:#f8fafc; border-top:2px solid #cbd5e1;"><td colspan="2" style="text-align:right;"><strong>TOTAL ${domain}</strong></td><td class="score"><strong>${total}</strong></td></tr>
    `;
  };

  let itemsTableBody = '';
  if (isModule4) {
    itemsTableBody = buildDomainRows('COM', 'Comunicación') + buildDomainRows('AS', 'Interacción Social Recíproca') + buildDomainRows('CRR', 'Comportamiento Restringido y Repetitivo (CRR)');
  } else {
    itemsTableBody = buildDomainRows('AS', 'Afectación Social (AS)') + buildDomainRows('CRR', 'Comportamiento Restringido y Repetitivo (CRR)');
  }

  // ── Build automatic score descriptions per item (ALL items, grouped by section) ──
  const mod = evaluation.module;
  const buildScoreDescriptionsHtml = () => {
    if (responses.length === 0) return '';

    const sectionLabels = {
      'A': 'Lenguaje y Comunicación',
      'B': 'Interacción Social Recíproca',
      'C': evaluation.module === 'T' ? 'Juego' : 'Imaginación',
      'D': 'Comportamientos Estereotipados e Intereses Restringidos',
      'E': 'Otros Comportamientos',
    };
    const sectionOrder = ['A', 'B', 'C', 'D', 'E'];

    // Group responses by section letter (item_code prefix)
    const grouped = {};
    for (const r of responses) {
      const prefix = (r.item_code || '').charAt(0).toUpperCase();
      if (!grouped[prefix]) grouped[prefix] = [];
      grouped[prefix].push(r);
    }

    let html = '';
    for (const section of sectionOrder) {
      const items = grouped[section];
      if (!items || items.length === 0) continue;
      // Sort by item_code
      items.sort((a, b) => {
        const codeA = a.item_code || '';
        const codeB = b.item_code || '';
        return codeA.localeCompare(codeB, undefined, { numeric: true });
      });
      html += `<h4 style="font-size:11px; font-weight:700; color:${BRAND.primary}; margin:14px 0 6px; border-bottom:1px solid ${BRAND.primary}30; padding-bottom:3px;">${sectionLabels[section] || section}</h4>`;
      for (const r of items) {
        const desc = getScoreDescription(mod, r.item_code, r.raw_score);
        const descText = desc?.description || '';
        html += `<div style="margin-bottom:10px;">
          <div style="font-weight:600; font-size:10px; color:#334155;">${r.item_name || desc?.name || r.item_code} <span style="color:#94a3b8;">(${r.item_code})</span> — Puntaje: <span style="color:${BRAND.primary}; font-weight:700;">${r.raw_score}</span></div>
          ${descText ? `<div style="font-size:10px; color:#475569; margin-top:2px; padding-left:12px; border-left:2px solid ${BRAND.primary}30;">${descText}</div>` : ''}
        </div>`;
      }
    }
    return html;
  };
  const scoreDescriptionsHtml = buildScoreDescriptionsHtml();

  // ── Build synthesis section ──
  const buildSynthesisHtml = () => {
    const firstName = (patientName || '').split(' ')[0];
    const rango = evaluation.rango_preocupacion;
    const totalGlobal = evaluation.total_global ?? 0;

    let compatibilityText = '';
    let levelText = '';

    if (['autismo', 'moderada_severa'].includes(rango)) {
      compatibilityText = `${firstName} presenta características y conductas compatibles según la clasificación del test, sugerentes de Trastorno del Espectro Autista (TEA).`;
      levelText = rango === 'moderada_severa' ? 'El nivel de preocupación es de moderado a severo.' : 'La clasificación corresponde a Autismo según los puntos de corte del instrumento.';
    } else if (['espectro_autista', 'leve_moderada'].includes(rango)) {
      compatibilityText = `${firstName} presenta características y conductas compatibles según la clasificación del test, sugerentes de Trastorno del Espectro Autista (TEA), con un nivel de preocupación leve a moderado.`;
      levelText = '';
    } else {
      compatibilityText = `${firstName} presenta características y conductas compatibles según la clasificación del test, no sugerentes de Trastorno del Espectro Autista (TEA) en esta evaluación.`;
      levelText = '';
    }

    // ── Wechsler recommendation when NOT suggestive of TEA ──
    const isNotTEA = !['autismo', 'moderada_severa', 'espectro_autista', 'leve_moderada'].includes(rango);
    let wechslerBlock = '';
    if (isNotTEA) {
      // Determine Wechsler scale by age
      let wechslerName = '';
      let wechslerFull = '';
      let wechslerAge = '';
      if (age !== null && age < 6) {
        wechslerName = 'WPPSI';
        wechslerFull = 'Wechsler Preschool and Primary Scale of Intelligence';
        wechslerAge = '2 años 6 meses a 7 años 7 meses';
      } else if (age !== null && age >= 6 && age < 16) {
        wechslerName = 'WISC';
        wechslerFull = 'Wechsler Intelligence Scale for Children';
        wechslerAge = '6 a 16 años';
      } else {
        wechslerName = 'WAIS';
        wechslerFull = 'Wechsler Adult Intelligence Scale';
        wechslerAge = '16 años en adelante';
      }

      wechslerBlock = `
        <div style="margin-top:12px; padding:12px 14px; background:linear-gradient(135deg, #eff6ff, #f0fdf4); border-left:4px solid ${BRAND.secondary}; border-radius:6px;">
          <p style="font-weight:700; color:${BRAND.dark}; font-size:11px; margin-bottom:6px;">
            🧠 Recomendación de Evaluación Complementaria
          </p>
          <p style="margin-bottom:6px;">
            Si bien los resultados de esta evaluación no son sugerentes de TEA, es importante considerar que ${firstName} fue derivado/a a esta evaluación por dificultades observadas en su funcionamiento cotidiano. Con el fin de comprender integralmente su perfil cognitivo y diseñar un plan de intervención personalizado que potencie sus capacidades, se recomienda realizar una evaluación con psicólogo/a mediante la escala <strong>${wechslerName}</strong> (<em>${wechslerFull}</em>, ${wechslerAge}).
          </p>
          <p style="margin-bottom:6px;">
            Esta evaluación permite valorar áreas clave como <strong>comprensión verbal, razonamiento perceptual, memoria de trabajo y velocidad de procesamiento</strong>, proporcionando un mapa detallado de fortalezas y áreas de apoyo.
          </p>
          <p style="margin-bottom:0;">
            A partir de estos resultados, el equipo profesional podrá elaborar un <strong>plan terapéutico personalizado</strong> orientado a lograr un equilibrio funcional de sus capacidades, fortaleciendo las habilidades de la vida diaria y mejorando su calidad de vida de manera integral.
          </p>
        </div>
      `;
    }

    // Add the motivo de consulta if available
    const motivoText = evaluation.informacion_adicional ? `<p style="margin-top:8px;"><strong>Motivo de consulta:</strong> ${evaluation.informacion_adicional}</p>` : '';

    return `
      <div class="obs">
        <p>${compatibilityText}${levelText ? ' ' + levelText : ''}</p>
        ${motivoText}
        ${wechslerBlock}
        <p style="margin-top:8px; font-size:9px; color:#64748b; font-style:italic;">
          Nota: Este resultado se basa exclusivamente en la observación estructurada realizada con el ADOS-2 y debe interpretarse en el contexto de una evaluación clínica integral. El diagnóstico definitivo requiere la integración de múltiples fuentes de información.
        </p>
      </div>
    `;
  };

  // ── Observaciones clínicas manuales ──
  const obsText = evaluation.observaciones || '';

  // ── Full HTML report ──
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe ADOS-2 - ${escapeHTML(patientName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1e293b; font-size: 11px; line-height: 1.6; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  @page { size: A4; margin: 15mm 18mm; }
  @media print { .no-print { display: none !important; } .page-break { page-break-before: always; } body { font-size: 11px; } }
  .report { max-width: 720px; margin: 60px auto 20px; padding: 20px; }
  @media print { .report { margin-top: 0; padding: 0; } }

  /* Header profesional */
  .prof-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid ${BRAND.primary}; padding-bottom: 14px; margin-bottom: 6px; }
  .prof-header-left { display: flex; align-items: center; gap: 14px; }
  .prof-logo { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; }
  .prof-logo-placeholder { width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary}); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 800; }
  .prof-name { font-size: 16px; font-weight: 700; color: ${BRAND.dark}; }
  .prof-title { font-size: 10px; color: #64748b; margin-top: 1px; }
  .prof-registros { font-size: 9px; color: #94a3b8; margin-top: 2px; }
  .prof-contact { text-align: right; font-size: 9px; color: #64748b; line-height: 1.5; }

  .report-date { text-align: right; font-size: 10px; color: #64748b; margin-bottom: 16px; }

  /* Title */
  .report-title { text-align: center; margin-bottom: 4px; }
  .report-title h1 { font-size: 18px; font-weight: 800; color: ${BRAND.dark}; }
  .report-title h2 { font-size: 12px; font-weight: 500; color: #64748b; margin-top: 2px; }

  /* Sections */
  .section { margin-bottom: 16px; }
  .section-num { font-size: 13px; font-weight: 700; color: ${BRAND.dark}; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
  .section-num::after { content: ''; flex: 1; height: 2px; background: ${BRAND.primary}20; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${BRAND.primary}; border-bottom: 2px solid ${BRAND.primary}20; padding-bottom: 4px; margin-bottom: 10px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 8px 0; }
  th, td { padding: 5px 8px; border: 1px solid #e2e8f0; text-align: left; }
  th { background: #f8fafc; font-weight: 600; color: #475569; }
  td.score { text-align: center; font-weight: 600; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; }
  .info-grid .label { font-weight: 600; color: #475569; }

  /* Result badge */
  .result-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
  .result-positive { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  .result-negative { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
  .result-moderate { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
  .result-neutral { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

  /* Observations */
  .obs { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 10px; color: #334155; white-space: pre-wrap; line-height: 1.7; }

  /* Footer */
  .prof-footer { margin-top: 24px; padding-top: 10px; border-top: 2px solid ${BRAND.primary}; font-size: 8px; color: #94a3b8; text-align: center; line-height: 1.5; }

  /* Print bar */
  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; padding: 12px 24px; display: flex; justify-content: center; gap: 12px; z-index: 100; }
  .print-bar button { padding: 8px 24px; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: 'Inter', sans-serif; }
  .btn-print { background: ${BRAND.primary}; color: white; }
  .btn-close { background: #334155; color: white; }
  @media print { .print-bar { display: none; } }
</style>
</head>
<body>
<div class="print-bar no-print">
  <button class="btn-print" onclick="printReport()">Descargar PDF</button>
  <button class="btn-close" onclick="window.close()">Cerrar</button>
</div>
<script>
function printReport() {
  // Use timeout to ensure DOM is fully rendered before printing
  // Safari needs extra time to render the content
  setTimeout(function() { window.print(); }, 300);
}
</script>
<div class="report">

  <!-- ═══ HEADER PROFESIONAL ═══ -->
  <div class="prof-header">
    <div class="prof-header-left">
      ${tLogoUrl
        ? `<img src="${tLogoUrl}" class="prof-logo" alt="Logo" />`
        : `<div class="prof-logo-placeholder">${(tName || 'F').charAt(0).toUpperCase()}</div>`
      }
      <div>
        <div class="prof-name">${escapeHTML(tName)}</div>
        <div class="prof-title">${tTitle}${tHeadline ? ` · ${tHeadline}` : ''}</div>
        ${(tRegistroSS || tRegistroSE) ? `<div class="prof-registros">${tRegistroSS ? `Registro SUPERSALUD ${tRegistroSS}` : ''}${tRegistroSS && tRegistroSE ? ' · ' : ''}${tRegistroSE ? `SECREDUC ${tRegistroSE}` : ''}</div>` : ''}
      </div>
    </div>
    <div class="prof-contact">
      ${tAddress ? `${tAddress}<br>` : ''}
      ${tPhone ? `Tel.: ${tPhone}` : ''}
    </div>
  </div>

  <div class="report-date">${date}</div>

  <!-- ═══ TÍTULO ═══ -->
  <div class="report-title">
    <h1>Informe Evaluación ADOS-2</h1>
    <h2>Escala de Observación para el Diagnóstico del Autismo</h2>
  </div>

  <!-- ═══ I. IDENTIFICACIÓN ═══ -->
  <section class="section">
    <div class="section-num">I. IDENTIFICACIÓN</div>
    <div class="info-grid">
      <div><span class="label">Nombre:</span> ${escapeHTML(patientName || 'No especificado')}</div>
      <div><span class="label">RUT:</span> ${escapeHTML(pRut || 'No registrado')}</div>
      <div><span class="label">Fecha de Nacimiento:</span> ${escapeHTML(pBirthdate || 'No registrada')}</div>
      <div><span class="label">Edad:</span> ${age !== null ? `${age} años` : 'No calculada'}</div>
      <div><span class="label">Fecha Evaluación:</span> ${escapeHTML(date)}</div>
      <div><span class="label">Examinador:</span> ${escapeHTML(evaluation.examinador || tName)}</div>
    </div>
    <p style="margin-top:10px; font-size:9px; color:#64748b; font-style:italic;">
      Codificación: Los códigos generales que se asignan a esta sección se completan de acuerdo al comportamiento mostrado por el niño a lo largo de toda la sesión, no se basan en el comportamiento informado u observado en otros contextos.
    </p>
  </section>

  <!-- ═══ II. RESULTADOS DE LA EVALUACIÓN ═══ -->
  <section class="section">
    <div class="section-num">II. RESULTADOS DE LA EVALUACIÓN</div>
    <p style="font-weight:600; margin-bottom:8px;">${moduleDesc}</p>

    <table>
      <thead>
        <tr>
          <th>Área / Ítem</th>
          <th style="text-align:center; width:60px;">ITEM</th>
          <th style="text-align:center; width:80px;">ALGORITMO</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTableBody}
      </tbody>
    </table>

    <!-- Rango de Preocupación -->
    <div style="text-align:center; margin-top:16px; padding:12px; background:#fafbfc; border-radius:8px; border:1px solid #e2e8f0;">
      <p style="font-size:10px; color:#64748b; margin-bottom:6px;">Rango de Preocupación</p>
      <span class="result-badge ${result.css}">${result.label}</span>
      <p style="font-size:10px; color:#64748b; margin-top:6px;">Total Global: <strong>${evaluation.total_global ?? '—'}</strong></p>
    </div>
  </section>

  <!-- ═══ III. DESCRIPCIÓN DE CADA PUNTAJE ═══ -->
  ${scoreDescriptionsHtml ? `
  <section class="section page-break">
    <div class="section-num">III. DESCRIPCIÓN DE LAS CONDUCTAS OBSERVADAS</div>
    <p style="font-size:9px; color:#64748b; font-style:italic; margin-bottom:10px;">
      A continuación se describe el significado clínico del puntaje asignado a cada ítem durante la evaluación.
    </p>
    ${scoreDescriptionsHtml}
  </section>` : ''}

  <!-- ═══ IV. OBSERVACIONES CLÍNICAS ═══ -->
  ${obsText ? `
  <section class="section">
    <div class="section-num">${scoreDescriptionsHtml ? 'IV' : 'III'}. OBSERVACIONES CLÍNICAS</div>
    <div class="obs">${obsText}</div>
  </section>` : ''}

  <!-- ═══ V. SÍNTESIS Y DIAGNÓSTICO ═══ -->
  <section class="section">
    <div class="section-num">${scoreDescriptionsHtml && obsText ? 'V' : scoreDescriptionsHtml || obsText ? 'IV' : 'III'}. SÍNTESIS Y DIAGNÓSTICO</div>
    ${buildSynthesisHtml()}
  </section>

  <!-- ═══ VI. ANÁLISIS CLÍNICO IA ═══ -->
  <section class="section page-break" id="ai-analysis-section">
    <div class="section-num" style="color:${BRAND.secondary};">
      <span style="display:inline-flex; align-items:center; gap:6px;">
        ${scoreDescriptionsHtml && obsText ? 'VI' : scoreDescriptionsHtml || obsText ? 'V' : 'IV'}. ANÁLISIS CLÍNICO Y RECOMENDACIONES
        <span style="font-size:8px; background:${BRAND.secondary}15; color:${BRAND.secondary}; padding:2px 8px; border-radius:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">IA + PubMed</span>
      </span>
    </div>
    <div id="ai-analysis-content">
      <div style="text-align:center; padding:24px; color:#94a3b8;">
        <div style="font-size:20px; margin-bottom:8px; animation: spin 1s linear infinite;">⏳</div>
        <p style="font-size:10px;">Analizando resultados con inteligencia artificial y buscando evidencia en PubMed...</p>
        <p style="font-size:9px; margin-top:4px;">Esto puede tardar unos segundos.</p>
      </div>
    </div>
    <div id="ai-references" style="display:none;"></div>
  </section>
  <style>
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  </style>

  <!-- ═══ FOOTER PROFESIONAL ═══ -->
  <footer class="prof-footer">
    <strong>${escapeHTML(tName)}</strong> — ${escapeHTML(tTitle)}${tHeadline ? `, ${escapeHTML(tHeadline)}` : ''}.<br>
    ${(tRegistroSS || tRegistroSE) ? `${tRegistroSS ? `Registro SUPERSALUD ${escapeHTML(tRegistroSS)}` : ''}${tRegistroSS && tRegistroSE ? ' · ' : ''}${tRegistroSE ? `SECREDUC ${escapeHTML(tRegistroSE)}` : ''}.<br>` : ''}
    Este documento y la información contenida en él son confidenciales. Está prohibida su divulgación, copia, distribución o uso por cualquier persona o entidad que no sean los destinatarios autorizados.
  </footer>

</div>
</body>
</html>`;

  // If we have a saved report, just display it
  if (evaluation.report_html) {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(evaluation.report_html);
      w.document.close();
    }
    return;
  }

  // Open report window immediately
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
  }

  // Async: Call AI analysis edge function, update the section, then save
  requestAiAnalysis(evaluation, responses, patientName, w);
}

// ─── Async AI Analysis ───
async function requestAiAnalysis(evaluation, responses, patientName, reportWindow) {
  if (!reportWindow) return;

  const firstName = (patientName || '').split(' ')[0];

  try {
    const { data, error } = await supabase.functions.invoke('analyze-ados2-report', {
      body: {
        evaluationData: {
          module: evaluation.module,
          rango_preocupacion: evaluation.rango_preocupacion,
          total_global: evaluation.total_global,
          responses: (responses || []).map(r => ({
            item_code: r.item_code,
            item_name: r.item_name,
            raw_score: r.raw_score,
            algorithm_score: r.algorithm_score,
            domain: r.domain,
          })),
        },
        patientFirstName: firstName,
      },
    });

    if (error) throw error;

    const contentEl = reportWindow.document?.getElementById('ai-analysis-content');
    const refsEl = reportWindow.document?.getElementById('ai-references');

    if (contentEl && data?.analysis) {
      // Format analysis text into HTML paragraphs
      const analysisHtml = data.analysis
        .split('\n')
        .filter(p => p.trim())
        .map(p => `<p style="margin-bottom:8px; text-align:justify;">${p.trim()}</p>`)
        .join('');

      contentEl.innerHTML = `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; font-size:10px; color:#334155; line-height:1.7;">
          ${analysisHtml}
        </div>
        ${data.model_used ? `<p style="font-size:8px; color:#94a3b8; margin-top:6px; text-align:right;">Modelo: ${data.model_used}</p>` : ''}
      `;

      // Add PubMed references if available
      if (refsEl && data.articles?.length > 0) {
        refsEl.style.display = 'block';
        refsEl.innerHTML = `
          <p style="font-size:9px; font-weight:600; color:#475569; margin-top:12px; margin-bottom:6px;">Referencias PubMed:</p>
          <ol style="font-size:8px; color:#64748b; line-height:1.6; padding-left:16px;">
            ${data.articles.map(a =>
              `<li style="margin-bottom:4px;">${a.authors} (${a.year}). <em>${a.title}</em>. ${a.journal}. <a href="${a.url}" target="_blank" style="color:${BRAND.secondary};">[PubMed]</a></li>`
            ).join('')}
          </ol>
        `;
      }
    } else {
      contentEl.innerHTML = `
        <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:12px; font-size:10px; color:#92400e;">
          No fue posible generar el análisis IA en este momento. Puede intentarlo nuevamente más tarde.
        </div>
      `;
    }

    // Save the complete report HTML to the evaluation
    saveReportHtml(evaluation.id, reportWindow);
  } catch (err) {
    console.error('AI analysis error:', err);
    const contentEl = reportWindow.document?.getElementById('ai-analysis-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div style="background:#fef3c7; border:1px solid #fcd34d; border-radius:8px; padding:12px; font-size:10px; color:#92400e;">
          El análisis IA no está disponible en este momento. El resto del informe se ha generado correctamente.
        </div>
      `;
    }
    // Save even if AI failed — so the rest of the report is cached
    saveReportHtml(evaluation.id, reportWindow);
  }
}

// ─── Save report HTML to ados2_evaluations ───
async function saveReportHtml(evaluationId, reportWindow) {
  if (!evaluationId || !reportWindow?.document) return;
  try {
    const fullHtml = reportWindow.document.documentElement.outerHTML;
    const { error } = await supabase
      .from('ados2_evaluations')
      .update({ report_html: `<!DOCTYPE html><html lang="es">${fullHtml}</html>` })
      .eq('id', evaluationId);
    if (error) {
      console.error('Error saving report HTML:', error);
    } else {
      console.log('Report HTML saved successfully');
    }
  } catch (err) {
    console.error('Error saving report HTML:', err);
  }
}

// ═══════════════════════════════════════════
// PERFIL SENSORIAL REPORT
// ═══════════════════════════════════════════
export function generateSensorialReport({ evaluation, patientName, therapistName, sections, patientData = {} }) {
  const date = evaluation.fecha_evaluacion || '';
  const overallCfg = {
    tipico: { label: 'Procesamiento Sensorial Típico', css: 'result-negative' },
    leve: { label: 'Diferencias Sensoriales Leves', css: 'result-moderate' },
    moderado: { label: 'Diferencias Sensoriales Moderadas', css: 'result-moderate' },
    significativo: { label: 'Diferencias Sensoriales Significativas', css: 'result-positive' },
  };
  const result = overallCfg[evaluation.overall_classification] || overallCfg.tipico;

  const classLabels = {
    much_less: 'Mucho menos', less: 'Menos', typical: 'Típico', more: 'Más', much_more: 'Mucho más',
  };

  const sectionRows = Object.entries(sections || {}).map(([key, section]) => {
    const score = evaluation.scores_by_section?.[key] || 0;
    const classification = evaluation.classifications_by_section?.[key] || 'typical';
    const isAtypical = ['more', 'much_more', 'less', 'much_less'].includes(classification);
    return `<tr>
      <td>${section.icon} ${section.label}</td>
      <td class="score">${score}</td>
      <td class="score ${isAtypical ? 'fail' : 'pass'}">${classLabels[classification] || classification}</td>
    </tr>`;
  }).join('');

  const body = `
    <section class="section">
      <h3 class="section-title">Información de la Evaluación</h3>
      <table>
        <tr><td><strong>Informante:</strong> ${evaluation.informant_name || '—'}</td><td><strong>Relación:</strong> ${evaluation.informant_relationship || '—'}</td></tr>
        <tr><td><strong>Examinador:</strong> ${escapeHTML(evaluation.examinador || '—')}</td><td><strong>Secciones atípicas:</strong> ${evaluation.atypical_sections || 0} de 7</td></tr>
      </table>
    </section>

    <section class="section" style="text-align:center; padding: 16px 0;">
      <h3 class="section-title">Clasificación General</h3>
      <span class="result-badge ${result.css}">${result.label}</span>
      <p style="font-size:10px; color:#64748b; margin-top:8px;">Puntaje total: ${evaluation.total_score || 0}</p>
    </section>

    <section class="section">
      <h3 class="section-title">Detalle por Sección</h3>
      <table>
        <thead><tr><th>Sección</th><th style="text-align:center">Puntaje</th><th style="text-align:center">Clasificación</th></tr></thead>
        <tbody>${sectionRows}</tbody>
      </table>
    </section>

    ${evaluation.observaciones ? `
    <section class="section">
      <h3 class="section-title">Observaciones Clínicas</h3>
      <div class="obs">${evaluation.observaciones}</div>
    </section>` : ''}
  `;

  openReport(wrapReport('Informe Perfil Sensorial', patientName, therapistName, date, body, patientData));
}

// ═══════════════════════════════════════════
// CONSOLIDATED TEA REPORT
// ═══════════════════════════════════════════
export function generateTeaConsolidatedReport({ adirEval, ados2Eval, sensorialEval, patientName, therapistName, patientData = {} }) {
  const date = new Date().toLocaleDateString('es-CL');

  // ADI-R result
  const adirResult = adirEval?.clasificacion === 'autism' ? 'Cumple criterios' : 'No cumple';
  const adirCss = adirEval?.clasificacion === 'autism' ? 'result-positive' : 'result-negative';

  // ADOS-2 result
  const adosPositive = ['autismo', 'espectro_autista', 'moderada_severa', 'leve_moderada'].includes(ados2Eval?.rango_preocupacion);
  const adosLabels = {
    autismo: 'Autismo', espectro_autista: 'Espectro Autista', no_tea: 'No TEA',
    moderada_severa: 'Moderada-Severa', leve_moderada: 'Leve-Moderada', poco_ninguna: 'Poco/Ninguna',
  };
  const adosResult = adosLabels[ados2Eval?.rango_preocupacion] || 'No evaluado';
  const adosCss = adosPositive ? 'result-positive' : 'result-negative';

  // Sensorial result
  const sensorialLabels = {
    tipico: 'Típico', leve: 'Diferencia Leve', moderado: 'Diferencia Moderada', significativo: 'Significativo',
  };
  const sensorialResult = sensorialLabels[sensorialEval?.overall_classification] || 'No evaluado';
  const sensorialAtypical = ['moderado', 'significativo'].includes(sensorialEval?.overall_classification);

  // Concordance
  const adirPositive = adirEval?.clasificacion === 'autism';
  let concordance, concordanceCss;
  if (adirPositive && adosPositive) {
    concordance = 'Concordancia positiva — Los resultados de ADI-R y ADOS-2 convergen en indicadores compatibles con Trastorno del Espectro Autista.';
    concordanceCss = 'result-positive';
  } else if (!adirPositive && !adosPositive) {
    concordance = 'Concordancia negativa — Los resultados de ADI-R y ADOS-2 no indican presencia de TEA.';
    concordanceCss = 'result-negative';
  } else {
    concordance = 'Resultados discordantes — ADI-R y ADOS-2 arrojan resultados divergentes. Se recomienda evaluación complementaria.';
    concordanceCss = 'result-moderate';
  }

  const body = `
    <section class="section" style="text-align:center; padding: 16px 0;">
      <h3 class="section-title">Conclusión Diagnóstica</h3>
      <span class="result-badge ${concordanceCss}" style="font-size:14px;">${
        adirPositive && adosPositive ? 'Compatible con TEA' :
        !adirPositive && !adosPositive ? 'No compatible con TEA' :
        'Evaluación no concluyente'
      }</span>
      <p style="font-size:10px; color:#64748b; margin-top:10px; max-width:500px; margin-left:auto; margin-right:auto;">${concordance}</p>
    </section>

    <section class="section">
      <h3 class="section-title">Resumen de Evaluaciones</h3>
      <div class="concordance">
        <div class="concordance-card">
          <h4>ADI-R</h4>
          <span class="result-badge ${adirCss}" style="font-size:10px;">${adirResult}</span>
          ${adirEval ? `<p style="font-size:9px; color:#94a3b8; margin-top:6px;">A:${adirEval.total_a} B:${adirEval.total_b} C:${adirEval.total_c} D:${adirEval.total_d}</p>` : ''}
        </div>
        <div class="concordance-card">
          <h4>ADOS-2</h4>
          <span class="result-badge ${adosCss}" style="font-size:10px;">${adosResult}</span>
          ${ados2Eval ? `<p style="font-size:9px; color:#94a3b8; margin-top:6px;">Módulo ${ados2Eval.module} · Global: ${ados2Eval.total_global}</p>` : ''}
        </div>
        <div class="concordance-card">
          <h4>Perfil Sensorial</h4>
          <span class="result-badge ${sensorialAtypical ? 'result-moderate' : 'result-neutral'}" style="font-size:10px;">${sensorialResult}</span>
          ${sensorialEval ? `<p style="font-size:9px; color:#94a3b8; margin-top:6px;">${sensorialEval.atypical_sections || 0}/7 secciones atípicas</p>` : ''}
        </div>
      </div>
    </section>

    ${adirEval ? `
    <section class="section">
      <h3 class="section-title">Detalle ADI-R</h3>
      <table>
        <thead><tr><th>Dominio</th><th style="text-align:center">Puntaje</th><th style="text-align:center">Corte</th><th style="text-align:center">Cumple</th></tr></thead>
        <tbody>
          <tr><td>Interacción Social</td><td class="score">${adirEval.total_a ?? '—'}</td><td class="score">10</td><td class="score ${adirEval.cumple_criterio_a ? 'fail' : 'pass'}">${adirEval.cumple_criterio_a ? 'Sí' : 'No'}</td></tr>
          <tr><td>Comunicación</td><td class="score">${adirEval.total_b ?? '—'}</td><td class="score">${adirEval.verbal_status === 'verbal' ? 8 : 7}</td><td class="score ${adirEval.cumple_criterio_b ? 'fail' : 'pass'}">${adirEval.cumple_criterio_b ? 'Sí' : 'No'}</td></tr>
          <tr><td>Patrones Restringidos</td><td class="score">${adirEval.total_c ?? '—'}</td><td class="score">3</td><td class="score ${adirEval.cumple_criterio_c ? 'fail' : 'pass'}">${adirEval.cumple_criterio_c ? 'Sí' : 'No'}</td></tr>
          <tr><td>Alteraciones Desarrollo</td><td class="score">${adirEval.total_d ?? '—'}</td><td class="score">1</td><td class="score ${adirEval.cumple_criterio_d ? 'fail' : 'pass'}">${adirEval.cumple_criterio_d ? 'Sí' : 'No'}</td></tr>
        </tbody>
      </table>
    </section>` : ''}

    ${ados2Eval ? `
    <section class="section">
      <h3 class="section-title">Detalle ADOS-2</h3>
      <table>
        <thead><tr><th>Dominio</th><th style="text-align:center">Puntaje</th></tr></thead>
        <tbody>
          ${ados2Eval.module === '4'
            ? `<tr><td>Comunicación (COM)</td><td class="score">${ados2Eval.total_com ?? '—'}</td></tr>
               <tr><td>Interacción Social (ISR)</td><td class="score">${ados2Eval.total_as ?? '—'}</td></tr>`
            : `<tr><td>Afectación Social (AS)</td><td class="score">${ados2Eval.total_as ?? '—'}</td></tr>
               <tr><td>Comp. Restringido (CRR)</td><td class="score">${ados2Eval.total_crr ?? '—'}</td></tr>`
          }
          <tr><td><strong>Total Global</strong></td><td class="score"><strong>${ados2Eval.total_global ?? '—'}</strong></td></tr>
        </tbody>
      </table>
    </section>` : ''}

    <section class="section">
      <h3 class="section-title">Recomendaciones</h3>
      <div class="obs">${
        adirPositive && adosPositive
          ? '• Los resultados son consistentes con un diagnóstico de TEA. Se recomienda derivación para confirmación diagnóstica formal.\n• Considerar evaluación complementaria de funcionamiento adaptativo (Vineland-3).\n• Iniciar intervención temprana basada en evidencia.\n• Reevaluar en 12 meses para monitorear evolución.'
          : !adirPositive && !adosPositive
          ? '• Los resultados actuales no son consistentes con TEA.\n• Si persisten preocupaciones clínicas, considerar reevaluación en 6-12 meses.\n• Evaluar otras condiciones del neurodesarrollo si corresponde.'
          : '• Los resultados son discordantes entre ADI-R y ADOS-2.\n• Se recomienda observación clínica adicional y reevaluación en 6 meses.\n• Considerar evaluación por equipo multidisciplinario.\n• Valorar factores contextuales que puedan influir en la discrepancia.'
      }</div>
    </section>

    ${(() => {
      // Wechsler recommendation when NOT compatible with TEA
      if (adirPositive && adosPositive) return '';
      const patientAge = patientData.birthdate ? calcAge(patientData.birthdate) : null;
      const fName = (patientName || '').split(' ')[0];
      let wName, wFull, wAge;
      if (patientAge !== null && patientAge < 6) {
        wName = 'WPPSI'; wFull = 'Wechsler Preschool and Primary Scale of Intelligence'; wAge = '2 años 6 meses a 7 años 7 meses';
      } else if (patientAge !== null && patientAge >= 6 && patientAge < 16) {
        wName = 'WISC'; wFull = 'Wechsler Intelligence Scale for Children'; wAge = '6 a 16 años';
      } else {
        wName = 'WAIS'; wFull = 'Wechsler Adult Intelligence Scale'; wAge = '16 años en adelante';
      }
      return `
    <section class="section">
      <h3 class="section-title">Evaluación Complementaria Recomendada</h3>
      <div class="obs" style="padding:12px 14px; background:linear-gradient(135deg, #eff6ff, #f0fdf4); border-left:4px solid #10b981; border-radius:6px;">
        <p style="font-weight:700; font-size:11px; margin-bottom:6px;">🧠 Evaluación Cognitiva — ${wName}</p>
        <p style="margin-bottom:6px;">
          Si bien los resultados de esta evaluación integral no son concluyentes o no sugieren TEA, es importante considerar que ${fName} fue derivado/a a esta evaluación por dificultades observadas en su funcionamiento cotidiano. Con el fin de comprender integralmente su perfil cognitivo y diseñar un plan de intervención personalizado que potencie sus capacidades, se recomienda realizar una evaluación con psicólogo/a mediante la escala <strong>${wName}</strong> (<em>${wFull}</em>, ${wAge}).
        </p>
        <p style="margin-bottom:6px;">
          Esta evaluación permite valorar áreas clave como <strong>comprensión verbal, razonamiento perceptual, memoria de trabajo y velocidad de procesamiento</strong>, proporcionando un mapa detallado de fortalezas y áreas de apoyo.
        </p>
        <p style="margin-bottom:0;">
          A partir de estos resultados, el equipo profesional podrá elaborar un <strong>plan terapéutico personalizado</strong> orientado a lograr un equilibrio funcional de sus capacidades, fortaleciendo las habilidades de la vida diaria y mejorando su calidad de vida de manera integral.
        </p>
      </div>
    </section>`;
    })()}
  `;

  openReport(wrapReport('Informe Consolidado TEA', patientName, therapistName, date, body, patientData));
}
