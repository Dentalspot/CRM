# Feature Specification: Patient & Dentist Landings — restructure home en dos audiencias

**Feature Branch**: `claude/keen-mirzakhani-49256e` (worktree existente)
**Created**: 2026-05-26
**Status**: Draft (Phase 1 scope only)
**Input**: User description: ver carpeta `specs/027-patient-dentist-landings/` o el chat de la sesión Claude del 2026-05-26

## Clarifications

### Session 2026-05-26

- Q: Cuando un visitante en `/para-dentistas` clickea el logo del header, ¿a dónde va? (contradicción detectada entre FR-022 y US3 acceptance #3) → A: Logo siempre lleva a `/` (raíz patient), pero en `/para-dentistas` el logo se renderiza con un badge visual "para profesionales" al lado o debajo para que el visitante entienda en qué audiencia está. FR-022 mantiene "logo va a `/`"; US3 acceptance #3 se actualiza para reflejar el badge.
- Q: ¿Qué herramientas y eventos de analytics se trackean para validar los SC-003/004/006? → A: Meta Pixel (existente) + Google Analytics 4 (nuevo, instalar en Fase 1) con set completo de eventos: 6 eventos base (`patient_home_view`, `patient_hero_cta_click`, `patient_footer_to_dentist_click`, `dentist_home_view`, `dentist_hero_cta_register_click`, `dentist_hero_cta_demo_click`) + scroll depth (25/50/75/100%) + tiempo en página + click por sección visible + view de FAQ + click cross-link footer ambos lados. Implica nuevos FRs de instrumentación analytics.
- Q: ¿Qué hace el CTA "Ver demo" del dentist hero? → A: Eliminar el CTA "Ver demo". El hero tiene un único CTA "Crear cuenta gratis" para reducir fricción y enfocar la conversión en el registro. El evento `dentist_hero_cta_demo_click` se elimina del set de analytics.
- Q: ¿Cómo se renderiza la sección Pricing en Fase 1 (los planes reales aún no están definidos)? → A: Visión final: pricing transparente con planes + features por plan. Para Fase 1 (placeholder), se renderiza una sección minimalista con título "Precios" + breve copy ("Te armamos el plan que se ajusta a tu clínica — pronto vas a ver nuestros planes públicos") + un CTA "Hablanos para precios" que abre un mailto a contacto@dentalspot.cl (o link a página /contacto existente). Cuando se definan los planes reales en Fase 2, se reemplaza por 3-4 cards de planes con features detalladas.
- Q: ¿Qué items van en el header de `/para-dentistas`? → A: 5 items: `Features` · `Pricing` · `Blog` · `Contacto` · `Iniciar sesión`. Features y Pricing son anchors a las secciones internas correspondientes de la landing (scroll suave). Blog y Contacto van a las páginas existentes. "Iniciar sesión" lleva a `/auth`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitante paciente entiende qué le ofrece DentalSpot y arranca búsqueda (Priority: P1)

Un usuario nuevo que llega a `https://dentalspot.cl/` por primera vez (por SEO, marketing, boca a boca o un share) ve inmediatamente un mensaje claro de que la plataforma le ayuda a resolver un problema dental: describe su síntoma → IA lo orienta → encuentra dentistas cerca con reseñas → reserva.

**Why this priority**: Es el grueso del tráfico esperado (B2C). Sin un home claro para pacientes, no se generan reservas — sin reservas, los dentistas no perciben valor → marketplace muerto. Es la audiencia que monetiza al dentista (indirecta), por lo tanto su comprensión es crítica para todo el funnel.

**Independent Test**: Se prueba abriendo `/` en una incógnita nueva sin sesión. El usuario debe poder escanear el hero en menos de 5 segundos y entender (a) que es para él como paciente, (b) qué hace la plataforma, (c) cuál es la acción siguiente (input de síntoma o CTA "Encontrar dentista"). Al hacer click en la acción primaria del hero, debe llegar al flujo de consulta IA actual sin pasos intermedios.

**Acceptance Scenarios**:

1. **Given** un visitante anónimo en `/`, **When** mira el hero por 5 segundos, **Then** identifica que la página es para él como paciente y que la promesa central es "encontrar dentista a partir de un síntoma o necesidad".
2. **Given** un visitante en `/`, **When** escribe su síntoma o necesidad en el input del hero y presiona el CTA "Encontrar dentista", **Then** llega al flujo de consulta IA existente con su texto pre-cargado (o ingresado en el siguiente paso) sin perder el contexto.
3. **Given** un visitante en `/`, **When** scrollea, **Then** ve los bloques en este orden: Hero → Cómo funciona (3 pasos) → Por qué DentalSpot (4 cards) → FAQ paciente → Footer.
4. **Given** un visitante en `/`, **When** mira el header, **Then** ve únicamente: logo, Blog, Contacto, Iniciar sesión. NO ve CTA "Soy Dentista" prominente ni pricing.

---

### User Story 2 — Visitante dentista entiende propuesta B2B y crea cuenta (Priority: P1)

Un dentista que llega a `https://dentalspot.cl/para-dentistas` (vía link directo de campaña, cross-link footer del home paciente, o boca a boca) ve una landing comercial dedicada que explica los beneficios concretos del SaaS y le invita a crear cuenta gratis.

**Why this priority**: Sin dentistas registrados, los pacientes no tienen a quién reservar. La oferta y la demanda del marketplace necesitan crecer juntas. La landing dentista es el ÚNICO canal de conversión B2B y debe vender claramente el valor.

**Independent Test**: Se prueba abriendo `/para-dentistas` en incógnita. El visitante debe ver una landing distinta a la de pacientes, con copy enfocado en el profesional (gestión de agenda, ficha clínica, ingresos, asistente IA) y un CTA primario "Crear cuenta gratis" que lo lleve a registro.

**Acceptance Scenarios**:

1. **Given** un dentista anónimo en `/para-dentistas`, **When** mira el hero, **Then** lee la promesa central enfocada en gestión de clínica ("Tu clínica, organizada y creciendo" o equivalente) y ve un único CTA primario "Crear cuenta gratis".
2. **Given** un dentista en `/para-dentistas`, **When** scrollea, **Then** ve los bloques: Hero → Stats sociales → Problemas que resuelve (3 col) → Feature spotlight (4 items) → Pricing placeholder → FAQ profesional → CTA final.
3. **Given** un dentista en `/para-dentistas`, **When** hace click en "Crear cuenta gratis", **Then** llega a `/auth` (mismo flow de auth que paciente, con opción de elegir rol o detectar por contexto).
4. **Given** un dentista en `/para-dentistas`, **When** mira el footer, **Then** ve un link cross "¿Eres paciente? → Buscar dentista" que lleva a `/`.

---

### User Story 3 — Visitante en home equivocado encuentra cross-link claro (Priority: P2)

Un dentista que llega a `/` por error (o un paciente que llega a `/para-dentistas` por error) debe poder navegar a la audiencia correcta en máximo 2 clicks, sin sentir que se equivocó de sitio.

**Why this priority**: Reduce bounce rate. Si la persona aterriza en el home equivocado y no ve forma de moverse, abandona. Un cross-link discreto pero visible en el footer (mínimo) y/o un toggle en header (opcional Fase 2) soluciona el caso.

**Independent Test**: Se prueba abriendo `/` y verificando que en el footer hay link visible "¿Eres dentista?" que lleva a `/para-dentistas`. Recíproco para `/para-dentistas`.

**Acceptance Scenarios**:

1. **Given** un visitante en `/`, **When** scrollea hasta el footer, **Then** ve un link claramente identificable "¿Eres dentista? → DentalSpot para profesionales" que lleva a `/para-dentistas`.
2. **Given** un visitante en `/para-dentistas`, **When** scrollea hasta el footer, **Then** ve un link "¿Eres paciente? → Buscar dentista" que lleva a `/`.
3. **Given** un visitante en cualquiera de las dos landings, **When** hace click en el logo del header, **Then** llega a `/` (raíz patient — comportamiento estándar web). En `/para-dentistas`, además, el logo del header se muestra con un badge visual "para profesionales" (texto pequeño al lado o debajo del logo) que indica claramente al visitante en qué audiencia está antes del click.

---

### User Story 4 — Cualquier visitante hace login desde ambas landings (Priority: P2)

Tanto pacientes como dentistas tienen un botón "Iniciar sesión" en el header de su landing que los lleva al mismo `/auth`, donde la app detecta su rol y los manda al dashboard correspondiente. No hay flujos de auth duplicados.

**Why this priority**: Simplicidad técnica + UX consistente. El componente AuthForm/RoleLandingRedirect ya existe y maneja el routing por rol post-login.

**Independent Test**: Click "Iniciar sesión" desde `/` y desde `/para-dentistas` debe llevar a la misma URL `/auth` con la misma UI.

**Acceptance Scenarios**:

1. **Given** un visitante en `/`, **When** hace click en "Iniciar sesión" del header, **Then** llega a `/auth`.
2. **Given** un visitante en `/para-dentistas`, **When** hace click en "Iniciar sesión" del header, **Then** llega a `/auth` (mismo destino).
3. **Given** un user con sesión activa que llega a `/`, **When** la página carga, **Then** ve el header con su info de user (no "Iniciar sesión"). El comportamiento del header logueado existente NO cambia.

---

### Edge Cases

- **SEO bots**: ambas URLs deben ser crawlables independientes con sitemaps actualizados. Sin `noindex` ni redirects entre ellas.
- **Compartir link**: si alguien comparte `/para-dentistas` por WhatsApp/Slack/email, el preview (Open Graph) debe ser distinto al de `/` (título, descripción, imagen distintos). Detallado en Fase 3 (out of scope Fase 1, pero meta tags MUST estar presentes con valores básicos).
- **Cambio rápido de audiencia**: un dentista que estaba en `/`, ve el cross-link en footer y entra a `/para-dentistas`, debería poder volver a `/` desde el header (logo) si se confunde. Resuelto por el header standard.
- **Sesión activa**: si un user logueado entra a `/para-dentistas`, NO debe ser redirigido al dashboard automáticamente. La landing comercial es válida para verla logueado también (ej. comparar con su plan actual).
- **404 / typos en URL**: `/para-dentistas/` con slash final o `/PARA-DENTISTAS` debe llegar a la página correcta (canonical handling).
- **Footer privacy/terms**: ambas landings deben preservar los links a Política de Privacidad y Términos (compliance Ley 21.719).
- **Crawler legacy**: si Google ya indexó la versión anterior de `/` con texto distinto, no se hace redirect 301 — la URL es la misma, solo cambia contenido. SEO recupera naturalmente.

---

## Requirements *(mandatory)*

### Functional Requirements

**Patient home (`/`)**:

- **FR-001**: El sitio MUST tener un home en la URL raíz `/` que se identifique inmediatamente como dirigido a pacientes (no a dentistas), por copy, imágenes y CTAs.
- **FR-002**: El hero del patient home MUST tener un input de texto donde el paciente describe su síntoma o necesidad + un CTA primario "Encontrar dentista" (o equivalente). El CTA MUST llevar al flujo de consulta IA existente (`/consulta-publica`).
- **FR-003**: El patient home MUST tener una sección "Cómo funciona" con exactamente 3 pasos visuales: (a) describir síntoma, (b) IA + dentistas en mapa, (c) reservar.
- **FR-004**: El patient home MUST tener una sección "Por qué DentalSpot" con exactamente 4 cards: Diagnóstico IA preliminar, Dentistas verificados con reseñas, Transparencia de precios, Seguimiento de tratamiento y presupuesto.
- **FR-005**: El patient home MUST tener una sección FAQ con preguntas frecuentes de paciente (mínimo 4: "¿Es gratis usar DentalSpot?", "¿Cómo funciona la IA?", "¿Puedo pagar online?", "¿Y si necesito cambiar mi cita?").
- **FR-006**: El header del patient home MUST contener únicamente: logo (link a `/`), Blog, Contacto, Iniciar sesión. NO debe contener pricing, ni CTA grande "Soy Dentista", ni features de dentistas.
- **FR-007**: El footer del patient home MUST contener un link discreto pero claramente identificable "¿Eres dentista? → DentalSpot para profesionales" que lleve a `/para-dentistas`.
- **FR-008**: El footer del patient home MUST preservar los links a Política de Privacidad (`/legal/privacy`) y Términos (`/legal/terms`) existentes (compliance Ley 21.719).

**Dentist home (`/para-dentistas`)**:

- **FR-009**: El sitio MUST tener una landing dedicada en `/para-dentistas` que se identifique inmediatamente como dirigida a dentistas (B2B), por copy, imágenes y CTAs.
- **FR-009b**: El header del dentist home MUST contener 5 items: `Features` · `Pricing` · `Blog` · `Contacto` · `Iniciar sesión`. Features y Pricing son anchors a las secciones internas correspondientes (scroll suave dentro de la misma página). Blog lleva a `/blog` existente. Contacto lleva a `/contacto` existente. Iniciar sesión lleva a `/auth`.
- **FR-010**: El hero del dentist home MUST tener un título principal con propuesta de valor B2B ("Tu clínica, organizada y creciendo" o equivalente aprobado) + un único CTA primario "Crear cuenta gratis". (Sin CTA secundario "Ver demo" — se eliminó por simplicidad y foco en conversión.)
- **FR-011**: El CTA "Crear cuenta gratis" del dentist home MUST llevar a `/auth` con la opción de registro (mismo flow que el resto de la app).
- **FR-012**: El dentist home MUST tener una sección "Problemas que resuelve" con exactamente 3 columnas que mapeen un problema típico de clínica a la solución que DentalSpot ofrece (ej. agenda → calendario inteligente, pacientes sin seguimiento → ficha clínica unificada, cuentas en Excel → ingresos automáticos).
- **FR-013**: El dentist home MUST tener una sección "Feature spotlight" con 4 features destacados (Agenda multi-box, Ficha clínica + odontograma, Asistente IA 24/7, Reportes de ingresos), texto-only en Fase 1.
- **FR-014**: El dentist home MUST tener una sección de Pricing. En Fase 1 se renderiza como placeholder minimalista: título "Precios" + copy breve ("Te armamos el plan que se ajusta a tu clínica — pronto vas a ver nuestros planes públicos") + un CTA "Hablanos para precios" que apunta a la página `/contacto` existente o abre un mailto a `contacto@dentalspot.cl`. En Fase 2 esta sección se reemplaza por 3-4 cards con planes reales + features por plan (pricing transparente — visión long-term).
- **FR-015**: El dentist home MUST tener una sección FAQ con preguntas frecuentes profesionales (mínimo 4, ej. "¿Cuánto cuesta?", "¿Cobran comisión por cita?", "¿Cumplen Ley 21.719 / 20.584?", "¿Puedo migrar mis datos desde Excel?").
- **FR-016**: El dentist home MUST tener un CTA final al cierre con "Empezá gratis 30 días" o equivalente.
- **FR-017**: El footer del dentist home MUST contener un link discreto pero claramente identificable "¿Eres paciente? → Buscar dentista" que lleve a `/`.
- **FR-018**: El footer del dentist home MUST preservar los links a Política de Privacidad y Términos.

**Branding y técnico común**:

- **FR-019**: Ambas landings MUST usar el mismo logo (logo horizontal `logo-dentalspot-full.png`), misma paleta de colores (teal primario), misma tipografía y mismo footer legal.
- **FR-020**: Ambas landings MUST ser independientemente accesibles por URL canónica (`/` y `/para-dentistas`) sin redirects entre ellas y sin `noindex`.
- **FR-021**: Ambas landings MUST funcionar sin sesión iniciada (usuarios anónimos). Si hay sesión activa, el header MUST cambiar para mostrar info de user logueado (comportamiento existente del Header preservado).
- **FR-022**: El click en el logo del header en cualquiera de las dos landings MUST llevar a `/` (raíz patient — comportamiento estándar web).
- **FR-022b**: En `/para-dentistas`, el header MUST renderizar el logo con un badge visual "para profesionales" (texto pequeño al lado o debajo del logo, color sutil) para que el visitante identifique en qué audiencia está sin necesidad de leer el resto del header. En `/` (patient home) el logo se renderiza sin badge (comportamiento estándar).
- **FR-023**: Ambas landings MUST tener meta tags básicos (title, description, og:title, og:description) distintos para que el preview en redes sociales y SEO se diferencie entre audiencias.

**Analytics e instrumentación**:

- **FR-024**: El sitio MUST instalar Google Analytics 4 (GA4) en Fase 1 — propiedad nueva con measurement ID propio de DentalSpot. Carga vía gtag.js respetando consent (no carga si user rechaza cookies de marketing).
- **FR-025**: El sitio MUST trackear los siguientes eventos en ambas landings (a Meta Pixel + GA4 simultáneamente):
  - **Patient home (`/`)**: `patient_home_view` (page view), `patient_hero_cta_click` (click CTA "Encontrar dentista"), `patient_footer_to_dentist_click` (click cross-link footer), `patient_section_visible` (con prop `section_name`: como_funciona / por_que / faq / footer), `patient_faq_question_open` (con prop `question_id`).
  - **Dentist landing (`/para-dentistas`)**: `dentist_home_view` (page view), `dentist_hero_cta_register_click` (click "Crear cuenta gratis"), `dentist_footer_to_patient_click` (click cross-link footer), `dentist_section_visible` (con prop `section_name`: stats / problemas / features / pricing / faq / cta_final), `dentist_faq_question_open` (con prop `question_id`).
  - **Comunes a ambas**: `scroll_depth` (con prop `depth_pct`: 25/50/75/100), `time_on_page` (al unload, con prop `seconds`).
- **FR-026**: Los eventos MUST respetar el sistema de consentimiento de cookies existente. Si el user rechaza marketing cookies, NO se cargan Meta Pixel ni GA4 (igual que comportamiento actual).
- **FR-027**: El sistema MUST tener una utility centralizada (ej. `src/lib/analytics.js` o equivalente) que abstraiga el envío de eventos a ambas plataformas (Meta + GA4) en una sola llamada, para evitar duplicar código.

**Fuera de scope Fase 1** (out of scope explícito):

- **FR-OUT-001**: Featured dentists carousel con dentistas reales — Fase 2 cuando haya dentistas con perfiles completos
- **FR-OUT-002**: Mapa interactivo con dentistas reales en patient hero — Fase 2
- **FR-OUT-003**: Mockups de celular con screenshots de la app real (calendario, ficha clínica, dashboard) — Fase 2 cuando founder provea screenshots
- **FR-OUT-004**: Animaciones interactivas (Framer Motion, GIFs, videos) — Fase 2
- **FR-OUT-005**: Testimonials reales de pacientes y dentistas — Fase 2 cuando se obtengan
- **FR-OUT-006**: Pricing con planes reales — Fase 2 cuando se definan los tiers de Communicare/DentalSpot
- **FR-OUT-007**: SEO Schema.org diferenciado (MedicalWebPage patient vs SoftwareApplication dentist) — Fase 3
- **FR-OUT-008**: Toggle "Para Pacientes / Para Dentistas" en header — Fase 2/3 según conversión
- **FR-OUT-009**: A/B test del hero patient (input grande vs CTA tradicional) — Fase 3

### Key Entities

No aplica entidades de datos nuevas. La feature es de presentación (UI/UX) sin cambios en el modelo de datos. Las landings consumen:

- **Existing Routes**: `/` (HomePage actual), `/consulta-publica` (flujo IA existente), `/auth` (auth existente), `/legal/privacy`, `/legal/terms` (legal existente), `/blog/*` (blog existente), `/contacto` (contacto existente).
- **Existing Assets**: `logo-dentalspot-full.png` (header), `logo-dentalspot.png` (icono), favicon, paleta de colores Tailwind teal/primary/accent.
- **Existing Components**: Header (con dual mode anónimo/logueado), Footer (con links legal), AuthForm, RoleLandingRedirect.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante paciente nuevo identifica que la página es para él dentro de **5 segundos** de ver el hero (validado por user testing informal o heurística: si el copy y CTA son patient-focused, el visitante NO se confunde).
- **SC-002**: Un visitante dentista nuevo identifica que la página es para él dentro de **5 segundos** de ver el hero de `/para-dentistas` (mismo principio).
- **SC-003**: El click-through rate del hero CTA patient ("Encontrar dentista") al flujo IA aumenta al menos **20%** vs el CTA actual (medido con analytics ya existente, baseline = CTR actual del CTA del hero actual).
- **SC-004**: La página `/para-dentistas` recibe al menos **1 nueva registración de dentista por semana** una vez deployada y referenciada en campañas (baseline mínimo, no benchmark de éxito final).
- **SC-005**: El **100%** de los visitantes en ambas landings tiene un camino claro de máximo 2 clicks para llegar a su flujo principal (paciente → consulta IA; dentista → registro).
- **SC-006**: La bounce rate de `/para-dentistas` es **menor a 70%** una vez con tráfico de campañas (baseline a partir del día 1 post-deploy).
- **SC-007**: El time-to-interactive de ambas landings es **menor a 3 segundos** en conexión 4G (verificable con Lighthouse local o WebPageTest).
- **SC-008**: El **100%** de los flujos críticos existentes (login, búsqueda, blog, contacto) sigue funcionando idéntico desde ambas landings — sin regresiones.

## Assumptions

- **Audiencia primaria**: paciente general en Chile (público amplio). Dentistas son audiencia B2B secundaria con link dedicado.
- **No hay auth diferenciado por rol al inicio**: ambas landings usan el mismo `/auth`. La detección de rol post-login ya existe en `RoleLandingRedirect`.
- **El flujo `/consulta-publica` ya está construido**: el hero patient solo redirige ahí, no se reemplaza ni modifica el flujo IA.
- **Branding está cerrado**: logo horizontal `logo-dentalspot-full.png`, paleta teal, fonts, footer legal — no cambian con esta feature.
- **No PHI ni datos clínicos**: las landings son públicas de marketing, no procesan datos de paciente. Ley 21.719 y 20.584 no aplican directamente; solo se preservan links a Política de Privacidad y Términos.
- **Hostinger maneja deploy auto desde main**: cualquier cambio mergeado a `main` se deploya automáticamente. No requiere config adicional del workflow.
- **Fase 1 se entrega text-only**: contenido visual rico (mockups de celular, animaciones, mapa interactivo, dentistas reales, testimonials reales) queda para Fase 2 cuando la founder provea assets.
- **`/para-dentistas` es la URL del dentist landing**: se eligió este path por SEO chileno (búsquedas "dentistas" en español) y por claridad. Alternativas (`/dentistas`, `/profesionales`) descartadas por ambigüedad.
- **Blog y Contacto ya existen** y se mantienen como están (referenciados desde el header del patient home).
- **Pricing real para dentist home no está definido**: en Fase 1 se usa placeholder textual. Cuando se defina el modelo de planes (probablemente alineado con specs anteriores 022 add-plans-tier-model y 020 migrate-mp-brand), se actualiza en Fase 2.
- **El header existente soporta navegación condicional**: si hace falta cambiar items del header según `location.pathname` (ej. mostrar "Features" en `/para-dentistas` y "Blog" en `/`), se hace dentro del componente Header existente o se crea un wrapper sin duplicar lógica.

## Dependencies

- **HomePage.jsx existente** — se refactoriza para que sea patient-only (no se borra ni se reescribe desde cero).
- **AuthForm + RoleLandingRedirect** — sin cambios. Se reusan para ambos flujos de login.
- **Header / Footer components** — pueden requerir ajustes menores para navegación condicional, cross-link, y badge "para profesionales" en `/para-dentistas`.
- **Router (AppRouter / PublicRouter)** — agregar ruta `/para-dentistas`.
- **Tailwind config + UI components shadcn** — sin cambios, se reusan.
- **Meta Pixel** existente (cargado vía `metaPixel.js` + cookie consent) — se reusa para nuevos eventos.
- **Google Analytics 4** — NUEVA dependencia. Requiere: (a) crear propiedad GA4 en Google Analytics (founder hace esto antes del deploy), (b) obtener `Measurement ID` (`G-XXXXXXXXXX`), (c) configurar como env var Hostinger `VITE_GA4_MEASUREMENT_ID`.
- **Sistema de consent existente** (CookieConsent) — sin cambios. GA4 respeta el mismo opt-in que Meta Pixel.

## Out of Scope

Explícitamente FUERA de esta feature (no se hace en Fase 1):

- Cambios en el dashboard logueado (paciente o dentista).
- Cambios en flujos de auth o de registro.
- Cambios en el modelo de datos (no se agregan tablas ni columnas).
- Cambios en el blog, página de contacto, páginas legales.
- Mejoras de SEO técnicas (sitemap detallado, robots.txt avanzado, Schema.org diferenciado).
- A/B testing con tooling (ej. GrowthBook, Statsig).
- Internacionalización (i18n) — el sitio sigue siendo solo español Chile.
- Integraciones de analytics más finas que las ya existentes (Meta Pixel ya funciona).
- Mejoras de performance más allá del baseline de Vite (no se hace lazy load avanzado, code splitting custom, etc.).
