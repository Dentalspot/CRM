# Implementation Plan: Fix — Odontogram Routing Mismatch (callsites alignment)

**Branch**: `002-fix-odontogram-routing-mismatch` | **Date**: 2026-04-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/002-fix-odontogram-routing-mismatch/spec.md`

---

## Summary

El router registra las rutas del módulo Odontograma bajo `<Route path="therapist">` en `DashboardRouter.jsx:123-206`, produciendo paths canónicos `/dashboard/therapist/odontograma*`. Pero 7 callsites en 4 archivos frontend navegan a `/dashboard/odontograma*` sin el prefijo. Resultado: cada click desde la UI estándar cae en `<Route path="*" element={<NotFoundPage />} />` (línea 252). Enfoque A2 (callsites alignment): insertar `/therapist` entre `/dashboard` y `/odontograma` en 7 strings de path. Cero cambios a rutas registradas, cero cambios a `DashboardRouter`. Una línea más (línea 176 de `OdontogramEvaluationPage.jsx`) también usa el path sin prefijo, pero queda fuera de scope — reservada para spec 001 (paused) que reemplaza `replaceState` por `navigate` como cambio atómico.

## Technical Context

**Language/Version**: JavaScript (JSX), React 18.2.0
**Primary Dependencies**: react-router-dom ^6.16.0 (las rutas en `DashboardRouter.jsx` son nested `<Route>`, los callsites usan `useNavigate` o props `path` en config del Sidebar)
**Storage**: sin cambios. No se toca DB.
**Testing**: Manual QA del dentista en staging (referenciado por spec §"User Story 1/2 — Acceptance Scenarios" + §"Success Criteria"); verificación automática: `grep` post-fix + lint + build.
**Target Platform**: Navegador moderno (Chrome, Firefox, Safari)
**Project Type**: Web SPA (React 18 + Vite 4.4)
**Performance Goals**: O(0) impacto runtime — solo cambian strings de path.
**Constraints**: 7 callsites, 4 archivos. La línea 176 de `OdontogramEvaluationPage.jsx` NO se toca (FR-009, reservada para spec 001). Cero regresiones en módulos hermanos bajo `therapist/`.
**Scale/Scope**: 4 archivos modificados, 7 líneas de código tocadas, cada cambio = inserción de `/therapist` en 1 string.

## Verificación de callsites (requisito 1 del asesor)

Lectura directa de cada línea antes de proponer diffs. Todos los 7 callsites coinciden línea y contenido con la tabla del input del asesor:

| # | Archivo | Línea | Contenido real en ese número de línea | Match? |
|---|---|---|---|---|
| 1 | `src/components/layout/Sidebar.jsx` | 161 | `{ name: 'Odontograma', icon: ClipboardCheck, path: '/dashboard/odontograma' },` | ✅ |
| 2 | `src/pages/therapist/PatientFilePage.jsx` | 363 | `onClick={() => navigate(\`/dashboard/odontograma/nueva?patient=${id}\`)}` | ✅ |
| 3 | `src/features/odontogram/pages/OdontogramListPage.jsx` | 72 | `<Button onClick={() => navigate('/dashboard/odontograma/nueva')} className="bg-pink-500 hover:bg-pink-600">` | ✅ |
| 4 | `src/features/odontogram/pages/OdontogramListPage.jsx` | 150 | `<Button variant="ghost" size="sm" onClick={() => navigate(\`/dashboard/odontograma/${ev.id}\`)}>` | ✅ |
| 5 | `src/features/odontogram/pages/OdontogramListPage.jsx` | 199 | `<Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => navigate(\`/dashboard/odontograma/${ev.id}\`)}>` | ✅ |
| 6 | `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` | 112 | `navigate('/dashboard/odontograma');` (dentro de fallback de error en `loadEvaluation`) | ✅ |
| 7 | `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` | 346 | `<Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/odontograma')}>` (botón Volver del header) | ✅ |

**Verificación global:** `grep -rn "/dashboard/odontograma" src/` devuelve exactamente **8 matches** — los 7 callsites de arriba + la línea 176 reservada (ver §"Confirmación FR-009"). No hay 8º callsite oculto.

**Decisión:** todas las líneas coinciden con lo predicho por la spec. Se procede.

## Confirmación FR-009 — la línea 176 NO se toca (requisito 2 del asesor)

Lectura de `src/features/odontogram/pages/OdontogramEvaluationPage.jsx` líneas 170–180:

```js
170      setEvaluationId(data.id);
171      const patient = patients.find((p) => p.id === setup.patient_id);
172      setPatientInfo({ name: patient?.name, rut: patient?.rut });
173      setStep(2);
174
175      // Update URL without full navigation
176      window.history.replaceState(null, '', `/dashboard/odontograma/${data.id}`);
177    } catch (err) {
178      toast({ variant: 'destructive', title: 'Error', description: err.message });
179    } finally {
180      setSaving(false);
```

**Confirmación textual:** esta línea NO entra en scope de spec 002; permanece con `/dashboard/odontograma/${data.id}` durante y después del fix. Motivo: `replaceState` no dispara re-matching de React Router, por lo que aunque usa path sin prefijo, no produce 404 visible (bug silencioso — tema de spec 001). Cambiar esta línea aquí mezclaría dos fixes conceptualmente distintos y rompería la atomicidad que spec 001 necesita para su cambio combinado "reemplazar replaceState por navigate + path correcto".

**Coherencia con spec 001:** cuando 002 cierre y 001 reanude, la línea 176 cambiará de `window.history.replaceState(null, '', \`/dashboard/odontograma/${data.id}\`)` a `navigate(\`/dashboard/therapist/odontograma/${data.id}\`, { replace: true })` — ese será un cambio atómico del fix de spec 001, con path ya alineado al prefijo corregido por 002.

## Los 7 diffs propuestos (requisito 3 del asesor)

Patrón uniforme: insertar `/therapist` entre `/dashboard` y `/odontograma`. Sin cambios a query strings, template expressions, props ni estructura.

### #1 — `src/components/layout/Sidebar.jsx:161`

```
ANTES:   { name: 'Odontograma', icon: ClipboardCheck, path: '/dashboard/odontograma' },
DESPUÉS: { name: 'Odontograma', icon: ClipboardCheck, path: '/dashboard/therapist/odontograma' },
```

### #2 — `src/pages/therapist/PatientFilePage.jsx:363`

```
ANTES:                         onClick={() => navigate(`/dashboard/odontograma/nueva?patient=${id}`)}
DESPUÉS:                       onClick={() => navigate(`/dashboard/therapist/odontograma/nueva?patient=${id}`)}
```

*Query string `?patient=${id}` preservado idéntico (FR-008 + SC-003).*

### #3 — `src/features/odontogram/pages/OdontogramListPage.jsx:72`

```
ANTES:           <Button onClick={() => navigate('/dashboard/odontograma/nueva')} className="bg-pink-500 hover:bg-pink-600">
DESPUÉS:         <Button onClick={() => navigate('/dashboard/therapist/odontograma/nueva')} className="bg-pink-500 hover:bg-pink-600">
```

### #4 — `src/features/odontogram/pages/OdontogramListPage.jsx:150`

```
ANTES:                           <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/odontograma/${ev.id}`)}>
DESPUÉS:                         <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/therapist/odontograma/${ev.id}`)}>
```

