import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Unifica datos de múltiples tablas clínicas en un timeline cronológico.
 * Cada evento tiene: id, type, date, title, summary, therapist, visibility, raw
 */
const REFERRAL_TYPE_LABELS = {
  fonoaudiologo: 'Odontólogo/a',
  psicologo: 'Psicólogo/a',
  terapeuta_ocupacional: 'Terapeuta Ocupacional',
  neurologo: 'Neurólogo/a',
  psiquiatra: 'Psiquiatra',
  pediatra: 'Pediatra',
  educador_diferencial: 'Educador/a Diferencial',
  kinesiologo: 'Kinesiólogo/a',
  otro: 'Otro profesional',
};

export const buildTimeline = ({
  appointments = [],
  clinicalHistory = [],
  diagnoses = [],
  plans = [],
  progressReports = [],
  notizSessions = [],
  sessionActivities = [],
  ados2Evaluations = [],
  adirEvaluations = [],
  sensorialEvaluations = [],
  therapistMap = {},
  isPatientView = false,
}) => {
  const events = [];

  // Track appointment IDs to avoid duplicates with clinical_history
  const appointmentIds = new Set();

  // Session-related entry types (will be merged under 'session')
  const SESSION_ENTRY_TYPES = new Set([
    'sesion', 'sesion_terapia', 'sesion_programada', 'control', 'tratamiento', 'nota_clinica',
  ]);

  // 1. Sesiones (todas las pasadas, cualquier status)
  const statusLabels = {
    completed: null,
    scheduled: 'Sin evolucionar',
    confirmed: 'Sin evolucionar',
    pending_payment: 'Pago pendiente',
    awaiting_payment: 'Pago pendiente',
    cancelled: 'Cancelada',
    no_show: 'No asistió',
  };
  appointments.forEach(a => {
    appointmentIds.add(a.id);
    const label = statusLabels[a.status];
    events.push({
      id: `session-${a.id}`,
      type: 'session',
      date: a.date,
      title: `Sesión${a.services?.service_name ? ` — ${a.services.service_name}` : ''}${label ? ` (${label})` : ''}`,
      summary: a.notes || null,
      therapistId: a.therapist_id,
      therapistName: therapistMap[a.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: a,
    });
  });

  // 2. Notas clínicas (clinical_history)
  const entryTypeLabels = {
    sesion: 'Sesión',
    sesion_terapia: 'Sesión — terapia',
    sesion_programada: 'Sesión programada',
    evaluacion: 'Evaluación',
    diagnostico: 'Diagnóstico',
    informe: 'Informe',
    informe_tea: 'Informe TEA (ADOS-2)',
    nota_clinica: 'Sesión',
    plan_tratamiento: 'Plan de Tratamiento',
    derivacion: 'Derivación',
    control: 'Sesión — control',
    tratamiento: 'Sesión — tratamiento',
  };

  clinicalHistory.forEach(ch => {
    const vis = ch.visibility || 'all';
    if (isPatientView && vis !== 'all') return;

    // Skip if this clinical_history entry is already represented by an appointment
    if (ch.appointment_id && appointmentIds.has(ch.appointment_id)) return;

    // Determine event type
    let eventType = 'session'; // default: most clinical entries are session-related
    if (vis === 'professional_only') eventType = 'professional_note';
    else if (ch.entry_type === 'informe_tea' || ch.entry_type === 'informe' || ch.entry_type === 'informe_clinico') eventType = 'document';
    else if (ch.entry_type === 'derivacion') eventType = 'referral';
    else if (ch.entry_type === 'evaluacion') eventType = 'document';
    else if (ch.entry_type === 'diagnostico') eventType = 'diagnosis';
    else if (ch.entry_type === 'plan_tratamiento') eventType = 'plan';
    // All session-like types stay as 'session'

    // Build title — for derivaciones include professional, for sessions with embedded referral add indicator
    let entryTitle = ch.summary || entryTypeLabels[ch.entry_type] || ch.entry_type || 'Sesión';
    let entrySummary = ch.session_notes || null;
    const hasEmbeddedReferral = ch.details?.referral && ch.entry_type !== 'derivacion';

    if (ch.entry_type === 'derivacion' && ch.details) {
      const refType = ch.details.referral_type;
      const refName = ch.details.referred_professional_name;
      const refReason = ch.details.referral_reason;
      const typeLabel = REFERRAL_TYPE_LABELS[refType] || refType;
      entryTitle = `Derivación a ${typeLabel}${refName ? ` — ${refName}` : ''}`;
      entrySummary = refReason || entrySummary;
    }

    events.push({
      id: `note-${ch.id}`,
      type: eventType,
      date: ch.entry_date?.split('T')[0] || ch.created_at?.split('T')[0],
      title: entryTitle,
      summary: entrySummary,
      therapistId: ch.therapist_id,
      therapistName: therapistMap[ch.therapist_id] || 'Terapeuta',
      visibility: vis,
      entryType: ch.entry_type,
      referral: hasEmbeddedReferral ? ch.details.referral : (ch.entry_type === 'derivacion' ? ch.details : null),
      raw: ch,
    });
  });

  // 3. Diagnósticos
  diagnoses.forEach(d => {
    events.push({
      id: `dx-${d.id}`,
      type: 'diagnosis',
      date: d.diagnosed_at || d.created_at?.split('T')[0],
      title: d.diagnosis_name || d.code || 'Diagnóstico',
      summary: d.description || d.notes || null,
      therapistId: d.therapist_id,
      therapistName: therapistMap[d.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: d,
    });
  });

  // 4. Planes terapéuticos
  plans.forEach(p => {
    events.push({
      id: `plan-${p.id}`,
      type: 'plan',
      date: p.created_at?.split('T')[0],
      title: p.name || p.plan_name || 'Plan terapéutico',
      summary: `Estado: ${p.status || 'activo'}${p.objectives_count ? ` · ${p.objectives_count} objetivos` : ''}`,
      therapistId: p.therapist_id,
      therapistName: therapistMap[p.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: p,
    });
  });

  // 5. Reportes de progreso → document
  progressReports.forEach(pr => {
    events.push({
      id: `progress-${pr.id}`,
      type: 'document',
      date: pr.generated_at?.split('T')[0] || pr.created_at?.split('T')[0],
      title: 'Reporte de progreso',
      summary: pr.shared_with_patient ? 'Compartido con paciente' : 'No compartido',
      therapistId: pr.therapist_id,
      therapistName: therapistMap[pr.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: pr,
    });
  });

  // 6. Notiz (transcripciones de voz) → merged into 'session'
  notizSessions.forEach(n => {
    events.push({
      id: `notiz-${n.id}`,
      type: 'session',
      date: n.created_at?.split('T')[0],
      title: 'Sesión — nota de voz',
      summary: n.soap_note ? n.soap_note.substring(0, 150) + '...' : null,
      therapistId: n.therapist_id,
      therapistName: therapistMap[n.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: n,
    });
  });

  // 7. Evaluaciones ADOS-2
  const adosLabels = { autismo: 'Autismo', espectro_autista: 'Espectro Autista', no_tea: 'No TEA', moderada_severa: 'Moderada-Severa', leve_moderada: 'Leve-Moderada', poco_ninguna: 'Poco/Ninguna' };
  ados2Evaluations.forEach(ev => {
    events.push({
      id: `ados2-${ev.id}`,
      type: 'document',
      date: ev.fecha_evaluacion,
      title: `Evaluación ADOS-2 (Módulo ${ev.module})`,
      summary: ev.rango_preocupacion ? `Resultado: ${adosLabels[ev.rango_preocupacion] || ev.rango_preocupacion}` : null,
      therapistId: ev.therapist_id,
      therapistName: therapistMap[ev.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: ev,
    });
  });

  // 8. Evaluaciones ADI-R
  const adirLabels = { autism: 'Cumple criterios Autismo', non_spectrum: 'No espectro', inconclusive: 'No concluyente' };
  adirEvaluations.forEach(ev => {
    events.push({
      id: `adir-${ev.id}`,
      type: 'document',
      date: ev.fecha_evaluacion,
      title: 'Evaluación ADI-R',
      summary: ev.clasificacion ? `Resultado: ${adirLabels[ev.clasificacion] || ev.clasificacion}` : null,
      therapistId: ev.therapist_id,
      therapistName: therapistMap[ev.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: ev,
    });
  });

  // 9. Perfil Sensorial
  const sensLabels = { tipico: 'Típico', leve: 'Diferencia Leve', moderado: 'Diferencia Moderada', significativo: 'Significativo' };
  sensorialEvaluations.forEach(ev => {
    events.push({
      id: `sensorial-${ev.id}`,
      type: 'document',
      date: ev.fecha_evaluacion,
      title: 'Perfil Sensorial',
      summary: ev.overall_classification ? `Resultado: ${sensLabels[ev.overall_classification] || ev.overall_classification}` : null,
      therapistId: ev.therapist_id,
      therapistName: therapistMap[ev.therapist_id] || 'Terapeuta',
      visibility: 'all',
      raw: ev,
    });
  });

  // Sort by date descending (most recent first)
  events.sort((a, b) => {
    const dateA = a.date || '1900-01-01';
    const dateB = b.date || '1900-01-01';
    return dateB.localeCompare(dateA);
  });

  return events;
};

/**
 * Agrupa eventos por mes/año para display
 */
export const groupByMonth = (events) => {
  const groups = {};
  events.forEach(event => {
    if (!event.date) return;
    const key = event.date.substring(0, 7); // '2026-03'
    if (!groups[key]) {
      try {
        const d = parseISO(event.date);
        groups[key] = {
          key,
          label: format(d, 'MMMM yyyy', { locale: es }),
          events: [],
        };
      } catch {
        groups[key] = { key, label: key, events: [] };
      }
    }
    groups[key].events.push(event);
  });

  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
};

/**
 * Stats del timeline
 */
export const getTimelineStats = (events) => {
  const therapists = new Set(events.map(e => e.therapistId).filter(Boolean));
  const sessions = events.filter(e => e.type === 'session').length;
  const diagnoses = events.filter(e => e.type === 'diagnosis').length;
  const plans = events.filter(e => e.type === 'plan').length;
  const firstDate = events.length > 0 ? events[events.length - 1].date : null;
  const lastDate = events.length > 0 ? events[0].date : null;

  return {
    totalEvents: events.length,
    therapistCount: therapists.size,
    sessions,
    diagnoses,
    plans,
    firstDate,
    lastDate,
  };
};