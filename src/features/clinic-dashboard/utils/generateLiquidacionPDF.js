import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount || 0);

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Genera un PDF de Liquidación de Honorarios con formato contable chileno.
 *
 * @param {Object} params
 * @param {Object} params.clinic - { name, rut, address, phone }
 * @param {Object} params.therapist - { name, rut, email, specialty }
 * @param {number} params.month - 0-11
 * @param {number} params.year
 * @param {Array}  params.sessions - [{ date, patientName, serviceName, duration, amount }]
 * @param {number} params.commissionPercent - % que retiene el centro
 * @param {Array}  params.discounts - [{ concept, amount }]
 * @param {Array}  params.bonuses - [{ concept, amount }]
 */
export const generateLiquidacionPDF = ({
  clinic = {},
  therapist = {},
  month,
  year,
  sessions = [],
  commissionPercent = 30,
  discounts = [],
  bonuses = [],
}) => {
  const doc = new jsPDF('p', 'mm', 'letter'); // Carta chilena
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const monthName = MONTHS_ES[month];
  const period = `${monthName} ${year}`;

  // ========== HELPERS ==========
  const drawLine = (yPos, color = [200, 200, 200]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  const addText = (text, x, yPos, options = {}) => {
    const { size = 10, style = 'normal', color = [33, 33, 33], align = 'left' } = options;
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    doc.setTextColor(...color);
    doc.text(text, x, yPos, { align });
  };

  const checkPage = (needed = 20) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // ========== HEADER ==========
  addText('LIQUIDACIÓN DE HONORARIOS', pageWidth / 2, y, { size: 16, style: 'bold', align: 'center' });
  y += 6;
  addText(`Período: ${period}`, pageWidth / 2, y, { size: 10, color: [100, 100, 100], align: 'center' });
  y += 4;
  addText(`Documento generado el ${format(new Date(), "d 'de' MMMM yyyy", { locale: es })}`, pageWidth / 2, y, { size: 8, color: [150, 150, 150], align: 'center' });
  y += 8;
  drawLine(y, [50, 50, 50]);
  y += 8;

  // ========== DATOS DEL CENTRO ==========
  addText('CENTRO EMISOR', margin, y, { size: 8, style: 'bold', color: [100, 100, 100] });
  y += 5;
  addText(clinic.name || 'Centro Clínico', margin, y, { size: 11, style: 'bold' });
  y += 5;
  if (clinic.rut) { addText(`RUT: ${clinic.rut}`, margin, y, { size: 9, color: [80, 80, 80] }); y += 4; }
  if (clinic.address) { addText(clinic.address, margin, y, { size: 9, color: [80, 80, 80] }); y += 4; }
  if (clinic.phone) { addText(`Tel: ${clinic.phone}`, margin, y, { size: 9, color: [80, 80, 80] }); y += 4; }
  y += 4;

  // ========== DATOS DEL PROFESIONAL ==========
  addText('PROFESIONAL', margin, y, { size: 8, style: 'bold', color: [100, 100, 100] });
  y += 5;
  addText(therapist.name || 'Profesional', margin, y, { size: 11, style: 'bold' });
  y += 5;
  if (therapist.rut) { addText(`RUT: ${therapist.rut}`, margin, y, { size: 9, color: [80, 80, 80] }); y += 4; }
  if (therapist.specialty) { addText(`Especialidad: ${therapist.specialty}`, margin, y, { size: 9, color: [80, 80, 80] }); y += 4; }
  if (therapist.email) { addText(`Email: ${therapist.email}`, margin, y, { size: 9, color: [80, 80, 80] }); y += 4; }
  y += 6;
  drawLine(y);
  y += 8;

  // ========== TABLA DE SESIONES ==========
  addText('DETALLE DE SESIONES', margin, y, { size: 10, style: 'bold' });
  y += 7;

  // Header de tabla
  const cols = [
    { label: 'Fecha', x: margin, w: 28 },
    { label: 'Paciente', x: margin + 28, w: 52 },
    { label: 'Servicio', x: margin + 80, w: 52 },
    { label: 'Duración', x: margin + 132, w: 22 },
    { label: 'Monto', x: margin + 154, w: 28 },
  ];

  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 4, contentWidth, 7, 'F');

  cols.forEach((col) => {
    const align = col.label === 'Monto' ? 'right' : 'left';
    const textX = align === 'right' ? col.x + col.w - 2 : col.x + 2;
    addText(col.label, textX, y, { size: 8, style: 'bold', color: [80, 80, 80], align });
  });
  y += 6;

  // Filas
  let totalSessions = 0;

  sessions.forEach((s, idx) => {
    checkPage(8);

    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 3.5, contentWidth, 6, 'F');
    }

    const dateStr = s.date ? format(new Date(s.date + 'T12:00:00'), 'dd/MM/yyyy') : '-';
    addText(dateStr, cols[0].x + 2, y, { size: 8 });
    addText((s.patientName || 'Paciente').substring(0, 28), cols[1].x + 2, y, { size: 8 });
    addText((s.serviceName || 'Sesión').substring(0, 28), cols[2].x + 2, y, { size: 8 });
    addText(s.duration ? `${s.duration} min` : '-', cols[3].x + 2, y, { size: 8 });
    addText(formatCLP(s.amount), cols[4].x + cols[4].w - 2, y, { size: 8, align: 'right' });

    totalSessions += Number(s.amount) || 0;
    y += 6;
  });

  if (sessions.length === 0) {
    addText('Sin sesiones registradas en este período', margin + 2, y, { size: 9, color: [150, 150, 150] });
    y += 6;
  }

  y += 4;
  drawLine(y);
  y += 8;

  // ========== RESUMEN FINANCIERO ==========
  addText('RESUMEN FINANCIERO', margin, y, { size: 10, style: 'bold' });
  y += 8;

  const summaryX = margin + 90;
  const valueX = pageWidth - margin;

  // Bruto
  addText('Total bruto sesiones:', summaryX, y, { size: 9 });
  addText(formatCLP(totalSessions), valueX, y, { size: 9, style: 'bold', align: 'right' });
  y += 6;

  // Bonos
  let totalBonuses = 0;
  bonuses.forEach((b) => {
    addText(`(+) ${b.concept}:`, summaryX, y, { size: 9, color: [34, 139, 34] });
    addText(formatCLP(b.amount), valueX, y, { size: 9, color: [34, 139, 34], align: 'right' });
    totalBonuses += Number(b.amount) || 0;
    y += 5;
  });

  // Descuentos
  let totalDiscounts = 0;
  discounts.forEach((d) => {
    addText(`(-) ${d.concept}:`, summaryX, y, { size: 9, color: [200, 50, 50] });
    addText(`- ${formatCLP(d.amount)}`, valueX, y, { size: 9, color: [200, 50, 50], align: 'right' });
    totalDiscounts += Number(d.amount) || 0;
    y += 5;
  });

  // Comisión del centro
  const commissionAmount = Math.round(totalSessions * (commissionPercent / 100));
  addText(`(-) Comisión centro (${commissionPercent}%):`, summaryX, y, { size: 9, color: [200, 50, 50] });
  addText(`- ${formatCLP(commissionAmount)}`, valueX, y, { size: 9, color: [200, 50, 50], align: 'right' });
  y += 8;

  drawLine(y, [50, 50, 50]);
  y += 6;

  // Neto
  const netAmount = totalSessions + totalBonuses - totalDiscounts - commissionAmount;
  addText('LÍQUIDO A PAGAR:', summaryX, y, { size: 12, style: 'bold' });
  addText(formatCLP(netAmount), valueX, y, { size: 12, style: 'bold', color: [0, 100, 80], align: 'right' });
  y += 12;

  // ========== RESUMEN ESTADÍSTICO ==========
  checkPage(25);
  doc.setFillColor(245, 248, 250);
  doc.roundedRect(margin, y - 2, contentWidth, 20, 2, 2, 'F');

  addText(`Sesiones: ${sessions.length}`, margin + 6, y + 5, { size: 8, color: [80, 80, 80] });
  addText(`Promedio/sesión: ${formatCLP(sessions.length > 0 ? Math.round(totalSessions / sessions.length) : 0)}`, margin + 50, y + 5, { size: 8, color: [80, 80, 80] });
  addText(`Comisión: ${commissionPercent}%`, margin + 110, y + 5, { size: 8, color: [80, 80, 80] });

  const uniquePatients = new Set(sessions.map(s => s.patientName)).size;
  addText(`Pacientes atendidos: ${uniquePatients}`, margin + 6, y + 12, { size: 8, color: [80, 80, 80] });
  y += 28;

  // ========== FIRMAS ==========
  checkPage(40);
  y += 10;

  const signWidth = 60;
  const signLeft = margin + 15;
  const signRight = pageWidth - margin - signWidth - 15;

  drawLine(y, [100, 100, 100]);

  // Firma centro
  doc.line(signLeft, y + 20, signLeft + signWidth, y + 20);
  addText('Firma Centro', signLeft + signWidth / 2, y + 25, { size: 8, color: [100, 100, 100], align: 'center' });
  addText(clinic.name || 'Centro', signLeft + signWidth / 2, y + 30, { size: 7, color: [150, 150, 150], align: 'center' });

  // Firma profesional
  doc.line(signRight, y + 20, signRight + signWidth, y + 20);
  addText('Firma Profesional', signRight + signWidth / 2, y + 25, { size: 8, color: [100, 100, 100], align: 'center' });
  addText(therapist.name || 'Profesional', signRight + signWidth / 2, y + 30, { size: 7, color: [150, 150, 150], align: 'center' });

  // ========== FOOTER ==========
  const footerY = doc.internal.pageSize.getHeight() - 10;
  addText(
    `Documento generado por DentalSpot · dentalspot.cl · ${period}`,
    pageWidth / 2, footerY,
    { size: 7, color: [180, 180, 180], align: 'center' }
  );

  // ========== GUARDAR ==========
  const cleanName = (therapist.name || 'profesional').replace(/\s+/g, '_');
  const filename = `Liquidacion_${cleanName}_${monthName}_${year}.pdf`;
  doc.save(filename);

  return { filename, netAmount, totalSessions: sessions.length };
};