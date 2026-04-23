# Quickstart — Smoke Test Manual

**Feature**: 023-invite-assistant-flow
**Audiencia**: tester (founder, beta admin)
**Tiempo estimado**: 20-30 min end-to-end

Test manual post-implementation. Objetivo: validar los 4 user stories del spec con flujos reales. Si algún step falla, no mergear a main.

---

## Pre-requisitos

- [ ] Migration `20260423000001_add_assistant_lab_to_user_role.sql` aplicada (✅ ya aplicada)
- [ ] Migration `20260423000002_invite_assistant_flow.sql` aplicada
- [ ] Edge function `clinic-invitations` deployada con código nuevo
- [ ] Frontend build desplegado (o `npm run dev` local)
- [ ] Email confirmation desactivada en Supabase (para testing rápido) O tenés acceso a inbox de Gmail/email real
- [ ] `RESEND_API_KEY` seteada en Supabase Edge Functions secrets

**Preparar cuentas de test**:

1. `dentalspot.cl+clinica-test@gmail.com` → clínica admin existente
2. `dentalspot.cl+asistente-test@gmail.com` → email a invitar (cuenta NUEVA)
3. Otra cuenta con paciente existente si querés probar el flow "existing_patient"

---

## US1: Admin invita asistente (P1)

### Steps

1. Login como clínica admin (cuenta del paso de pre-req).
2. Desde dashboard, navegar a `/dashboard/clinic/team` (nueva página "Gestión de equipo").
3. Verificar que carga la página con:
   - [ ] Título "Gestión de equipo"
   - [ ] Botón "Invitar asistente"
   - [ ] Sección "Asistentes activos" (vacía en primer uso)
   - [ ] Sección "Invitaciones pendientes" (vacía en primer uso)
4. Click "Invitar asistente". Se abre modal.
5. Completar form:
   - Email: `dentalspot.cl+asistente-test@gmail.com`
   - Mensaje (opcional): "Hola! Te sumo al equipo"
6. Click "Enviar invitación".
7. Esperar ~2 segundos.
8. Verificar:
   - [ ] Toast verde "Invitación enviada"
   - [ ] Modal se cierra
   - [ ] Invitación aparece en "Invitaciones pendientes" con email + fecha + acción "Cancelar"

### Verificar DB

```sql
SELECT id, email, role, status, expires_at, existing_patient, created_at
FROM clinic_invitations
WHERE email = 'dentalspot.cl+asistente-test@gmail.com'
ORDER BY created_at DESC LIMIT 1;
```

**Esperado**:
- `role = 'assistant'`
- `status = 'pending'`
- `expires_at` ≈ NOW() + 7 días
- `existing_patient = false` (si el email no tenía cuenta antes)

### Verificar email

- [ ] Email llega al inbox de Gmail (`dentalspot.cl@gmail.com` con alias +asistente-test)
- [ ] Asunto: "... te invita como asistente a [ClinicaName]"
- [ ] Contiene link de tipo `https://dentalspot.cl/invite/<token>`

---

## US1 edge cases

### E1: Email de dentista existente

1. Tratar de invitar `dentalspot.cl+dentista@gmail.com` (si lo registraste previamente como dentista).
2. **Esperado**: toast de error amable "Este email ya tiene cuenta profesional. Contactá soporte."
3. No se crea invitación.

### E2: Invitación duplicada

1. Con invitación de US1 todavía pendiente, tratar de invitar el MISMO email.
2. **Esperado**: error "Ya existe invitación pendiente para este email."

### E3: Rate limit

1. Crear 10 invitaciones diferentes a emails distintos.
2. Tratar de crear la 11ª.
3. **Esperado**: error "Límite de 10 invitaciones pendientes alcanzado."

---

## US2: Asistente acepta invitación (P1)

### Caso A: Cuenta nueva (no existing_patient)

1. En otra ventana/browser (o incognito), abrir el link del email.
2. Verificar InviteAcceptPage muestra:
   - [ ] Título "Invitación a colaborar" (o similar para asistente)
   - [ ] Nombre de la clínica
   - [ ] Mensaje del admin si lo puso
   - [ ] Botones: "Iniciar sesión" / "Crear cuenta"
