# Contract: Frontend Components — Treatment Budget With Progress

**Spec**: 030 | **Date**: 2026-06-03

Cambios prop-por-prop en cada archivo. Sin breaking changes — callers existentes siguen funcionando.

---

## 1. `src/lib/api/budgetApi.js` (NUEVO)

Encapsula operaciones sobre items para que tanto Odontogram como PostSession las invoquen sin duplicación.

```js
/**
 * @file src/lib/api/budgetApi.js
 * Operaciones sobre treatment_budget_items + integración con appointment.
 */

/**
 * Obtiene el budget activo del paciente, o crea uno nuevo en 'draft' si no existe.
 * @returns {Promise<{ id, title, status, ... }>}
 */
export async function getOrCreateActiveBudget(patientId, therapistId, clinicId, patientFullName);

/**
 * Lista items pending de un budget.
 * @param {string} budgetId
 * @returns {Promise<Array<BudgetItem>>}
 */
export async function getPendingBudgetItems(budgetId);

/**
 * Lista budgets activos (status IN draft/accepted) de un paciente para el selector PostSession.
 * @returns {Promise<Array<{ id, title, status, item_count_pending }>>}
 */
export async function getActiveBudgetsForPatient(patientId);

/**
 * Marca varios items como completados en una transacción.
 * Lanza si alguno falla (UI Honesty §V).
 * @param {string[]} itemIds
 * @param {string} appointmentId
 * @returns {Promise<BudgetItem[]>} items actualizados
 */
export async function markBudgetItemsCompleted(itemIds, appointmentId);

/**
 * Revierte un item completed → pending.
 * El trigger DB enforza FR-016 (autoridad). Si rechaza, throw con mensaje friendly.
 * @returns {Promise<BudgetItem>}
 */
export async function revertBudgetItem(itemId);

/**
 * Crea un budget rápido inline para edge case "paciente sin budget al cerrar sesión" (FR-022).
 * Atómico: crea budget + 1 item con status='completed' + appointment_id.
 * @returns {Promise<{ budget, item }>}
 */
export async function createQuickBudgetForSession({ patientId, therapistId, clinicId, description, unitPrice, appointmentId });
```

---

## 2. `src/features/odontogram/api/budgetSyncApi.js` (NUEVO)

Sincronización odontograma → budget items para US3.

```js
/**
 * @file src/features/odontogram/api/budgetSyncApi.js
 * Crea/actualiza items del budget cuando el dentista marca tratamientos en el odontograma.
 */

/**
 * Crea un item del budget vinculado a un diente + tratamiento.
 * Si el budget activo no existe, lo crea (delegando a budgetApi.getOrCreateActiveBudget).
 * Si el servicio existe en therapist_services del dentista, autocompleta service_id + unit_price.
 *
 * @returns {Promise<BudgetItem>}
 */
export async function createBudgetItemFromOdontogram({
  patientId,
  therapistId,
  clinicId,
  patientFullName,
  tooth,              // ej. "36"
  treatment,          // ej. "endodoncia"
});

/**
 * Lookup en therapist_services por nombre de tratamiento. Match case-insensitive.
 * Retorna { service_id, unit_price } o { service_id: null, unit_price: 0 } si no existe.
 */
export async function findServiceByTreatmentName(therapistId, treatmentName);
```

---

## 3. `src/features/odontogram/components/Odontogram.jsx` (EDIT)

Hook into el callback `onTreatmentMarked` (verificar nombre exacto en research adicional). Llama `createBudgetItemFromOdontogram` y muestra toast confirmatorio:

```jsx
// Pseudo-código del cambio:
const handleTreatmentMark = async ({ tooth, treatment }) => {
  try {
    const item = await createBudgetItemFromOdontogram({
      patientId, therapistId: user.id, clinicId, patientFullName,
      tooth, treatment,
    });
    toast({
      title: '✓ Item agregado al presupuesto',
      description: `${item.description} — $${formatCLP(item.unit_price)}`,
    });
    onBudgetUpdated?.(); // callback opcional para re-fetch
  } catch (err) {
    toast({ variant: 'destructive', title: 'Error', description: err.message });
  }
};
```

**Edge case**: si `service_id = null` (servicio no en catálogo), el toast muestra "$0" + sugerencia "Editá el precio en el presupuesto".

---

## 4. `src/features/post-session/components/PostSessionModal.jsx` (EDIT mayor)

Inserción de step nuevo `'items'` entre `'document'` y `'payment'`:

