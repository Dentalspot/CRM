# Tasks: Migrate MercadoPago Integration to DentalSpot Brand

**Input**: [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [quickstart.md](./quickstart.md)
**Feature branch**: `020-migrate-mp-brand`
**Prerequisites**: spec.md ✅ · plan.md ✅ · research.md ✅ · data-model.md ✅ · quickstart.md ✅
**Strategy**: Ejecución secuencial (una sola persona operando). No parallel tasks.

---

## Gate Summary

| Gate | Trigger | T-Checks | Block until |
|---|---|---|---|
| **SP-A** | Fin Phase A | A1: dominio responde · A2: secret presente · A3: panel MP ✅ · A4: working tree clean | 🟢 GO → Phase B |
| **SP-B** | Fin Phase B | B1: `grep fonokit` = 0 · B2: `grep dentalspot_` ≥ 6 · B3: F-014 intacto · B4: scope limpio | 🟢 GO → Phase C |
| **SP-C** | Fin Phase C | C1: secret actualizado · C2: 3 functions deployed · C3: logs OK | 🟢 GO → Phase D |
| **SP-D** | Fin Phase D | D1-D5: 5 smoke tests PASS (**D5 F-014 regression crítico**) | 🟢 GO → Phase E (close) |

---

## Phase A — Pre-flight checks (~10 min)

**Story goal**: Verificar pre-requisites operacionales y de entorno antes de tocar código. Zero risk — solo lecturas.

**Independent test**: Si Phase A completa sin errores, podemos proceder con edits seguros. Si A1 falla, el deploy post-rebrand rompería redirects.

### Tasks

- [ ] TASK-PA-01 [Phase A] Verificar `dentalspot.cl` vivo con `curl -I https://dentalspot.cl/dashboard/membership/status` desde terminal — expected HTTP 200/3xx. Referencia: quickstart.md §A1.
- [ ] TASK-PA-02 [Phase A] Verificar `dentalspot.cl` marketplace path con `curl -I https://dentalspot.cl/dashboard/marketplace/purchase-success` — expected HTTP 200/3xx. Referencia: quickstart.md §A1.
- [ ] TASK-PA-03 [Phase A] Listar secrets Supabase con `supabase secrets list --project-ref tomremkbuxvedliyywbo | grep MERCADOPAGO` — confirmar presencia de `MERCADOPAGO_ACCESS_TOKEN`. Referencia: quickstart.md §A2.
- [ ] TASK-PA-04 [Phase A] Verificar working tree clean en rama `020-migrate-mp-brand` con `git status --short && git branch --show-current` — expected branch correcto + sin archivos modificados en `supabase/functions/`. Referencia: quickstart.md §A4.
- [ ] TASK-PA-05 [Phase A] **🟢 SP-A checkpoint** — confirmar mentalmente A1 ✅ / A2 ✅ / A3 ✅ (ya verificado 2026-04-22) / A4 ✅. Si algún FAIL → resolver antes de pasar a Phase B.

---

## Phase B — Code rebrand (~20 min)

**Story goal**: Reemplazar 14 strings distribuidos en 3 edge functions, preservando F-014 fix intacto.

**Independent test**: Post-Phase B, búsquedas de grep confirman que `fonokit` = 0 matches y `dentalspot_|DENTALSPOT` ≥ 6 matches. F-014 lógica visible en diff sin alteraciones.

### Tasks

- [ ] TASK-PB-01 [Phase B] Editar `supabase/functions/create-mp-checkout/index.ts` línea ~150: cambiar `` `fonokit_sub_${therapist_id}_${Date.now()}` `` por `` `dentalspot_sub_${therapist_id}_${Date.now()}` ``. Referencia: quickstart.md §B1, data-model.md tabla reemplazo #01.
- [ ] TASK-PB-02 [Phase B] Editar `supabase/functions/create-mp-checkout/index.ts` líneas ~156-157: cambiar los 2 strings del `title` de "FONOKIT" a "DENTALSPOT" (uno con cupón, otro sin cupón). Referencia: quickstart.md §B1, data-model.md reemplazos #02-#03.
- [ ] TASK-PB-03 [Phase B] Editar `supabase/functions/create-mp-checkout/index.ts` líneas ~168-170: cambiar los 3 `back_urls` (success/failure/pending) de `fonokit.cl` a `dentalspot.cl` manteniendo el resto de la URL. Referencia: quickstart.md §B1, data-model.md reemplazos #04-#06.
- [ ] TASK-PB-04 [Phase B] Editar `supabase/functions/create-mercadopago-preference/index.ts` línea ~52: cambiar `` `fonokit_order_${purchaseId}` `` por `` `dentalspot_order_${purchaseId}` ``. Referencia: quickstart.md §B2, data-model.md reemplazo #07.
- [ ] TASK-PB-05 [Phase B] Editar `supabase/functions/create-mercadopago-preference/index.ts` líneas ~74-76: cambiar los 3 `back_urls` defaults de `fonokit.cl` a `dentalspot.cl`. Referencia: quickstart.md §B2, data-model.md reemplazos #08-#10.
- [ ] TASK-PB-06 [Phase B] Editar `supabase/functions/create-mercadopago-preference/index.ts` línea ~132: cambiar `statement_descriptor: 'FONOKIT'` por `statement_descriptor: 'DENTALSPOT'`. Referencia: quickstart.md §B2, data-model.md reemplazo #11.
- [ ] TASK-PB-07 [Phase B] Editar `supabase/functions/mercadopago-webhook/index.ts` línea ~140: cambiar `startsWith('fonokit_sub_')` por `startsWith('dentalspot_sub_')` en el dispatch branch de subscription. Referencia: quickstart.md §B3, data-model.md reemplazo #12.
- [ ] TASK-PB-08 [Phase B] Editar `supabase/functions/mercadopago-webhook/index.ts` línea ~167: actualizar comment `// fonokit_sub_{uuid}_{timestamp}` a `// dentalspot_sub_{uuid}_{timestamp}`. Referencia: quickstart.md §B3, data-model.md reemplazo #14 (decisión D-04).
- [ ] TASK-PB-09 [Phase B] Editar `supabase/functions/mercadopago-webhook/index.ts` línea ~194: cambiar `startsWith('fonokit_order_')` por `startsWith('dentalspot_order_')` en el dispatch branch de marketplace. Referencia: quickstart.md §B3, data-model.md reemplazo #13.
- [ ] TASK-PB-10 [Phase B] Verificar B4.1: `grep -rin "fonokit" supabase/functions/create-mp-checkout/index.ts supabase/functions/create-mercadopago-preference/index.ts supabase/functions/mercadopago-webhook/index.ts` → expected **0 matches**. Referencia: quickstart.md §B4.1.
- [ ] TASK-PB-11 [Phase B] Verificar B4.2: `grep -rin "dentalspot_\|DENTALSPOT" supabase/functions/create-mp-checkout/index.ts supabase/functions/create-mercadopago-preference/index.ts supabase/functions/mercadopago-webhook/index.ts | wc -l` → expected **≥ 6 matches**. Referencia: quickstart.md §B4.2.
- [ ] TASK-PB-12 [Phase B] Verificar B4.3: `git diff main...HEAD --stat` → expected solo los 3 archivos bajo `supabase/functions/` modificados. **0 edits a `src/**` o `supabase/migrations/`**. Referencia: quickstart.md §B4.3.
- [ ] TASK-PB-13 [Phase B] Verificar B5: F-014 preservation. `grep -n "chargePrice = plan.price\|dbPrice\|discount_coupons" supabase/functions/create-mp-checkout/index.ts supabase/functions/create-mercadopago-preference/index.ts` → expected matches iguales a pre-rebrand (no alteradas). Referencia: quickstart.md §B5, plan.md FR-011/FR-012.
- [ ] TASK-PB-14 [Phase B] **🟢 SP-B checkpoint** — confirmar B1 ✅ / B2 ✅ / B3 ✅ / B4 ✅. Si algún FAIL → `git checkout supabase/functions/` para rollback edits, re-review scope.

---

## Phase C — Deploy sincronizado (~5 min)

**Story goal**: Swap del secret + deploy de las 3 edge functions en misma ventana ≤60s para minimizar inconsistencia de cuenta MP.

**Independent test**: Post-Phase C, `supabase secrets list` muestra secret actualizado y `supabase functions list` muestra 3 functions con timestamp reciente. Preference de test apunta a cuenta DentalSpot en panel MP.

**⚠️ Secuencia crítica**: ejecutar en orden con gap ≤60s.

### Tasks

- [ ] TASK-PC-01 [Phase C] **T=0**: ejecutar `supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7364812495545195-042200-d82bde5d1371f574f56515e0e4f86893-3353079458 --project-ref tomremkbuxvedliyywbo`. Expected output `"Finished supabase secrets set."`. Referencia: quickstart.md §C1, data-model.md §2 Secrets.
- [ ] TASK-PC-02 [Phase C] **T=30s** (dentro de 60s post-swap): ejecutar `supabase functions deploy create-mp-checkout create-mercadopago-preference mercadopago-webhook --project-ref tomremkbuxvedliyywbo`. Expected output: 3 functions "Deployed" (warning "Docker is not running" es inocuo). Referencia: quickstart.md §C2.
- [ ] TASK-PC-03 [Phase C] Verificar C3: `supabase functions list --project-ref tomremkbuxvedliyywbo | grep -E "create-mp-checkout|mercadopago-webhook|create-mercadopago-preference"` → expected 3 functions con `updated_at` reciente (< 5 min). Referencia: quickstart.md §C3.
- [ ] TASK-PC-04 [Phase C] **🟢 SP-C checkpoint** — confirmar C1 ✅ / C2 ✅ / C3 ✅. Si FAIL → rollback: restore secret FonoKit (si valor guardado) + redeploy con código pre-rebrand. Referencia: quickstart.md §Rollback Phase C.

---

## Phase D — Smoke test sandbox (~15-20 min)

**Story goal**: Validar empíricamente que el rebrand funciona end-to-end en sandbox MercadoPago + confirmar que F-014 fix sigue intacto (regression test explícito).

**Independent test**: 5 tests secuenciales cubren todas las superficies del rebrand (external_reference, title, back_urls, webhook dispatch, F-014 preservation). Cada test retorna PASS/FAIL binario.

### Tasks

- [ ] TASK-PD-01 [Phase D] **Setup**: exportar variables de env `ANON_KEY="<SUPABASE_ANON_KEY>"` (de Supabase dashboard Settings → API) y `THERAPIST_ID="<UUID>"` (un therapist real en DB). Referencia: quickstart.md §D1 Setup.
- [ ] TASK-PD-02 [Phase D] **Test 1**: ejecutar curl POST a `create-mp-checkout` con body `{"plan_name": "profesional", "therapist_id": "$THERAPIST_ID", "payer_email": "test@dentalspot.cl"}`. Validar response: `success: true` + `external_reference` empieza con `dentalspot_sub_` + `preference_id` empieza con `7364812495545195`. Referencia: quickstart.md §D1.
- [ ] TASK-PD-03 [Phase D] **Test 2**: copiar `sandbox_init_point` del response de Test 1 y abrir en navegador Chrome. Validar visualmente: página muestra `"... - DENTALSPOT"` en title (no "FONOKIT") + monto coincide con `plan.price` DB. Referencia: quickstart.md §D2.
- [ ] TASK-PD-04 [Phase D] **Test 3**: en la página MP checkout de Test 2, click "Pagar" → login con test user `TESTUSER3863199017052498103` / password `8DivMzJMQS` → seleccionar tarjeta de prueba (ej: `5031 7557 3453 0604`, CVV `123`, vencimiento `11/25`, titular `APRO`) → confirmar pago → validar redirect a `https://dentalspot.cl/dashboard/membership/status?status=approved&plan=profesional` (URL bar muestra `dentalspot.cl`). Referencia: quickstart.md §D3.
- [ ] TASK-PD-05 [Phase D] **Test 4**: ejecutar `supabase functions logs mercadopago-webhook --project-ref tomremkbuxvedliyywbo --limit 20`. Validar: entrada reciente con `"========== WEBHOOK RECEIVED =========="`, `external_reference: dentalspot_sub_...` en log de handlePayment, **NO** aparece `"Unknown payment type"` (indicaría dispatch rebrand falló). Referencia: quickstart.md §D4.
- [ ] TASK-PD-06 [Phase D] **Test 5 (F-014 regression — CRÍTICO)**: ejecutar curl POST a `create-mp-checkout` con body `{"plan_name": "profesional", "therapist_id": "$THERAPIST_ID", "payer_email": "test-exploit@dentalspot.cl", "final_price": 1}`. Abrir `init_point` en navegador incognito. **Validar que monto mostrado NO es $1** sino precio real del plan (~$20.000-$40.000 CLP). Si muestra $1 → 🔴 **URGENT ROLLBACK** (F-014 regresión). Referencia: quickstart.md §D5, plan.md R-04 + FR-011.
- [ ] TASK-PD-07 [Phase D] **🟢 SP-D checkpoint** — confirmar D1 ✅ / D2 ✅ / D3 ✅ / D4 ✅ / **D5 ✅** (F-014 intacto). Si D5 FAIL → urgent rollback Phase C (restore secret + redeploy versión previa). Referencia: quickstart.md §Rollback Phase D-Test 5.

---

## Phase E — Close (~5 min)

**Story goal**: Documentar el rebrand en archivos fundacionales + commit único + merge + push.

**Independent test**: Post-Phase E, el spec 020 queda cerrado formalmente con trail auditable: architecture.md actualizado, session log extendido, commit descriptivo en main + push al remote.

### Tasks

- [ ] TASK-PE-01 [Phase E] Editar `.specify/memory/architecture.md`: agregar nueva subsección `### MP brand migration (spec 020 — 2026-04-22)` con verdict, cambios, operacional, signing key reference, pendientes. Bump línea `**Last updated**:` al final del archivo. Referencia: quickstart.md §E1.
- [ ] TASK-PE-02 [Phase E] Editar `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`: agregar sección final "Parte N — Spec 020 rebrand ejecutado" con descripción, 5 smoke tests outcomes, commits. Referencia: quickstart.md §E2.
- [ ] TASK-PE-03 [Phase E] Ejecutar commit único: `git add supabase/functions/create-mp-checkout/index.ts supabase/functions/create-mercadopago-preference/index.ts supabase/functions/mercadopago-webhook/index.ts .specify/memory/architecture.md docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md specs/020-migrate-mp-brand/` + `git commit -m "feat(mp): rebrand integration FonoKit → DentalSpot (spec 020)"` con detalle completo en body. Referencia: quickstart.md §E3.
- [ ] TASK-PE-04 [Phase E] Merge + push: `git checkout main && git merge --no-ff 020-migrate-mp-brand -m "merge: spec 020 migrate-mp-brand (DentalSpot)" && git push origin main`. Referencia: quickstart.md §E4.
- [ ] TASK-PE-05 [Phase E] **🟢 SP-E final** — confirmar E1 ✅ / E2 ✅ / E3 ✅ / E4 ✅. Spec 020 cerrado. Verificar branch `main` ahead de `origin/main` por 0 commits post-push (`git status`). Proyecto desbloqueado para meta-spec `fix-mercadopago-critical-bugs` siguiente.

---

## Dependencies

Ejecución estrictamente secuencial (una sola persona operando):

```text
Phase A (pre-flight) → SP-A ✅
     ↓
Phase B (rebrand) → SP-B ✅
     ↓
Phase C (deploy) → SP-C ✅
     ↓
Phase D (smoke) → SP-D ✅
     ↓
Phase E (close) → SP-E ✅
```

**No parallel opportunities**: cada phase depende estrictamente del éxito de la anterior (ej. no podemos deployar antes de editar; no podemos smoke test antes de deployar).

**Intra-phase**: tasks dentro de cada phase son secuenciales por dependencias lógicas:
- Phase A: A1 → A2 → A4 (A3 ya verificado) → A5 checkpoint
- Phase B: B1-B3 (edits create-mp-checkout) → B4-B6 (edits create-mercadopago-preference) → B7-B9 (edits mercadopago-webhook) → B10-B13 (verificaciones) → B14 checkpoint
- Phase C: C1 (secret swap) → C2 (deploy, dentro de 60s) → C3 (verify) → C4 checkpoint
- Phase D: D1 (setup) → D2 → D3 → D4 → D5 → D6 (F-014 regression) → D7 checkpoint
- Phase E: E1 → E2 → E3 → E4 → E5 final

---

## Time Budget

| Phase | Tasks | Tiempo estimado |
|---|---|---|
| Phase A — Pre-flight | 5 tasks (PA-01 a PA-05) | ~10 min |
| Phase B — Code rebrand | 14 tasks (PB-01 a PB-14) | ~20 min |
| Phase C — Deploy sincronizado | 4 tasks (PC-01 a PC-04) | ~5 min |
| Phase D — Smoke test sandbox | 7 tasks (PD-01 a PD-07) | ~15-20 min |
| Phase E — Close | 5 tasks (PE-01 a PE-05) | ~5 min |
| Buffer (imprevisto) | — | ~10-15 min |
| **Total** | **35 tasks** | **65-75 min** (dentro de budget) |

---

## Implementation Strategy

### Approach: Full deployment en 1 sesión

Diferente al patrón "MVP incremental" porque:
- Rebrand es atómico por naturaleza (no tiene sentido rebrand parcial de 2 de 3 archivos)
- Deploy de edge functions requiere coherencia total (webhook dispatch debe reconocer los prefixes que checkouts generan)
- Testing funcional requiere todos los cambios aplicados

### Riesgos a monitorear (ver plan.md Risk Register)

- **R-01** (secret swap window): mitigado con sequence T=0/T=30s en Phase C
- **R-04 (CRÍTICO)** (F-014 regresión): mitigado con Task PD-06 explícito (Test 5)
- **R-05** (grep inesperado): mitigado con verificación Task PB-10

### Rollback strategy

Documentada en quickstart.md §Rollback. Escenarios cubiertos:
- Phase B rollback: `git checkout supabase/functions/`
- Phase C rollback: restore secret FonoKit + redeploy versión previa
- Phase D-Test 5 failure: urgent rollback Phase C

---

## Success Criteria Mapping

Mapeo inverso: cada SC del spec.md → tasks que lo validan.

| SC | Descripción | Validated by |
|---|---|---|
| SC-001 | Dentista completa checkout sin ver FonoKit | Tasks PD-02, PD-03, PD-04 (flujo visual end-to-end) |
| SC-002 | `grep fonokit` = 0 + `grep dentalspot_/DENTALSPOT` ≥ 6 | Tasks PB-10, PB-11 |
| SC-003 | Webhook procesa `dentalspot_sub_*` (no Unknown payment type) | Task PD-05 |
| SC-004 | Panel MP DentalSpot muestra preference test | Task PD-02 (preference_id con app ID DentalSpot) |
| SC-005 | F-014 intacto (final_price manipulado ignorado) | Task PD-06 (test crítico) |
| SC-006 | Ciclo total ≤ 90 min | Time budget total 65-75 min + 10-15 buffer = ≤ 90 min ✅ |
| SC-007 | Proyecto desbloqueado para meta-spec | Task PE-05 (final checkpoint) |

---

## Next after /speckit-tasks

**Opción A**: `/speckit-implement` — ejecutar todos los tasks secuencialmente con confirmaciones al final de cada phase.

**Opción B**: Ejecución manual siguiendo quickstart.md + tasks.md como checklist — marcando checkboxes on the fly.

**Mi recomendación**: **Opción B** para este spec simple. El quickstart.md ya funciona como guía paso-a-paso y tasks.md sirve como checklist auditable. `/speckit-implement` sería más útil para specs con muchas decisiones intermedias.

**Hook optional antes de `/speckit-implement`**: commit de todo el spec package (spec + plan + research + data-model + quickstart + requirements + tasks). Recomendado SÍ para snapshot histórico pre-ejecución.
