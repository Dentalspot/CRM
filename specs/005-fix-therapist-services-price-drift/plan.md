# Implementation Plan: Fix — schema drift `therapist_services.price` en odontogramEvalApi

**Branch**: `005-fix-therapist-services-price-drift` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-fix-therapist-services-price-drift/spec.md`

---

## Summary

El drift es 1 token en 1 línea: `src/features/odontogram/api/odontogramEvalApi.js:172` pide `.select('id, service_name, price, duration_minutes')` contra la tabla `therapist_services`, pero la columna real es `price_clp` (confirmado en `information_schema.columns` el 2026-04-20). PostgreSQL devuelve error 42703, el array de servicios no se hidrata, y el presupuesto del odontograma queda mutilado. **Phase 1 confirmó que los 6 archivos "pendiente confirmar" son TODOS IMMUNES** — ningún drift oculto. El scope queda estrictamente en 1 archivo, 1 línea. **Enfoque elegido: A (alias SQL `price:price_clp`)** — el frontend consumidor (`OdontogramEvaluationPage.jsx` líneas 247, 276, 553) sigue leyendo `s.price` sin cambios. Respeta FR-002 literal (mínimo scope) y Constitution IV (micro-bloques).

## Technical Context

**Language/Version**: JavaScript (JS, no TS en este archivo), React 18.2.0.
**Primary Dependencies**: `@supabase/supabase-js` (cliente Supabase ya importado).
**Storage**: tabla `therapist_services` (solo lectura); sin cambios de schema ni migraciones.
**Testing**: manual QA por Danissa — 7 pasos procedimentales + verificación de no-regresión en 3 consumidores immunes (sampling).
**Target Platform**: Navegador moderno; el fix es pura query SQL embebida en JS.
**Project Type**: Web SPA.
**Performance Goals**: O(0) impacto — solo cambia la cadena del `.select()`. Supabase resuelve el alias server-side sin costo adicional.
**Constraints**: 1 archivo (`odontogramEvalApi.js`), 1 línea. NO tocar consumidores (FR-005). NO tocar schema ni migrations. NO warnings nuevos.
**Scale/Scope**: 1 archivo, 1 línea modificada. Cero cambios frontend.

## Phase 1 defensiva — Confirmación de los 6 archivos "pendiente confirmar"

Lectura directa de cada archivo en las líneas señaladas por el mini-audit. Ninguno tiene el drift.

### Tabla de veredictos

| # | Archivo:línea | Columnas pedidas | Veredicto |
|---|---|---|---|
| 1 | `src/pages/clinic/useClinicDashboard.js:114-116` | `.select('id, price_clp')` | ✅ **IMMUNE** — usa `price_clp` correcto |
| 2 | `src/pages/TherapistPublicProfilePage.jsx:165-170` | `.select('*')` + `.order('price_clp')` | ✅ **IMMUNE** — wildcard + orden por `price_clp` (existente) |
| 3a | `src/components/therapist-profile/sections/services-fees.utils.js:103-112` (`fetchServices`) | select explícito incluye `price_clp, price_usd, service_description, ...` | ✅ **IMMUNE** — pide ambas columnas reales |
| 3b | `services-fees.utils.js:173-186` (INSERT + `.select()`) | mismo listado con `price_clp, price_usd` | ✅ **IMMUNE** |
| 3c | `services-fees.utils.js:211-220` (UPDATE + `.select()`) | mismo listado con `price_clp, price_usd` | ✅ **IMMUNE** |
| 3d | `services-fees.utils.js:260-266` (UPDATE soft-delete) | UPDATE sin `.select()` de columnas | ✅ **IMMUNE** — solo setea `is_active=false` |
| 4 | `src/components/calendar/BookingCalendar.jsx:91-97` | `.select('id, service_name, price_clp, duration_minutes')` | ✅ **IMMUNE** — usa `price_clp` correcto |
| 5 | `src/components/calendar/EditAppointmentForm.jsx:58-63` | `.select('id, service_name, duration_minutes')` | ✅ **IMMUNE** — no pide campo de precio |

**Resultado:** **0/6 tienen drift.** El bug está aislado en `odontogramEvalApi.js:172`. No hay que expandir scope. No hay que abrir specs secundarias.

**Patrón observable en el codebase:** todos los otros consumidores **usan `price_clp` directamente** (o wildcard). Ninguno usa alias SQL. El enfoque A (alias) introduce una pequeña inconsistencia de estilo, pero es el mínimo scope posible y preserva el frontend consumidor sin modificación (ver §"Decisión de enfoque" abajo).

## Decisión de enfoque (Opción A elegida)

### Opciones evaluadas

| Criterio | **A — Alias SQL** | **B — Cambio completo** |
|---|---|---|
| Archivos tocados | 1 (`odontogramEvalApi.js`) | 2 (`odontogramEvalApi.js` + `OdontogramEvaluationPage.jsx`) |
| Líneas modificadas | 1 | 4 (1 en API + 3 en consumidor líneas 247, 276, 553) |
| Frontend consumidor | Sin cambio (FR-002 literal cumplido) | Cambio en 3 puntos de `.price` → `.price_clp` |
| Consistencia con otros consumidores del codebase | 🟡 Inconsistente (ningún otro usa alias; todos usan `price_clp` o `*`) | ✅ Consistente con patrón dominante |
| Riesgo de regresión | Muy bajo (1 archivo) | Bajo (2 archivos, pero 3 lugares a sincronizar) |
| Claridad semántica en código | 🟡 Alias oculta que la columna real es `price_clp` | ✅ Explícita |
| Ventaja futura (multi-moneda `price_usd`) | El alias es punto natural de abstracción si mañana se añade selección de moneda | Cada consumidor se abstrae independientemente |

### Elección: **Opción A — Alias SQL**

**Justificación (3 razones):**

1. **Constitution IV (Micro-Bloques):** 1 archivo, 1 línea es el mínimo posible para cerrar el bug. Opción B multiplica por 4 el tamaño del cambio sin valor funcional adicional (el usuario ve el mismo resultado).
2. **FR-002 literal:** la spec establece "El código downstream en `OdontogramEvaluationPage.jsx` (líneas 247, 276, 553) sigue funcionando sin cambios frontend, idealmente." Opción A cumple ese "idealmente" completo; Opción B lo relaja a "fix coordinado".
3. **Reversibilidad:** si en el futuro se decide migrar a multi-moneda, tocar 1 línea de alias es más barato que encontrar y sincronizar 3 usos dispersos en el consumidor. El alias es un punto de abstracción natural.

**Contra-argumento considerado y descartado:** "Opción B es más consistente con el codebase". Cierto, pero la inconsistencia se limita a un archivo aislado. El valor de la consistencia es marginal cuando el costo es 3x más líneas tocadas. Constitution IV prima.

**Resultado:** scope final = **1 archivo, 1 línea**. Sin cambios en `OdontogramEvaluationPage.jsx`. Sin cambios en otros archivos.

## Technical Change Propuesto

### Edit 1 — `odontogramEvalApi.js:172` (única edición)

```js
// contexto (líneas 170-171):
  const { data, error } = await supabase
    .from('therapist_services')