3. Click "Crear cuenta" → debería ir a `/auth/register?token=<token>`
4. Verificar AuthPage:
   - [ ] Email pre-llenado con `dentalspot.cl+asistente-test@gmail.com`
   - [ ] Tipo de cuenta pre-seleccionado como "Asistente" (badge)
   - [ ] Campo "Código descuento" NO visible (asistente = gratis o no aplica)
5. Completar form:
   - Nombre: "Asistente Test"
   - Password: `TestDS2026!`
6. Click "Registrarse" (o "Crear cuenta").
7. Esperar redirect.
8. **Esperado**: aterrizar en `/dashboard/assistant` con:
   - [ ] Nombre del asistente visible en header
   - [ ] Contexto de la clínica (nombre visible en algún lado)

### Verificar DB post-accept

```sql
-- Invitation marcada accepted
SELECT status, accepted_at FROM clinic_invitations
WHERE email = 'dentalspot.cl+asistente-test@gmail.com';
-- Esperado: status='accepted', accepted_at ≈ NOW()

-- Membership creada
SELECT om.*, o.name AS org_name
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = (
  SELECT id FROM auth.users WHERE email = 'dentalspot.cl+asistente-test@gmail.com'
);
-- Esperado: 1 row con role='assistant', is_active=true
```

### Caso B: Email ya tiene cuenta de paciente

1. Pre-setup: registrar un paciente con `dentalspot.cl+paciente-test@gmail.com`.
2. Login como admin, invitar este email como asistente.
3. Abrir el link del email en otro browser (logout primero).
4. Esperado:
   - [ ] InviteAcceptPage detecta `existing_patient=true`
   - [ ] Botón principal es "Iniciar sesión" (no "Crear cuenta")
5. Click "Iniciar sesión" → `/auth/login?token=<token>`
6. Email pre-llenado. Poner password del paciente. Login.
7. **Esperado**: redirect a `/dashboard/assistant` (organización ampliada, no dashboard de paciente).
8. Verificar DB: `profile.role` sigue siendo `'patient'`, pero `organization_members` tiene el nuevo row `role='assistant'`.

### Caso C: Token expirado

1. Manualmente en DB, forzar `expires_at` de una invitación a NOW() - 1 hour.
2. Abrir link.
3. **Esperado**: mensaje "Invitación expirada", botón "Volver al inicio".

### Caso D: Token inválido (editado)

1. Cambiar un carácter del token en el link.
2. Abrir.
3. **Esperado**: mensaje "Enlace inválido".

---

## US3: Asistente trabaja con permisos limitados (P2)

### Setup

- Logueado como asistente test (del paso US2).

### 3.1 Puede ver agenda

1. Navegar a `/dashboard/assistant/agenda`.
2. **Esperado**:
   - [ ] Carga sin errores
   - [ ] Muestra citas de los dentistas de la clínica (aunque el asistente no creó ninguna)
3. Crear una cita nueva:
   - Click "Nueva cita"
   - Seleccionar paciente (de la lista), dentista (de la clínica), fecha, hora
   - Guardar
4. **Esperado**: toast "Cita creada" + cita aparece en calendario.

### 3.2 Puede ver lista de pacientes

1. Navegar a `/dashboard/assistant/patients` (o equivalente).
2. **Esperado**: lista con nombre, email, teléfono, próxima cita, dentista asignado.
3. **NO esperado**: columna de "historia clínica", ni link "Ver ficha".

### 3.3 NO puede ver ficha clínica (URL directa)

1. Abrir DevTools, identificar un `patient_id` real de la clínica.
2. Navegar directamente a `/dashboard/patients/<patient_id>` (URL de ficha clínica).
3. **Esperado**: una de estas:
   - Redirect a lista de pacientes con toast "Sin permiso"
   - Página en blanco / empty state con mensaje "No tenés acceso a fichas clínicas"
   - Redirect a `/dashboard/assistant`
4. Verificar en DevTools Network:
   - [ ] Request a `clinical_records` / `treatments` / `odontograms` retorna `[]` o 403 (RLS bloquea)

