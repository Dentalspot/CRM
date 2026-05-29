# Quickstart — Appointment Dentist Assignment

**Spec**: 028 | **Date**: 2026-05-29

Pasos manuales para validar el feature de punta a punta. Se asume entorno local con `npm run dev` corriendo en el worktree `keen-mirzakhani-49256e`.

---

## Pre-requisitos

- Cuenta `cristobal.tagle@dentalspot.cl` (dentista + clinic_admin de Odontología Los Álamos)
- Cuenta `pablo.ceballos@dentalspot.cl` (dentista de Odontología Los Álamos — crear vía invitación si no existe)
- Cuenta `tatiana.assistant@dentalspot.cl` (asistente de Odontología Los Álamos)
- Al menos 1 box activo en la clínica (Box 1)
- Al menos 1 paciente existente en la org

---

## 0. Pre-checks DB antes de aplicar migration

```bash
npx supabase db query --linked < specs/028-appointment-dentist-assignment/quickstart-precheck.sql
```

Donde `quickstart-precheck.sql` contiene:
```sql
-- 1) Confirmar que therapist_id NO tiene NULLs (asunción crítica)
SELECT COUNT(*) FROM appointments WHERE therapist_id IS NULL;
-- Esperado: 0

-- 2) Detectar citas con therapist_id que NO es dentista activo de la org
-- (el trigger nuevo las bloquearía en UPDATE futuro pero las existentes
-- quedan visibles — esto es solo para reporte)
SELECT a.id, a.therapist_id, a.organization_id, p.full_name
FROM appointments a
LEFT JOIN profiles p ON p.id = a.therapist_id
WHERE a.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = a.therapist_id
      AND om.organization_id = a.organization_id
      AND om.role = 'dentist'
      AND om.is_active = true
  )
LIMIT 50;
-- Si retorna rows: documentar (no bloquea deploy — el trigger es BEFORE
-- INSERT/UPDATE, no afecta data existente)

-- 3) Confirmar policies appt_dentist_update existe
SELECT polname, polqual FROM pg_policy WHERE polname = 'appt_dentist_update';
-- Esperado: 1 row con USING clause actual

-- 4) Confirmar CHECK constraints actuales en clinical_audit_log
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.clinical_audit_log'::regclass
  AND conname LIKE '%check';
-- Esperado: ver action_check y resource_type_check con vocabulario histórico

-- 5) Verificar que cristobal+ceballos son ambos dentistas activos en Los Álamos
SELECT om.user_id, p.full_name, om.role, om.is_active
FROM organization_members om
JOIN profiles p ON p.id = om.user_id
WHERE om.organization_id = (SELECT id FROM organizations WHERE name ILIKE '%Los Álamos%' LIMIT 1)
ORDER BY p.full_name;
-- Esperado: cristobal con roles ['dentist','clinic_admin'] + ceballos con ['dentist'] + tatiana con ['assistant']
```

---

## 1. Aplicar migration

```bash
# Local
npx supabase migration up

# O prod (cuando Danissa apruebe):
npx supabase db push
```

---

## 2. Smoke verification post-migration

```bash
npx supabase db query --linked < specs/028-appointment-dentist-assignment/quickstart-postcheck.sql
```

Donde `quickstart-postcheck.sql`:
```sql
-- 1) Trigger existe
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'trg_check_appointment_dentist' AND NOT tgisinternal;
-- Esperado: 1 row con tgenabled='O' (origin)

-- 2) Policy nueva tiene WITH CHECK
SELECT polname,
       pg_get_expr(polqual, polrelid) AS using_expr,
       pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy
WHERE polname = 'appt_dentist_update';
-- Esperado: 1 row con with_check_expr no-null

-- 3) CHECKs expandidos
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname IN (
  'clinical_audit_log_action_check',
  'clinical_audit_log_resource_type_check'
);
-- Esperado: definiciones incluyen 'view','create','update','cancel',
-- 'appointment_reassigned', 'appointment'

-- 4) Test funcional 1: insertar audit log con action nueva
INSERT INTO clinical_audit_log (
  organization_id, user_id, patient_id,
  action, resource_type, resource_id
) VALUES (
  (SELECT id FROM organizations LIMIT 1),
  (SELECT id FROM profiles LIMIT 1),
  (SELECT id FROM patients LIMIT 1),
  'appointment_reassigned', 'appointment', gen_random_uuid()
);
-- Esperado: INSERT 0 1 (sin error de CHECK)
ROLLBACK;
```

