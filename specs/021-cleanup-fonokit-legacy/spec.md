# Feature Specification: Cleanup + Rebrand Edge Functions Legacy FonoKit

**Feature Branch**: `021-cleanup-fonokit-legacy`
**Created**: 2026-04-22
**Status**: Draft
**Input**: User description: "Cleanup de 10 edge functions dead code heredadas de FonoKit + rebrand de 3-4 edge functions activas que todavía usan branding FonoKit en código DentalSpot. Follow-up 3 del audit spec 019 + spec 020 (MP rebrand)."

---

## Context

DentalSpot nació como **clon del repo de FonoKit** (SaaS fonoaudiología hermano en el ecosistema Communicare). Durante el fork gradual hacia dentistas, el rebrand del código fue incompleto — quedaron referencias a FonoKit (strings, nombres de archivo, prompts AI, copy de ads, dominios `fonokit.cl`) distribuidas en ~15 edge functions de este repo.

**Hallazgo operacional crítico (2026-04-22)**: FonoKit la aplicación real vive en **otro proyecto Supabase** (otra cuenta, verificado). Por lo tanto, los archivos con branding FonoKit en este repo DentalSpot son **legacy del clon**, no infraestructura compartida de FonoKit.

**Análisis cruzado** (grep de `supabase.functions.invoke` en `src/**`) reveló:
- **10-11 edge functions con branding FonoKit NO son invocadas** desde el frontend DentalSpot → **dead code**
- **3-4 edge functions con branding FonoKit SÍ son invocadas** → necesitan **rebrand**
- **1-2 edge functions** son invocadas externamente (crawlers SEO, crons) → requieren **verificación Phase A**

Este spec es Follow-up 3 del audit spec 019 + post-spec 020 (MP rebrand completo). Deja el repo coherente y reduce ruido cognitivo antes del launch real.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Dentista recibe email de invitación a su clínica con branding DentalSpot (Priority: P1)

Un dentista invitado a colaborar en una clínica existente de DentalSpot recibe un email de invitación. El email muestra branding **DentalSpot** en lugar de FonoKit (remitente, banner HTML, link de confirmación).

**Why this priority**: Es el **único flujo de email transaccional actualmente usado** en DentalSpot (edge function `clinic-invitations`). Un email con branding "FonoKit" rompe la confianza del dentista invitado + genera confusión ("¿me invitaron a otra app?"). Bloqueante pre-launch real de clínicas.

**Independent Test**: Admin de una clínica invita un email test desde `ClinicInvitationsPanel`. El email recibido debe mostrar remitente `DentalSpot <no-reply@...>`, banner HTML con "DENTALSPOT" (no "FONOKIT"), y link que redirige a `dentalspot.cl` (no `fonokit.cl`).

**Acceptance Scenarios**:

1. **Given** un admin de clínica está en `/clinic/invitations`, **When** invita un email nuevo, **Then** el email recibido tiene remitente `DentalSpot <no-reply@dentalspot.cl>`, asunto con branding DentalSpot, y banner HTML con texto "DENTALSPOT" en lugar de "FONOKIT".
2. **Given** el dentista invitado abre el email, **When** clickea en el link de confirmación, **Then** es redirigido a una URL en `dentalspot.cl` (no `fonokit.cl`) y la página de aceptación muestra UI DentalSpot consistente.

---

### User Story 2 — Admin DentalSpot usa herramientas backend sin ver branding FonoKit (Priority: P2)

Admin de DentalSpot usa el panel admin (módulo fonolevel = dentallevel AI scoring, módulo marketing generator ad copy). Outputs y defaults de estas herramientas muestran branding DentalSpot.

**Why this priority**: No afecta usuarios finales (therapists/patients/clinics) — solo admins internos. Pero introduce confusión técnica en el equipo interno + genera risk si el admin comparte screenshots o outputs a terceros (ej. inversionistas, auditores).

**Independent Test**: Admin dispara `prepare-training-data` desde panel fonolevel. Filename del archivo descargado debe ser `dentalspot_<tipo>_<fecha>.jsonl` (no `fonokit_*`). Admin genera ad copy desde MetaAdsPage — default product sugerido debe decir "DentalSpot para dentistas" (no "Fonokit para fonoaudiologos").

