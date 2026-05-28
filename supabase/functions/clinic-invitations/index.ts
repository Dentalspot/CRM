// CORS dinámico: refleja el Origin del request si está en la allowlist.
// Permite prod (dentalspot.cl) + dev local (localhost:3000 / 5173). Sin esto,
// el preflight desde localhost falla porque el header hardcodeado a
// dentalspot.cl no matchea el origin de desarrollo.
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
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://dentalspot.cl";

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
    const result = await res.json();
    console.log("Email sent:", result.id);
    return { success: true };
  } catch (err) {
    console.error("Email error:", err);
    return { success: false, error: err.message };
  }
};

Deno.serve(async (req) => {
  // CORS headers calculados por request (refleja el Origin permitido).
  const corsHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action;
    console.log("Action:", action);

    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: u }, error } = await supabase.auth.getUser(token);
      if (!error && u) user = u;
      console.log("User:", user?.id || "none");
    }

    if (action === "create") {
      if (!user) throw new Error("Unauthorized");
      const { clinic_id, email, message } = body;

      // Spec 023: body.role determina tipo de invitación. Default 'therapist' para
      // backward compat con invitaciones existentes. Validamos valor.
      const role = body.role === "assistant" ? "assistant" : "therapist";

      const { data: clinic } = await supabase.from("clinics").select("name, therapist_id").eq("id", clinic_id).single();
      if (!clinic || clinic.therapist_id !== user.id) throw new Error("Not clinic owner");

      // Lookup email existente en profiles — decide validación por role + existing_patient flag
      const { data: profileMatch } = await supabase.from("profiles").select("id, role").eq("email", email).maybeSingle();

      // Validaciones específicas para role='assistant' (spec 023 FR-004)
      if (role === "assistant") {
        // Email ya profesional → error amable
        if (profileMatch?.role === "therapist" || profileMatch?.role === "clinic") {
          return new Response(JSON.stringify({
            success: false,
            message: "Este email ya tiene cuenta profesional. Contactá soporte si necesitás convertirlo."
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Rate limit: max 10 pending por clinic (spec 023 FR-006)
        const { count: pendingCount } = await supabase
          .from("clinic_invitations")
          .select("id", { count: "exact", head: true })
          .eq("clinic_id", clinic_id)
          .eq("status", "pending");

        if ((pendingCount ?? 0) >= 10) {
          return new Response(JSON.stringify({
            success: false,
            message: "Límite de 10 invitaciones pendientes alcanzado. Cancelá alguna antes de crear más."
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // Para role='therapist' preservamos el comportamiento legacy (bypass validations
      // arriba, solo check de duplicado en clinic_therapists)
      if (role === "therapist" && profileMatch) {
        // Solo bloquear si la membresía está ACTIVA. Si está inactiva (deleted/desinvitado),
        // permitir re-invitación (el accept la reactiva).
        const { data: existing } = await supabase
          .from("clinic_therapists")
          .select("id")
          .eq("clinic_id", clinic_id)
          .eq("therapist_id", profileMatch.id)
          .eq("is_active", true)
          .maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ success: false, message: "Ya es miembro" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      // Check invitación pendiente duplicada (para ambos roles, spec 023 FR-005)
      const { data: pendingInvite } = await supabase.from("clinic_invitations").select("id").eq("clinic_id", clinic_id).eq("email", email).eq("status", "pending").maybeSingle();
      if (pendingInvite) {
        return new Response(JSON.stringify({ success: false, message: "Ya existe invitación pendiente para este email." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = crypto.randomUUID();
      const inviteUrl = `${FRONTEND_URL}/invite/${token}`;

      const { data: inviterProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const inviterName = inviterProfile?.full_name || "Un administrador";

      // existing_patient flag (spec 023 FR-014): true si el email ya tiene cuenta de paciente
      const existingPatient = profileMatch?.role === "patient";

      // expires_at: 7 días para asistente, null para therapist (preserva legacy sin expiración)
      const expiresAt = role === "assistant"
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: insertError } = await supabase.from("clinic_invitations").insert({
        clinic_id,
        email,
        token,
        message,
        invited_by: user.id,
        status: "pending",
        role,
        expires_at: expiresAt,
        existing_patient: existingPatient,
      });
      if (insertError) throw insertError;

      // Email template branch por role (spec 023 FR-010 + research §R-07)
      const isAssistant = role === "assistant";
      const subject = isAssistant
        ? `${inviterName} te invita como asistente a ${clinic.name}`
        : `${inviterName} te invita a ${clinic.name}`;

      const headline = isAssistant
        ? `${inviterName} te invitó al equipo de ${clinic.name}`
        : `${inviterName} te invita a unirte a ${clinic.name}`;

      const intro = isAssistant
        ? `Como asistente administrativo podrás gestionar la agenda y el listado de pacientes de ${clinic.name}. La ficha clínica detallada queda reservada a los dentistas por normativa (Ley 20.584).`
        : "Has sido invitado a formar parte del equipo clínico en DentalSpot.";

      const roleBadge = isAssistant
        ? `<div style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:12px">🧑‍💼 ROL: ASISTENTE</div>`
        : `<div style="display:inline-block;background:#ecfdf5;color:#047857;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:12px">🦷 ROL: DENTISTA</div>`;

      const expirationNote = isAssistant
        ? `<p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:8px">Esta invitación expira en 7 días.</p>`
        : "";

      // Email rediseñado con estética Propuesta A (consistente con templates
      // de Supabase Auth) — logo horizontal, línea acento teal, footer claro.
      const emailHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f8fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f6f8fa;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.05),0 4px 16px rgba(0,0,0,0.04);overflow:hidden;">
          <tr>
            <td align="center" style="padding:40px 32px 24px 32px;">
              <img src="https://dentalspot.cl/logo-dentalspot-full.png" alt="DentalSpot" height="40" style="display:block;border:0;max-width:240px;">
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px;">
              <div style="width:48px;height:3px;background:linear-gradient(90deg,#14B8A6,#45b5c4);border-radius:2px;margin:0 auto;"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 32px 8px 32px;">
              ${roleBadge}
              <h1 style="margin:8px 0 0 0;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;line-height:1.3;">${headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 16px 40px;font-size:15px;line-height:1.7;color:#374151;">
              <p style="margin:0;">${intro}</p>
              ${message ? `<div style="background:#f8fafc;border-left:3px solid #14B8A6;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;"><p style="color:#374151;font-size:14px;margin:0;font-style:italic;">"${message}"</p></div>` : ""}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 32px 24px 32px;">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 36px;background-color:#14B8A6;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;letter-spacing:0.01em;box-shadow:0 1px 3px rgba(20,184,166,0.3);">Aceptar invitación</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
              ¿No funciona el botón? Copia este enlace:<br>
              <a href="${inviteUrl}" style="color:#14B8A6;word-break:break-all;">${inviteUrl}</a>
            </td>
          </tr>
          ${expirationNote ? `<tr><td style="padding:0 40px 24px 40px;">${expirationNote}</td></tr>` : ""}
          <tr>
            <td align="center" style="padding:24px 32px;background-color:#ffffff;border-top:1px solid #f1f5f9;font-size:11px;line-height:1.6;color:#94a3b8;">
              <p style="margin:0 0 8px 0;color:#475569;font-weight:600;font-size:13px;">DentalSpot</p>
              <p style="margin:0 0 12px 0;">La plataforma odontológica de Chile</p>
              <p style="margin:0;">
                <a href="https://dentalspot.cl/legal/politica-privacidad" style="color:#94a3b8;text-decoration:none;">Privacidad</a>
                &nbsp;·&nbsp;
                <a href="https://dentalspot.cl/legal/terminos-condiciones" style="color:#94a3b8;text-decoration:none;">Términos</a>
                &nbsp;·&nbsp;
                <a href="https://dentalspot.cl/contacto" style="color:#94a3b8;text-decoration:none;">Soporte</a>
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;margin-top:16px;">
          <tr>
            <td align="center" style="font-size:11px;color:#94a3b8;padding:0 32px;line-height:1.5;">
              DentalSpot SpA · Santiago, Chile · contacto@dentalspot.cl
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailResult = await sendEmail(email, subject, emailHtml);
      console.log("Email result:", JSON.stringify(emailResult));

      // Response incluye inviteUrl para fallback manual si emailSent=false
      return new Response(JSON.stringify({
        success: true,
        emailSent: emailResult.success,
        role,
        invite_url: inviteUrl,  // UI puede mostrarlo si falla delivery
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      if (!user) throw new Error("Unauthorized");
      const { clinic_id } = body;
      const { data: invitations, error } = await supabase.from("clinic_invitations").select("*").eq("clinic_id", clinic_id).order("created_at", { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, invitations }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "validate") {
      const { token } = body;
      const { data: invite, error } = await supabase.from("clinic_invitations").select("*, clinics(id, name, address)").eq("token", token).eq("status", "pending").single();
      if (error || !invite) {
        return new Response(JSON.stringify({ success: false, message: "Invitación inválida o ya fue usada" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Spec 023 FR-012: chequear expiración. Si expires_at existe y ya pasó → rechazar.
      // Invitaciones legacy de therapist pueden tener expires_at=null y siguen válidas (no cambiamos contrato).
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return new Response(JSON.stringify({
          success: false,
          message: "Invitación expirada. Pedile al admin que te envíe una nueva."
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Response incluye role + existing_patient para que frontend rutee correctamente
      // (signup nuevo vs login si ya era paciente)
      return new Response(JSON.stringify({ success: true, invitation: invite }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "accept") {
      if (!user) throw new Error("Debes iniciar sesion");
      const { token } = body;
      const { data: invite } = await supabase.from("clinic_invitations").select("*").eq("token", token).eq("status", "pending").single();
      if (!invite) throw new Error("Invitación no válida o ya aceptada");

      // Seguridad: la invitación solo puede aceptarla el dueño del email al
      // que fue enviada. Sin este check, cualquier usuario logueado (ej. el
      // clinic_admin que invitó) podía abrir el link y auto-agregarse con el
      // rol de la invitación. Bug detectado 2026-05-25.
      if ((user.email ?? "").toLowerCase().trim() !== (invite.email ?? "").toLowerCase().trim()) {
        return new Response(JSON.stringify({
          success: false,
          message: `Esta invitación fue enviada a ${invite.email}. Iniciá sesión con esa cuenta para aceptarla.`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Spec 023: chequear expiración antes de aceptar
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return new Response(JSON.stringify({ success: false, message: "Invitación expirada" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const inviteRole = invite.role || "therapist";
      let redirectTo = "/dashboard";

      if (inviteRole === "therapist") {
        // 1. Insert en clinic_therapists (legacy, preserva comportamiento).
        //    Si ya existe (re-invitación) reactivar.
        const { data: existingLink } = await supabase
          .from("clinic_therapists")
          .select("id, is_active")
          .eq("clinic_id", invite.clinic_id)
          .eq("therapist_id", user.id)
          .maybeSingle();

        if (existingLink) {
          if (!existingLink.is_active) {
            const { error: reactErr } = await supabase
              .from("clinic_therapists")
              .update({ is_active: true })
              .eq("id", existingLink.id);
            if (reactErr) throw reactErr;
          }
        } else {
          const { error: linkError } = await supabase.from("clinic_therapists").insert({
            clinic_id: invite.clinic_id,
            therapist_id: user.id,
            is_active: true
          });
          if (linkError && !linkError.message.includes("duplicate key")) throw linkError;
        }

        // 2. Insert/reactivar también en organization_members con role='dentist'
        //    (bug detectado en QA: faltaba este step → multi-org switching no
        //    veía la nueva org del dentista invitado, hot-fix manual via SQL).
        const { data: clinicForOrg } = await supabase
          .from("clinics")
          .select("organization_id, name")
          .eq("id", invite.clinic_id)
          .single();

        if (!clinicForOrg?.organization_id) {
          throw new Error("Clínica sin organización asociada (contacta a soporte).");
        }

        const { data: existingMembership } = await supabase
          .from("organization_members")
          .select("id, is_active")
          .eq("user_id", user.id)
          .eq("organization_id", clinicForOrg.organization_id)
          .eq("role", "dentist")
          .maybeSingle();

        if (existingMembership) {
          if (!existingMembership.is_active) {
            const { error: reactErr } = await supabase
              .from("organization_members")
              .update({ is_active: true, deactivated_at: null })
              .eq("id", existingMembership.id);
            if (reactErr) throw reactErr;
            console.log("Dentist membership reactivated:", existingMembership.id);
          } else {
            console.log("Dentist already active — idempotent accept:", existingMembership.id);
          }
        } else {
          const { error: insertOrgErr } = await supabase
            .from("organization_members")
            .insert({
              organization_id: clinicForOrg.organization_id,
              user_id: user.id,
              role: "dentist",
              is_active: true,
              invited_by: invite.invited_by,
            });
          if (insertOrgErr) throw insertOrgErr;
          console.log("Dentist membership created for user:", user.id);
        }

        redirectTo = "/dashboard/therapist";
      } else if (inviteRole === "assistant") {
        // Flow nuevo spec 023: insert/reactivate en organization_members
        const { data: clinic } = await supabase.from("clinics").select("organization_id, name").eq("id", invite.clinic_id).single();

        if (!clinic?.organization_id) {
          throw new Error("Clínica sin organización asociada (contacta a soporte). La migración foundational no se aplicó correctamente.");
        }

        // Check existing membership (para reactivación o idempotencia)
        const { data: existingMember } = await supabase
          .from("organization_members")
          .select("id, is_active")
          .eq("user_id", user.id)
          .eq("organization_id", clinic.organization_id)
          .eq("role", "assistant")
          .maybeSingle();

        if (existingMember) {
          if (!existingMember.is_active) {
            // Reactivar row inactivo (spec 023 FR-034)
            const { error: reactError } = await supabase
              .from("organization_members")
              .update({ is_active: true, deactivated_at: null })
              .eq("id", existingMember.id);
            if (reactError) throw reactError;
            console.log("Assistant membership reactivated:", existingMember.id);
          } else {
            console.log("Assistant already active — idempotent accept:", existingMember.id);
          }
        } else {
          // Insert nuevo row
          const { error: insertError } = await supabase
            .from("organization_members")
            .insert({
              organization_id: clinic.organization_id,
              user_id: user.id,
              role: "assistant",
              is_active: true,
              invited_by: invite.invited_by,
            });
          if (insertError) throw insertError;
          console.log("Assistant membership created for user:", user.id);
        }

        redirectTo = "/dashboard/assistant";
      } else {
        throw new Error(`Rol desconocido en invitación: ${inviteRole}`);
      }

      // Marcar invitación como aceptada
      await supabase.from("clinic_invitations").update({
        status: "accepted",
        accepted_at: new Date().toISOString()
      }).eq("id", invite.id);

      return new Response(JSON.stringify({
        success: true,
        role: inviteRole,
        redirect_to: redirectTo,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reject" || action === "cancel") {
      const { token: t, invite_id } = body;
      const newStatus = action === "cancel" ? "cancelled" : "rejected";
      let query = supabase.from("clinic_invitations").update({ status: newStatus, updated_at: new Date().toISOString() });
      if (action === "cancel") {
        if (!user) throw new Error("Unauthorized");
        query = query.eq("id", invite_id);
      } else {
        query = query.eq("token", t);
      }
      const { error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Action not supported" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