```jsx
// Antes
const STEPS = ['document', 'payment', 'schedule', 'done'];

// Después
const STEPS = ['document', 'items', 'payment', 'schedule', 'done'];

// StepIndicator: agregar entry
const stepsMeta = [
  { key: 'document', icon: FileText, label: 'Nota' },
  { key: 'items', icon: CheckSquare, label: 'Hecho' }, // ← NUEVO
  { key: 'payment', icon: DollarSign, label: 'Pago' },
  { key: 'schedule', icon: CalendarPlus, label: 'Siguiente' },
];

// Render switch:
{currentStep === 'items' && (
  <BudgetItemsChecklistStep
    patientId={appointment.patient_id}
    appointmentId={appointment.id}
    onComplete={(suggestedAmount) => {
      setSuggestedPaymentAmount(suggestedAmount);
      setCurrentStep('payment');
    }}
    onSkip={() => setCurrentStep('payment')}
  />
)}

// Step 'payment' recibe nuevo prop:
<PaymentStep
  ...
  suggestedAmount={suggestedPaymentAmount}
  budgetId={activeBudgetId}  // ← nuevo
  appointmentId={appointment.id}  // ← nuevo
/>
```

---

## 5. `src/features/post-session/components/BudgetItemsChecklistStep.jsx` (NUEVO)

Componente del nuevo step. Responsabilidades:

- Fetch items pending del budget activo del paciente (vía `getPendingBudgetItems`)
- Si paciente NO tiene budget → mostrar UI alternativa (FR-022): "Crear presupuesto rápido" o "Saltar"
- Si paciente tiene múltiples budgets activos → selector con default = más reciente
- Render checklist con cada item: descripción, precio formateado CLP, checkbox
- Footer: "Total seleccionado: $X.XXX.XXX" + botón "Continuar al pago"
- Edge case items sin precio (FR-007): input editable inline
- Submit:
  - Llama `markBudgetItemsCompleted(checkedIds, appointmentId)`
  - Calcula `suggestedAmount = SUM(unit_price * quantity)` de tildados
  - Invoca `onComplete(suggestedAmount)` para avanzar al step de pago
  - Si dentista no tildó ninguno → warning amable (FR-013) "No tildaste ninguna intervención. ¿Continuar igual?"

```jsx
const BudgetItemsChecklistStep = ({ patientId, appointmentId, onComplete, onSkip }) => {
  const [budgets, setBudgets] = useState([]);
  const [selectedBudgetId, setSelectedBudgetId] = useState(null);
  const [items, setItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch budgets activos
  useEffect(() => {
    getActiveBudgetsForPatient(patientId)
      .then((data) => {
        setBudgets(data);
        if (data.length > 0) setSelectedBudgetId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  // Fetch items cuando cambia budget
  useEffect(() => {
    if (!selectedBudgetId) return;
    getPendingBudgetItems(selectedBudgetId).then(setItems);
  }, [selectedBudgetId]);

  // ... render checklist ...
};
```

---

## 6. `src/features/post-session/api/postSessionApi.js` (EDIT — extender)

Extender `registerSessionPayment` para incluir `budget_id`:

```js
// Antes
export async function registerSessionPayment({
  appointmentId, patientId, therapistId, amount, paymentMethod, paymentDate, notes
}) {
  // INSERT en patient_payments sin budget_id
}

// Después
export async function registerSessionPayment({
  appointmentId, patientId, therapistId, amount, paymentMethod, paymentDate, notes,
  budgetId = null,  // ← nuevo, opcional para backward compat
}) {
  const insertPayload = {
    appointment_id: appointmentId,
    patient_id: patientId,
    therapist_id: therapistId,
    amount,
    payment_method: paymentMethod,
    payment_date: paymentDate,
    notes,
    status: 'completed',
    budget_id: budgetId,  // ← nuevo
    // commission_percent y commission_amount se calculan en trigger DB existente
  };

  const { data, error } = await supabase
    .from('patient_payments')
    .insert(insertPayload)
    .select('id, amount, budget_id')
    .single();

  if (error || !data) throw error || new Error('Pago no se pudo registrar (RLS rechazó)');

  // Spec 030 FR-019: audit log entry
  await logClinicalAccess({
    organization_id: orgId,
    user_id: therapistId,
    patient_id: patientId,
    action: 'create',
    resource_type: 'payment',
    resource_id: data.id,
    reason: `from_postsession:${appointmentId}`,
  });

  return data;
}
```

---

## Tabla resumen de cambios

| Archivo | Tipo | Líneas estimadas |
|---|---|---|
| `supabase/migrations/20260604000001_...sql` | NUEVO | ~120 |
| `src/lib/api/budgetApi.js` | NUEVO | ~150 |
| `src/features/odontogram/api/budgetSyncApi.js` | NUEVO | ~80 |
| `src/features/odontogram/components/Odontogram.jsx` | EDIT | +30 / -5 |
| `src/features/post-session/components/PostSessionModal.jsx` | EDIT mayor | +50 / -10 |
| `src/features/post-session/components/BudgetItemsChecklistStep.jsx` | NUEVO | ~200 |
| `src/features/post-session/api/postSessionApi.js` | EDIT | +20 / -5 |
| **Total neto** |  | **~640 nuevas, ~20 borradas** |

Esfuerzo total estimado: **9-12 horas** de implementación + 1-2h smoke testing.
