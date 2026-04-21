# Data Model — Persistent Organization Context (spec 013)

**Generado**: 2026-04-20 durante Phase 1 audit.

---

## Current state — OrganizationContext.jsx

**Path**: `src/contexts/OrganizationContext.jsx` (118 líneas).

**State shape** (líneas 19-22):
```js
organizations        : [{id, name}]   // deduped, active memberships
currentOrganizationId: string | null
userOrgRoles         : string[]       // deduped (dentist/clinic_admin/assistant)
loading              : boolean
```

**APIs expuestas** (líneas 102-111):
- `currentOrganizationId`, `currentOrganization` (derived), `organizations`, `isMultiOrg` (derived)
- `loading`, `setCurrentOrganizationId` (useCallback), `userOrgRoles`, `effectiveRole` (derived dentist>clinic_admin>assistant)

**Storage actual** (líneas 5, 24, 63-68, 81-87):
- ✅ **Ya existe persistencia** con `sessionStorage` y key `dentalspot_current_org:${user.id}`.
- Lee: línea 63 dentro del effect, SOLO si `uniqueOrgs.length > 1`.
- Escribe: línea 83 via `setCurrentOrganizationId` useCallback en cada cambio.
- Limpia: línea 68 si stored inválido (no está en uniqueOrgs), línea 85 si orgId es null.

**Timing de init** (líneas 26-77):
- Un solo `useEffect([user?.id, storageKey])` que:
  1. Si no hay user → reset a defaults + loading=false.
  2. Else → fetch `organization_members` via Supabase, dedupe, setear state.
  3. Si `uniqueOrgs.length === 1` → asigna directo `uniqueOrgs[0].id` (línea 61). **NO lee storage.**
  4. Si `uniqueOrgs.length > 1` → lee storage. Si válido → restore. Si inválido/ausente → **setCurrentOrgId(null)** (línea 69). **BUG ROOT AQUÍ.**
  5. Si `uniqueOrgs.length === 0` → queda null.

**`useCurrentOrganization` hook** (`src/hooks/useCurrentOrganization.js`): wrapper defensivo con try/catch. Fuera del provider retorna `currentOrganizationId: null`, `organizations: []`, etc. Rutas públicas lo usan sin crash.

---

## Consumers — useCurrentOrganization / useOrganization

**Total callsites activos**: 12 (✅ cumple T2 ≤30).

| Categoría | Conteo | Archivos |
|---|---|---|
| **Activos** (filtran queries por org) | 9 | `calendar/AppointmentModal.jsx`, `calendar/NewAppointmentForm.jsx`, `patients/components/PatientModal.jsx`, `features/patient-import/hooks/usePatientImport.js`, `features/assistant/pages/AssistantAgendaPage.jsx`, `features/assistant/pages/AssistantPatientsPage.jsx`, `features/assistant/pages/AssistantDashboard.jsx`, `features/assistant/components/AssistantNewAppointmentDialog.jsx`, `lib/audit/useClinicalAccessLogger.js` |
| **Pasivos** (metadata/display) | 2 | `components/dashboard/OrganizationSelector.jsx` (dropdown UI), `components/layout/Sidebar.jsx:128` (effectiveRole para nav items) |
| **Wrappers** (usan el hook internamente) | 1 | `components/guards/RoleGuard.jsx` — usa `effectiveRole` y `loading` |
| **Core provider** | 2 | `contexts/OrganizationContext.jsx` (el hook mismo), `hooks/useCurrentOrganization.js` (wrapper con try/catch) |

**Observación**: ningún archivo de contexts/ ni routes/ se tocará. Fix contenido 100% en `OrganizationContext.jsx`.

---

## Existing storage patterns

**Pattern repo-wide**:
- `sessionStorage` usage (14 callsites):
  - `OrganizationContext.jsx` (persiste org) ← **driver del spec**
  - `AuthContext.jsx` lines 210/216/218 (`dentalspot_pending_recovery`)
  - `useClinicalAccessLogger.js` lines 50/55/73 (audit dedup bucket con try/catch)
  - `lazyRetry.js` lines 11/14/21 (dedup chunk reload)
  - `main.jsx:21` (pending recovery flag)
  - `DentistMatchStep.jsx:41` (pending consulta)
