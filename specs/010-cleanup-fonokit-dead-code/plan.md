# Implementation Plan: Cleanup FonoKit Dead Code

**Branch**: `010-cleanup-fonokit-dead-code` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-cleanup-fonokit-dead-code/spec.md`

## Summary

Delete quirúrgico de 2 items confirmados como dead code (voice-visualizer feature + 2 archivos huérfanos `src/app/App.jsx`+`providers.jsx`). Phase 1 audit defensivo con 2 greps específicos valida que no hay callsites ocultos. Phase 2 ejecuta 4 deletes + 2 edits exactos. Phase 3 verifica con `npm run lint` + `npm run build` + smoke opcional. Tiempo total estimado: **30–45 min** (Phase 1: 10 · Phase 2: 10 · Phase 3: 10–15 · commit: 5). Sin cambios de runtime — feature flag estaba en `false` → ningún usuario ve diferencia.

## Technical Context

**Language/Version**: JavaScript (ES2022+), React 18 SPA con Vite.
**Primary Dependencies**: sin dependencies nuevas. Phase 3 usa las scripts existentes `npm run lint` (ESLint 8 flat config) + `npm run build` (Vite).
**Storage**: N/A. Este spec no toca DB.
**Testing**: Phase 3 usa lint + build como checks objetivos. Smoke manual opcional (dev server).
**Target Platform**: desarrollo local + build de producción (Vercel). No toca production DB.
**Project Type**: housekeeping / cleanup del codebase. No introduce features.
**Performance Goals**: no-regression de bundle size (SC-002 en spec).
**Constraints**:
- **FR-004**: lista exhaustiva de 7 targets (4 deletes + 2 edits); no se elimina nada fuera de la lista.
- **FR-005**: NO tocar otros feature flags, `src/features/fonoaudiologo/`, `src/types/database.ts`, `supabase/**`, docs/memoria.
- **FR-003**: stop & report si Phase 1 revela callsite no documentado.
**Scale/Scope**: ~5-10 archivos afectados (inclusivo). Minúsculo comparado con specs de features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Estado | Nota |
|---|---|---|---|
| **I. Compliance-First** | No | ✅ N/A | No toca datos personales ni PHI. |
| **II. RLS-First Security** | No | ✅ N/A | No toca RLS ni policies. |
| **III. Append-Only Audit** | No | ✅ N/A | No toca audit logger ni tablas clínicas. |
| **IV. Micro-Bloques (un PR = un cleanup)** | Sí | ✅ PASS | Este spec es literalmente 1 cleanup coherente. Scope bounds de FR-004/005 lo formalizan. |
| **V. UI Honesty** | No | ✅ N/A | No toca UI ni mutaciones. |
| **VI. Schema Drift Zero** | No | ✅ N/A | No toca schema DB ni types. |

**Resultado**: sin violaciones. Phase 1 no cambia nada del gate.

## Project Structure

### Documentation (this feature)

```text
specs/010-cleanup-fonokit-dead-code/
├── spec.md                    # /speckit-specify (commit 5f06eb0)
├── plan.md                    # este archivo
├── checklists/
│   └── requirements.md        # /speckit-specify (12/12 pass)
└── tasks.md                   # /speckit-tasks (próxima fase)
```

### Source Code (repository root)

Archivos autorizados:

```text
# DELETE (4)
src/features/voice-visualizer/          # directorio completo recursivo
src/pages/VoiceVisualizerPage.jsx
src/app/App.jsx
src/app/providers.jsx

# EDIT (2)
src/app/routers/DashboardRouter.jsx     # remover bloque FEATURE_FLAGS.VOICE_VISUALIZER + import
src/constants/featureFlags.js           # remover entrada VOICE_VISUALIZER
```

**Archivos NO autorizados** (fuera de los 6 listados): cualquier otra modificación en `src/` dispara FR-005. Si Phase 1 revela que un archivo no-listado consume el código a eliminar, SP-1 hard stop.

**Structure Decision**: cleanup quirúrgico con scope explícito. El plan replica el patrón de audit defensivo de spec 007 pero sin las SPs intermedias de DB (aplica más rápido porque no hay producción tocada).

---

## Phase 0 — Risk Register

### R-01. Callsite oculto en código generado (`src/types/database.ts` o similar)

**Síntoma potencial**: el generated `src/types/database.ts` podría contener referencias a una tabla o enum específico de `voice-visualizer` (improbable porque el feature es cliente-only sin tablas propias, pero no imposible si se usó RLS/policies para grabar sesiones de voz).

**Mitigación**: Phase 1 Grep A sobre **todo `src/`** incluyendo `types/`. Si aparece match en `database.ts`, se documenta como hallazgo (Supabase generó types para una tabla que efectivamente existe en DB) y se decide con Danissa si:
- (a) La tabla existe en DB pero ya no se usa → fuera de scope del spec 010, queda como candidate para spec de DB cleanup.
- (b) Es false-positive (ej. string "voice" aparece en otro contexto) → ignorar y proceder.

### R-02. Import transitivo vía index.js re-export

**Síntoma potencial**: si existe un `src/features/voice-visualizer/index.js` que re-exporta cosas del feature, o si `src/app/index.js` existe y re-exporta `App.jsx`/`providers.jsx`, un archivo lejano podría importar vía ese index sin mencionar el path específico. Grep por `voice-visualizer` lo captura, pero grep por `App.jsx` específico podría fallar si alguien importa `from '@/app'` (resolviendo a index implícito).

**Mitigación**: Phase 1 Grep B amplía patrones: `from.*app/App`, `from.*app/providers`, `from ['"]@/app['"]`, `from.*src/app`. Si Grep B no retorna más que el import interno esperado de `App.jsx → providers.jsx`, el riesgo se descarta. Si aparece `from '@/app'` sin path → investigar qué resuelve (probablemente `src/app/index.js` si existe; si no, error de path).

### R-03. Lint warnings pre-existentes ocultan warnings nuevos introducidos

**Síntoma potencial**: `npm run lint` hoy emite warnings (ej. `exhaustive-deps`, `no-unused-vars`). Si Phase 2 introduce un warning nuevo (ej. import huérfano no removido), puede quedar perdido en el ruido de warnings pre-existentes — y pasar SP-3 falsamente.

**Mitigación**: Phase 3 compara **conteo** de warnings pre vs post. Captura `npm run lint 2>&1 | tee /tmp/lint-pre-010.log` antes de Phase 2 (en la branch desde main), y `tee /tmp/lint-post-010.log` después. Si `warning_count_post > warning_count_pre` → SP-3 abort trigger (investigar + rollback si no resoluble en <10 min).

---

## Phase 1 — Audit Defensivo (~10 min, STOP POINT SP-1)

**Objetivo**: confirmar empíricamente que los únicos callsites del código a eliminar son los listados en el spec. Sin este audit, Phase 2 puede romper imports ocultos.

### P1.1 — Grep A: voice-visualizer callsites

Desde `~/Documents/DENTALSPOT`:

```bash
# Captura TODOS los callsites del feature, excluyendo el propio directorio
# para evitar matches triviales del propio código que vamos a eliminar.
grep -rn "voice-visualizer\|VoiceVisualizerPage\|VOICE_VISUALIZER" src/ \
  --exclude-dir=voice-visualizer
```

**Output esperado** (hipótesis del spec, a confirmar):

```text
src/pages/VoiceVisualizerPage.jsx:<top>          export default ... (el archivo page)
src/app/routers/DashboardRouter.jsx:~192         FEATURE_FLAGS.VOICE_VISUALIZER && ...
src/app/routers/DashboardRouter.jsx:<import>     import VoiceVisualizerPage from ...  (posible)
src/constants/featureFlags.js:<line>             VOICE_VISUALIZER: false
```

**Scope checks**:
- Si solo aparecen los 3-4 matches esperados → **T1 PASS**.
- Si aparece un callsite adicional (ej. otro router, un componente que renderiza condicional via el flag, una comentario en `docs/`) → **SP-1 STOP trigger R-01/R-02**, reportar y decidir.

### P1.2 — Grep B: `src/app/` huérfanos

Desde `~/Documents/DENTALSPOT`:

```bash
# Captura imports hacia los archivos del app/ que se van a eliminar.
grep -rn "from.*app/App\|from.*app/providers\|from ['\"]@/app['\"]" src/

# Doble check: buscar cualquier path que contenga src/app/App o src/app/providers
grep -rn "src/app/App\|src/app/providers" src/
```

**Output esperado**:

```text
src/app/App.jsx:<import>          import ... from './providers'    (← único import esperado, interno del par a borrar)
```

**Scope checks**:
- Si **solo** aparece el import interno (`App.jsx → providers`), y `main.jsx` NO aparece → **T2 PASS**.
- Si aparece `main.jsx` importando `src/app/App.jsx` → **SP-1 STOP**: los archivos no son huérfanos, son los activos. Retirar spec (contradice la premisa).
- Si aparece otro archivo importando `@/app` o `src/app/App` o `src/app/providers` → **SP-1 STOP trigger R-02**, reportar.

### P1.3 — Verificación sidecar: `main.jsx` usa `src/App.jsx`

```bash
grep -n "App" src/main.jsx
```

**Output esperado**:

```text
src/main.jsx:<line>    import App from './App'          (resuelve a src/App.jsx — el raíz, vivo)
```

Si `main.jsx` importa desde `./app/App` o `@/app/App` → **SP-1 STOP** (los huérfanos no son huérfanos).

### P1.4 — Baseline de lint warnings (R-03 mitigation)

```bash
cd ~/Documents/DENTALSPOT
ulimit -n 10240
npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 | tee /tmp/lint-pre-010.log
# Contar warnings y errores
grep -cE "warning|error" /tmp/lint-pre-010.log > /tmp/lint-pre-010-count.txt
```

**Nota**: lint de proyecto completo con `npm run lint` puede fallar con EMFILE por `.claude/worktrees/` (issue conocido de spec 007). Workaround: lint directo sobre `src/**/*.{js,jsx}`. Capturar el conteo pre para comparar post-Phase 2.

### P1.5 — **STOP POINT SP-1**

| Check | Criterio | Acción si falla |
|---|---|---|
| **T1** | Grep A retorna solo los callsites esperados del spec | STOP R-01: reportar callsite no documentado |
| **T2** | Grep B retorna **solo** el import interno `App.jsx → providers` | STOP R-02: reportar import externo |
| **T3** | `main.jsx` usa `./App` (raíz) NO `./app/App` | STOP: premisa del spec invalidada |
| **T4** | Lint baseline capturado con conteo | — (solo captura, no scope check) |

**Reporte a Danissa (bloquea Phase 2 sin 🟢 GO)**:

```markdown
## Phase 1 Report — spec 010

