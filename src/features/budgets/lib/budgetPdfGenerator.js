/**
 * @file src/features/budgets/lib/budgetPdfGenerator.js
 *
 * Spec 030 followup: PDF del presupuesto — Propuesta C "Moderno con cards".
 *
 * Estructura:
 *  1. Header centrado con logo (aspect ratio respetado) + nombre clínica
 *  2. Banda superior: Nº+fecha+título a la izquierda, sticker "X% AVANCE" a la derecha
 *  3. Card "Paciente"
 *  4. Card "Dentista tratante"
 *  5. Sección "Intervenciones": una card por intervención con chip de status pill
 *  6. Card "Resumen" con total destacado en pill
 *  7. Firmas con header "Firma del Dr. tratante" / "Firma del paciente"
 */

import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabaseClient';

const MARGIN = 18;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  primary: [13, 148, 136], // teal-600
  primaryDark: [15, 118, 110], // teal-700
  primaryLight: [240, 253, 250], // teal-50
  dark: [15, 23, 42], // slate-900
  text: [40, 50, 65],
  muted: [110, 120, 138],
  softMuted: [156, 163, 175],
  light: [243, 244, 246],
  lighter: [249, 250, 251],
  border: [226, 232, 240],
  borderSoft: [241, 245, 249],
  done: [22, 163, 74], // green-600
  doneLight: [220, 252, 231], // green-100
  pending: [217, 119, 6], // amber-600
  pendingLight: [254, 243, 199], // amber-100
  purple: [124, 58, 237],
  white: [255, 255, 255],
};

const formatCLP = (n) => {
  const rounded = Math.round(Number(n) || 0);
  return '$' + new Intl.NumberFormat('es-CL').format(rounded);
};

const formatDateChile = (iso) => {
  const date = iso ? new Date(iso) : new Date();
  if (isNaN(date.getTime())) return new Date().toLocaleDateString('es-CL');
  return date.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateShort = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
};

const PATIENT_TYPE_LABEL = {
  privado: 'Privado',
  fonasa: 'Fonasa',
  convenio: 'Convenio',
};

async function loadImageAsDataUrl(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function extractTooth(description) {
  if (!description) return '';
  const m = description.match(/\bdiente\s+(\d{1,2})\b/i);
  return m ? m[1] : '';
}

async function resolveContext({ budgetId, patientId, dentistId, clinicId }) {
  const [budget, patient, dentistProfile, clinic] = await Promise.all([
    supabase
      .from('treatment_budgets')
      .select('id, budget_number, title, description, status, created_at, currency')
      .eq('id', budgetId)
      .maybeSingle()
      .then((r) => r.data),
    supabase
      .from('patients')
      .select(`
        id, full_name, rut, email, phone, patient_type,
        profile:profiles!patients_profile_id_fkey(full_name, rut)
      `)
      .eq('id', patientId)
      .maybeSingle()
      .then((r) => r.data),
    supabase
      .from('profiles')
      .select('id, full_name, email, rut')
      .eq('id', dentistId)
      .maybeSingle()
      .then((r) => r.data),
    clinicId
      ? supabase
          .from('clinics')
          .select('id, name, address, phone, email, logo_url')
          .eq('id', clinicId)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const { data: items } = await supabase
    .from('treatment_budget_items')
    .select(
      'description, quantity, unit_price, subtotal, discount_percentage, sort_order, status, completed_at'
    )
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: true });

  const { data: details } = await supabase
    .from('therapist_details')
    .select('professional_title, specialization_areas')
    .eq('user_id', dentistId)
    .maybeSingle();

  let dentistLogoUrl = null;
  if (!clinic?.logo_url) {
    const { data: branding } = await supabase
      .from('therapist_branding')
      .select('logo_url')
      .eq('therapist_id', dentistId)
      .maybeSingle();
    dentistLogoUrl = branding?.logo_url || null;
  }

  return {
    budget,
    patient,
    dentist: { ...dentistProfile, details: details || {} },
    clinic,
    items: items || [],
    dentistLogoUrl,
  };
}

// ─── Helpers de pintado ───

function drawCard(doc, { x, y, w, h, radius = 3, fillColor = COLORS.white, borderColor = COLORS.border }) {
  doc.setFillColor(...fillColor);
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, radius, radius, 'FD');
}

