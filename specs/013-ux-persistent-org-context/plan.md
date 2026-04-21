# Implementation Plan: Persistent Organization Context

**Branch**: `013-ux-persistent-org-context` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-ux-persistent-org-context/spec.md`

## Summary

Fix UX quirúrgico en `OrganizationContext` para persistir `currentOrganizationId` entre navegación, refresh y logout-login. Phase 1 audit defensivo (20 min) lee el context actual, grep de consumidores, reproduce los 3 escenarios de pérdida pre-fix como baseline verificable. Phase 2 (20 min) fuerza **4 decisiones documentadas** (A tipo storage · B momento restauración · C fallback org inválida · D localización cleanup logout) antes de escribir código. Phase 3 (30-45 min) modifica máximo 2 archivos — `OrganizationContext.jsx` + posible segundo según decisión D. Phase 4 (20 min) re-reproduce P1/P2/P3 post-fix + multi-tab test + modo privado. **Total 1-2h** con SP-1/2/3/4 gates. Constitution §V (UI Honesty) driver.

## Technical Context

**Language/Version**: JavaScript (ES2022+), React 18 SPA con Vite.
**Primary Dependencies**: `react` (useContext, useState, useEffect, useRef), browser Web Storage API (`sessionStorage`/`localStorage`). Sin libraries nuevas.
**Storage**: browser-side (client-only). Sin cambios DB.
**Testing**: manual via browser local (`npm run dev`) con DevTools Console + Storage tab. No hay framework Vitest/Playwright en el repo (deuda conocida).
**Target Platform**: browsers modernos (Chrome/Firefox/Safari) con soporte standard de Web Storage. Modo privado debe degradar gracefully (FR-005).
**Project Type**: UX fix quirúrgico. No introduce features de producto, solo restaura comportamiento esperado.
**Performance Goals**: la restauración de org debe ser imperceptible al user (<50ms desde init del Provider). Flash de default-org antes de restaurar: máximo 300ms tolerado, >500ms → spec follow-up.
**Constraints**:
- **FR-008**: máximo 2 archivos editados.
- **FR-009**: cero cambios en routers, RLS, migrations, feature flags.
- **FR-005**: no-crash en modo privado (storage unavailable).
- El deploy lo hace Danissa; el ejecutor prepara el código y entrega para test manual.
**Scale/Scope**: 1 contexto React. 2 archivos máx. ~30-60 líneas netas de cambio estimadas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | Indirecto | ✅ PASS | No toca PHI ni audit. Pero el bug actual puede llevar a decisiones erradas (reasignar paciente equivocado) — fix **previene** compliance issues derivados de mala selección de clínica. |
| **II. RLS-First Security** | No | ✅ PASS | RLS ya valida acceso a org vía `organization_users`. El fix no abre data — restaura selección legítima. Si el storage persiste una org a la que el user ya no tiene acceso, FR-003 manda fallback a default (nunca bypass de RLS). |
| **III. Append-Only Audit** | No | ✅ N/A | No toca audit logger. |
| **IV. Micro-Bloques** | Sí | ✅ PASS | FR-008: máximo 2 archivos. Un spec = un fix UX coherente. |
| **V. UI Honesty** | Sí (driver) | ✅ PASS | El escenario P1 (array vacío cuando debería tener data) es violación directa de §V. Este fix restaura cumplimiento. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No toca schema ni types. |

**Resultado**: sin violaciones. Fix es aplicación correctiva de §V.

## Project Structure

### Documentation (this feature)

```text
specs/013-ux-persistent-org-context/
├── spec.md                    # /speckit-specify (commit d6bae4c)
├── plan.md                    # este archivo
├── data-model.md              # Phase 1-2 output — current state + design decisions
├── checklists/
│   └── requirements.md        # /speckit-specify (12/12 pass)
└── tasks.md                   # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

**Archivos autorizados** (máximo 2 por FR-008):

```text
src/contexts/OrganizationContext.jsx    # seguro (driver del spec)
<archivo-secundario-decidido-Phase-2>   # según Decisión D
```