- `localStorage` usage:
  - `hooks/useCart.jsx` 12/14/24/26 (`cartItems` cross-session)
  - `features/admin/shell/useAdminShell.js` 12/21/35/39 (`admin_sidebar_*`)
  - `components/shared/CookieBanner.jsx` 101/122 (consent)
  - `components/shared/FeedbackPopup.jsx` 32/59 (feedback dismissed)
  - `components/layout/Sidebar.jsx:138` **`localStorage.clear()` en error path del logout** ← colateral relevante para Decisión D.

**Key format**: el spec usaba ya el patrón `dentalspot_current_org:USER_UUID` — ✅ confirmado.

---

## Loss scenarios — hipótesis actualizada post-audit

**La hipótesis inicial del spec estaba parcialmente incorrecta.** El storage YA EXISTE. El bug real está en la **lógica de restauración** en 3 sub-bugs específicos:

### Bug #1 (causa P1 + P2 para usuarios multi-org sin stored)

Líneas 66-70: si `uniqueOrgs.length > 1` y no hay stored válido → `setCurrentOrgId(null)`.

Impacto: primer login de un dentista con 2+ clínicas → sin valor en sessionStorage → quedan en null. Queries filtran `organization_id = null` → array vacío en views. Usuario ve "no tienes pacientes" cuando sí los tiene.

**Fix**: cuando stored es inválido/ausente en multi-org, asignar **default a primera org** (`uniqueOrgs[0].id`) y persistirla, en lugar de null. Elimina la pantalla vacía.

### Bug #2 (causa P2 refresh para cross-tab)

`sessionStorage` es **per-tab**. Si usuario abre el dashboard en tab A (con org seleccionada), luego abre tab B → tab B no ve la selección. F5 en tab B regenera el estado per-tab con el mismo bug #1.

**Fix**: migrar a `localStorage` para que persista cross-tab y cross-session (cerrar/abrir browser).

### Bug #3 (causa P3 logout cross-user — residuo silencioso)

Logout actual (`Sidebar.jsx:132-141`): happy path hace `signOut + navigate`. Error path hace `localStorage.clear()`. **El sessionStorage del orgContext NUNCA se limpia explícitamente**.

Impacto: User A cerró logout → sus keys `dentalspot_current_org:USER_A_UUID` y `dentalspot_pending_recovery` quedan en el tab. Si User B logea en mismo tab:
- `storageKey` de B es diferente (`...:USER_B_UUID`), entonces B NO lee data de A (inocuo por aislamiento de key).
- **Pero hay acumulación silenciosa** de keys huérfanas por user. Si el mismo User A vuelve a logear, su stored antiguo puede estar apuntando a una org a la que ya no pertenece (caso R-02).

**Fix**: cleanup explícito via `useEffect(() => { if (!user?.id) clearPersistedOrg(previousUserIdRef.current) }, [user?.id])` dentro de OrganizationContext. Captura logout detectando transición user→null.

### Baseline empírico (TASK-P1-BASELINE — 2026-04-20 via Playwright MCP)

**Cuenta testeada**: `dentalspot.cl@gmail.com` (Cristóbal, user_id `4e55fb74-b3b5-4233-9b5d-88d7a01a9046`, multi-org confirmado: Odontología Los Álamos + Odontologia Bulnes).

#### P1 — Multi-org primer login sin stored (sessionStorage limpio pre-login)

Procedimiento: `sessionStorage.removeItem('dentalspot_current_org:*')` → login → navegar a `/dashboard/patients` → capturar estado.

| Observación | Resultado |
|---|---|
| sessionStorage post-login | **`{}` vacío** — Provider NO seteó key al init |
| Dropdown org | **"Seleccionar organización"** (label placeholder, sin org) |
| /patients render | **Muestra 4 pacientes + Total=4 + Citas=9** |
| Console errors | 0 |
| Screenshot | `specs/013-ux-persistent-org-context/baseline-p2-post-refresh.png` (post-select + F5) |

