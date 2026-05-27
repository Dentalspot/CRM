# Tasks: Patient & Dentist Landings (Fase 1)

**Feature**: 027-patient-dentist-landings
**Branch**: `claude/keen-mirzakhani-49256e` (worktree)
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md) | **Contracts**: [contracts/analytics-events.md](./contracts/analytics-events.md)
**Date**: 2026-05-26

---

## Format conventions

- `[P]` = parallelizable (no dep en task incompleta del mismo bloque)
- `[US1]`, `[US2]`, etc = pertenece a User Story de ese número
- File paths absolutos relativos al worktree root
- Sin `[P]` = secuencial dentro de su phase

---

## Phase 1: Setup (infra compartida)

- [X] T001 Confirmar `VITE_GA4_MEASUREMENT_ID` configurado en Hostinger hPanel (la founder hace esto manualmente antes del deploy) y agregar línea placeholder en `.env.example` con comentario "Google Analytics 4 Measurement ID — formato G-XXXXXXXXXX, NO commitear valor real"

- [X] T002 [P] Crear directorio `src/lib/analytics/` con README.md interno explicando el propósito (abstracción Meta Pixel + GA4 unificada, consent-gated)

---

## Phase 2: Foundational (blocking prerequisites)

**Goal**: Tener la infra de analytics + hooks de tracking listos antes de instrumentar landings. Sin esto, los componentes de UI no pueden trackear nada.

- [X] T003 Crear `src/lib/analytics/ga4.js` con función `initGA4(measurementId)` que inyecta `gtag.js` script al DOM y configura el measurement ID, más `trackGA4(eventName, props)` que pushea al dataLayer. Idempotente — múltiples llamadas no duplican init. Ver `research.md` decisión 1 para implementación.

- [X] T004 [P] Crear `src/lib/analytics/meta.js` como wrapper thin de `src/lib/metaPixel.js` existente, exponiendo `trackMeta(eventName, props)`. Reusar `fbq` sin duplicar la lógica de carga.

- [X] T005 Crear `src/lib/analytics/index.js` con API unificada: `trackEvent(name, props)` que llama a Meta + GA4 simultáneamente respetando consent, `trackPageView(path, title)` para SPA navigation, y `hasMarketingConsent()` helper que lee el state del CookieConsent existente.

- [X] T006 Modificar el componente `CookieConsent` (ubicarlo: probablemente `src/components/CookieConsent.jsx` o `src/features/cookies/`) para que en el evento de aceptación de marketing cookies, además de cargar Meta Pixel, llame también a `initGA4(import.meta.env.VITE_GA4_MEASUREMENT_ID)`. Si la env var es vacía, no-op (no error).

- [X] T007 [P] Crear `src/hooks/useScrollDepth.js` que usa IntersectionObserver con 4 markers (25/50/75/100%) y llama `onDepth(pct)` callback cuando cruza cada marker (una vez por marker, por sesión de página). Cleanup en unmount. Ver `research.md` decisión 2.

- [X] T008 [P] Crear `src/hooks/useSectionVisible.js` que recibe un ref y un `sectionName` y dispara `trackEvent('section_visible', { section_name })` cuando la sección entra al viewport con threshold 0.5. Una vez por section por sesión. Cleanup en unmount.

- [X] T009 [P] Crear `src/hooks/useTimeOnPage.js` que registra `Date.now()` al montar, escucha `visibilitychange` y `pagehide`, y al state hidden calcula segundos y llama `onUnload(seconds)`. Usar `navigator.sendBeacon()` internamente para garantizar entrega. Ver `research.md` decisión 3.

---

## Phase 3: User Story 1 — Patient home (`/`) [P1]

**Goal**: Visitante paciente entiende qué le ofrece DentalSpot y arranca búsqueda
**Independent Test**: Abrir `/` en incógnita → en 5 seg identificar que es para paciente → click hero CTA → llega a `/consulta-publica`.

### Audit + refactor existing

- [X] T010 [US1] Audit de `src/pages/HomePage.jsx` y todos los componentes que importa de `src/components/landing/sections/`. Generar lista (puede ser comment en la PR) de: (a) secciones existentes con sus nombres, (b) cuáles se conservan tal cual, (c) cuáles se modifican, (d) cuáles se eliminan. Detalle ver `research.md` decisión 6.

