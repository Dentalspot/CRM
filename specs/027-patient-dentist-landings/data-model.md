# Phase 1 — Data Model

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-05-26

---

## No new data entities

Esta feature es **puramente de presentación / marketing**. No introduce ni modifica entidades de datos.

| Aspecto | Estado |
|---|---|
| Nuevas tablas Supabase | ❌ Ninguna |
| Nuevas columnas en tablas existentes | ❌ Ninguna |
| Nuevos ENUMs | ❌ Ninguno |
| Nuevas RLS policies | ❌ Ninguna |
| Nuevos triggers / functions DB | ❌ Ninguno |
| Nuevas migraciones | ❌ Ninguna |
| Modificación a `clinical_audit_log` | ❌ N/A — no se accede a PHI |
| Modificación a `organization_members` | ❌ N/A — no toca multi-tenancy |

## Datos consumidos (existentes, sin cambios)

Las landings consumen datos del estado de la sesión (vía contexts existentes):

- **`AuthContext`** → para detectar si el visitante está logueado o no (cambia el render del Header). No se hace nuevas queries.
- **`useCurrentOrganization`** → no se invoca en landings públicas (queda inactivo).

## Configuración nueva (env var)

Una sola env var nueva, configurada en Hostinger (NO en código):

| Env var | Valor | Donde |
|---|---|---|
| `VITE_GA4_MEASUREMENT_ID` | `G-XXXXXXXXXX` (de Google Analytics) | hPanel Hostinger → Variables de entorno |

## Cookie consent (existente, reusado)

El sistema de consent de cookies existente (`CookieConsent` component) ya distingue entre 3 categorías:
- **Estrictamente necesarias** — siempre activas (auth, RLS, sesión)
- **Funcionales** — opt-in (preferencias UI)
- **Marketing** — opt-in (Meta Pixel actual + GA4 nuevo)

GA4 piggyback en la categoría "Marketing" existente. NO se introduce categoría nueva ni se modifica el flow de consent del usuario.

---

**Conclusión**: spec 027 tiene **schema drift cero** (cumple Constitución VI). No requiere `/speckit-clarify` ni `/speckit-plan` adicional por temas de datos.
