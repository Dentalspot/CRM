# Feature Specification: Audit MercadoPago Subscription Flow

**Feature Branch**: `019-audit-mercadopago-flow`
**Created**: 2026-04-21
**Status**: Draft (discovery pure, revenue-critical)
**Input**: DentalSpot tiene dentistas pagando suscripciones activas vía MercadoPago (evidencia: $80.000 en dashboard de Cristóbal Tagle confirmado durante spec 007 validation). El flujo end-to-end — MercadoPago checkout → webhook → Edge Function → tabla `subscriptions` → UI refresh — **nunca fue auditado**. Revenue está fluyendo sin visibilidad sistemática sobre bugs latentes. Spec 019 hace discovery pure (patrón specs 012/017/018) para identificar bugs por severidad (BLOCKER/LATENT/EDGE/ENHANCEMENT) y preparar scope para spec(s) follow-up de fix. **Cero code edits**, audit-only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Inventario completo de componentes MercadoPago (Priority: P1)

Danissa (founder) necesita saber qué piezas técnicas componen el flujo de suscripción MercadoPago: qué edge functions existen, qué eventos webhook están suscritos, qué tablas tocan, qué callsites frontend leen/escriben `subscriptions`. Sin inventario exhaustivo, cualquier bug encontrado es parcial — no sabe si cubrió todas las superficies.

**Why this priority**: antes de analizar flows, hay que saber qué existe. P1 porque es prerequisito de Phase 2 (análisis end-to-end). Audit sin inventario = análisis incompleto.

**Independent Test**: al cierre de Phase 1, `data-model.md §Inventory` tiene matriz component × responsibility con al menos: N edge functions identificadas + listado de eventos MercadoPago suscritos + schema tabla `subscriptions` + N callsites frontend clasificados (read/write/both).

**Acceptance Scenarios**:

1. **Given** Phase 1 completa, **When** Danissa consulta `§Inventory`, **Then** encuentra matriz: [componente, tipo (edge/frontend/table), responsabilidad, eventos/tablas que toca].
2. **Given** mismo estado, **When** revisa los eventos MercadoPago listados, **Then** identifica claramente qué eventos están suscritos (payment.created/updated/refunded, subscription.*, etc.) y cuáles podrían faltar (dunning, cancellation, etc.).
3. **Given** tabla `subscriptions` identificada, **When** mira el schema capturado, **Then** entiende qué columnas existen (status, plan_id, current_period_end, last_payment_at, mp_subscription_id, etc.) y qué enforcement RLS aplica.

---

### User Story 2 — Identificar bugs revenue-critical end-to-end (Priority: P1)

Basado en el inventario, Danissa necesita saber: **¿hay revenue fugándose HOY?** Ej: ¿webhooks duplicados crean cobros dobles? ¿pagos fallidos quedan silenciosos mientras el user sigue usando la feature? ¿renovaciones no renuevan? Cada bug se clasifica por severidad (BLOCKER/LATENT/EDGE/ENHANCEMENT) con estimate de revenue impact.

**Why this priority**: **revenue-critical**. P1 junto con US1 porque un bug BLOCKER sin identificar = dinero perdiéndose. DentalSpot está en producción con dentistas pagando (≈$80k evidencia Cristóbal) — cualquier bug no-detectado se compone a medida que crecen suscriptores.

**Independent Test**: al cierre de Phase 2 + 3, `data-model.md §Findings` tiene tabla con: [bug_id, descripción, severidad, revenue impact estimado, users afectados estimados, probabilidad, reproduction steps, evidencia]. Mínimo 1 finding si el audit es productivo; **0 findings es aceptable si el sistema está bien** (documentar como "audit passed").

**Acceptance Scenarios**:

1. **Given** Phase 2 identifica webhook sin signature validation, **When** clasifica como BLOCKER, **Then** `§Findings` incluye reproduction steps (cómo un atacante podría explotar) + estimate users afectados potenciales.
2. **Given** Phase 2 identifica lack of idempotencia en handler, **When** clasifica como LATENT, **Then** documenta: "no triggered en logs aún pero dispara con MercadoPago retry default (N reintentos)".
3. **Given** Phase 2 no detecta problemas críticos, **When** verdict = "audit passed", **Then** `§Findings` documenta explícitamente qué se auditó + qué no produjo issues (evitar "no findings = no audit").

---

### User Story 3 — Preparar scope de fix follow-up(s) con priorización (Priority: P2)

