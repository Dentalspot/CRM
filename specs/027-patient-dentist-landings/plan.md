# Implementation Plan: Patient & Dentist Landings (Fase 1)

**Branch**: `claude/keen-mirzakhani-49256e` (worktree) | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-patient-dentist-landings/spec.md`

## Summary

Restructurar la home de DentalSpot en **dos landings separadas por audiencia** — patient (`/`) y dentist (`/para-dentistas`) — siguiendo el patrón Airbnb (`/` vs `/host`). Fase 1 entrega **estructura completa con contenido text-only**: el patient home se refactoriza para limpiar foco al paciente (sacar CTA "Soy Dentista", sacar pricing, simplificar nav); el dentist landing se crea desde cero con secciones de hero, problemas, features, pricing placeholder y CTA final. Ambas comparten branding (logo horizontal, paleta teal, footer legal). Cross-link entre las dos vive en el footer. Se instala **Google Analytics 4** (nuevo) que coexiste con Meta Pixel existente, con set completo de eventos: page views, clicks de CTAs principales, scroll depth, section visible, FAQ open, time on page. Toda la instrumentación respeta el sistema de consent de cookies existente. **NO toca PHI ni datos clínicos** — es pura presentación marketing.

**Approach técnico**:
- Patient home: refactor in-place de `src/pages/HomePage.jsx` (preservar bloques útiles, eliminar lo que no aplica).
- Dentist landing: nuevo archivo `src/pages/DentistLandingPage.jsx` + secciones nuevas en `src/components/landing/dentist/`.
- Routing: agregar ruta `/para-dentistas` en `src/app/routers/PublicRouter.jsx` o equivalente.
- Header: el componente `Header.jsx` se hace consciente de la audiencia (lee `location.pathname`), renderiza items distintos según `/` vs `/para-dentistas`, e incluye el badge "para profesionales" cuando aplica.
- Footer: agregar cross-link condicional según pathname.
- Analytics: nuevo módulo `src/lib/analytics/index.js` que abstrae Meta + GA4 detrás de una API unificada `trackEvent(name, props)`; nuevo `src/lib/analytics/ga4.js` (init gtag) que se carga vía cookie consent; nuevos hooks `useScrollDepth()`, `useSectionVisible()`, `useTimeOnPage()`.

## Technical Context

**Language/Version**: JavaScript (ES2022) + JSX (React 18.x)
**Primary Dependencies** (existentes, sin nuevas npm installs):
- `react` ^18, `react-dom` ^18, `react-router-dom` ^6 — routing y render
- `@supabase/supabase-js` ^2.99 — auth context (sin nuevas tablas)
- `framer-motion` ^11 — animaciones (futuro Fase 2, en Fase 1 usar solo lo mínimo)
- `lucide-react` — íconos
- `tailwindcss` ^3 + `shadcn/ui` — UI primitives (Card, Button, Input, Accordion para FAQ)
- `react-helmet-async` — meta tags por página
- `vite` ^4.5 — build tool

**Dependencias nuevas en runtime** (no npm, solo asset/config):
- **Google Analytics 4 gtag.js** — script externo cargado dinámicamente desde `https://www.googletagmanager.com/gtag/js`, controlado por consent. NO se agrega como npm dep (evita bundle bloat); el módulo `ga4.js` inyecta el script en `<head>` al opt-in.
- **Env var nueva**: `VITE_GA4_MEASUREMENT_ID` (formato `G-XXXXXXXXXX`). Se configura en Hostinger hPanel (igual que `VITE_SUPABASE_URL`, `VITE_SENTRY_DSN`).

**Storage**: N/A — feature de presentación pura, no toca DB ni Supabase. No nuevas tablas, ni columnas, ni RLS policies.

**Testing**:
- **Smoke manual** post-deploy (dev server local y prod): cargar `/` y `/para-dentistas` en incógnita, verificar layout, links, hero CTAs, badge "para profesionales", cross-links footer.
- **Analytics smoke**: con cookies aceptadas, verificar en DevTools Network filtro `google-analytics.com` y `facebook.com/tr` que los eventos llegan al disparar interacciones.
- **No hay tests automatizados nuevos** — el repo no tiene Jest/Vitest configurado para componentes React. Fuera de scope.

**Target Platform**: Web responsive (desktop primary, mobile/tablet supported). Browsers modernos (Chrome/Edge/Firefox/Safari últimas 2 versiones). Sin soporte IE.

**Project Type**: SPA React 18 + Vite — single project, sin separación frontend/backend (Supabase es el "backend").