### #5 — `src/features/odontogram/pages/OdontogramListPage.jsx:199`

```
ANTES:                     <Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => navigate(`/dashboard/odontograma/${ev.id}`)}>
DESPUÉS:                   <Button size="sm" className="flex-1 bg-pink-500 hover:bg-pink-600" onClick={() => navigate(`/dashboard/therapist/odontograma/${ev.id}`)}>
```

### #6 — `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:112`

```
ANTES:        navigate('/dashboard/odontograma');
DESPUÉS:      navigate('/dashboard/therapist/odontograma');
```

*Fallback tras fallo de `fetchEvaluationById` — el dentista cae al listado, no a 404.*

### #7 — `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:346`

```
ANTES:          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/odontograma')}>
DESPUÉS:        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/therapist/odontograma')}>
```

*Botón "Volver" del header — el dentista regresa al listado.*

### No tocado — `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:176`

```
SIN CAMBIOS: window.history.replaceState(null, '', `/dashboard/odontograma/${data.id}`);
```

*Reservado para spec 001 (paused). FR-009 lo blinda.*

## Orden de aplicación y paralelismo (requisito 4 del asesor)

Los 7 cambios son independientes: no hay dependencias semánticas entre ellos ni variables compartidas. Cada uno es un reemplazo textual aislado dentro de su archivo.