**Acceptance Scenarios**:

1. **Given** admin abre panel fonolevel + dispara export training data, **When** el archivo se descarga, **Then** filename sigue patrón `dentalspot_<tipo>_<fecha>.jsonl`.
2. **Given** admin abre MetaAdsPage + genera ad copy sin especificar producto, **When** se recibe el output, **Then** el copy menciona "DentalSpot" como producto (no "Fonokit").

---

### User Story 3 — Repo DentalSpot refleja solo lo que DentalSpot realmente usa (Priority: P2)

Developer (o auditor, o nueva dev que se suma) abre el repo DentalSpot para entender qué edge functions existen. El inventario de `supabase/functions/` refleja **solo funciones usadas o planeadas** por DentalSpot — no código muerto FonoKit que confunde.

**Why this priority**: Reduce ruido cognitivo para mantenimiento futuro. Un repo con 40 edge functions donde 10 son dead code es un red flag para auditores técnicos y ralentiza onboarding de nuevos devs. No afecta usuarios finales pero impacta la salud operacional.

**Independent Test**: Post-spec, ejecutar `ls supabase/functions/` debería mostrar **10-11 carpetas menos** (las dead code eliminadas). Ejecutar `grep -rin "fonokit" supabase/functions/` debería retornar **0 matches** (excluyendo quizás og-preview si se decide diferir por decisión Phase A).

**Acceptance Scenarios**:

1. **Given** post-implement del spec, **When** un dev ejecuta `ls supabase/functions/`, **Then** las 10 edge functions dead code identificadas ya no están presentes.
2. **Given** post-implement, **When** se ejecuta `grep -rin "fonokit" supabase/functions/`, **Then** retorna 0 matches (o documenta excepción explícita si og-preview se decidió diferir).

---

### Edge Cases

- **¿Qué pasa si una edge function "dead code" tiene una invocación externa (cron Supabase dashboard, webhook MP, trigger DB) que el grep de `src/` no detecta?**
  Phase A incluye verificación explícita en panel Supabase → Cron Jobs + triggers DB. Si se encuentra invocación externa, la edge function se reclasifica de "borrar" a "rebrandear" o "mantener como está con disclaimer".

- **¿Qué pasa si la edge function `clinic-invitations` deployada continúa procesando invitations in-flight durante el deploy del rebrand?**
  Las invitations son stateless (cada invocación genera un email independiente). Durante la ventana de deploy (~30s), nuevos llamados pueden caer en la función rebrandeada o la anterior — ambas producen email válido. **Sin backward compatibility requerida** porque los emails no dependen del prefix interno.

- **¿Qué pasa si un trigger de email programado (proceso externo) envía un email durante el deploy de `process-scheduled-emails` antes de que se complete el delete?**
  `process-scheduled-emails` es un edge function que probablemente se invocaba por cron. Phase A verifica si el cron está activo. Si sí, el cron debería deshabilitarse ANTES del delete para evitar emails fallidos. Si el cron ya está inactivo, delete es seguro.

- **¿Qué pasa con emails transaccionales que FonoKit real (otro proyecto Supabase) pudiera mandar en paralelo?**
  Fuera del scope — FonoKit tiene su propio repo + proyecto Supabase. Este spec solo afecta al repo/proyecto DentalSpot.

- **¿Qué pasa si el dominio `fonokit.cl` sigue activo y recibe traffic de links viejos (ej. bookmarks o emails antiguos) post-delete?**
  Fuera del scope de este spec. Tráfico a fonokit.cl es responsabilidad del equipo FonoKit. Los nuevos emails generados por DentalSpot apuntan a `dentalspot.cl`.

- **¿Qué pasa si `marketplace-ai-description` (marketplace OFF) recibe invocaciones externas durante el rebrand?**
  Marketplace está deshabilitado via `FEATURE_FLAGS.MARKETPLACE: false` desde spec 020. No debería haber invocaciones reales. El rebrand se hace defense-in-depth para cuando marketplace se reactive.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Cleanup (delete dead code)

