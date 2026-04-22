# Implementation Plan: Migrate MercadoPago Integration to DentalSpot Brand

**Branch**: `020-migrate-mp-brand` | **Date**: 2026-04-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/020-migrate-mp-brand/spec.md`

## Summary

Rebrand semántico de 3 edge functions MercadoPago (`create-mp-checkout`, `create-mercadopago-preference`, `mercadopago-webhook`) reemplazando huellas legacy FonoKit (`fonokit_sub_*`, `fonokit_order_*`, `fonokit.cl`, `FONOKIT`) por branding DentalSpot. **Pre-requisite absoluto** del meta-spec `fix-mercadopago-critical-bugs` (F-001/F-002/F-003/F-005 del audit spec 019).

**Approach**: Discovery exhaustiva → edits atómicos de strings → swap secret + deploy en misma ventana → smoke test sandbox end-to-end. **0 migraciones**, **0 edits a `src/**`**, **0 fixes de seguridad** (diferidos a meta-spec).

**Time budget técnico post-plan**: 60-75 min (tasks + implement + deploy + smoke). Pre-requisite operacional Danissa **✅ ya completado en sesión 2026-04-22**: app MP Dentalspot creada, Access Token sandbox obtenido, webhook configurado + signing key generada + "Guardar configuración" clickeado.

---

## Technical Context

**Language/Version**: TypeScript (Deno runtime para Supabase edge functions)
**Primary Dependencies**: `@supabase/supabase-js@2` (createClient para DB reads), `fetch` nativo Deno (requests a MercadoPago API)
**Storage**: N/A — rebrand no toca DB (lee `subscription_plans`, `discount_coupons`, `marketplace_plans`, `marketplace_items` existentes sin modificar schema)
**Testing**: `curl` post-deploy contra endpoints sandbox + verificación visual en panel MercadoPago DentalSpot (no unit tests formales)
**Target Platform**: Supabase Edge Functions (Deno runtime hosted, project `tomremkbuxvedliyywbo`)
**Project Type**: Backend-only change (edge functions). Frontend (`src/**`) fuera de scope.
**Performance Goals**: N/A (rebrand no altera performance). Baseline post-rebrand = baseline pre-rebrand.
**Constraints**:
- Secret swap DEBE preceder deploy de código rebrandeado por ≤60 segundos (minimizar ventana de inconsistencia)
- Smoke test sandbox DEBE pasar antes de considerar el deploy exitoso
- **F-014 fix (commit `3593b12`) DEBE permanecer intacto post-rebrand** (preservación explícita)
**Scale/Scope**: 3 archivos edge function (~450 líneas totales post-F-014), ~12-18 reemplazos de strings distribuidos, 1 secret de Supabase, 2 comandos CLI (`supabase secrets set` + `supabase functions deploy`).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Justificación |
|---|---|---|---|
| **I. Compliance-First (Ley 20.584 / 21.719)** | No | ✅ PASS | Rebrand no toca PHI ni datos clínicos. Edge functions MP manejan datos de pago (email, monto, plan), no datos sensibles de salud. |
| **II. RLS-First Security** | No | ✅ PASS | Rebrand no modifica policies RLS ni tablas. Edge functions usan `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS intencional pre-existente, no se toca). |
| **III. Append-Only Clinical Audit** | No | ✅ PASS | Rebrand no toca `clinical_audit_log` ni `clinical_access_log`. Edge functions MP no leen PHI. |
| **IV. Micro-Bloques** | **Sí (driver principal)** | ✅ PASS | Scope tight: rebrand semántico only. **Explícitamente excluye** fixes de seguridad F-001/F-002/F-003/F-005 que van al meta-spec subsequent. No mezcla refactor + feature + fix. FR-013 enforces preservación de fuera-de-scope. |
| **V. UI Honesty** | Parcial | ✅ PASS | Errores 400 emitidos por edge functions mantienen mensajes claros post-rebrand. Ningún silent fail introducido. Frontend no tocado. |
| **VI. Schema Drift Zero** | Parcial | ✅ PASS | 0 migraciones nuevas. 0 cambios a columnas. Solo cambian valores de strings escritos a `external_reference` (tipo text nullable, sin constraint de prefijo). |

**Resultado inicial**: Todos los gates PASS. Sin `[CONSTITUTION-EXCEPTION]` requerido.

**Re-check post-Phase 1**: ejecutado al final de este plan — ver sección "Post-Phase 1 Constitution Re-check".

---

## Project Structure

### Documentation (this feature)

```text
specs/020-migrate-mp-brand/
├── plan.md              # Este archivo
├── spec.md              # /speckit-specify output (188 líneas)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (vacío — no aplica)
├── checklists/
│   └── requirements.md  # 13/13 PASS
└── tasks.md             # /speckit-tasks output (NO creado por /speckit-plan)
```

### Source Code (repository root)

**Archivos a editar** (3 archivos, todos bajo `supabase/functions/`):

```text
supabase/functions/
├── create-mp-checkout/index.ts              # Edit: external_reference, title, back_urls
├── create-mercadopago-preference/index.ts   # Edit: external_reference, back_urls, statement_descriptor
└── mercadopago-webhook/index.ts             # Edit: external_reference dispatch branches
```

**Archivos a NO tocar** (scope bound explícito):
- `src/**` (todo el frontend)
- `supabase/migrations/**`
- `supabase/policies.sql`
- `supabase/functions/_shared/`
- Cualquier otra edge function

**Archivos de documentación a actualizar post-implement**:
- `.specify/memory/architecture.md` — subsección §"MP brand migration (spec 020)"
- `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md` — update con resultado del rebrand

---

## Phase 0: Research & Discovery

Como es rebrand mecánico sobre código ya auditado (spec 019), no hay "unknowns" técnicos grandes. Research tasks:

1. **Inventory exhaustivo de strings a reemplazar** (FR-001 a FR-006):
   - `grep -rin "fonokit" supabase/functions/` → identificar CADA match
   - Categorizar por tipo: prefix `external_reference`, dominio URL, `statement_descriptor`, `title`
   - Verificar que no hay patterns sutiles (ej. `Fonokit` capitalized, `FonoKit` camelcase)

2. **Verificación empírica del dominio `dentalspot.cl`**:
   - Confirmar HTTP 200 en paths post-checkout:
     - `https://dentalspot.cl/dashboard/membership/status`
     - `https://dentalspot.cl/dashboard/marketplace/purchase-success`
   - Si no responde, deploy del frontend primero (fuera de scope pero flagged)

3. **Estado actual del secret en Supabase**:
   - `supabase secrets list --project-ref tomremkbuxvedliyywbo` → confirmar presencia de `MERCADOPAGO_ACCESS_TOKEN`
   - Si no existe → operación inicial de `set` (no swap)
   - Si existe → confirmar que contenido será reemplazado (valor no visible, solo presencia)

4. **Estado del webhook en panel MP DentalSpot**:
   - ✅ **Confirmado 2026-04-22**: URL configurada, 2 eventos marcados (Pagos + Planes y suscripciones), signing key generada, "Guardar configuración" clickeado.

**Output**: `research.md` con findings consolidados + mapping exhaustivo de strings + status de pre-requisites operacionales.

---

## Phase 1: Design & Contracts

### 1. Data model (`data-model.md`)

No hay entities nuevas. El archivo documenta:
- **Strings a reemplazar** — mapping exhaustivo por archivo y línea (tabla completa en data-model.md)
- **Secrets en Supabase** — valor actual (FonoKit) → valor nuevo (DentalSpot sandbox)
- **Configuración en panel MP DentalSpot** — snapshot del estado (app, tokens, webhook, signing key, eventos)

### 2. Contracts (`contracts/`)

**No aplica**. Este spec no introduce APIs nuevas ni cambia schemas existentes. Los "contratos" con MercadoPago se mantienen (mismo Checkout Pro, mismo formato de preferences, mismos event types de webhook). Solo cambian los **valores** de identificadores (external_reference) y metadata cosmética (statement_descriptor, title).

Directorio `contracts/` queda vacío intencionalmente.

### 3. Quickstart (`quickstart.md`)

Guía step-by-step ejecutable para el `/speckit-implement`, con comandos copy-paste y checks visuales.

### 4. Agent context update

Actualizar CLAUDE.md Active feature para reflejar spec 020 activo + pointer al plan.

---

## Phase 2: Implementation Strategy

### Fases de ejecución (para `/speckit-tasks`)

Dividido en 5 phases con stop points (SP) para control del advisor:

#### **Phase A — Pre-flight checks (~10 min)**

- Verificar dominio `dentalspot.cl` responde (curl -I)
- Verificar secret actual en Supabase
- Confirmar con Danissa que panel MP webhook tiene "Guardar" clickeado (✅ ya confirmado)
- T-checks A1-A3 → **SP-A**

#### **Phase B — Code rebrand (~20 min)**

- Edit `create-mp-checkout/index.ts` (3-4 cambios: external_reference prefix, title suffix, back_urls)
- Edit `create-mercadopago-preference/index.ts` (4-5 cambios: external_reference prefix, back_urls defaults, statement_descriptor)
- Edit `mercadopago-webhook/index.ts` (2 cambios: dispatch branches prefix)
- Verificación post-edit: `grep -rin "fonokit" supabase/functions/{3 files}` = **0 matches**
- Verificación F-014 preservation: lógica de validación de precio + cupones intacta (diff review manual)
- T-checks B1-B4 → **SP-B**

#### **Phase C — Deploy sincronizado (~5 min)**

Secuencia crítica con gap ≤60 segundos:
- **T=0**: `supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7364812495545195-... --project-ref tomremkbuxvedliyywbo`
- **T=30s**: `supabase functions deploy create-mp-checkout create-mercadopago-preference mercadopago-webhook --project-ref tomremkbuxvedliyywbo`
- **Verificación**: secret actualizado + 3 functions deployed con status OK
- T-checks C1-C3 → **SP-C**

#### **Phase D — Smoke test sandbox (~15-20 min)**

- **Test 1**: curl a `create-mp-checkout` con plan válido + ningún cupón → verificar `external_reference` retornado empieza con `dentalspot_sub_`
- **Test 2**: Abrir `init_point` retornado en navegador → verificar página MP checkout muestra "DENTALSPOT" en title + sandbox user apunta a cuenta DentalSpot
- **Test 3**: Login como test buyer (`TESTUSER3863199017052498103`) + completar pago sandbox → verificar redirect a `dentalspot.cl/dashboard/membership/status?status=approved&plan=...`
- **Test 4**: Verificar en Supabase Edge Function logs que webhook llegó con `external_reference: dentalspot_sub_*` y se procesó (no cayó en "Unknown payment type")
- **Test 5 (crítico)**: curl con `final_price: 1` manipulado → verificar que se usa `plan.price` (regresión test de F-014)
- T-checks D1-D5 → **SP-D**

#### **Phase E — Close (~5 min)**

- Update `.specify/memory/architecture.md` con nueva subsección
- Update `docs/session-logs/2026-04-22-*.md`
- Commit único con mensaje descriptivo
- Merge a main + push

### Risk Register

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| **R-01** | Secret swap antes del deploy causa ventana de inconsistencia (FonoKit URL apunta a DentalSpot account) | Media | Bajo (pre-launch, 0 tráfico) | Swap y deploy en misma ventana (≤60s gap). Sincronizar comandos Phase C. |
| **R-02** | `dentalspot.cl` no responde → redirect post-checkout falla | Baja | Alto (UX rota post-pago) | Phase A pre-flight check verifica dominio vivo. Si falla, PAUSA hasta deploy frontend. |
| **R-03** | Danissa no clickeó "Guardar" en panel MP → webhooks nunca llegan | **RESUELTO** (✅ confirmado 2026-04-22) | Alto | N/A — ya verificado. |
| **R-04** | Edit rompe F-014 fix (regresión de price validation) | Baja | **Crítico** (revenue exploit reintroducido) | Phase B: diff review manual + FR-011/FR-012 guardrails + Phase D Test 5 valida explícitamente |
| **R-05** | Grep de "fonokit" retorna match en archivo no previsto → scope creep potencial | Baja | Bajo | Phase 0 research paso 1 identifica TODOS los matches antes de decidir scope. Si match inesperado, documentar y decidir incluir vs diferir. |
| **R-06** | Deploy con token FonoKit activo accidentalmente (si swap falla silencioso) | Baja | Medio (preferences creadas en cuenta FonoKit con branding DentalSpot) | Phase C T-check C1: `supabase secrets list` confirma swap antes de deploy. ERROR si inconsistencia. |
| **R-07** | Test User Buyer expirado → Phase D Test 3 bloqueado | Baja | Medio | Test User autogenerado 2026-04-22, credentials visibles. Si expiró, Danissa genera nuevo en panel MP → 2 min. |

### Stop Points

| SP | Trigger | T-checks | Acción si fail |
|---|---|---|---|
| **SP-A** | Post pre-flight | A1: `dentalspot.cl` responde HTTP 200<br>A2: Secret `MERCADOPAGO_ACCESS_TOKEN` presente<br>A3: Panel MP "Guardar" clickeado (✅) | PAUSA hasta resolución (deploy frontend / setup secret / ya resuelto). |
| **SP-B** | Post code rebrand | B1: `grep -rin "fonokit" supabase/functions/` en los 3 archivos = 0 matches<br>B2: `grep "DENTALSPOT\|dentalspot_"` ≥ 6 matches<br>B3: F-014 lógica intacta (diff review)<br>B4: Sin edits a `src/**` ni `migrations/` | ROLLBACK edits. Re-review scope. |
| **SP-C** | Post deploy | C1: Secret actualizado (verificable por preference de test apuntando a cuenta DentalSpot)<br>C2: 3 functions deployed sin error<br>C3: Logs Supabase muestran boot de functions OK | ROLLBACK: re-deploy con versión previa. Restore secret FonoKit. |
| **SP-D** | Post smoke test | D1-D5: 5 tests PASS | Si **D5 falla (F-014 regresión)** → URGENT ROLLBACK. Otros → investigar + fix antes de close. |

---

## Time Budget

| Phase | Tiempo estimado | Actividad |
|---|---|---|
| Phase A | 10 min | Pre-flight + confirmaciones |
| Phase B | 20 min | Code rebrand (3 archivos) |
| Phase C | 5 min | Deploy sincronizado |
| Phase D | 15-20 min | Smoke test end-to-end sandbox |
| Phase E | 5 min | Close + commit + push |
| Buffer | 10-15 min | Si dispara algún riesgo |
| **Total técnico** | **65-75 min** | Post `/speckit-plan` y `/speckit-tasks` |

Pre-requisite operacional Danissa (crear app MP): **✅ completado en sesión 2026-04-22**. Resta solo ejecución técnica.

---

## References

- Spec: [spec.md](./spec.md)
- Research: [research.md](./research.md)
- Data model: [data-model.md](./data-model.md)
- Quickstart: [quickstart.md](./quickstart.md)
- Audit origen spec 019: [../019-audit-mercadopago-flow/data-model.md](../019-audit-mercadopago-flow/data-model.md)
- F-014 fix precedente: commit `3593b12`
- Session log diagnóstico: `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`
- Constitution: `.specify/memory/constitution.md`
- Architecture: `.specify/memory/architecture.md`

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | **Sin violaciones**. Rebrand mecánico bien delimitado. Scope tight (Constitution §IV). No introduce complejidad nueva (no API, no DB, no UI). Spec canónico ejemplar de Micro-Bloque. |

---

## Post-Phase 1 Constitution Re-check

Ejecutado al final de Phase 1 design:

- §I Compliance-First: ✅ sin cambios
- §II RLS-First: ✅ sin cambios
- §III Audit Append-Only: ✅ sin cambios
- §IV Micro-Bloques: ✅ **reafirmado** — scope tight preservado, sin scope creep detectado en research (el grep de "fonokit" podría revelar matches fuera de scope, manejo en R-05)
- §V UI Honesty: ✅ error messages preservados
- §VI Schema Drift Zero: ✅ sin migrations, sin columnas

**Resultado**: PASS. Plan listo para `/speckit-tasks`.

---

## Next Step

**`/speckit-tasks`** — generar task list ordenada con dependencies, mapeada a phases A/B/C/D/E del plan + stop points. Estimación: 15-20 min para generar, 5 min de review del advisor.

**Hook optional antes de `/speckit-tasks`**: `speckit.git.commit` (optional) — Recomendado SÍ (commit de spec.md + requirements.md + plan.md + research.md + data-model.md + quickstart.md).