**Candidatos para archivo secundario** (decisión D en Phase 2):
- Si camino (a) handler directo: `src/components/layout/DashboardLayout.jsx` o donde viva el botón logout.
- Si camino (b) event listener: **NO hay segundo archivo** — el listener vive dentro de `OrganizationContext.jsx` reaccionando a cambios de `user?.id` del AuthContext.
- Si camino (c) excepción tocando AuthContext: `src/contexts/AuthContext.jsx` con cleanup mínimo.

**Preferencia**: camino (b) para mantener scope en 1 archivo (OrganizationContext.jsx) — razón documentada en Decisión D de Phase 2.

**Archivos NO autorizados** (dispara FR-008/009):
- Routers (`src/app/AppRouter.jsx`, `src/app/routers/*`).
- Otros contexts fuera de los 2 autorizados.
- `supabase/**`, `src/types/**`.
- Features específicas (`src/features/**`).
- `src/main.jsx` / `src/App.jsx` (root app).

**Structure Decision**: fix contained en contexts/. La preferencia por camino (b) minimiza archivos tocados y respeta "no tocar AuthContext" salvo como excepción documentada.

---

## Phase 0 — Risk Register

### R-01. Modo privado / storage bloqueado rompe el fix silenciosamente

**Síntoma potencial**: en modo incógnito de Safari o Chrome con cookies/storage bloqueados, el intento de `localStorage.setItem` o `sessionStorage.setItem` puede throw `QuotaExceededError` o `SecurityError`. Sin try/catch, el Provider throw al init → crash del dashboard.

**Mitigación**: FR-005 lo formaliza. La implementación en Phase 3 envuelve **cada acceso a storage** en try/catch con fallback silencioso (logger.warn, no throw al caller). Degrada al comportamiento pre-fix (in-memory state, sin persistencia) — el user pierde el beneficio del fix pero el dashboard carga sin crash.

### R-02. Usuario removido del org persistido entre sesiones → crash

**Síntoma potencial**: User A tiene "Org X" persistida en storage. Admin lo remueve de `organization_users` entre sesiones. User A logea nuevamente. Intento de restaurar "Org X" con `setCurrentOrganization(persisted)` cuando `persisted.id` no está en `userOrgRoles` → PostgREST rechazará queries posteriores con RLS 403 o data vacía confusa.

**Mitigación**: FR-003 lo formaliza. Phase 3 implementa **validación previa** a restauración: `if (userOrgRoles.some(r => r.organization_id === persisted)) → restore, else → silent discard + default`. La restauración ocurre **después** de que `userOrgRoles` esté cargado (useEffect dependente), evitando race condition.

### R-03. Multi-tab desync: sessionStorage sin sync es tradeoff; localStorage con sync puede loop infinito

**Síntoma potencial**:
- **sessionStorage**: tab 1 cambia a "Org B", tab 2 sigue viendo "Org A" hasta refresh. No hay sync. Tradeoff intencional si se elige.
- **localStorage con `storage` event listener**: tab 1 cambia a "Org B" → dispara evento en tab 2 → tab 2 actualiza state → si el handler tiene bug, puede retriggerar un write → loop infinito entre tabs.

**Mitigación**: decisión A en Phase 2 documenta el tradeoff. Si se elige localStorage con sync, el listener debe:
- Comparar valor actual vs valor del evento: skip si igual (idempotencia).
- Filtrar eventos del mismo tab (`event.storageArea !== localStorage` o `event.newValue !== null`).
- Rollback trigger #3 del spec cubre el loop infinito como abort.

---

## Phase 1 — Audit Defensivo (~20 min, STOP POINT SP-1)

**Objetivo**: entender el estado actual del `OrganizationContext` sin asumir, identificar todos los consumidores, reproducir los 3 escenarios de pérdida pre-fix como baseline verificable. Confirmar que el fix cabe en ≤2 archivos.

