# Feature Specification: Enable RLS en tablas con policies existentes pero RLS desactivado

**Feature Branch**: `006-enable-rls-quick-wins`
**Created**: 2026-04-20
**Status**: Draft (fast-fix, 1-line-per-table)
**Priority**: 🔴 P0 — Constitution I (Compliance-First) + Constitution II (RLS-First Security) violadas
**Input**: Security audit 2026-04-20 reveló que 3 tablas públicas tienen policies definidas pero RLS DISABLED → policies no se enforcean → cualquier usuario autenticado puede leer/escribir todo. Pegamento base: query a `pg_tables.rowsecurity` vs `pg_policies`. Consumers grep + live `pg_policies` inspection confirman coverage para 2 de las 3 tablas.

## 🔴 Contexto

El audit de RLS coverage (2026-04-20, ver `architecture.md` §"Known drift non-urgent" extendida) encontró:

| Tabla | Policies existentes (live) | Cobertura vs consumers | Decisión |
|---|---|---|---|
| `blog_posts` | 7 policies | ✅ Completo (anon published + author manage own + admin full) | **Enable RLS ahora** |
| `patient_questions` | 5 policies | ✅ Completo (patient manage own + therapist view/update + admin read) | **Enable RLS ahora** |
| `marketplace_purchases` | 1 policy (solo "Admins update") | 🔴 Gap severo — faltan buyer read/insert, admin read, vendor read | **DIFERIR a spec separado** (necesita escribir policies faltantes primero) |

Este spec cubre solo las 2 seguras. La tabla 3 queda documentada como spec P0 separado (`enable-rls-marketplace-purchases-full-policy-restore`).

### Constitution II violada actualmente

> "La seguridad vive en `supabase/policies.sql`"

Pero si RLS está DISABLED, las policies en `policies.sql` son decoración. El fix es encender el flag a nivel tabla, no reescribir nada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Pacientes no ven preguntas de otros pacientes (Priority: P0 🎯)

Hoy: cualquier usuario autenticado puede hacer `supabase.from('patient_questions').select('*')` y obtener las preguntas de TODOS los pacientes de la plataforma. Después: solo puede ver las propias (via `patient_id = auth.uid()`) o las de sus pacientes si es terapeuta.

**Why this priority**: PHI leak real — las preguntas pueden contener síntomas, inquietudes médicas, datos identificables.

**Independent Test**:
1. Login como paciente A
2. DevTools Console: `await supabase.from('patient_questions').select('*')`
3. **ANTES del fix**: devuelve preguntas de todos los pacientes
4. **DESPUÉS del fix**: devuelve solo preguntas con `patient_id = <uuid del paciente A>`

### User Story 2 — Autores de blog no pueden modificar posts de otros autores (Priority: P0 🎯)

Hoy: cualquier terapeuta autenticado puede `.update()` sobre un blog_post de otro autor. Después: solo su propio post (por `author_id = auth.uid()`).

**Why this priority**: moderation bypass + integridad de contenido.

**Independent Test**:
1. Login como terapeuta A, crea post X
2. Login como terapeuta B
3. DevTools: `await supabase.from('blog_posts').update({ title: 'hacked' }).eq('id', <X.id>)`
4. **ANTES**: update exitoso
5. **DESPUÉS**: update devuelve 0 rows (policy `author_id = auth.uid()` no matchea)

### User Story 3 — Cero regresión en flows legítimos (Priority: P1)

Los flujos existentes siguen funcionando:
- Público lee blog posts publicados (anon)
- Terapeutas ven/editan sus propios posts
- Admins gestionan todos los blogs
- Pacientes gestionan sus propias preguntas
- Terapeutas ven/actualizan preguntas de sus pacientes
- Admins leen todas las preguntas

**Independent Test**: smoke test manual post-deploy de los 6 flujos arriba. Scope ampliado si alguno rompe.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `blog_posts` debe tener `rowsecurity = true` en `pg_tables`
- **FR-002**: `patient_questions` debe tener `rowsecurity = true` en `pg_tables`
- **FR-003**: Las policies existentes (7 en blog_posts, 5 en patient_questions) deben permanecer intactas — no se tocan definiciones
- **FR-004**: Migración debe ser idempotente (`ENABLE ROW LEVEL SECURITY` es no-op si ya está habilitado)
- **FR-005**: Migración debe incluir verificación pre-enable del conteo de policies (abortar si < esperado, indica que algo fue dropeado sin avisar)
- **FR-006**: Migración debe incluir verificación post-enable confirmando que `rowsecurity = true`

### Out of Scope (diferido)

- `marketplace_purchases` — requiere escribir 4+ policies faltantes (spec separado)
- Tablas con RLS ENABLED + 0 policies (spec `audit-rls-disabled-broken-features`)
- Tablas con RLS DISABLED + 0 policies (spec `write-policies-for-pie-and-debug-tables`)

## Success Criteria *(mandatory)*

- **SC-001**: Post-merge, query `SELECT rowsecurity FROM pg_tables WHERE tablename IN ('blog_posts', 'patient_questions')` devuelve `true` para ambas
- **SC-002**: Ningún smoke test del User Story 3 reporta error
- **SC-003**: Migración se puede re-correr sin error (idempotencia)

## Rollback Plan

Si aparece regresión crítica post-deploy:

```sql
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_questions DISABLE ROW LEVEL SECURITY;
```

Efecto: vuelve al estado pre-fix (inseguro pero funcional). Requiere commit dedicado con justificación.

---

**Origen**: Security audit 2026-04-20 post-Express block, ver `architecture.md` §"RLS coverage audit" (a agregar en este PR).
