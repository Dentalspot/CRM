# Feature Backlog — DentalSpot

**Última actualización**: 2026-04-23

Registro oficial de features que **existen conceptualmente en el código** (definidas en `PLAN_FEATURES` / `FEATURE_INFO`, listadas en pricing anterior, etc.) pero están **diferidas intencionalmente**. Este doc existe para:

1. Evitar que se vuelvan a prometer en UI / pricing sin implementarlas
2. Tener un lugar claro al que volver cuando se decide activarlas
3. Capturar el "por qué no se activan todavía"

**Regla**: si una feature vive acá, está en `false` en todos los planes de `PLAN_FEATURES` y NO aparece en PricingPage.jsx ni UpgradeModal priority list. Si eventualmente se implementa, sacarla de este doc y activarla en el plan correspondiente.

---

## 🟡 WhatsApp — Recordatorios + Asistente IA

**Estado**: Diferido, sin fecha · **Intención**: ALTA, es value prop del producto

### Qué es
- **Fase 1**: recordatorios automáticos de cita por WhatsApp al paciente (24h + 2h antes)
- **Fase 2**: asistente IA por WhatsApp que responde consultas de paciente (precios, disponibilidad, FAQ) con data real del dentista

### Por qué diferido
- Fase 1 requiere: cuenta WhatsApp Business verificada (Meta), templates pre-aprobados, provider (Twilio o Cloud API direct), scheduler externo (pg_cron ausente), ~2-3 semanas de implementación
- Fase 2 requiere Fase 1 + RAG sobre therapist_services/appointments + LLM integration + safety guardrails, ~4-8 semanas adicionales
- Hoy prometerlo sin implementarlo = falsa publicidad (Ley del Consumidor) + churn inmediato del primer dentista que intente usarlo

### Costo estimado
- Fase 1: $80-120 USD/mes para 10 dentistas (Twilio) — margen OK como feature de plan pagado
- Fase 2: +$7 USD/mes LLM por dentista activo

### Dónde vive el código actualmente
- `src/constants/planFeatures.js`: `whatsappReminders` en FEATURE_INFO con flag `deferred: true`, `false` en todos los planes
- `supportLevel: 'whatsapp'` (era el canal soporte del plan Professional) → cambiado a `'priority'` genérico hasta definir canal soporte

### Lo que NO es esta feature
El código tiene varias referencias legítimas a WhatsApp que **no** son el feature:
- Links `https://wa.me/+56...` en email templates → outbound al WhatsApp personal del dentista (fine, keep)
- Links en landing/SymptomFlow "Prefiero agendar por WhatsApp" → flow alternativo de captura
- `supportLevel` del plan → canal soporte al dentista (aún por definir)

### Plan de activación
1. Definir provider (Twilio para arranque, Meta Cloud API cuando escalemos)
2. Setup Meta Business verification + número WhatsApp Business DentalSpot
3. Aprobar templates de mensaje
4. Spec formal `whatsapp-reminders-phase1` via `/speckit-specify`
5. Implementar reminders + test con 1-2 dentistas voluntarios
6. Activar en planes Pro + Premium (setear a `true`, remover de este backlog)
7. Update pricing + comparison table

---

## 🟡 Marketplace — Comprar y Vender Materiales

**Estado**: Diferido, sin fecha · **Intención**: BAJA-MEDIA, depende de product-market fit

### Qué es
Plataforma donde dentistas:
- **Compran**: plantillas, materiales educativos, recursos clínicos de otros dentistas
- **Venden**: sus propios templates/materiales y ganan comisión

### Por qué diferido
- MVP DentalSpot se enfoca en **cobros dentista → DentalSpot** (suscripciones). Habilitar cobros paciente → dentista o dentista ↔ dentista (marketplace) complica MP integration.
- Diferenciar DentalSpot primero como "mejor agenda + ficha + cobros" antes de meterse en marketplace
- Requiere: onboarding de vendedores, moderación de contenido, sistema de reviews, comisión split MP, facturación dual (comprador + comisión DentalSpot)

### Dónde vive el código
- `src/constants/planFeatures.js`: `marketplaceBuy` y `marketplaceSell` con flag `deferred: true`, `false` en todos los planes
- `src/app/routers/DashboardRouter.jsx`: rutas `/marketplace/*` **siguen existiendo** protegidas por `<PlanGuard feature="marketplace*">`. Como la feature está en `false` en todos los planes, PlanGuard muestra fallback (upgrade prompt). Funcionalmente inaccesible.
- Tablas DB `marketplace_*` existen (baseline schema) pero no se escribe ni consulta desde UI