**Regla operativa** (`docs/PATTERNS.md §4`): cero código tocado hasta que Phase 1 termine y SP-1 valide scope.

### P1.1 — Lectura del OrganizationContext actual

Leer completo:

```bash
cat src/contexts/OrganizationContext.jsx
```

(si el path no existe con ese nombre, grep para localizar: `find src/contexts -name "*Org*"`)

Capturar en `data-model.md §Current state`:
- Props del provider, shape del state, APIs expuestas.
- Storage actual: hay sessionStorage/localStorage? Si sí, qué key usa? (contexto user mencionó `dentalspot_current_org:USER_UUID` como posible key).
- Timing de init: `useState(initial)` con valor computed? o `useEffect(() => { ... }, [])` post-mount?
- Trigger de cambio: setter expone invalidación, re-fetch de roles, etc.

### P1.2 — Grep consumidores

```bash
grep -rn "useCurrentOrganization\|useOrganization" src/ --include="*.js" --include="*.jsx"
```

Capturar lista completa de callsites. Clasificar en:
- **Consumidores activos** (componentes user-facing que filtran queries por org).
- **Consumidores pasivos** (componentes que solo leen metadata, ej. dropdown).
- **Wrappers** (hooks o HOCs que envuelven consumidores — contar una vez, no por consumer indirecto).

Output en `data-model.md §Consumers` con conteo por tipo.

### P1.3 — Grep persistencia existente

```bash
grep -rn "dentalspot_current_org\|sessionStorage\|localStorage" src/contexts/ src/hooks/
grep -rn "dentalspot_current_org" src/
```

Confirmar si el key `dentalspot_current_org:*` ya existe en código (contexto del user lo mencionó). Documentar en `data-model.md §Existing storage patterns`:
- Si existe: qué tipo de storage, qué key format, cómo se setea/lee/limpia.
- Si no existe: confirmar que la implementación es 100% in-memory React state.

### P1.4 — Reproducir 3 escenarios pre-fix (baseline)

Danissa ejecuta manualmente con cuenta de prueba con 2+ organizaciones (ej. Cristóbal con Los Álamos + Bulnes):

**Escenario P1 (navigation loss)**:
1. Login en `/dashboard/therapist`.
2. Seleccionar "Odontologia Bulnes" en el dropdown de organización.
3. Navegar a `/dashboard/patients`.
4. Observar: dropdown sigue "Bulnes" o volvió a "Los Álamos"? DevTools Storage: hay persistencia?
5. Capturar como **baseline video/screenshot/nota** — si el bug se reproduce, confirmar que el fix tendrá efecto medible.

**Escenario P2 (refresh loss)**:
1. Con "Bulnes" seleccionada, presionar F5.
2. Observar post-reload.
3. Capturar baseline.

**Escenario P3 (logout cross-user)**:
1. User A logea, selecciona "Bulnes", logout.
2. User B logea en mismo browser (si hay 2 cuentas de prueba disponibles; si no, documentar como "pendiente de verificación con segunda cuenta").
3. Observar default del User B.
4. Capturar baseline.

Documentar en `data-model.md §Loss scenarios` con evidencia de reproducción.

### P1.5 — **STOP POINT SP-1**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T1** | OrganizationContext encontrado y leído completo | Read exitoso del archivo | Si no existe el path → grep para localizar; si no está → consulta con Danissa sobre arquitectura actual. |
| **T2** | Consumidores ≤ 30 (estimación; si son muchos más, el scope puede crecer) | `grep` retorna ≤ 30 callsites | Si >30 → el fix sigue siendo ≤2 archivos PORQUE los consumidores solo usan el hook (no se modifican); documentar conteo para expectativa de blast radius. |
| **T3** | Los 3 escenarios reproducen el bug | Baseline capturado, bug confirmado | Si algún escenario NO reproduce → hipótesis del bug incorrecta; consultar con Danissa antes de diseñar fix. |
| **T4** | Fix cabe en ≤2 archivos | Contexto + storage + cleanup quedan en OrganizationContext.jsx + máximo 1 más | Si Phase 2 sugiere >2 archivos → STOP, re-evaluar con Danissa. |

