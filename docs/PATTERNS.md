# Patrones canónicos de DentalSpot

Recetas técnicas validadas en producción durante el ciclo de specs 001-005 (2026-04-18 → 2026-04-20). Consultar antes de abrir una spec que toque estos dominios.

Referencia cruzada: cada patrón apunta al commit canónico y al doc fundacional correspondiente.

---

## 1. Alias SQL (PostgREST) para migrar columnas renombradas sin tocar consumidores

### Problema

Una columna en Supabase fue renombrada (ej. `price` → `price_clp`) y múltiples consumidores frontend consultan el nombre viejo. Propagar el cambio a N archivos es costoso y expone la app a ventanas de error (`42703 column does not exist`) durante el rollout.

### Patrón

PostgREST soporta alias SQL en el `.select()`. En lugar de renombrar en el código, traduces la columna en el result set:

```js
// Antes (rompe tras el rename):
.select('id, service_name, price, duration_minutes')

// Después (funciona con el nombre nuevo, devuelve "price" al cliente):
.select('id, service_name, price:price_clp, duration_minutes')
```

El cliente sigue recibiendo `row.price`. La DB expone `price_clp`. Fix atómico de 1 línea, 0 cambios en consumidores.

### Cuándo usarlo

- Columna renombrada + 2+ consumidores leyendo el nombre viejo
- Columna renombrada + consumidores en distintos módulos (riesgo de propagación inconsistente)

### Cuándo NO usarlo

- Consumidores necesitan escribir (UPDATE/INSERT) — el alias solo aplica a SELECT
- Cambio semántico real (no solo rename) — el alias esconde el cambio, mejor migrar explícito

### Caso canónico

- Spec 005 (commit `580408d`) — `therapist_services.price` → `price_clp`, fix aplicado en `src/features/odontogram/api/odontogramEvalApi.js:172`
- Antes de aplicar fix, Fase 1 del plan auditó los 6 archivos candidatos y confirmó que los otros 5 eran inmunes (consumers no leían `price` directamente)

### Regla operativa

Cuando detectes `42703 column does not exist`:
1. Buscar migración que renombró la columna (git log en `supabase/migrations/`)
2. Grep TODOS los consumidores del nombre viejo
3. Si son 2+, aplicar alias en lugar de propagar

---

## 2. Backfill idempotente + trigger de sincronización para tablas derivadas

### Problema

Una tabla derivada (`patient_care_team`, `care_team`, `clinic_therapists`, etc.) se pobló con un backfill one-shot en una migración inicial. Post-migración, cada INSERT/UPDATE en la tabla padre (`patients`) no propaga al derivado → drift silencioso → RLS policies que consultan el derivado rechazan writes legítimos → violaciones de Constitution III (Audit append-only) pasan desapercibidas.

### Caso histórico (antipatrón)

Migración `20260415100002_populate_organization_model.sql` pobló `patient_care_team` con backfill one-shot sin trigger. Consecuencia: todo paciente creado o reasignado post-15-abril cayó fuera del care team → `is_in_care_team()` devolvió false → policy `cal_dentist_insert` sobre `clinical_audit_log` rechazó writes → **43h de Constitution III violada** (2026-04-18 06:57 → 2026-04-20 02:04 UTC). Gap irrecuperable.

### Patrón canónico

Toda migración que pobla una tabla derivada debe incluir **en el mismo PR**:

1. **Backfill idempotente** — query `INSERT ... ON CONFLICT DO NOTHING` o equivalente. Seguro de re-ejecutar.
2. **Función de sincronización** — maneja la lógica derivada (qué rows crear/actualizar cuando cambia el padre).
3. **Trigger `AFTER INSERT OR UPDATE`** — invoca la función sobre la tabla padre.

Estructura (spec 003, migración `20260419000001_repair_patient_care_team.sql`, 188 líneas):

```sql
-- 1. Backfill idempotente
INSERT INTO patient_care_team (patient_id, therapist_id, clinic_id, is_active)
SELECT p.id, p.therapist_id, p.clinic_id, true
FROM patients p
WHERE p.therapist_id IS NOT NULL
ON CONFLICT (patient_id, therapist_id, clinic_id) DO NOTHING;

-- 2. Función sync
CREATE OR REPLACE FUNCTION sync_patient_care_team() RETURNS TRIGGER AS $$
BEGIN
  -- lógica de sincronización
  INSERT INTO patient_care_team (...)
  VALUES (...)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Triggers sobre la tabla padre
CREATE TRIGGER trg_patients_sync_care_team_insert
  AFTER INSERT ON patients
  FOR EACH ROW EXECUTE FUNCTION sync_patient_care_team();

CREATE TRIGGER trg_patients_sync_care_team_update
  AFTER UPDATE OF therapist_id, clinic_id ON patients
  FOR EACH ROW EXECUTE FUNCTION sync_patient_care_team();
```