**Paralelismo recomendado:**

- **Dentro del mismo archivo:** aplicar secuencialmente (para evitar conflictos de `Edit` si el tool lee el archivo una sola vez por invocación):
  - `OdontogramListPage.jsx`: #3 → #4 → #5 (3 cambios en un archivo).
  - `OdontogramEvaluationPage.jsx`: #6 → #7 (2 cambios; #6 en línea 112, #7 en línea 346, sin overlap).
  - `Sidebar.jsx`: solo #1.
  - `PatientFilePage.jsx`: solo #2.
- **Entre archivos:** sin orden particular; los 4 archivos pueden procesarse en paralelo o en cualquier secuencia.

**Observación práctica:** dado el tamaño trivial del cambio (1 línea por callsite), la secuencia natural en `/speckit-implement` será archivo-por-archivo en orden declarado en la tabla, con `Edit replace_all: false` por cada callsite (para evitar falsos matches en `OdontogramListPage.jsx` que tiene 3 ocurrencias del prefijo `/dashboard/odontograma/` con distinto contexto).

Un patrón alternativo — usar `Edit replace_all: true` con el string `/dashboard/odontograma` → `/dashboard/therapist/odontograma` solo en los archivos de odontograma — funciona PERO introduce riesgo residual en `OdontogramEvaluationPage.jsx` porque el archivo tiene también la línea 176 (reservada por FR-009). Si se usa `replace_all` en ese archivo, la línea 176 también se modifica, violando FR-009. **Decisión:** usar `replace_all: false` con contextos suficientes para unicidad por cada cambio individual. Más verboso pero respeta FR-009 automáticamente.

Para `OdontogramListPage.jsx` (archivo sin línea 176) se podría usar `replace_all: true` sobre el string `'/dashboard/odontograma/` → `'/dashboard/therapist/odontograma/`. Pero el patrón es inconsistente: la línea 72 usa comillas simples (`'/dashboard/odontograma/nueva'`), mientras que líneas 150 y 199 usan template literals (`\`/dashboard/odontograma/${ev.id}\``). Una sola búsqueda no captura ambos. **Decisión:** 3 edits individuales o 2 patterns distintos con replace_all=false. Más seguro: individuales.

**Recomendación final:** 7 edits individuales, ordenados archivo por archivo. Tiempo total estimado: <30 segundos en `/speckit-implement`.

## Verificación técnica adicional (requisito 5 del asesor)

Además del test manual referenciado en spec §"User Story 1/2 — Acceptance Scenarios" y §"Success Criteria SC-001..SC-005", el plan añade una verificación automatizada que cubre SC-004:

**Verificación grep post-fix (comando + criterio de éxito):**

```bash
grep -rn "/dashboard/odontograma" src/
```

**Resultado esperado:** exactamente **1 match** — la línea 176 de `OdontogramEvaluationPage.jsx` (`window.history.replaceState`). Todos los demás callsites usan `/dashboard/therapist/odontograma/*`.

**Verificación complementaria:**

```bash
grep -rn "/dashboard/therapist/odontograma" src/
```

**Resultado esperado:** exactamente **10 matches** — los 7 callsites modificados + las 3 rutas registradas en `DashboardRouter.jsx:154-156` (las rutas ya existían con path relativo `odontograma*` bajo `<Route path="therapist">`, pero una búsqueda textual de `/dashboard/therapist/odontograma` solo encontrará los 7 callsites corregidos — las rutas registradas usan concatenación implícita por nesting, no el string literal). **Ajuste:** tras verificación, el número esperado de matches del segundo grep es **7 exactos** (los callsites). Las rutas registradas en `DashboardRouter.jsx` usan `path="odontograma"` relativo bajo `<Route path="therapist">` y no contienen el string literal `/dashboard/therapist/odontograma`.