### Plan de activación
1. Decidir si marketplace es parte del roadmap post-launch
2. Si sí → spec completo con modelo comercial (comisiones, fees, SLA)
3. Setup adicional MP (split payment entre vendor + DentalSpot)
4. Redesign onboarding dentistas como vendors
5. Setear features a `true` en planes Pro/Premium, remover de backlog

**Alternativa**: si se decide que marketplace NO es roadmap, eliminar tablas + rutas + referencias en un cleanup futuro (spec tipo `remove-marketplace-legacy`).

---

## 🟡 Asistente — Login + Dashboard completo

**Estado**: Selector de signup sí lo muestra (2026-04-23) · Implementación backend incompleta · **Intención**: ALTA

### Qué es
Rol "Asistente" dentro de una clínica: persona que no es dentista pero ayuda con agenda, recepción, recordatorios a pacientes, etc. Puede ver pacientes de la clínica, agendar citas, pero no tocar ficha clínica propiamente.

### Estado actual (2026-04-23)
- ✅ Rol definido en `src/constants/roles.js` → `USER_ROLES.ASSISTANT`
- ✅ Aparece en `getPublicRoles()` → visible en RolePicker del signup
- ✅ Dashboard existe: `src/features/assistant/pages/AssistantDashboard` + `AssistantAgendaPage` + `AssistantPatientsPage`
- ✅ Rutas configuradas: `/dashboard/assistant/*` protegidas por `<AuthGuard>` (solo "está logueado")
- ✅ `getDashboardPathByRole('assistant')` → routea a `/dashboard/assistant`
- ❌ **Gap crítico**: el rol real del asistente se determina por `organization_members` (tabla de membresías clínica), NO por `profiles.role='assistant'`. Ver comentario en `roles.js:7` → `"Rol operativo determinado por organization_members, no por profiles.role"`
- ❌ Flow de invitación asistente → unirse a clínica específica: no implementado

### Implicación de estado actual
Si un usuario se registra como "Asistente" desde el RolePicker:
- `profile.role` se setea como `'assistant'`
- Post-login va a `/dashboard/assistant` (por getDashboardPathByRole)
- Pero NO está asociado a ninguna clínica (no hay row en `organization_members`)
- `AssistantDashboard` probablemente muestra estado vacío o error

### Plan de activación (spec futura `assistant-onboarding-v1`)
1. Definir flow de invitación:
   - Clínica (owner) manda invitación a email
   - Asistente recibe link, se registra con rol asistente
   - Al registrarse, se crea row en `organization_members` con `role='assistant'` y la clínica correcta
2. `AssistantDashboard`: query de la clínica asociada via `organization_members`, mostrar agenda de esa clínica + pacientes
3. Permisos RLS: policies que dejen al asistente READ de pacientes de su clínica pero NOT WRITE de ficha clínica
4. UI de gestión: clínica ve lista de asistentes, puede revocar acceso

### Workaround pre-activación (para testing ahora)
Al registrar un asistente test:
1. Signup normal con rol "asistente" → `profile.role='assistant'`
2. Después, **manualmente via SQL**, crear row en `organization_members`:
```sql
INSERT INTO organization_members (user_id, organization_id, role, is_active)
VALUES ('<uuid-asistente>', '<uuid-clinica-existente>', 'assistant', true);
```
3. Al login debería ver el dashboard con data de esa clínica

---

## 🟢 Cobros Paciente → Dentista via Plataforma

**Estado**: Diferido, decisión explícita 2026-04-22 · **Intención**: Por definir post-beta

### Qué es
El paciente paga al dentista por sus tratamientos **dentro de DentalSpot** (en vez de que el dentista cobre afuera con Transbank/Flow y DentalSpot se lo pierda como feature).

### Por qué diferido
- Decisión explícita de la founder: "MercadoPago solo para suscripciones de dentistas, marketplace no se habilita aún"
- Agrega complejidad fiscal significativa (boleta electrónica al paciente en nombre del dentista, split fee)
- Requiere integración SII o provider tipo OpenFactura/Haulmer
- Competencia (Dentalink, AgendaPro) SI tiene esto — diferenciador potencial para la segunda etapa

