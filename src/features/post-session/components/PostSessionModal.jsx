import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TimePicker from '@/components/ui/time-picker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  DollarSign,
  CalendarPlus,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Mic,
  Loader2,
  UserPlus,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { createReferral } from '@/features/referrals/api/referralsApi';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

import {
  createSessionRecord,
  registerSessionPayment,
  scheduleNextAppointment,
} from '../api/postSessionApi';
import NotizInlineWidget from './NotizInlineWidget';
import BudgetItemsChecklistStep from './BudgetItemsChecklistStep';
import { formatCurrency } from '@/lib/utils/formatters';

const REFERRAL_TYPES = [
  { value: 'fonoaudiologo', label: 'Odontólogo/a' },
  { value: 'psicologo', label: 'Psicólogo/a' },
  { value: 'terapeuta_ocupacional', label: 'Terapeuta Ocupacional' },
  { value: 'neurologo', label: 'Neurólogo/a' },
  { value: 'psiquiatra', label: 'Psiquiatra' },
  { value: 'pediatra', label: 'Pediatra' },
  { value: 'educador_diferencial', label: 'Educador/a Diferencial' },
  { value: 'kinesiologo', label: 'Kinesiólogo/a' },
  { value: 'otro', label: 'Otro profesional' },
];

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'mercadopago', label: 'Mercado Pago' },
];

const STEPS = ['document', 'items', 'payment', 'schedule', 'done'];