## Análisis de riesgo y rollback (requisito 6 del asesor)

### Riesgos potenciales

1. **Un 8º callsite no detectado** (p. ej. en código generado, o en un link hardcodeado dentro de un texto de toast / email template).
   - **Mitigación:** el grep global `grep -rn "/dashboard/odontograma" src/` devolvió exactamente 8 matches (7 a cambiar + línea 176). Ningún match en `public/`, `supabase/functions/`, ni `tools/`. El grep post-fix de verificación (SC-004) cerrará este riesgo definitivamente.
   - **Si aparece:** reportar antes de tocar. No expandir scope sin aprobación del asesor (Constitution IV).

2. **Redirect externo en producción** (Vercel, Cloudflare) que mapea `/dashboard/odontograma/*` → `/dashboard/therapist/odontograma/*`.
   - **Mitigación:** el fix es inofensivo en este caso — el redirect ya no sería necesario, pero no rompe nada. Si existe, se descubre en el test manual (las URL finales serán las del prefijo correcto, así que el redirect pasaría de activo a ocioso).
   - **Decisión:** no se investiga Vercel config en este turno. Si el redirect existe, el asesor lo retira en otro bloque post-fix.

3. **Lint del archivo Sidebar.jsx falla** por no ser JSX (es una config con array de objetos).
   - **Mitigación:** es JSX (importa `ClipboardCheck` desde lucide-react como `icon`); eslint lo procesa como archivo normal del proyecto. El cambio es un string literal, no altera estructura de imports ni JSX — no debería generar warnings nuevos.

4. **Test manual revela que `useSearchParams`/`useParams` en el destino no recibe `patient`** (regresión en FR-008 / SC-003).
   - **Mitigación:** el query string `?patient=${id}` solo cambia de path prefix; el parsing de la URL destino es idéntico. Es extremadamente improbable que una simple adición de `/therapist` al path altere el parsing de query params. Test manual cubre directamente este escenario (US1 Acceptance Scenario 3).

5. **Import roto o dependencia circular** por no agregar ni quitar imports.
   - **Mitigación:** el fix NO modifica imports. Los 7 cambios son puros strings literales. Riesgo = 0.

### Rollback

**Comando único en <30 segundos:**

```bash
git checkout -- src/components/layout/Sidebar.jsx \
                src/pages/therapist/PatientFilePage.jsx \
                src/features/odontogram/pages/OdontogramListPage.jsx \
                src/features/odontogram/pages/OdontogramEvaluationPage.jsx
```

Sin migraciones que revertir, sin edge functions que re-deploy, sin schema que restaurar. El build/deploy de Vercel regresa al estado previo con un simple revert commit (o checkout local + push si aún no se commiteó).

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| **I. Compliance-First** | ✅ Indirecto pero necesario — habilita que el módulo Odontograma reciba tráfico real, requisito previo para que el audit log (spec 001) tenga entradas efectivas (derecho ARCO Ley 21.719). |
| **II. RLS-First Security** | ✅ Sin cambios a RLS ni policies. Los `<Route>` ya están protegidos por `RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}` en las líneas 154–156 del router. |
| **III. Append-Only Clinical Audit** | ✅ Sin cambios al logger ni al insert al `clinical_audit_log`. Esta spec solo habilita que el hook se monte. |
| **IV. Micro-Bloques** | ✅ 4 archivos, 7 líneas, 1 patrón repetitivo (`/dashboard/odontograma` → `/dashboard/therapist/odontograma`). Out of Scope enumerado explícitamente, incluyendo FR-009 sobre línea 176. |
| **V. UI Honesty** | ✅ Sin cambios a toasts, sin nuevos mensajes de éxito/error. El fix elimina un 404 falso, no introduce nueva UI. |
| **VI. Schema Drift Zero** | ✅ Las rutas registradas en `DashboardRouter.jsx` son la fuente de verdad y ya estaban correctas. Esta spec **resuelve** drift pre-existente en los callsites; no introduce drift nuevo. |

## Archivos que el plan propone tocar

**4 archivos, 7 líneas:**