**Divergencia crítica con hipótesis original del spec**: el spec describía "array vacío cuando debería tener data". **NO se reproduce**. Con `currentOrganizationId = null`, /patients **sí muestra data** (4 pacientes visibles, stats pobladas). El bug UX real es:
- (a) Dropdown dice "Seleccionar organización" — ambiguo, dentista no sabe de qué clínica ve data.
- (b) Las queries de `/patients` **no filtran por `currentOrganizationId`** — muestran todos los pacientes asociados al user vía RLS/membership. Esto es una **posible fuga cross-org** pero es un bug de **aislamiento de queries**, NO un bug de persistencia de contexto (out-of-scope spec 013).

#### P2 — Refresh con org seleccionada (F5 después de selección manual)

Procedimiento: tras P1, seleccionar "Odontologia Bulnes" en dropdown → capturar sessionStorage + dropdown → navegar al mismo URL (F5) → recapturar.

| Observación | Pre-F5 | Post-F5 |
|---|---|---|
| sessionStorage key | `dentalspot_current_org:4e55fb74-...` = `f7877d13-b5b9-4a16-8aee-be7933910478` (Bulnes UUID) | **idéntico** ✅ |
| Dropdown | "Odontologia Bulnes" | **"Odontologia Bulnes"** ✅ |
| Data | 4 pacientes / 9 citas | 4 pacientes / 9 citas ✅ |
| Console errors | 0 | 0 |

**P2 baseline: PASS** ✅ — el refresh con storage previo funciona correctamente. sessionStorage sobrevive F5 (comportamiento estándar). El Provider restaura la selección via línea 63-65.

**Divergencia con hipótesis del spec**: el spec asumía P2 roto. **NO se reproduce.** Lo que sí rompería P2 hipotéticamente: (a) cerrar tab y reabrir (sessionStorage se borra), (b) abrir segundo tab (sessionStorage es per-tab).

#### P3 — SKIPPED por decisión del advisor

Evidencia de código suficiente (Sidebar.jsx:138 `localStorage.clear()` solo en error path; sessionStorage org NO se limpia en logout happy path). Key match per-user limita contamination activa a acumulación residual inofensiva.

### Resumen: spec 013 debe pivotar el scope

**Hipótesis original del spec**: "dentistas pierden currentOrganizationId en navigation / refresh / logout → array vacío".

**Realidad empírica**:
- **P1 navigation**: parcialmente correcto — el `currentOrganizationId` sí es `null` en primer login multi-org, pero NO produce "array vacío" porque queries no filtran por org. Bug UX (dropdown ambiguo) ≠ bug de persistencia.
- **P2 refresh**: **NO reproduce** — funciona correctamente cuando hay stored previo. Solo rompería en edge cases (tab cerrado, segundo tab) que el spec no cubría explícitamente.
- **P3 logout**: riesgo latente de acumulación pero no demostrado impacto activo.

**Pivot propuesto para Phase 2**: revisar el scope del spec con Danissa antes de continuar. Opciones:
- **Opción Y1**: reducir spec 013 a un fix mínimo — "multi-org primer login: default a primera org en lugar de null" (1 línea cambiada en OrganizationContext.jsx:69). Eliminar decisiones A/B/C/D como over-engineering para un bug que no se reproduce tal como el spec lo describía.
- **Opción Y2**: expandir scope a incluir Bug de aislamiento de queries (`/patients` no filtra por `currentOrganizationId`) — pero esto violaría Constitution §IV (spec = un fix coherente) y debería ser spec propio.
- **Opción Y3**: aplicar fix original del plan (localStorage + listener + validation) aun si los bugs empíricos son menores — defensa en profundidad. Tradeoff: fix "por si acaso" vs Constitution §IV micro-bloques.

🔴 **Decisión de Danissa requerida antes de Phase 2.**

---

## Empirical findings (post-Phase 1 baseline)

- **P2 refresh**: funciona correctamente en sessionStorage (pre/post-F5 identical). No es bug. **No migrar a localStorage.**
- **P1 root cause**: `setCurrentOrgId(null)` en multi-org sin stored (OrganizationContext.jsx:69) → dropdown `"Seleccionar organización"`. UX cosmético (ambiguo), no produce array vacío porque queries no filtran por `currentOrganizationId`.
- **P3**: riesgo latente de logout no-cleanup en happy path. `Sidebar.jsx:138` solo hace `localStorage.clear()` en error path del logout. sessionStorage residual acumula por user_id pero aislamiento de keys limita contamination activa.

