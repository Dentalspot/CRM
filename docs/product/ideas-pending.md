# Ideas Pending — DentalSpot

**Última actualización**: 2026-05-21

Brainstorm liviano. Cada idea se anota con el mínimo necesario para no olvidarla. Cuando una idea madura (se decide priorizar), se promueve a `feature-backlog.md` con formato completo o se arranca spec directo.

**Reglas del doc:**
- 1 idea = 1 sección `##`
- Formato mínimo: **Qué** (1 línea), **Por qué** (1 línea), **Flow base** si aplica, **Abiertas** (preguntas sin resolver)
- Sin estimaciones de tiempo, sin código, sin tablas pesadas
- Las ideas que se descartan no se borran — se marca `[descartada YYYY-MM-DD]` y se deja la razón (memoria histórica)
- Las ideas que se promueven se marcan `[promovida YYYY-MM-DD → spec NNN]`

---

## Self-booking link público por dentista/clínica

**Qué**: cada dentista/clínica genera un link único compartible. Paciente abre → ve agenda 14 días → elige slot → se auto-agenda.

**Por qué**: hoy todo agendamiento pasa por el dentista o asistente (manual). Esto reduce fricción para captar pacientes nuevos y mueve trabajo administrativo afuera.

**Flow base**:
1. Dentista comparte link único (ej. `dentalspot.cl/agendar/<dentist_token>`)
2. Paciente ve agenda de 14 días con slots libres (respeta `working_hours` + `blocked_times`)
3. Elige slot
4. Form post-slot: nombre + RUT + email
5. Submit → crea `patients` asignado a ese dentista + crea `appointment` + dispara reminder (trigger `auto_schedule_reminders` ya lo hace solo)

**Abiertas**:
- Email duplicado: misma clínica (idempotent vs bloquear) / otra clínica (crear nuevo patient row) / cuenta profesional (bloquear "este email tiene cuenta de dentista/asistente")
- Consentimiento clínico Ley 20.584: pre-firma online en el mismo form vs firma presencial en primera cita
- Confirmación post-booking: email con detalles + link cancelación con token único
- Captcha anti-spam-bots
- Validación RUT chileno (dígito verificador) en el form
- Race condition: 2 pacientes piden mismo slot al mismo tiempo — DB constraint o RLS check de overlap
- Link único por dentista vs link único por clínica con dropdown de dentistas (¿o los dos?)
- Privacidad: slots ocupados se muestran solo como "no disponible", nunca nombre/email del otro paciente

---

## Triage IA + derivación a especialista DentalSpot más cercano

**Qué**: paciente describe síntoma → IA identifica qué especialidad necesita → muestra mapa con **dentistas DentalSpot pagantes** de esa especialidad cerca del paciente → paciente agenda directo. NO es información genérica: es **marketplace dirigido por triage** que monetiza la membresía del dentista.

**Por qué (doble valor)**:
- **Para el paciente**: resuelve la duda "¿a quién busco?" sin tener que entender vocabulario odontológico. Captura leads que no sabían si necesitaban ir al dentista
- **Para el dentista pagante**: es la razón directa para pagar membresía. Quien paga aparece en el mapa cuando el triage detecta su especialidad. Sin pagar, no entras al pool. Esto define el modelo de monetización
- **Para DentalSpot**: diferenciador fuerte vs Doctoralia (Doctoralia conecta paciente↔profesional pero NO hace triage previo) y vs competidores CL

**Flow base**:
1. Paciente entra a `/sintomas` (público — no requiere login)
2. Acepta uso de ubicación (geolocation API o ingresa comuna manual)
3. Ve grid de chips con síntomas comunes (sangrado, diente flojo, dolor intenso, hinchazón, etc.) + opción "Describir en mis palabras"
4. Click en chip → 3-4 preguntas de severidad/duración/edad (decision tree)
5. IA mapea a especialidad necesaria:
   - dolor intenso pulpar → endodoncista o urgencias 24/7
   - sangrado de encías crónico → periodoncista
   - diente fracturado por trauma → urgencias 24/7
   - dolor al masticar / sensibilidad leve → dentista general
   - estética → odontólogo estético
   - niño con caries → odontopediatra
