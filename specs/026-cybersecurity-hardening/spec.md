# SPEC 026 — Cybersecurity Hardening

## Fecha: 2026-04-16
## Estado: IMPLEMENTED
## Prioridad: CRÍTICA

---

## Contexto

DentalSpot procesa datos clínicos sensibles (fichas dentales, diagnósticos, alergias, RUTs).
La Ley 21.719 de protección de datos personales y la Ley 20.584 de derechos del paciente exigen
medidas técnicas y organizativas de seguridad adecuadas al riesgo.

---

## 1. Security Headers (vercel.json)

### Estado: IMPLEMENTADO

Configurados en `vercel.json` para todas las rutas (`/(.*)`):

| Header | Valor | Protección |
|--------|-------|-----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Fuerza HTTPS, previene downgrade a HTTP |
| `X-Content-Type-Options` | `nosniff` | Bloquea MIME type sniffing |
| `X-Frame-Options` | `DENY` | Previene clickjacking (iframe embedding) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | No filtra URLs completas a terceros |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=(), payment=()` | Bloquea APIs de hardware innecesarias. Micrófono permitido para Notiz. |
| `X-DNS-Prefetch-Control` | `on` | Performance: pre-resuelve DNS de terceros |
| `Content-Security-Policy` | Allowlist explícita por tipo de recurso | Bloquea scripts/estilos/imágenes/conexiones no autorizadas |

### CSP — Dominios autorizados

| Directiva | Dominios permitidos |
|-----------|-------------------|
| `script-src` | self, Supabase, Vercel analytics, Facebook Pixel, GTM |
| `style-src` | self, Google Fonts (inline necesario para Tailwind) |
| `font-src` | self, Google Fonts (gstatic) |
| `img-src` | self, Supabase storage, Unsplash, Google avatars |
| `connect-src` | self, Supabase (HTTP + WSS), Vercel, Facebook, API DentalSpot |
| `frame-src` | self, MercadoPago (checkout) |
| `media-src` | self, Supabase storage (audio Notiz) |
| `object-src` | none |
| `base-uri` | self |
| `form-action` | self |

---

## 2. Row Level Security (RLS)

### Estado: IMPLEMENTADO — 3 fases completas

| Fase | Tablas | Policies | Estado |
|------|--------|----------|--------|
| Fase 1 — Administrativa | organizations, organization_members, patients, appointments, patient_payments | 36 | ✅ |
| Fase 2 — Clínica | patient_clinical_record, clinical_history, odontograms, odontogram_evaluations, patient_diagnoses, patient_documents, patient_private_notes, patient_assigned_plans, clinical_reports, patient_care_team | 45 + 7 fix INSERT | ✅ |
| Fase 3 — Compliance | clinical_audit_log, processing_lawful_basis, exceptional_access_grants, migration_review_queue | 18 | ✅ |

### Principios RLS aplicados

1. **Aislamiento por organización:** Toda tabla con `organization_id` filtra por membresía activa del usuario en `organization_members`.
2. **Acceso clínico por equipo tratante:** Tablas de datos de salud requieren `patient_care_team` activo para lectura/escritura.
3. **Acceso excepcional auditado:** `clinic_admin` puede acceder a datos clínicos solo con `exceptional_access_grant` activo y no expirado. Solo lectura.
4. **Append-only para auditoría:** `clinical_audit_log` y `processing_lawful_basis` tienen triggers que bloquean UPDATE y DELETE.
5. **Separación admin/clínica:** El assistant no tiene acceso a tablas clínicas. Usa `patients_admin_view` para datos de contacto.

### Funciones helper SECURITY DEFINER

- `is_org_member(org_id, role)` — verifica membresía activa
- `is_in_care_team(patient_id)` — verifica equipo tratante activo
- `is_own_patient(patient_id)` — verifica que el paciente es del usuario (profile_id)
- `has_active_grant(patient_id)` — verifica grant excepcional activo

### Validación

6 rondas de pruebas RLS ejecutadas y documentadas:
- Ronda 1: Preparación de dataset
- Ronda 2: Administrativas (22 pruebas, 100% PASS)
- Ronda 3: Clínicas (17 pruebas, 100% PASS post-fix recursión)
- Ronda 4: Grants (verificación con grant activo/revocado)
- Ronda 5: Compliance (append-only, INSERT restrictivo)
- Ronda 6: Denegación integral (platform_admin sin acceso clínico, DELETE bloqueado)

---

## 3. CORS — Cross-Origin Resource Sharing

### Estado: IMPLEMENTADO

### Antes (inseguro)
```
Access-Control-Allow-Origin: *
```
Todas las edge functions de Supabase aceptaban requests de cualquier dominio.

### Después (restringido)
```
Access-Control-Allow-Origin: https://dentalspot.cl
```

### Dominios autorizados

| Dominio | Entorno | Tipo |
|---------|---------|------|
| `https://dentalspot.cl` | Producción | Dominio principal |
| `https://www.dentalspot.cl` | Producción | Alias www |
| `https://dentalspot.vercel.app` | Preview | Vercel preview deployments |
| `http://localhost:5173` | Desarrollo | Vite dev server |
| `http://localhost:3000` | Desarrollo | Alternativo |