### Regla operativa

**Si una migración pobla una tabla derivada cuyos valores son consultados por policies o funciones downstream, el trigger de sincronización va en el mismo PR.** No "después, en otra spec".

### Caso canónico

- Spec 003 (commit `c55d1a5`) — reparación de `patient_care_team` + cierre del gap de 43h
- Docs: `architecture.md` §"Canonical patterns" + `data-compliance.md` §"Historial de compliance"

### Tablas candidatas a auditar

Revisar si tienen backfill sin trigger equivalente: `organization_members`, `clinic_therapists`, `patient_assigned_plans`. Micro-bloque pendiente.

---

## 3. Dedup anti-spam del audit log con `resource_id` en `bucketKey`

### Problema

El hook `useClinicalAccessLogger` deduplica writes al `clinical_audit_log` usando `sessionStorage` con 2 claves: `tupleKey` (dedup intra-mount) y `hourBucketKey` (dedup por hora). Si la `hourBucketKey` omite `resource_id`, la 2ª+ evaluación del mismo paciente en la misma hora queda sin registrar. Edge case silencioso que viola Constitution III (audit append-only de acceso a PHI).

### Patrón correcto

Ambas claves de dedup deben incluir **todas las dimensiones semánticas** del acceso, incluido `resource_id`:

```js
// src/lib/audit/useClinicalAccessLogger.js
function hourBucketKey({ userId, patientId, action, resourceType, resourceId }) {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  return `clinical_audit:${userId}:${patientId}:${action}:${resourceType}:${resourceId ?? ''}:${y}-${m}-${d}-${h}`;
}

// En el hook (línea ~46):
const bucket = hourBucketKey({ userId, patientId, action, resourceType, resourceId });
```

### Regla operativa

**Toda dimensión que distingue dos accesos semánticamente distintos debe estar en la bucketKey.** Si logs un acceso al odontograma de paciente X (recurso Y) y luego accedes al odontograma del mismo paciente X (recurso Z), son dos eventos diferentes — ambos deben quedar en el audit log.

### Caso canónico

- Spec 004 (commit `8acef16`) — fix de 1 línea al `hourBucketKey` + callsite
- Gap detectado durante implementación de spec 003

### Checklist al crear nuevos logs de audit

Antes de mergear un hook nuevo que escribe a `clinical_audit_log`:
- [ ] ¿La bucketKey incluye `userId`?
- [ ] ¿`patientId` / `resource_id` / `resourceType`?
- [ ] ¿El bucket temporal (hora/minuto) es apropiado para el patrón de uso?
- [ ] ¿Qué pasa si el mismo user accede a 2 recursos del mismo tipo/paciente en la misma hora? Ambos deben registrarse.

---

## 4. Audit defensivo en Phase 1 del plan antes de propagar fixes

### Problema

Cuando un bug aparece en 1 archivo con un patrón sospechoso (schema drift, naming inconsistency, dedup gap, etc.), el instinto es aplicar el fix inmediatamente. Riesgo: el mismo patrón existe en otros archivos y el fix queda parcial → deuda oculta → reaparición del bug en otro contexto.

### Patrón

La Phase 1 del plan debe **auditar todos los archivos "sospechosos" que podrían tener el mismo patrón** antes de escribir código.

Flujo:

1. Detectar bug en archivo A con patrón P
2. Grep patrón P en todo `src/` → lista de N candidatos
3. Para cada candidato:
   - Confirmar si tiene el mismo bug (no lo tiene → inmune)
   - O detectar variante del bug (lo tiene → entra al scope)
4. Decidir scope del fix:
   - Solo A → documentar los N-1 inmunes
   - A + M variantes → ampliar spec antes de implementar

### Regla operativa

**Nunca arrancar Phase 2 con scope ampliado post-implementación.** Si al escribir código descubres más archivos afectados, detén y vuelve a Phase 1.

### Caso canónico

- Spec 005 (commit `580408d`) — Fase 1 confirmó que los 6 archivos candidatos consumidores de `therapist_services` eran todos inmunes (5 de los 6 no leían `price` directamente) antes de aplicar el fix de 1 línea en el único archivo afectado

---

## 5. Preventive mini-audit con `information_schema` + grep dirigido

### Problema

Tras cerrar un bug de schema drift, quedan sospechas: ¿habrá otros drift similares ocultos? El bug podría estar latente esperando a que un nuevo consumer lo dispare.

### Patrón

**Mini-auditoría de ~10 min con 2 herramientas:**