6. **Output: mapa con dentistas DentalSpot de esa especialidad ordenados por distancia + horario disponible**
7. Click en dentista → ficha con foto + experiencia + tarifa + agenda → CTA "Agendar" (deep-link a self-booking link)
8. **Red-flag exception**: si síntoma es grave (trauma masivo, fiebre + hinchazón facial, sangrado incontrolable) → NO mostrar marketplace, mostrar "**Anda a urgencia hospitalaria ahora**" con link a urgencia dental pública más cercana. Esta capa va PRIMERO que el marketplace, no negocia con monetización.

**Abiertas**:

**Legal / compliance (lo más crítico)**:
- Framing: el output debe ser SIEMPRE "recomendación de servicio / especialidad" (orientación), nunca afirmación clínica ("podrías tener X"). Disclaimer prominente: "Esto no es diagnóstico médico. Consulta a un profesional."
- Código Sanitario art. 113 Chile: diagnóstico solo lo emite profesional habilitado. Triage / orientación NO es diagnóstico si se cumple framing.
- **Transparencia comercial (Ley del Consumidor + SERNAC)**: el paciente debe saber que ve solo dentistas DentalSpot, no la red completa de Chile. Disclaimer: "Estos son nuestros profesionales asociados certificados" o similar. Si no, riesgo de denuncia por publicidad engañosa.
- Ley 21.719: los síntomas son **datos de salud (categoría especial)**. Si los guardamos en DB → necesita consentimiento explícito + retención limitada + finalidad clara. Geolocation también es PII. Alternativa MVP: NO guardar conversación ni ubicación, solo el output anonimizado para analytics.
- **Conflicto de interés**: derivar por afinidad económica (membresía) en lugar de criterio clínico puro es ético si está declarado. Si no, problema. La regla: el filtro "especialidad necesaria" debe ser clínico; entre dentistas de la misma especialidad, el orden puede ser comercial (cerca + agenda + plan premium). Sin ranking pagado mezclado con criterio clínico.
- Pediatría: si edad <18 declarada → derivar siempre a odontopediatra o evaluación profesional, no auto-resolutivo.
- Red flags clínicos: **siempre** ganan sobre el marketplace. Lista curada por dentista asesor.

**Producto / arquitectura**:
- Decision tree (predefinido, curado por dentista asesor) vs LLM en chat libre. Híbrido recomendado: tree para casos comunes (70-80% cobertura sin LLM), LLM solo para "describir en mis palabras"
- Si LLM: DeepSeek API → datos pueden salir de Chile (PRC), problemático para data de salud. Alternativas: OpenAI EU residency, Mistral self-hosted, modelo local
- Output del LLM forzado a JSON estructurado: `{specialty: 'endo'|'perio'|'general'|'pedo'|'estetic'|'cirugia'|'urgencia_24_7', severity: 'red_flag'|'urgent'|'routine'|'elective', age_group: 'child'|'adult', message: 'corta orientación'}`. Sin chat libre.
- Mapa: Leaflet ya está en stack (`src/components/clinic/ClinicSearchStep.jsx` ya lo usa). Reusable
- Geolocation: `navigator.geolocation` con fallback a input manual de comuna
- Sinergia con self-booking link: el deep-link al dentista usa la misma feature

**Marketplace / DB**:
- Nuevo flag en `profiles` (o nueva tabla): `attends_emergencies_24_7` boolean — dentistas declaran si atienden urgencias 24/7. Verificación posterior (auto-declarado al inicio, con sanción si falso reporte)
- Ya existe `specialties` table + `therapist_specialties` (M:N). Reusar
- Ya existe `clinics.location` (lat/lng) usado en search. Reusar
- Query base: `dentistas WHERE specialty = X AND clinic_location WITHIN N km de paciente AND membership_active = true ORDER BY distance + agenda_disponibilidad + plan_tier`
- ¿Distancia con PostGIS o cálculo client-side con haversine? PostGIS más correcto pero requiere extensión. Hoy probablemente client-side
- Pool vacío (no hay dentistas de esa especialidad cerca): mostrar fallback "no hay [endodoncistas] en tu zona. Mostramos dentistas generales más cercanos" + opción "ampliar radio"

