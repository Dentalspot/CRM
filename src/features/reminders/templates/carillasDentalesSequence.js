/**
 * @file carillasDentalesSequence.js
 * Secuencia de 3 emails para venta de Carillas Dentales 3D
 * Estrategia: Gancho emocional → Educacion + Social Proof → Urgencia + CTA
 * Sin precios — objetivo: agendar evaluacion gratuita
 */

export const CARILLAS_SEQUENCE = {
  id: 'carillas_3d',
  name: 'Secuencia Carillas Dentales 3D',
  trigger: 'manual', // Se dispara desde campana de marketing
  totalEmails: 3,
  durationDays: 5,

  emails: [
    // ═══════════════════════════════════════════════════════════
    // EMAIL 1 — DIA 0: GANCHO EMOCIONAL
    // ═══════════════════════════════════════════════════════════
    {
      day: 0,
      subject: '¿Te da vergüenza sonreír? Eso tiene solución',
      preheader: 'Miles de personas ya transformaron su sonrisa con carillas 3D',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; text-align: center;">
      ¿Te da vergüenza sonreír?
    </h2>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Hola {{nombre}},
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Si alguna vez te has tapado la boca al reír, has evitado fotos o sientes que
      tus dientes no reflejan quien realmente eres... no estás sola/o.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Las <strong>carillas dentales 3D</strong> son láminas ultra finas que se
      adhieren a tus dientes para corregir:
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <div style="color: #1f2937; font-size: 14px; line-height: 2;">
        ✅ Dientes manchados o amarillos<br>
        ✅ Espacios entre dientes (diastemas)<br>
        ✅ Dientes desalineados o irregulares<br>
        ✅ Dientes rotos o desgastados<br>
        ✅ Sonrisa despareja
      </div>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      El resultado es una sonrisa natural, armónica y diseñada especialmente
      para tu rostro. <strong>Sin dolor. Sin desgaste excesivo. En pocas sesiones.</strong>
    </p>

    <div style="text-align: center;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Quiero saber más →
      </a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos — Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a> ·
    <a href="https://wa.me/56961003242" style="color: #45b5c4; text-decoration: none;">WhatsApp</a>
  </p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════
    // EMAIL 2 — DIA 2: EDUCACION + SOCIAL PROOF
    // ═══════════════════════════════════════════════════════════
    {
      day: 2,
      subject: 'Así se ve una sonrisa con carillas 3D (antes y después)',
      preheader: 'El proceso es más simple de lo que crees',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; text-align: center;">
      ¿Cómo funciona el tratamiento?
    </h2>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
      Hola {{nombre}}, muchas personas nos preguntan si las carillas duelen,
      cuánto demoran o si se ven naturales. Te lo explico en 3 pasos:
    </p>

    <div style="margin: 0 0 24px;">
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <div style="background: #45b5c4; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">1</div>
        <div>
          <strong style="color: #1f2937; font-size: 14px;">Evaluación y diseño digital</strong>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0; line-height: 1.5;">
            Escaneamos tus dientes en 3D y diseñamos tu sonrisa ideal en pantalla.
            Ves el resultado ANTES de empezar.
          </p>
        </div>
      </div>
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <div style="background: #45b5c4; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">2</div>
        <div>
          <strong style="color: #1f2937; font-size: 14px;">Preparación mínima</strong>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0; line-height: 1.5;">
            A diferencia de las coronas, las carillas 3D requieren un desgaste
            mínimo. Tu diente se mantiene prácticamente intacto.
          </p>
        </div>
      </div>
      <div style="display: flex; gap: 12px;">
        <div style="background: #45b5c4; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;">3</div>
        <div>
          <strong style="color: #1f2937; font-size: 14px;">Instalación y sonrisa nueva</strong>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0; line-height: 1.5;">
            Se cementan las carillas y sales del consultorio con tu
            sonrisa transformada. Duran entre 10 y 15 años con buen cuidado.
          </p>
        </div>
      </div>
    </div>

    <div style="background: #f9fafb; border-left: 4px solid #45b5c4; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
      <p style="color: #374151; font-size: 14px; font-style: italic; line-height: 1.6; margin: 0;">
        "Llevaba años sin sonreír en fotos. Después de las carillas, no paro
        de hacerlo. El cambio fue increíble y el proceso súper rápido."
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0;">
        — Paciente de Odontología Los Álamos, Temuco
      </p>
    </div>

    <div style="text-align: center;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
        Agendar mi evaluación gratuita →
      </a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos — Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a> ·
    <a href="https://wa.me/56961003242" style="color: #45b5c4; text-decoration: none;">WhatsApp</a>
  </p>
</div>`,
    },

    // ═══════════════════════════════════════════════════════════
    // EMAIL 3 — DIA 5: URGENCIA + CTA FINAL
    // ═══════════════════════════════════════════════════════════
    {
      day: 5,
      subject: '{{nombre}}, quedan pocos cupos para evaluación de carillas este mes',
      preheader: 'Evaluación sin costo — agenda antes de que se llenen los horarios',
      body: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 48px;">🦷</span>
    <h1 style="color: #45b5c4; font-size: 24px; margin: 16px 0 0;">DentalSpot</h1>
  </div>

  <div style="background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; padding: 32px;">
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; text-align: center; margin: 0 0 24px;">
      <p style="color: #dc2626; font-size: 14px; font-weight: 600; margin: 0;">
        ⏰ Quedan pocos cupos disponibles este mes
      </p>
    </div>

    <h2 style="color: #1f2937; font-size: 22px; margin: 0 0 16px; text-align: center;">
      Tu sonrisa ideal está a una decisión de distancia
    </h2>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      {{nombre}}, te escribo por última vez sobre esto.
    </p>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
      Sabemos que transformar tu sonrisa es una decisión importante. Por eso
      te ofrecemos una <strong>evaluación sin costo</strong> donde:
    </p>

    <div style="background: #f0fdfa; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
      <div style="color: #1f2937; font-size: 14px; line-height: 2;">
        🔍 Evaluamos tu caso específico<br>
        💻 Te mostramos un diseño digital de tu sonrisa<br>
        📋 Te explicamos el tratamiento paso a paso<br>
        💰 Te damos un presupuesto transparente y sin sorpresas<br>
        🤝 Sin compromiso — decides con calma
      </div>
    </div>

    <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
      Los horarios de evaluación para carillas son limitados porque requieren
      tiempo dedicado del especialista. Este mes quedan pocos disponibles.
    </p>

    <div style="text-align: center; margin-bottom: 16px;">
      <a href="{{cta_url}}" style="display: inline-block; background: #45b5c4; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px;">
        Reservar mi evaluación gratuita →
      </a>
    </div>

    <div style="text-align: center;">
      <a href="https://wa.me/56961003242?text=Hola%2C%20quiero%20agendar%20una%20evaluación%20de%20carillas" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 600; font-size: 14px;">
        💬 Prefiero agendar por WhatsApp
      </a>
    </div>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 24px;">
    Odontología Los Álamos — Edificio K Business, Of. 1103, Temuco<br>
    <a href="https://dentalspot.cl" style="color: #45b5c4; text-decoration: none;">dentalspot.cl</a> ·
    <a href="https://wa.me/56961003242" style="color: #45b5c4; text-decoration: none;">WhatsApp</a>
  </p>
</div>`,
    },
  ],
};

export default CARILLAS_SEQUENCE;