Si Phase 2 encuentra ≥1 bug BLOCKER, el output debe permitir a Danissa arrancar inmediatamente spec follow-up(s) de fix. Si hay ≥3 BLOCKERs, el spec 019 propone **meta-spec** `fix-mercadopago-critical-bugs` (no lo escribe — lo sugiere) para agrupar fixes en batch coherente. Constitution §IV permite 1 spec por bug o agrupación lógica per tabla/feature.

**Why this priority**: P2 porque es output condicional (solo si hay bugs encontrados). Reduce fricción entre audit y fix — copy-paste ready al `/speckit-specify`.

**Independent Test**: si hay ≥1 BLOCKER, `data-model.md §Follow-up specs` contiene template(s) con: file/table afectado, fix proposal, priority (P0/P1), estimated size S/M/L, dependencies (ej. "depends on Supabase logs access"). Si hay ≥3 BLOCKER, sugiere meta-spec con rationale.

**Acceptance Scenarios**:

1. **Given** 1 BLOCKER detectado, **When** Danissa abre follow-up spec, **Then** copia el template directo al prompt `/speckit-specify` con scope claro.
2. **Given** 3+ BLOCKERs con causa común (ej. todos relacionados al mismo edge function), **When** Phase 3 genera output, **Then** sugiere meta-spec con nombre propuesto + listing de bugs incluidos.
3. **Given** 0 BLOCKERs pero ≥2 LATENTs, **When** Phase 3 decide priorización, **Then** recomienda follow-up P1 (no P0) y documenta que el revenue no está fugándose activamente.

---

### Edge Cases

- **Edge function existe pero no tiene logs**: audit puede leer el código sin conocer comportamiento runtime. Phase 2 incluye queries empíricas sobre `subscriptions` table para inferir comportamiento (ej. ¿hay rows con status='pending' por >48h? indicaría webhook perdido).
- **MercadoPago sandbox vs production**: si algún código está configurado para sandbox en prod (o viceversa), es BLOCKER inmediato. Phase 2 busca `MP_*` env vars + hardcoded URLs.
- **Signature validation ausente**: webhook endpoint debería validar `x-signature` header MercadoPago. Si no lo hace, cualquiera puede forjar eventos → BLOCKER P0.
- **Idempotencia ausente**: si un webhook `payment.created` llega 2 veces (MercadoPago reintenta por retry default), el handler puede crear 2 subscriptions / duplicar cobros → BLOCKER/LATENT.
- **Tax receipt (boleta) no implementado**: compliance Chile requiere boleta electrónica para ciertas transacciones. Si no se emite, es ENHANCEMENT (compliance eventual) — NO BLOCKER (SII permite tolerancia inicial para startups).
- **Plan upgrade/downgrade no implementado**: si el flow solo soporta "subscribe/unsubscribe" pero no cambiar plan → ENHANCEMENT. Usuarios pueden workaround cancelando + re-subscribiendo.
- **Dunning (retry + notify) silencioso**: si MercadoPago marca pago como failed, ¿se notifica al user? ¿Se da gracia period? ¿Se suspende la feature inmediatamente? Gap aquí es LATENT hasta que los first few users experiencien pago fallido.
- **Race condition**: 2 webhooks concurrentes (payment + subscription update) pueden escribir contradictoriamente a `subscriptions`. Si no hay lock o idempotencia, estado inconsistente. LATENT.
- **Spec 007 evidencia ($80k Cristóbal)**: si el valor displayed es calculado vs stored, puede ser stale. Phase 1 verifica si `subscriptions` tiene total ingresos o se calcula via join a tabla `billing_invoices`.
- **Meta-spec no escribir**: si ≥3 BLOCKERs, spec 019 **sugiere** nombre + scope del meta-spec pero NO lo crea (Constitution §IV — un spec por vez).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Phase 1 audit MUST inventariar completamente (a) edge functions relacionadas con MercadoPago via grep `"mercadopago"` + `"webhook"` + env vars `MP_*` en `supabase/functions/**`; (b) callsites frontend que leen/escriben `subscriptions` table via grep en `src/**`; (c) schema real de `subscriptions` table via `information_schema.columns`; (d) row counts + distribución de status actual.
- **FR-002**: Phase 1 MUST listar todos los eventos MercadoPago suscritos (parsing del código de webhook handler) + validar presencia de checks de seguridad (signature validation via header `x-signature` o equivalente).
- **FR-003**: Phase 2 MUST evaluar ≥5 puntos críticos del flow end-to-end: (a) webhook security (signature), (b) idempotencia (duplicate event handling), (c) error handling (qué pasa si edge function falla), (d) retry logic (MercadoPago default N reintentos), (e) logging/audit trail.
- **FR-004**: Phase 2 MUST ejecutar ≥3 queries empíricas sobre tabla `subscriptions` vía Danissa SQL Editor: (a) distribución de status actual + row count, (b) edades de `last_payment_at` (¿hay "suscripciones zombi" activas con pagos viejos?), (c) subscriptions sin `current_period_end` o fechas inconsistentes.
- **FR-005**: Phase 3 MUST categorizar cada finding en 1 de 4 severidades sin ambigüedad: **BLOCKER** (revenue fugándose HOY, P0 fix), **LATENT** (bug no disparado pero crítico, P1 fix), **EDGE** (caso borde improbable, P2 backlog), **ENHANCEMENT** (feature faltante no crítica, P3 backlog).
- **FR-006**: Para cada BLOCKER y LATENT, `data-model.md §Follow-up specs` MUST contener template copy-paste ready: file/table afectado + fix proposal + priority + estimated size (S/M/L) + dependencies.
- **FR-007**: Si Phase 3 detecta **≥3 BLOCKERs**, MUST proponer meta-spec `fix-mercadopago-critical-bugs` con: nombre sugerido, scope agrupado, rationale de por qué consolidar vs specs separados. **NO escribir el meta-spec** — solo sugerencia.
- **FR-008**: Spec MUST NO modificar código (`src/**`, `supabase/functions/**`, `supabase/migrations/**`). Discovery pure — cada fix es spec separado (patrón specs 017/018).
- **FR-009**: Spec MUST actualizar `architecture.md` con nueva subsección `§"MercadoPago subscription flow audit (2026-04-21, spec 019)"` con: inventario, findings, severidad distribution, action decisions.
- **FR-010**: Phase 2 MUST incluir análisis de gaps funcionales (plan upgrade/downgrade, cancellation flow, failed payment handling, refund handling) — cada gap identificado se clasifica como ENHANCEMENT (no-BLOCKER salvo que impacte revenue directo).
- **FR-011**: Phase 1 audit MUST revisar si edge function usa `MP_SANDBOX_*` vs `MP_PROD_*` env vars — misconfiguración sandbox-en-prod sería BLOCKER inmediato.
- **FR-012**: Phase 3 verdict MUST incluir estimate de revenue at risk: para cada BLOCKER/LATENT, (a) users afectados estimados, (b) revenue per user approx ($20k-$80k CLP/mes basado en evidencia Cristóbal), (c) probabilidad de ocurrencia (baja/media/alta). Revenue impact total estimado como suma simple para comunicar escala al founder.