- Grep A output: [N matches, lista resumida]
- Grep B output: [M matches, todos esperados / hallazgos]
- main.jsx check: import desde [./App | ./app/App]
- Lint baseline: N warnings / M errors pre-fix
- Scope check: T1 ✅ · T2 ✅ · T3 ✅ · T4 ✅
- Recomendación: proceder a Phase 2 / abort

🟢 GO / 🔴 STOP
```

**Sin 🟢 GO, no se ejecuta ninguna task de Phase 2.**

---

## Phase 2 — Deletion + Edits (~10 min, STOP POINT SP-2)

**Prerequisito**: SP-1 🟢 GO.

### P2.1 Secuencia exacta de operaciones

**4 DELETES** (en orden):

```bash
rm -r src/features/voice-visualizer/          # directorio recursivo
rm src/pages/VoiceVisualizerPage.jsx
rm src/app/App.jsx
rm src/app/providers.jsx
```

Después del 4to `rm`, verificar que `src/app/` queda con solo `routers/` (y potencialmente otros subdirectorios vivos, ningún archivo `.jsx` en el nivel `src/app/`).

**2 EDITS**:

**Edit 1 — `src/app/routers/DashboardRouter.jsx`**:
- Localizar el bloque alrededor de línea ~192 envuelto en `{FEATURE_FLAGS.VOICE_VISUALIZER && ...}`.
- Eliminar el bloque completo (desde la apertura `{FEATURE_FLAGS.VOICE_VISUALIZER &&` hasta el cierre `}`, incluyendo la línea donde se renderiza `<Route path="..." element={<VoiceVisualizerPage />} />` o similar).
- Localizar el `import VoiceVisualizerPage from '...'` (probablemente cerca del top del archivo) y eliminarlo.
- No tocar otros bloques condicionales (otros FEATURE_FLAGS).

**Edit 2 — `src/constants/featureFlags.js`**:
- Localizar la entrada `VOICE_VISUALIZER: false` (con o sin comentario adyacente).
- Eliminar la entrada completa, incluyendo el comentario adyacente específico al voice-visualizer si existe (ej. `// módulo heredado FonoKit`).
- Preservar el resto de las entradas del objeto (`PIE_ESCOLAR`, `ADOS2`, etc.) tal como están.
- Si la entrada estaba al final y su eliminación deja una coma colgante, limpiarla.

