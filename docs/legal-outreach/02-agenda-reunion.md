# Agenda de reunión — 25 preguntas legales críticas

**Uso:** adjuntar al email inicial. El abogado/a se prepara leyéndolo antes de la reunión. En la reunión: usar como checklist vivo, marcar respuestas en vivo o diferidas.

---

## Contexto técnico para el abogado

DentalSpot es una app React SPA + Supabase (PostgreSQL) con hosting en Vercel. Datos en servidores de Supabase (AWS us-east-1 principalmente). Ecosistema más amplio "Communicare" que uniría múltiples SaaS de salud por especialidad.

---

## SECCIÓN 1 — TRIAGE IA COMO "GUÍA EDUCATIVA"

**1.1** ¿Qué lenguaje LEGAL específico debe usar el disclaimer del triage IA para que quede claro que es guía educativa y no diagnóstico médico, y que no se considere ejercicio ilegal de la odontología?

**1.2** ¿El output del IA puede mostrarse directamente al usuario o debe pasar por revisión de un dentista antes? (ej: "disclaimer por dentista supervisor" en papel)

**1.3** ¿El proyecto requiere registro ante el ISP (Instituto de Salud Pública) como software de dispositivo médico (SaMD), considerando que el triage es educativo y no diagnóstico?

**1.4** ¿La plataforma puede mencionar nombres de condiciones dentales comunes (caries, gingivitis, bruxismo) o sólo síntomas genéricos (dolor, sensibilidad, inflamación)?

**1.5** Si un paciente usa el triage, no sigue la recomendación de "ir al dentista", y luego tiene una emergencia dental, ¿qué responsabilidad civil y/o penal podría tener la plataforma?

**1.6** ¿Hay jurisprudencia chilena o casos relevantes sobre plataformas de guía médica IA (Symptomate, WebMD, Infermedica) operando en el país?

---

## SECCIÓN 2 — DATOS SENSIBLES (FOTOS, RADIOGRAFÍAS, PHI)

**2.1** ¿Las fotos dentales intraorales (sin rostro) son "datos sensibles de salud" según Ley 21.719? ¿Y si incluyen rostro parcial?

**2.2** ¿Cuánto tiempo MÁXIMO puedo almacenar:
- (a) datos de triage de usuarios ANÓNIMOS (sin registro)?
- (b) datos de triage de usuarios REGISTRADOS?
- (c) radiografías subidas?

¿Hay plazos legales o dependen de la política interna que yo defina en los términos?

**2.3** Si el paciente pide borrado (derecho ARCO), ¿cuáles son las excepciones por obligación de retención legal? ¿Cuánto tiempo debo conservar datos clínicos tras solicitud de borrado?

**2.4** El backend usa Supabase (servidores en AWS US). ¿La transferencia internacional de datos de salud chilenos a EEUU es permisible bajo Ley 21.719? ¿Qué cláusulas o DPA (Data Processing Agreement) necesito firmar con Supabase?

**2.5** Para el triage IA se evalúa usar un proveedor externo (OpenAI, Anthropic, Google). ¿Puedo enviar fotos dentales a esos proveedores? ¿Qué anonimización es exigible antes del envío? ¿O debo obligar a usar solo modelo propio/on-premise?

**2.6** ¿Está la encriptación en reposo obligatoria legalmente para los datos clínicos, o solo recomendada?

---

## SECCIÓN 3 — CONSENTIMIENTO DEL USUARIO

**3.1** ¿Qué consentimientos específicos y SEPARADOS necesito capturar?

Mi inventario tentativo:
- Cookies (esenciales vs analíticas vs marketing)
- Permiso cámara (triage)
- Permiso geolocalización (matching)
- Procesamiento IA de datos de salud
- Almacenamiento de radiografías
- Marketing por email / WhatsApp
- Compartir datos con dentista elegido

¿Alguno falta? ¿Alguno puede agruparse?

**3.2** ¿El formato "banner con checkbox granular + texto corto + link a política completa" es suficiente bajo Ley 21.719, o requiere firma específica documentada (como consentimiento informado del artículo 14 de Ley 20.584)?

**3.3** Edad mínima para usar la plataforma. ¿Si un menor de edad la usa, qué proceso de consentimiento del tutor/padre es exigible? (Código Civil + Ley 21.430 sobre derechos niños)

**3.4** Si el usuario revoca su consentimiento, ¿qué partes del historial se borran y qué partes quedan por obligación legal/contractual?

---

## SECCIÓN 4 — MARKETPLACE: PLATAFORMA + DENTISTAS + PACIENTES

**4.1** ¿La plataforma actúa legalmente como INTERMEDIARIO (marketplace) o como PRESTADOR DE SALUD? Esto define completamente el perfil de responsabilidad.

**4.2** Si paciente elige dentista X a través del matching: ¿qué datos clínicos viajan automáticamente al dentista? ¿Se necesita consentimiento específico para ESE dentista cada vez, o un consentimiento general "para el dentista que yo elija" es válido?