### Dónde vive el código
- `src/features/clinic-dashboard/components/InvoicingPanel.jsx` existe (no auditado a fondo)
- Tablas `marketplace_purchases`, `subscription_payments` existen — no se usan para paciente↔dentista
- `create-mercadopago-preference` edge function (general purpose) hidden behind FEATURE_FLAGS.MARKETPLACE=false

### Plan de activación (post-launch)
1. Validar con beta dentists cuál es el pain real (muchos ya usan Transbank y están OK)
2. Si hay señal → spec de cobros paciente con integración boleta electrónica
3. Modelo comercial: fee por transacción? % MP? Flat mensual?

---

## 🟢 Calendario rich para clinic_admin

**Estado**: Diferido, trivial post spec 024 · **Intención**: Siguiente spec (025)

### Qué es
Traer el mismo calendario rich del asistente (spec 024) a la vista de clinic_admin en `/dashboard/clinic/agendas`. El clinic_admin tendría paridad visual/funcional con el asistente — ver agenda de cada dentista, crear/editar/cancelar citas, bloquear horas con drag, resize.

### Por qué diferido
- Spec 024 acabó de implementarse (2026-04-24). Mergear primero, validar en beta, después replicar.
- Micro-bloques (Constitution §IV) — no mezclar features.
- `ClinicAgendasPage` actual funciona (vista lista con filtro por dentista). No urgente.

### Costo estimado
**~1-2h** porque la arquitectura de spec 024 quedó preparada:
- Componente `OrgCalendarView` acepta prop `scope='clinic_admin'` ya
- Servicio `org.api.js` ya enforce RLS para ambos roles
- Policies `appt_admin_*` ya existen en DB
- Solo falta: crear `ClinicAdminCalendarPage` wrapper + actualizar route

### Dónde vive el código
- `src/components/calendar/OrgCalendarView.jsx` — genérico, ya soporta clinic_admin
- `src/lib/api/org.api.js` — RLS transparente al role
- `src/pages/clinic/ClinicAgendasPage.jsx` — la vista lista actual a deprecar cuando se active spec 025

### Plan de activación
1. Smoke test spec 024 con user real (asistente beta).
2. Si 024 anda en prod, abrir spec 025 — scope trivial, 1-2h.
3. Reemplazar `ClinicAgendasPage` por `ClinicAdminCalendarPage = () => <OrgCalendarView scope="clinic_admin" organizationId={...} />`.
4. Tests manuales, deploy.

---

## 🟢 Asistente: Pagos + Deudas de Pacientes

**Estado**: Diferido, detectado post spec 024 · **Intención**: Spec futuro, alta prioridad para recepción

### Qué es
Dos capacidades relacionadas para el asistente:

**A. Registrar pagos (manual, no MercadoPago)**
- Al finalizar cita → botón "Registrar pago" en modal edit
- Dialog existente `RegisterPaymentDialog` (ya vive en `src/features/assistant/components/`)
- Permite registrar: monto, método (efectivo/transferencia/débito/crédito), fecha, referencia
- Graba en `patient_payments` asociado al appointment_id

**B. Ver deudas de tratamientos**
- Vista dedicada o widget en dashboard del asistente:
  - Lista de pacientes con balance negativo (servicios prestados - pagos recibidos)
  - Filtros por dentista, por antigüedad de deuda
  - Botón "Registrar pago" inline
- Potencialmente también: recordatorios automáticos al paciente (WhatsApp/email)

### Por qué diferido (no en spec 024)
Detectado durante smoke de spec 024 (2026-04-24). El `RegisterPaymentDialog` existía en el `AssistantAgendaPage` legacy (vista lista) pero se perdió al migrar al rich calendar. Decisión explícita en research.md §R-10: "NO preservar register-payment en este spec — lo movemos a backlog porque no era parte del request del usuario original (spec 024 fue solo UI visual calendar)."

### Costo estimado
**Parte A (registrar pagos)**: 1-2h. El componente existe en `src/features/assistant/components/RegisterPaymentDialog.jsx`. Solo hay que:
- Agregar botón "Registrar pago" en `AssistantAppointmentModal` edit mode
- Cuando cita.status='completed', hacer el botón más visible/primary
- RLS: verificar que `patient_payments_*_assistant` policies existen (probable que sí desde spec 023)