- [X] T011 [US1] Refactor `src/pages/HomePage.jsx` para que sea patient-only: eliminar cualquier referencia/imports a secciones de "Soy Dentista" o pricing si existen. Actualizar el `<Helmet>` title a "DentalSpot | Encuentra un dentista en minutos" (si no está ya). Asegurar que el orden de secciones renderizadas es: Hero → Cómo funciona → Por qué DentalSpot → FAQ → Footer.

### Hero patient

- [X] T012 [US1] Modificar `src/components/landing/sections/HeroSection.jsx` para que tenga: (a) input grande "Describe tu síntoma o necesidad" (controlled state local), (b) único CTA primario "Encontrar dentista" que al click navega a `/consulta-publica` pasando el texto del input via query param o state. Eliminar cualquier CTA secundario "Soy Dentista" si existe.

### Sections patient

- [X] T013 [P] [US1] Verificar/crear sección "Cómo funciona" como `src/components/landing/sections/HowItWorksSection.jsx` con exactamente 3 pasos visuales: (1) Describes síntoma, (2) IA + dentistas en mapa, (3) Reservas. Si ya existe similar, ajustar copy/estructura. Sin imágenes reales (Fase 2) — usar íconos lucide-react.

- [X] T014 [P] [US1] Verificar/crear sección "Por qué DentalSpot" como `src/components/landing/sections/WhyDentalSpotSection.jsx` con 4 cards: Diagnóstico IA preliminar, Dentistas verificados con reseñas, Transparencia de precios, Seguimiento de tratamiento y presupuesto. Usar shadcn Card + lucide-react icons.

- [X] T015 [P] [US1] Verificar/crear sección FAQ paciente como `src/components/landing/sections/PatientFaqSection.jsx` con mínimo 4 preguntas: "¿Es gratis usar DentalSpot?", "¿Cómo funciona la IA?", "¿Puedo pagar online?", "¿Y si necesito cambiar mi cita?". Usar shadcn Accordion. Cada pregunta tiene un `data-question-id` para tracking.

### Header patient

- [X] T016 [US1] Modificar `src/components/layout/Header.jsx` para que en modo anónimo (sin sesión) y `location.pathname === '/'`, renderice nav items: `Blog` · `Contacto` · `Iniciar sesión`. **NO** mostrar pricing ni "Soy Dentista". Si hay sesión activa, mantener el comportamiento actual sin cambios. Click en logo lleva a `/`.

### Analytics patient

- [X] T017 [US1] En `src/pages/HomePage.jsx` agregar:
  - `useEffect` que dispara `trackEvent('patient_home_view')` al montar (después de check consent vía `hasMarketingConsent()`).
  - Hook `useScrollDepth` que dispara `trackEvent('scroll_depth', { depth_pct, page: 'patient_home' })`.
  - Hook `useTimeOnPage` que dispara `trackEvent('time_on_page', { seconds, page: 'patient_home' })` en unload.

- [X] T018 [US1] En `HeroSection.jsx` (patient) agregar `onClick` del CTA "Encontrar dentista" que llame `trackEvent('patient_hero_cta_click', { has_symptom_input: inputValue.length > 0 })` ANTES de navegar.

- [X] T019 [P] [US1] En `HowItWorksSection`, `WhyDentalSpotSection`, `PatientFaqSection` agregar `useSectionVisible` hook con `section_name` correspondiente (`como_funciona`, `por_que`, `faq`).

- [X] T020 [P] [US1] En `PatientFaqSection.jsx` agregar `onClick` en cada Accordion item que dispare `trackEvent('patient_faq_question_open', { question_id })`.

### Footer patient

- [X] T021 [US1] Modificar `src/components/layout/Footer.jsx` para que en `location.pathname === '/'` muestre un link sutil "¿Eres dentista? → DentalSpot para profesionales" que linkee a `/para-dentistas`. Al click, `trackEvent('patient_footer_to_dentist_click')`.

---

## Phase 4: User Story 2 — Dentist landing (`/para-dentistas`) [P1]

**Goal**: Visitante dentista entiende propuesta B2B y crea cuenta
**Independent Test**: Abrir `/para-dentistas` en incógnita → ver propuesta B2B en hero → click "Crear cuenta gratis" → llega a `/auth`.

### Routing + page