---

## 3. Smoke UX — Asistente crea cita en modo "Todos los dentistas"

1. Login con `tatiana.assistant@dentalspot.cl`
2. Navegar a `/dashboard/assistant/agenda`
3. **VERIFICAR (FR-007 layout)**: arriba a la izquierda hay un Card teal "Ubicación" con dropdowns en este orden:
   - Clínica: "Odontología Los Álamos"
   - Box: "Box 1"
   - Dentista: "Todos los dentistas" (default)
4. **VERIFICAR (FR-005 visual)**: el calendario muestra citas pre-existentes con `border-l-4` de color, footer "Dr. {apellido}" si hay >1 dentista
5. Click en slot libre martes 10:00
6. **VERIFICAR**: se abre `AssistantAppointmentModal`. Campo "Dentista *" vacío con placeholder "Seleccionar dentista"
7. Intentar submit sin seleccionar dentista → botón "Crear cita" disabled (FR-001)
8. Seleccionar "Dr. Cristobal Tagle"
9. Seleccionar paciente, completar form, click "Crear cita"
10. **VERIFICAR**: toast verde "Cita creada"
11. **VERIFICAR (audit)**: en SQL editor:
   ```sql
   SELECT action, resource_type, resource_id, reason, created_at
   FROM clinical_audit_log
   WHERE user_id = (SELECT id FROM profiles WHERE email = 'tatiana.assistant@dentalspot.cl')
   ORDER BY created_at DESC LIMIT 1;
   ```
   Esperado: 1 row con action='create', resource_type='appointment'

---

## 4. Smoke UX — Filtro por dentista persistido en URL

1. Sigue logueada como tatiana
2. En el dropdown "Dentista" del Card teal, seleccionar "Dr. Pablo Ceballos"
3. **VERIFICAR (FR-009)**: el calendario se filtra a las citas de Ceballos
4. **VERIFICAR (FR-010)**: la URL muestra `?dentist=<uuid_ceballos>`
5. **VERIFICAR**: refresh (Ctrl+R) → filtro permanece, citas siguen filtradas
6. **VERIFICAR (FR-011)**: editar manualmente URL a `?dentist=00000000-0000-0000-0000-000000000000` (uuid inválido)
7. Refresh → el dropdown vuelve a "Todos los dentistas", URL se limpia automáticamente
8. Volver a "Todos los dentistas" → URL pierde el query param

---

## 5. Smoke UX — Dentista logueado crea cita con default auto-self

1. Logout, login con `cristobal.tagle@dentalspot.cl` (admin+dentista)
2. Navegar a `/dashboard/calendar` (vista propia)
3. Click "+ Agendar Cita"
4. **VERIFICAR (FR-004 default smart)**: campo "Dentista" pre-seleccionado con "Dr. Cristobal Tagle"
5. Cambiar a "Dr. Pablo Ceballos" (pase de paciente)
6. Completar form y submit
7. **VERIFICAR**: cita creada con `therapist_id = ceballos.uuid`
8. **VERIFICAR (audit)**: entry en clinical_audit_log con action='create'

---

## 6. Smoke UX — Reasignación de cita (admin)

1. Logueado como cristobal (admin)
2. Navegar a `/dashboard/clinic/agendas`
3. Click en cualquier cita de Dr. Ceballos
4. En el modal de edición, cambiar dropdown "Dentista" de "Dr. Ceballos" a "Dr. Tagle"
5. **VERIFICAR**: aparece warning amber "Esta cita se reasignará a otro dentista. La acción quedará registrada."
6. Submit "Guardar cambios"
7. **VERIFICAR (audit FR-017)**:
   ```sql
   SELECT action, resource_id, reason
   FROM clinical_audit_log
   WHERE action = 'appointment_reassigned'
   ORDER BY created_at DESC LIMIT 1;
   ```
   Esperado: 1 row con reason = "from:<uuid_ceballos>;to:<uuid_tagle>"

---

