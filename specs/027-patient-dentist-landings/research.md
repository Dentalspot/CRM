# Phase 0 — Research: Patient & Dentist Landings

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-05-26

---

## Decisión 1: Cargar GA4 en SPA Vite/React con consent

**Decisión**: Carga dinámica de `gtag.js` post-opt-in, **sin npm dependency externa** (ej. `react-ga4`).

**Rationale**:
- El bundle base no debe incluir código de GA4 si el user no opta — privacy + bundle size.
- `react-ga4` (npm) requiere `useEffect` para init y carga gtag.js de cualquier forma. No agrega valor sobre hacerlo nosotros.
- gtag.js es 30 KB pero externo (no impacta bundle de DentalSpot).
- Integración mínima: nuestro módulo `ga4.js` expone `init(measurementId)` y `track(eventName, props)`. Init inserta `<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX">` en `<head>` solo si el user opta.

**Alternatives considered**:
- `react-ga4` npm package — descartado, agrega 8 KB innecesarios al bundle.
- Hardcoded `<script>` en `index.html` — descartado, carga GA4 ANTES del consent.
- Google Tag Manager — descartado por overhead (GTM container es más pesado y requiere setup en consola que no tenemos).

**Implementation note**:
```js
// src/lib/analytics/ga4.js (pseudo)
let initialized = false;
export const initGA4 = (measurementId) => {
  if (initialized || !measurementId) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
  initialized = true;
};
export const trackGA4 = (eventName, props = {}) => {
  if (!initialized || !window.gtag) return;
  window.gtag('event', eventName, props);
};
```

---

## Decisión 2: Scroll depth tracking eficiente

**Decisión**: `IntersectionObserver` sobre 4 `<div>` invisibles posicionados en 25/50/75/100% de la altura del scroll del documento, **NO** scroll listener throttled.

**Rationale**:
- Scroll listeners (`window.addEventListener('scroll')`) requieren throttle/debounce y consumen main thread. Mal en mobile.
- `IntersectionObserver` es nativo, off-main-thread, performante.
- Cada marker dispara su evento UNA vez cuando entra al viewport.

**Alternatives considered**:
- Listener `scroll` con `requestAnimationFrame` — funciona pero más código y peor perf que IO.
- Plugin tipo `react-scroll-percentage` — overhead npm.

**Implementation note**:
```jsx
// src/hooks/useScrollDepth.js (pseudo)
export const useScrollDepth = (onDepth) => {
  useEffect(() => {
    const fired = new Set();
    const markers = [25, 50, 75, 100].map((pct) => {
      const div = document.createElement('div');
      div.style.cssText = `position:absolute;top:${pct}vh;left:0;width:1px;height:1px;pointer-events:none;`;
      // Actually use document.body.scrollHeight * pct/100 absolute positioning
      // ... (detalles en implement)
      return { pct, div };
    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const pct = parseInt(e.target.dataset.pct);
          if (!fired.has(pct)) {
            fired.add(pct);
            onDepth(pct);
          }
        }
      });
    });
    markers.forEach(({ div }) => {
      document.body.appendChild(div);
      observer.observe(div);
    });
    return () => {
      observer.disconnect();
      markers.forEach(({ div }) => div.remove());
    };
  }, [onDepth]);
};
```

---

## Decisión 3: Time on page sin perder al unload

**Decisión**: Combinación de `visibilitychange` + `pagehide` events con `navigator.sendBeacon()` para garantizar entrega del evento incluso en cierre de tab.

**Rationale**:
- `beforeunload` es unreliable en mobile (Safari iOS lo ignora).
- `visibilitychange` con `state === 'hidden'` es el evento moderno recomendado.
- `sendBeacon()` es el método garantizado de envío durante unload — XHR async se cancela.
- GA4 y Meta Pixel tienen `transport: 'beacon'` interno, pero queremos asegurarnos de mandar el `time_on_page` calculado nosotros.

**Alternatives considered**:
- `beforeunload` solo — descartado por incompatibilidad iOS.
- Heartbeat cada N segundos a GA4 (built-in `engagement_time_msec`) — descartado: GA4 ya lo trackea, pero queremos un evento explícito que sume con consistencia entre Meta y GA4.

**Implementation note**:
```jsx
// src/hooks/useTimeOnPage.js (pseudo)
export const useTimeOnPage = (onUnload) => {
  useEffect(() => {
    const startTime = Date.now();
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        onUnload(seconds);
      }
    };
    document.addEventListener('visibilitychange', handler);
    window.addEventListener('pagehide', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
      window.removeEventListener('pagehide', handler);
    };
  }, [onUnload]);
};
```

---

## Decisión 4: Anchor links del header dentist con sticky header

**Decisión**: Usar CSS `scroll-margin-top: var(--header-height)` en cada sección con id, y `scroll-behavior: smooth` en `html`.

**Rationale**:
- El header en `/para-dentistas` es probable sticky (decisión Fase 2, pero plan-conservative: asumimos sticky).
- Sin `scroll-margin-top`, el anchor `#features` salta a la sección pero queda OCULTO bajo el header sticky.
- `scroll-behavior: smooth` da scroll suave gratis sin JS.
- Tailwind tiene utility `scroll-mt-{n}` para esto.

**Alternatives considered**:
- `scrollIntoView({ behavior: 'smooth', block: 'start' })` con offset manual JS — más código, mismo resultado.
- Sin sticky header — descartado, los SaaS landings modernos siempre tienen sticky header con CTA.

**Implementation note**:
```jsx
// Estructura típica:
<section id="features" className="scroll-mt-20 py-16">...</section>
<section id="pricing" className="scroll-mt-20 py-16">...</section>

// Header link:
<a href="#features" className="...">Features</a>
```

