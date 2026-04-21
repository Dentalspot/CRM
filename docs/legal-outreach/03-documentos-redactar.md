# Documentos legales a redactar — scope + cotización

**Uso:** adjuntar al email inicial para que el abogado cotice cada documento por separado. Preferir **precio fijo** por documento (no hora abierta).

---

## 1. POLÍTICA DE PRIVACIDAD — VERSIÓN ACTUALIZADA

- **Estado:** existe versión v1, necesita actualización para Ley 21.719
- **Incluir:**
  - Tratamiento de datos del triage IA (fotos + respuestas)
  - Retención de radiografías
  - Transferencia internacional a proveedores IA
  - Uso de datos para mejora del servicio
  - Derechos ARCO (acceso, rectificación, cancelación, oposición)
  - Contacto del delegado de protección de datos si corresponde
  - Cookies (cruce con política de cookies separada)
  - Retención por cada tipo de dato
  - Base jurídica del tratamiento (consentimiento, contrato, interés legítimo)

## 2. TÉRMINOS Y CONDICIONES — PACIENTE

- **Estado:** nuevo
- **Incluir:**
  - Disclaimer del triage educativo (no diagnóstico médico)
  - Responsabilidades del paciente al usar el servicio
  - Limitaciones de responsabilidad de la plataforma
  - Uso del matching (geolocalización, criterio de ordenamiento)
  - Agendamiento de citas y políticas de cancelación
  - Cobros (cuando aplique pago paciente→dentista)
  - Jurisdicción y ley aplicable

## 3. TÉRMINOS Y CONDICIONES — DENTISTA (MARKETPLACE AGREEMENT)

- **Estado:** existe versión v1 incipiente, necesita refactor completo
- **Incluir:**
  - Requisitos de onboarding (título profesional, colegiatura, seguro de responsabilidad civil)
  - Obligaciones profesionales del dentista
  - Manejo de datos de paciente (obligación de confidencialidad, prohibición de uso fuera de la plataforma)
  - Comisiones y estructura de pagos
  - Pagos via plataforma (suscripción dentista + futuro split patient→dentista)
  - Wallet: términos de retiro, KYC, obligaciones tributarias
  - Sanciones por infracciones (review moderation, ghosting pacientes, etc.)
  - Rescisión del contrato

## 4. CONSENTIMIENTO INFORMADO — TRIAGE IA

- **Estado:** nuevo
- **Formato:** texto para mostrar en UI antes de iniciar el triage
- **Debe cumplir:**
  - Ley 20.584 art. 14 (consentimiento informado)
  - Ley 21.719 (datos sensibles)
- **Disclaimer central:** "este servicio es guía educativa, no diagnóstico"
- **Consentimientos granulares:**
  - Procesamiento de foto dental
  - Envío a proveedor IA externo (con anonimización si aplica)
  - Retención del dato
  - Recomendación de dentistas (cross-reference con política de matching)

## 5. POLÍTICA DE COOKIES + BANNER

- **Estado:** existe banner básico, necesita granularidad + actualización
- **Incluir:**
  - Clasificación de cookies (esencial / funcional / analítica / marketing)
  - Opciones granulares de opt-in por categoría
  - Link a política completa
  - Control de preferencias persistente (no solo en primera visita)

## 6. DATA PROCESSING AGREEMENT (DPA) — PROVEEDORES EXTERNOS

- **Estado:** nuevo, múltiples contrapartes
- **Contrapartes a revisar:**
  - Supabase (hosting + DB, servidores en AWS US)
  - Proveedor IA (OpenAI / Anthropic / Google — a decidir)
  - MercadoPago (pasarela de pagos)
  - Aggregator WhatsApp (Twilio / MessageBird — a decidir)
  - Email provider (Resend / Postmark — a decidir)
- **Tarea:** revisar DPAs estándar de cada proveedor y validar si son suficientes o requieren anexo específico para cumplir Ley 21.719

## 7. (OPCIONAL) POLÍTICA DE USO DE IA / TRANSPARENCIA ALGORÍTMICA

- **Estado:** nuevo, útil pero no obligatorio en Chile hoy
- **Explicar al usuario:**
  - Qué modelo IA se usa
  - Qué datos se envían
  - Cómo se procesan
  - Retención por parte del proveedor IA
  - Derecho del usuario a solicitar decisión humana (override)
- **Alineado con buenas prácticas UE AI Act** (no obligatorio en Chile, pero preparatorio para expansión internacional)

---

## Plantilla de pedido de cotización

Después de la reunión, enviar al abogado elegido:

```
Hola [Nombre],

Gracias por la conversación. Para avanzar, ¿me puedes enviar cotización
desglosada por cada ítem siguiente?

ASESORÍA PUNTUAL
  - 25 preguntas del agenda (documento 02) con memorándum escrito
    archivable por sección
  - Formato: precio total + horas estimadas + entregable

DOCUMENTOS (precio FIJO por cada uno, split 30/40/30 milestones)
  1. Política de privacidad (Ley 21.719 salud)
  2. T&C paciente B2C health
  3. T&C dentista / Marketplace Agreement
  4. Consentimiento informado triage IA (texto UI)
  5. Política de cookies + banner granular
  6. DPA review — Supabase + OpenAI/Anthropic (2 proveedores)
  7. (Opcional) Política de uso de IA

RETAINER
  - Plan Básico (2-4 h/mes): ¿costo mensual?
  - Plan Estándar (6-10 h/mes): ¿costo mensual?

DESCUENTOS DISPONIBLES
  - ¿Paquete completo: qué % de descuento?
  - ¿Startup Chile / CORFO: aplicamos?
  - ¿Pro-bono por componente de impacto social del ecosistema?

Mi presupuesto objetivo para Fase A (primeros 3 documentos + asesoría
puntual) es entre $[3M y $7M] CLP.

Saludos,
Danissa
```

---

## Comparación de cotizaciones (cuando tengas 2-3)

| Criterio | Abogado A | Abogado B | Abogado C |
|---|---|---|---|
| Respuestas a calibración (3 preguntas) | __/3 ✅ | __/3 ✅ | __/3 ✅ |
| Precio total paquete | $ | $ | $ |
| Precio asesoría puntual | $ | $ | $ |
| Precio retainer Básico | $ | $ | $ |
| Plazo entrega documentos | __ días | __ días | __ días |
| Confianza subjetiva (1-10) | __ | __ | __ |
| Red flags detectados | __ | __ | __ |
| Descuentos ofrecidos | | | |

**Regla de decisión:** si hay ≥15% diferencia de precio entre opciones, priorizar la MEJOR EN LAS 3 PREGUNTAS DE CALIBRACIÓN, no la más barata. Abogado malo barato = documentos inútiles = replantear todo en 6 meses.
