const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") ?? "https://fonokit.cl";

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
        from: "Fonokit <no-reply@fonokit.cl>",
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

      const { data: clinic } = await supabase.from("clinics").select("name, therapist_id").eq("id", clinic_id).single();
      if (!clinic || clinic.therapist_id !== user.id) throw new Error("Not clinic owner");

      const { data: profileMatch } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
      if (profileMatch) {
        const { data: existing } = await supabase.from("clinic_therapists").select("id").eq("clinic_id", clinic_id).eq("therapist_id", profileMatch.id).maybeSingle();
        if (existing) {
          return new Response(JSON.stringify({ success: false, message: "Ya es miembro" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      const { data: pendingInvite } = await supabase.from("clinic_invitations").select("id").eq("clinic_id", clinic_id).eq("email", email).eq("status", "pending").maybeSingle();
      if (pendingInvite) {
        return new Response(JSON.stringify({ success: false, message: "Ya existe invitacion pendiente" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = crypto.randomUUID();
      const inviteUrl = `${FRONTEND_URL}/invite/${token}`;

      const { data: inviterProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const inviterName = inviterProfile?.full_name || "Un administrador";

      const { error: insertError } = await supabase.from("clinic_invitations").insert({ clinic_id, email, token, message, invited_by: user.id, status: "pending" });
      if (insertError) throw insertError;

      const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0d9488,#0891b2);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:24px">FONOKIT</h1>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:#111827;font-size:20px">${inviterName} te invita a unirte a ${clinic.name}</h2>
          <p style="color:#6b7280;font-size:15px">Has sido invitado a formar parte del equipo clinico en Fonokit.</p>
          ${message ? `<div style="background:#f9fafb;border-left:3px solid #0d9488;padding:12px 16px;margin:16px 0"><p style="color:#374151;font-size:14px;margin:0">"${message}"</p></div>` : ""}
          <div style="text-align:center;margin:32px 0">
            <a href="${inviteUrl}" style="display:inline-block;background:#0d9488;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px">Aceptar Invitacion</a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center">Link: <a href="${inviteUrl}" style="color:#0d9488">${inviteUrl}</a></p>
        </div>
      </div>`;

      const emailResult = await sendEmail(email, `${inviterName} te invita a ${clinic.name}`, emailHtml);
      console.log("Email result:", JSON.stringify(emailResult));

      return new Response(JSON.stringify({ success: true, emailSent: emailResult.success }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
        return new Response(JSON.stringify({ success: false, message: "Invitacion invalida o expirada" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true, invitation: invite }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "accept") {
      if (!user) throw new Error("Debes iniciar sesion");
      const { token } = body;
      const { data: invite } = await supabase.from("clinic_invitations").select("*").eq("token", token).eq("status", "pending").single();
      if (!invite) throw new Error("Invitacion no valida");

      const { error: linkError } = await supabase.from("clinic_therapists").insert({ clinic_id: invite.clinic_id, therapist_id: user.id, is_active: true });
      if (linkError && !linkError.message.includes("duplicate key")) throw linkError;

      await supabase.from("clinic_invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invite.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
