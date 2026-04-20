# Implementation Plan: Fix — First Odontogram Evaluation Not Logged

**Branch**: `001-fix-odontogram-audit-log` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-fix-odontogram-audit-log/spec.md`

---

## 🚨 Decision Point para el Asesor (leer antes de aprobar)

El análisis del logger (requisito 1 del asesor) reveló **un gap pre-existente** en la clave de deduplicación. **NO es causado por este fix**, **NO es requerido corregirlo por ninguna FR de la spec**, y la Edge-Case #2 de la spec ya lo documenta explícitamente como fuera de scope. La instrucción "DETENER" del asesor aplica si el fix genera un gap nuevo — este gap es anterior y la spec lo aceptó al redactarse.

**Recomendación**: proceder con el fix como está planeado (1 línea). **Levantar una spec dedicada separada** más adelante para cerrar el gap del logger (cambio en `useClinicalAccessLogger.js` para añadir `resourceId` a la clave de bucket).

Detalle técnico en "Dedup Key Analysis" abajo. Espero tu confirmación antes de `/speckit-tasks` → `/speckit-implement`.

---

## Summary

El bug es frontend-only: al crear una evaluación nueva de odontograma, el código usa `window.history.replaceState` (`OdontogramEvaluationPage.jsx:176`) para reescribir la URL. `replaceState` actualiza `window.location` pero **no** el estado interno de React Router; por eso `useParams().id` sigue retornando `'nueva'` y el gate del hook `useClinicalAccessLogger` (`patientId: isEditing && evaluationId ? …`) permanece en `null`, sin disparar el insert. Después de refresh, React Router lee el `id` de la URL, `isEditing = true`, y el hook sí dispara — por eso el roadmap 18-abr observa "aparece tras refresh".

**Fix**: reemplazar esa única línea por `navigate(\`/dashboard/therapist/odontograma/${data.id}\`, { replace: true })`. El hook `useNavigate` ya está importado (línea 2) y usado (línea 34). React Router re-rendera, `useParams().id` cambia, `isEditing` flips, y el hook del logger dispara en el mismo ciclo. Cambio localizado a 1 archivo, 1 línea. Ninguna otra modificación requerida.

## Technical Context

**Language/Version**: JavaScript (JSX), React 18.2.0
**Primary Dependencies**: react-router-dom ^6.16.0 (API `useNavigate` + `navigate(path, { replace })`)
**Storage**: Supabase PostgreSQL — tabla `clinical_audit_log` (ver nota Schema Drift abajo); insert existente desde `clinicalAuditLogger.js`, sin cambios de schema
**Testing**: Manual QA procedimental (ver sección "Manual Test"); sin tests automatizados (el repo no tiene suite de tests para componentes JSX a nivel de unidad — deuda conocida documentada en `architecture.md`)
**Target Platform**: Navegador moderno (Chrome, Firefox, Safari) — el módulo odontograma ya corre en producción
**Project Type**: Web SPA (React 18 + Vite 4.4)
**Performance Goals**: Impacto O(0) — se reemplaza una llamada síncrona por otra; ningún cambio de render tree ni de fetch budget
**Constraints**: Cambio quirúrgico de 1 línea; sin regresión en flujos existentes (guardar, cerrar, reabrir, listar); preservar la invariante anti-spam del logger
**Scale/Scope**: 1 archivo modificado (`src/features/odontogram/pages/OdontogramEvaluationPage.jsx`), 1 línea cambiada (línea 176)

## Dedup Key Analysis (Respuesta al asesor, requisito 1)

### Evidencia citada

**`src/lib/audit/useClinicalAccessLogger.js` líneas 9–16** — función `hourBucketKey`:

```js
function hourBucketKey({ userId, patientId, action, resourceType }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${y}-${m}-${d}-${h}`;
}
```

**`src/lib/audit/useClinicalAccessLogger.js` líneas 38–56** — uso de la clave:

```js
const tupleKey = `${patientId}|${action}|${resourceType}|${resourceId ?? ''}`;
if (loggedRef.current === tupleKey) return;   // dedup por-mount (incluye resourceId)

const bucketKey = hourBucketKey({ userId, patientId, action, resourceType });  // dedup por-hora (NO incluye resourceId)