```text
src/
├── components/layout/Sidebar.jsx                        # 1 callsite (línea 161)
├── pages/therapist/PatientFilePage.jsx                  # 1 callsite (línea 363)
└── features/odontogram/pages/
    ├── OdontogramListPage.jsx                           # 3 callsites (líneas 72, 150, 199)
    └── OdontogramEvaluationPage.jsx                     # 2 callsites (líneas 112, 346)
                                                        # ⚠ Línea 176 RESERVADA (FR-009)
```

## Scope estricto — archivos que NO se tocan (requisito 7 del asesor)

- `src/app/routers/DashboardRouter.jsx` — rutas registradas, fuente de verdad. Correcto como está.
- `src/features/odontogram/pages/OdontogramEvaluationPage.jsx:176` — reservado para spec 001 (paused).
- `src/lib/audit/*` — logger clínico y hook, sin relación con routing.
- `supabase/migrations/`, `supabase/policies.sql`, `supabase/functions/` — sin cambios de data layer.
- **Otros módulos bajo `<Route path="therapist">`**: `notiz`, `create-template`, `questions`, `pie`, `ados2`, `tea`, `adir`, `sensorial`, `voice-visualizer`, `blog`, `patient-progress`, `educator`, `invitations`, `marketplace`, `voice-visualizer`, `evidence-search` — ya usan su prefijo correctamente.
- Módulos de otros roles: `/dashboard/patient/*`, `/dashboard/clinic/*`, `/dashboard/assistant/*` — ya usan prefijo correcto.
- Los 4 docs fundacionales (`constitution.md`, `architecture.md`, `ecosystem-communicare.md`, `data-compliance.md`) — corrección de docs es micro-bloque futuro.
- `CLAUDE.md` — micro-bloque futuro.
- `specs/001-fix-odontogram-audit-log/*` — paused e intacto.
- `specs/002-fix-odontogram-routing-mismatch/spec.md` y `checklists/requirements.md` — finales.
- `package.json`, `.env*`, `vite.config.js`, `tailwind.config.js`, `index.html`, `components.json`, `eslint.config.mjs` — sin cambios de config.
- `public/`, `tools/`, `docs/`, `dist/` — sin cambios.
- Commits/push — los hace Danissa tras aprobar el test manual (workflow advisor/executor).

## Project Structure

### Documentation (this feature)

```text
specs/002-fix-odontogram-routing-mismatch/
├── spec.md                         # Specification (final)
├── plan.md                         # This file
├── checklists/
│   └── requirements.md             # Quality checklist (final)
└── tasks.md                        # [Pending /speckit-tasks]
```

No se generan `research.md`, `data-model.md`, `quickstart.md` ni `contracts/`:
- **research.md**: el research está inline en este plan (verificación de las 7 líneas + grep global + evidencia de FR-009).
- **data-model.md**: sin cambios de data model.
- **quickstart.md**: cubierto por spec §"User Story 1/2 — Acceptance Scenarios" y §"Success Criteria" + grep de verificación.
- **contracts/**: no aplica.

### Source Code (repository root) — archivos afectados

Ver árbol en §"Archivos que el plan propone tocar".

**Structure Decision**: sin cambios estructurales. El fix toca los 4 archivos que contienen los 7 callsites; no se crea ningún archivo nuevo.

## Complexity Tracking

Sin violaciones a justificar. El plan es el mínimo cambio que resuelve el mismatch sin introducir nueva complejidad ni scope creep.

## Pre-flight checklist para `/speckit-tasks`

Antes de proceder a generación de tasks:

- [ ] Spec 002 aprobada por el asesor (review de 5 líneas completada).
- [ ] Plan 002 aprobado por el asesor (este documento).
- [ ] Confirmación del asesor sobre la estrategia de `replace_all: false` vs `replace_all: true` por archivo.
- [ ] Confirmación del asesor sobre si el test manual lo hace Danissa (esperado, igual que spec 001).

---

**Last updated**: 2026-04-19
**Readiness**: Plan listo para review del asesor. Cero discrepancias con la spec 002. FR-009 confirmado por lectura de líneas 170–180. Listo para `/speckit-tasks` tras aprobación.