**4.3** ¿La plataforma tiene responsabilidad civil o solidaria por mala praxis del dentista? ¿Las cláusulas de limitación de responsabilidad son ejecutables en Chile ante tribunales?

**4.4** ¿Qué tipo de seguro corresponde contratar a la plataforma (D&O, responsabilidad civil profesional de la plataforma)?

**4.5** ¿Se puede exigir a los dentistas onboardeados seguro de responsabilidad civil profesional como requisito?

**4.6** ¿Cómo verificar el título profesional de un dentista? ¿Obligación legal de verificar o declaración jurada es suficiente inicialmente? ¿Base de datos de la Superintendencia de Salud / Colegio de Dentistas es de acceso público?

---

## SECCIÓN 5 — PAGOS, WALLET, TRIBUTARIO

**5.1** MercadoPago actúa como pasarela. Para suscripciones de dentistas: ¿qué requisitos de facturación, IVA y boletas aplican?

**5.2** A futuro, pagos paciente→dentista con split (comisión para la plataforma): ¿la plataforma emite factura al paciente o al dentista? ¿Qué retenciones tributarias aplican?

**5.3** Wallet para dentistas (mantener saldo a retirar): ¿requiere registro de la plataforma como entidad financiera? ¿KYC obligatorio?

**5.4** ¿La plataforma está obligada a retener impuestos de los dentistas pagados vía wallet? (boleta honorarios, impuesto global complementario)

---

## SECCIÓN 6 — REVIEWS Y CONTENIDO GENERADO POR USUARIOS

**6.1** ¿Responsabilidad legal de la plataforma por reviews falsas o difamatorias publicadas por pacientes?

**6.2** ¿Qué nivel de moderación proactiva es exigible vs reactiva? (Ley del consumidor 19.496)

**6.3** Si un dentista demanda a un paciente por review negativa, ¿la plataforma puede ser citada a entregar datos del paciente?

---

## SECCIÓN 7 — WHATSAPP Y EMAIL MARKETING

**7.1** ¿Se requiere opt-in explícito SEPARADO para mensajes transaccionales (recordatorio de cita) vs mensajes promocionales (marketing)?

**7.2** ¿Cómo debe implementarse el unsubscribe para que sea "sencillo y gratuito" según Ley 21.719?

---

## SECCIÓN 8 — EXPANSIÓN ECOSISTEMA COMMUNICARE

**8.1** Estoy construyendo un ecosistema más amplio (Communicare) que uniría DentalSpot con otros SaaS de salud por especialidad (fonoaudiología, cardiología, neurología, etc.) vía un "Pasaporte Clínico Universal". ¿Qué consideraciones legales específicas aplican a ese diseño cross-especialidad que debo contemplar desde ahora?

---

## Instrucciones para la reunión

### Calibración inicial (primeros 10-15 min)

Antes de entrar a las 25 preguntas, hacer estas 3 preguntas de calibración:

1. **"¿Cómo has trabajado antes con plataformas digitales de salud en Chile? ¿Puedes darme ejemplos?"**
   - ✅ Responde con clientes reales (confidenciales pero con tipo de producto)
   - ⚠️ Responde "todavía no he hecho exactamente esto pero sé de datos personales"
   - 🚩 Responde "yo hago todo, desde cobranzas hasta salud digital"

2. **"¿Qué cambió para plataformas como la mía con la entrada en vigencia progresiva de la Ley 21.719 versus la 19.628?"**
   - ✅ Te explica las diferencias clave (consentimiento, transferencia internacional, sanciones, delegado de datos)
   - 🚩 "Básicamente es lo mismo pero actualizado"

3. **"¿Qué requisitos considera que aplican a software que da orientación médica educativa versus diagnóstico? ¿ISP es necesario?"**
   - ✅ Diferencia "educativa" vs "diagnóstica" + menciona clasificación SaMD + decreto pertinente
   - 🚩 "Todo software de salud necesita ISP"
   - 🚩 "Ningún software necesita nada"

**Decisión en este punto:**
- 3 ✅ → seguir la reunión completa
- 2 ✅ + 1 ⚠️ → seguir pero bajar el scope a "asesoría puntual" y no contratar redacción
- Cualquier 🚩 → terminar educadamente en 15 min con "te llamo para definir próximos pasos", y buscar otro abogado

### Template de notas en vivo por sección

```
SECCIÓN [#]: ______________________________

Pregunta clave: __________________________

Respuesta del abogado (literal):
_________________________________________
_________________________________________

Ley / normativa que citó: _________________

¿Respondió en vivo o difiere análisis?
[ ] En vivo    [ ] Difiere (estima ___ horas)

Red flag o cosa rara: _____________________
```

### Al cierre (minuto 75-90)

- [ ] Confirmar: ¿manda cotización escrita desglosada en 48-72 h?
- [ ] Canal de contacto (WhatsApp / email)
- [ ] NDA si compartiste detalles técnicos sensibles
- [ ] Pregunta final: **"Si tuvieras que hacer UNA cosa ANTES DE QUE YO ESCRIBA CÓDIGO, ¿cuál sería?"** — la respuesta te dice si está pensando estratégicamente
