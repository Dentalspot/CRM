/**
 * @file pacienteAltaSequence.js
 * Secuencia para paciente dado de alta (termino tratamiento)
 * Objetivo: felicitar, pedir referido, ofrecer membresia, recordar control 6 meses
 * Tono: celebratorio, agradecido, sin presion
 */

export const ALTA_SEQUENCE = {
  id: 'alta_paciente',
  name: 'Paciente Dado de Alta',
  trigger: 'on_patient_discharged',
  totalEmails: 3,
  durationDays: 10,

  emails: [
    // ═══════════════════════════════════════════════════════════
    // EMAIL 1 — DIA 0: FELICITACION + AGRADECIMIENTO
    // ═══════════════════════════════════════════════════════════
    {
      day: 0,
      subject: '¡Terminamos! Tu sonrisa quedó increíble 🎉',
      preheader: 'Gracias por confiar en nosotros',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <span style="font-size: 56px;">🎉</span>
    </div>

    <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; text-align: center;">
      ¡Felicitaciones, {{nombre}}!
    </h2>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Completaste tu tratamiento y quiero que sepas que fue un gusto
      atenderte. Cada sesión valió la pena y el resultado está a la vista 😊
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Recuerda que tu ficha clínica y todo tu historial quedan guardados
      en <strong>dentalspot.cl</strong>. Puedes revisarlos cuando quieras.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
        🦷 Consejos post-tratamiento:
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0;">
        → Mantén tu rutina de cepillado (3 veces al día)<br>
        → Usa hilo dental al menos una vez al día<br>
        → Evita alimentos muy duros las primeras semanas<br>
        → Agenda tu control de limpieza en 6 meses
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Si te surge cualquier duda sobre los cuidados, ya sabes que puedes
      escribirme por WhatsApp o por la plataforma.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 8px;">
      ¡Gracias por confiar en nosotros! 🙏
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0;">
      <strong>{{dentista_nombre}}</strong><br>
      Odontología Los Álamos
    </p>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos · Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a>
  </p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════
    // EMAIL 2 — DIA 3: MEMBRESIA + REFERIDOS
    // ═══════════════════════════════════════════════════════════
    {
      day: 3,
      subject: '{{nombre}}, tengo algo que te puede interesar',
      preheader: 'Un plan para que tu sonrisa se mantenga perfecta',
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
      Ahora que terminaste tu tratamiento, lo más importante es
      <strong>mantener</strong> los resultados. Y para eso creamos
      algo pensado en pacientes como tú:
    </p>

    <div style="background: linear-gradient(135deg, #f0fdfa, #e0f7fa); border-radius: 16px; padding: 24px; margin: 0 0 20px; border: 1px solid #b2dfdb;">
      <p style="color: #00695c; font-size: 16px; font-weight: 700; margin: 0 0 12px; text-align: center;">
        ✨ Membresía Dental Los Álamos
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0 0 12px;">
        → 2 limpiezas profesionales al año incluidas<br>
        → Control y revisión cada 6 meses<br>
        → Descuento preferencial en tratamientos<br>
        → Prioridad de agenda para urgencias<br>
        → Radiografía de control anual incluida
      </p>
      <div style="text-align: center;">
        <a href="{{membresia_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px;">
          Conocer la membresía →
        </a>
      </div>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Y otra cosa — si conoces a alguien que necesite un dentista,
      cuéntale de nosotros 😊 La mejor publicidad siempre es la
      recomendación de alguien que ya nos conoce.
    </p>

    <div style="background: #fef3c7; border-radius: 12px; padding: 16px; text-align: center; margin: 0 0 20px;">
      <p style="color: #92400e; font-size: 14px; font-weight: 600; margin: 0 0 4px;">
        🎁 Plan Amigo
      </p>
      <p style="color: #92400e; font-size: 13px; margin: 0;">
        Por cada amigo que venga de tu parte y se atienda,
        <strong>tú ganas una limpieza dental gratis</strong>.
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0;">
      Sin presión, solo si se da la oportunidad 🙂
    </p>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos · Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a>
  </p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════
    // EMAIL 3 — DIA 10: RECORDATORIO CONTROL 6 MESES
    // ═══════════════════════════════════════════════════════════
    {
      day: 10,
      subject: 'Agendé tu control para dentro de 6 meses — ¿te sirve?',
      preheader: 'Una limpieza a tiempo previene tratamientos costosos',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}}, último mensaje del ciclo de tu tratamiento 🙂
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Solo quiero recordarte que aunque ya terminamos, es importante
      que vuelvas en <strong>6 meses para un control y limpieza</strong>.
      Es la mejor forma de que todo se mantenga perfecto.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
        ¿Por qué es importante el control semestral?
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0;">
        → Detectamos problemas antes de que duelan (y sean caros)<br>
        → Eliminamos el sarro que el cepillo no alcanza<br>
        → Revisamos que tu tratamiento se mantenga estable<br>
        → Una limpieza a tiempo puede ahorrarte cientos de miles
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      ¿Quieres que te agende desde ya? Así no se te olvida.
      Solo dime qué horario te acomoda.
    </p>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Agendar mi control →
      </a>
    </div>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20agendar%20mi%20control%20de%20limpieza" style="color: #45b5c4; text-decoration: none; font-size: 13px; font-weight: 500;">
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
  ],
};

export default ALTA_SEQUENCE;