**Performance Goals**:
- TTI (Time To Interactive) < 3s en conexión 4G (per SC-007)
- Lighthouse Performance score ≥ 85 en cada landing
- Bundle size delta ≤ +30 KB gzip (todo el feature, incluyendo gtag wrapper)

**Constraints**:
- **No mutaciones DB ni PHI** — es feature de presentación.
- **No agregar npm deps nuevas** salvo que sea inevitable. Reuso de shadcn/ui + lucide-react.
- **Consent-first**: GA4 NO carga si el user rechaza cookies de marketing (igual que Meta Pixel actual).
- **No romper SEO existente** — preservar sitemap.xml, robots.txt, meta tags base.
- **Compatibilidad con flujos existentes**: `/auth`, `/consulta-publica`, `/blog`, `/contacto`, `/legal/*` siguen funcionando idéntico.

**Scale/Scope**:
- **2 landings nuevas** (1 refactor + 1 from scratch)
- **~10-12 componentes nuevos** en `src/components/landing/dentist/` (HeroSection, ProblemsSection, FeaturesSection, PricingPlaceholderSection, FaqSection, FinalCtaSection, etc.) y posibles ajustes a `landing/patient/` para refactor.
- **1 módulo de analytics nuevo** (`src/lib/analytics/`)
- **3 hooks nuevos** (scroll, section-visible, time-on-page)
- **1 ruta nueva** + 1 ajuste en Header.jsx + 1 ajuste en Footer.jsx
- **~15 eventos analytics** instrumentados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplicación a esta feature | Status |
|---|---|---|
| **I. Compliance-First** | Feature de marketing pública, sin PHI. Cookie consent existente respetado (GA4 no carga sin opt-in). Footer preserva links a `/legal/privacy` y `/legal/terms` (Ley 21.719 art. 14 transparencia). | ✅ PASS |
| **II. RLS-First Security** | No toca DB, no hay queries Supabase nuevas. AuthGuard/RoleGuard sin cambios. | ✅ PASS (N/A) |
| **III. Append-Only Clinical Audit** | No accede a datos clínicos. `useClinicalAccessLogger` no aplica. | ✅ PASS (N/A) |
| **IV. Micro-Bloques con Plan Previo** | Scope cerrado a Fase 1; Fase 2 (mockups, animaciones, mapas, dentistas reales) y Fase 3 (SEO avanzado, A/B test) quedan fuera explícitos (ver FR-OUT-001 a FR-OUT-009 en spec). Refactor de HomePage.jsx no se mezcla con bug fixes ni con otras features. | ✅ PASS |
| **V. UI Honesty** | No hay mutaciones, ni toasts de éxito, ni operaciones que afecten filas. CTAs son links/navegación. Pricing placeholder es honesto ("planes próximamente"). | ✅ PASS (no aplica directamente) |
| **VI. Schema Drift Zero** | No agrega columnas, tablas ni ENUMs. Una sola env var nueva (`VITE_GA4_MEASUREMENT_ID`) que se configura en Hostinger antes del deploy. | ✅ PASS |