### P2.2 Verificación inmediata post-edits

```bash
# Confirmar que los 4 archivos ya no existen
ls src/features/voice-visualizer/ 2>&1            # esperar "No such file or directory"
ls src/pages/VoiceVisualizerPage.jsx 2>&1         # esperar "No such file or directory"
ls src/app/App.jsx src/app/providers.jsx 2>&1     # esperar 2x "No such file or directory"

# Confirmar que los 2 edits eliminaron las referencias
grep -n "VOICE_VISUALIZER\|VoiceVisualizerPage" src/app/routers/DashboardRouter.jsx    # esperar 0 matches
grep -n "VOICE_VISUALIZER" src/constants/featureFlags.js                                # esperar 0 matches

# Grep global: 0 residuos
grep -rn "voice-visualizer\|VoiceVisualizerPage\|VOICE_VISUALIZER" src/                # esperar 0 matches
```

### P2.3 **STOP POINT SP-2**

| Check | Criterio | Acción si falla |
|---|---|---|
| **T5** | Los 4 archivos eliminados no existen | Restaurar con `git checkout -- <path>` si aplica; diagnosticar y re-intentar. |
| **T6** | `DashboardRouter.jsx` y `featureFlags.js` editados — 0 matches residuales | Editar de nuevo hasta 0 matches. |
| **T7** | Grep global no retorna matches de voice-visualizer/VOICE_VISUALIZER en `src/` | Si quedan matches → investigar, pueden ser comentarios huérfanos. |

