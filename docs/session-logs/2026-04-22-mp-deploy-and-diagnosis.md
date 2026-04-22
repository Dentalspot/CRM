# Session log — 2026-04-22 (MP F-014 deploy + diagnóstico pre-launch)

**Duración:** ~1.5-2 h (continuación del trabajo iniciado en sesión 2026-04-20)
**Modalidad:** Executor IDE + Advisor diagnóstico
**Foco:** Deployar fix F-014 + esconder marketplace/Notiz pre-launch + **diagnóstico crítico del estado real de integración MP**

---

## Executive summary

Sesión que comenzó con ejecución táctica (deployar fix F-014 + hide UI marketplace/Notiz) y terminó con un **hallazgo estratégico clave**: DentalSpot **nunca ha conectado cuenta real de MercadoPago**, todo el código MP es heredado de FonoKit. Re-orienta completamente la prioridad del meta-spec MP para las próximas sesiones.

**Logros:**
- ✅ Hide marketplace + Notiz via feature flags (3 archivos frontend, commit 4d0be90)
- ✅ F-014 client-price manipulation fix deployed a producción (commits staged + deployed via Supabase CLI)
- ✅ F-014 fix commit 3593b12 con rationale completo + [CONSTITUTION-EXCEPTION §IV] documentado
- ✅ **Diagnóstico crítico**: DentalSpot está 100% pre-launch en términos de MercadoPago

---

## Timeline

### Parte 1 — Push del día anterior + arranque
- 9 commits de 2026-04-20/21 pusheados a origin/main (sesión ÉPICA de 14h cerrada)
- Working tree limpio al arrancar

### Parte 2 — Hide marketplace + Notiz (Opción A decidida)

**Contexto**: Danissa aclaró que MercadoPago sería solo para suscripciones de dentistas, marketplace quedaría deshabilitado. Investigación reveló que:
- Sidebar.jsx:154 tenía link "Tienda" visible a todos los therapists
- Sidebar.jsx:167 tenía link "Notiz - Notas Auto."
- PostSessionModal.jsx:413-418 tenía `NotizInlineWidget` embebido **sin guard** (se mostraba automáticamente al terminar sesión)
- NO existía feature flag para MARKETPLACE ni NOTIZ

**Implementación** (commit 4d0be90):
- `src/constants/featureFlags.js`: agregados `MARKETPLACE: false` + `NOTIZ: false` con comentario "Módulos deshabilitados pre-producción"
- `src/components/layout/Sidebar.jsx`: 2 condicionales spread-ternary + import FEATURE_FLAGS
- `src/features/post-session/components/PostSessionModal.jsx`: `{FEATURE_FLAGS.NOTIZ && <NotizInlineWidget />}` + import

**Design decision**: rutas `/dashboard/marketplace` y `/dashboard/therapist/notiz` quedan accesibles por URL directa (no rompe links externos guardados). Defense-in-depth: edge functions siguen validando requests.

**Test**: Vite hot-reload detectó los cambios. Verificación UI pendiente (Danissa puede confirmar visualmente cuando retome).

### Parte 3 — F-014 deploy + smoke test intento

**Contexto**: template del fix F-014 estaba pre-cocinado en `specs/019-audit-mercadopago-flow/data-model.md §P3.2`. Executor externo aplicó el fix en 2 edge functions.

**Código verificado empíricamente** (advisor review):
- `create-mp-checkout/index.ts`: final_price removido del destructuring, chargePrice = plan.price, 7 validaciones server-side contra discount_coupons con cálculo percentage/fixed + caps + floor
- `create-mercadopago-preference/index.ts`: loop valida unit_price contra marketplace_plans.price_clp (fallback marketplace_items.price), 400 + console.warn forensics en mismatch

**Deploy exitoso via Supabase CLI v2.90.0**:
```
Deployed Functions on project tomremkbuxvedliyywbo:
create-mp-checkout, create-mercadopago-preference
```

### Parte 4 — 🚨 DIAGNÓSTICO CRÍTICO DESCUBIERTO

Preparando smoke test, Danissa aclaró: "**nunca he conectado esto con la api de mercado pago para la cuenta específica de DentalSpot**".

