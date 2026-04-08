/**
 * @file pacienteNuevoBienvenida.js
 * Secuencia de bienvenida para paciente nuevo
 * Se dispara automaticamente al crear el paciente en el sistema
 * Tono: cercano, entusiasta, como recibirlo en tu casa
 */

export const BIENVENIDA_SEQUENCE = {
  id: 'bienvenida_paciente',
  name: 'Bienvenida Paciente Nuevo',
  trigger: 'on_patient_created',
  totalEmails: 3,
  durationDays: 5,

  emails: [
    // ═══════════════════════════════════════════════════════════
    // EMAIL 1 — DIA 0: BIENVENIDA + PRESENTACION
    // ═══════════════════════════════════════════════════════════
    {
      day: 0,
      subject: '¡Bienvenido/a! Soy tu dentista y esto es lo que necesitas saber',
      preheader: 'Todo lo que necesitas esta en un solo lugar',
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
      ¡Qué bueno tenerte como paciente! Soy {{dentista_nombre}} y desde
      ahora voy a estar a cargo de tu salud dental.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Te cuento que usamos <strong>DentalSpot</strong>, una plataforma
      donde vas a poder ver todo sobre tu tratamiento, agendar citas y
      comunicarte conmigo directo. Es bien fácil de usar y creo que te
      va a encantar 😊
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 12px;">
        ¿Qué encuentras en tu panel?
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 2; margin: 0;">
        📅 <strong>Mi Agenda</strong> — Tus próximas citas y horarios<br>
        📋 <strong>Mi Ficha Clínica</strong> — Tu historial completo y odontograma<br>
        💬 <strong>WhatsApp directo</strong> — Un botón para escribirme al toque<br>
        ❓ <strong>Blog y Preguntas</strong> — Publica tus dudas y te respondo
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Lo único que necesitas es entrar a <strong>dentalspot.cl</strong>
      con el mismo correo con el que te registraste. Ahí está todo.
    </p>

    <div style="text-align: center;">
      <a href="https://dentalspot.cl/dashboard" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Entrar a mi panel →
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
    // EMAIL 2 — DIA 2: BLOG + PREGUNTAS + WHATSAPP
    // ═══════════════════════════════════════════════════════════
    {
      day: 2,
      subject: '¿Sabías que puedes hacerme preguntas desde la plataforma?',
      preheader: 'También publico contenido sobre salud dental que te puede servir',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}}, te quiero contar algo que mis pacientes usan mucho
      y que seguro te va a servir.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
      En tu panel tienes una sección de <strong>Blog y Preguntas</strong>
      donde publico artículos sobre cuidado dental, tips post-tratamiento
      y novedades. Pero lo mejor es que también puedes
      <strong>escribirme tus dudas directamente</strong> y te respondo ahí mismo.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
        💡 Cosas que me puedes preguntar:
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0;">
        "¿Es normal que me moleste después del tratamiento?"<br>
        "¿Qué pasta dental me recomiendas?"<br>
        "¿Cada cuánto debería hacerme una limpieza?"<br>
        "¿Qué hago si se me cae una tapadura?"
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Y si necesitas algo más urgente, recuerda que en tu panel está
      el botón de <strong>WhatsApp directo</strong> para escribirme al toque.
    </p>

    <div style="border: 2px dashed #e5e7eb; border-radius: 12px; padding: 16px; text-align: center; margin: 0 0 24px;">
      <p style="color: #6b7280; font-size: 13px; margin: 0 0 4px;">🚨 <strong>¿Urgencia dental?</strong></p>
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        Escríbeme directo por WhatsApp — atendemos urgencias.
      </p>
      <a href="https://wa.me/56961003242?text=Hola%2C%20tengo%20una%20urgencia%20dental" style="display: inline-block; margin-top: 8px; background: #25D366; color: #ffffff; text-decoration: none; padding: 8px 20px; border-radius: 8px; font-weight: 600; font-size: 13px;">
        WhatsApp urgencias →
      </a>
    </div>

    <div style="text-align: center;">
      <a href="https://dentalspot.cl/dashboard/questions" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Ir al Blog y Preguntas →
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
    // EMAIL 3 — DIA 5: INSTAGRAM + COMUNIDAD
    // ═══════════════════════════════════════════════════════════
    {
      day: 5,
      subject: '¿Ya me sigues en Instagram? Publico cosas que te van a servir',
      preheader: 'Tips de cuidado dental, casos reales y novedades de la clínica',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}} 👋 último dato y no te molesto más por ahora, jaja.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Si usas Instagram, te invito a seguirme. Publico contenido sobre
      salud dental que a mis pacientes les sirve mucho:
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #4b5563; font-size: 14px; line-height: 2; margin: 0;">
        📸 Casos reales de antes y después<br>
        💡 Tips de cuidado que nadie te cuenta<br>
        🎥 Videos cortos explicando tratamientos<br>
        📢 Promociones exclusivas para seguidores
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="https://instagram.com/odontologialosalamos" style="display: inline-block; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Seguirme en Instagram →
      </a>
    </div>

    <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
        📋 Resumen de lo que tienes disponible:
      </p>
      <p style="color: #4b5563; font-size: 13px; line-height: 1.8; margin: 0;">
        ✅ Tu panel en <a href="https://dentalspot.cl/dashboard" style="color: #45b5c4;">dentalspot.cl</a> con ficha y agenda<br>
        ✅ Blog y preguntas directas a tu dentista<br>
        ✅ WhatsApp directo para urgencias<br>
        ✅ Instagram con tips y novedades
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
      Nos vemos en tu próxima cita 🙂
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0;">
      Un abrazo,<br>
      <strong>{{dentista_nombre}}</strong>
    </p>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos · Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a>
  </p>
</div>`,
    },
  ],
};

export default BIENVENIDA_SEQUENCE;