**Reporte a Danissa** (bloquea Phase 2 sin 🟢 GO):

```markdown
## Phase 1 Report — spec 013

- OrganizationContext path: [ruta real]
- State management: [in-memory / sessionStorage / localStorage — key si existe]
- Consumidores useCurrentOrganization: [N callsites, clasificados]
- Storage patterns actuales: [ninguno / key XXX con formato YYY]
- 3 scenarios baseline: P1 [reprodujo/no] · P2 [...] · P3 [...]
- Scope check: T1 ✅ · T2 ✅ (N=X) · T3 ✅ (3/3) · T4 ✅ (fits en 2 archivos)
- Recomendación: proceder a Phase 2 / ajustar

🟢 GO / 🔴 STOP
```

---

## Phase 2 — Decisiones de Diseño (~20 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO. Las 4 decisiones deben quedar documentadas con rationale **antes** de escribir código en Phase 3.

### P2.1 — Decisión A: Tipo de storage

**Opciones**:

| Opción | Comportamiento | Tradeoff |
|---|---|---|
| **A1. sessionStorage** | Persiste solo mientras el tab esté abierto. Se limpia al cerrar tab. No sincroniza entre tabs. | Resuelve P1 + P2. NO resuelve P3 sin cleanup. No sync multi-tab (tab 1 cambia → tab 2 sigue viendo la anterior). |
| **A2. localStorage** (con storage event listener) | Persiste indefinidamente cross-sessions. Sincroniza entre tabs del mismo dominio. | Resuelve P1 + P2. Requiere cleanup explícito en logout para P3. Multi-tab sync con riesgo de loop (R-03). |
| **A3. localStorage sin sync** | Persiste cross-sessions. Sin listener — tab 1 cambia pero tab 2 sigue viendo la anterior. | Resuelve P1 + P2. Requiere cleanup logout. Multi-tab desync documentado como tradeoff aceptado. |

**Recomendación por default**: **A3 (localStorage sin sync)**. Razones:
- P2 requiere persistencia cross-browser-session (refresh no debe resetear). sessionStorage puede perderse si el tab se cierra accidentalmente.
- Sync multi-tab es nice-to-have, no requisito del spec. Evita complejidad de eventos cross-tab y riesgo R-03.
- P3 (logout cross-user) se resuelve con cleanup explícito, no dependiente del tipo de storage.

**Queda a definir en Phase 2**: si la decisión final difiere de la recomendación, documentar por qué en `data-model.md §Decision A rationale`.

### P2.2 — Decisión B: Momento de restauración

**Opciones**:

| Opción | Timing | Tradeoff |
|---|---|---|
| **B1. Provider init (synchronous)** | `useState(() => readFromStorage() ?? default)`. Restaura inmediato al mount, sin flash. | Problema: no puede validar contra `userOrgRoles` (que llega async). Puede restaurar una org inválida. |
| **B2. useEffect post-mount** | `useEffect(() => { if (userOrgRoles.length > 0) { restore(); } }, [userOrgRoles])`. Valida antes de restaurar. | Flash de org default de ~100-300ms antes de restaurar. FR-003 cubre validación. |
| **B3. Ambos** | Init con valor de storage (fast), useEffect valida y corrige si la org no está en userOrgRoles (correct). | Combina velocidad + validación. Más complejo. |

**Recomendación por default**: **B3 (ambos)**. Razones:
- B1 solo causa potencial restauración de org inválida → queries subsiguientes fallan con RLS silent.
- B2 solo causa flash perceptual que puede confundir.
- B3 hace ambos: init con storage para evitar flash, useEffect valida y si la org persistida no está en `userOrgRoles`, hace silent discard + default (FR-003).

**Queda a definir en Phase 2**: si el flash <300ms es aceptable para el producto, B2 alone es más simple y suficiente. Decidir con Danissa.