---

## Decisión 5: Badge "para profesionales" — visual treatment

**Decisión**: Pill pequeña con texto "para profesionales" en font 11px, color teal-700 sobre fondo teal-50, posicionada **a la derecha del logo en desktop** (al lado del wordmark) y **debajo del logo en mobile** (sm:flex-row con flex-col).

**Rationale**:
- Debe ser DISCRETA pero IDENTIFICABLE — no compite con el logo, pero comunica "estás en la landing para dentistas".
- Color teal-50/teal-700 mantiene el branding.
- 11px font es legible sin gritar.
- Position relative al logo (no absoluto) para que escale con el header.

**Alternatives considered**:
- Cambiar el logo entero por una versión con "para profesionales" rendered in image — descartado, requiere asset nuevo + no permite tema dark/light futuro.
- Badge en otra posición (ej. esquina opuesta del header) — descartado, no liga visualmente con el logo.
- Solo cambiar copy del título de pestaña sin badge visual — descartado, el badge era explícitamente parte de la respuesta clarify Q1.

**Implementation note**:
```jsx
// Header.jsx (pseudo)
const location = useLocation();
const isDentistLanding = location.pathname === '/para-dentistas';

return (
  <header className="...">
    <Link to="/" className="inline-flex items-center gap-2">
      <Logo />
      {isDentistLanding && (
        <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-medium text-teal-700 bg-teal-50 rounded-full">
          para profesionales
        </span>
      )}
    </Link>
    {/* En mobile, badge debajo */}
    {isDentistLanding && (
      <span className="sm:hidden block ml-12 -mt-1 text-[10px] text-teal-700">
        para profesionales
      </span>
    )}
    {/* ... resto del nav condicional ... */}
  </header>
);
```

---

## Decisión 6: Inventario HomePage.jsx — qué se conserva

**Acción**: Audit de `src/pages/HomePage.jsx` y todos los componentes que importa.

**Hallazgos del audit** (preliminar — confirmar en implementación):
- `HeroSection.jsx` — actualmente probablemente tiene "Resuelve tu problema dental" + 2 CTAs ("Describe tu síntoma" + "Soy Dentista"). **Acción**: simplificar a input grande + 1 CTA "Encontrar dentista" → `/consulta-publica`. Sacar "Soy Dentista".
- `ClinicsAndBookingSection.jsx` — sección de clínicas + booking. **Evaluar**: ¿es relevante para Patient home Fase 1? Si muestra clínicas reales, puede quedar; si es placeholder vacío, sacar.
- "Cómo funciona" — si existe, ajustar a 3 pasos según spec.
- FAQ existente — verificar que tenga 4+ preguntas patient-focused (ver FR-005).
- Footer existente — agregar cross-link a `/para-dentistas`.

**Rationale**: NO borrar sin entender qué hay. La founder dijo "me gusta la idea de cosas en movimiento" → preservar lo que ya tiene movimiento (Framer Motion) y construir sobre eso en Fase 2.

**Alternatives considered**:
- Borrar HomePage.jsx y reescribir from scratch — descartado, riesgo de perder funcionalidad útil + más trabajo.
- Crear `HomePage.new.jsx` y route-swap — descartado, complica el changelog de la feature.

---

## Decisión 7: Cookie consent existente — ¿soporta GA4?

**Acción**: Audit del componente `CookieConsent` y la lógica que carga Meta Pixel hoy.

**Hipótesis**: El `CookieConsent` carga `metaPixel.js` cuando el user acepta marketing. Para GA4 hay que:
- Extender el código que reacciona al opt-in para ALSO disparar `initGA4(VITE_GA4_MEASUREMENT_ID)`.
- Si el componente está bien diseñado, esto es 2-3 líneas de cambio.

**Plan**: durante implementación leer el código actual y decidir entre:
- (a) Modificar `CookieConsent` para que cargue ambos.
- (b) Crear un hook único `useMarketingAnalytics()` que ambos componentes (CookieConsent y AuthContext) puedan invocar.

**Decisión final**: (a) probablemente — minimal change. Documentar en commit.

---

## Decisión 8: ¿Toggle del header (Para Pacientes / Para Dentistas)?

**Decisión**: **NO** incluir toggle de header en Fase 1. Solo cross-link en footer.

**Rationale**:
- Spec dice "Toggle es opcional Fase 2".
- Footer cross-link es suficiente para visitantes que se equivocaron de audiencia (US3).
- El toggle agrega ruido visual al header sin valor claro para visitantes que llegaron al lugar correcto.
- A/B test en Fase 3 puede medir si vale la pena agregarlo.

**Alternatives considered**: Toggle prominente → ya descartado en clarify Q5 (decidió 5 items header).

---

## Resumen de decisiones

| # | Tema | Decisión | Impacto en plan |
|---|---|---|---|
| 1 | GA4 loader | Vanilla gtag.js, no npm | `lib/analytics/ga4.js` |
| 2 | Scroll depth | IntersectionObserver | `hooks/useScrollDepth.js` |
| 3 | Time on page | visibilitychange + sendBeacon | `hooks/useTimeOnPage.js` |
| 4 | Anchor links | CSS scroll-margin-top + smooth | Tailwind classes en secciones |
| 5 | Badge logo | Pill teal-50/teal-700 derecha logo | Modificar `Header.jsx` |
| 6 | HomePage refactor | In-place, audit por sección | Refactor cuidadoso |
| 7 | Cookie consent | Extender opt-in para GA4 | 2-3 líneas en `CookieConsent` |
| 8 | Header toggle | Fase 1: NO, solo footer cross-link | Sin cambio en plan |

Todas las NEEDS CLARIFICATION resueltas. Plan listo para Phase 1 design contracts.