**Negocio**:
- Modelo: planes de membresía gating. Plan base = aparece en mapa para su comuna. Plan premium = top de la lista, más radio, más leads.
- Métrica clave: **lead → cita efectiva conversion rate** por dentista. Si un dentista paga premium pero su agenda está siempre llena (no se puede agendar), debería bajar en ranking
- Pacientes recurrentes: si un paciente ya tiene dentista asignado en otra clínica DentalSpot, ¿qué muestra el triage? ¿Su dentista actual + alternativas? ¿Solo alternativas si la consulta requiere otra especialidad?

**Métricas a trackear**:
- Funnel: entra → completa triage → ve mapa → click dentista → agenda → asiste
- Red flag rate (% derivados a urgencia hospitalaria)
- Match precision: cuando agenda, el dentista confirma que la especialidad sugerida coincide con lo que necesitaba el paciente
- Conversion lift por plan de membresía (¿premium triplica leads vs base?)

---

## Asistente virtual del dentista (secretaria IA 24/7)

**Qué**: chatbot que actúa como "secretaria del dentista". Responde 24/7 a pacientes vía chat sobre **precios, servicios, horarios, agenda disponible**. Conectado a la agenda del dentista (puede ofrecer slots y agendar con confirmación). Cada dentista configura **qué puede contestar y qué no** con toggles (precios públicos sí/no, ofrecer agenda sí/no, mostrar testimonios sí/no, etc.). Se vende como **paquete adicional pagado** sobre la membresía base.

**Conexión con el backlog existente**: hay una entry en `feature-backlog.md` ("WhatsApp — Recordatorios + Asistente IA" Fase 2) que pre-anuncia algo similar pero acotado a WhatsApp. Esta idea es la versión **multicanal y completa** (web chat embed + WhatsApp + futuro voz). Cuando madure, posiblemente colapsa con esa entry como un solo feature.

**Por qué (triple valor)**:
- **Para el paciente**: respuestas inmediatas a las 3 dudas que más bloquean conversión (¿cuánto cuesta?, ¿tienes hora esta semana?, ¿atiendes mi previsión?). Hoy esas dudas mueren si el dentista no contesta WhatsApp en ~2h
- **Para el dentista**: deja de perder leads por estar trabajando con paciente en silla. Es literalmente una secretaria virtual que no duerme, no se enferma, no pide aumento
- **Para DentalSpot**: revenue stream predecible (suscripción add-on). Es el upsell natural del plan base. Análogo a Calendly Premium / Acuity

**Flow base (web chat)**:
1. Paciente está en la ficha pública del dentista (vía mapa de triage, o link self-booking, o búsqueda) y abre el chat
2. Bot saluda con tono configurable: "Hola, soy el asistente de Dra. X. ¿En qué te puedo ayudar?"
3. Paciente pregunta — bot responde solo si la respuesta vive en una de las "fuentes verificadas" del dentista:
   - Precios de servicios (tabla `therapist_services` con precio público sí/no)
   - Horarios de atención (`working_hours`)
   - Slots disponibles próximos 14 días (agenda)
   - Previsiones aceptadas (FAQ configurada)
   - Ubicación / cómo llegar (`clinics.location`)
   - Otros FAQs custom (10-15 preguntas que el dentista escribe + respuesta canónica)
4. Si el paciente pregunta algo fuera de las fuentes (ej. "¿puedo hacerme una limpieza con brackets?"), bot escala: "Esa duda específica prefiere responderla la Dra. directo. ¿Quieres que te contacte?" → recoge teléfono → crea tarea en dashboard del dentista
5. Si el paciente quiere agendar y el dentista tiene toggle "agenda autónoma ON" → bot ofrece slots → paciente elige → bot confirma con "tu cita queda preconfirmada, en próximas 4h la Dra. la confirma definitivamente" → dentista recibe push, confirma con 1 click
6. Si el dentista tiene toggle "agenda autónoma OFF" → bot dice "le voy a avisar a la Dra. que querés agendar, te contactará pronto" → crea lead en dashboard

**Toggles que controla el dentista** (vista config en su dashboard):
- "Mostrar precios públicos": SÍ (mostrar `therapist_services.price` cuando el paciente pregunte) / NO (decir "te paso por mensaje cuando esté disponible")
- "Agenda autónoma": SÍ (puede agendar con preconfirmación) / NO (solo deriva como lead)
- "Atender preguntas clínicas": SÍ (intenta responder en base a FAQ médicos genéricos) / NO (siempre escala — recomendado)
- "Horario activo del bot": 24/7 vs "solo fuera de horario laboral" (cuando dentista no está)
- "Tono": formal / cercano / muy informal
- "Idioma": español chileno por defecto, futuro inglés para turismo dental
- "Saludo personalizado": texto custom