**Sin los 3 checks PASS, no se avanza a Phase 3.**

---

## Phase 3 — Verificación (~10–15 min, STOP POINT SP-3)

**Prerequisito**: SP-2 PASS.

### P3.1 Lint

```bash
cd ~/Documents/DENTALSPOT
ulimit -n 10240
npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 | tee /tmp/lint-post-010.log

# Comparar con baseline pre (P1.4)
echo "Pre:"  && wc -l /tmp/lint-pre-010.log
echo "Post:" && wc -l /tmp/lint-post-010.log
```

**Criterio**:
- Exit code 0 (o 1 solo si son warnings, no errores).
- `warning_count_post <= warning_count_pre` (R-03 mitigation).
- `error_count_post <= error_count_pre` (errores pre-existentes no aumentan).

### P3.2 Build

```bash
cd ~/Documents/DENTALSPOT
ulimit -n 10240
npm run build 2>&1 | tail -60
```

**Criterio**:
- Exit code 0.
- Mensaje `✓ built in <N>s` en el output.
- No hay mensajes tipo `Could not resolve "./pages/VoiceVisualizerPage"` ni `Module not found`.
- Tamaño de `dist/assets/index-*.js` ≤ tamaño pre-cleanup (SC-002).

### P3.3 Smoke manual (opcional, ~5 min)

