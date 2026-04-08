/**
 * @file carillasDentalesSequence.js
 * Secuencia de 3 emails para Carillas Dentales 3D
 * Tono: conversacional, cercano, educativo — como hablarle a alguien que ya te conoce
 * Sin precios — objetivo: agendar evaluacion
 */

export const CARILLAS_SEQUENCE = {
  id: 'carillas_3d',
  name: 'Secuencia Carillas Dentales 3D',
  trigger: 'manual',
  totalEmails: 3,
  durationDays: 5,

  emails: [
    // ═══════════════════════════════════════════════════════════
    // EMAIL 1 — DIA 0: CURIOSIDAD + EDUCACION
    // "Oye, sabias que..."
    // ═══════════════════════════════════════════════════════════
    {
      day: 0,
      subject: '¿Resina o porcelana? La respuesta te va a sorprender',
      preheader: 'Spoiler: ambas dan excelentes resultados. La diferencia esta en los detalles.',
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
      Nos preguntan mucho: <em>"¿qué es mejor, resina o porcelana?"</em>
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      La verdad es que <strong>ambos materiales dan excelentes resultados</strong>.
      La diferencia está en algunos detalles técnicos, no en la calidad de tu sonrisa.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; line-height: 1.8; margin: 0;">
        <strong>Resina compuesta:</strong> Se aplica directo en el diente,
        ideal para correcciones pequeñas. Es más rápida y económica.<br><br>
        <strong>Porcelana (carillas 3D):</strong> Se diseña digitalmente y
        se fabrica a medida. Mayor durabilidad (10-15 años) y resistencia
        a manchas.
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      ¿Cuál es la mejor para ti? Depende de lo que necesites. No hay una
      respuesta universal — por eso hacemos una evaluación personalizada
      antes de recomendarte algo.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Si tenías esta duda, ahora ya sabes. Y si quieres que evaluemos
      tu caso, estamos aquí 😊
    </p>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20consultar%20sobre%20carillas" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Consultar por WhatsApp →
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
    // EMAIL 2 — DIA 2: CONTENIDO DE VALOR + DESMITIFICAR
    // "Te cuento como funciona el proceso"
    // ═══════════════════════════════════════════════════════════
    {
      day: 2,
      subject: 'Cómo es el proceso de carillas (sin tecnicismos)',
      preheader: 'Te lo explico como se lo explicaría a un amigo',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}}, mucha gente piensa que ponerse carillas es un proceso
      largo, doloroso o complicado. La realidad es bastante más simple:
    </p>

    <div style="margin: 0 0 24px;">
      <div style="margin-bottom: 20px;">
        <p style="color: #45b5c4; font-weight: 700; font-size: 13px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Paso 1</p>
        <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 4px;">Nos juntamos y evaluamos tu caso</p>
        <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
          Vemos qué necesitas, te escaneamos en 3D y te mostramos
          cómo quedaría tu sonrisa en pantalla. Antes de tocar nada,
          ya sabes cómo va a quedar.
        </p>
      </div>
      <div style="margin-bottom: 20px;">
        <p style="color: #45b5c4; font-weight: 700; font-size: 13px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Paso 2</p>
        <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 4px;">Se prepara el diente (mínimamente)</p>
        <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
          No es como una corona que desgasta todo. Las carillas 3D son
          ultra finas — el diente queda prácticamente igual.
        </p>
      </div>
      <div>
        <p style="color: #45b5c4; font-weight: 700; font-size: 13px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Paso 3</p>
        <p style="color: #1f2937; font-size: 15px; font-weight: 600; margin: 0 0 4px;">Se instalan y listo</p>
        <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
          Se pegan las carillas, se ajustan y sales con tu sonrisa nueva.
          Duran entre 10 y 15 años con buen cuidado.
        </p>
      </div>
    </div>

    <div style="background: #f9fafb; border-left: 4px solid #45b5c4; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
      <p style="color: #374151; font-size: 14px; font-style: italic; line-height: 1.6; margin: 0;">
        "Lo que más me gustó fue ver el resultado antes de empezar.
        Así tomé la decisión tranquila, sin presión."
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
        — Paciente, Temuco
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Si tienes dudas o quieres saber si las carillas son una buena
      opción para ti, escríbenos sin compromiso. Felices de orientarte 🙂
    </p>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20saber%20si%20las%20carillas%20son%20para%20mi" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Escribir por WhatsApp →
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
    // EMAIL 3 — DIA 5: INVITACION SUAVE + DISPONIBILIDAD
    // "Si te interesa, tenemos horarios esta semana"
    // ═══════════════════════════════════════════════════════════
    {
      day: 5,
      subject: '{{nombre}}, si te interesa te guardamos un horario esta semana',
      preheader: 'Evaluación de carillas sin costo y sin compromiso',
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
      Último mensaje sobre este tema, prometido 😄
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Si después de lo que te conté sobre las carillas te quedó la
      inquietud, te cuento que esta semana tenemos algunos horarios
      disponibles para evaluaciones.
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <p style="color: #1f2937; font-size: 14px; font-weight: 600; margin: 0 0 8px;">
        ¿Qué incluye la evaluación?
      </p>
      <p style="color: #4b5563; font-size: 14px; line-height: 1.8; margin: 0;">
        → Revisión de tu caso particular<br>
        → Diseño digital de tu sonrisa (la ves en pantalla)<br>
        → Te explicamos opciones y tiempos<br>
        → Sin compromiso — decides con calma en tu casa
      </p>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Si no es el momento, no pasa nada. Pero si ya lo estabas pensando,
      aprovecha de sacarte la duda de una vez 🙂
    </p>

    <div style="text-align: center; margin-bottom: 12px;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Ver horarios disponibles →
      </a>
    </div>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20agendar%20evaluación%20de%20carillas" style="color: #45b5c4; text-decoration: none; font-size: 13px; font-weight: 500;">
        o escríbenos por WhatsApp 💬
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

export default CARILLAS_SEQUENCE;
