import { jsPDF } from "jspdf";

// Centralized imports - removed local duplicates
import { calculateAge } from '@/lib/utils/calculations';
import logger from '@/lib/utils/logger';
import { formatRut, formatDate } from '@/lib/utils/formatters';

const MARGIN = 20;
const LINE_HEIGHT = 7;
const PAGE_HEIGHT = 297; // A4 height in mm
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

// Colors
const COLORS = {
  primary: [0, 51, 102],      // Dark blue
  secondary: [20, 184, 166],  // Teal
  text: [50, 50, 50],
  lightText: [100, 100, 100],
  muted: [150, 150, 150],
  success: [34, 197, 94],     // Green
  warning: [234, 179, 8],     // Yellow
  danger: [239, 68, 68],      // Red
  background: [245, 247, 250],
  border: [200, 200, 200],
};

/**
 * Check if we need a page break
 */
const checkPageBreak = (doc, currentY, requiredHeight) => {
  if (currentY + requiredHeight > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    return MARGIN;
  }
  return currentY;
};

/**
 * Add header with therapist/clinic info
 */
const addHeader = (doc, therapist, clinic) => {
  let yPos = MARGIN;

  // Title (Clinic or Therapist name)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);

  const title = clinic?.name || therapist?.full_name || "Informe Clínico";
  doc.text(title, MARGIN, yPos);

  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.lightText);

  // Professional title
  if (therapist?.professional_title) {
    doc.text(therapist.professional_title, MARGIN, yPos);
    yPos += 5;
  }

  // Contact info
  const contactParts = [];
  if (therapist?.email || therapist?.public_email) {
    contactParts.push(therapist.public_email || therapist.email);
  }
  if (therapist?.phone) contactParts.push(therapist.phone);
  if (clinic?.address) contactParts.push(clinic.address);

  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.text(contactParts.join(" | "), MARGIN, yPos);
    yPos += 5;
  }

  // Registration numbers
  if (therapist?.registration_supersalud) {
    doc.setFontSize(8);
    doc.text(`Reg. Superintendencia: ${therapist.registration_supersalud}`, MARGIN, yPos);
    yPos += 5;
  }

  yPos += 5;

  // Divider line
  doc.setDrawColor(...COLORS.border);
  doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);

  return yPos + 10;
};

/**
 * Add patient information box
 */