// ─── Step Indicator ───
const StepIndicator = ({ currentStep, completed }) => {
  const stepsMeta = [
    { key: 'document', icon: FileText, label: 'Nota' },
    { key: 'items', icon: ListChecks, label: 'Hecho' },
    { key: 'payment', icon: DollarSign, label: 'Pago' },
    { key: 'schedule', icon: CalendarPlus, label: 'Siguiente' },
  ];

  const currentIdx = STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {stepsMeta.map((step, i) => {
        const isDone = completed[step.key];
        const isActive = currentIdx === i;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:inline',
                  isActive ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main Modal ───
const PostSessionModal = ({ isOpen, onClose, appointment, therapistId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState('document');
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState({
    document: false,
    items: false,
    payment: false,
    schedule: false,
  });

  // Spec 030: items tildados + budget activo → pre-rellenar pago
  const [suggestedAmount, setSuggestedAmount] = useState(0);
  const [activeBudgetId, setActiveBudgetId] = useState(null);
  const [itemsMarkedCount, setItemsMarkedCount] = useState(0);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  // Step 1 state
  const [sessionNotes, setSessionNotes] = useState('');
  const [objectives, setObjectives] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  // Referral state
  const [showReferral, setShowReferral] = useState(false);
  // Spec 030: derivación intra-clínica es siempre a otro dentista. Pre-cargado
  // para evitar input innecesario. Si en futuro spec se permite cross-clínica
  // o cross-disciplina, este state vuelve a 'string vacío' con dropdown.
  const [referralType, setReferralType] = useState('odontologo');
  const [referralReason, setReferralReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  // Step 2 state
  const [registerPayment, setRegisterPayment] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  // Spec 030: pago split en 2 métodos (ej. $50k transferencia + $55k efectivo).
  // Toggle off por default → flow tradicional 1 método. On → muestra 2da fila.
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentAmount2, setPaymentAmount2] = useState('');
  const [paymentMethod2, setPaymentMethod2] = useState('efectivo');

  // Step 3 state
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [nextEndTime, setNextEndTime] = useState('');

  // Notiz AI result handler
  const handleNotizResult = ({ sessionNotes: notes, objectives: obj, nextSteps: steps }) => {
    if (notes) setSessionNotes(notes);
    if (obj) setObjectives(obj);
    if (steps) setNextSteps(steps);
  };

  // Spec 030: derivación intra-clínica. Cargar la lista de dentistas activos
  // de la org del paciente cuando se expande la sección "Derivar". No hay
  // input de búsqueda — clínica chica = pocos dentistas, dropdown directo.
  // Cada item: nombre + chip especialidad (fallback "Dentista" si null/vacío).
  useEffect(() => {
    if (!showReferral) return;
    const orgIdResolved =
      appointment?.organization_id ||
      appointment?.patient?.organization_id ||
      null;
    if (!orgIdResolved) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    setSearching(true);
    (async () => {
      try {
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgIdResolved)
          .eq('role', 'dentist')
          .eq('is_active', true);

        const userIds = (members || [])
          .map((m) => m.user_id)
          .filter((id) => id !== therapistId);

        if (userIds.length === 0) {
          if (!cancelled) setSearchResults([]);
          return;
        }

        // Lookup full_name + specialization_areas en v_therapist_full_profile
        const { data: profiles } = await supabase
          .from('v_therapist_full_profile')
          .select('id, full_name, specialization_areas')
          .in('id', userIds)
          .order('full_name', { ascending: true });

        if (!cancelled) {
          setSearchResults((profiles || []).map((p) => ({
            therapist_id: p.id,
            full_name: p.full_name || 'Sin nombre',
            specialty: Array.isArray(p.specialization_areas) && p.specialization_areas.length > 0
              ? p.specialization_areas[0]
              : 'Dentista',
          })));
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    showReferral,
    appointment?.organization_id,
    appointment?.patient?.organization_id,
    therapistId,
  ]);

  const patientId = appointment?.patient_id;
  const patientName =
    appointment?.patient?.profile?.full_name ||
    appointment?.patient?.full_name ||
    appointment?.patients?.full_name ||
    'Paciente';

  // Initialize defaults when appointment changes
  useMemo(() => {
    if (appointment) {
      const servicePrice = appointment?.service?.price_clp || appointment?.fee || '';
      setPaymentAmount(servicePrice ? String(servicePrice) : '');

      const defaultNext = appointment?.date
        ? format(addDays(new Date(appointment.date), 7), 'yyyy-MM-dd')
        : format(addDays(new Date(), 7), 'yyyy-MM-dd');
      setNextDate(defaultNext);
      setNextTime(appointment?.start_time?.substring(0, 5) || '09:00');
      setNextEndTime(appointment?.end_time?.substring(0, 5) || '10:00');
    }
  }, [appointment]);

  const handleClose = () => {
    setStep('document');
    setCompleted({ document: false, items: false, payment: false, schedule: false });
    setSessionNotes('');
    setObjectives('');
    setNextSteps('');
    setShowReferral(false);
    setReferralType('odontologo');
    setReferralReason('');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedProfessional(null);
    setRegisterPayment(true);
    setPaymentAmount('');
    setPaymentMethod('transferencia');
    setSplitPayment(false);
    setPaymentAmount2('');
    setPaymentMethod2('efectivo');
    setScheduleNext(true);
    setNextDate('');
    setSaving(false);
    setSuggestedAmount(0);
    setActiveBudgetId(null);
    setItemsMarkedCount(0);
    setShowSkipWarning(false);
    onClose();
  };

  const goToStep = (nextStep) => setStep(nextStep);

  // ─── Step 1: Document ───
  const handleSaveDocument = async () => {
    if (!sessionNotes.trim()) {
      toast({ variant: 'destructive', title: 'Escribe al menos las notas de sesión.' });
      return;
    }

    setSaving(true);
    try {
      await createSessionRecord({
        patientId,
        therapistId,
        appointmentId: appointment.id,
        sessionNotes,
        objectives,
        nextSteps,
      });

      // Save referral as PENDING (patient must accept)
      if (showReferral && referralType && referralReason) {
        await createReferral({
          patientId,
          therapistId,
          // therapistName resolved by RPC
          referralType,
          referralReason,
          selectedProfessional,
          sourceAppointmentId: appointment.id,
        });
      }

      setCompleted((prev) => ({ ...prev, document: true }));
      toast({ title: showReferral && referralType ? 'Nota y derivación guardadas' : 'Nota clínica guardada' });
      goToStep('items');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Step 1.5: Items del presupuesto (Spec 030) ───
  const handleItemsComplete = (amount, budgetId) => {
    setSuggestedAmount(amount || 0);
    setActiveBudgetId(budgetId || null);
    setCompleted((prev) => ({ ...prev, items: true }));

    if (amount && amount > 0) {
      setPaymentAmount(String(amount));
      setItemsMarkedCount((prev) => prev + 1);
    }

    goToStep('payment');
  };

  const handleItemsSkip = () => {
    // Si saltea sin tildar nada, warning amable (FR-013)
    if (itemsMarkedCount === 0 && !showSkipWarning) {
      setShowSkipWarning(true);
      return;
    }
    setShowSkipWarning(false);
    goToStep('payment');
  };

  const confirmSkipItems = () => {
    setShowSkipWarning(false);
    setCompleted((prev) => ({ ...prev, items: false }));
    goToStep('payment');
  };

  // ─── Step 2: Payment ───
  const handleSavePayment = async () => {
    if (!registerPayment) {
      goToStep('schedule');
      return;
    }

    const amount = parseInt(paymentAmount, 10);
    if (!amount || amount <= 0) {
      toast({ variant: 'destructive', title: 'Ingresa un monto válido.' });
      return;
    }

    // Spec 030: pago split en 2 métodos
    const amount2 = splitPayment ? parseInt(paymentAmount2, 10) : 0;
    if (splitPayment) {
      if (!amount2 || amount2 <= 0) {
        toast({
          variant: 'destructive',
          title: 'Ingresa un monto válido para el segundo método de pago.',
        });
        return;
      }
      if (paymentMethod === paymentMethod2) {
        toast({
          variant: 'destructive',
          title: 'Los métodos deben ser distintos',
          description: 'Si es el mismo método, desactivá el pago combinado y sumá los montos.',
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Pago 1
      const payment = await registerSessionPayment({
        patientId,
        therapistId,
        appointmentId: appointment.id,
        amount,
        method: paymentMethod,
        budgetId: activeBudgetId, // spec 030: vincula pago a budget si hay
      });

      // UI Honesty §V: confirmar fila creada antes del toast verde
      if (!payment?.id) {
        throw new Error('El pago no se confirmó en el servidor');
      }

      // Pago 2 (si split). Si este falla, el primero ya está en DB — no rollback
      // automático. El usuario va a ver toast de error pero el primer pago queda.
      // Si esto se vuelve problema en producción, refactor a un RPC atómico.
      let payment2 = null;
      if (splitPayment) {
        payment2 = await registerSessionPayment({
          patientId,
          therapistId,
          appointmentId: appointment.id,
          amount: amount2,
          method: paymentMethod2,
          budgetId: activeBudgetId,
        });
        if (!payment2?.id) {
          throw new Error('El segundo pago no se confirmó. El primero quedó registrado.');
        }
      }

      const totalAmount = amount + amount2;
      setCompleted((prev) => ({ ...prev, payment: true }));
      toast({
        title: splitPayment
          ? `2 pagos registrados — total ${formatCurrency(totalAmount)}`
          : `Pago registrado — ${formatCurrency(amount)}`,
      });
      goToStep('schedule');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Step 3: Schedule ───
  const handleSaveSchedule = async () => {
    if (!scheduleNext) {
      goToStep('done');
      return;
    }

    if (!nextDate) {
      toast({ variant: 'destructive', title: 'Selecciona una fecha.' });
      return;
    }

    setSaving(true);
    try {
      await scheduleNextAppointment({
        patientId,
        therapistId,
        clinicId: appointment.clinic_id,
        previousAppointment: appointment,
        nextDate,
        nextTime,
        nextEndTime,
      });

      setCompleted((prev) => ({ ...prev, schedule: true }));
      toast({ title: `Cita agendada para el ${nextDate}` });
      goToStep('done');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleGoToNotiz = () => {
    handleClose();
    navigate(`/dashboard/therapist/notiz?patient=${patientId}`);
  };

  // ─── Preview text for step 3 ───
  const schedulePreview = useMemo(() => {
    if (!nextDate || !nextTime) return null;
    try {
      const dateObj = new Date(nextDate + 'T12:00:00');
      const dayStr = format(dateObj, "EEEE d 'de' MMMM", { locale: es });
      return `Se agendará para el ${dayStr} de ${nextTime} a ${nextEndTime || '?'}`;
    } catch {
      return null;
    }
  }, [nextDate, nextTime, nextEndTime]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === 'done' ? '¡Todo listo!' : 'Sesión completada'}
          </DialogTitle>
          {step !== 'done' && (
            <p className="text-sm text-gray-500">
              {patientName} — {appointment?.date} {appointment?.start_time}
            </p>
          )}
        </DialogHeader>

        {step !== 'done' && (
          <StepIndicator currentStep={step} completed={completed} />
        )}

        {/* ═══ Step 1: Document ═══ */}
        {step === 'document' && (
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium">Nota de evolución *</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ej: Endodoncia diente 36 sin complicaciones. Anestesia 1 carpule de lidocaína 2%."
                rows={2}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Indicaciones al paciente</Label>
              <Input
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Ej: Evitar masticar de ese lado 24h, ibuprofeno 400mg c/8h si hay dolor"
                className="mt-1"
              />
              {/* TODO spec 030 Bloque 3 (futuro): exponer este campo al
                  paciente en su vista (/dashboard/patient/my-treatment). Hoy
                  queda solo en clinical_history (visible al dentista). */}
            </div>

            {FEATURE_FLAGS.NOTIZ && (
              <NotizInlineWidget
                patientId={patientId}
                therapistId={therapistId}
                patientContext={patientName}
                onResult={handleNotizResult}
              />
            )}

            {/* ── Referral / Derivación ── */}
            <div className="border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowReferral(!showReferral)}
                className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm text-purple-800">Derivar a otro profesional</span>
                </div>
                {showReferral ? <ChevronUp className="h-4 w-4 text-purple-500" /> : <ChevronDown className="h-4 w-4 text-purple-500" />}
              </button>

              {showReferral && (
                <div className="p-4 space-y-3 bg-white border-t">
                  {/* Spec 030: derivación intra-clínica. Sin dropdown de tipo
                      (siempre otro dentista) ni búsqueda global. Solo dentistas
                      activos de la org del paciente. */}
                  <div>
                    <Label className="text-sm font-medium">Motivo de derivación</Label>
                    <Textarea
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      placeholder="Ej: Necesita revisión de oclusión, no es mi área"
                      rows={2}
                      className="mt-1 resize-none"
                    />
                  </div>

                  {/* Spec 030: dropdown directo con dentistas de la org del paciente.
                      Cada item muestra nombre + chip de especialidad. */}
                  <div>
                    <Label className="text-sm font-medium">Derivar a (dentista de la clínica)</Label>
                    {searching ? (
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 italic">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Cargando dentistas...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <p className="mt-1 text-xs text-gray-500 italic">
                        No hay otros dentistas activos en esta clínica.
                      </p>
                    ) : (
                      <Select
                        value={selectedProfessional?.therapist_id || ''}
                        onValueChange={(id) => {
                          const found = searchResults.find((p) => p.therapist_id === id);
                          setSelectedProfessional(found || null);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Elegí un dentista..." />
                        </SelectTrigger>
                        <SelectContent>
                          {searchResults.map((pro) => (
                            <SelectItem key={pro.therapist_id} value={pro.therapist_id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Dr. {pro.full_name}</span>
                                <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
                                  {pro.specialty}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {selectedProfessional && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-teal-50 rounded-lg border border-teal-200">
                        <UserPlus className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-teal-800 truncate">
                          Dr. {selectedProfessional.full_name}
                        </span>
                        <span className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 flex-shrink-0">
                          {selectedProfessional.specialty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedProfessional(null)}
                          className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Omitir todo
              </Button>
              <Button
                onClick={handleSaveDocument}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Guardar y continuar
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 1.5: Items del presupuesto (Spec 030) ═══ */}
        {step === 'items' && !showSkipWarning && (
          <BudgetItemsChecklistStep
            patientId={patientId}
            appointmentId={appointment?.id}
            patientFullName={patientName}
            therapistId={therapistId}
            clinicId={appointment?.clinic_id}
            organizationId={
              appointment?.organization_id ||
              appointment?.patient?.organization_id ||
              null
            }
            onComplete={handleItemsComplete}
            onSkip={handleItemsSkip}
          />
        )}

        {step === 'items' && showSkipWarning && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-900">
                  No marcaste ninguna intervención completada
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  ¿Querés volver a tildar los items que hiciste, o continuar igual al pago?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSkipWarning(false)}
              >
                Volver a tildar
              </Button>
              <Button
                onClick={confirmSkipItems}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Continuar igual
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 2: Payment ═══ */}
        {step === 'payment' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="register-payment"
                checked={registerPayment}
                onCheckedChange={setRegisterPayment}
              />
              <Label htmlFor="register-payment" className="text-sm font-medium cursor-pointer">
                Registrar pago de esta sesión
              </Label>
            </div>

            {registerPayment && (
              <div className="space-y-3 pl-6">
                {suggestedAmount > 0 && (
                  <div className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded p-2">
                    Monto sugerido por intervenciones tildadas: <strong>{formatCurrency(suggestedAmount)}</strong>
                  </div>
                )}

                {/* Pago 1 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500">Monto (CLP)</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="35000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Método</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Spec 030: toggle pago combinado */}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="split-payment"
                    checked={splitPayment}
                    onCheckedChange={setSplitPayment}
                  />
                  <Label htmlFor="split-payment" className="text-xs cursor-pointer text-gray-600">
                    Combinar con un segundo método de pago
                  </Label>
                </div>

                {/* Pago 2 (solo si split) */}
                {splitPayment && (
                  <div className="grid grid-cols-2 gap-2 rounded-md border border-dashed border-teal-300 bg-teal-50/40 p-2">
                    <div>
                      <Label className="text-xs text-gray-500">Monto 2 (CLP)</Label>
                      <Input
                        type="number"
                        value={paymentAmount2}
                        onChange={(e) => setPaymentAmount2(e.target.value)}
                        placeholder="15000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Método 2</Label>
                      <Select value={paymentMethod2} onValueChange={setPaymentMethod2}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {paymentAmount && paymentAmount2 && (
                      <div className="col-span-2 text-xs text-teal-700 font-medium">
                        Total: {formatCurrency(
                          (parseInt(paymentAmount, 10) || 0) +
                            (parseInt(paymentAmount2, 10) || 0)
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => goToStep('schedule')}>
                Saltar
              </Button>
              <Button
                onClick={handleSavePayment}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {registerPayment ? 'Registrar y continuar' : 'Continuar'}
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 3: Schedule ═══ */}
        {step === 'schedule' && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="schedule-next"
                checked={scheduleNext}
                onCheckedChange={setScheduleNext}
              />
              <Label htmlFor="schedule-next" className="text-sm font-medium cursor-pointer">
                Agendar próxima sesión
              </Label>
            </div>

            {scheduleNext && (
              <div className="space-y-3 pl-6">
                <div>
                  <Label className="text-xs text-gray-500">Fecha</Label>
                  <Input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Hora inicio</Label>
                    <div className="mt-1">
                      <TimePicker value={nextTime} onChange={setNextTime} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Hora fin</Label>
                    <div className="mt-1">
                      <TimePicker value={nextEndTime} onChange={setNextEndTime} />
                    </div>
                  </div>
                </div>
                {schedulePreview && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    {schedulePreview}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={() => goToStep('done')}>
                Saltar
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {scheduleNext ? 'Agendar y finalizar' : 'Finalizar'}
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 4: Done ═══ */}
        {step === 'done' && (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900">¡Todo listo!</h3>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {completed.document && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Nota clínica
                </span>
              )}
              {completed.items && itemsMarkedCount > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-sm font-medium border border-teal-200">
                  <ListChecks className="h-3.5 w-3.5" /> Intervenciones tildadas
                </span>
              )}
              {completed.payment && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Pago registrado
                </span>
              )}
              {completed.schedule && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Próxima cita
                </span>
              )}
              {showReferral && referralType && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200">
                  <UserPlus className="h-3.5 w-3.5" /> Derivación registrada
                </span>
              )}
              {!completed.document && !completed.payment && !completed.schedule && (
                <p className="text-sm text-gray-500">No se registró ninguna acción.</p>
              )}
            </div>

            <Button onClick={handleClose} className="mt-4">
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostSessionModal;
