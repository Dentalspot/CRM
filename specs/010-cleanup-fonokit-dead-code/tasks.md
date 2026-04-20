# Tasks: Cleanup FonoKit Dead Code

**Branch**: `010-cleanup-fonokit-dead-code` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Date**: 2026-04-20

Tasks ejecutables del ciclo, agrupadas por Phase del plan. **Stop Points (SP-*) son gates, no tasks** — requieren 🟢 GO explícito de Danissa antes de continuar al siguiente grupo. Tiempo total estimado: **35–45 min** (budget del plan).

Leyenda de columnas:

- **ID**: identificador único.
- **Phase**: Phase del plan (P1 / P2 / P3 / FINAL).
- **Task**: acción concreta.
- **File:Line**: ubicación exacta donde aplica; `—` para comandos shell puros.
- **Dependencies**: tasks que deben completarse antes (o `GATE SP-N` si requiere STOP POINT previo).
- **Reference**: patrón canónico, FR del spec, riesgo mitigado.
- **Est. min**: estimación de tiempo (acumulable contra budget 35-45).

---

## Phase 1 — Audit Defensivo

**Prerequisito**: plan aprobado por Danissa ✅ (commit `5cb85b7`).

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P1-GREP-A` | P1 | Ejecutar **Grep A** (callsites voice-visualizer) desde repo root: `grep -rn "voice-visualizer\|VoiceVisualizerPage\|VOICE_VISUALIZER" src/ --exclude-dir=voice-visualizer`. Capturar output literal + validar que solo aparecen los callsites esperados del spec (VoiceVisualizerPage.jsx, DashboardRouter.jsx bloque + import, featureFlags.js entry) | `bash` desde `~/Documents/DENTALSPOT` | — | plan.md §Phase 1 P1.1 · FR-001(a) · Risk R-01 | 2 |
| `TASK-P1-GREP-B` | P1 | Ejecutar **Grep B** (imports src/app/ huérfanos): `grep -rn "from.*app/App\|from.*app/providers\|from ['\"]@/app['\"]" src/` + doble check `grep -rn "src/app/App\|src/app/providers" src/`. Validar que **solo** aparece el import interno `App.jsx → providers`. Stop si aparece `main.jsx` o cualquier external import | `bash` desde `~/Documents/DENTALSPOT` | — | plan.md §Phase 1 P1.2 · FR-001(b) · Risk R-02 | 2 |
| `TASK-P1-MAINJSX` | P1 | Verificar que `main.jsx` en raíz importa `./App` (raíz) NO `./app/App`: `grep -n "App" src/main.jsx`. Si importa `./app/App` → SP-1 STOP (premisa del spec invalidada) | `src/main.jsx` (read-only) | — | plan.md §Phase 1 P1.3 · SP-1 T3 | 1 |
| `TASK-P1-LINT-BASELINE` | P1 | Capturar baseline de lint pre-edits para comparar post-Phase 2: `ulimit -n 10240 && npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 \| tee /tmp/lint-pre-010.log` + contar warnings/errors. Mitigación R-03 (evitar que warnings nuevos queden ocultos en el ruido) | `/tmp/lint-pre-010.log` (create) | — | plan.md §Phase 1 P1.4 · Risk R-03 | 3 |
| `TASK-P1-REPORT` | P1 | Generar Phase 1 Report para Danissa con T1–T4 checks + recomendación 🟢 GO / 🔴 STOP. Incluir output resumido de Grep A/B + conteo lint baseline | conversación | `TASK-P1-GREP-A`, `TASK-P1-GREP-B`, `TASK-P1-MAINJSX`, `TASK-P1-LINT-BASELINE` | plan.md §Phase 1 P1.5 · FR-003 | 2 |

**Tiempo Phase 1**: 10 min (budget plan).

---

### 🚧 GATE SP-1 — STOP POINT (hard block)

**Criterio**: Phase 1 Report entregado con checks T1–T4 evaluados. **Requiere 🟢 GO explícito de Danissa**.

- **T1** (Grep A solo retorna callsites esperados) — si falla: STOP R-01, reportar callsite no documentado.
- **T2** (Grep B solo retorna el import interno `App.jsx → providers`) — si falla: STOP R-02, reportar import externo.
- **T3** (`main.jsx` usa `./App` raíz) — si falla: STOP, premisa del spec invalidada.
- **T4** (lint baseline capturado con conteo) — captura, no scope check.

**Sin 🟢 GO, no se ejecuta ninguna task de Phase 2.**

---

## Phase 2 — Deletion + Edits

**Prerequisito**: GATE SP-1 superado. Las 7 tasks ejecutan deletes/edits en orden; P2-VERIFY valida al final.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P2-RM-FEATURE` | P2 | **Delete recursivo** del directorio completo de voice-visualizer (5 archivos según architecture.md): `rm -r src/features/voice-visualizer/` | `src/features/voice-visualizer/` (delete recursive) | `GATE SP-1` | plan.md §Phase 2 P2.1 · FR-004 | 1 |
| `TASK-P2-RM-PAGE` | P2 | **Delete** archivo de página standalone: `rm src/pages/VoiceVisualizerPage.jsx` | `src/pages/VoiceVisualizerPage.jsx` (delete) | `TASK-P2-RM-FEATURE` | plan.md §Phase 2 P2.1 · FR-004 | 1 |
| `TASK-P2-RM-APP` | P2 | **Delete** archivo huérfano App: `rm src/app/App.jsx` | `src/app/App.jsx` (delete) | `TASK-P2-RM-PAGE` | plan.md §Phase 2 P2.1 · FR-004 | 1 |
| `TASK-P2-RM-PROVIDERS` | P2 | **Delete** archivo huérfano providers (31 líneas): `rm src/app/providers.jsx`. Verificar que `src/app/` queda solo con `routers/` (y otros directorios vivos, ningún `.jsx` nivel-1) | `src/app/providers.jsx` (delete) | `TASK-P2-RM-APP` | plan.md §Phase 2 P2.1 · FR-004 | 1 |
| `TASK-P2-EDIT-ROUTER` | P2 | **Edit** `DashboardRouter.jsx`: (a) localizar bloque alrededor de línea **~192** envuelto en `{FEATURE_FLAGS.VOICE_VISUALIZER && ...}` y eliminar completo (incluye `<Route ...>` con `<VoiceVisualizerPage />`); (b) localizar `import VoiceVisualizerPage from '...'` cerca del top y eliminarlo. NO tocar otros bloques condicionales (otros FEATURE_FLAGS) | `src/app/routers/DashboardRouter.jsx:~192 (bloque) + top-of-file (import)` | `TASK-P2-RM-PAGE` (el archivo importado debe estar eliminado ya para que el import residual sea obvio) | plan.md §Phase 2 P2.1 Edit 1 · FR-004 | 3 |
| `TASK-P2-EDIT-FLAGS` | P2 | **Edit** `featureFlags.js`: localizar entrada `VOICE_VISUALIZER: false` + comentario adyacente específico (ej. `// módulo heredado FonoKit`) y eliminar. Preservar resto de entradas (PIE_ESCOLAR, ADOS2, ADIR, TEA, SENSORIAL_PROFILE, EDUCATOR). Limpiar coma colgante si queda | `src/constants/featureFlags.js:VOICE_VISUALIZER entry` | `TASK-P2-RM-FEATURE` | plan.md §Phase 2 P2.1 Edit 2 · FR-004 · FR-005 (NO tocar otros flags) | 2 |
| `TASK-P2-VERIFY` | P2 | Verificación inmediata post-edits: (a) 3 `ls` confirmando que los 4 paths eliminados NO existen (`src/features/voice-visualizer/`, `src/pages/VoiceVisualizerPage.jsx`, `src/app/App.jsx`, `src/app/providers.jsx`), (b) `grep -n "VOICE_VISUALIZER\|VoiceVisualizerPage" src/app/routers/DashboardRouter.jsx` → 0 matches, (c) `grep -n "VOICE_VISUALIZER" src/constants/featureFlags.js` → 0 matches, (d) grep global `grep -rn "voice-visualizer\|VoiceVisualizerPage\|VOICE_VISUALIZER" src/` → 0 matches | `bash` | `TASK-P2-RM-PROVIDERS`, `TASK-P2-EDIT-ROUTER`, `TASK-P2-EDIT-FLAGS` | plan.md §Phase 2 P2.2 · SP-2 T5/T6/T7 | 1 |

