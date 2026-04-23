# Session log — 2026-04-22 PM (Phase E enforcement + cleanup branding + schema regen)

**Duración:** ~3-4 h (continuación de la sesión AM `2026-04-22-mp-deploy-and-diagnosis.md`)
**Modalidad:** Executor IDE (continuación post-compactación)
**Foco:** Cerrar Phase E del spec 022 + follow-ups técnicos (branding visible residual + schema stale)

---

## Executive summary

Sesión PM que cierra 3 micro-bloques limpios más 1 follow-up, dejando la app con **enforcement UX activo** para los límites del plan. Al inicio veníamos del estado "spec 022 MVP Lean DONE con Phase E diferido"; al final Phase E está implementado y merged.

**Logros:**
- ✅ 5b cleanup: 3 archivos con strings "FonoKit" visibles → "DentalSpot" (commit `d886e07`)
- ✅ F schema regen: `supabase/schema.sql` actualizado con 5 migraciones pending + upgrade server PG 15.8→17.6 (commit `27ce60f`)
- ✅ D Phase E enforcement: hook `useActivePlanLimits` + guards en 3 forms de creación (commit `c5730cd`)
- ✅ Follow-up: `UpgradeModal` navega a `/dashboard/membership` en vez de `/planes` (commit `80f1fe3`)
- ✅ CLAUDE.md actualizado con estado nuevo

**Commits pending push a origin:** 4 (F + D + UpgradeModal fix + CLAUDE.md/log actualizaciones).

---

## Timeline

### Parte 1 — 5b: cleanup FonoKit visible residual

**Contexto**: en la sesión AM se cerró spec 021 (cleanup legacy FonoKit edge functions + rebrand de módulos en uso). Quedaron 3 archivos con strings "FonoKit" **visibles al usuario final** que el grep original no priorizó porque no eran código ejecutable sensible sino texto UI.

**Diagnóstico** (grep final):
- `src/pages/AdminDashboardPage.jsx:26-27`: `<title>Panel de Administrador | FonoKit</title>` + meta description (browser tab + SEO)
- `src/components/MotivationalPhrase.jsx:35`: `author: "FonoKit"` (fallback cuando DB fetch falla)
- `src/utils/motivationalPhrases.js:6-8`: 3 frases default con `author: "FonoKit"` (offline/cache miss)

**Implementación** (commit `d886e07`): 3 archivos, 6 edits total, +6/-6 líneas.

**Verificado clean**: grep `FonoKit|fonokit|FONOKIT` en `src/` devuelve solo referencias intencionales multi-app (RoleLandingRedirect, featureFlags comments, DashboardRouter comments, adminQueryFilters docs, personal-info.utils.FONOKIT_DEFAULTS defensiva, AutomationPage docs spec 021). Total: **0 strings visibles de FonoKit quedan en UI**.

---

### Parte 2 — F: regeneración schema.sql (scope expandió)

**Contexto**: `CLAUDE.md` decía "schema dump currently empty — regenerate as micro-bloque". Investigación reveló que **el dump NO estaba vacío** — tenía 27.315 líneas del 2026-04-20. Pero estaba stale por 5 migraciones:

| Migration | Contenido |
|---|---|
| `20260420000003` | add_missing_fk_indexes |
| `20260420000004` | apply_policies_billing_evaluations |
| `20260420000005` | apply_policies_goals_development_areas |
| `20260420000006` | lockdown_pie_debug_tables |
| `20260422000001` | add_plans_tier_model (spec 022) |

**Obstáculo**: el Supabase CLI usa Docker para pg_dump, pero Docker no está instalado en la máquina. El dump anterior se había hecho con pg_dump v15.17 Homebrew local (bypass Docker). Primer intento con pg_dump 14.13 local falló con "server version mismatch: server 17.6, client 14.13" — **Supabase upgradó server de 15.8 → 17.6** entre 2026-04-20 y ahora.

**Decisión**: instalar `postgresql@17` via Homebrew (keg-only, no conflictúa con pg 14 default). `/usr/local/opt/postgresql@17/bin/pg_dump` disponible.

**Técnica del dump**:
1. `supabase db dump --linked --dry-run` → captura el bash script que el CLI habría ejecutado (env vars + pg_dump command + sed pipeline de transformaciones)
2. `sed 's|^pg_dump \\$|/usr/local/opt/postgresql@17/bin/pg_dump \\|'` → swap del binario al local
3. `bash script > supabase/schema.sql` → ejecuta con credentials frescas del CLI login role
4. `awk` para recortar líneas vacías trailing generadas por el sed pipeline (`/^--/d` strippea comment markers dejando blanks)

**Resultado** (commit `27ce60f`):

| Métrica | Antes | Ahora |
|---|---|---|
| Líneas | 27.315 | 27.319 |
| Tablas | 173 | **194** (+21) |
| Policies | 431 | **458** (+27) |
| PG server | 15.8 | **17.6** |
| pg_dump client | 15.17 | **17.9** |