### Key Entities

- **Edge function MercadoPago webhook handler**: endpoint que recibe eventos MercadoPago (payment.created, payment.updated, etc.) y actualiza `subscriptions`. Ubicación probable: `supabase/functions/mercadopago-webhook/` o similar.
- **`subscriptions` table**: fuente de verdad del estado de suscripción del user. Columnas probables: `id`, `user_id`, `plan_id`, `status`, `mp_subscription_id`, `mp_customer_id`, `current_period_end`, `last_payment_at`, `cancelled_at`, `created_at`, `updated_at`.
- **`billing_invoices` table** (spec 014 policies aplicadas): registro de facturación individual. Relación con `subscriptions`: cada invoice es un pago específico, subscription es el plan recurrente.
- **MercadoPago events**: eventos webhook suscritos. Canonical: `payment.created`, `payment.updated`, `payment.cancelled`, `payment.refunded`, `subscription.created`, `subscription.updated`, `subscription.cancelled`, potencialmente `chargeback.*`.
- **Signature validation**: mecanismo de seguridad MercadoPago que firma payloads webhook con secret. Handler debe verificar `x-signature` header antes de procesar.
- **Idempotency key**: típicamente `mp_payment_id` o `mp_subscription_id` — handler debe detectar duplicados y no-op.
- **Dunning flow**: sequence post-failed-payment para notify user + retry (MercadoPago default 3 reintentos por default) + decisión suspensión vs grace period.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Phase 1 inventario cubre 100% de componentes detectables via grep (edge functions + frontend callsites + schema). 0 componentes missing en cross-check Phase 2.
- **SC-002**: ≥5 puntos críticos del flow evaluados (webhook security, idempotencia, error handling, retry logic, logging). Cada uno con verdict (OK / finding).
- **SC-003**: ≥3 queries empíricas ejecutadas sobre `subscriptions` table. Outputs documentados.
- **SC-004**: Todos los findings clasificados por severidad (BLOCKER/LATENT/EDGE/ENHANCEMENT) sin ambigüedad. 0 findings "unclear".
- **SC-005**: Para cada BLOCKER/LATENT, template de follow-up spec copy-paste ready. Verificable con count: #(BLOCKER + LATENT) == #(templates).
- **SC-006**: Si ≥3 BLOCKERs, meta-spec sugerido en output. Si <3, cada bug = spec independiente.
- **SC-007**: Revenue impact estimate documentado para cada BLOCKER/LATENT: users × revenue × probabilidad.
- **SC-008**: post-close, `architecture.md §"MercadoPago subscription flow audit"` existe con inventario + findings + action decisions.
- **SC-009**: Tiempo total ≤ **90 min** (bound superior 120 min antes de STOP).