if (sessionStorage.getItem(bucketKey)) {
  loggedRef.current = tupleKey;
  return;   // ya logueado este bucket de hora → SKIP
}
```

### (a) ¿La clave dedup por-hora incluye `resourceId` (evaluation_id)?

**NO.** La clave `hourBucketKey` se compone únicamente de `userId:patientId:action:resourceType:año-mes-día-hora`. `resourceId` **no participa** en el bucket horario. Existe por separado un `tupleKey` (línea 38) que sí incluye `resourceId`, pero ese solo dedup dentro del mismo mount del componente (via `loggedRef.current`), no entre mounts.

### (b) ¿El fix propuesto cumple FR-005? ¿Hay gap?

**Cumple FR-005 literal**: FR-005 dice "máximo una línea por hora para la misma combinación `user_id + patient_id + resource`". El logger hace exactamente eso. Refresh dentro de la misma hora sobre la misma evaluación no añade líneas — ya que sessionStorage tiene el bucketKey. El fix no cambia esto.

**Gap pre-existente (NO causado por este fix)**: si un dentista crea Evaluación A para Paciente X a las 10:05 y luego crea Evaluación B para el MISMO Paciente X a las 10:30, **solo A queda en el log**. B cae bajo el mismo `bucketKey` y la dedup lo bloquea. Para registrar B habría que incluir `resourceId` en `hourBucketKey`.

**¿Requiere detener el plan?**
- El gap **no es introducido por este fix** — existía antes y seguirá existiendo después.
- La sección "Edge Cases" de `spec.md` lo documenta explícitamente como **fuera de scope**: *"Este caso se documenta como supuesto a validar en `/speckit-plan` antes de tocar código — el scope de la spec NO incluye modificar el logger."*
- La instrucción del asesor ("DETENER si hay gap") tiene sentido para gaps introducidos por el fix. Este gap **preexiste la spec**, fue reconocido al escribirla, y tocar el logger expandiría scope violando Constitution IV (Micro-Bloques).

**Recomendación del plan**: proceder. Levantar spec separada `002-audit-logger-resource-dedup` (o similar) para cerrar el gap, con cambio: `hourBucketKey` incluye `resourceId ?? ''`. Scope de esa spec futura: 1 archivo (`useClinicalAccessLogger.js`), 1 línea.

---

## Technical Change (Surgical) — Respuesta al requisito 2 del asesor

### Archivo único afectado

`src/features/odontogram/pages/OdontogramEvaluationPage.jsx`

### Código actual (líneas 175–176)

```js
      // Update URL without full navigation
      window.history.replaceState(null, '', `/dashboard/odontograma/${data.id}`);
```

### Código propuesto

```js
      // Navigate to canonical URL so React Router state stays in sync
      // (required for useClinicalAccessLogger to fire — see spec 001).
      navigate(`/dashboard/therapist/odontograma/${data.id}`, { replace: true });