- [X] T022 [US2] Crear `src/pages/DentistLandingPage.jsx` con `<Helmet>` title "DentalSpot para Profesionales | Software para clínicas dentales" + meta description distinta a la patient. Estructura: `<DentistHeroSection /> → <DentistStatsSection /> → <DentistProblemsSection /> → <DentistFeaturesSection /> → <DentistPricingPlaceholderSection /> → <DentistFaqSection /> → <DentistFinalCtaSection />`.

- [X] T023 [US2] Agregar ruta `/para-dentistas` en `src/app/routers/PublicRouter.jsx` (o el router donde estén las rutas públicas) que renderice `<DentistLandingPage />`. Verificar que la ruta es accesible sin auth y que SEO bots la pueden indexar (sin redirect ni noindex).

### Sections dentist

- [X] T024 [P] [US2] Crear `src/components/landing/dentist/DentistHeroSection.jsx`: título "Tu clínica, organizada y creciendo" (o equivalente aprobado), sub "Agenda, ficha clínica e ingresos en una sola plataforma", **UN solo CTA primario** "Crear cuenta gratis" → `/auth`. Sin CTA secundario "Ver demo".

- [X] T025 [P] [US2] Crear `src/components/landing/dentist/DentistStatsSection.jsx` con stats placeholder (ej. "100+ dentistas confían" / "5.000+ citas agendadas" — números mock pero realistas; documentar en comments del archivo que son placeholders para Fase 2). 3 stats en row.

- [X] T026 [P] [US2] Crear `src/components/landing/dentist/DentistProblemsSection.jsx` con 3 columnas (problema → solución):
  - "Agenda saturada o mal organizada" → "Calendario inteligente multi-box"
  - "Pacientes sin seguimiento" → "Ficha clínica unificada"
  - "Cuentas en Excel" → "Ingresos automáticos por cita"
  Usar íconos lucide-react para cada columna.

- [X] T027 [P] [US2] Crear `src/components/landing/dentist/DentistFeaturesSection.jsx` con anchor `id="features"` y `scroll-mt-20`. 4 features alternando texto izq/der (sin imágenes en Fase 1 — placeholders de imagen con texto descriptivo): (1) Agenda multi-box, (2) Ficha clínica + odontograma, (3) Asistente IA 24/7 vía chat/WhatsApp, (4) Reportes de ingresos.

- [X] T028 [P] [US2] Crear `src/components/landing/dentist/DentistPricingPlaceholderSection.jsx` con anchor `id="pricing"` y `scroll-mt-20`. Título "Precios" + copy "Te armamos el plan que se ajusta a tu clínica — pronto vas a ver nuestros planes públicos" + CTA "Hablanos para precios" → `/contacto` (link). Al click, `trackEvent('dentist_pricing_contact_click')`.

- [X] T029 [P] [US2] Crear `src/components/landing/dentist/DentistFaqSection.jsx` con 4+ preguntas profesionales en shadcn Accordion: "¿Cuánto cuesta?", "¿Cobran comisión por cita?", "¿Cumplen Ley 21.719 y 20.584?", "¿Puedo migrar mis datos desde Excel?". Cada item con `data-question-id`.

- [X] T030 [US2] Crear `src/components/landing/dentist/DentistFinalCtaSection.jsx` con CTA "Empezá gratis 30 días" → `/auth`. Al click, `trackEvent('dentist_final_cta_click')`.

### Header + Footer dentist

- [X] T031 [US2] Extender `src/components/layout/Header.jsx` (continuación de T016) para que en modo anónimo y `location.pathname === '/para-dentistas'`:
  - Renderice nav items: `Features` (anchor `#features`) · `Pricing` (anchor `#pricing`) · `Blog` · `Contacto` · `Iniciar sesión`.
  - Renderice el badge "para profesionales" al lado del logo en desktop (pill teal-50/teal-700, font 11px) y debajo del logo en mobile. Ver `research.md` decisión 5 para markup.
  - Click en logo sigue yendo a `/` (raíz patient).

- [X] T032 [US2] Extender `src/components/layout/Footer.jsx` (continuación de T021) para que en `location.pathname === '/para-dentistas'` muestre un link sutil "¿Eres paciente? → Buscar dentista" → `/`. Al click, `trackEvent('dentist_footer_to_patient_click')`.

### Analytics dentist