**Gate result**: ✅ TODOS LOS GATES PASS. No hay violaciones que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/027-patient-dentist-landings/
├── plan.md                # Este archivo
├── research.md            # Fase 0 — research de decisiones técnicas
├── data-model.md          # Fase 1 — explícitamente vacío (no DB)
├── quickstart.md          # Fase 1 — cómo probar las landings localmente
├── contracts/
│   └── analytics-events.md # Fase 1 — schema de eventos GA4 + Meta
├── checklists/
│   └── requirements.md    # Checklist calidad spec (ya existe)
└── tasks.md               # Fase 2 — generado por /speckit-tasks (no en este comando)
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── HomePage.jsx                          # REFACTOR — patient-focused, sin "Soy Dentista" big, sin pricing
│   └── DentistLandingPage.jsx                # NUEVO — landing B2B completa
│
├── components/
│   ├── landing/                              # EXISTE — secciones del patient home (refactor)
│   │   ├── sections/
│   │   │   ├── HeroSection.jsx               # MODIFY — sacar CTAs duales si los tiene, dejar input + 1 CTA "Encontrar dentista"
│   │   │   ├── HowItWorksSection.jsx         # KEEP (renombrar/ajustar si hace falta para alinearse a 3 pasos)
│   │   │   ├── WhyDentalSpotSection.jsx      # NEW/MODIFY — 4 cards patient-focused
│   │   │   ├── PatientFaqSection.jsx         # NEW (o renombrar FAQ existente)
│   │   │   └── (otras existentes a evaluar en research.md)
│   │   │
│   │   └── dentist/                          # NUEVO directorio para landing dentista
│   │       ├── DentistHeroSection.jsx
│   │       ├── DentistStatsSection.jsx
│   │       ├── DentistProblemsSection.jsx
│   │       ├── DentistFeaturesSection.jsx
│   │       ├── DentistPricingPlaceholderSection.jsx
│   │       ├── DentistFaqSection.jsx
│   │       └── DentistFinalCtaSection.jsx
│   │
│   └── layout/
│       ├── Header.jsx                        # MODIFY — nav condicional por pathname + badge "para profesionales"
│       └── Footer.jsx                        # MODIFY — cross-link condicional según pathname
│
├── lib/
│   ├── analytics/                            # NUEVO directorio
│   │   ├── index.js                          # API unificada: trackEvent, trackPageView, identifyUser
│   │   ├── ga4.js                            # gtag.js loader + helpers
│   │   └── metaPixel.js                      # WRAPPER de metaPixel.js existente (no duplicar lógica)
│   │
│   └── (existente: metaPixel.js queda como está, lo reusamos vía wrapper)
│
├── hooks/
│   ├── useScrollDepth.js                     # NUEVO — tracker de 25/50/75/100%
│   ├── useSectionVisible.js                  # NUEVO — IntersectionObserver wrapper
│   └── useTimeOnPage.js                      # NUEVO — track al unload
│
└── app/routers/
    └── PublicRouter.jsx                      # MODIFY — agregar ruta /para-dentistas