1. **Queries a `information_schema.columns`** — listar columnas sospechosas por tabla:

   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'X'
     AND column_name IN ('legacy_name', 'new_name', 'variant_name');
   ```

2. **Grep dirigido en `src/`** — para cada columna detectada, buscar consumers:

   ```
   grep "from('X')" src/ + verificar si accede al campo sospechoso
   ```

3. **Tabla de verdad por candidato:**

   | Candidato | DB tiene | Código usa | Veredicto |
   |---|---|---|---|
   | X.legacy | sí | sí | 🔴 drift funcional |
   | X.both | ambos | legacy | 🟡 deuda, no bug |
   | X.new | solo new | new | ✅ limpio |

### Regla operativa

Post-cualquier spec de schema drift, correr la mini-auditoría sobre tablas adyacentes. Tiempo invertido << tiempo de encontrar otro 42703 en producción.

### Caso canónico

- Audit 2026-04-20 post-spec 005 — 5 queries sobre 5 tablas sospechosas (clinics, patients, appointments, membership_plans, patients.attention_type). Resultado: 3 verde · 2 amarillo · 0 rojo. Documentado en `architecture.md` §"Known drift non-urgent"

---

## 6. False positive detection — verificar hook body antes de declarar compliance gap

### Problema

Un gap de Constitution III aparente ("archivo X lee PHI pero no invoca `useClinicalAccessLogger`") puede ser un FALSE POSITIVE si el hook está intencionalmente diseñado para filtrar ese caso (ej: excluir auto-acceso del paciente a su propia ficha).

### Patrón

ANTES de abrir spec "fix missing audit logger":

1. Leer el BODY de `useClinicalAccessLogger.js` (no solo la signature).
2. Verificar condiciones early-return (`isClinicalRole`, user context, etc.).
3. Cruzar con legislación citada (Ley 20.584 art. 13 habla de **terceros**, no auto-acceso).
4. Analizar callsites existentes que SÍ funcionan — ¿qué caso cubren?
5. Solo si (1)-(4) coinciden en que el gap es real → abrir spec.

### Regla operativa

"Gap de compliance aparente" NO implica "gap real" hasta que se verifica body + intent legal + callsites existentes.

### Caso canónico

Spec 008 `fix-audit-logger-missing-on-patient-dashboard` REJECTED durante pre-plan research. El hook excluye rol `patient` intencionalmente (early return en `src/lib/audit/useClinicalAccessLogger.js:31-36`), alineado con intent legal (Ley 20.584 art. 13 regula transparencia sobre accesos de TERCEROS, no auto-consulta). Ver `specs/008-fix-audit-logger-missing-on-patient-dashboard/spec.md` §"Spec rejected — false positive". Esta lección motivó Constitution §III v1.1.0 con clarificación explícita.

---

## 7. State drift re-verification entre phases

### Problema

Entre Phase 1 (audit) y Phase 2 (implementation) de un spec que toca DB, el estado puede cambiar (otro proceso crea/modifica policies, alguien experimenta con SQL, CI corre algo). Si Phase 2 asume el snapshot de Phase 1 está vigente, pre-check puede fallar con error confuso.

### Patrón

ANTES de apply de migration en Phase 3 (o antes de commit de Phase 2):

1. Re-ejecutar la query de audit crítica de Phase 1 (`pg_policies`, `pg_indexes`, `information_schema.columns` según el caso).
2. Comparar con snapshot Phase 1.
3. Si estado cambió:
   - Evaluar si es favorable (ej: policy que ibas a crear ya existe).
   - Ajustar scope del spec SIN descartar Phase 1 (pivot documentado).
   - O abortar si el cambio contradice assumptions del spec.
4. Documentar el state drift en `data-model.md` con razonamiento del pivot.

### Regla operativa

"El estado de la DB en Phase 1 NO es garantía del estado en Phase 3." Re-verify antes de `ENABLE RLS`, `ALTER TABLE`, `DROP POLICY`, o cualquier operación que dependa de snapshot previo.

### Caso canónico

Spec 009 `restore-marketplace-purchases-policies` — Phase 1 mostró 1 policy (`"Admins update"`), Phase 2 re-check reveló **2 policies** (la nueva `"Vendors read own plan purchases"` fue inyectada durante Phase 1 por el usuario experimentando con preview SQL). Pivot X2→X1 documentado en `specs/009-restore-marketplace-purchases-policies/data-model.md` §"Phase 1 State Drift Discovery". Sin re-verify, el apply de Phase 3 habría abortado con pre-check FAIL esperando 1 policy y encontrando 2.

---

## Referencias

- `constitution.md` — 6 principios no-negociables
- `architecture.md` — mapa técnico, sección "Canonical patterns" y "Known drift non-urgent"
- `data-compliance.md` — historial de compliance, distinción `clinical_audit_log` vs `clinical_access_log`
- `ecosystem-communicare.md` — estos patrones son reusables en FONOKIT y futuros SaaS del ecosistema

---

**Last updated**: 2026-04-20 | **Source**: ciclo de specs 001-005 + preventive audit post-005 + specs 008 (false positive detection) + 009 (state drift re-verification) — patrones 6 y 7 añadidos