## 7. Smoke UX — Dentista NO puede robar cita ajena (FR-014)

1. Logout, login como `pablo.ceballos@dentalspot.cl` (solo dentista, no admin)
2. Navegar a `/dashboard/calendar`
3. Ceballos solo ve sus propias citas (RLS appt_dentist_select)
4. NO debería ver la cita reasignada en paso 6 (porque ahora es de Tagle)
5. Intentar acceder vía URL directa con id de cita ajena → modal carga pero campo "Dentista" disabled
6. (Alternativa) Probar vía REST con curl/Postman:
   ```bash
   # Como Ceballos, intentar UPDATE de cita ajena
   curl -X PATCH "https://<project>.supabase.co/rest/v1/appointments?id=eq.<cita_de_tagle>" \
     -H "apikey: $ANON" -H "Authorization: Bearer $CEBALLOS_TOKEN" \
     -d '{"therapist_id":"<uuid_ceballos>"}'
   ```
   Esperado: HTTP 204 No Content (RLS bloquea — no afecta filas)

---

## 8. Smoke UX — Trigger DB bloquea cross-org (FR-022)

1. En SQL editor, como service_role (saltea RLS), intentar INSERT cross-org:
   ```sql
   INSERT INTO appointments (
     patient_id, therapist_id, organization_id, clinic_id,
     date, start_time, end_time, status
   ) VALUES (
     (SELECT id FROM patients WHERE organization_id = (SELECT id FROM organizations WHERE name ILIKE '%Los Álamos%') LIMIT 1),
     (SELECT om.user_id FROM organization_members om
        JOIN organizations o ON o.id = om.organization_id
        WHERE o.name NOT ILIKE '%Los Álamos%' AND om.role = 'dentist'
        LIMIT 1),
     (SELECT id FROM organizations WHERE name ILIKE '%Los Álamos%' LIMIT 1),
     (SELECT id FROM clinics WHERE name ILIKE '%Los Álamos%' LIMIT 1),
     CURRENT_DATE + 1, '10:00', '10:30', 'scheduled'
   );
   ```
2. **VERIFICAR**: ERROR `dentist_not_active_in_org: el usuario <uuid> no es dentista activo de la org <uuid>`

---

## 9. Smoke UX — Visual diferenciación entre dentistas

1. Login como tatiana
2. Navegar a `/dashboard/assistant/agenda` con filtro "Todos los dentistas"
3. **VERIFICAR (FR-005)**: cada chip de cita tiene border-l-4 de color
4. **VERIFICAR (FR-006)**: las citas del Dr. Tagle TODAS tienen el mismo color, las del Dr. Ceballos TODAS otro color
5. **VERIFICAR**: los chips muestran "Dr. Tagle" o "Dr. Ceballos" como footer chico
6. Filtrar a "Solo Dr. Ceballos" → solo aparecen chips de él
7. Volver a "Todos" → ambos colores vuelven a aparecer

---

## 10. Rollback de prueba (opcional, local)

Si algo falla en el smoke:

```bash
# Down-migrate
npx supabase db reset --linked --no-seed
# (recarga TODAS las migrations — destructivo en local, NO usar en prod)

# O rollback manual de la migration:
psql ... < specs/028-appointment-dentist-assignment/contracts/migration-20260529000001.md
# (copiar el bloque de rollback de la sección "Reversibilidad")
```

---

## Criterios de aceptación final (paste en el reporte post-implement)

- [ ] Pre-check DB: 0 NULL therapist_ids, 0 cross-org appointments
- [ ] Migration aplicada sin errores
- [ ] Post-check DB: trigger existe, policy tiene WITH CHECK, CHECKs expandidos
- [ ] Asistente crea cita seleccionando dentista (test §3) — `audit log` registrado
- [ ] Filtro URL persiste y se valida cross-org (test §4)
- [ ] Default smart dentist+admin = self (test §5)
- [ ] Reasignación admin con `appointment_reassigned` registrado (test §6)
- [ ] Dentista NO puede robar cita ajena (test §7)
- [ ] Trigger DB bloquea cross-org (test §8)
- [ ] Visual border + footer (test §9)
- [ ] Sin regresiones en flujo existente (asistente puede editar cita propia, admin puede crear cita de la org)
