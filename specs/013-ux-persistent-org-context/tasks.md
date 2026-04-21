# Tasks: Persistent Organization Context

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md)
**Feature branch**: `013-ux-persistent-org-context`
**Prerequisites**: plan.md (4 decisions default: A3 / B3 / C1 / D2) · constitution.md §V/IV/XIII · PATTERNS.md §4

**Format**: `[ID] [Phase] [Task] [File:Line] [Deps] [Reference] [Est min]`

---

## Gate summary

| Gate | Trigger | Checks | Block until |
|---|---|---|---|
| **SP-0** | Pre-Phase 1 | tasks.md aprobado 6/6 | 🟢 GO de Danissa en thread |
| **SP-1** | Fin Phase 1 | T1 context read · T2 consumers ≤30 · T3 3/3 baseline reproduce · T4 fits ≤2 archivos | 🟢 GO explícito |
| **SP-2** | Fin Phase 2 | T5 4 decisiones documentadas · T6 archivos ≤2 · T7 expected behavior post-fix escrito | 🟢 GO explícito (hard block) |
| **SP-3** | Fin Phase 3 | T8 git diff ≤2 files · T9 lint errors_post ≤ baseline · T10 build exit 0 | 🟢 GO para test manual |
| **SP-4** | Fin Phase 4 | T11 P1 PASS · T12 P2 PASS · T13 P3 PASS · T14 multi-tab coincide con Decisión A · T15 modo privado no-crash · T16 rutas públicas sin regresión | Decisión close / rollback / follow-up |

---

## Phase 1 — Audit Defensivo (20 min, pre-SP-1)

| ID | Phase | Task | File:Line | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| ~~TASK-P1-READ-CONTEXT~~ ✅ | Phase 1 | Leer `OrganizationContext.jsx` completo. Capturar en `data-model.md §Current state`: state shape, APIs expuestas, storage actual (sí/no + key si existe), timing de init (useState inicial vs useEffect), dependencies del useEffect de roles. Si el path no existe con ese nombre, grep para localizar. | `src/contexts/OrganizationContext.jsx` | — | plan.md §P1.1 · architecture.md §Providers | 5 |
| ~~TASK-P1-GREP-CONSUMERS~~ ✅ | Phase 1 | `grep -rn "useCurrentOrganization\|useOrganization" src/ --include="*.js" --include="*.jsx"`. Clasificar callsites en: activos (filtran queries por org), pasivos (solo metadata), wrappers. Capturar conteo en `data-model.md §Consumers`. | `src/**/*.{js,jsx}` | — | plan.md §P1.2 | 4 |
| ~~TASK-P1-GREP-STORAGE~~ ✅ | Phase 1 | `grep -rn "dentalspot_current_org\|sessionStorage\|localStorage" src/contexts/ src/hooks/` + `grep -rn "dentalspot_current_org" src/`. Documentar en `data-model.md §Existing storage patterns`: si el key `dentalspot_current_org:*` ya existe + formato. | `src/contexts/**` · `src/hooks/**` · `src/**` | — | plan.md §P1.3 | 3 |
| ~~TASK-P1-BASELINE~~ ✅ (Playwright MCP 2026-04-20) | Phase 1 | Reproducir manual P1/P2/P3 con cuenta de prueba multi-clínica. P1: navegar /dashboard/patients con org seleccionada. P2: F5 post-select. P3: logout User A + login User B same browser. Capturar evidencia (screenshot / DevTools Storage tab / notas) y documentar en `data-model.md §Loss scenarios`. Ejecuta Danissa — ejecutor prepara el script de pasos. | (manual) | TASK-P1-READ-CONTEXT | plan.md §P1.4 · spec.md §Acceptance Scenarios | 6 |
| TASK-P1-REPORT | Phase 1 | **SP-1 HARD BLOCK**. Reportar: context path, state management actual, conteo consumidores, storage patterns actuales, 3 baselines (reprodujo/no), checks T1-T4. Formato del reporte en plan.md §P1.5. Esperar 🟢 GO de Danissa. NO avanzar a Phase 2 sin GO. | — | TASK-P1-READ-CONTEXT · TASK-P1-GREP-CONSUMERS · TASK-P1-GREP-STORAGE · TASK-P1-BASELINE | plan.md §P1.5 | 2 |

**SP-1 Stop Point**: Danissa confirma 🟢 GO → Phase 2. Si T1-T4 no pasan todos → stop, re-evaluar.

---

## Phase 2 — Decisiones de Diseño (20 min, pre-SP-2)