### P2.3 — Decisión C: Fallback si org persistida inválida

**Opciones**:

| Opción | Comportamiento | Tradeoff |
|---|---|---|
| **C1. Silent discard + default** | Descarta el valor inválido, usa primera org disponible del user. Sin UI notification. | Consistente con UX de "just works". Usuario puede no notar el cambio. FR-003 lo manda. |
| **C2. Notify via toast** | "Tu organización anterior ya no está disponible. Se cambió a [Org Y]." | Transparente pero puede ser alarmante. Requiere i18n. |
| **C3. Redirect a selector** | Si hay múltiples orgs disponibles, navegar a una pantalla de selección explícita. | Más invasivo. Overkill para un edge case. |

**Recomendación por default**: **C1 (silent discard)**. Razones:
- FR-003 lo manda.
- Los casos donde el user fue removido de una org son raros y correctivos (admin ya decidió, no hay que molestar al user).
- Telemetry opcional: `logger.warn('Persisted org no longer accessible, falling back to default')` para observabilidad sin molestar al user.

**Queda a definir en Phase 2**: si Danissa prefiere transparency (C2), documentar.

### P2.4 — Decisión D: Localización del logout cleanup

**Contexto**: FR-008 manda ≤2 archivos. FR-009 prohíbe tocar routers. La pregunta de Danissa: ¿dónde poner el cleanup de storage en logout?

**Opciones**:

| Opción | Implementación | Archivos tocados | Tradeoff |
|---|---|---|---|
| **D1. Handler directo en botón logout** | Wrap el onClick del botón logout con `() => { clearOrgStorage(); originalHandler(); }`. | OrganizationContext.jsx + el archivo con el botón (ej. DashboardLayout o Sidebar). | 2 archivos. Coupling: otro componente conoce el storage key. |
| **D2. Event listener dentro de OrganizationContext** | `useEffect(() => { if (!user?.id) clearOrgStorage(); }, [user?.id])`. Detecta logout al ver `user` volverse `null`. | **1 archivo** (OrganizationContext.jsx). | Elegante. Respeta la separación de contexts. Preferencia del spec. |
| **D3. Excepción tocando AuthContext** | Agregar `clearOrgStorage()` al signOut flow del AuthContext. | AuthContext.jsx + OrganizationContext.jsx. | 2 archivos. Coupling: AuthContext conoce internals del OrganizationContext. Explícitamente listado como excepción. |

**Recomendación por default**: **D2 (event listener en OrganizationContext)**. Razones:
- Respeta "evitar tocar AuthContext" del user (el AuthContext es corazón crítico per Constitution §XIII; mantenerlo intacto).
- Solo 1 archivo tocado (OrganizationContext.jsx) — mejor que el límite de 2 de FR-008.
- Acoplamiento débil: OrganizationContext depende de AuthContext (ya lo hace para obtener `user`), así que reaccionar al cambio de `user` es natural.
- Pattern: similar al `useEffect(() => { if (user?.id) fetchRoles(user.id); })` que ya debe existir — extender a `else clearStorage()`.

**Queda a definir en Phase 2**: si Danissa prefiere un handler explícito por claridad, D1 está disponible. D3 solo si D2 tiene algún problema técnico descubierto al implementar.

### P2.5 — Persistir decisiones en `data-model.md §Design decisions`

Al cierre de Phase 2, el `data-model.md` tiene una tabla:

| Decisión | Opción elegida | Rationale | Descartadas |
|---|---|---|---|
| A (storage type) | A3 (localStorage sin sync) | [razón] | A1 (sessionStorage — no P2), A2 (sync — R-03) |
| B (momento restauración) | B3 (ambos) | [razón] | B1 (solo init — sin validación), B2 (solo effect — flash) |
| C (fallback inválida) | C1 (silent discard) | [razón] | C2, C3 |
| D (logout cleanup) | D2 (event listener) | [razón] | D1, D3 |