- **FR-001**: El sistema DEBE eliminar las siguientes 10 edge functions del repo (`supabase/functions/<name>/`) que están confirmadas como dead code (sin invocaciones en `src/**`):
  1. `process-scheduled-emails`
  2. `welcome-sequence`
  3. `rag-query`
  4. `form-auto-responder`
  5. `setup-ads`
  6. `setup-ads-v3`
  7. `setup-campaigns`
  8. `meta-ads-manager`
  9. `test-email`
  10. `send-marketing-campaign`

- **FR-002**: El sistema DEBE eliminar cada edge function del deployment remoto de Supabase (comando equivalente a `supabase functions delete <name>` para cada una).

- **FR-003**: Phase A del spec DEBE verificar que ninguna de las 10 edge functions listadas en FR-001 tiene invocaciones externas activas (cron Supabase, triggers DB, webhooks configurados) antes de proceder con el delete. Si se encuentra invocación externa, la edge function se excluye del delete y se documenta por qué.

- **FR-004**: El sistema DEBE decidir en Phase A si `export-leads-csv` es dead code real o tiene invocación externa (admin panel, reporting tool). Si dead code → incluir en delete de FR-001 (total 11). Si invocado → reclasificar a rebrand (FR-006).

- **FR-005**: El sistema DEBE decidir en Phase A si `og-preview` (invocado por crawlers Meta/Google para blog SEO) se rebrandea ahora o se difiere. Criterio: si el blog público contiene posts con visibilidad real → rebrand cosmético ahora. Si blog vacío o sin tráfico → diferir a spec futuro junto con rebrand UI.

#### Rebrand (edge functions used)

- **FR-006**: El sistema DEBE rebrandear las siguientes 3 edge functions confirmadas como invocadas desde `src/**`:
  1. **`clinic-invitations`** — remitente email (`from: "Fonokit <no-reply@fonokit.cl>"` → `"DentalSpot <no-reply@dentalspot.cl>"`), fallback `FRONTEND_URL` (`https://fonokit.cl` → `https://dentalspot.cl`), HTML banner (`"FONOKIT"` → `"DENTALSPOT"`), tagline footer (`"Plataforma clínica para fonoaudiólogos"` → `"Plataforma clínica para dentistas"`).
  2. **`prepare-training-data`** — filename output del JSONL (`fonokit_${dataset_type}_${date}.jsonl` → `dentalspot_${dataset_type}_${date}.jsonl`).
  3. **`generate-ad-copy`** — default product en prompt (`'Fonokit — plataforma para fonoaudiologos'` → `'DentalSpot — plataforma para dentistas'`), HTTP-Referer header (`https://fonokit.cl` → `https://dentalspot.cl`), X-Title header (`'Fonokit Ad Copy Generator'` → `'DentalSpot Ad Copy Generator'`).

- **FR-007**: El sistema DEBE rebrandear `marketplace-ai-description` como defense-in-depth (marketplace está OFF via feature flag, pero el código se actualiza para cuando se reactive). Cambios: prompt user "Fonokit" → "DentalSpot".

- **FR-008**: Cada edge function rebrandeada DEBE preservar **exactamente** la misma signature de input/output (body request + response format) para no romper callsites existentes en `src/**`.

- **FR-009**: El sistema DEBE deployar las 3-4 edge functions rebrandeadas via comando equivalente a `supabase functions deploy` post-edit.

#### Verification

- **FR-010**: Post-spec, una búsqueda de "fonokit" (case-insensitive) en `supabase/functions/` DEBE retornar 0 matches, **excepto** para archivos explícitamente diferidos en Phase A (ej. og-preview si FR-005 decide diferirlo — documentar excepción).

- **FR-011**: Post-spec, las 3 edge functions rebrandeadas invocadas desde `src/**` DEBEN seguir funcionando con los mismos callsites sin cambios en el frontend (zero edits a `src/**`).

- **FR-012**: El commit final DEBE ser único (per Constitution §IV Micro-Bloques) y describir: (a) qué fue borrado, (b) qué fue rebrandeado, (c) qué fue diferido y por qué.