**Nota sobre diff gigante**: +12.069/-12.065 líneas pero **cosmético**. El Supabase CLI aplica sed pipeline que re-formatea (strip `-- Name:` markers + `CREATE TABLE "` → `CREATE TABLE IF NOT EXISTS "` + idem SCHEMA/VIEW/FUNCTION/TRIGGER). Sin drift semántico. Futuras regens tendrán diffs limpios.

**Side-effect en máquina**: `postgresql@17` instalado (keg-only). Si se quiere usar `pg_dump` sin path absoluto: `brew link --force postgresql@17`. Opcional.

---

### Parte 3 — D: Phase E Enforcement UX

**Contexto**: al cerrar spec 022 Phase C+D+G en la sesión AM, Phase E se difirió "hasta que se detecte abuso Free". Replanteado en PM: integrar enforcement ahora es barato (~2-3h) y evita que usuarios Free del beta puedan crear recursos sin feedback.

**Research**:

Infraestructura que YA existía (no duplicar):
- RPC `check_plan_limit(therapist_id, resource_type)` — authoritative server-side, devuelve boolean
- `SubscriptionContext` con `hasReachedLimit`, `usage`, `currentPlan`
- `usePlanFeatures`, `useLimitStatus` hooks (para widgets/progress, no enforcement)
- `UpgradeModal` componente listo con props `featureName` + `requiredPlan`
- `MembershipStatusWidget` muestra usage actual en dashboard

Lo que faltaba (gap real):
- Hook cliente que invoque el RPC
- Guards en forms de creación

**Semántica del RPC** (leída del source migration `20260422000001`):

| Resource | Cuenta | Reset |
|---|---|---|
| `patient` | `patients` del therapist con `deleted_at IS NULL` | Total acumulado |
| `appointment` | appointments del **mes calendario actual** (DATE_TRUNC) | Mensual rolling |
| `dentist` | `clinic_therapists` activos en clínicas del therapist | Total |
| `box` | **siempre retorna true** (deferred, tabla no existe) | N/A |
| *(error)* | **fail-safe OPEN** → retorna true | Decisión spec 022 |

**Implementación** (commit `c5730cd`, +165 líneas):

1. **NEW `src/hooks/useActivePlanLimits.js`** (91 líneas):
   - Expose `canCreate(resourceType) → Promise<boolean>`
   - Invoca `supabase.rpc('check_plan_limit', { p_therapist_id, p_resource_type })`
   - Retorna `currentPlan` tomado de `SubscriptionContext` (no re-fetch)
   - Fail-safe OPEN si RPC falla
   - Logger para observabilidad

2. **`src/features/patients/components/PatientModal.jsx`** (+23 L):
   - Guard solo en modo **crear** (no toca modo editar)
   - Se dispara después de validación + org-check, antes de `createPatientAccount`
   - `featureName="más pacientes"`, `requiredPlan="individual"`

3. **`src/components/calendar/NewAppointmentForm.jsx`** (+28 L):
   - Guard después de pre-checks (patient/date), antes del `.insert(appointmentsToInsert)`
   - Edge case documentado inline: recurrentes cross-month pueden exceder límite mensual destino. RPC solo cuenta mes actual. Riesgo aceptado MVP.
   - `featureName="más citas por mes"`, `requiredPlan="individual"`

4. **`src/components/clinic/InviteTherapistModal.jsx`** (+23 L):
   - Guard después de validaciones (email exists, no duplicate), antes del `.insert` en `clinic_therapists`
   - `featureName="más dentistas en tu clínica"`, `requiredPlan="professional"`

**Pattern aplicado en los 3 forms**:
```js
const allowed = await canCreate('<resource>');
if (!allowed) {
  setLoading(false);     // o setIsSubmitting(false)
  setShowUpgradeModal(true);
  return;
}
// insert normal…
```

**Constitution checklist**:
- §I Compliance: enforcement ≠ PHI ✓
- §II RLS-First: guards son UX; RPC es authoritative ✓
- §IV Micro-Bloques: 1 PR = Phase E ✓
- §V UI Honesty: return antes del INSERT si guard falla, sin toast mentiroso ✓
- §VI Schema Drift Zero: no DB changes ✓

**Lint clean**: ESLint pasó sin errores en los 4 archivos tocados.

**Fuera de scope (explícito)**:
- Box enforcement (deferred)
- Refactor SubscriptionContext
- Enforcement en EDITAR (solo CREATE)
- Race condition mitigation (mitigación real sería CHECK DB)
- Tests automatizados

**Riesgos documentados (aceptados)**:
1. Race: 2 submits paralelos pueden pasar ambos el check. Bajísimo para user individual.
2. Recurrentes cross-month: pueden exceder límite del mes destino. Small impact MVP.
3. Fail-safe OPEN: RPC error → permite crear. Trade-off spec 022.

