# Contract: `clinic-invitations` Edge Function (Extended)

**Feature**: 023-invite-assistant-flow
**File**: `supabase/functions/clinic-invitations/index.ts`
**Change type**: EXTEND — backward-compatible, agregar `role` discriminator.

Base URL: `${SUPABASE_URL}/functions/v1/clinic-invitations`
Auth: Bearer token (Supabase session) — required para algunas actions (documentadas below)
Content-Type: `application/json`

---

## Actions summary

| Action | Auth required | Change | Backward compat |
|---|---|---|---|
| `create` | ✅ Yes (clinic admin) | Extender con `role` param | ✅ default `role='therapist'` |
| `list` | ✅ Yes (clinic admin) | No change functional; consumers filtran por role | ✅ |
| `validate` | ❌ No | Incluir `role` en response para que frontend ruteé | ✅ agregar campo, no quita |
| `accept` | ✅ Yes (invitee) | Branch por `role` (therapist → clinic_therapists, assistant → organization_members) | ✅ |
| `reject` | ❌ No (usa token) | No change | ✅ |
| `cancel` | ✅ Yes (admin) | No change | ✅ |

---

## `create` — Extended

**Request**:
```json
{
  "action": "create",
  "clinic_id": "uuid",
  "email": "string",
  "message": "string (optional)",
  "role": "therapist" | "assistant"  // NEW — default "therapist" if omitted
}
```

**Headers**: `Authorization: Bearer <session_token>` — must be clinic owner or admin.

**Validaciones nuevas (role='assistant')**:

1. Si `profiles.role` de ese email es `'therapist'` o `'clinic'`:
   - Response 200 `{success: false, message: "Este email ya tiene cuenta profesional. Contactá soporte."}`

2. Si `clinic_invitations` ya tiene pendiente con mismo clinic_id + email (cualquier rol):
   - Response 200 `{success: false, message: "Ya existe invitación pendiente para este email."}`

3. Si `COUNT(clinic_invitations WHERE clinic_id=X AND status='pending') >= 10`:
   - Response 200 `{success: false, message: "Límite de 10 invitaciones pendientes alcanzado. Cancelá alguna antes de crear más."}`

**Lookup `existing_patient`**:
- Si `profiles.role === 'patient'` → `existing_patient = true`
- Else → `existing_patient = false`

**Insert en clinic_invitations**:
- `role` ← body.role (validado IN ('therapist', 'assistant'))
- `expires_at` ← NOW() + INTERVAL '7 days'
- `existing_patient` ← según lookup
- `token` ← `crypto.randomUUID()`
- `status` ← 'pending'

**Email template** (branch por role):
- Subject assistente: `"{inviterName} te invita como asistente a {clinicName}"`
- Subject therapist (unchanged): `"{inviterName} te invita a {clinicName}"`
- CTA button: `"Aceptar invitación"` (ambos)

**Response success**:
```json
{ "success": true, "emailSent": true, "invitation_id": "uuid" }
```

**Response error** (4xx / 5xx preservados del flow actual).

---

## `list` — No change

**Request**:
```json
{ "action": "list", "clinic_id": "uuid" }
```

**Headers**: `Authorization: Bearer <session_token>` — must be clinic owner.

**Response** (shape existing, incluye `role` y `expires_at` automáticamente porque SELECT *):
```json
{
  "success": true,
  "invitations": [
    {
      "id": "uuid",
      "email": "string",
      "status": "pending" | "accepted" | "rejected" | "cancelled",
      "role": "therapist" | "assistant",
      "expires_at": "2026-04-30T...",
      "existing_patient": false,
      "created_at": "...",
      ...
    }
  ]
}
```

**Consumer note**: frontend debe filtrar por role para mostrar en tab correspondiente (TherapistInvitationsPanel vs AssistantInvitationsList).

---

## `validate` — Extended

**Request**:
```json
{ "action": "validate", "token": "uuid" }
```

**No auth required**.

**Response success** (extender con role + existing_patient):
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "string",
    "role": "therapist" | "assistant",
    "existing_patient": boolean,
    "expires_at": "...",
    "clinics": {
      "id": "uuid",
      "name": "string",
      "address": "string"
    }
  }
}
```

**Validaciones nuevas**:
- Si `status != 'pending'`: response 200 `{success: false, message: "Invitación ya fue usada o cancelada."}`
- Si `expires_at < NOW()`: response 200 `{success: false, message: "Invitación expirada."}`

---

## `accept` — Extended (branch por role)

**Request**:
```json
{ "action": "accept", "token": "uuid" }
```

**Headers**: `Authorization: Bearer <session_token>` — user must be authenticated.

**Behavior**:

1. Lookup invitation by token WHERE status='pending' AND expires_at > NOW().
2. Validate authenticated user's email matches `invitation.email` (warning toast if mismatch, per InviteAcceptPage actual behavior — pero backend permite accept con warning).
3. Branch por role:
   - `role === 'therapist'` → existing flow: INSERT `clinic_therapists`
   - `role === 'assistant'` → new flow:
     - Fetch `clinic.organization_id`. If null, throw error "Clínica sin organización asociada".
     - Check existing `organization_members` row (user_id, organization_id, role='assistant').
     - If exists AND is_active=false: UPDATE is_active=true, deactivated_at=null (reactivation).
     - If exists AND is_active=true: noop (idempotent).
     - If not exists: INSERT new row (organization_id, user_id, role='assistant', is_active=true, invited_by=invitation.invited_by).
4. UPDATE invitation SET status='accepted', accepted_at=NOW().

**Response success**:
```json
{ "success": true, "role": "assistant", "redirect_to": "/dashboard/assistant" }
```

**Response error**:
- 400 `{success: false, message: "Invitación inválida o expirada"}`
- 400 `{success: false, message: "Clínica sin organización asociada (contactá soporte)"}`

---

## `reject` — No change (existing flow)

**Request**:
```json
{ "action": "reject", "token": "uuid" }
```

No auth required. UPDATE status='rejected', rejected_at=NOW().

---

## `cancel` — No change (existing flow)

**Request**:
```json
{ "action": "cancel", "invite_id": "uuid" }
```

Auth required (clinic admin). UPDATE status='cancelled', cancelled_at=NOW().

---

## Error model (consistent across actions)

- 200 with `{success: false, message: "..."}` → business logic failure (user-facing message)
- 400 → request validation error
- 401 → unauthorized (missing or invalid token)
- 500 → internal error (logged, generic message to user)

---

## Side effects summary

| Action | DB writes | Email sent | Async? |
|---|---|---|---|
| `create` | INSERT clinic_invitations | ✅ Resend | No (awaits before responding) |
| `list` | None (SELECT only) | No | No |
| `validate` | None | No | No |
| `accept` | INSERT/UPDATE organization_members OR clinic_therapists + UPDATE clinic_invitations | No | No |
| `reject` | UPDATE clinic_invitations | No | No |
| `cancel` | UPDATE clinic_invitations | No | No |

---

## Rate limits

- `create`: max 10 pending por clinic_id (enforced en action logic)
- Supabase edge function default rate limits aplican (compartidos con otras actions del proyecto)

---

## Auth & RLS interaction

Edge function usa `SUPABASE_SERVICE_ROLE_KEY` internamente → bypassa RLS. Por eso toda validación de autoridad (`user must be clinic owner`, `user must match invite.email`) se hace explícitamente en código del edge function.

Crítico: nunca retornar datos de otra clínica aunque el service_role technically pueda leer. Cada action verifica ownership antes de responder.