**Tiempo Phase 2**: 10 min (budget plan).

---

### 🚧 GATE SP-2 — STOP POINT (post-edits, pre-Phase 3)

**Criterio**: P2-VERIFY devuelve 3 `ls` fail + 3 greps con 0 matches. Sin los 3 checks PASS, no se avanza a Phase 3.

- **T5** (4 archivos eliminados no existen) — si falla: restaurar con `git checkout -- <path>` + diagnosticar.
- **T6** (edits sin residuos en DashboardRouter + featureFlags) — si falla: editar de nuevo hasta 0 matches.
- **T7** (grep global 0 matches) — si falla: investigar, pueden ser comentarios huérfanos en archivo no listado → SP-2 stop, consultar.

---

## Phase 3 — Verificación

**Prerequisito**: GATE SP-2 PASS.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-P3-LINT` | P3 | Lint post-edits + comparación vs baseline: `ulimit -n 10240 && npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 \| tee /tmp/lint-post-010.log`. Validar `warnings_post ≤ warnings_pre` y `errors_post ≤ errors_pre` (R-03 mitigation). Si aumentan → SP-3 abort trigger | `/tmp/lint-post-010.log` (create) + comparar con `/tmp/lint-pre-010.log` | `GATE SP-2` · `TASK-P1-LINT-BASELINE` (necesita pre-baseline) | plan.md §Phase 3 P3.1 · SP-3 T8 · Risk R-03 | 3 |
| `TASK-P3-BUILD` | P3 | Build producción: `ulimit -n 10240 && npm run build 2>&1 \| tail -60`. Validar: (a) exit 0, (b) mensaje `✓ built in <N>s`, (c) ausencia de `Could not resolve` / `Module not found` relacionado a los archivos eliminados, (d) `dist/assets/index-*.js` size ≤ pre-cleanup (SC-002) | `npm run build` + inspección `dist/` | `TASK-P3-LINT` (no buildear si lint falla) | plan.md §Phase 3 P3.2 · SP-3 T9/T10 · SC-002 | 5 |
| `TASK-P3-SMOKE` | P3 | **OPCIONAL** — Smoke manual con dev server: `npm run dev` en background + cargar `http://localhost:3000/dashboard/therapist` en browser + DevTools Console abierta → 0 errores nuevos. Se puede saltar si lint + build ya pasaron clean (el feature flag estaba en `false` → runtime ya era equivalente al post-delete) | browser manual | `TASK-P3-BUILD` | plan.md §Phase 3 P3.3 · SP-3 T11 · SC-007 | 5 |

