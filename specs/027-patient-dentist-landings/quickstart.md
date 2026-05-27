# Quickstart — Probar las landings localmente

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-05-26

Guía rápida para verificar las 2 landings durante el desarrollo (después de `/speckit-implement`).

---

## Pre-requisitos

- Dev server corriendo: `npm run dev` → `http://localhost:3000`
- `.env` local con (al menos) `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (igual que el dev normal).
- Para probar analytics localmente: `VITE_GA4_MEASUREMENT_ID=G-TEST_OR_REAL_ID` en `.env`. Si está vacío, GA4 queda no-op (la app sigue funcionando).

---

## 1. Patient home (`/`)

**URL**: `http://localhost:3000/`

**Qué verificar visualmente**:
- [ ] Logo horizontal arriba a la izquierda, sin badge "para profesionales".
- [ ] Header con items: `Blog` · `Contacto` · `Iniciar sesión`. **NO** debe haber CTA "Soy Dentista" grande ni Pricing en header.
- [ ] Hero con:
  - Título patient-focused (NO "Resuelve tu problema dental" — esa frase ya no está)
  - Input grande "Describe tu síntoma o necesidad"
  - CTA primario "Encontrar dentista"
- [ ] Click en CTA → debe llevar a `/consulta-publica` (con el texto del input pre-cargado idealmente).
- [ ] Scrollear hasta footer: ver link "¿Eres dentista? → DentalSpot para profesionales".
- [ ] Click en logo → recarga a `/` (raíz patient).
- [ ] Click en "Iniciar sesión" → `/auth`.

**Secciones esperadas** (de arriba abajo):
1. Hero
2. Cómo funciona (3 pasos)
3. Por qué DentalSpot (4 cards)
4. FAQ paciente
5. Footer

---

## 2. Dentist landing (`/para-dentistas`)

**URL**: `http://localhost:3000/para-dentistas`

**Qué verificar visualmente**:
- [ ] Logo horizontal arriba + **badge "para profesionales"** al lado (desktop) o debajo (mobile).
- [ ] Header con items: `Features` · `Pricing` · `Blog` · `Contacto` · `Iniciar sesión`.
- [ ] Click en "Features" del header → scroll smooth a la sección de features.
- [ ] Click en "Pricing" del header → scroll smooth a la sección de pricing placeholder.
- [ ] Hero con:
  - Título B2B ("Tu clínica, organizada y creciendo" o equivalente)
  - **Un solo CTA primario** "Crear cuenta gratis" (NO debe haber "Ver demo")
- [ ] Click en CTA → `/auth`.
- [ ] Sección Pricing: ver título "Precios" + copy "planes próximamente" + CTA "Hablanos para precios" → debe abrir mailto `contacto@dentalspot.cl` o ir a `/contacto`.
- [ ] CTA final "Empezá gratis 30 días" → `/auth`.
- [ ] Footer: ver link "¿Eres paciente? → Buscar dentista".
- [ ] Click en logo → va a `/` (raíz patient), NO se queda en `/para-dentistas`.

**Secciones esperadas** (de arriba abajo):
1. Hero (con badge en header)
2. Stats sociales (placeholder)
3. Problemas que resuelve (3 columnas)
4. Feature spotlight (4 features)
5. Pricing placeholder
6. FAQ profesional
7. CTA final
8. Footer

---

## 3. Cross-navigation

**Test**:
- [ ] Estar en `/` → click footer "¿Eres dentista?" → llega a `/para-dentistas`.
- [ ] Estar en `/para-dentistas` → click footer "¿Eres paciente?" → llega a `/`.
- [ ] Estar en cualquiera → click logo → siempre va a `/`.

---

## 4. Verificar analytics (con cookies aceptadas)

Pre-requisito: aceptar cookies de marketing en el banner que aparece al primer load.

**En DevTools → Network**:
1. Filtro `google-analytics.com` o `analytics.google.com`
2. Filtro `facebook.com/tr` o `connect.facebook.net`

**Eventos a verificar** (ver `contracts/analytics-events.md` para schema):