**Parte B (deudas)**: 4-6h. Requiere:
- Query consolidada: `SELECT patient_id, SUM(service_price) - SUM(payment_amount) AS balance FROM appointments LEFT JOIN patient_payments ... GROUP BY patient_id HAVING balance > 0`
- Nueva page o widget en `/dashboard/assistant/debts`
- UI para filtros + acción registrar pago inline

### Dónde vive el código actualmente
- `src/features/assistant/components/RegisterPaymentDialog.jsx` — dialog existente (sin usar post spec 024)
- Tabla `patient_payments` existe
- Policies RLS probablemente existen para asistente (verificar en spec 025)

### Plan de activación
Abrir spec nuevo cuando:
1. Beta dentists reporten que necesitan trackear pagos (alta probabilidad)
2. Post smoke de spec 024 estable en prod
3. Coordinar con spec `clinic-service-catalog` (los precios consolidados facilitan cálculo de deuda)

---

## 🟢 Clinic Service Catalog (catálogo de servicios clínica-level)

**Estado**: Diferido, detectado en smoke 024 · **Intención**: Spec futuro, alta prioridad post-beta

### Qué es
Modelo híbrido de servicios:
- Clínica define catálogo base (`clinic_services`) con nombre/duración/precio estándar
- Dentista puede override con sus propios servicios (`therapist_services`) cuando aplica
- Al crear cita, dropdown muestra clinic_services por default + sección "Personales del dentista" si existen

### Por qué diferido
Detectado durante smoke test spec 024 (2026-04-24): al invitar un dentista nuevo a la clínica, éste no tiene servicios configurados → asistente no puede crear citas con servicio asignado. Hoy se crea cita con `service_id=null` como workaround temporal.

### Por qué importa
- Estandarización de precios (una clínica no debería tener el mismo servicio a 5 precios distintos)
- Onboarding más rápido de dentistas nuevos (usan catálogo existente)
- Facilita billing, reports financieros, auditoría
- Patrón estándar en clínicas dentales reales

### Costo estimado
4-6h. Incluye: migration para `clinic_services` table, RLS policies, UI en Mi Clínica para catálogo, adaptación del modal de cita, migration de data existente de therapist_services → clinic_services (opt-in).

### Dónde vive el código
Actualmente no vive. Se abre como spec nuevo.

---

## 🟢 Rich Calendar multi-dentista view (P3 spec 024)

**Estado**: Diferido, feature futura · **Intención**: Cuando clínicas grandes lo pidan

### Qué es
Vista "Todos los dentistas" en el calendario rich — grid dividido en columnas (1 por dentista) con colores distintos para poder agendar mirando la agenda de todo el equipo simultáneamente.

### Por qué diferido
- P3 de spec 024 explícitamente out of scope MVP (research §R-01).
- `WeeklyAgendaView` actual colorea por clínica, no soporta multi-resource.
- Requiere refactor no-trivial del componente para soportar columnas por resource.
- Clínicas beta actuales (1-2 dentistas) no lo necesitan.

### Costo estimado
~6-10h — refactor de `WeeklyAgendaView` para multi-resource + UI de columns + drag between columns.

### Dónde vive el código
Actualmente no vive. Se abriría como spec nuevo cuando haya señal de clínicas con 4+ dentistas pidiendo la feature.

---

## 📋 Checklist de coherencia (antes de mergear features a este backlog)

Cuando diferís una feature:
- [ ] Setear `false` en todas las entries de `PLAN_FEATURES`
- [ ] Agregar flag `deferred: true` en `FEATURE_INFO`
- [ ] Remover menciones de UI pública (PricingPage.jsx, landing)
- [ ] Remover de priorityFeatures en UpgradeModal
- [ ] Agregar entrada a este doc con: qué es, por qué, costo, cómo vive en código, plan de activación
- [ ] Si la feature tenía rutas, confirmar que PlanGuard las bloquea (fallback o redirect)

Cuando activás una feature:
- [ ] Implementar completamente
- [ ] Test end-to-end
- [ ] Setear `true` en planes correspondientes de `PLAN_FEATURES`
- [ ] Remover flag `deferred: true` de `FEATURE_INFO`
- [ ] Agregar a PricingPage + comparison table
- [ ] Agregar a UpgradeModal priorityFeatures si aplica
- [ ] **Remover entrada de este backlog**
- [ ] Commit claro con "feat(plans): activate <feature> in <planes>"