**Tiempo Phase 3**: 10–15 min (budget plan).

---

### 🚧 GATE SP-3 — STOP POINT (fin Phase 3)

**Criterio**: lint + build PASS sin regresiones nuevas. Sin GO, rollback.

- **T8** (lint exit 0, no warnings/errors nuevos vs baseline) — si falla: `git revert <commit Phase 2 si ya hecho>`, investigar.
- **T9** (build exit 0, 0 broken imports) — igual que T8.
- **T10** (`dist/` size ≤ pre-cleanup) — warning solamente (SC-002 es no-regression). Documentar si size sube.
- **T11** (smoke dashboard sin errors) — opcional, si ejecutado y falla → revert.

**Decisión post-SP-3**:
- **Close**: T8 + T9 PASS (T10/T11 OK o skipped) → avanzar a `TASK-FINAL`.
- **Rollback**: T8 o T9 FAIL → ejecutar protocolo del spec §Rollback Plan (`git revert`).

---

## Final — Commit + Documentación post-spec

**Prerequisito**: GATE SP-3 PASS.

| ID | Phase | Task | File:Line | Dependencies | Reference | Est. min |
|---|---|---|---|---|---|---|
| `TASK-FINAL-COMMIT` | FINAL | Commit Phase 2 cambios con mensaje estándar. Stage: `git add -A` (incluye 4 deletes + 2 edits). Commit message tipo `chore: cleanup FonoKit dead code — voice-visualizer + src/app/ orphans (spec 010)` con desglose de deletes+edits + confirmación de Phase 1 audit OK + Phase 3 lint/build PASS | `git commit` (6 files: 4 delete + 2 edit) | `GATE SP-3` | plan.md §Phase 3 P3.5 | 2 |
| `TASK-FINAL-ARCHITECTURE` | FINAL | Actualizar `.specify/memory/architecture.md`: (a) en §"Dead code confirmed (mini-audit 2026-04-19/20)" líneas `:156` y `:157`, **NO modificar las filas originales** — agregar nueva columna "Status" con `✅ Resuelto spec 010 commit <hash del TASK-FINAL-COMMIT>`. (b) en §"Feature flags inventory" línea `:178` (entrada `VOICE_VISUALIZER`), marcar `✅ Resuelto spec 010`. Preserva registro histórico del audit original | `.specify/memory/architecture.md:152-157, 178` | `TASK-FINAL-COMMIT` (necesita hash) | plan.md §References · Constitution §IV documentation pattern | 3 |