**Abiertas**:

**Legal / compliance**:
- Precios mostrados: deben ser **vinculantes**. Si el bot dice "carilla $250.000" y el dentista cobra $350.000, eso es publicidad engañosa (Ley del Consumidor). Solución: precio sale de DB, NO se infiere por LLM. Cualquier ambigüedad ("desde", "según caso") debe estar declarada
- Diagnóstico: toggle "atender preguntas clínicas" desactivado por default. Si está activo, el bot tiene **mismo guardrail que el triage**: nunca diagnostica, solo orienta a consulta. Mismo riesgo Código Sanitario art. 113
- PHI: paciente puede compartir síntomas, alergias, medicaciones en el chat. **No almacenar como datos clínicos identificables sin consentimiento**. Conversación se borra a 30 días por default, o se asocia a un patient si el paciente decide registrarse (con consent explícito)
- Ley 21.719: transcripción de chat es categoría especial si tiene síntomas. Misma política que triage
- Transparencia: paciente debe saber que habla con bot, no con persona. Disclaimer al inicio: "Soy un asistente automatizado. Para casos complejos, te derivo a la Dra. directamente."
- Auditoría: cada conversación queda loggeada y el dentista puede revisarla. Si el bot dijo algo mal → dentista puede "marcar como corrección" → se ajusta la respuesta canónica

**Producto / arquitectura**:
- LLM: necesita ser inteligente para entender preguntas variadas. OpenAI GPT-4o-mini parece sweet spot. Costo estimado: ~$2-3 USD/dentista/mes con uso normal (50-100 conversaciones)
- **Approach RAG vs fine-tune**: RAG sobre las "fuentes verificadas" del dentista (servicios, horarios, FAQs custom). No fine-tune por dentista (caro, frágil). El prompt se compone dinámicamente con las fuentes habilitadas
- Edge function `dentist-chat` que recibe mensaje → consulta DB del dentista (servicios + agenda + FAQ) → construye prompt → llama LLM → guardrails de output → responde
- Latencia objetivo: <3s por mensaje
- Rate limit: max 20 mensajes / IP / hora para evitar abuso. Después captcha
- Multicanal: arrancar con widget web embebible en ficha del dentista. WhatsApp Business API (vía Twilio o Cloud API direct) como Fase 2 — más caro pero más conversión
- Embed widget: `<script src="https://dentalspot.cl/chat/dr-xxx.js"></script>` que el dentista pone en su sitio personal si tiene

**Negocio / pricing**:
- **Plan base dentista**: bot reactivo simple (preguntas FAQ predefinidas, sin LLM). Búsqueda por keyword. Gratis incluido
- **Plan secretaria IA** (addon): LLM conversacional + agenda autónoma + WhatsApp. Precio sugerido: $25-40 USD/mes
- **Plan secretaria Pro**: + voz (recibe llamadas Twilio voice + transcribe + responde), $80-120 USD/mes. Fase 4
- ROI para dentista: 1 carilla agendada vía bot (~$300 USD ingreso) paga el plan 10 meses
- Modelo de prueba: 14 días free trial sobre el addon

**Métricas a trackear**:
- Mensajes / dentista / día
- Tasa de resolución autónoma (% que NO escala a dentista)
- Lead conversion (chat → cita agendada)
- Costo LLM real / dentista / mes (validar margen)
- Tiempo de respuesta promedio
- Satisfacción del paciente (CSAT al cerrar conversación)

**Riesgos específicos**:
- **El paciente piensa que habla con la Dra. en persona y se ofende cuando descubre que era bot**. Solución: disclaimer prominente + tono que admita serlo
- **Bot agenda cita pero dentista no la quería esa hora** (ej. paciente con caries enormes y bot agendó solo 30 min). Mitigación: toggle pre-confirmación + slots calibrados por servicio (servicios "complejos" requieren confirmación humana siempre)
- **Costo LLM se dispara con tráfico pico** (un paciente que pregunta 50 cosas). Mitigación: límite de mensajes por sesión, cuota mensual del dentista
- **Hallucination en precios u horarios**. Mitigación: prompt explícito "responde SOLO con datos de las fuentes provistas. Si no sabes, dice 'te respondo en breve'". Plus regex post-output para detectar números monetarios y validar contra DB