| ID | Phase | Task | File:Line | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P2-DECISIONS | Phase 2 | Documentar 4 decisiones en `data-model.md §Design decisions` con tabla (Decisión / Opción elegida / Rationale / Descartadas). Defaults del plan: **A3** localStorage sin sync, **B3** init+effect híbrido, **C1** silent discard, **D2** event listener en OrganizationContext. Si Danissa desvía de un default, re-documentar con razón explícita. Incluir §Expected behavior post-fix con 3 subsecciones (P1/P2/P3) para que Phase 4 tenga referencia objetiva. | `specs/013-ux-persistent-org-context/data-model.md` | SP-1 🟢 | plan.md §P2.1-P2.5 · spec.md §FR-007 | 15 |
| TASK-P2-REPORT | Phase 2 | **SP-2 HARD BLOCK**. Reportar: Decisión A/B/C/D con rationale 1 línea + archivos afectados (≤2) + checks T5-T7. Formato en plan.md §P2.6. Esperar 🟢 GO. NO escribir código sin GO. | — | TASK-P2-DECISIONS | plan.md §P2.6 | 5 |

**SP-2 Stop Point**: hard block. Danissa confirma las 4 decisiones → Phase 3. Si disagreement → iterar sobre TASK-P2-DECISIONS.

---

## Phase 3 — Implementation (30-45 min, pre-SP-3)

| ID | Phase | Task | File:Line | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P3-BASELINE-LINT | Phase 3 | Capturar baseline lint **antes** de tocar código: `ulimit -n 10240 && npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 \| tee /tmp/lint-pre-013.log`. Contar errors/warnings. Guardar para comparar en SP-3. | `/tmp/lint-pre-013.log` | SP-2 🟢 | plan.md §P3.4 · PATTERNS.md §5 | 2 |
| TASK-P3-HELPERS | Phase 3 | Escribir 3 helpers arriba del provider: `readPersistedOrg(userId)`, `writePersistedOrg(userId, orgId)`, `clearPersistedOrg(userId)`. Todos con try/catch que retorna null/noop en QuotaExceededError/SecurityError (mitigación R-01). Key format: `dentalspot_current_org:${userId}`. | `src/contexts/OrganizationContext.jsx` | TASK-P3-BASELINE-LINT | plan.md §P3.2 item 1 · spec.md §FR-005 · R-01 | 8 |
| TASK-P3-INIT | Phase 3 | Modificar init del provider según Decisión B (default B3): `useState(() => readPersistedOrg(user?.id))` + `useEffect(() => { if (userOrgRoles.length > 0 && !userOrgRoles.some(r => r.organization_id === state?.id)) setState(defaultOrg) }, [userOrgRoles])`. Mitigación R-02: validar contra userOrgRoles antes de aceptar la org persistida. | `src/contexts/OrganizationContext.jsx` | TASK-P3-HELPERS | plan.md §P3.2 item 2 · spec.md §FR-003 · R-02 | 8 |
| TASK-P3-SETTER | Phase 3 | Wrap `setCurrentOrganization`: al cambio, llamar `writePersistedOrg(user?.id, newOrg?.id)`. Si newOrg === null → `clearPersistedOrg(user?.id)`. Preservar behavior previo (set state). | `src/contexts/OrganizationContext.jsx` | TASK-P3-HELPERS | plan.md §P3.2 item 3 | 5 |
| TASK-P3-LISTENER | Phase 3 | Decisión D2: `useEffect(() => { if (!user?.id) { clearPersistedOrg(previousUserIdRef.current); } else { previousUserIdRef.current = user.id; } }, [user?.id])`. Resuelve P3 logout cleanup sin tocar AuthContext. Si Danissa eligió D1/D3 en Phase 2, ajustar archivo secundario. | `src/contexts/OrganizationContext.jsx` | TASK-P3-HELPERS | plan.md §P3.2 item 4 · spec.md §FR-004 · Decisión D2 | 7 |
| TASK-P3-LINT-BUILD | Phase 3 | **SP-3**. Correr `ulimit -n 10240 && npx eslint "src/**/*.{js,jsx}" --quiet 2>&1 \| tee /tmp/lint-post-013.log` + `npm run build 2>&1 \| tail -20`. Verificar: T8 git diff --name-only ≤2 files en src/, T9 errors_post ≤ errors_pre, T10 build exit 0. Reportar formato plan.md §P3.5. | — | TASK-P3-HELPERS · TASK-P3-INIT · TASK-P3-SETTER · TASK-P3-LISTENER | plan.md §P3.4-P3.5 | 8 |

**SP-3 Stop Point**: T8-T10 PASS → Phase 4. Si regression lint o build fail → fix antes de test manual.

---

## Phase 4 — Verify Manual (20 min, pre-SP-4)