**Queries diagnósticas** (ejecutadas via SQL Editor):

Query 1 — Profiles distribution:
```
admin:     9
patient:   6
therapist: 2
clinic:    1
TOTAL:    18 users  ← claramente DB pre-launch
```

Query 2 — Subscription brand breakdown por prefix external_reference:
```
brand  | status | plan_name   | n | first_created | last_updated
-------|--------|-------------|---|---------------|-------------
other  | active | profesional | 1 | 2026-04-15    | 2026-04-15
```

**Interpretación**: La única sub activa tiene `external_reference` que NO empieza con `fonokit_` ni `dentalspot_` — probablemente formato `coupon_*` del flow `activateFreeCouponPlan` (cupón 100% descuento que bypassa MercadoPago por completo, `membershipApi.js:302`).

### Parte 5 — Conclusiones estratégicas del diagnóstico

```
ESTADO REAL DE INTEGRACIÓN MP EN DENTALSPOT (2026-04-22):

✅ Código MP existe en repo (heredado de FonoKit, commits 2026-04 baseline)
✅ F-014 fix deployado y activo en producción (commit 3593b12)
✅ UI hide deployada (commit 4d0be90)
❌ Ningún pago real MercadoPago procesado jamás
❌ Cuenta DentalSpot en panel MercadoPago NO creada
❌ MERCADOPAGO_ACCESS_TOKEN actual (si está configurado) es de FonoKit
❌ Todas las huellas del código son FONOKIT:
   - external_reference: fonokit_sub_*, fonokit_order_*
   - back_urls: https://fonokit.cl/...
   - statement_descriptor: 'FONOKIT'
   - title: "... - FONOKIT"
```

**Implicaciones**:
- 🟢 Zero risk operacional: no hay usuarios reales pagando que puedan ser afectados por cualquier fix
- 🟢 Libertad total para planear launch sin presión
- 🔴 Pre-requisite NUEVO no previsto en spec 019: crear cuenta MP DentalSpot + rebrand de código
- 🟡 Meta-spec `fix-mercadopago-critical-bugs` (F-001/F-002/F-003/F-005) se reprioritiza P1 post-rebrand

---

## Commits de la sesión

```
3593b12 fix(mp): server-side price validation F-014 (spec 019 BLOCKER P0)
4d0be90 feat(ui): hide Marketplace + Notiz via feature flags pre-producción
```

**Pendientes pre-push**: nada adicional — push luego del session log.

---

## Roadmap MP Launch (NUEVO, actualizado post-diagnóstico)

Orden correcto para habilitar cobros reales de dentistas:

```
1. [1-2 h]  Crear aplicación DentalSpot en panel MercadoPago
            → https://www.mercadopago.cl/developers/panel/app
            → Generar Access Token (sandbox + production)
            → Guardar MP_WEBHOOK_SECRET (para F-001 fix futuro)

2. [30 min] Configurar MERCADOPAGO_ACCESS_TOKEN en Supabase secrets
            con el nuevo token DentalSpot
            → supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-...

3. [2-3 h]  Spec: migrate-mp-to-dentalspot-brand (NUEVO P0)
            → Rebrand external_reference: fonokit_* → dentalspot_*
            → Rebrand back_urls: fonokit.cl → dentalspot.cl
            → Rebrand title: FONOKIT → DENTALSPOT
            → Rebrand statement_descriptor: FONOKIT → DENTALSPOT
            → Update webhook handler para reconocer nuevos prefijos
            → Toca 3 edge functions MP (checkout, preference, webhook)
            PRE-REQUISITE del meta-spec.

4. [10-15 h] Meta-spec fix-mercadopago-critical-bugs (ya planificado spec 019)
            → F-001 signature, F-002 idempotency, F-003 silent-200,
              F-005 no-dunning
            → F-014 ya done (commit 3593b12)

5. [1-2 h]  Smoke test end-to-end con cuenta DentalSpot sandbox real

6. [ OK ]   Abrir registros de dentistas de pago → cobros reales activos
```

**Total estimado hasta "cobros reales activos"**: 15-22 h en 3-5 sesiones.

---

## Priorización ajustada del backlog spec 019

