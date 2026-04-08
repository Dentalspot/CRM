# ADI-R Module — Guía de integración para DentalSpot

## Archivos nuevos (copiar a `src/features/adir/`)

```
src/features/adir/
├── api/adirApi.js              # CRUD + cálculo de scores
├── constants/adirItems.js      # Dominios, ítems, cutoffs, helpers
├── pages/
│   ├── AdirListPage.jsx        # Listado de evaluaciones
│   └── AdirEvaluationPage.jsx  # Flujo de 4 pasos
└── index.js                    # Exports del módulo
```

## Migración Supabase

Ejecutar en el SQL Editor de Supabase:

```
supabase/migrations/20260318_create_adir_tables.sql
```

Crea 2 tablas: `adir_evaluations` + `adir_item_responses` con RLS.

## Cambios en archivos existentes

### 1. `src/components/layout/Sidebar.jsx` (línea ~148)

Agregar dentro de la sección "Evaluaciones Clínicas":

```jsx
{ name: 'ADI-R', icon: FileText, path: '/dashboard/therapist/adir' },
```

### 2. `src/app/routers/DashboardRouter.jsx`

**Imports** (después de ADOS-2):
```jsx
const AdirListPage = lazy(() => import('@/features/adir/pages/AdirListPage.jsx'));
const AdirEvaluationPage = lazy(() => import('@/features/adir/pages/AdirEvaluationPage.jsx'));
```

**Routes** (después de las rutas ADOS-2):
```jsx
<Route path="adir" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirListPage /></RoleGuard>} />
<Route path="adir/new" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirEvaluationPage /></RoleGuard>} />
<Route path="adir/:id" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirEvaluationPage /></RoleGuard>} />
<Route path="adir/:id/edit" element={<RoleGuard allowedRoles={[USER_ROLES.THERAPIST]}><AdirEvaluationPage /></RoleGuard>} />
```

## Dependencias

No requiere dependencias nuevas. Usa el mismo stack que ADOS-2:
- shadcn/ui (Card, Badge, Select, etc.)
- date-fns + locale `es`
- lucide-react
- Supabase client existente

## Notas legales

- Los ítems usan **descripciones genéricas** del constructo evaluado, no el texto literal del protocolo ADI-R.
- Los cutoffs del algoritmo diagnóstico están publicados en la literatura científica.
- El profesional debe tener su **protocolo físico licenciado** (WPS) para administrar la entrevista.
- Esta herramienta es un sistema de **registro y scoring**, no reemplaza el protocolo.

## Fase 2 (pendiente): Dashboard cruzado ADI-R + ADOS-2

Próximo paso: `src/features/tea-dashboard/` con:
- Vista integrada por paciente
- Matriz de concordancia ADI-R vs ADOS-2
- Generador de informe integrado