function drawPill(doc, { x, y, label, fillColor, textColor, paddingX = 4, height = 5.2, fontSize = 7.5 }) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontSize);
  const textWidth = doc.getTextWidth(label);
  const w = textWidth + paddingX * 2;
  doc.setFillColor(...fillColor);
  doc.roundedRect(x, y - height + 1.5, w, height, height / 2, height / 2, 'F');
  doc.setTextColor(...textColor);
  doc.text(label, x + paddingX, y);
  return w; // Ancho TOTAL del pill (incluye padding) — usar para posicionar siguiente elemento
}

export async function generateBudgetPdf({ budgetId, patientId, dentistId, clinicId }) {
  const { budget, patient, dentist, clinic, items, dentistLogoUrl } =
    await resolveContext({ budgetId, patientId, dentistId, clinicId });
  if (!budget) throw new Error('No se encontró el presupuesto.');

  const logoUrl = clinic?.logo_url || dentistLogoUrl || null;
  const logoDataUrl = await loadImageAsDataUrl(logoUrl);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = MARGIN;
  const centerX = PAGE_WIDTH / 2;

  // ═══════════════════════════════════════════════════════════════════════
  // 1. HEADER — logo centrado con aspect ratio + nombre + datos clínica
  // ═══════════════════════════════════════════════════════════════════════
  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const maxH = 22;
      const maxW = 75;
      const scale = Math.min(maxW / props.width, maxH / props.height);
      const finalW = props.width * scale;
      const finalH = props.height * scale;
      doc.addImage(
        logoDataUrl,
        props.fileType || 'PNG',
        centerX - finalW / 2,
        y,
        finalW,
        finalH,
        undefined,
        'FAST'
      );
      y += finalH + 4;
    } catch {
      /* sin logo si falla */
    }
  }

  const clinicName = (clinic?.name || dentist?.full_name || 'DentalSpot').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.dark);
  doc.text(clinicName, centerX, y + 5, { align: 'center' });
  y += 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  const infoLine = [clinic?.address, clinic?.phone ? `Tel ${clinic.phone}` : null]
    .filter(Boolean)
    .join('  ·  ');
  if (infoLine) {
    doc.text(infoLine, centerX, y, { align: 'center' });
    y += 5;
  }
  if (clinic?.email) {
    doc.text(clinic.email, centerX, y, { align: 'center' });
    y += 5;
  }

  y += 6;
  // Línea separadora
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  // ═══════════════════════════════════════════════════════════════════════
  // 2. BANDA SUPERIOR — Nº + fecha + título (full-width, sin sticker)
  // ═══════════════════════════════════════════════════════════════════════

  // Calcular progreso (lo usamos abajo en la barra sutil después de las cards)
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const totalCount = items.length;
  const subBruto = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  );
  const subCompleted = items
    .filter((i) => i.status === 'completed')
    .reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
      0
    );
  const progressPct = subBruto > 0 ? Math.round((subCompleted / subBruto) * 100) : 0;

  // Número + fecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Nº ${budget.budget_number || '—'}  ·  ${formatDateChile(budget.created_at)}`, MARGIN, y);
  y += 6;

  // Título grande sobre todo el ancho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.dark);
  const titleLines = doc.splitTextToSize(
    budget.title || 'Plan de tratamiento',
    CONTENT_WIDTH
  );
  titleLines.forEach((line) => {
    doc.text(line, MARGIN, y);
    y += 6;
  });
  y += 2;

  // Descripción opcional (visible para el paciente)
  if (budget.description) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    const descLines = doc.splitTextToSize(budget.description, CONTENT_WIDTH);
    doc.text(descLines, MARGIN, y);
    y += descLines.length * 4 + 4;
  }

  y += 2;

  // ═══════════════════════════════════════════════════════════════════════
  // 3 + 4. CARDS PACIENTE Y DENTISTA (side by side, compactas)
  // ═══════════════════════════════════════════════════════════════════════
  const cardW = (CONTENT_WIDTH - 4) / 2;
  const cardH = 20;

  // Card paciente (izquierda)
  drawCard(doc, { x: MARGIN, y, w: cardW, h: cardH });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text('PACIENTE', MARGIN + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.dark);
  const patientName = patient?.profile?.full_name || patient?.full_name || '—';
  doc.text(patientName, MARGIN + 4, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  const patientRut = patient?.profile?.rut || patient?.rut;
  const patientLine2 = [
    patientRut ? `RUT ${patientRut}` : null,
    `Convenio ${PATIENT_TYPE_LABEL[patient?.patient_type] || '—'}`,
  ]
    .filter(Boolean)
    .join('  ·  ');
  doc.text(patientLine2, MARGIN + 4, y + 16);

  // Card dentista (derecha)
  const dentistCardX = MARGIN + cardW + 4;
  drawCard(doc, { x: dentistCardX, y, w: cardW, h: cardH });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text('DENTISTA TRATANTE', dentistCardX + 4, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.dark);
  const dentistName = dentist?.full_name || '—';
  doc.text(dentistName, dentistCardX + 4, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  const dentistTitle = dentist?.details?.professional_title;
  const dentistRut = dentist?.rut;
  const dentistLine2 = [dentistTitle, dentistRut ? `RUT ${dentistRut}` : null]
    .filter(Boolean)
    .join('  ·  ');
  if (dentistLine2) {
    doc.text(dentistLine2, dentistCardX + 4, y + 16);
  }

  y += cardH + 6;

  // Barra sutil de avance del tratamiento (solo si tiene items)
  if (totalCount > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text('Avance del tratamiento', MARGIN, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(
      `${progressPct}%  ·  ${completedCount} de ${totalCount} intervenciones`,
      PAGE_WIDTH - MARGIN,
      y,
      { align: 'right' }
    );
    y += 2.5;

    // Barra
    const barH = 2.5;
    doc.setFillColor(...COLORS.light);
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, barH, 1, 1, 'F');
    if (progressPct > 0) {
      const fillW = (CONTENT_WIDTH * progressPct) / 100;
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(MARGIN, y, fillW, barH, 1, 1, 'F');
    }
    y += barH + 6;
  } else {
    y += 2;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. INTERVENCIONES — una card por intervención con pill de status
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.text('Intervenciones', MARGIN, y);
  y += 5;

  items.forEach((item) => {
    // Page break si nos pasamos
    if (y > PAGE_HEIGHT - 75) {
      doc.addPage();
      y = MARGIN;
    }

    const itemRowH = 18;
    const innerPadX = 7;
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    const disc = Number(item.discount_percentage) || 0;
    const subtotalItem =
      Number(item.subtotal) || qty * price * (1 - disc / 100);
    const isCompleted = item.status === 'completed';
    const tooth = extractTooth(item.description);

    const tooth_meta = [];
    if (tooth) tooth_meta.push(`Pieza ${tooth}`);
    if (isCompleted && item.completed_at) tooth_meta.push(formatDateShort(item.completed_at));
    if (disc > 0) tooth_meta.push(`Dcto ${disc}%`);
    if (qty > 1) tooth_meta.push(`${qty} unidades`);
    const hasMeta = tooth_meta.length > 0;

    // Card
    drawCard(doc, { x: MARGIN, y, w: CONTENT_WIDTH, h: itemRowH, radius: 2 });

    // ─── Centrado vertical ───
    // Si hay 2 líneas (descripción + meta), el bloque mide ~9mm. Centramos.
    // Si solo 1 línea (descripción), el bloque mide ~4mm. Centramos.
    const cardCenterY = y + itemRowH / 2;
    const lineGap = 4.5;
    const line1Y = hasMeta ? cardCenterY - lineGap / 2 + 1.5 : cardCenterY + 1.5;
    const line2Y = line1Y + lineGap;

    // Pill de status — centrado vertical en la card (baseline alineada con
    // la descripción de la línea 1)
    const pillLabel = isCompleted ? 'Realizado' : 'Por realizar';
    const pillFill = isCompleted ? COLORS.doneLight : COLORS.pendingLight;
    const pillText = isCompleted ? COLORS.done : COLORS.pending;
    const pillX = MARGIN + innerPadX;
    // pill baseline alineada con la descripción para que se vean a la misma altura
    const pillRealWidth = drawPill(doc, {
      x: pillX,
      y: hasMeta ? line1Y : cardCenterY + 1.5,
      label: pillLabel,
      fillColor: pillFill,
      textColor: pillText,
      fontSize: 7.5,
    });

    // Descripción al lado del pill — usa el ancho REAL del pill
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.dark);
    const descX = pillX + pillRealWidth + 5;
    doc.text(item.description || '—', descX, hasMeta ? line1Y : cardCenterY + 1.5);

    // Línea 2: metadatos (solo si hay)
    if (hasMeta) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(tooth_meta.join('  ·  '), descX, line2Y);
    }

    // Precio a la derecha — centrado vertical en la card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    const priceY = disc > 0 && price * qty !== subtotalItem
      ? cardCenterY - 1   // si hay desc, dejamos espacio para el %
      : cardCenterY + 1.5; // centrado vertical exacto
    doc.text(formatCLP(subtotalItem), PAGE_WIDTH - MARGIN - innerPadX, priceY, { align: 'right' });

    // Si hay descuento, mostrar % morado debajo del precio
    if (disc > 0 && price * qty !== subtotalItem) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.purple);
      doc.text(`−${disc}%`, PAGE_WIDTH - MARGIN - innerPadX, cardCenterY + 4, { align: 'right' });
    }

    y += itemRowH + 1.5;
  });

  y += 6;

  // ═══════════════════════════════════════════════════════════════════════
  // 6. RESUMEN — card con total destacado en pill
  // ═══════════════════════════════════════════════════════════════════════
  if (y > PAGE_HEIGHT - 80) {
    doc.addPage();
    y = MARGIN;
  }

  const subtotalNeto = items.reduce(
    (acc, it) => acc + (Number(it.subtotal) || 0),
    0
  );
  const effectiveDiscAmount = subBruto - subtotalNeto;
  const effectiveDiscPct =
    subBruto > 0
      ? Math.round((effectiveDiscAmount / subBruto) * 100 * 10) / 10
      : 0;

  // Card resumen — TOTAL centrado vertical (con descuento arriba si hay)
  const summaryH = effectiveDiscAmount > 0 ? 28 : 18;
  const summaryPadX = 8;
  drawCard(doc, {
    x: MARGIN,
    y,
    w: CONTENT_WIDTH,
    h: summaryH,
    fillColor: COLORS.lighter,
  });

  // Descuento (si hay) en la parte superior
  if (effectiveDiscAmount > 0) {
    const discY = y + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Descuento aplicado (${effectiveDiscPct.toFixed(1)}%)`, MARGIN + summaryPadX, discY);
    doc.setTextColor(...COLORS.purple);
    doc.text(`−${formatCLP(effectiveDiscAmount)}`, PAGE_WIDTH - MARGIN - summaryPadX, discY, { align: 'right' });
  }

  // ─── TOTAL centrado vertical en la card ───
  const totalValue = formatCLP(subtotalNeto);
  const pillTotalH = 10;
  // Centro vertical: si hay descuento, centramos en la mitad inferior. Si no, centro exacto de la card.
  const totalCenterY = effectiveDiscAmount > 0 ? y + 20 : y + summaryH / 2;
  // baseline del texto = centro + offset para optical-center (~1.8 para 11px-13px)
  const totalLabelBaseline = totalCenterY + 1.8;

  // Label "TOTAL" alineado al centro vertical
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  doc.text('TOTAL', MARGIN + summaryPadX, totalLabelBaseline);

  // Pill teal con el monto — centrado en torno a totalCenterY
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const totalTextW = doc.getTextWidth(totalValue);
  const pillTotalW = totalTextW + 16;
  const pillTotalX = PAGE_WIDTH - MARGIN - summaryPadX - pillTotalW;
  const pillTotalY = totalCenterY - pillTotalH / 2;
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(pillTotalX, pillTotalY, pillTotalW, pillTotalH, 2, 2, 'F');
  doc.setTextColor(...COLORS.white);
  doc.text(totalValue, pillTotalX + pillTotalW / 2, totalCenterY + 2, { align: 'center' });

  y += summaryH + 4;

  // Vigencia
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.softMuted);
  doc.text(
    'Vigencia 30 días desde la fecha de emisión · Precios en pesos chilenos (CLP).',
    MARGIN,
    y
  );
  y += 10;

  // ═══════════════════════════════════════════════════════════════════════
  // 7. FIRMAS
  // ═══════════════════════════════════════════════════════════════════════
  const signaturesY = Math.max(y + 26, PAGE_HEIGHT - 38);
  const sigBoxWidth = (CONTENT_WIDTH - 12) / 2;
  const sigLeftX = MARGIN;
  const sigRightX = PAGE_WIDTH - MARGIN - sigBoxWidth;

  // Header de cada firma con guiones
  const drawSigHeader = (xStart, label) => {
    const lineLen = 14;
    doc.setDrawColor(...COLORS.softMuted);
    doc.setLineWidth(0.3);
    const labelW = doc.getTextWidth(label);
    const totalW = lineLen + 4 + labelW + 4 + lineLen;
    const start = xStart + (sigBoxWidth - totalW) / 2;
    doc.line(start, signaturesY, start + lineLen, signaturesY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(label, start + lineLen + 4 + labelW / 2, signaturesY + 1, { align: 'center' });
    doc.line(start + lineLen + 8 + labelW, signaturesY, start + lineLen + 8 + labelW + lineLen, signaturesY);
  };

  drawSigHeader(sigLeftX, 'Firma del Dr. tratante');
  drawSigHeader(sigRightX, 'Firma del paciente');

  // Espacio para firma manuscrita
  // Nombres debajo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.text(dentistName, sigLeftX + sigBoxWidth / 2, signaturesY + 16, { align: 'center' });
  doc.text(patientName, sigRightX + sigBoxWidth / 2, signaturesY + 16, { align: 'center' });

  // Línea para la firma (donde el dentista escribe)
  doc.setDrawColor(...COLORS.dark);
  doc.setLineWidth(0.3);
  doc.line(sigLeftX + 8, signaturesY + 13, sigLeftX + sigBoxWidth - 8, signaturesY + 13);
  doc.line(sigRightX + 8, signaturesY + 13, sigRightX + sigBoxWidth - 8, signaturesY + 13);

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER en cada página
  // ═══════════════════════════════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = PAGE_HEIGHT - 8;
    doc.setDrawColor(...COLORS.borderSoft);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, footerY - 4, PAGE_WIDTH - MARGIN, footerY - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.softMuted);
    doc.text(clinicName, MARGIN, footerY);
    doc.text(
      `Página ${i} de ${pageCount} · Generado con DentalSpot`,
      PAGE_WIDTH - MARGIN,
      footerY,
      { align: 'right' }
    );
  }

  const safeName = (patientName || 'paciente').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'paciente';
  const filename = `Presupuesto_${budget.budget_number || 'sin_numero'}_${safeName}.pdf`;
  doc.save(filename);

  return { filename };
}