### P2.6 — **STOP POINT SP-2**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T5** | 4 decisiones (A/B/C/D) documentadas con opción elegida + rationale | Tabla en `data-model.md` completa | Si alguna sin decisión → no avanzar a Phase 3. |
| **T6** | Archivos a editar ≤ 2 | Confirmar contando según Decisión D | Si >2 → STOP + consultar. |
| **T7** | Comportamiento esperado en los 3 escenarios post-fix documentado | `data-model.md §Expected behavior` con 3 subsecciones | Sin esto, Phase 4 no tiene referencia objetiva. |

**Reporte a Danissa** (bloquea Phase 3):

```markdown
## Phase 2 Report — spec 013

- Decisión A: [A1/A2/A3] — [rationale 1 línea]
- Decisión B: [B1/B2/B3] — [rationale]
- Decisión C: [C1/C2/C3] — [rationale]
- Decisión D: [D1/D2/D3] — [rationale] → archivos afectados: [N ≤ 2]
- Scope check: T5 ✅ · T6 ✅ (N archivos) · T7 ✅
- Recomendación: proceder a Phase 3

🟢 GO / 🔴 STOP
```

---

## Phase 3 — Implementation (~30-45 min, STOP POINT SP-3)

**Prerequisito**: SP-2 🟢 GO con 4 decisiones confirmadas.

### P3.1 — Archivos a modificar (confirmados en Phase 2)

Según recomendación (D2 elegida):
- **1 archivo**: `src/contexts/OrganizationContext.jsx` (o path real de Phase 1).

Si Danissa eligió D1 o D3:
- **2 archivos**: OrganizationContext + (DashboardLayout | AuthContext).

### P3.2 — Cambios estructurados (sketched antes de código)

**En `OrganizationContext.jsx`**:

1. **Helpers para storage** (arriba del provider):
   - `readPersistedOrg(userId)` — lee del storage con try/catch, retorna `null` si unavailable o ausente.
   - `writePersistedOrg(userId, orgId)` — escribe con try/catch.
   - `clearPersistedOrg(userId)` — borra para ese user (key con user_id en el nombre).
   - Key format: `dentalspot_current_org:${userId}` (respeta convención que el contexto del user mencionó).

2. **Init del provider**:
   - Según Decisión B:
     - Si B1: `useState(() => readPersistedOrg(user?.id) ?? null)`.
     - Si B2: `useState(null)` + `useEffect` post-mount que lee.
     - Si B3: `useState(() => readPersistedOrg(user?.id))` + `useEffect` que valida contra `userOrgRoles` y descarta si inválida.

3. **Setter** (`setCurrentOrganization`):
   - Actual: `setState(newOrg)`.
   - Nuevo: `setState(newOrg); writePersistedOrg(user?.id, newOrg?.id)`.
   - Si newOrg es null → `clearPersistedOrg(user?.id)`.

4. **Cleanup en logout** (según Decisión D):
   - Si D2: `useEffect(() => { if (!user?.id) { clearPersistedOrg(previousUserId); } }, [user?.id])`.
   - Si D1/D3: handler externo invoca `clearPersistedOrg(user.id)` antes del signOut.

5. **Preservar try/catch del hook `useCurrentOrganization`**: el hook público expuesto a rutas públicas debe seguir siendo tolerante a "no hay provider".

**Si Decisión D = D1 o D3**, también se edita el archivo secundario (DashboardLayout o AuthContext) con el handler/call al cleanup.

### P3.3 — Orden de commits dentro de Phase 3

1. Commit intermedio opcional "wip: spec 013 — storage helpers + read/write" (descartar al cierre con squash al commit final si se prefiere).
2. Commit intermedio opcional "wip: spec 013 — restoration logic" .
3. Commit final: `fix: persistent organization context (spec 013 Phase 3)` con los 2 archivos máx.

**Nota operativa**: dado que Phase 3 es chica (30-45 min), 1 commit final limpio es preferible. Sin wip commits salvo que se note beneficio explícito.

