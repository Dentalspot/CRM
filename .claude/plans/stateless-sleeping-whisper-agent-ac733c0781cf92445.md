# DentalSpot Implementation Plan: FonoKit to Dentistry Adaptation

## Overview
Adapt the existing FonoKit (speech therapy) React+Vite+Supabase+TailwindCSS platform into DentalSpot (dentistry). The architecture stays the same: super admin, 3 user types (patient, dentist, clinic). The DB role value `therapist` is preserved to avoid migrations; only UI labels change.

---

## Phase 1: Branding (Colors, Logo, Meta)

### 1.1 CSS Custom Properties — `/src/index.css`
Replace the HSL values in both `:root` and `.dark` blocks:

| Variable | Current (FonoKit) | New (DentalSpot) |
|---|---|---|
| `--primary` | `330 95% 72%` (pink) | `189 49% 52%` (#45b5c4 turquoise) |
| `--secondary` | `174 73% 55%` (teal) | `170 40% 75%` (#a0ded7 mint) |
| `--accent` | `174 73% 55%` | `170 40% 75%` (same as secondary) |
| `--ring` | `330 95% 72%` | `189 49% 52%` (match primary) |
| `--muted-foreground` | `0 0% 45%` | `180 5% 42%` (#667171 gray) |
| `--foreground` | `0 0% 0%` | `0 0% 0%` (keep black) |

For `.dark` mode, derive darker/lighter variants of the same palette. Consider adding a new custom property `--primary-dark: 187 77% 37%` for #1693a5 usage in hover states and dark accents.

### 1.2 Logo Component — `/src/components/shared/Logo.jsx`
- Replace `MessageSquare` (lucide) import with a tooth icon. Options:
  - Use a custom SVG inline (tooth with heart shape, per brand spec)
  - Or use a generic dental SVG component
- Change text from `FONOKIT` to `Dental Spot`
- Keep the gradient classes `from-primary to-secondary` (they will automatically pick up new colors)
- Consider adding a `variant` prop since `Footer.jsx` uses `<Logo variant="light" />`

### 1.3 HTML Meta — `/index.html`
- Title: `FONOKIT – Encuentra tu Fonoaudióloga(o)...` → `Dental Spot – Encuentra tu Dentista y Reserva Online`
- Meta description: Rewrite for dentistry context
- Keywords: Replace all speech therapy keywords with dental keywords
- Open Graph tags: Update all og:title, og:description, og:url to dentalspot domain
- Twitter Cards: Same treatment
- Schema.org JSON-LD: Change `serviceType` from `Fonoaudiología` to `Odontología`, `medicalSpecialty` from `Audiology` to `Dentistry`, audience types to dental patients
- Facebook domain verification: Update or remove

### 1.4 Public Assets — `/public/`
- Replace `favicon.ico` with DentalSpot tooth icon
- Update `robots.txt` and `sitemap.xml` domain references
- Update `llms.txt` if it contains FonoKit references
- Create new `og-image.png` with DentalSpot branding

### 1.5 Tailwind Config — `/tailwind.config.js`
- No structural changes needed. It references CSS vars via `hsl(var(--primary))` etc.
- Optionally add a `dental` color token:
  ```js
  dental: {
    DEFAULT: "hsl(var(--primary))",
    dark: "hsl(var(--primary-dark))",
  }
  ```

**Files for Phase 1:**
1. `/src/index.css`
2. `/src/components/shared/Logo.jsx`
3. `/index.html`
4. `/public/favicon.ico` (replace asset)
5. `/public/robots.txt`, `/public/sitemap.xml`
6. `/tailwind.config.js` (optional)

---

## Phase 2: Role Labels and Terminology (Global Find/Replace)

### 2.1 Role Constants — `/src/constants/roles.js`
- `ROLE_LABELS[THERAPIST]`: `'Terapeuta'` → `'Dentista'`
- `getPublicRoles()` descriptions:
  - Patient: `'Busco atención fonoaudiológica...'` → `'Busco atención dental para mí o un familiar'`
  - Therapist: `'Soy fonoaudiólogo/a y quiero gestionar mis pacientes'` → `'Soy dentista y quiero gestionar mis pacientes'`

### 2.2 Systematic Terminology Replacement
Based on grep analysis, ~111 occurrences of fono/FONO/Fono/fonoaudi/terapeuta across 60+ files. The replacement map:

| Original | Replacement |
|---|---|
| `FONOKIT` / `Fonokit` / `fonokit` | `Dental Spot` / `DentalSpot` / `dentalspot` |
| `fonoaudiólogo/a` | `dentista` |
| `fonoaudiología` | `odontología` |
| `Terapeuta` | `Dentista` |
| `terapeuta` | `dentista` |
| `FonoLevel` | `DentalLevel` (or remove) |
| `FONO` (in split-colored text) | `DENTAL` |

### 2.3 High-Priority Files (by occurrence count, from grep):

1. **`/src/app/routers/AdminRouter.jsx`** (35 occurrences) — Admin module email addresses like `blog@fonokit.cl`, `ficha@fonokit.cl`, `pacientes@fonokit.cl`. Change to `@dentalspot.cl`
2. **`/src/pages/LeadCapturePage.jsx`** (13 occurrences)
3. **`/src/pages/HomePage.jsx`** (handled in Phase 3, but terminology here too)
4. **`/src/pages/TherapistProfileDashboardPage.jsx`** (9 occurrences)
5. **`/src/components/onboarding/WelcomeModal.jsx`** (9 occurrences)
6. **`/src/pages/clinic/ClinicReportsPage.jsx`** (9 occurrences)
7. **`/src/components/clinic/profile/ClinicTeamSection.jsx`** (8 occurrences)
8. **`/src/services/patientAccountService.js`** (6 occurrences)
9. **`/src/components/layout/Sidebar.jsx`** — `© 2026 Fonokit` → `© 2026 Dental Spot`
10. **`/src/components/layout/Footer.jsx`** — `Buscar Fonoaudiólogos` → `Buscar Dentistas`, description text
11. **`/src/components/layout/Header.jsx`** — Any fono references
12. **`/src/features/auth/pages/AuthPage.jsx`** — `FONO`/`KIT` split-colored text, all `fonoaudiólogo` references, testimonial
13. **`/src/features/auth/components/AuthForm.jsx`** — Registration copy
14. **`/src/lib/utils/logger.js`** (5 occurrences)
15. **`/src/constants/addOnFeatures.js`** (3 occurrences)

### 2.4 Route Rename — Search Page
- Rename file: `/src/pages/FonoaudiologosSearchPage.jsx` → `/src/pages/DentistSearchPage.jsx`
- Update route in `/src/app/routers/PublicRouter.jsx`:
  - Change import path
  - Change route: `"/fonoaudiologos"` → `"/dentistas"`
  - Add redirect from old route for SEO: `<Route path="/fonoaudiologos" element={<Navigate to="/dentistas" replace />} />`
- Update `/src/components/home/HeroSearchForm.jsx`: navigate path from `/fonoaudiologos` to `/dentistas`
- Update `/src/components/layout/Footer.jsx`: link href from `/fonoaudiologos` to `/dentistas`

### 2.5 Dashboard Route — Earnings Page
- `/src/app/routers/DashboardRouter.jsx` line 174: route path `fonoaudiologo/earnings` → `dentist/earnings`
- Feature directory: `/src/features/fonoaudiologo/` → Consider renaming to `/src/features/dentist/` (or just update imports)

### 2.6 Sidebar Terminology — `/src/components/layout/Sidebar.jsx`
- Line 159: `'Módulo PIE'` → Remove or adapt (PIE is speech-therapy specific for Chilean schools)
- Line 160: `'Módulo TEA'` → Remove or adapt (TEA/autism evaluations are speech-therapy specific)
- Line 165-170: AI tools section — Rename `'Notiz - Notas Auto.'` context, `'Visualizador de Voz'` (voice visualizer is fono-specific, consider removing or replacing with dental tool)
- Line 205: `'Gestión de Terapeutas'` → `'Gestión de Dentistas'`
- Line 268: `© 2026 Fonokit` → `© 2026 Dental Spot`

### 2.7 TherapistDashboardPage — `/src/pages/TherapistDashboardPage.jsx`
- Line 42: `'FonoLevel'` step label → `'DentalLevel'` or remove
- Lines 55-61: `FONOLEVEL_BADGES` → `DENTALLEVEL_BADGES` (or similar)
- Line 63: `getFonoLevel` → `getDentalLevel`

**Files for Phase 2:** ~30+ files. Use a systematic approach:
1. Start with constants/config files
2. Then layout components (Sidebar, Header, Footer)
3. Then page-level files
4. Then feature-level files
5. Run grep verification after each batch

---

## Phase 3: Home Page Adaptation

### 3.1 Main Page — `/src/pages/HomePage.jsx` (813 lines)
Complete content rewrite. Sections to adapt:

**Hero Section (lines 226-330):**
- Badge: Keep CORFO badge or update project number
- H1: `"El sistema operativo de la fonoaudiología moderna"` → `"El sistema operativo de la odontología moderna"`
- Subtitle: Adapt for dental context
- Feature bullets: `Fichas clínicas digitales · Informes con IA · Evaluaciones ADOS-2 · Agenda inteligente` → `Fichas clínicas digitales · Odontograma digital · Informes con IA · Agenda inteligente`
- Stats: `'+500 Fonoaudiólogos activos'` → `'+500 Dentistas activos'`
- Search prompt: `"¿Eres paciente? Encuentra un fonoaudiólogo FONOKIT cerca de ti"` → `"¿Eres paciente? Encuentra un dentista Dental Spot cerca de ti"`

**Benefits array (lines 39-70):**
- Keep: Fichas clínicas digitales, Agenda inteligente, Seguimiento, Perfil verificado
- Change: `'Informes con IA'` description — remove `fonoaudiología` reference
- Change: `'Evaluaciones estandarizadas'` — replace `ADOS-2, ADI-R` with dental evaluation protocols
- Add: Odontogram benefit card

**Deep Features (lines 72-97):**
- `'IA clínica especializada'` — change from `fonoaudiología` language to dental language
- `'Protocolos estandarizados'` — replace `ADOS-2 y ADI-R` with dental protocols
- Keep Analytics and Automation features

**How It Works (lines 99-115):**
- Step 1: `"Un fonoaudiólogo miembro de FONOKIT"` → `"Un dentista miembro de Dental Spot"`
- Steps 2-3: Adapt language

**Featured Professionals (lines 117-124):**
- Replace speech therapy specialties with dental specialties:
  - `'Neurorehabilitación Infantil'` → `'Ortodoncia'`
  - `'Lenguaje y Comunicación'` → `'Endodoncia'`
  - `'Deglución y Disfagia'` → `'Periodoncia'`
  - `'Audiología Clínica'` → `'Implantología'`
  - `'Motricidad Orofacial'` → `'Odontopediatría'`
  - `'TEA – Evaluación'` → `'Cirugía Maxilofacial'`

**FAQ (lines 126-157):**
- Complete rewrite of all 6 Q&A items for dental context
- Replace all `FONOKIT` → `Dental Spot`, `fonoaudiólogo` → `dentista`, `fonoaudiología` → `odontología`

**Schema.org data (lines 168-194):**
- Update `name`, `url`, `description`, `audience` for dental context

**Helmet SEO (lines 198-218):**
- Title, meta description, keywords, canonical URL, OG tags — all rewritten for dental

### 3.2 Home Sub-Components — `/src/components/home/`
These are mostly presentational and receive props, so minimal changes needed:
- `HeroSearchForm.jsx` — Update navigate path (handled in Phase 2)
- `FeaturedProfessionalsCarousel.jsx` — May have internal labels like "Fonoaudiólogos destacados"
- `BenefitCard.jsx`, `FeatureHighlightCard.jsx`, `HowItWorksStep.jsx`, `TransparencyCard.jsx` — Check for hardcoded text
- `InvitationSection.jsx` — Likely has fono-specific invitation copy

### 3.3 Auth Pages Update
- `/src/features/auth/pages/AuthPage.jsx`:
  - Line 149: `<span className="text-pink-500">FONO</span><span className="text-teal-500">KIT</span>` → `<span className="text-[#45b5c4]">Dental</span> <span className="text-[#1693a5]">Spot</span>` (or use Logo component)
  - All `fonoaudiólogo` → `dentista` in exit-intent popup, benefits, testimonial
  - Testimonial: Change from Danissa Klagges / Fonoaudióloga to a dentist testimonial
  - Background gradient: `from-purple-100 via-pink-100 to-teal-100` → dental palette

**Files for Phase 3:**
1. `/src/pages/HomePage.jsx` (major rewrite)
2. `/src/components/home/HeroSearchForm.jsx`
3. `/src/components/home/FeaturedProfessionalsCarousel.jsx`
4. `/src/components/home/InvitationSection.jsx`
5. `/src/features/auth/pages/AuthPage.jsx`

---

## Phase 4: Odontogram Component (New Feature)

### 4.1 Database Schema — New Supabase Migration

Create migration file: `/supabase/migrations/20260407000001_create_odontograms.sql`

```sql
-- Odontogram table
CREATE TABLE IF NOT EXISTS odontograms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES profiles(id),
  tooth_type TEXT NOT NULL DEFAULT 'adult' CHECK (tooth_type IN ('adult', 'child')),
  teeth_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast patient lookup
CREATE INDEX idx_odontograms_patient ON odontograms(patient_id);
CREATE INDEX idx_odontograms_therapist ON odontograms(therapist_id);

-- RLS policies
ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can manage their odontograms"
  ON odontograms FOR ALL
  USING (therapist_id = auth.uid());

CREATE POLICY "Patients can view their own odontograms"
  ON odontograms FOR SELECT
  USING (patient_id IN (
    SELECT id FROM patients WHERE user_id = auth.uid()
  ));
```

**`teeth_data` JSONB structure:**
```json
{
  "18": {
    "mesial": { "condition": "caries", "color": "#ef4444" },
    "distal": { "condition": "restoration", "color": "#3b82f6" },
    "oclusal": { "condition": "healthy", "color": "#ffffff" },
    "vestibular": { "condition": "healthy", "color": "#ffffff" },
    "lingual": { "condition": "healthy", "color": "#ffffff" },
    "whole_tooth": null
  },
  "17": { ... }
}
```

Tooth numbering follows FDI (ISO 3950) international notation:
- Adult: 11-18, 21-28, 31-38, 41-48 (32 teeth)
- Child: 51-55, 61-65, 71-75, 81-85 (20 teeth)

### 4.2 Condition Constants — `/src/constants/dentalConditions.js` (NEW)

```js
export const DENTAL_CONDITIONS = {
  healthy: { label: 'Sano', color: '#ffffff', borderColor: '#d1d5db' },
  caries: { label: 'Caries', color: '#ef4444' },
  restoration: { label: 'Restauración', color: '#3b82f6' },
  extraction: { label: 'Extracción', color: '#000000' },
  absent: { label: 'Ausente', color: '#9ca3af' },
  crown: { label: 'Corona', color: '#eab308' },
  bridge: { label: 'Puente', color: '#f97316' },
  implant: { label: 'Implante', color: '#8b5cf6' },
  endodontic: { label: 'Endodoncia', color: '#ec4899' },
  sealant: { label: 'Sellante', color: '#06b6d4' },
  fracture: { label: 'Fractura', color: '#dc2626' },
};

export const TOOTH_SURFACES = ['mesial', 'distal', 'oclusal', 'vestibular', 'lingual'];

export const ADULT_TEETH = {
  upperRight: [18,17,16,15,14,13,12,11],
  upperLeft: [21,22,23,24,25,26,27,28],
  lowerLeft: [31,32,33,34,35,36,37,38],
  lowerRight: [48,47,46,45,44,43,42,41],
};

export const CHILD_TEETH = {
  upperRight: [55,54,53,52,51],
  upperLeft: [61,62,63,64,65],
  lowerLeft: [71,72,73,74,75],
  lowerRight: [85,84,83,82,81],
};
```

### 4.3 Component Architecture — `/src/features/odontogram/` (NEW directory)

```
src/features/odontogram/
├── api/
│   └── odontogramApi.js          # Supabase CRUD operations
├── components/
│   ├── Odontogram.jsx            # Main orchestrator component
│   ├── DentalArch.jsx            # SVG rendering of upper/lower arch
│   ├── ToothDiagram.jsx          # Individual tooth with 5 clickable surfaces
│   ├── ToothSurfaceSelector.jsx  # Popup to select condition for a surface
│   ├── ConditionLegend.jsx       # Color-coded legend of conditions
│   ├── OdontogramToolbar.jsx     # Toggle adult/child, save, print, reset
│   └── OdontogramHistory.jsx     # List of past odontograms for a patient
├── hooks/
│   └── useOdontogram.js          # State management hook (load, save, modify)
└── pages/
    └── OdontogramPage.jsx        # Full-page view (optional, for standalone access)
```

### 4.4 Key Component Details

**`ToothDiagram.jsx`** — The core visual unit:
- Renders an SVG of a single tooth divided into 5 surfaces
- Each surface is a clickable polygon/path
- Fill color reflects the condition applied
- On click, opens `ToothSurfaceSelector` popover
- Shows tooth number (FDI notation) below
- Supports a "whole tooth" action for extraction/absent/crown

**`DentalArch.jsx`** — Arranges teeth in dental arch formation:
- Upper arch: teeth 18→11 (right) then 21→28 (left), arranged in a curved row
- Lower arch: teeth 48→41 (right) then 31→38 (left), arranged in a curved row
- Uses CSS Grid or Flexbox for layout
- Each cell contains a `ToothDiagram`

**`Odontogram.jsx`** — Main component:
- Props: `patientId`, `readOnly` (for patient view)
- State managed by `useOdontogram` hook
- Toolbar at top: Adult/Child toggle, Save button, Print, History
- Two `DentalArch` components (upper and lower)
- `ConditionLegend` at bottom
- Auto-saves on debounced changes or explicit save button

**`useOdontogram.js`** hook:
- `loadOdontogram(patientId)` — fetches latest from Supabase
- `updateSurface(toothNumber, surface, condition)` — updates local state
- `saveOdontogram()` — upserts to Supabase
- `createNewOdontogram(patientId, type)` — creates blank
- `getHistory(patientId)` — lists all past entries

**`odontogramApi.js`** — Supabase operations:
```js
// Pattern follows existing API files like /src/lib/patientApi.js
import { supabase } from '@/lib/supabaseClient';

export const getLatestOdontogram = async (patientId) => { ... };
export const getOdontogramHistory = async (patientId) => { ... };
export const upsertOdontogram = async (data) => { ... };
export const deleteOdontogram = async (id) => { ... };
```

### 4.5 SVG Tooth Design

Each tooth is rendered as an SVG with 5 regions. The standard dental diagram uses a cross-section view:

```
       [Vestibular]
    ┌───────────────┐
    │   [Mesial]    │
    │  ┌─────────┐  │
    │  │ Oclusal │  │
    │  └─────────┘  │
    │   [Distal]    │
    └───────────────┘
       [Lingual]
```

For anterior teeth, "oclusal" becomes "incisal" (edge). The component should handle this naming automatically based on tooth number (teeth 11-13, 21-23, 31-33, 41-43 are anterior).

**Files for Phase 4:**
1. `/supabase/migrations/20260407000001_create_odontograms.sql` (NEW)
2. `/src/constants/dentalConditions.js` (NEW)
3. `/src/features/odontogram/` (NEW directory, ~8 files)

---

## Phase 5: Dashboard Integration

### 5.1 Add Odontogram Tab to Patient File — `/src/pages/therapist/PatientFilePage.jsx`
- Import `Odontogram` from `@/features/odontogram/components/Odontogram`
- Add new tab `'odontograma'` to the `Tabs` component
- Add `TabsTrigger`: `<TabsTrigger value="odontograma">Odontograma</TabsTrigger>`
- Add `TabsContent`: renders `<Odontogram patientId={id} />`
- Position the tab after "Historia Clínica" and before "Planificación"

### 5.2 Add Odontogram Quick Access to Therapist Dashboard — `/src/pages/TherapistDashboardPage.jsx`
- Add an odontogram quick-access card/widget in the dashboard
- This could be a "Recent Odontograms" widget showing last edited patients
- Or a shortcut card linking to patient file odontogram tab

### 5.3 Sidebar Navigation — `/src/components/layout/Sidebar.jsx`
- Under the THERAPIST section, add odontogram as a visible feature
- Option A: Add it as a top-level item: `{ name: 'Odontogramas', icon: Tooth(?), path: '/dashboard/therapist/odontograms' }`
- Option B: Keep it only inside patient files (simpler, recommended for Phase 1)
- Recommendation: Start with Option B (inside patient file tabs), add standalone list page later

### 5.4 Remove Speech-Therapy-Specific Features from Sidebar
The following sidebar items are specific to speech therapy and should be removed or replaced:
- `Módulo PIE` — Chilean school speech therapy program; remove
- `Módulo TEA` — Autism evaluation module; remove
- `Visualizador de Voz` — Voice visualizer; remove (dental-irrelevant)
- `Notiz - Notas Auto.` — Keep if the AI note-taking is generic enough, or relabel
- `Evidencia Científica` — Keep, relabel context to dental evidence

Replace with dental-specific items:
- `Odontograma` (if adding standalone access)
- Potentially: `Radiografías` (future feature placeholder)

### 5.5 Dashboard Router — `/src/app/routers/DashboardRouter.jsx`
- Remove or comment out PIE-specific routes (lines 122-131): `pie/*`, `tecal/*`, `stsg/*`, `teprosif/*`
- Remove or comment out TEA-specific routes (lines 134-141): `tea`, `adir/*`, `sensorial/*`
- Remove or comment out ADOS-2 routes (lines 129-132)
- Optionally add: `<Route path="odontograms" element={...}>` for a standalone odontogram list page (future)

### 5.6 Patient Dashboard — Patient View of Odontogram
- `/src/features/patient-file/pages/PatientClinicalFilePage.jsx` — If patients can view their odontogram, add a read-only view here
- Or add to `/src/features/patient-dashboard/PatientDashboardPageV2.jsx` as a widget

### 5.7 Update Profile Dashboard — `/src/pages/TherapistProfileDashboardPage.jsx`
- Replace fono-specific profile fields with dental ones
- Specialties should reference dental specialties instead of speech therapy ones

**Files for Phase 5:**
1. `/src/pages/therapist/PatientFilePage.jsx`
2. `/src/pages/TherapistDashboardPage.jsx`
3. `/src/components/layout/Sidebar.jsx`
4. `/src/app/routers/DashboardRouter.jsx`
5. `/src/pages/TherapistProfileDashboardPage.jsx`

---

## Implementation Sequence & Dependencies

```
Phase 1 (Branding)     ─── No dependencies, start immediately
Phase 2 (Terminology)  ─── No dependencies, can parallel with Phase 1
Phase 3 (Home Page)    ─── Depends on Phase 1 (colors) + Phase 2 (terminology)
Phase 4 (Odontogram)   ─── Independent; can start in parallel with Phases 1-3
Phase 5 (Dashboard)    ─── Depends on Phase 4 (odontogram component) + Phase 2 (terminology)
```

Recommended order: Start Phase 1 + Phase 4 in parallel, then Phase 2, then Phase 3, then Phase 5.

---

## Risk Mitigation

1. **DB role value preserved**: `USER_ROLES.THERAPIST = 'therapist'` stays in code and DB. Only labels/descriptions change. This means NO Supabase RLS policy changes, NO migration of existing user data.

2. **Route stability**: Keep `/dashboard/therapist/*` routes as-is. Only rename the public `/fonoaudiologos` → `/dentistas` route with a redirect.

3. **Existing features**: PIE, TEA, ADOS-2 modules remain in codebase but are hidden from the sidebar and routes. They can be fully removed in a cleanup phase later.

4. **Odontogram as additive**: The odontogram is a new table and new feature directory. It does not modify any existing tables or features, minimizing risk.

5. **Test incrementally**: After each phase, verify:
   - Phase 1: App loads with new colors, logo renders correctly
   - Phase 2: All user-facing strings say "dentista" not "fonoaudiólogo"
   - Phase 3: Home page renders with dental content, search navigates to `/dentistas`
   - Phase 4: Odontogram renders, saves to DB, loads from DB
   - Phase 5: Odontogram accessible from patient file, dashboard shows dental context