| Acción | Evento esperado | Plataforma |
|---|---|---|
| Cargar `/` | `patient_home_view` + `page_view` (GA4 auto) | Meta + GA4 |
| Click hero CTA en patient | `patient_hero_cta_click` con prop `has_symptom_input` | Meta + GA4 |
| Scrollear hasta 50% | `scroll_depth` con prop `depth_pct: 50` | GA4 |
| Click FAQ patient | `patient_faq_question_open` con prop `question_id` | GA4 |
| Click footer "¿Eres dentista?" | `patient_footer_to_dentist_click` | Meta + GA4 |
| Cargar `/para-dentistas` | `dentist_home_view` | Meta + GA4 |
| Click "Crear cuenta gratis" hero dentist | `dentist_hero_cta_register_click` | Meta + GA4 |
| Click "Features" del header | (anchor scroll, no evento custom) | — |
| Sección Features visible | `dentist_section_visible` con `section_name: features` | GA4 |
| Click "Hablanos para precios" | `dentist_pricing_contact_click` | Meta + GA4 |
| Click CTA final | `dentist_final_cta_click` | Meta + GA4 |
| Cerrar tab | `time_on_page` (vía sendBeacon) | GA4 |

---

## 5. Verificar consent gating

**Test**:
- [ ] Abrir incógnita nueva → `localhost:3000` → ver banner de cookies.
- [ ] Antes de aceptar → Network NO debe mostrar requests a `google-analytics.com` ni `facebook.com/tr`.
- [ ] **Rechazar marketing cookies** → recargar página → confirmar que NO se cargan ni GA4 ni Meta Pixel.
- [ ] **Aceptar marketing cookies** → recargar → confirmar que ambos scripts cargan y eventos disparan.

---

## 6. Verificar responsive

Probar en diferentes anchos:
- [ ] **Mobile (375px)** — Chrome DevTools → Toggle Device Toolbar → iPhone SE. Logo + badge se apilan vertical en `/para-dentistas`. Hero patient input ocupa ancho completo. CTAs grandes y tappables.
- [ ] **Tablet (768px)** — header items visibles, no hamburguesa todavía (o sí, según breakpoint definido).
- [ ] **Desktop (1280px+)** — layout completo.

---

## 7. Verificar SEO básico

En DevTools → Elements → `<head>`:
- [ ] `/`: title debería ser "DentalSpot | Encuentra un dentista en minutos" (o similar patient-focused).
- [ ] `/para-dentistas`: title diferente, dentist-focused (ej. "DentalSpot para Profesionales | Software para clínicas dentales").
- [ ] `og:title` y `og:description` distintos entre ambas.
- [ ] Ambas tienen `<link rel="canonical">` apuntando a su propia URL.

---

## 8. Build production check

Antes de pushear, verificar que el build pasa:

```bash
npx vite build
```

Salida esperada: `✓ built in NNs` sin errores. El bundle size delta debería ser menor a +30 KB gzip vs antes del feature (ver Performance Goals en plan.md).

---

## 9. Smoke en prod post-deploy

Después del push a `main` y deploy automático de Hostinger (~2 min):

1. Incógnita nueva → `https://dentalspot.cl/`
2. Repetir checks de "1. Patient home" en prod.
3. Incógnita nueva → `https://dentalspot.cl/para-dentistas`
4. Repetir checks de "2. Dentist landing" en prod.
5. Verificar analytics en GA4 Real-time dashboard (delay ~30 seg).
6. Verificar Meta Events Manager → Test Events.

---

## Troubleshooting

| Problema | Solución |
|---|---|
| Bundle hash no cambia post-deploy | Hostinger CDN cache. Esperar 5 min o agregar `?v=N` a CSS/JS imports temporalmente. |
| GA4 no dispara eventos | Verificar `VITE_GA4_MEASUREMENT_ID` está en Hostinger env vars. Verificar consent aceptado. |
| Anchor links saltan mal (header tapa la sección) | Aumentar `scroll-mt-{n}` Tailwind class en las secciones target. |
| Badge "para profesionales" no se ve | Verificar que `location.pathname === '/para-dentistas'` (exact match, no startsWith). |
| Cross-link footer va al lugar equivocado | Verificar import de `Link` de react-router-dom (no `<a>`). |
