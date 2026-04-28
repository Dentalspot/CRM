import { useState } from 'react';
import jsPDF from 'jspdf';
import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Hook para descargar los datos personales del usuario.
 * - JSON portable (ideal para portabilidad ARCO)
 * - PDF humanizado (ideal para imprimir/archivar)
 */
export const useMyDataExport = () => {
  const [exporting, setExporting] = useState(false);

  const fetchData = async () => {
    const { data, error } = await supabase.rpc('export_my_personal_data');
    if (error) throw error;
    return data;
  };

  const downloadBlob = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJson = async () => {
    setExporting(true);
    try {
      const data = await fetchData();
      const ts = new Date().toISOString().slice(0, 10);
      downloadBlob(
        JSON.stringify(data, null, 2),
        `dentalspot-mis-datos-${ts}.json`,
        'application/json'
      );
      return { ok: true };
    } catch (err) {
      logger.error('[useMyDataExport] json error:', err);
      return { ok: false, error: err };
    } finally {
      setExporting(false);
    }
  };

  const exportPdf = async () => {
    setExporting(true);
    try {
      const data = await fetchData();
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 40;
      let y = margin;

      const writeLine = (text, opts = {}) => {
        const { size = 10, bold = false, color = [40, 40, 40] } = opts;
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(String(text ?? ''), 515);
        lines.forEach((line) => {
          if (y > 800) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += size + 4;
        });
      };

      const writeSection = (title) => {
        y += 8;
        writeLine(title, { size: 14, bold: true, color: [13, 148, 136] });
        y += 4;
      };

      const writeKV = (key, value) => {
        if (value === null || value === undefined || value === '') return;
        writeLine(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
      };

      // Header
      writeLine('DentalSpot — Exportación de datos personales', { size: 16, bold: true });
      writeLine(`Fecha de exportación: ${new Date(data.export_date).toLocaleString('es-CL')}`, { size: 9, color: [120, 120, 120] });
      writeLine('Propósito: Derecho ARCO de acceso (Ley 21.719)', { size: 9, color: [120, 120, 120] });

      // Perfil
      writeSection('Mis datos de perfil');
      const profile = data.profile || {};
      writeKV('Nombre completo', profile.full_name);
      writeKV('Email', profile.email);
      writeKV('Teléfono', profile.phone);
      writeKV('RUT', profile.rut);
      writeKV('Rol', profile.role);
      writeKV('Fecha de creación', profile.created_at);

      // Patient
      if (data.patient_record) {
        writeSection('Mi ficha clínica');
        const p = data.patient_record;
        writeKV('Tipo de paciente', p.patient_type);
        writeKV('Diagnóstico', p.diagnosis);
        writeKV('Alergias', p.allergies);
        writeKV('Historia médica', p.medical_history);
        writeKV('Otra información', p.other_info);
      }

      // Appointments
      if (Array.isArray(data.appointments) && data.appointments.length > 0) {
        writeSection(`Mis citas (${data.appointments.length})`);
        data.appointments.forEach((a, i) => {
          writeKV(`Cita ${i + 1}`, `${a.date || ''} — ${a.status || ''} — ${a.duration_minutes || 0} min`);
        });
      }

      // Budgets
      if (Array.isArray(data.budgets) && data.budgets.length > 0) {
        writeSection(`Mis presupuestos (${data.budgets.length})`);
        data.budgets.forEach((b) => {
          writeLine(`Presupuesto #${b.budget_number} — ${b.title}`, { bold: true });
          writeKV('  Estado', b.status);
          writeKV('  Total', `$${b.total} ${b.currency || 'CLP'}`);
          writeKV('  Creado', b.created_at);
        });
      }

      // Payments
      if (Array.isArray(data.payments) && data.payments.length > 0) {
        writeSection(`Mis pagos (${data.payments.length})`);
        data.payments.forEach((p, i) => {
          writeKV(`Pago ${i + 1}`, `$${p.amount} ${p.currency} — ${p.payment_method} — ${p.payment_date}`);
        });
      }

      // Aceptaciones legales
      if (Array.isArray(data.legal_acceptances) && data.legal_acceptances.length > 0) {
        writeSection(`Aceptaciones legales (${data.legal_acceptances.length})`);
        data.legal_acceptances.forEach((la) => {
          writeKV(la.document_title || la.document_slug, `versión ${la.document_version} — ${new Date(la.accepted_at).toLocaleString('es-CL')}`);
        });
      }

      // Footer
      y += 12;
      writeLine('—', { size: 9, color: [120, 120, 120] });
      writeLine('DentalSpot SpA — RUT 77.599.283-2 — Hochstetter 1002, oficina 1103', { size: 8, color: [120, 120, 120] });
      writeLine('Para consultas sobre tus datos: dentalspot.cl@gmail.com', { size: 8, color: [120, 120, 120] });

      const ts = new Date().toISOString().slice(0, 10);
      doc.save(`dentalspot-mis-datos-${ts}.pdf`);
      return { ok: true };
    } catch (err) {
      logger.error('[useMyDataExport] pdf error:', err);
      return { ok: false, error: err };
    } finally {
      setExporting(false);
    }
  };

  return { exportJson, exportPdf, exporting };
};