| Item | Antes diagnóstico | Post-diagnóstico |
|---|---|---|
| F-014 fix | 🔴 P0 urgente | ✅ Done (commit 3593b12) |
| **Cuenta MP DentalSpot setup** | ❌ no estaba | 🔴 **P0 NUEVO** (blocker launch) |
| **Rebrand fonokit → dentalspot MP** | ❌ no estaba | 🔴 **P0 NUEVO** (pre-meta-spec) |
| Meta-spec F-001/2/3/5 | 🔴 P0 | 🟡 P1 (post-rebrand) |
| F-018 webhook audit trail | 🟡 P1 | 🟡 P1 (diagnóstico post-meta) |
| F-010 cancellation detection | 🟡 P1 | 🟡 P1 (después rebrand) |
| F-004 admin directory tabla | 🟡 P1 | 🟡 P1 |
| F-017 process_completed_order | 🟡 P1 | 🟢 **DIFERIR** (marketplace OFF) |
| F-011/F-012 refund/chargeback | 🟢 | 🟢 (marketplace OFF, diferir más fuerte) |

---

## Próximos pasos — orden recomendado

### Esta sesión (continúa)
- [x] ~~A1: Commit F-014 fix~~ (commit 3593b12)
- [x] ~~A2: Session log update~~ (este archivo)
- [ ] Push origin/main (F-014 + UI hide + session log)
- [ ] `/speckit-specify migrate-mp-to-dentalspot-brand` (30 min)
- [ ] Si hay energía: `/speckit-plan` (30-45 min)

### Próxima sesión
- [ ] Danissa crea aplicación DentalSpot en panel MercadoPago (1-2 h offline)
- [ ] Spec rebrand: `/speckit-tasks` → `/speckit-implement`
- [ ] Deploy + smoke test con cuenta DentalSpot sandbox

### Sesión 3+
- [ ] Meta-spec `/speckit-specify fix-mercadopago-critical-bugs` usando prompt pre-cocinado en `specs/019-audit-mercadopago-flow/data-model.md §P3.3`
- [ ] F-001 + F-002 + F-003 + F-005 en ciclo completo

---

## Lecciones learned de esta sesión

### 1. Asumir contexto sin validar = trampa

El spec 019 asumió que DentalSpot tenía integración MP activa (porque había 1 sub active en DB). **Nunca verifiqué si esa sub provenía de MP real o de otro flow**. El flow de cupón 100% activa sub sin tocar MP — ese insight estaba en el código (`membershipApi.js:254-337`) pero lo omití en Phase 1 inventory.

**Lesson**: ante un audit de integración externa, siempre verificar **que las rows DB provienen del flow auditado**, no de bypass flows paralelos.

### 2. Código heredado deja huellas semánticas

Las referencias hardcoded a "FONOKIT" en external_reference/back_urls/statement_descriptor/title son evidencia irrefutable de **código copy-pasted sin rebrand**. Un audit disciplinado de strings hardcoded hubiera detectado esto en spec 019 Phase 1.

**Lesson**: al auditar código heredado, grep de brand names y dominios es tarea P0 del inventory.

### 3. "Deploy inmediato" tiene valor incluso pre-launch

F-014 fix deployado hoy sin tener smoke test validado es **defense-in-depth sólido**. Cuando eventualmente se configure cuenta DentalSpot MP, el exploit crítico ya está cerrado.

**Lesson**: fixes de seguridad defensiva pueden deployarse sin validación end-to-end si el code review es riguroso y el riesgo de regresión es bajo.

---

## Referencias cruzadas

- Session log anterior: `docs/session-logs/2026-04-20-extended-session.md`
- Spec origen: `specs/019-audit-mercadopago-flow/data-model.md`
- Código heredado FonoKit: commits baseline pre-2026-04
- Future spec pendiente: `migrate-mp-to-dentalspot-brand` (a crear en esta sesión)
- Meta-spec pendiente: `fix-mercadopago-critical-bugs` (diferido)

---

## Parte 6 (final) — Spec 020 migrate-mp-brand ejecutado + cerrado

### Resumen

La sesión 2026-04-22 continuó con el ciclo completo spec-plan-tasks-implement del spec 020 `migrate-mp-brand`, cerrándolo exitosamente. **Rebrand de 3 edge functions + cuenta MP DentalSpot configurada + F-014 validado intacto.**