### P3.4 — Post-Phase 3: lint + build

```bash
ulimit -n 10240
npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 | tee /tmp/lint-post-013.log
npm run build 2>&1 | tail -20
```

**Criterio**:
- Lint: errors/warnings post ≤ baseline pre (captura baseline en P3.0 antes de tocar código, mismo patrón que spec 010 T4).
- Build: exit 0, sin broken imports.

### P3.5 — **STOP POINT SP-3**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T8** | Máximo 2 archivos en git diff | `git diff --name-only` muestra ≤2 paths en `src/` | Si >2 → revert inmediato, re-evaluar Phase 2. |
| **T9** | Lint exit 0, no errors nuevos | `errors_post ≤ errors_pre` | Si nuevos errors → fixear antes de Phase 4. |
| **T10** | Build exit 0, 0 broken imports | `✓ built in Xs` sin errors | Si falla → NO test manual, fixear primero. |

**Reporte a Danissa**:

```markdown
## Phase 3 Report — spec 013

- Archivos modificados: [path1, path2 si aplica]
- Diff líneas: [+N/-M]
- Lint: [N errors / M warnings, sin cambios vs baseline]
- Build: [exit 0, time Xs]
- Scope check: T8 ✅ · T9 ✅ · T10 ✅
- Listo para Phase 4 manual

🟢 GO / 🔴 STOP
```

---

## Phase 4 — Verify Manual (~20 min, STOP POINT SP-4)

**Prerequisito**: SP-3 🟢 GO.

### P4.1 — Re-reproducir los 3 escenarios post-fix

Con los baselines de Phase 1 P1.4 como referencia:

**P1 (navigation)**:
- Login como dentista multi-clínica.
- Seleccionar "Bulnes".
- Navegar a `/patients`, `/calendar`, `/profile` (3 rutas).
- **Esperado**: dropdown muestra "Bulnes" en las 3 rutas. Comparar con baseline (donde reset a "Los Álamos" o vacío).

**P2 (refresh)**:
- Con "Bulnes" seleccionada, F5 / Cmd+R.
- **Esperado**: post-reload, dropdown "Bulnes". Comparar con baseline.

**P3 (logout cross-user)**:
- User A (Cristóbal) selecciona "Bulnes", logout.
- User B (Danissa u otra cuenta) logea en el mismo browser.
- **Esperado**: User B ve su default, no "Bulnes" residual. DevTools Storage: key `dentalspot_current_org:USER_A_UUID` debe estar ausente (o al menos no afectar a User B que tiene su propio `dentalspot_current_org:USER_B_UUID`).

### P4.2 — Multi-tab test

- Abrir tab 1 y tab 2 del dashboard.
- En tab 1: cambiar de "Los Álamos" a "Bulnes".
- En tab 2: refrescar.
- **Esperado (según Decisión A)**:
  - A1 (sessionStorage): tab 2 sigue "Los Álamos". Tradeoff documentado.
  - A2 (localStorage con sync): tab 2 refleja "Bulnes" (sync por event).
  - A3 (localStorage sin sync): tab 2 refleja "Bulnes" DESPUÉS del refresh (lee del storage al init).

### P4.3 — Edge case: modo privado / storage bloqueado

- Abrir browser en modo incógnito.
- Login, navegar, seleccionar org.
- **Esperado**: dashboard funciona sin crash. Sin persistencia (refresh resetea), pero `console.warn` visible para el dev. User final no ve error UI.

### P4.4 — Smoke de rutas públicas

- Logout completo.
- Navegar a `/blog`, `/therapists/:slug`, landing.
- **Esperado**: 0 errores de "useCurrentOrganization must be used within Provider" ni similares. El try/catch del hook sigue funcionando.

### P4.5 — **STOP POINT SP-4**

