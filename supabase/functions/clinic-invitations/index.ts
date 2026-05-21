const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dentalspot.cl',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

      const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">DENTALSPOT</h1>
        </div>
        <div style="padding:32px 24px">
          ${roleBadge}
          <h2 style="color:#111827;font-size:20px;margin-top:8px">${headline}</h2>
          <p style="color:#6b7280;font-size:15px">${intro}</p>
          ${message ? `<div style="background:#f9fafb;border-left:3px solid #0d9488;padding:12px 16px;margin:16px 0"><p style="color:#374151;font-size:14px;margin:0">"${message}"</p></div>` : ""}
          <div style="text-align:center;margin:32px 0">
            <a href="${inviteUrl}" style="display:inline-block;background:#0d9488;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">Aceptar Invitación</a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Link: <a href="${inviteUrl}" style="color:#0d9488">${inviteUrl}</a></p>
          ${expirationNote}
        </div>
      </div>`;

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