### Archivos modificados

- `supabase/functions/_shared/supabase-client.ts` — `corsHeaders` cambiado a `dentalspot.cl` + nueva función `getCorsHeaders(req)` con validación dinámica de origen
- 18 edge functions con CORS inline corregidas

### Función dinámica de CORS (para migración progresiva)

```typescript
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Vary': 'Origin',
  };
}
```

Las funciones pueden migrar progresivamente de `corsHeaders` (estático) a `getCorsHeaders(req)` (dinámico con validación de origen).

---

## 4. Medidas adicionales de seguridad ya implementadas

| Medida | Estado | Referencia |
|--------|--------|-----------|
| XSS sanitización (DOMPurify + escapeHTML) | ✅ | Lotes 2A + 2B |
| Idle timeout de sesión (30 min) | ✅ | Lote 3A |
| Password hardening en registro (8+ chars, complejidad) | ✅ | Lote 3A |
| Logger sanitizado en producción | ✅ | Lote 3A |
| Módulos heredados aislados con feature flags | ✅ | Lote 1 |

---

## 5. Medidas implementadas en hardening (2026-04-16)

| # | Medida | Estado | Detalle |
|---|--------|--------|---------|
| B1 | Webhook signature verification (MercadoPago) | ✅ | HMAC-SHA256 con `x-signature` header. Rechaza 401 si firma inválida. Graceful degradation si no hay secret configurado. |
| B2 | Remover `unsafe-eval` del CSP | ✅ | CSP ya no permite `eval()`. Se agregó `upgrade-insecure-requests`. |
| B5 | Fix SECURITY DEFINER search_path | ✅ | 113 funciones del baseline corregidas con `SET search_path = public` vía migración batch. |
| B6 | npm audit en CI | ✅ | `npm audit --audit-level=high --omit=dev` como paso obligatorio antes del build. |
| C1 | .env.example | ✅ | Archivo con placeholders sin valores reales. |
| C7 | upgrade-insecure-requests | ✅ | Agregado al CSP. |

---

## 6. Deuda de seguridad conocida

| # | Deuda | Severidad | Resolución futura |
|---|-------|-----------|-------------------|
| 1 | RPCs `accept_referral` y `associate_patient_to_therapist` son SECURITY DEFINER y bypasean RLS | Media | Rediseñar sobre modelo nuevo |
| 2 | MFA/2FA no implementado | Media | Requiere flujo UX completo |
| 3 | Rate limiting en edge functions (AI, pagos) | Media | Token-bucket o Supabase rate limiting |
| 4 | Column-level RLS no soportado por PostgreSQL | Baja | Protección por vista + UI para assistant |
| 5 | Edge functions: migrar de `corsHeaders` estático a `getCorsHeaders(req)` dinámico | Baja | Migración progresiva |
| 6 | Validación server-side de uploads (tipo, tamaño, contenido) | Media | Storage policies + MIME validation |
| 7 | Limpieza de logs en edge functions (178 console.log con datos de pago) | Media | Structured logging + strip PII |
| 8 | Subresource Integrity (SRI) para scripts externos | Baja | Agregar integrity attributes |

---

## Compliance

Esta spec contribuye al cumplimiento de:
- **Ley 21.719** Art. 14 — medidas de seguridad técnicas adecuadas al riesgo
- **Ley 20.584** Art. 12 — protección de la ficha clínica
- **OWASP Top 10** — headers de seguridad, CORS restrictivo, protección XSS