| ID | Phase | Task | File:Line | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-P4-REPRODUCE | Phase 4 | Re-testear manual: (a) P1 navegar 3 rutas con org seleccionada → PASS si dropdown persiste; (b) P2 F5 → PASS si org preservada; (c) P3 logout/login cross-user → PASS si User B ve su default no residual; (d) multi-tab: tab 1 cambia org, tab 2 refresh → comportamiento según Decisión A (A3: tab 2 refleja post-refresh); (e) modo privado: dashboard carga sin crash (tolerar console.warn); (f) rutas públicas (`/blog`, `/therapists/:slug`): sin errores de provider. Ejecuta Danissa con `npm run dev`. | (manual) | SP-3 🟢 | plan.md §P4.1-P4.4 · spec.md §Success Criteria | 15 |
| TASK-P4-REPORT | Phase 4 | **SP-4**. Reportar T11-T16. Evaluar vs Rollback Plan (3 triggers: crash dashboard post-fix, P1/P2/P3 siguen rotos, multi-tab roto críticamente). Decisión: **close** / **rollback** / **follow-up**. Si rollback → `git revert HEAD`. Formato plan.md §P4.5. | — | TASK-P4-REPRODUCE | plan.md §P4.5 · spec.md §Rollback Plan | 5 |

**SP-4 Stop Point**: decisión explícita del usuario antes de TASK-FINAL.

---

## Post-SP-4 — Close (5-10 min, solo si SP-4 = close)

| ID | Phase | Task | File:Line | Deps | Reference | Est min |
|---|---|---|---|---|---|---|
| TASK-FINAL-COMMIT | Close | `git add src/contexts/OrganizationContext.jsx` (+ archivo secundario si Decisión D ≠ D2) + `git commit` con mensaje `fix: persistent organization context (spec 013)` describiendo los 3 escenarios resueltos y las 4 decisiones tomadas. | `src/contexts/OrganizationContext.jsx` | SP-4 🟢 close | Constitution §IV (micro-bloques) | 3 |
| TASK-FINAL-ARCH | Close | Actualizar `.specify/memory/architecture.md §Providers` (línea 65): agregar 1 línea mencionando que `OrganizationContext` persiste selección en `localStorage` con key `dentalspot_current_org:${user_id}`, cleanup en logout via listener interno. Si Danissa prefiere skip esta actualización (sección ya es densa), omitir. | `.specify/memory/architecture.md:65` | TASK-FINAL-COMMIT | plan.md §P3 + spec 013 outcome | 3 |
| TASK-FINAL-MERGE | Close | `git checkout main && git merge --no-ff 013-ux-persistent-org-context -m "merge spec 013 — persistent organization context"`. **NO push — Danissa lo hace.** | — | TASK-FINAL-COMMIT (+ TASK-FINAL-ARCH si ejecutó) | Constitution §Development Workflow (ejecutor NO pushea) | 2 |

---

## Summary

| Phase | Tasks | Est min | Gate |
|---|---|---|---|
| Phase 1 (audit) | 5 | 20 | SP-1 |
| Phase 2 (decisions) | 2 | 20 | SP-2 (hard block) |
| Phase 3 (implementation) | 6 | 38 | SP-3 |
| Phase 4 (verify) | 2 | 20 | SP-4 |
| Close | 3 | 8 | — |
| **Total** | **18** | **106 min** | 4 gates |

Dentro del bound 1-2h del spec. Buffer 10 min (plan.md §Time Budget) si se disparan R-01/R-02/R-03.

---

## Dependencies graph

```text
TASK-P1-READ-CONTEXT ─┐
TASK-P1-GREP-CONSUMERS┤
TASK-P1-GREP-STORAGE ─┼→ TASK-P1-BASELINE → TASK-P1-REPORT (SP-1) →
                                                                   │
 ┌─────────────────────────────────────────────────────────────────┘
 ↓
TASK-P2-DECISIONS → TASK-P2-REPORT (SP-2 hard block) →
                                                      │
 ┌────────────────────────────────────────────────────┘
 ↓
TASK-P3-BASELINE-LINT → TASK-P3-HELPERS ─┬→ TASK-P3-INIT ─┐
                                         ├→ TASK-P3-SETTER┤
                                         └→ TASK-P3-LISTENER┼→ TASK-P3-LINT-BUILD (SP-3) →
                                                                                          │
 ┌────────────────────────────────────────────────────────────────────────────────────────┘
 ↓
TASK-P4-REPRODUCE → TASK-P4-REPORT (SP-4) →
                                            │ (si close)
 ┌──────────────────────────────────────────┘
 ↓
TASK-FINAL-COMMIT → TASK-FINAL-ARCH (opcional) → TASK-FINAL-MERGE
```

---

## Notes

- **Scope tight**: FR-008 = máx 2 archivos editados. Si Phase 3 requiere >2 → STOP, re-evaluar con Danissa.
- **Decisiones defaults del plan** (A3/B3/C1/D2) son preferentes por razones documentadas en plan.md §P2. Danissa puede overridear cualquiera en Phase 2.
- **No ejecutar** nada hasta tasks.md aprobado (SP-0). Empezar por TASK-P1-READ-CONTEXT solo tras 🟢 GO explícito.
- **No tocar AuthContext** (Constitution §XIII) salvo que Decisión D = D3 como excepción documentada.
- **Ejecutor NO commitea ni pushea a main** — TASK-FINAL-COMMIT es local en branch `013-*`; Danissa hace merge + push final.
