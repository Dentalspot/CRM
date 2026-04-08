/**
 * @file pacienteInactivoSequence.js
 * Secuencia para paciente sin controles recientes
 * Se dispara cuando han pasado 5+ meses sin actividad
 * Objetivo: reagendar limpieza + plan amigo
 * Tono: cariñoso, recordatorio amable, incentivo con plan amigo
 */

export const INACTIVO_SEQUENCE = {
  id: 'paciente_inactivo',
  name: 'Paciente Sin Controles',
  trigger: 'on_patient_inactive_5months',
  totalEmails: 3,
  durationDays: 7,

  emails: [
    // ═══════════════════════════════════════════════════════════
    // EMAIL 1 — DIA 0: RECORDATORIO AMABLE
    // ═══════════════════════════════════════════════════════════
    {
      day: 0,
      subject: '{{nombre}}, ya pasaron varios meses... ¿cómo están esos dientes?',
      preheader: 'Un chequeo rápido puede ahorrarte mucho después',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Hola {{nombre}} 👋
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Hace un tiempo que no nos vemos y quería saber cómo estás.
      Espero que todo bien 🙂
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Te escribo porque ya se acerca (o ya pasó) tu fecha de
      <strong>control y limpieza semestral</strong>. Es el típico
      trámite que siempre postergamos, pero que hace una diferencia
      enorme para tu salud dental.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; line-height: 1.8; margin: 0;">
        Una limpieza profesional cada 6 meses:<br><br>
        ✅ Elimina el sarro donde el cepillo no llega<br>
        ✅ Detecta caries chicas antes de que crezcan<br>
        ✅ Previene enfermedades de encías<br>
        ✅ Te ahorra tratamientos costosos a futuro
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      ¿Te agendo un horario? Dura menos de una hora y vas a
      salir como nuevo/a 😁
    </p>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Agendar mi limpieza →
      </a>
    </div>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20agendar%20una%20limpieza" style="color: #45b5c4; text-decoration: none; font-size: 13px; font-weight: 500;">
        o escríbeme por WhatsApp 💬
      </a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos · Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a>
  </p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════
    // EMAIL 2 — DIA 3: PLAN AMIGO
    // ═══════════════════════════════════════════════════════════
    {
      day: 3,
      subject: 'Gana una limpieza gratis con el Plan Amigo 🎁',
      preheader: 'Invita a un amigo, si se atiende tú ganas una limpieza',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}}, te cuento algo que activamos para nuestros pacientes
      y que creo que te va a gustar:
    </p>

    <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; padding: 24px; margin: 0 0 20px; border: 1px solid #fbbf24; text-align: center;">
      <p style="font-size: 32px; margin: 0 0 8px;">🎁</p>
      <p style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0 0 8px;">
        Plan Amigo
      </p>
      <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
        Por cada amigo que invites y se atienda con nosotros,<br>
        <strong>tú ganas una limpieza dental gratis</strong> 🦷✨
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Es simple: si alguien viene de tu parte y se hace cualquier
      tratamiento, tu siguiente limpieza va por nuestra cuenta.
      Sin límite — si invitas 3 amigos, ganas 3 limpiezas.
    </p>

    <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
        ¿Cómo funciona?
      </p>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.8; margin: 0;">
        1️⃣ Le cuentas a tu amigo/a sobre nosotros<br>
        2️⃣ Cuando agende, que diga que viene de tu parte<br>
        3️⃣ Cuando se atienda, tú ganas tu limpieza gratis<br>
        4️⃣ Te avisamos para que la agendes cuando quieras
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Funciona mejor que cualquier descuento — ayudas a alguien que
      necesita un dentista y de paso cuidas tus propios dientes gratis 😊
    </p>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20saber%20más%20del%20Plan%20Amigo" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Quiero participar del Plan Amigo →
      </a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos · Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a>
  </p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════
    // EMAIL 3 — DIA 7: ULTIMO RECORDATORIO AMABLE
    // ═══════════════════════════════════════════════════════════
    {
      day: 7,
      subject: '¿Te reservo un horario esta semana? Quedan pocos',
      preheader: 'Última vez que te molesto con esto — prometido 😄',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}}, última vez que te escribo por esto, prometido 😄
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Solo quería preguntarte: <strong>¿quieres que te reserve un
      horario para tu limpieza esta semana?</strong>
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Sé que la agenda está complicada para todos, así que si me
      dices qué día y horario te acomoda, yo te lo separo y listo.
      Sin vueltas.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 16px; margin: 0 0 20px; text-align: center;">
      <p style="color: #1f2937; font-size: 14px; margin: 0;">
        ⏱️ Dura menos de 1 hora · 🦷 Sales como nuevo/a · 😊 Sin dolor
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Y recuerda — si invitas a un amigo con el <strong>Plan Amigo</strong>,
      tu limpieza es gratis 🎁
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      ¿Qué dices?
    </p>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Sí, agéndame →
      </a>
    </div>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20agendar%20mi%20limpieza" style="color: #45b5c4; text-decoration: none; font-size: 13px; font-weight: 500;">
        Responder por WhatsApp 💬
      </a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos · Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a>
  </p>
</div>`,
    },
  ],
};

export default INACTIVO_SEQUENCE;