```

**Structure Decision**: SPA React 18 + Vite con organización por feature (landing/patient, landing/dentist) bajo `src/components/landing/`. Reusamos:
- Componentes shadcn/ui existentes (`Card`, `Button`, `Input`, `Accordion`, etc.)
- Tokens Tailwind (paleta teal, fonts, breakpoints)
- Layout components (`Header`, `Footer`) con modificaciones quirúrgicas para soportar dual mode
- `Helmet` para meta tags por página
- Sistema de consent de cookies existente (`CookieConsent`) — GA4 piggyback igual que Meta Pixel

Lo nuevo está concentrado en `components/landing/dentist/` (encapsulado) y `lib/analytics/` (módulo nuevo aislado). Esta organización minimiza el blast radius del refactor y facilita testing visual independiente.

## Phase 0 — Research

Ver [research.md](./research.md) para detalles.

**Preguntas resueltas**:
1. ¿Cómo cargar GA4 en SPA Vite/React respetando consent? → Carga dinámica de gtag.js post opt-in, sin npm dep externa.
2. ¿Cómo trackear scroll depth eficientemente? → `IntersectionObserver` + percentage markers en `<div>` invisibles, no scroll listener throttled.
3. ¿Cómo trackear time on page sin perderlo al unload? → `visibilitychange` + `pagehide` con `navigator.sendBeacon()`.
4. ¿Cómo manejar anchor links del header dentist con sticky header? → `scroll-margin-top` CSS variable en cada sección.
5. ¿Badge "para profesionales" visual treatment? → Pill pequeña con text 11px teal-600 sobre fondo teal-50, posicionada a la derecha del logo (desktop) o debajo (mobile).
6. ¿HomePage.jsx existente — qué se conserva? → Inventario de secciones existente + decisión per-sección. Detalle en research.md.

## Phase 1 — Design & Contracts

### Data Model
Ver [data-model.md](./data-model.md). **Vacío explícito** — esta feature no introduce ni modifica entidades de datos. Documentado por completitud del workflow Spec Kit.

### Contracts
Ver [contracts/analytics-events.md](./contracts/analytics-events.md) — schema completo de los ~15 eventos a instrumentar (nombre, props, condición de disparo, plataforma destino).

### Quickstart
Ver [quickstart.md](./quickstart.md) — guía de cómo probar las landings localmente (`npm run dev`), URLs a abrir, qué verificar visualmente, cómo verificar analytics en DevTools.

### Agent context update
Actualizar `CLAUDE.md` para apuntar al nuevo plan activo (entre `<!-- SPECKIT START -->` y `<!-- SPECKIT END -->` markers, si existen, o agregar nota cerca de "Plan activo").

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

Ninguna violación de constitución. No aplica.

---

## Implementation phases overview

Aunque `/speckit-plan` no genera `tasks.md` (eso es `/speckit-tasks`), aquí un overview del orden lógico para que la founder vea el shape:

**Fase 1A — Plumbing (sin UI nuevo)** (~30 min)
1. Crear `src/lib/analytics/` con `index.js`, `ga4.js`, wrapper `metaPixel.js`
2. Crear hooks `useScrollDepth`, `useSectionVisible`, `useTimeOnPage`
3. Agregar env var `VITE_GA4_MEASUREMENT_ID` en Hostinger hPanel + `.env.example`
4. Wire-up básico de GA4 a `CookieConsent` existente (cargar gtag si opt-in)

**Fase 1B — Patient home refactor** (~1h)
5. Audit HomePage.jsx actual, listar secciones presentes vs deseadas
6. Refactor in-place: sacar "Soy Dentista" big CTA, sacar pricing, simplificar nav header
7. Asegurar Hero patient tiene input + CTA único → `/consulta-publica`
8. Verificar FAQ tiene preguntas patient-focused (4 mínimo)
9. Instrumentar eventos patient: `patient_home_view`, `patient_hero_cta_click`, `patient_section_visible`, `patient_faq_question_open`, `patient_footer_to_dentist_click`

**Fase 1C — Dentist landing nuevo** (~1.5h)
10. Crear `DentistLandingPage.jsx` con estructura de 7 secciones
11. Implementar cada sección bajo `src/components/landing/dentist/`
12. Pricing placeholder con CTA "Hablanos para precios" → `/contacto` o mailto
13. Instrumentar eventos dentist: `dentist_home_view`, `dentist_hero_cta_register_click`, `dentist_section_visible`, `dentist_faq_question_open`, `dentist_footer_to_patient_click`
14. FAQ profesional con 4+ preguntas

**Fase 1D — Routing + Header/Footer condicionales** (~30 min)
15. Agregar ruta `/para-dentistas` en `PublicRouter.jsx`
16. Modificar `Header.jsx` para nav condicional (Blog/Contacto/Login en patient vs Features/Pricing/Blog/Contacto/Login en dentist) + badge "para profesionales"
17. Modificar `Footer.jsx` con cross-link condicional según pathname

**Fase 1E — Smoke + commit + deploy** (~30 min)
18. Smoke local en `localhost:3000/` y `localhost:3000/para-dentistas`
19. Verificar Network tab: events GA4 + Meta llegan con consent aceptado
20. Verificar Network tab: NO se cargan ni GA4 ni Meta sin consent
21. Build → commit → push a main → Hostinger redeploy auto
22. Smoke en prod: dentalspot.cl + dentalspot.cl/para-dentistas

**Estimado total Fase 1**: ~4 horas de trabajo concentrado. Más realistic: 5-6h con review iterativo de copy y ajustes visuales.

---

## Riesgos identificados

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| HomePage.jsx tiene secciones específicas que la founder quiere preservar pero no documentadas | Media | En research.md hacer audit detallado y consultar antes de borrar |
| Header dual-mode (condicional por pathname) podría romper el flow logueado | Baja | Preservar branch del header logueado intacto; solo modificar la rama anónima |
| GA4 no instalado en Hostinger antes del deploy → eventos no llegan | Media | Documentar setup en quickstart.md; feature flag para no-op si env var ausente |
| Anchor links del header dentist con sticky header (Features → scroll a sección) saltan mal | Media | Usar `scroll-margin-top` CSS, test en sticky scenario |
| Refactor de HomePage.jsx genera regresión SEO si meta tags cambian | Baja | Preservar `<title>` actual hasta tener nuevo copy aprobado; testear con Lighthouse |
| Cookie consent existente no soporta GA4 (solo Meta) | Media | Audit cookie consent code en research.md; extender si necesario |
| Copy exacto de las landings no está definido — solo placeholders | Alta | Es esperado: founder iterará sobre copy en implementación. Documentar como assumption. |

---

## Out of scope (recordatorio Fase 1)

Estos NO se hacen en este spec:
- Mockups de celular con screenshots reales de la app
- Animaciones Framer Motion sofisticadas (más allá de basic fade-in)
- Mapa interactivo en patient hero
- Featured dentists reales
- Testimonials reales
- Pricing real con planes definidos
- SEO Schema.org diferenciado (MedicalWebPage / SoftwareApplication)
- A/B testing
- Toggle "Para Pacientes / Para Dentistas" en header
- Internacionalización
- Tests automatizados (no hay infra de tests para componentes React en el repo)

Ver `spec.md` sección "Out of Scope" y `FR-OUT-001` a `FR-OUT-009` para listado canónico.