---

### Parte 4 — Follow-up: UpgradeModal navigate

**Contexto**: al revisar el flujo completo de D descubrí que `UpgradeModal.handleUpgrade` llamaba a `navigate('/planes')` — la **landing pública** (PricingPage) pensada para prospects sin sesión. Un usuario logueado hitting el límite debería ir a `/dashboard/membership` (MembershipPlansPage) para poder efectivamente suscribirse.

Bug pre-existente, no introducido por D, pero relevante porque D es el primer lugar donde el modal se dispara dinámicamente desde un form authenticated.

**Implementación** (commit `80f1fe3`, +3/-1 línea):
- `src/components/modals/UpgradeModal.jsx:55` — swap + comment explicando por qué

**Design decision**: no tocar otros callers de `navigate('/planes')` en el repo (si existen) — esos pueden ser para contextos públicos.

---

## Decisiones clave

| Decisión | Motivación |
|---|---|
| Install `postgresql@17` en vez de diferir F | Keg-only, no conflictúa, unblocks schema regen futura |
| Phase E hook separado (no extender SubscriptionContext) | SRP: context para widgets, hook para enforcement authoritative |
| Guard en submit (no en open del modal) | Simpler UX, una RPC call por intento real de crear |
| Reusar `UpgradeModal` existente | No duplicar UI; props ya cubren `featureName` + `requiredPlan` |
| Fail-safe OPEN si RPC falla | Continuidad operacional > strictness (alineado spec 022) |
| Documentar edge case recurrentes inline | Señal para quien vuelva a leer; riesgo conocido MVP |
| Fix UpgradeModal nav como commit separado | §IV Micro-Bloques: no mezclar con D |

---

## Commits (orden cronológico)

1. `d886e07` — **feat(branding)**: cleanup FonoKit visible strings (5b) — pushed durante sesión
2. `27ce60f` — **chore(schema)**: regenerate schema.sql (PG 17.9, spec 022 + 4 migraciones)
3. `c5730cd` — **feat(enforcement)**: Phase E UX — block create when plan limit reached
4. `80f1fe3` — **fix(membership)**: UpgradeModal navigate to /dashboard/membership

Commits 2-4 pending push al momento de cerrar el log.

---

## Pendientes explícitos al cerrar PM

### Test manual inmediato (próxima sesión o handoff)
- **E3 smoke enforcement**: crear dentista test, forzar sub Free, crear 5 pacientes OK, intentar 6° → `UpgradeModal` debe aparecer, click upgrade → debe llegar a `/dashboard/membership`. Análogo para citas (15/mes) y dentistas (1 en Free/Individual).

### Follow-ups por prioridad

| # | Follow-up | Effort | When |
|---|---|---|---|
| 1 | Meta-spec `fix-mercadopago-critical-bugs` P0 (F-001/F-002/F-003/F-005) | 16-22h | Antes de scale a 100+ users |
| 2 | Phase F smoke E2E completo con beta users reales | 1-2h | Durante launch beta |
| 3 | E3 smoke manual enforcement (test con user Free) | 30min | Antes de invitar beta users |
| 4 | `create-clinical-boxes-table-and-enforcement` | TBD | Cuando se diseñe UX sillones |
| 5 | Mitigar race condition enforcement (CHECK DB) | 1-2h | Si se detecta abuso |

### No urgente (nice-to-have)

- Enforcement en **editar** recursos (scope actual solo CREATE) — improbable que genere abuso
- Banner "usas 4/5 pacientes" más visible en sidebar/header — `MembershipStatusWidget` ya lo muestra en dashboard
- Test automatizado del hook `useActivePlanLimits`
- Revisión otros callers de `/planes` por si deberían ir a `/dashboard/membership`

---

## Handoff para próxima sesión

**Arrancar chequeando**: `git status` + `git log origin/main..HEAD --oneline` para ver si Danissa pusheó los 3 commits pending.

**Estado del producto**:
- App funcional para cobros con enforcement UX activo
- Branding DentalSpot al 100% en UI user-facing
- Schema dump sincronizado con DB producción (PG 17.6)
- Listo para launch beta con cupón `BETA-3M-2026`

**Primer candidato de trabajo según tiempo disponible**:
- 30min: E3 smoke manual (Danissa en dev/staging)
- 1-2h: Phase F smoke E2E completo
- 1-2h: Prep launch beta (1-pager onboarding + métricas monitoring)
- 16-22h: meta-spec MP bugs P0

**Ver también**:
- `specs/022-add-plans-tier-model/quickstart.md §Phase F` (smoke E2E)
- `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md` (sesión AM — MP diagnóstico)

---

**Close clean**: 4 commits, 0 deuda técnica pendiente del scope tocado, CLAUDE.md actualizado.