const addPatientInfo = (doc, startY, patient, formData) => {
  let yPos = startY;

  // Background box
  doc.setFillColor(...COLORS.background);
  doc.rect(MARGIN, yPos, CONTENT_WIDTH, 35, 'F');

  yPos += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text("INFORMACIÓN DEL PACIENTE", MARGIN + 5, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);

  const col1X = MARGIN + 5;
  const col2X = MARGIN + 95;

  // Row 1: Name & RUT
  doc.setFont("helvetica", "bold");
  doc.text("Nombre:", col1X, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(patient?.full_name || formData?.nombre || "N/A", col1X + 22, yPos);

  const rut = patient?.rut || formData?.rut;
  if (rut) {
    doc.setFont("helvetica", "bold");
    doc.text("RUT:", col2X, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(formatRut(rut), col2X + 15, yPos);
  }

  yPos += 6;

  // Row 2: Birthdate/Age & Phone
  const birthdate = patient?.birthdate || formData?.fecha_nacimiento;
  const age = formData?.edad || (birthdate ? calculateAge(birthdate) : null);

  if (birthdate || age) {
    doc.setFont("helvetica", "bold");
    doc.text("Edad:", col1X, yPos);
    doc.setFont("helvetica", "normal");
    const ageText = age ? `${age} años` : '';
    const dobText = birthdate ? `(${formatDate(birthdate)})` : '';
    doc.text(`${ageText} ${dobText}`.trim(), col1X + 15, yPos);
  }

  const phone = patient?.phone || formData?.telefono;
  if (phone) {
    doc.setFont("helvetica", "bold");
    doc.text("Teléfono:", col2X, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(phone, col2X + 22, yPos);
  }

  yPos += 6;

  // Row 3: Diagnosis if available
  const diagnosis = patient?.diagnosis || formData?.diagnostico;
  if (diagnosis) {
    doc.setFont("helvetica", "bold");
    doc.text("Diagnóstico:", col1X, yPos);
    doc.setFont("helvetica", "normal");
    const diagText = doc.splitTextToSize(diagnosis, CONTENT_WIDTH - 35);
    doc.text(diagText[0], col1X + 28, yPos);
  }

  return startY + 45;
};

/**
 * Add document title and date
 */
const addDocumentTitle = (doc, startY, templateName, date) => {
  let yPos = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.primary);
  doc.text(templateName || "Documento Clínico", MARGIN, yPos);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.lightText);
  const reportDate = formatDate(date || new Date());
  const dateText = `Fecha: ${reportDate}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, PAGE_WIDTH - MARGIN - dateWidth, yPos);

  return yPos + 12;
};

/**
 * Format value based on field type
 */
const formatFieldValue = (field, value) => {
  if (value === undefined || value === null || value === '') return '-';

  switch (field.type) {
    case 'yesno':
      return value === 'si' || value === true ? 'Sí' : 'No';

    case 'checkbox':
      return value === true || value === 'true' ? 'Sí' : 'No';

    case 'severity':
      const severityMap = { 'L': 'Leve', 'M': 'Moderado', 'S': 'Severo' };
      return severityMap[value] || value;

    case 'loglp':
      const loglpMap = { 'L': 'Logra', 'LP': 'Logra Parcialmente', 'NL': 'No Logra' };
      return loglpMap[value] || value;

    case 'date':
      return formatDate(value);

    case 'radio':
      return Array.isArray(value) ? value.join(', ') : String(value);

    default:
      return String(value);
  }
};

/**
 * Get color for clinical values
 */
const getValueColor = (field, value) => {
  if (field.type === 'severity') {
    if (value === 'L') return COLORS.success;
    if (value === 'M') return COLORS.warning;
    if (value === 'S') return COLORS.danger;
  }
  if (field.type === 'loglp') {
    if (value === 'L') return COLORS.success;
    if (value === 'LP') return COLORS.warning;
    if (value === 'NL') return COLORS.danger;
  }
  if (field.type === 'yesno' || field.type === 'checkbox') {
    return (value === 'si' || value === true) ? COLORS.success : COLORS.danger;
  }
  return COLORS.text;
};

/**
 * Render fields from template structure
 */
const renderFields = (doc, startY, fields, data) => {
  let currentY = startY;

  fields.forEach((field) => {
    const value = data[field.id];
    let estimatedHeight = 12;

    if (field.type === 'textarea') estimatedHeight = 25;
    if (field.type === 'header') estimatedHeight = 15;

    currentY = checkPageBreak(doc, currentY, estimatedHeight);

    switch (field.type) {
      case 'header':
        // Section header
        currentY += 3;
        doc.setFillColor(...COLORS.secondary);
        doc.rect(MARGIN, currentY - 4, 3, 10, 'F');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...COLORS.secondary);

        const headerLines = doc.splitTextToSize(field.label, CONTENT_WIDTH - 10);
        doc.text(headerLines, MARGIN + 6, currentY);
        currentY += (headerLines.length * 6) + 6;
        break;

      case 'info':
        // Info block (italic text)
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.lightText);

        const infoText = field.content || field.label;
        const infoLines = doc.splitTextToSize(infoText, CONTENT_WIDTH);
        doc.text(infoLines, MARGIN, currentY);
        currentY += (infoLines.length * 4) + 5;
        break;

      case 'textarea':
        // Multiline text field
        currentY = checkPageBreak(doc, currentY, 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.text);
        doc.text(field.label + ":", MARGIN, currentY);

        currentY += 5;
        doc.setFont("helvetica", "normal");
        const areaValue = value ? String(value) : "-";
        const areaLines = doc.splitTextToSize(areaValue, CONTENT_WIDTH);

        // Handle long text that spans multiple pages
        areaLines.forEach(line => {
          currentY = checkPageBreak(doc, currentY, 5);
          doc.text(line, MARGIN + 2, currentY);
          currentY += 5;
        });
        currentY += 4;
        break;

      case 'checkbox':
        // Checkbox field
        currentY = checkPageBreak(doc, currentY, 10);
        const isChecked = value === true || value === 'true' || value === 'si';
        const checkSymbol = isChecked ? "☑" : "☐";

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...getValueColor(field, value));
        doc.text(`${checkSymbol} ${field.label}`, MARGIN, currentY);
        currentY += 6;
        break;

      case 'yesno':
      case 'severity':
      case 'loglp':
      case 'radio':
        // Inline label + colored value
        currentY = checkPageBreak(doc, currentY, 10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.text);
        doc.text(field.label + ":", MARGIN, currentY);

        const labelWidth = doc.getTextWidth(field.label + ": ");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...getValueColor(field, value));
        doc.text(formatFieldValue(field, value), MARGIN + labelWidth, currentY);
        currentY += 6;
        break;

      case 'text':
      case 'number':
      case 'date':
      default:
        // Standard field
        currentY = checkPageBreak(doc, currentY, 12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.text);
        doc.text(field.label + ":", MARGIN, currentY);

        doc.setFont("helvetica", "normal");
        const textValue = formatFieldValue(field, value);
        const valLines = doc.splitTextToSize(textValue, CONTENT_WIDTH - 5);
        doc.text(valLines, MARGIN, currentY + 5);
        currentY += (valLines.length * 5) + 6;
        break;
    }
  });

  return currentY;
};

/**
 * Add signature area
 */
const addSignature = (doc, therapist) => {
  let yPos = PAGE_HEIGHT - 45;

  // Signature line
  const centerX = PAGE_WIDTH / 2;
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX - 40, yPos, centerX + 40, yPos);

  // Name
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const sigName = therapist?.full_name || "Firma Profesional";
  const sigWidth = doc.getTextWidth(sigName);
  doc.text(sigName, centerX - (sigWidth / 2), yPos + 5);

  // Title
  if (therapist?.professional_title) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.lightText);
    const titleWidth = doc.getTextWidth(therapist.professional_title);
    doc.text(therapist.professional_title, centerX - (titleWidth / 2), yPos + 10);
  }

  // Registration
  if (therapist?.registration_supersalud) {
    doc.setFontSize(8);
    const regText = `Reg. ${therapist.registration_supersalud}`;
    const regWidth = doc.getTextWidth(regText);
    doc.text(regText, centerX - (regWidth / 2), yPos + 15);
  }
};

/**
 * Add footer to all pages
 */
const addFooters = (doc) => {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);

    // Page number
    doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 10, { align: 'right' });

    // Confidentiality notice
    doc.text("Documento Confidencial - Uso Clínico Exclusivo", MARGIN, PAGE_HEIGHT - 10);

    // Generated with
    doc.setFontSize(7);
    doc.text("Generado con DentalSpot", PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: 'center' });
  }
};

/**
 * Parse template structure (handles both formats)
 */
const parseTemplateStructure = (template) => {
  if (!template?.variables) return [];

  const vars = typeof template.variables === 'string'
    ? JSON.parse(template.variables)
    : template.variables;

  // Format 1: Flat structure (from TemplateBuilder)
  if (vars.fields && Array.isArray(vars.fields)) {
    return vars.fields;
  }

  // Format 2: Direct structure array
  if (vars.structure && Array.isArray(vars.structure)) {
    return vars.structure;
  }

  // Format 3: Sections format (from TemplateBuilderModal)
  if (vars.sections && Array.isArray(vars.sections)) {
    const flatFields = [];
    vars.sections.forEach(section => {
      // Add section as header
      flatFields.push({ type: 'header', label: section.title, id: `section_${section.title}` });
      // Add section fields
      if (section.fields) {
        flatFields.push(...section.fields);
      }
    });
    return flatFields;
  }

  return [];
};

/**
 * Main PDF creation function
 */
const createPDFDocument = (options) => {
  const { template, data, patient, therapist, clinic, reportDate } = options;
  const doc = new jsPDF();

  // 1. Header
  let currentY = addHeader(doc, therapist, clinic);

  // 2. Patient Info
  currentY = addPatientInfo(doc, currentY, patient, data);

  // 3. Document Title
  currentY = addDocumentTitle(doc, currentY, template?.name, reportDate || data?.fecha);

  // 4. Parse and render fields
  const fields = parseTemplateStructure(template);
  if (fields.length > 0) {
    currentY = renderFields(doc, currentY, fields, data);
  }

  // 5. Signature (on last page)
  currentY = checkPageBreak(doc, currentY, 50);
  addSignature(doc, therapist);

  // 6. Footers on all pages
  addFooters(doc);

  return doc;
};

/**
 * Download PDF
 */
export const downloadReportPDF = (options) => {
  try {
    const doc = createPDFDocument(options);
    const patientName = options.patient?.full_name || options.data?.nombre || 'Paciente';
    const templateName = options.template?.name || 'Reporte';
    const date = new Date().toISOString().split('T')[0];
    const filename = options.filename || `${templateName}_${patientName}_${date}.pdf`.replace(/\s+/g, '_');
    doc.save(filename);
    return true;
  } catch (error) {
    logger.error("Error generating PDF:", error);
    return false;
  }
};

/**
 * Preview PDF (returns blob URL)
 */
export const previewReportPDF = (options) => {
  try {
    const doc = createPDFDocument(options);
    return doc.output('bloburl');
  } catch (error) {
    logger.error("Error generating PDF preview:", error);
    return null;
  }
};

/**
 * Get PDF as Blob (for upload)
 */
export const getReportPDFBlob = (options) => {
  try {
    const doc = createPDFDocument(options);
    return doc.output('blob');
  } catch (error) {
    logger.error("Error generating PDF blob:", error);
    return null;
  }
};

export default {
  downloadReportPDF,
  previewReportPDF,
  getReportPDFBlob
};