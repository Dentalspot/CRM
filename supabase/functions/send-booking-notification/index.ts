// Edge function: notificación por email de una reserva online (self-booking).
// Envía 2 correos vía Resend al crear una reserva desde el perfil público:
//   1. Al paciente: "recibimos tu reserva, pendiente de confirmación"
//   2. Al dentista: "nueva reserva online pendiente de aprobar"
//
// Se invoca desde el frontend (LandingBookingCalendar) tras el RPC
// schedule_appointment_and_patient, pasando { appointment_id }.
// Lee la cita con service role (los pacientes guest no tienen sesión).

const ALLOWED_ORIGINS = [
  'https://dentalspot.cl',
  'https://www.dentalspot.cl',
  'http://localhost:3000',
  'http://localhost:5173',
];

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://dentalspot.cl';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is missing");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DentalSpot <no-reply@dentalspot.cl>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return { success: false, error: err };
    }
    return { success: true };
  } catch (err) {
    console.error("Email error:", err);
    return { success: false, error: err.message };
  }
};

const fmtDate = (dateStr: string) => {
  // dateStr 'yyyy-MM-dd' → 'dd/MM/yyyy' (evita parsing TZ)
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const baseWrap = (inner: string) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 520px; margin: 0 auto; color: #1e293b;">
    <div style="background:#0d9488; padding:20px 24px; border-radius:12px 12px 0 0;">
      <h1 style="color:#fff; margin:0; font-size:20px;">DentalSpot</h1>
    </div>
    <div style="border:1px solid #e2e8f0; border-top:none; border-radius:0 0 12px 12px; padding:24px;">
      ${inner}
    </div>
  </div>`;

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { appointment_id } = await req.json();
    if (!appointment_id) throw new Error("Falta appointment_id");

    const { data: appt, error } = await supabase
      .from("appointments")
      .select(`
        id, date, start_time, end_time, notes, modality_patient,
        patient:patients!appointments_patient_id_fkey(full_name, email),
        therapist:profiles!appointments_therapist_id_fkey(full_name, email),
        clinic:clinics(name, address)
      `)
      .eq("id", appointment_id)
      .single();

    if (error || !appt) throw new Error("Cita no encontrada");

    const patientEmail = appt.patient?.email || null;
    const patientName = appt.patient?.full_name || "Paciente";
    const dentistEmail = appt.therapist?.email || null;
    const dentistName = appt.therapist?.full_name || "el profesional";
    const clinicName = appt.clinic?.name || "";
    const clinicAddress = appt.clinic?.address || "";
    const fecha = fmtDate(appt.date);
    const hora = (appt.start_time || "").slice(0, 5);
    // Extraer "Motivo del paciente: ..." de notes
    const motivoLine = (appt.notes || "").split("\n").find((l: string) => l.startsWith("Motivo del paciente:"));
    const motivo = motivoLine ? motivoLine.replace("Motivo del paciente:", "").trim() : "";

    const detalleHtml = `
      <table style="width:100%; font-size:14px; margin:16px 0;">
        <tr><td style="padding:4px 0; color:#64748b;">Fecha</td><td style="padding:4px 0; font-weight:600; text-align:right;">${fecha}</td></tr>
        <tr><td style="padding:4px 0; color:#64748b;">Hora</td><td style="padding:4px 0; font-weight:600; text-align:right;">${hora} hrs</td></tr>
        ${clinicName ? `<tr><td style="padding:4px 0; color:#64748b;">Lugar</td><td style="padding:4px 0; font-weight:600; text-align:right;">${clinicName}${clinicAddress ? `<br><span style="font-weight:400; color:#94a3b8; font-size:12px;">${clinicAddress}</span>` : ""}</td></tr>` : ""}
        ${motivo ? `<tr><td style="padding:4px 0; color:#64748b;">Motivo</td><td style="padding:4px 0; font-weight:600; text-align:right;">${motivo}</td></tr>` : ""}
      </table>`;

    const results: Record<string, unknown> = {};

    // 1) Email al paciente
    if (patientEmail) {
      const html = baseWrap(`
        <h2 style="margin:0 0 8px; font-size:18px;">¡Recibimos tu reserva!</h2>
        <p style="margin:0 0 4px; color:#475569;">Hola ${patientName}, tu solicitud de cita con ${dentistName} quedó registrada.</p>
        ${detalleHtml}
        <div style="background:#fef9c3; border:1px solid #fde047; border-radius:8px; padding:12px; font-size:13px; color:#854d0e;">
          Tu reserva está <strong>pendiente de confirmación</strong> por parte del profesional. Te avisaremos cuando la confirme.
        </div>
      `);
      results.patient = await sendEmail(patientEmail, "Recibimos tu reserva — DentalSpot", html);
    }

    // 2) Email al dentista
    if (dentistEmail) {
      const html = baseWrap(`
        <h2 style="margin:0 0 8px; font-size:18px;">Nueva reserva online</h2>
        <p style="margin:0 0 4px; color:#475569;">${patientName} solicitó una cita a través de tu perfil público.</p>
        ${detalleHtml}
        <div style="background:#ecfeff; border:1px solid #a5f3fc; border-radius:8px; padding:12px; font-size:13px; color:#155e75;">
          Ingresá a tu agenda en DentalSpot para <strong>confirmar o rechazar</strong> esta reserva.
        </div>
      `);
      results.dentist = await sendEmail(dentistEmail, "Nueva reserva online pendiente — DentalSpot", html);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-booking-notification error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