```

### Justificación de `navigate(path, { replace: true })` sobre alternativas

| Opción | Decisión | Razón |
|---|---|---|
| `navigate(path, { replace: true })` | ✅ elegida | Actualiza URL **y** estado interno del router. `useParams()` re-emite `id` nuevo → `isEditing = true` → hook dispara. `replace: true` preserva el botón atrás (el usuario vuelve a donde venía, no a `/nueva`). `useNavigate` ya importado y en uso en el componente (línea 34). |
| `navigate(path)` sin `replace` | ❌ rechazada | Crea entrada nueva en el historial del browser — botón atrás llevaría al estado `/nueva` con la evaluación ya creada, produciendo confusión y potencial re-trigger. |
| `window.location.href = path` | ❌ rechazada | Full page reload — pierde el estado React (teethData, treatments, patientInfo, step), el usuario tiene que volver a cargar todo. UX inaceptable para un wizard. |
| `window.history.pushState` | ❌ rechazada | Mismo problema que `replaceState`: bypassa React Router, no resuelve el bug. |
| Lift `id` a estado local y matcher manual | ❌ rechazada | Refactor innecesario, viola Constitution IV (Micro-Bloques). `useParams` es el patrón correcto de React Router v6. |

### Confirmación por grep (requisito 2 final)

**El cambio NO requiere tocar otros archivos.** Verificado:

- `grep -rn "replaceState" src/` → **1 resultado** en `OdontogramEvaluationPage.jsx:176` (el fix mismo). No hay otros módulos que dependan del patrón.
- `grep "OdontogramEvaluationPage" src/` → **2 archivos**: `OdontogramEvaluationPage.jsx` (self) y `src/app/routers/DashboardRouter.jsx` (rutas). DashboardRouter **no** necesita cambios — las rutas `odontograma/nueva` y `odontograma/:id` ya existen (líneas 154–156 según audit FASE 1).
- `useClinicalAccessLogger` y `clinicalAuditLogger` **no se tocan** (Constitution IV, scope cerrado).

---

## Lifecycle del logger en la página (Requisito 3 del asesor)

### ¿En qué efecto/momento dispara el insert?

En el `useEffect` del hook `useClinicalAccessLogger` (`useClinicalAccessLogger.js:28–78`). Es un efecto que corre en cada render cuando cambian sus dependencias:

```js
useEffect(() => {
  if (!patientId || !user?.id || !currentOrganizationId) return;
  // …roles check…
  // …dedup checks…
  logClinicalAccess({ … }).then(…);
}, [patientId, action, resourceType, resourceId, user?.id, currentOrganizationId, userOrgRoles]);
```

El insert se dispara cuando el efecto entra por primera vez con todos los guards satisfechos.

### ¿De qué depende?

En el sitio de llamada (`OdontogramEvaluationPage.jsx:81–86`):

```js
useClinicalAccessLogger({
  patientId: isEditing && evaluationId ? setup.patient_id || null : null,
  action: 'view_record',
  resourceType: 'odontogram',
  resourceId: evaluationId || null,
});
```

Los parámetros efectivos dependen de:
- `isEditing` — derivado de `useParams().id` (línea 37: `const isEditing = !!id && id !== 'nueva'`).
- `evaluationId` — state local, set en `handleStartEvaluation` (línea 170) y en `loadEvaluation` (línea 116).
- `setup.patient_id` — state local, set en Step 1 antes de crear la evaluación.

**Condición para que el hook dispare**: los tres (`isEditing` true, `evaluationId` truthy, `setup.patient_id` truthy) deben confluir. Antes del fix, `isEditing` nunca flipa a true en el flujo de creación porque `useParams().id` sigue siendo `'nueva'`.

### ¿Por qué hoy no dispara con `replaceState`? (Explicación técnica concreta)

1. Flujo creación empieza en `/dashboard/therapist/odontograma/nueva` → React Router matchea la ruta `odontograma/nueva` anidada bajo `<Route path="therapist">` → `useParams().id = 'nueva'` → `isEditing = false`.
2. `handleStartEvaluation` crea la evaluación (línea 158) → la DB devuelve `data.id`.
3. `setEvaluationId(data.id)` actualiza el state (línea 170).
4. `setStep(2)` pasa a wizard step 2 (línea 173).
5. **`window.history.replaceState(null, '', \`/dashboard/odontograma/${data.id}\`)` (línea 176)** — actualiza `window.location.pathname` pero React Router no escucha este cambio. `useParams()` lee del contexto `RouteMatch` interno, que no se modifica por `replaceState`. Resultado: `useParams().id` sigue devolviendo `'nueva'`.
6. Tras el re-render causado por `setEvaluationId`/`setStep`, el hook del logger evalúa sus dependencias. `evaluationId` ahora tiene valor — pero `isEditing` sigue siendo `false` porque `id` no cambió en el lado de React Router.
7. Por lo tanto el gate `isEditing && evaluationId ? setup.patient_id || null : null` evalúa a `null` → el `useEffect` interno del logger sale temprano en el guard `if (!patientId || ...) return` (línea 29).
8. **No se inserta fila.**

Tras un **refresh manual** del navegador:
- React Router matchea desde la URL real (la que `replaceState` había escrito) → `useParams().id = '<uuid>'` → `isEditing = true`.
- `loadEvaluation()` corre (línea 78) → setea `evaluationId` y `setup.patient_id`.
- Los 3 guards del hook pasan → insert ocurre.
- Esto es exactamente lo observado en producción ("aparece tras refresh").

Con el fix (`navigate(path, { replace: true })`):
- React Router recibe la intención de navegar → actualiza su `RouteMatch` interno → `useParams().id` pasa de `'nueva'` a `'<uuid>'`.
- En el re-render siguiente, `isEditing = true` **y** `evaluationId` tiene valor → los guards pasan → logger dispara → fila insertada.
- **Efecto colateral esperado**: `useEffect(() => { if (isEditing) loadEvaluation(); }, [id])` (líneas 77–79) fires → corre `loadEvaluation` → fetch redundante que re-escribe state con los mismos valores recién insertados. Es wasteful pero idempotente y seguro. Si se quisiera optimizar habría que revisar ese effect — fuera de scope de este fix.

---

## Manual Test Procedure (Requisito 4 del asesor)

### Setup previo

- Ambiente: staging (recomendado) o producción con cuenta de prueba que tenga al menos un paciente asignado.
- Navegador: Chrome (DevTools abiertos para ver logs del cliente).
- Acceso al SQL Editor de Supabase (consola web) con permisos de SELECT sobre `clinical_audit_log`.
- Tener a la vista el `patient_id` del paciente de prueba (ver ficha del paciente en el dashboard).

### Paso 1 — Baseline (pre-test)

1. En Supabase SQL Editor, ejecutar la query baseline para ver cuántos logs existen ANTES del test:

   ```sql
   SELECT id, user_id, patient_id, action, resource_type, resource_id, created_at
   FROM clinical_audit_log
   WHERE patient_id = '<PATIENT_ID_DE_PRUEBA>'
     AND resource_type = 'odontogram'
     AND created_at > NOW() - INTERVAL '2 hours'
   ORDER BY created_at DESC;
   ```

   Anotar el `count` inicial (puede ser 0 si nunca se abrió ese odontograma).

**Pass**: la query ejecuta sin error y devuelve N filas (registrar N).

### Paso 2 — Crear evaluación nueva

1. Login como dentista en el ambiente de prueba.
2. Ir a `Dashboard → Odontograma → Nueva Evaluación` (botón del listado).
3. En Step 1 (Configuración): seleccionar el paciente de prueba, dejar tipo "inicial", presionar **"Iniciar Evaluación"**.
4. Esperar el paso a Step 2 (Odontograma) — **NO refrescar la página**.
5. Observar la URL del browser: debe haber cambiado a `/dashboard/therapist/odontograma/<uuid>` (uuid de la evaluación recién creada).

**Pass**:
- La URL contiene un UUID (no `nueva`).
- El wizard muestra Step 2 con el odontograma del paciente.
- No hay toast de error.

### Paso 3 — Verificar el log (el core del test)

1. Inmediatamente (sin refrescar), ejecutar en Supabase SQL Editor:

   ```sql
   SELECT id, user_id, patient_id, action, resource_type, resource_id, organization_id, created_at
   FROM clinical_audit_log
   WHERE patient_id = '<PATIENT_ID_DE_PRUEBA>'
     AND resource_type = 'odontogram'
     AND action = 'view_record'
     AND created_at > NOW() - INTERVAL '2 minutes'
   ORDER BY created_at DESC;
   ```

**Pass**:
- Devuelve exactamente 1 fila nueva (comparado con el baseline del paso 1).
- `user_id` = id del dentista logueado.
- `patient_id` = el paciente seleccionado.
- `resource_id` = el UUID de la evaluación recién creada (mismo que en la URL).
- `organization_id` = organization del dentista activo.
- `created_at` dentro del último minuto.

### Paso 4 — Refresh no duplica

1. Presionar F5 en la página de la evaluación.
2. Esperar recarga. La página debe volver al Step 2 con los datos intactos.
3. Re-ejecutar la misma query del Paso 3.

**Pass**: el número de filas **no cambió** respecto al Paso 3 (sigue siendo 1 nueva desde el baseline). El dedup anti-spam vía `sessionStorage` funciona.

### Paso 5 — Botón atrás

1. Desde la página de evaluación (`/dashboard/therapist/odontograma/<uuid>`), presionar **botón atrás** del navegador.
2. Observar destino: debe llevar al listado de odontogramas (`/dashboard/therapist/odontograma`) o a la vista previa desde donde se abrió.

**Pass**:
- No vuelve a `/dashboard/therapist/odontograma/nueva` (porque `replace: true`).
- No se crea evaluación fantasma (verificar con `SELECT count(*) FROM odontogram_evaluations WHERE patient_id = '<PATIENT_ID>' AND evaluation_type = 'inicial' AND created_at > NOW() - INTERVAL '5 minutes';` — debe ser 1, no 2).

### Paso 6 — Navegación adelante dentro de la misma hora

1. Desde el listado, hacer click en la evaluación recién creada (`onClick={() => navigate(\`/dashboard/therapist/odontograma/${ev.id}\`)}`).
2. Re-ejecutar la query del Paso 3.

**Pass**: siguen siendo exactamente 1 fila nueva desde el baseline. Re-abrir la misma evaluación dentro de la misma hora no duplica.

### Paso 7 — Regresiones en flujos existentes

Validación rápida de no-regresión (para FR-006 y SC-005):

1. Guardar borrador de la evaluación actual (botón "Guardar Borrador") → toast "Borrador guardado".
2. Volver al listado, reabrir la misma evaluación → ver datos persistidos.
3. Ir al Step 3 (Resultados) → agregar procedimiento → precio auto-rellenado desde services → total calculado.
4. Completar evaluación ("Completar Evaluación") → toast "Evaluación completada".
5. Guardar en ficha ("Guardar en Ficha") → toast "Informe guardado en la ficha del paciente".

**Pass**: todos los flujos existentes se comportan igual que antes del fix. Sin errores en consola.

---

## Scope estricto — archivos que NO se tocan (Requisito 5 del asesor)

Lista explícita:

- **`src/lib/audit/clinicalAuditLogger.js`** — contrato del logger heredado.
- **`src/lib/audit/useClinicalAccessLogger.js`** — contrato del hook heredado. (El gap dedup documentado arriba se cierra en una spec futura separada.)
- **Otros archivos dentro de `src/features/odontogram/`** — incluye `api/`, `components/`, `hooks/`, y `OdontogramListPage.jsx`.
- **`src/app/routers/DashboardRouter.jsx`** — rutas ya existentes, no requieren cambio.
- **`src/pages/therapist/PatientFilePage.jsx`** — ya usa el logger correctamente (audit FASE 1).
- **`src/features/patient-dashboard/pages/PatientAccessHistoryPage.jsx`** — UI de lectura del log, no se toca.
- **`supabase/migrations/`, `supabase/policies.sql`, `supabase/functions/`** — sin cambios de schema, policies ni edge functions (Constitution VI, Schema Drift Zero).
- **Otros módulos clínicos** (`adir`, `ados2`, `sensorial-profile`, `tea`, `pie`, `symptom-flow`, `progress`) — ninguno usa `replaceState` según grep.
- **`package.json`, `.env*`, `vite.config.js`, `tailwind.config.js`, `components.json`** — sin cambios de configuración.
- **`.specify/memory/*`** — los 4 docs fundacionales.
- **`CLAUDE.md`**.

---

## Análisis de riesgo y rollback (Requisito 6 del asesor)

### 1–3 cosas que podrían salir mal

1. **`loadEvaluation` se dispara redundantemente tras el navigate**: el `useEffect` en líneas 77–79 (`if (isEditing) loadEvaluation(); }, [id])`) va a correr cuando `id` cambie de `'nueva'` a `'<uuid>'`. Hace un fetch y sobreescribe state local. **Impacto**: pérdida potencial de teeth_data en memoria si el usuario ya empezó a marcar dientes (poco probable: el navigate ocurre inmediatamente tras el create, antes de que el dentista pueda marcar). **Mitigación**: test manual Paso 7 verifica el flujo completo. Si aparece regresión, el fix de optimización (skip loadEvaluation si venimos de handleStartEvaluation, via flag de state) cabe en otra spec.
2. **Efecto colateral en el historial del browser con `replace: true`**: reemplaza la entrada `/nueva` en el history. Si el usuario abrió `/nueva` desde un botón "Nueva Evaluación" en el listado, el atrás llevará al listado. Si llegó por URL directa a `/nueva`, el atrás podría llevar a la página anterior (landing, login, depende de cómo entraron). **Mitigación**: test manual Paso 5 verifica destino esperado; si aparece comportamiento raro se decide entre `replace: true` y `replace: false` en base a la UX real.
3. **Double-fire del logger por efectos encadenados**: riesgo de que el navigate + loadEvaluation disparen el hook dos veces con distintos valores intermedios de `setup.patient_id`. **Mitigación**: el dedup por-mount (`loggedRef`) + el dedup por-hora (`sessionStorage`) impiden doble insert. El test manual Paso 3 verifica exactamente 1 fila nueva.

### Rollback en <5 minutos

El fix es una (1) línea en un (1) archivo. Si aparece regresión post-deploy:

```bash
git checkout -- src/features/odontogram/pages/OdontogramEvaluationPage.jsx
```

Luego Danissa redeploya (Vercel redeploy vía git push al revert, o vía dashboard). Tiempo total estimado: <5 min. Sin cambios de schema, sin migraciones que revertir, sin edge functions que redeploy manualmente.

---

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| **I. Compliance-First** | ✅ El fix restaura compliance Ley 21.719 (derecho ARCO a conocer primer acceso). |
| **II. RLS-First Security** | ✅ Sin cambios a RLS; el insert al log ya se ejecuta bajo policy `anyone_can_insert_log` (evidencia: `supabase/migrations/20260401000000_baseline_schema.sql:25801`). |
| **III. Append-Only Clinical Audit** | ✅ El fix hace que el primer acceso efectivamente se registre — restaura el contrato. |
| **IV. Micro-Bloques** | ✅ 1 archivo, 1 línea, scope cerrado. Out of Scope enumerado. Gap del logger NO se toca. |
| **V. UI Honesty** | ✅ Sin cambios a toasts; mantenemos el comportamiento actual del logger (console.warn on fail, no toast mentiroso). |
| **VI. Schema Drift Zero** | ⚠ **Observación pre-existente** (ver "Schema Drift Note" abajo). El fix NO introduce drift nuevo. |

### Schema Drift Note (pre-existente, para awareness del asesor)

Durante el análisis del logger descubrí una discrepancia entre los 4 docs fundacionales y el código real:

- **Docs** (`data-compliance.md`, `architecture.md`, `ecosystem-communicare.md`, `constitution.md`): la tabla se llama `clinical_audit_log`.
- **Código** (`clinicalAuditLogger.js:6`): el logger inserta en `clinical_audit_log`.
- **Migraciones**:
  - `clinical_audit_log` existe desde `20260401000000_baseline_schema.sql:12357` (tabla antigua con `action` limitado a `view/download_pdf/share/revoke/grant/export/auto_grant`).
  - `clinical_audit_log` existe desde `20260415100000_organization_model_schema.sql:157` (tabla nueva usada por el logger actual).

**Ambas tablas existen en producción.** El logger actual escribe al nuevo. Los docs usan el nombre viejo. Esto es una violación declarativa de Constitution VI (Schema Drift Zero) **preexistente al spec** — no introducida por este fix.

**Acción recomendada (fuera de scope)**: actualizar los 4 docs de `.specify/memory/` para corregir `clinical_audit_log` → `clinical_audit_log` donde corresponde al logger actual, y clarificar el rol de la tabla legacy (posible uso por PatientAccessHistoryPage — verificar en spec separada). No bloquea este fix.

## Project Structure

### Documentation (this feature)

```text
specs/001-fix-odontogram-audit-log/
├── spec.md                         # Specification (ya creado)
├── plan.md                         # This file
├── checklists/
│   └── requirements.md             # Quality checklist (ya creado)
└── tasks.md                        # [Pending /speckit-tasks]
```

No se generan `research.md`, `data-model.md`, `quickstart.md` ni `contracts/` para este plan porque:
- **research.md**: el research está completo inline (análisis del logger + explicación técnica del bug).
- **data-model.md**: sin cambios de data model (ninguna tabla, columna ni relación nueva).
- **quickstart.md**: cubierto por la sección "Manual Test Procedure".
- **contracts/**: no aplica — no hay API/contract nuevo.

### Source Code (repository root) — real paths afectados

```text
src/
└── features/
    └── odontogram/
        └── pages/
            └── OdontogramEvaluationPage.jsx   # 1 línea modificada (línea 176)
```

**Structure Decision**: sin cambios estructurales. El fix vive dentro de la feature `odontogram` siguiendo el pattern `src/features/<dominio>/pages/<Page>.jsx` documentado en `architecture.md`. No se crea ningún archivo nuevo.

## Complexity Tracking

Sin violaciones a justificar. El plan respeta los 6 principios sin excepciones, salvo la observación de Schema Drift pre-existente (no introducida por este fix, flagged al asesor).

## Pre-flight checklist para `/speckit-tasks`

Antes de proceder a generación de tasks:

- [x] Spec aprobada por el asesor (revisión de 5 líneas completada).
- [ ] Decisión del asesor sobre el gap dedup del logger (proceder vs. stop vs. ampliar scope).
- [ ] Confirmación del asesor sobre el Schema Drift Note (dejar como observación o abrir spec de corrección de docs).

---

**Last updated**: 2026-04-19
**Readiness**: Plan listo para review. Pendiente confirmación del asesor en los 2 decision points antes de `/speckit-tasks`.