### 3.4 NO puede tocar billing

1. Navegar a `/dashboard/membership` directamente.
2. **Esperado**: "No tenés permiso para ver esta sección" o redirect.

### 3.5 NO puede invitar a otros asistentes

1. Tratar de abrir `/dashboard/clinic/team`.
2. **Esperado**: bloqueado (solo clinic admin puede).

### 3.6 Audit log

1. Después de los pasos 3.1-3.2, verificar DB:
   ```sql
   SELECT * FROM clinical_audit_log
   WHERE user_id = '<assistant_user_id>'
   ORDER BY created_at DESC LIMIT 10;
   ```
2. **Nota según R-04**: listing de pacientes por asistente NO genera log (es admin, no clínico). Solo si el asistente de alguna forma accediera a ficha clínica (lo cual debería estar bloqueado) se loguearía. Si en 3.3 se registró un intento bloqueado, genial. Si no, validar que en el código de ficha clínica SE invoca el hook antes del fetch (documented behavior, aunque el fetch falle por RLS).

---

## US4: Admin gestiona asistentes (P3)

### 4.1 Ver lista

1. Login como admin clínica.
2. Navegar a `/dashboard/clinic/team`.
3. **Esperado**: sección "Asistentes activos" muestra al asistente de US2 con:
   - [ ] Nombre completo
   - [ ] Email
   - [ ] Fecha de alta
   - [ ] Botón "Revocar acceso"

### 4.2 Revocar

1. Click "Revocar acceso" al asistente.
2. Diálogo de confirmación: "¿Seguro que querés revocar el acceso?"
3. Click "Confirmar".
4. **Esperado**:
   - [ ] Toast "Acceso revocado"
   - [ ] Asistente ya no aparece en "Activos"
5. Verificar DB:
   ```sql
   SELECT is_active, deactivated_at FROM organization_members
   WHERE user_id = '<assistant_user_id>';
   -- Esperado: is_active=false, deactivated_at ≈ NOW()
   ```

### 4.3 Asistente pierde acceso

1. En la ventana del asistente, refrescar página.
2. **Esperado**: ya no está en `/dashboard/assistant`. Se lo redirige a:
   - Dashboard paciente (si tenía cuenta de paciente preexistente)
   - Mensaje "tu acceso fue revocado" + logout
3. Si intenta ir a `/dashboard/assistant/agenda` directamente → bloqueado.

### 4.4 Reactivar re-invitando

1. Como admin, invitar al mismo email otra vez.
2. Asistente abre link, acepta (login con su password ya existente).
3. **Esperado**: reactivación (no crea row duplicado).
4. Verificar DB:
   ```sql
   SELECT id, is_active, deactivated_at FROM organization_members
   WHERE user_id = '<assistant_user_id>' AND role = 'assistant';
   -- Esperado: 1 row (mismo id que antes), is_active=true, deactivated_at=null
   ```

---

## Cleanup post-test

```sql
-- Eliminar invitaciones de test
DELETE FROM clinic_invitations WHERE email LIKE 'dentalspot.cl+%-test@gmail.com';

-- Eliminar membership de test
DELETE FROM organization_members
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'dentalspot.cl+%-test@gmail.com'
);

-- Eliminar cuenta de test (via Supabase dashboard → Authentication → Users → delete)
```

---

## Criterios de aceptación global (cierre del spec)

Para mergear el feature:

- [ ] US1 y edge cases E1-E3 pasan 100%
- [ ] US2 casos A, B, C, D pasan 100%
- [ ] US3 sub-steps 3.1 a 3.6 pasan 100%
- [ ] US4 sub-steps 4.1 a 4.4 pasan 100%
- [ ] Verificaciones DB de cada step confirman shape esperado
- [ ] No errores en console del browser (excepto avisos conocidos del entorno dev)
- [ ] No errores 500 en Supabase Edge Functions Logs durante el test
- [ ] Performance subjetiva OK (ningún step tarda >3 seg en UI)

Si algún criterio falla → log bug en `docs/session-logs/` + abrir micro-bloque de fix antes de merge.