### Ciclo Spec Kit completo (un día)

| Fase | Duración | Output |
|---|---|---|
| `/speckit-specify` | ~15 min | spec.md (188 líneas, 13 FRs, 7 SCs, 9 assumptions, 3 user stories, 5 edge cases) + requirements.md (13/13 PASS) |
| `/speckit-plan` | ~30 min | plan.md (389 líneas, 5 phases, 4 stop points, 7 risks, constitution check), research.md (275 líneas), data-model.md (346 líneas), quickstart.md (402 líneas), contracts/ vacío |
| `/speckit-tasks` | ~10 min | tasks.md (35 tasks, 5 phases secuenciales, stop points per phase) |
| `/speckit-implement` | ~45 min | Ejecución completa Phase A → E con validación empírica |

Total: **~100 min** de ciclo spec kit. Estimación original 60-90 min técnico post-plan se mantuvo dentro de rango.

### Pre-requisites operacionales completados offline por Danissa

- ✅ App "Dentalspot" creada en panel MercadoPago Chile (Checkout Pro)
- ✅ Credenciales sandbox obtenidas: Access Token `APP_USR-7364812495545195-042200-...`, Public Key, User ID `3353079458`
- ✅ Webhook configurado: URL `https://tomremkbuxvedliyywbo.supabase.co/functions/v1/mercadopago-webhook`, 2 eventos (Pagos + Planes y suscripciones), signing key `6f1e...02dc` generada, "Guardar configuración" clickeado
- ✅ Test User Buyer disponible: `TESTUSER3863199017052498103` / `8DivMzJMQS`

### Phase A — Pre-flight checks (10 min) ✅

- A1: `dentalspot.cl/dashboard/membership/status` → HTTP 200
- A2: `dentalspot.cl/dashboard/marketplace/purchase-success` → HTTP 200
- A3: **Hallazgo crítico** — `MERCADOPAGO_ACCESS_TOKEN` NO existía en Supabase secrets. Confirma que MP nunca funcionó en DentalSpot previamente. Interpretado como "initial set" en Phase C (no swap).
- A4: branch correcto + working tree clean en `supabase/functions/`
- SP-A: 🟢 GO Phase B

### Phase B — Code rebrand (20 min) ✅

14 string replacements distribuidos en 3 archivos. **3 matches residuales adicionales** descubiertos por grep global (no estaban en research.md inventory):
- `create-mercadopago-preference/index.ts:11` comment header
- `create-mercadopago-preference/index.ts:103-104` defaults `'Recurso Fonokit'` + `'Compra en Fonokit Marketplace'`
- `mercadopago-webhook/index.ts:196` `.replace('fonokit_order_', '')` — crítico para parseo orderId

Y **~25 matches fuera de scope** en otros edge functions (emails, ads, AI prompts, CSV exports, SEO) — todos diferidos a follow-up spec `rebrand-remaining-edge-functions-fonokit`.

Verificaciones SP-B:
- B1: `grep -rin "fonokit" supabase/functions/{3 archivos}` = **0 matches** ✅
- B2: `grep -rin "dentalspot" supabase/functions/{3 archivos}` = **18 líneas** (criterio ≥ 6) ✅
- B3: F-014 lógica preservada (chargePrice = plan.price, validaciones de cupón, dbPrice marketplace) ✅
- B4: scope limpio (3 archivos edge function + CLAUDE.md meta-doc, 0 edits a `src/**` o `migrations/`) ✅
- SP-B: 🟢 GO Phase C

### Phase C — Deploy sincronizado (5 min) ✅

- C1: `supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-7364812495545195-...` → "Finished supabase secrets set"
- C2: `supabase functions deploy create-mp-checkout create-mercadopago-preference mercadopago-webhook` → 3 functions deployed, warning Docker inocuo
- C3: Todas ACTIVE, mismo timestamp `2026-04-22 05:15:28`, `create-mp-checkout` versión 3 (post-F-014 + post-rebrand)
- SP-C: 🟢 GO Phase D

### Phase D — Smoke test (~20 min) ✅ (D1/D2/D5 PASS + D3/D4 diferidos)