**Plantilla para la columna nueva en `§Dead code confirmed`**:

```markdown
| Archivo / bloque | Estado | Acción | Status |
|---|---|---|---|
| `src/app/providers.jsx` + `src/app/App.jsx` | 🟠 Dead code efectivo — ... | `rm` ambos — spec `cleanup-fonokit-dead-code` | ✅ Resuelto spec 010 commit `<hash>` |
| `src/features/voice-visualizer/` + `VoiceVisualizerPage.jsx` + ruta | 🟠 Dead code efectivo — ... | `rm` feature + page + ruta + flag — spec `cleanup-fonokit-dead-code` | ✅ Resuelto spec 010 commit `<hash>` |
```

**Para la línea `:178` de `§Feature flags inventory`**:

```markdown
| `VOICE_VISUALIZER` | false | 0 (eliminado) | ✅ Resuelto spec 010 commit `<hash>` — feature + flag eliminados del repo |
```

---

## Resumen ejecutivo de tasks

| Phase | # tasks | Tiempo | Gate posterior |
|---|---|---|---|
| Phase 1 (audit defensivo) | 5 | 10 min | **SP-1** (hard block, Danissa 🟢 GO requerido) |
| Phase 2 (deletion + edits) | 7 | 10 min | **SP-2** (post-edits pre-verify) |
| Phase 3 (verification) | 3 | 10–15 min | **SP-3** (close/rollback) |
| Final | 2 | 5 min | — |
| **Total ejecutable** | **17 tasks** | **35–40 min** | 3 gates explícitos (SP-1, SP-2, SP-3) + SP-0 implícito |

Buffer de 5 min del plan cubre desvíos menores (si R-01/R-02 se disparan en P1-GREP). Si total real > **60 min** → STOP implícito y consultar.

---

## Referencias cruzadas

- `plan.md` — 2 greps exactos, secuencia delete+edit, 4 stop points, 3 riesgos con mitigaciones.
- `spec.md` — FR-001..FR-008, Scope Bounds (archivos autorizados / no autorizados), Rollback Plan (3 abort triggers + non-rollback triggers).
- `.specify/memory/constitution.md §IV` (Micro-Bloques) — fundamento del scope tight.
- `docs/PATTERNS.md §4` (audit defensivo Phase 1) — obliga a grep antes de delete.
- `.specify/memory/architecture.md §Dead code confirmed (mini-audit 2026-04-19/20)` — origen del hallazgo, target de `TASK-FINAL-ARCHITECTURE`.
- `.specify/memory/architecture.md §Feature flags inventory (2026-04-20)` — línea 178 de VOICE_VISUALIZER, target de `TASK-FINAL-ARCHITECTURE`.