## Assumptions

- **MercadoPago es el gateway**: DentalSpot usa MercadoPago para suscripciones Chile (no Stripe, no PayPal). Confirmado por evidencia Cristóbal.
- **Edge functions en Supabase**: el webhook handler vive como edge function Deno (patrón canonical Supabase). Phase 1 Query α grep confirma.
- **Tabla `subscriptions` existe con RLS**: spec 006/009/014 aplicaron policies similares; `subscriptions` podría tener policies análogas. Phase 1 schema check confirma existencia.
- **MCP execute_sql denegado**: queries empíricas Phase 2 van via Danissa en Supabase SQL Editor (contexto heredado).
- **Discovery pure**: si audit detecta bugs, fix es spec(s) separado(s). Constitution §IV.
- **Revenue per user approx $20k-$80k CLP/mes**: basado en evidencia Cristóbal ($80k mostrado). Phase 3 estimate usa rango conservador.
- **Spec 007 evidencia $80k**: confirmó que al menos 1 dentist está pagando. N total de paying dentists desconocido — Phase 2 query agregada sobre `subscriptions.status='active'` da count.
- **MercadoPago retry default**: 3 reintentos en primeras 24h (comportamiento standard). Si handler no es idempotent, duplicates esperados.
- **Sandbox vs prod distinction**: MercadoPago env vars típicamente `MP_ACCESS_TOKEN` (distinto entre envs). Misconfiguración detectable por grep.
- **Logging mínimo esperado**: edge function debería loggear cada webhook recibido (timestamp + event type + processing result) — si no, diagnóstico futuro imposible.

## Scope Bounds

- **In scope**: grep código (edge functions + frontend) + queries empíricas `subscriptions` + análisis 5 puntos críticos + gaps funcionales + findings matriz + severidad + follow-up templates + update `architecture.md`.
- **Out of scope** (hard boundaries):
  - Cualquier fix (cada bug = spec separado).
  - Modificación `src/**`, `supabase/functions/**`, `supabase/migrations/**`.
  - Escribir meta-spec follow-up (solo sugerir).
  - Tests automatizados.
  - Auditoría de otros gateways (solo MercadoPago).
  - MercadoPago API testing con sandbox (pura inspección estática + empírica sobre DB).
  - Análisis legal de boletas/facturación Chile (SII compliance es spec propio si aplica).
  - Audit de `billing_invoices` como entidad standalone (solo relación con `subscriptions`).
  - Refund flow deep-dive (menciona gap si falta, pero no evalúa refund logic).
  - Plan catalog management (si existe tabla `plans`, solo mencionar).

## Rollback Plan

**N/A — discovery pure**. No hay cambios aplicables al codebase ni al DB. Si el veredicto resulta erróneo post-close (ej. finding falso positivo), se re-abre audit en spec futuro con evidencia adicional.

**Única acción reversible**: actualización `architecture.md §"MercadoPago audit"`. Si el verdict se invalida, edit directo sin spec (doc hygiene).

## Dependencies

- **Constitution §I (Compliance-First)**: potencialmente aplica si findings tocan datos personales user (Ley 21.719) — facturación es PII.
- **Constitution §IV (Micro-Bloques)**: discovery pure, fixes = specs separados. Meta-spec solo sugerencia.
- **Constitution §V (UI Honesty)**: si hay silent fails en UI (ej. pago fallido sin notification), violación §V documentada.
- **spec 007 validation ($80k Cristóbal)**: evidencia empírica de que el sistema genera revenue real.
- **spec 009 (`marketplace_purchases`)**: tabla billing relacionada con 4 policies aplicadas. Patrón de policies útil para comparar con `subscriptions`.
- **spec 014 (`billing_invoices` policies)**: modelo canonical RLS para tabla billing. Si `subscriptions` no tiene policies similares, es finding.
- **`architecture.md §Edge functions inventory`**: contexto (si existe listado). Phase 1 lo valida.
- **`architecture.md §RLS coverage audit`**: contexto global RLS. `subscriptions` puede haber sido auditada.
- **PATTERNS.md §4 (audit defensivo)**: metodología.
- **PATTERNS.md §7 (state drift re-verification)**: aplicable si queries empíricas revelan estado inesperado.