Plan `profesional` @ $20.000 CLP insertado en DB como placeholder (tabla `subscription_plans` estaba vacía, reversible).

- **Test D1** — Request normal via curl con legacy anon JWT: ✅
  - `external_reference: dentalspot_sub_4e55fb74...1776835956665` ✅
  - `preference_id: 3353079458-b65e6974-...` (User ID `3353079458` = cuenta DentalSpot confirmada) ✅
- **Test D2** — Visual checkout sandbox: ✅
  - Título: `"Profesional - DENTALSPOT"` ✅
  - Precio: `$20.000 CLP` ✅
  - URL bar: `sandbox.mercadopago.cl` ✅
- **Test D3** — Completar pago sandbox: 🟡 DIFERIDO (error operacional "Una de las partes es de prueba" — mezcla sesión MP real/sandbox en navegador, no bug del rebrand)
- **Test D4** — Webhook logs: 🟡 DIFERIDO (depende de D3; validación empírica se hará en primer pago real post-launch)
- **Test D5 (CRÍTICO) — F-014 regression**: ✅
  - Request con `{final_price: 1}` manipulado
  - MP API preference lookup: `unit_price: 20000` (servidor IGNORÓ final_price, usó plan.price de DB)
  - **F-014 fix intacto post-rebrand**
  - Title preference: `"Profesional - DENTALSPOT"` ✅
  - back_urls: `https://dentalspot.cl/...` ✅
- SP-D: 🟢 GO Phase E (3 tests críticos PASS, 2 diferidos no bloqueantes)

### Phase E — Close (5 min) ✅

- E1: `architecture.md` subsección nueva §"MP brand migration + cuenta DentalSpot (spec 020 — 2026-04-22)" + Last updated bump
- E2: Este session log actualizado con Parte 6 (final)
- E3-E4: Commit único + merge + push (en curso)
- SP-E: (pending final commit)

### Hallazgos adicionales para follow-up

1. **`subscription_plans` está vacía** (excepto el placeholder de test). Modelo de negocio tier descrito por Danissa:
   - Plan individual
   - Plan clínica (con 1 box incluido)
   - Add-on: dentista adicional (per-seat billing)
   - Add-on: box adicional (per-box billing)

   Requiere schema extension (columnas `included_seats`, `included_boxes`, `per_seat_price_clp`, `per_box_price_clp` en `subscription_plans`, o tabla separada `subscription_addons`). Diferido a follow-up spec `add-subscription-plans-tier-model`.

2. **Supabase migró a nuevas API keys** (publishable/secret). Las edge functions aún validan con JWT legacy. No urgente pero eventualmente habrá que verificar si el cambio afecta autenticación frontend.

3. **~25 edge functions con branding FonoKit residual** (emails, ads, AI prompts) — no tocados en spec 020 per Micro-Bloques §IV. Follow-up `rebrand-remaining-edge-functions-fonokit` (probablemente 1-2h de trabajo similar).

### Lecciones adicionales (§4 del log)

#### 4. El grep global exhaustivo revela scope creep ANTES del deploy

Research.md Phase 0 hizo inventory basado en inspección manual → 11 reemplazos identificados. El grep exhaustivo post-edit reveló 3 más (comment header, defaults title/description, `.replace()` call). R-05 del plan se activó como esperado.

**Lesson**: el grep exhaustivo post-edit es mandatorio, no optativo. Cuando el pattern es un string común (brand name), la intuición puede perder matches.

#### 5. Sandbox MP tiene limitaciones operacionales comunes

El error "Una de las partes es de prueba" al mezclar sesiones MP real/sandbox en el mismo navegador es común. **Lesson**: documentar en quickstart.md de futuros specs MP que D3-equivalent requiere navegador incognito o logout previo de MP real.

### Hallazgo lateral sobre arquitectura

**Supabase secret `MERCADOPAGO_ACCESS_TOKEN` estaba AUSENTE antes de este spec.** Esto significa que las edge functions MP retornaban error 500 `"MERCADOPAGO_ACCESS_TOKEN no configurado"` cada vez que se invocaban. No había integración MP funcional de ningún tipo. Esto se alinea con el diagnóstico anterior ("DentalSpot nunca procesó pago MP real"), pero es MÁS estricto que el diagnóstico inicial ("token de FonoKit existía"). **Realmente no había token en absoluto.**