**Sinergias con otras ideas en pipeline**:
- **Triage IA** (idea anterior): el paciente llega al perfil del dentista vía triage. Si quiere más info antes de agendar → abre el chat. Mismo stack LLM
- **Self-booking link**: el chat puede llevar al paciente al self-booking link si elige horario, en vez de manejar agenda él mismo (separación de responsabilidades)
- **WhatsApp reminders Fase 1** (backlog formal): cuando esa feature avance, el bot se inserta en el mismo canal WhatsApp del dentista para responder mensajes entrantes (no solo enviar recordatorios)

---

## App descargable (Google Play + App Store)

**Qué**: DentalSpot disponible como app instalable desde Google Play (Android) y App Store (iOS). Hoy es solo web SPA en `dentalspot.cl`. Apuntar a que el paciente pueda buscar dentista, agendar y recibir recordatorios desde una app nativa con ícono en el home screen, push notifications reales, y experiencia que se sienta "como app" (no como sitio web abierto en el navegador).

**Por qué**:
- **Para el paciente**: descubrimiento orgánico vía stores (la gente busca "dentista" en Play Store igual que en Google). Push notifications de recordatorio funcionan mejor que email/SMS (más open rate). UX más fluida (no hay que escribir URL)
- **Para el dentista**: lo mismo + cuando recomienden DentalSpot a un paciente, "bajá la app" es más fácil que "andá al sitio y regístrate"
- **Para DentalSpot**: presencia en stores = legitimidad percibida + canal de distribución más fácil de pagar publicidad (Google Ads / Apple Search Ads)

**Opciones técnicas (ordenadas de menor a mayor esfuerzo)**:

| Approach | Esfuerzo | Costo recurrente | UX nativa | Stores |
|---|---|---|---|---|
| **PWA + "Add to Home Screen"** | ~días | $0 | Media (limitado por Safari iOS) | No, instala desde navegador |
| **PWA → TWA (Trusted Web Activity)** | ~1-2 sem | $25 one-time Play | Media (Android only) | Solo Google Play |
| **Capacitor wrap** del SPA actual | ~2-4 sem | $99/año Apple + $25 Play | Buena | Ambas |
| **React Native rewrite** | ~3-6 meses | Igual | Excelente | Ambas |

**Camino recomendado MVP** (cuando le des prioridad):
1. **Fase 1 — PWA** (~1 semana). Agregar `manifest.json` + service worker básico al SPA. Logo de DentalSpot como app icon. Paciente puede "instalar" desde Chrome/Safari sin pasar por store. Push notifications básicas vía Web Push (limitado en iOS pero funciona). **Cero costos recurrentes**
2. **Fase 2 — Capacitor wrap** (~2-3 semanas). Envolver el SPA con Capacitor → genera Android Studio project + Xcode project. Mismo codebase React. Bridges a push notifications nativas (FCM + APNs), cámara (para foto perfil), file system, location (mejor permisos que web). Subir a Play Store + App Store
3. **Fase 3 (opcional) — features nativas** (~mes). Touch ID / Face ID para login, mejor UX offline (agenda cacheada), widget de próxima cita en home screen. Solo si métricas justifican
4. **NO React Native rewrite** salvo que la UX wrap se sienta muy pobre — sería tirar mucho código React validado

**Abiertas / decisiones**:

**Apple Tax (la más importante de business)**:
- Apple cobra **30% el primer año, 15% del segundo** sobre cualquier suscripción que se cobre **dentro de la app** vía In-App Purchase
- Google Play tiene política similar pero con más flexibilidad (Play Billing alternatives en ciertos países, alternativa a $25 una sola vez)
- Workaround clásico: **no vender suscripciones dentro de la app**. El dentista paga membresía desde la **web** (`dentalspot.cl/upgrade`), después loguea en la app y ve plan activo. Apple permite esto (no podés *promocionar* el pago externo dentro de la app, pero podés permitir login con cuenta que ya pagó afuera)
- Riesgo: si Apple cambia política como en 2024 (Vision Pro) puede obligar IAP. Hay que monitorear