- [X] T033 [US2] En `src/pages/DentistLandingPage.jsx` agregar:
  - `useEffect` que dispara `trackEvent('dentist_home_view')`.
  - Hook `useScrollDepth` con `page: 'dentist_landing'`.
  - Hook `useTimeOnPage` con `page: 'dentist_landing'`.

- [X] T034 [US2] En `DentistHeroSection.jsx` agregar `onClick` del CTA "Crear cuenta gratis" que llame `trackEvent('dentist_hero_cta_register_click')` ANTES de navegar.

- [X] T035 [P] [US2] En cada DentistXSection (Stats, Problems, Features, Pricing, Faq, FinalCta) agregar `useSectionVisible` con `section_name` correspondiente (`stats`, `problemas`, `features`, `pricing`, `faq`, `cta_final`).

- [X] T036 [P] [US2] En `DentistFaqSection.jsx` agregar `onClick` en cada Accordion item que dispare `trackEvent('dentist_faq_question_open', { question_id })`.

---

## Phase 5: User Stories 3 + 4 — Cross-nav + Login (verificación) [P2]

**Goal**: US3 (cross-link claro entre landings) y US4 (login funciona desde ambas) emergen del trabajo de US1 + US2. Esta fase es verificación, no work nuevo.

- [X] T037 [US3] Verificar manualmente (smoke local) que click en footer "¿Eres dentista?" desde `/` lleva a `/para-dentistas` y dispara `patient_footer_to_dentist_click`. Y que click en "¿Eres paciente?" desde `/para-dentistas` lleva a `/` y dispara `dentist_footer_to_patient_click`.

- [X] T038 [US4] Verificar manualmente (smoke local) que click en "Iniciar sesión" del header en `/` lleva a `/auth`. Verificar lo mismo desde `/para-dentistas`. Ambos llegan al mismo flow de auth existente.

---

## Phase 6: Polish & cross-cutting

- [X] T039 [P] Verificar que el build de producción pasa sin errores: `cd worktree && npx vite build 2>&1 | tail -5`. Bundle size delta esperado: < +30 KB gzip.

- [X] T040 [P] Smoke local en dev server (`npm run dev`) — usar la guía completa de [quickstart.md](./quickstart.md) sections 1-7 (patient home, dentist landing, cross-nav, analytics, consent gating, responsive, SEO).

- [X] T041 Lighthouse local en ambas landings: verificar Performance score ≥ 85, no regresiones en Accessibility ni Best Practices.

- [X] T042 Actualizar `.specify/memory/data-compliance.md` documentando que se instaló GA4 en Fase 1 — agregar entrada en sección "Compliance log" con fecha + nota de que respeta consent existente sin nueva categoría.

- [X] T043 Commit + push del feature completo: `git add -A && git commit -m "feat(landings): patient + dentist landings con analytics GA4 (spec 027)" && git push origin claude/keen-mirzakhani-49256e`. Después merge a main: `cd main worktree && git pull && git merge claude/keen-mirzakhani-49256e && git push origin main`. Hostinger redeploya automático.

- [X] T044 Smoke en prod post-deploy (~2 min después del push a main): repetir checklist de [quickstart.md sección 9](./quickstart.md). Verificar GA4 Real-time + Meta Events Manager Test Events reciben los eventos.

- [X] T045 Documentar en CHANGELOG o release notes (si existe) el deploy del feature. Mover `Active feature` en CLAUDE.md a `IMPLEMENTED`.

---

## Dependency graph

```
Phase 1 (Setup) ─────┐
                     │
                     ▼
Phase 2 (Foundational) ────────┐
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
        Phase 3 (US1 Patient)             Phase 4 (US2 Dentist)
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                        Phase 5 (US3+US4)
                               │
                               ▼
                        Phase 6 (Polish)
```

**Phases 3 y 4 pueden trabajarse en paralelo** una vez completada Phase 2. Ambas son independientes entre sí (distintos componentes, distintos paths).

---

## Parallel execution examples

### Bloque 1 — Foundational en paralelo
Después de T003 (ga4.js), las siguientes 3 pueden hacerse a la par:
- T004 [P] meta.js wrapper
- T007 [P] useScrollDepth hook
- T008 [P] useSectionVisible hook
- T009 [P] useTimeOnPage hook

### Bloque 2 — Patient sections en paralelo
Después de T011 (refactor HomePage), las siguientes pueden hacerse a la par:
- T013 [P] HowItWorks section
- T014 [P] WhyDentalSpot section
- T015 [P] PatientFaq section