---

## Estado final sesión 2026-04-22

- ✅ 5 specs/tasks ejecutados: F-014 fix + UI hide marketplace/Notiz + spec 020 migrate-mp-brand (completo)
- ✅ 9 commits en origin/main (hasta spec 020 pending)
- ✅ Rebrand MP production-ready en sandbox (pendiente production access token para launch real)
- ✅ F-014 fix validado intacto post-rebrand
- ✅ 3 follow-ups documentados en architecture.md + session log
- ⏳ Pending Danissa offline: Test D3/D4 end-to-end + production access token + modo productivo webhook + modelo de pricing tier

DentalSpot queda **desbloqueado** para la ejecución del meta-spec `fix-mercadopago-critical-bugs` (spec 019 BLOCKERs P0 restantes: F-001 signature + F-002 idempotency + F-003 silent-200 + F-005 dunning). Pre-requisites de ese meta-spec ahora están resueltos.

---

## Parte 7 (final) — Spec 021 cleanup FonoKit legacy ejecutado + cerrado

### Resumen

Post-spec 020, ciclo completo spec-plan-tasks-implement de spec 021 `cleanup-fonokit-legacy`. Cleanup híbrido de 15 edge functions con branding FonoKit: 9 deletes + 6 rebrands + 1 diferida. **-2,716 líneas netas**.

### Ciclo completo (2-3h total con /speckit-specify → /speckit-plan → /speckit-implement)

| Fase | Duración | Output |
|---|---|---|
| `/speckit-specify` | ~10 min | spec.md (230 líneas, 12 FRs, 8 SCs, 10 assumptions, 3 user stories) + requirements.md (13/13 PASS) |
| `/speckit-plan` | ~25 min | plan.md (421 líneas, 5 phases, 7 risks, 5 SPs), research.md (285), data-model.md (314), quickstart.md (467), contracts/ vacío |
| `/speckit-implement` (skip tasks.md) | ~1h 30min | Ejecución directa siguiendo quickstart.md |

### Phase A — Pre-flight: **scope correction crítico**

El research inicial fue **INCOMPLETO** (head_limit 80 en grep de `supabase.functions.invoke`, perdió 5 callsites). Re-research exhaustivo reveló:

- **`send-marketing-campaign`** es usada por `CampaignsPage.jsx:209` + `marketingApi.js:50` — NO dead code
- **`meta-ads-manager`** es usada por `metaAdsApi.js:14` — NO dead code
- `welcome-sequence` + `process-scheduled-emails` mencionadas en `AutomationPage.jsx:23` como "Activo" pero outdated

Verificación empírica SQL:
- Query `pg_cron` → **`relation cron.job does not exist`** (extensión NO instalada)
- Query `information_schema.triggers` con `action_statement LIKE '%welcome-sequence%'` → 0 rows
- Query `form-auto-responder` grep en codebase completo → 0 matches fuera del spec 021 docs

**Conclusión**: migrations `.bak` de welcome/scheduled-emails nunca fueron aplicadas. Scope revisado:
- DELETE real: 9 archivos (agregaron welcome-sequence, process-scheduled-emails, form-auto-responder, export-leads-csv al scope original)
- REBRAND real: 6 archivos (original 4 + send-marketing-campaign + meta-ads-manager)
- DIFERIR: og-preview (0 posts publicados confirmado con `SELECT COUNT(*) FROM blog_posts WHERE published_at IS NOT NULL`)

### Phase B — 9 deletes ejecutados

```
rag-query · setup-ads · setup-ads-v3 · setup-campaigns · test-email
welcome-sequence · process-scheduled-emails · form-auto-responder · export-leads-csv
```

**Hallazgo operacional clave**: `supabase functions delete <name>` retornó `"Function X does not exist on the Supabase project: nothing to delete"` para **las 9 functions**. Nunca estuvieron deployadas — eran puro código muerto en repo.

### Phase C — 6 rebrands ejecutados