| # | Check | Criterio | Acción si falla |
|---|---|---|---|
| **T11** | P1 scenario post-fix PASS | Dropdown mantiene org en 3 rutas | Si falla → R-02 o bug de state — revert + investigar. |
| **T12** | P2 scenario post-fix PASS | Refresh preserva selección | Si falla → Decisión B está mal o storage no escribe — revert + investigar. |
| **T13** | P3 scenario post-fix PASS | Logout cross-user limpio | Si falla → Decisión D está mal — revert + ajustar. |
| **T14** | Multi-tab comportamiento coincide con Decisión A | Tab 2 refleja o no según tradeoff documentado | Si loop infinito → rollback trigger #3. |
| **T15** | Modo privado no crashea | Dashboard carga sin error visible | Si crashea → R-01, try/catch insuficiente, fix. |
| **T16** | Rutas públicas sin regresión | `/blog`, `/therapists/:slug` sin errors consola | Si falla → hook useCurrentOrganization perdió try/catch — fix antes de close. |

**Reporte final a Danissa**:

```markdown
## Phase 4 Report — spec 013

- P1 (navigation): [PASS/FAIL + evidencia]
- P2 (refresh): [PASS/FAIL]
- P3 (logout cross-user): [PASS/FAIL]
- Multi-tab: [comportamiento observado]
- Modo privado: [PASS/FAIL + observación]
- Rutas públicas: [PASS/FAIL]
- Regresiones detectadas: [lista o "ninguna"]
- Decisión: close / rollback / follow-up
```

### Evaluación vs Rollback Plan

**Rollback triggers del spec §Rollback Plan**:
1. Dashboard crashea post-fix → `git revert <commit-merge-013>`.
2. Fix no funciona (P1/P2/P3 siguen rotos post-fix) → revert + re-diseñar Phase 2.
3. Multi-tab roto críticamente (solo aplica si Decisión A = A2 y hay loop infinito) → revert + ajustar Decisión A.

Si 0 triggers → **close spec**. Si ≥1 → rollback.

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Inicio de Phase 1 | Plan aprobado por Danissa | Ejecutar audit + grep + reproducir 3 escenarios |
| **SP-1** | Fin de Phase 1 | Phase 1 Report T1-T4 PASS con 🟢 GO | Solo entonces → Phase 2 decisiones |
| **SP-2** | Fin de Phase 2 | 4 decisiones documentadas, T5-T7 PASS | Solo entonces → Phase 3 code |
| **SP-3** | Fin de Phase 3 | Lint + build clean, ≤2 archivos, T8-T10 PASS | Solo entonces → Phase 4 manual |
| **SP-4** | Fin de Phase 4 | T11-T16 evaluados, decisión close / rollback | Close o revert |

---

## Time Budget

| Phase | Tiempo | Contenido |
|---|---|---|
| Phase 1 — Audit defensivo | **20 min** | Read context + greps + reproduce 3 scenarios + SP-1 report |
| Phase 2 — Decisiones diseño | **20 min** | 4 decisiones A/B/C/D documentadas + SP-2 report |
| Phase 3 — Implementation | **30-45 min** | ≤2 archivos editados + lint + build + SP-3 report |
| Phase 4 — Verify manual | **20 min** | 3 scenarios post-fix + multi-tab + modo privado + rutas públicas + SP-4 report |
| Buffer | **10 min** | R-01/R-02/R-03 si se disparan |
| **Total** | **1h 40min (100 min)** | Dentro del bound 1-2h del spec |

Si total real > **2h 30min (150 min)**: STOP implícito, revisar con Danissa.

---

## References

- `.specify/memory/constitution.md §V` (UI Honesty) — principio driver.
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento FR-008 (≤2 archivos).
- `.specify/memory/constitution.md §XIII` (cuidado AuthContext) — razón por la que Decisión D prefiere D2 (event listener) sobre D3 (tocar AuthContext).
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) — reproducir el bug antes de fixear.
- `.specify/memory/architecture.md §Providers` — contexto sobre OrganizationProvider scoped a DashboardLayout.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Scope tight de ≤2 archivos respetado. Las 4 decisiones de Phase 2 evitan diseño ad-hoc en Phase 3. |