### Key Entities

- **Edge function dead code (10-11 candidates)**: Archivos en `supabase/functions/<name>/` que tienen código funcional pero 0 callsites desde el frontend DentalSpot y probablemente 0 invocaciones externas. Target de FR-001 delete.

- **Edge function activa con branding FonoKit (3-4 identified)**: Archivos que el frontend DentalSpot invoca activamente (verificado via grep). Target de FR-006 rebrand.

- **Deployment remoto en Supabase**: Además del repo local, cada edge function está deployada en `tomremkbuxvedliyywbo`. El spec DEBE mantener sincronía repo ↔ deployment (FR-002).

- **Frontend callsites**: `ClinicInvitationsPanel.jsx`, `InviteAcceptPage.jsx`, `fonoLevelApi.js`, `MetaAdsPage.jsx`, `AiDescriptionButton.jsx`. NO tocados por este spec (FR-011) — su funcionalidad se preserva via FR-008 preservación de signatures.

- **Git history**: Safety net para recuperación de edge functions borradas si eventualmente se necesitan (ej. si DentalSpot decide arrancar ads Meta, el código legacy sirve como plantilla base vía `git show HEAD~N:path/file.ts`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Post-spec, un dentista invitado a una clínica recibe email de invitación con **zero menciones a FonoKit** (verificación visual en inbox: remitente, banner, footer, link destino). Validación: enviar email test + inspección manual en menos de 2 minutos.

- **SC-002**: Post-spec, admin descarga archivo de training data con filename que empieza con `dentalspot_` (no `fonokit_`). Validación: 1 click en panel fonolevel + inspección del filename en `Downloads` en menos de 30 segundos.

- **SC-003**: Post-spec, admin genera ad copy sin especificar producto y recibe output con branding DentalSpot (product dice "DentalSpot" o "dentistas"). Validación: 1 request desde MetaAdsPage + inspección del output text en menos de 1 minuto.

- **SC-004**: Post-spec, búsqueda de "fonokit" (case-insensitive) en `supabase/functions/` retorna **≤ 1 match** (allow 1 solo si `og-preview` se defirió por decisión Phase A — documentada en commit). Objetivo real: **0 matches**.

- **SC-005**: Post-spec, `ls supabase/functions/` muestra **10-11 carpetas menos** que antes (deltas exactos: 10 si FR-005 se difiere + export-leads-csv NO es dead code, 11 si ambas se eliminan).

- **SC-006**: Post-spec, el flujo de invitación a clínica sigue funcionando end-to-end (admin invita → dentista recibe email → clickea link → llega a aceptación). Zero breaking changes en flujos activos.

- **SC-007**: La duración total del ciclo (plan + tasks + implement + deploy + smoke + close) no excede las **5 horas** de trabajo técnico (confirmando estimate revisado de 4-5 h post-research).

- **SC-008**: Post-spec, ejecutar `git log --oneline -5` muestra **1 commit único** para este spec (cumpliendo Constitution §IV Micro-Bloques).

---

## Assumptions

- **A-01**: ✅ **VERIFICADO 2026-04-22** — FonoKit la aplicación real vive en otro proyecto Supabase, no compartido con DentalSpot (`tomremkbuxvedliyywbo`). Los archivos con branding FonoKit en este repo son legacy del clon original, NO afectan FonoKit real.

- **A-02**: ✅ **VERIFICADO via grep** — Las 10 edge functions listadas en FR-001 no tienen callsites en `src/**`. Phase A confirmará ausencia de invocaciones externas (cron, webhook, trigger DB).

- **A-03**: Las 3 edge functions listadas en FR-006 (clinic-invitations, prepare-training-data, generate-ad-copy) son las **únicas** que tienen branding FonoKit Y son invocadas desde DentalSpot. Si Phase A revela una 5ta no identificada previamente, se añade al scope.

- **A-04**: El dominio `dentalspot.cl` responde (HTTP 200) en path raíz y `/clinic/invitations/accept` o equivalente donde aterriza el dentista al clickear invitation link. Pre-flight check en Phase A.

- **A-05**: El admin actualmente **NO corre Meta Ads** para DentalSpot (los edge functions `setup-ads*` y `setup-campaigns` son legacy FonoKit). Si esta asunción fuera incorrecta, se pierde funcionalidad al borrar — mitigación: Phase A pregunta explícita al advisor antes de delete.

- **A-06**: El export de training data (usado por admin fonolevel → `dentallevel-ai-score`) sigue siendo relevante para DentalSpot. Si el flujo fonolevel fuera dead code también, se ampliaría scope — pero fuera de este spec.

- **A-07**: `og-preview` puede tener tráfico real si el blog público está activo. Phase A verifica existencia de posts publicados + decisión de rebrand inmediato vs diferido.

- **A-08**: Git history funciona como safety net para recuperación. Si eventualmente se necesita recuperar una edge function borrada (ej. `welcome-sequence` para onboarding emails DentalSpot), `git show HEAD~N:supabase/functions/welcome-sequence/index.ts` permite recuperación. No se requiere backup externo adicional.

- **A-09**: El deploy de Supabase edge functions es reversible — si algún delete causa breaking change inesperado, `git revert` + `supabase functions deploy` en la versión previa restaura el estado anterior en < 5 minutos.

- **A-10**: Las edge functions deployadas remotamente pero ausentes en el repo local **no se eliminan automáticamente** (Supabase CLI no hace sync delete). El spec incluye comando explícito `supabase functions delete` para cada dead code (FR-002).

---

## Out of Scope

- **Fixes de seguridad MercadoPago** (F-001 signature, F-002 idempotency, F-003 silent-200, F-005 dunning) — son meta-spec `fix-mercadopago-critical-bugs` separado.
- **Pricing tier real** — follow-up spec `add-subscription-plans-tier-model`.
- **Rewrite completo de ads Meta copy para DentalSpot** — si eventualmente DentalSpot corre Meta Ads, es spec creativo separado con copy nuevo dirigido a dentistas (no rebrand del copy existente de fonoaudiólogas).
- **Frontend UI rebrand** — si `src/` contiene strings "Fonokit"/"FONOKIT" visibles al usuario, es spec separado. Este spec es **backend only**.
- **Variable de entorno `FRONTEND_URL` default** — si existe con valor `https://fonokit.cl` en Supabase secrets, actualizar a `https://dentalspot.cl`. **Incluido cosméticamente** en FR-006 (dentro del código de `clinic-invitations`), pero si hay override de secret, requiere Phase A decision.
- **Nuevas migraciones SQL** — 0 migraciones en este spec.
- **Rebrand del dominio `fonokit.cl` que los links viejos apuntan** — responsabilidad del equipo FonoKit si los redirects son necesarios.
- **Auditoría de otros archivos "fonokit" fuera de `supabase/functions/`** (ej. `src/types/database.ts`, `src/features/clinical-passport/`, etc.) — si contienen branding residual, es spec separado.
- **Reconfiguración del proyecto Supabase** — no se tocan secrets globales, RLS policies, ni schema DB.

---

## Dependencies

- **Spec 019** (audit MercadoPago subscription flow): origen del descubrimiento del branding FonoKit en este repo.
- **Spec 020** (migrate MP brand to DentalSpot): patrón de rebrand ya validado con F-014 preservation. Este spec reutiliza ese patrón sin sorpresas.
- **Sesión 2026-04-22 diagnostic**: confirmó que FonoKit vive en otro proyecto Supabase (A-01).
- **Research grep cruzado** (en request del spec): identificó los 10 dead code + 3-4 used.

---

## References

- Spec 020 (patrón de rebrand): `specs/020-migrate-mp-brand/`
- Spec 019 (audit MP, origen del discovery): `specs/019-audit-mercadopago-flow/data-model.md`
- Session log diagnóstico: `docs/session-logs/2026-04-22-mp-deploy-and-diagnosis.md`
- Constitution: `.specify/memory/constitution.md` §IV Micro-Bloques, §V UI Honesty, §VI Schema Drift Zero
- Architecture: `.specify/memory/architecture.md` §"MP brand migration (spec 020)"