### Bloque 3 — Dentist sections en paralelo
Después de T022 (DentistLandingPage.jsx page), las siguientes 6 pueden hacerse a la par:
- T024 [P] DentistHero
- T025 [P] DentistStats
- T026 [P] DentistProblems
- T027 [P] DentistFeatures
- T028 [P] DentistPricingPlaceholder
- T029 [P] DentistFaq

### Bloque 4 — Analytics instrumentation en paralelo
- T019 [P] Section visible patient
- T020 [P] FAQ patient
- T035 [P] Section visible dentist
- T036 [P] FAQ dentist

---

## Independent test criteria per User Story

### US1 — Patient home
- ✅ `/` carga sin errores en incógnita
- ✅ Hero tiene input + CTA "Encontrar dentista"
- ✅ Click CTA → `/consulta-publica`
- ✅ Header items: Blog · Contacto · Iniciar sesión (sin Soy Dentista, sin pricing)
- ✅ Footer tiene link "¿Eres dentista?" → `/para-dentistas`
- ✅ Con consent aceptado, Network muestra eventos `patient_home_view`, `patient_hero_cta_click`, `scroll_depth`

### US2 — Dentist landing
- ✅ `/para-dentistas` carga sin errores en incógnita
- ✅ Hero tiene 1 CTA "Crear cuenta gratis" (NO "Ver demo")
- ✅ Click CTA → `/auth`
- ✅ Header items: Features · Pricing · Blog · Contacto · Iniciar sesión
- ✅ Logo tiene badge "para profesionales"
- ✅ Click "Features" del header → scroll a sección features
- ✅ Sección Pricing tiene CTA "Hablanos" → `/contacto`
- ✅ Footer tiene link "¿Eres paciente?" → `/`
- ✅ Con consent aceptado, Network muestra eventos dentist

### US3 — Cross-nav
- ✅ Patient footer link funciona y trackea
- ✅ Dentist footer link funciona y trackea

### US4 — Login
- ✅ "Iniciar sesión" desde `/` → `/auth`
- ✅ "Iniciar sesión" desde `/para-dentistas` → `/auth`

---

## Implementation strategy

### MVP (mínimo viable para deploy útil)
Si tiempo es muy limitado, lo mínimo deployable es:
1. Phase 1 (T001-T002)
2. Phase 2 (T003-T009) — analytics infra
3. **Phase 3 completa (T010-T021)** — patient home funcional con tracking

Con eso solo, ya tenés patient home reformado con analytics. Dentist landing puede quedar para PR separada (entrega incremental). Si elegís ese camino, el cross-link de patient footer apuntaría a `/para-dentistas` que aún no existe — temporalmente apuntarlo a un placeholder o a `/contacto`.

### Recomendado (Fase 1 completa)
Las 6 phases en orden secuencial dentro de cada bloque, paralelizando donde marca [P]. Esto es lo planteado y estimado en ~4-6h.

### NO hacer en esta fase
Todo lo listado en `spec.md` sección "Out of Scope" y `FR-OUT-001` a `FR-OUT-009`:
- Mockups de celular con screenshots reales
- Animaciones Framer Motion sofisticadas
- Mapa interactivo
- Featured dentists / testimonials reales
- Pricing real con planes
- SEO Schema.org diferenciado
- A/B testing
- Tests automatizados (no hay infra en el repo)

---

## Format validation

Total tasks: **45**

| Phase | Task count | Story labels |
|---|---|---|
| 1. Setup | T001-T002 (2) | sin label |
| 2. Foundational | T003-T009 (7) | sin label |
| 3. US1 Patient | T010-T021 (12) | [US1] |
| 4. US2 Dentist | T022-T036 (15) | [US2] |
| 5. US3+US4 Verification | T037-T038 (2) | [US3] o [US4] |
| 6. Polish | T039-T045 (7) | sin label |

Parallel opportunities marked: **17 tasks** con `[P]`.

Format check:
- ✅ Todos los tasks empiezan con `- [X]`
- ✅ Todos tienen Task ID (T001-T045)
- ✅ Setup, Foundational, Polish phases no tienen story label (correcto)
- ✅ US1-US4 phases sí tienen story label (correcto)
- ✅ Todos los tasks especifican file path donde aplica (no aplica para verificación/smoke)

Listo para `/speckit-implement`.