**Apple Review (obstáculo recurrente)**:
- Apps de "salud" requieren más documentación. Tarda 1-7 días el review inicial
- Necesita: privacy policy completa, descripción de cada permiso (location, push, camera), uso de data sensible declarado
- Si rechazo: hay que rebuildear y resubir. Loop puede durar semanas
- Sugerencia: pre-review checklist + leer las guidelines antes (Apple Health & Fitness category guidelines)

**Nombre de la app en stores**:
- En App Store no se permite "Dental" como descriptor médico si no estás verificado como entidad de salud. Hay que validar
- Sugerencia: nombre "DentalSpot — Agenda dentistas" o similar (no clínico)

**Identidad / permisos**:
- App icon: 1024×1024 (Apple) + múltiples sizes Android. Hay que generar a partir del logo (favicon ampliado no sirve, debe ser de alta resolución)
- Splash screen: pantalla inicial con logo (~2 seg mientras carga)
- Permisos: location (para mapa triage), push notifications (recordatorios), camera (para subir foto perfil/radiografía), file storage (descargar reportes). Cada permiso requiere copy de justificación en el store listing

**Deep linking / universal links**:
- `dentalspot.cl/agendar/dr-xxx` debería abrir la app si está instalada, fallback al navegador si no
- Necesita configurar `apple-app-site-association` (Apple) + `assetlinks.json` (Android) en `dentalspot.cl`
- Bueno para self-booking link feature (cuando se comparte link y el paciente tiene la app, abre nativo)

**Push notifications**:
- FCM (Firebase Cloud Messaging) gratis hasta volumen alto
- APNs (Apple Push Notification Service) gratis pero requiere certificados que se renuevan
- Edge function nueva `send-push-notification` que dispara desde el cron de reminders cuando paciente tiene la app instalada
- Tabla nueva: `user_device_tokens` (user_id, device_token, platform, last_used_at)

**Offline support**:
- Service worker cachea agenda del paciente, perfil del dentista, historial de citas
- Modo offline: paciente puede ver próxima cita aunque no tenga internet (útil cuando llega al consultorio sin señal)
- Editar agenda offline → sync cuando vuelve internet (riesgoso por conflictos, requiere optimistic UI + reconciliación)

**Actualización**:
- Versión web actualiza instant. App requiere review (24h-7 días). Estrategia:
  - **Features críticas vivienn como web wrap** → actualización via deploy normal
  - **Features que cambian shell nativo** (push handling, deep links) → release de app
  - **OTA updates** (Capacitor Live Updates / EAS Update) → permite pushear cambios JS sin pasar por store. Hay matices legales (Apple prohíbe cambios sustanciales sin review)

**Compliance específico de stores**:
- **Apple Health Data**: si la app guarda data clínica, debe declarar uso, no monetizar la data, no compartir con third parties sin consentimiento. Ley 21.719 ya nos exige eso → cumplimos por default
- **Google Play Health Data**: política similar, requiere "Sensitive Permissions" declaration
- **Niños menores de 13**: si la app es accesible a menores → COPPA / Ley 21.719 + KidSafe + restricciones de ads. Solución: gate por edad al onboarding, no servir a menores directos (paciente menor accede via padre/tutor)

**Costos esperados (recurrentes)**:
- Apple Developer Program: $99 USD/año
- Google Play Developer: $25 USD one-time
- Push notifications: $0 (FCM + APNs gratis para nuestro volumen MVP)
- Hosting de la web sigue igual (Hostinger)
- Total: ~$10/mes promedio

**Métricas a trackear**:
- Install rate (visitantes de landing → install)
- DAU/MAU de app vs web
- Funnel: install → registro → primera cita agendada
- Retención día 1, 7, 30 (vs web equivalente)
- Crash-free rate (Sentry tiene mobile SDK)

**Sinergias con otras ideas en pipeline**:
- **Self-booking link**: si paciente tiene la app, deep link abre nativo (mejor UX que web mobile)
- **Triage IA**: si tiene app, push notification "encontramos un endodoncista cerca tuyo" cuando aparece nuevo dentista DentalSpot en su comuna
- **Secretaria IA**: notificaciones push de respuesta del bot (en vez de tener que abrir web)
- **WhatsApp** (backlog formal): app + WA cubren todos los canales — el dentista decide cuál priorizar

---