```bash
npm run dev
# En browser: cargar http://localhost:3000/dashboard/therapist
# DevTools Console: 0 errores nuevos atribuibles al delete
```

Danissa puede saltar este paso si lint + build pasan clean (el runtime del feature flag en `false` significaba que la ruta nunca se rendereaba — delete = equivalente a flag `false` permanente).

### P3.4 **STOP POINT SP-3**

| Check | Criterio | Acción si falla |
|---|---|---|
| **T8** | `npm run lint` exit 0, no warnings nuevos | `git revert <commit Phase 2>`, investigar, re-ejecutar |
| **T9** | `npm run build` exit 0, 0 broken imports | Igual que T8 |
| **T10** | `dist/` size ≤ pre-cleanup | Warning, no blocker (SC-002 es no-regression) |
| **T11** | (opcional) smoke dashboard sin errors | Si ejecutado y falla → revert |

### P3.5 Commit Phase 2

Si SP-3 PASS, commit con mensaje estándar:

```
chore: cleanup FonoKit dead code — voice-visualizer + src/app/ orphans (spec 010)

- Delete src/features/voice-visualizer/ (5 files)
- Delete src/pages/VoiceVisualizerPage.jsx
- Delete src/app/App.jsx + src/app/providers.jsx (orphans, main.jsx uses src/App.jsx)
- Edit src/app/routers/DashboardRouter.jsx: remove FEATURE_FLAGS.VOICE_VISUALIZER block + import
- Edit src/constants/featureFlags.js: remove VOICE_VISUALIZER entry

Phase 1 audit confirmó 0 callsites fuera de los listados.
Phase 3 lint + build PASS sin regresiones nuevas.
```

---

## Stop Points resumen

| # | Ubicación | Criterio | Acción |
|---|---|---|---|
| **SP-0** | Inicio de Phase 1 | Plan aprobado por Danissa | Ejecutar Grep A + B + baseline lint |
| **SP-1** | Fin de Phase 1 | Phase 1 Report con 🟢 GO | Solo entonces → Phase 2 |
| **SP-2** | Post-edits, pre-Phase 3 | 4 archivos eliminados + 2 editados sin residuos | Solo entonces → Phase 3 lint+build |
| **SP-3** | Fin de Phase 3 | lint + build PASS, sin warnings nuevos | Solo entonces → commit |

---

## Time Budget

| Phase | Tiempo estimado | Contenido |
|---|---|---|
| Phase 1 — Audit defensivo | **10 min** | Grep A + Grep B + main.jsx check + baseline lint + SP-1 report |
| Phase 2 — Delete + edits | **10 min** | 4 rm + 2 edits + verificación inmediata + SP-2 |
| Phase 3 — Verify | **10–15 min** | Lint + build + (opcional) smoke + SP-3 + commit |
| Buffer | **5 min** | R-01/R-02 si se disparan |
| **Total** | **35–45 min** | Cumple bound del spec (30-45 min) |

Si el total real supera **60 min**: STOP implícito, revisar con Danissa — algo del scope está fuera de lo estimado.

---

## References

- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento del scope bound.
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) — obliga a Grep A + B antes de delete.
- `.specify/memory/architecture.md §Dead code confirmed (mini-audit 2026-04-19/20)` — origen del hallazgo.
- `.specify/memory/architecture.md §Feature flags inventory (2026-04-20)` — contexto de los 7 flags, confirma que VOICE_VISUALIZER es dead.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | Sin violaciones. Scope bound de 7 targets + 3 SPs + 3 riesgos, proporcional al tamaño del cleanup. |