---

## Design decisions — Y1 scope reducido (post-empirical)

Post-baseline empírico, 2 decisiones del plan original se descartan porque el bug hipotético no reproduce:

| Decisión | Opción elegida | Rationale | Estado |
|---|---|---|---|
| **A** tipo storage | **SKIP** — mantener sessionStorage | P2 refresh funciona. sessionStorage cross-tab desync y reset post-close-tab son tradeoffs existentes aceptables, no reportados como bug. Migrar a localStorage sería over-engineering. | Descartada |
| **B** timing restauración | **SKIP** — mantener useEffect post-mount | El timing actual funciona. Bug real no es de timing sino de **valor default** cuando stored ausente. | Descartada |
| **C** fallback invalid/ausente | **REDUCIDA** — multi-org sin stored → **default a primera org + persistir** | Cambia el branch de líneas 66-70: en lugar de `setCurrentOrgId(null)` + `removeItem`, hacer `setCurrentOrgId(uniqueOrgs[0].id)` + `setItem`. Elimina dropdown ambiguo y persiste para futuras sesiones del mismo tab. Mantiene validación de stored válido como estaba. | Activa |
| **D** logout cleanup | **KEEP** — event listener dentro de OrganizationContext | `useEffect(() => { if (user?.id) ref.current = user.id; else if (ref.current) clearOrg(ref.current) }, [user?.id])` con useRef para capturar previous user_id antes de que se pierda en el unmount del auth. | Activa |

### Alcance final post-Y1

- **1 archivo**: `src/contexts/OrganizationContext.jsx`.
- **2 cambios netos**:
  1. Líneas 66-70: default a primera org + persistir cuando multi-org sin stored válido.
  2. Nuevo `useEffect` + `useRef` para detectar transición `user?.id → null` y limpiar storage.
- **Líneas estimadas**: +10-15 netas.
- **Imports**: agregar `useRef` a imports de React (ya trae `useState`, `useEffect`, `useCallback`).

---

## Future work (out-of-scope spec 013)

**Follow-up spec propuesto: `audit-cross-org-query-isolation`**

Motivo: el baseline empírico P1 reveló que con `currentOrganizationId = null` (multi-org sin selección), `/dashboard/patients` aún muestra 4 pacientes + 9 citas. Esto sugiere que las queries **no filtran por `organization_id`** — dependen exclusivamente de RLS (via `user_id` o `care_team`).

Hipótesis no confirmada (requiere investigación):
- Si RLS filtra por `user_id`/`care_team` membership, el "no filter por currentOrg" puede ser **deliberado** para dentistas con cuentas en varias clínicas (ven sus pacientes agregados).
- Si esto es incorrecto, hay una **potencial fuga cross-org** — un clinic_admin de Los Álamos podría ver datos de Bulnes si es miembro de ambas y el dropdown no filtra.

**Priority**: investigar cuando bandwidth permita. Potencial gap de aislamiento pero **no confirmado** como bug. Requiere lectura de `patientsApi`/queries específicas + revisión de RLS policies sobre `patients`/`clinical_records`.

**NOT in scope de spec 013** — Constitution §IV (un spec = un fix coherente). El fix de persistencia de contexto y el audit de aislamiento de queries son esfuerzos ortogonales.

---

## Expected behavior post-fix (referencia para Phase 4)

- **P1 post-fix**: dentista multi-org primer login (sessionStorage limpio) → Provider asigna `uniqueOrgs[0].id` por default + persiste en sessionStorage. Dropdown muestra "Odontología Los Álamos" (primera del array) inmediatamente. NO "Seleccionar organización" ambiguo.
- **P2 post-fix**: regresión check — refresh con org seleccionada debe seguir preservando (es el estado ya PASS del baseline; el fix no debe romperlo).
- **P3 post-fix**: logout → useEffect detecta `user?.id → null` + `previousUserIdRef.current` no-null → `sessionStorage.removeItem(storageKey_previous)`. Verificar empíricamente: sessionStorage `dentalspot_current_org:*` **vacío post-logout**.