ANTES (línea 172):
    .select('id, service_name, price, duration_minutes')

DESPUÉS (línea 172):
    .select('id, service_name, price:price_clp, duration_minutes')

// contexto (líneas 173-175):
    .eq('therapist_id', therapistId)
    .eq('is_active', true)
    .order('service_name');
```

**Mecanismo del alias:** el operador `:` en Supabase/PostgREST renombra la columna en el result set. `price_clp` se selecciona de la tabla, y el objeto JS resultante tiene la propiedad `price` (no `price_clp`). El frontend consumidor sigue accediendo a `s.price` normalmente.

**Edit con `Edit replace_all: false`** porque el `old_string` es único en el archivo (el string `'id, service_name, price, duration_minutes'` no aparece en ningún otro lugar del repo).

## Archivos que NO se tocan

Lista explícita (cumple FR-005 + scope estricto):

- **Consumidores del field `.price` del objeto devuelto**: `OdontogramEvaluationPage.jsx:247, 276, 553` — el alias SQL los deja transparentes.
- **Otros archivos del módulo `odontogram/`**: `components/`, `hooks/`, `pages/OdontogramListPage.jsx`. Ninguno consulta `therapist_services`.
- **Otras funciones `fetchTherapistServices` del codebase (duplicadas con mismo nombre)**:
  - `src/features/therapist/services/therapist.api.js:209` — usa `select('*')`, immune.
  - `src/features/recommendations/api/therapistApi.js:230` — usa `select('*')`, immune.
- **Otros consumidores de `therapist_services`** confirmados immunes en Phase 1 (8 archivos).
- **`src/lib/audit/*`, `clinicalAuditLogger.js`, `useClinicalAccessLogger.js`** — sin relación con este bug.
- **Policies RLS, migraciones, edge functions, tabla `therapist_services`** — sin cambios de schema.
- **Los 4 docs fundacionales de `.specify/memory/`** y **`CLAUDE.md`** — intactos.
- **Artifacts de specs 001, 002, 003, 004** — intactos.
- **Commits y pushes** — los hace Danissa.

## Test Manual Procedural

### Setup
Login como dentista con al menos 1 fila en `therapist_services` con `is_active=true` y `price_clp > 0`. Si la cuenta de prueba (Cristóbal) no tiene servicios activos, crear uno desde `TherapistProfileDashboardPage` antes del test.

### Paso 1 — DevTools Console abierta, ningún error 42703

1. Abrir DevTools → Console (filter `Error`).
2. Navegar a `/dashboard/therapist/odontograma/nueva?patient=<PATIENT_ID>`.
3. Esperar que el Step 1 renderice.

**Pass criterion:** no aparece error PostgreSQL `42703 column "price" does not exist` ni mensaje del logger `[odontogramEvalApi] fetchTherapistServices error`.

### Paso 2 — Crear evaluación y avanzar al Step 3

1. Seleccionar paciente, tipo "inicial", "Iniciar Evaluación".
2. En Step 2 (Odontograma): marcar al menos 1 diente con una condición (p.ej. caries).
3. Click "Resultados" para pasar a Step 3.

**Pass criterion:** Step 3 (Resultados y Presupuesto) se muestra.

### Paso 3 — Dropdown de procedimientos tiene opciones

1. Click "Agregar Procedimiento" (o ver la fila auto-sugerida del diente marcado).
2. Abrir el dropdown "Procedimiento" de la fila.

**Pass criterion:** el dropdown muestra ≥1 opción con formato `<service_name> ($<precio>)`. Si el dentista tiene N servicios activos, ver N opciones (el `.order('service_name')` las muestra alfabéticamente). **Pre-fix este paso fallaba con dropdown vacío.**

### Paso 4 — Auto-fill de precio al seleccionar procedimiento

1. Seleccionar una opción del dropdown.
2. Observar el campo "Precio (CLP)" de esa fila.

**Pass criterion:** el campo "Precio" se rellena con el valor numérico de `price_clp` del servicio seleccionado (un número entero, no 0, NaN, o vacío). **Pre-fix `matchedService.price` era `undefined` y el auto-fill no ocurría.**

### Paso 5 — Total del presupuesto suma correctamente

1. Agregar un segundo procedimiento distinto con otro precio.

**Pass criterion:** el "Total" (esquina superior derecha de la Card) suma los 2 precios en formato CLP (ej. "$45.000"). No es 0, no es NaN.

### Paso 6 — Guardar evaluación con precios

1. Opcional: editar un precio manualmente para verificar que el input acepta overrides.
2. Click "Completar Evaluación".

**Pass criterion:** toast "Evaluación completada" sin error. La evaluación queda persistida con los precios mostrados.

### Paso 7 — Regresión check en 3 consumidores immunes

Verificar que abrir estos flujos NO produce errores nuevos en consola:

1. `/dashboard/therapist` (dashboard del dentista) — widget de servicios/precios debe seguir funcionando.
2. `/dashboard/clinic/reports` (si Cristóbal tiene rol clinic_admin en alguna org) — reportes deben cargar.
3. `/dentista/<slug>` (perfil público de un dentista) — servicios públicos deben mostrarse.

**Pass criterion:** ningún error 42703 ni regresión observable.

## Análisis de riesgo y rollback

### Riesgos

1. **Consumidor oculto que pide `.price` y no se detectó en el mini-audit**.
   - **Mitigación**: el grep del mini-audit cubrió todos los matches de `therapist_services` en `src/`. Si por timing hubiera un archivo nuevo no indexado (poco probable en una sesión sincrónica), el test manual Paso 7 lo expondría. Con Opción A, el alias hace que `.price` siga funcionando, así que un consumidor oculto ni siquiera se entera del cambio — reduce el riesgo a casi 0.
2. **Caracter `:` mal interpretado por PostgREST en algún entorno**.
   - **Mitigación**: el alias `price:price_clp` es sintaxis documentada y estable de PostgREST (Supabase la soporta universalmente). Test manual Paso 1 verifica que no hay error.
3. **`price_clp` es `null` en alguna fila**.
   - **Mitigación**: el consumidor en `OdontogramEvaluationPage.jsx:247` usa `matchedService?.price || 0` — ya maneja `null`/`undefined` con fallback a 0. Sin cambio.
4. **Linter flagea algo del alias**.
   - **Mitigación**: es un string JS literal dentro de un `.select()`; ESLint no tiene reglas específicas para PostgREST alias. Test T-06 (ESLint) lo confirma.

### Rollback

```bash
git checkout -- src/features/odontogram/api/odontogramEvalApi.js
```

<10 segundos. Sin migraciones, sin rebuild largo. Tiempo total rollback-to-green: <30 segundos incluyendo un `npm run build` posterior si hace falta regenerar `dist/`.

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| **I. Compliance-First** | ✅ No toca PHI. Sin impacto compliance directo. |
| **II. RLS-First Security** | ✅ Sin cambios a RLS. La query sigue respetando las policies existentes de `therapist_services`. |
| **III. Append-Only Clinical Audit** | ✅ Sin relación con `clinical_audit_log`. |
| **IV. Micro-Bloques** | ✅ 1 archivo, 1 línea. Out of Scope enumerado en spec. Rollback <10s. |
| **V. UI Honesty** | ✅ Restaura honestidad: la UI ya no muestra "0" o "vacío" silencioso cuando el estado real es "servicios disponibles". |
| **VI. Schema Drift Zero** | ✅ **Este es exactamente el caso que el principio anticipa.** El drift queda cerrado — el alias SQL traduce `price_clp` → `.price` en el result set, manteniendo la compatibilidad del consumidor sin referenciar una columna inexistente. Alternativamente, si en el futuro se prefiere eliminar el alias, basta con aplicar Opción B (spec futura). |

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-therapist-services-price-drift/
├── spec.md                         # Specification (ya creada)
├── plan.md                         # This file
├── checklists/
│   └── requirements.md             # Quality checklist (ya creada)
└── tasks.md                        # [Pending /speckit-tasks]
```

No se generan `research.md`, `data-model.md`, `quickstart.md` ni `contracts/`:
- Research: inline (Phase 1 defensiva con 6 archivos verificados).
- Data model: sin cambio de schema.
- Quickstart: cubierto por "Test Manual Procedural".
- Contracts: no aplica.

### Source Code (repository root) — archivos afectados

```text
src/
└── features/
    └── odontogram/
        └── api/
            └── odontogramEvalApi.js   # 1 edición en línea 172
```

**1 archivo modificado. 0 archivos nuevos. 0 archivos eliminados. 0 cambios en frontend consumidor.**

## Complexity Tracking

Sin violaciones a justificar. El plan es el cambio mínimo posible (1 token — cambiar `price` a `price:price_clp`). No hay alternativas arquitectónicas a comparar más allá de A vs B, ya evaluadas y justificada la elección.

## Pre-flight checklist para `/speckit-tasks`

- [ ] Spec 005 aprobada (review 5 líneas).
- [ ] Plan 005 aprobado por el asesor (este documento).
- [ ] Confirmación de que el test manual lo ejecuta Danissa (esperado, mismo patrón que specs previas).
- [ ] (Opcional) Confirmación de que la cuenta de prueba tiene al menos 1 servicio activo en `therapist_services` con `price_clp > 0`. Si no, crear uno antes del test.

---

**Last updated**: 2026-04-20
**Readiness**: Plan listo para review. 0 drifts ocultos. Scope confirmado a 1 archivo, 1 línea. Enfoque A justificado con 3 argumentos. Listo para `/speckit-tasks` tras aprobación.