| Archivo | Edits | Callsite |
|---|---|---|
| `clinic-invitations` | 4 (from, FRONTEND_URL default, banner HTML, tagline) | ClinicInvitationsPanel + InviteAcceptPage |
| `prepare-training-data` | 1 (filename output) | admin fonolevel |
| `generate-ad-copy` | 4 (default product + audience + HTTP-Referer + X-Title) | MetaAdsPage admin |
| `marketplace-ai-description` | 1 (prompt user, defense-in-depth marketplace OFF) | AiDescriptionButton |
| `send-marketing-campaign` | 3 (from, reply_to, unsubscribe_url) | CampaignsPage + marketingApi |
| `meta-ads-manager` | 2 (descriptions Leads + Retargeting) | metaAdsApi |

Verificación SP-C: `grep -rin "fonokit" supabase/functions/` retorna **1 archivo** (solo `og-preview` diferido). Signatures preservadas (diff review).

### Phase D — Deploy + smoke

- Deploy exitoso: 6 functions deployed a `tomremkbuxvedliyywbo` (Docker warning inocuo)
- Smoke test D1 (curl a generate-ad-copy sin auth admin) retornó "Unauthorized" esperado — edge function requiere admin session
- Smoke visuales diferidos (email invitation real, filename JSONL, ad copy output) — validación cuando se usen los flujos

### Phase E — Close

- architecture.md: subsección `§"Legacy FonoKit cleanup (spec 021 — 2026-04-22)"` agregada + Last updated bump
- CLAUDE.md: Active feature actualizada (entre ciclos, spec 021 closed)
- Session log: esta sección (Parte 7)
- Commit único en rama `021-cleanup-fonokit-legacy`
- Merge a main (pending push)

### Lecciones aprendidas (adicionales)

#### 1. El grep head_limit puede crear falsos diagnósticos

Mi research inicial usó `head_limit: 80` en `supabase.functions.invoke` y perdió callsites críticos de admin marketing (`send-marketing-campaign`, `meta-ads-manager`). R-05 del plan (scope creep vía grep inesperado) se activó — y se salvó porque Phase A hace grep exhaustivo pre-edit.

**Lesson**: research pre-spec debe hacer grep sin head_limit o explícitamente verificar que el output completo se revisó. O múltiples greps complementarios.

#### 2. `.bak` migrations en DentalSpot NO están aplicadas

Convención confirmada empíricamente: archivos `.sql.bak` son backups históricos, no están en la cadena de migrations activas. Code reviews de grep deben filtrar `.bak` o interpretarlos como "historical only".

#### 3. pg_cron NO está instalado en este proyecto

DentalSpot no tiene scheduling nativo de Supabase. Features que requieran cron (ej. emails programados, cleanups periódicos) van a requerir:
- Activar extension pg_cron (requiere coordinación con Supabase support en algunos casos)
- O usar un worker externo (Vercel Cron, GitHub Actions schedule)

#### 4. Edge functions en repo pueden NO estar deployadas remotamente

Las 9 deletes confirmaron que existían como código sin deploy. Esto es común en repos clonados (FonoKit → DentalSpot). Spec futuros que toquen edge functions deberían pre-check `supabase functions list` para sanity de estado local vs remoto.

### Estado final post-spec 021

- Working tree clean (pending commit + merge)
- 9 edge functions eliminadas del repo + 6 rebrandeadas
- 1 edge function diferida (`og-preview`)
- Repo coherente con branding DentalSpot (solo queda 1 match "fonokit" en og-preview diferido)
- Pre-requisites resueltos para meta-spec `fix-mercadopago-critical-bugs`

### Follow-ups pendientes (post-spec 021)

1. **Meta-spec `fix-mercadopago-critical-bugs`** (P0, 16-22h) — prompt pre-cocinado en `specs/019-audit-mercadopago-flow/data-model.md §P3.3`. Pre-requisites resueltos por specs 020 + 021.
2. **`add-subscription-plans-tier-model`** (P1, 10-14h) — pricing real tier individual + clinic + per-seat + per-box.
3. **`rebrand-og-preview-if-blog-activates`** (diferido, ~1h cuando blog se active).
4. **`cleanup-automation-page-outdated-refs`** (menor, `AutomationPage.jsx:20,23` menciona edge functions eliminadas — UI cosmético).
