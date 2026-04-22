import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
  Mic,
  Loader2,
  UserPlus,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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

const STEPS = ['document', 'payment', 'schedule', 'done'];

// ─── Step Indicator ───
const StepIndicator = ({ currentStep, completed }) => {
  const stepsMeta = [
    { key: 'document', icon: FileText, label: 'Nota' },
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
    payment: false,
    schedule: false,
  });

  // Step 1 state
  const [sessionNotes, setSessionNotes] = useState('');
  const [objectives, setObjectives] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  // Referral state
  const [showReferral, setShowReferral] = useState(false);
  const [referralType, setReferralType] = useState('');
  const [referralReason, setReferralReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState(null);

  // Step 2 state
  const [registerPayment, setRegisterPayment] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');

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

  // Search professionals in DentalSpot
  const handleSearchProfessionals = useCallback(async (term) => {
    setSearchTerm(term);
    if (term.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, therapist_branding(avatar_url)')
        .eq('role', 'therapist')
        .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(6);
      setSearchResults((data || []).map(d => ({
        therapist_id: d.id,
        full_name: d.full_name,
        email: d.email,
        avatar_url: d.therapist_branding?.[0]?.avatar_url || d.therapist_branding?.avatar_url || null,
      })));
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

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
    setCompleted({ document: false, payment: false, schedule: false });
    setSessionNotes('');
    setObjectives('');
    setNextSteps('');
    setShowReferral(false);
    setReferralType('');
    setReferralReason('');
    setSearchTerm('');
    setSearchResults([]);
    setSelectedProfessional(null);
    setRegisterPayment(true);
    setPaymentAmount('');
    setPaymentMethod('transferencia');
    setScheduleNext(true);
    setNextDate('');
    setSaving(false);
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
      goToStep('payment');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
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

    setSaving(true);
    try {
      await registerSessionPayment({
        patientId,
        therapistId,
        appointmentId: appointment.id,
        amount,
        method: paymentMethod,
      });

      setCompleted((prev) => ({ ...prev, payment: true }));
      toast({ title: 'Pago registrado' });
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
              <Label className="text-sm font-medium">Notas de sesión *</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Descripción de lo trabajado, observaciones, progreso..."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Objetivos trabajados</Label>
              <Input
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Ej: Articulación /r/, comprensión de instrucciones"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Próximos pasos</Label>
              <Input
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                placeholder="Ej: Reforzar en casa con ejercicios de soplo"
                className="mt-1"
              />
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
                  <div>
                    <Label className="text-sm font-medium">Tipo de profesional</Label>
                    <Select value={referralType} onValueChange={setReferralType}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {REFERRAL_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Motivo de derivación</Label>
                    <Textarea
                      value={referralReason}
                      onChange={(e) => setReferralReason(e.target.value)}
                      placeholder="Ej: Se requiere evaluación cognitiva mediante WISC..."
                      rows={2}
                      className="mt-1 resize-none"
                    />
                  </div>

                  {/* Search DentalSpot professionals */}
                  <div>
                    <Label className="text-sm font-medium">Buscar profesional en DentalSpot</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => handleSearchProfessionals(e.target.value)}
                        placeholder="Nombre del profesional..."
                        className="pl-9"
                      />
                      {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mt-2 border rounded-lg divide-y max-h-[180px] overflow-y-auto">
                        {searchResults.map(pro => (
                          <button
                            key={pro.therapist_id}
                            type="button"
                            onClick={() => { setSelectedProfessional(pro); setSearchTerm(pro.full_name); setSearchResults([]); }}
                            className={`w-full flex items-center gap-3 p-2.5 text-left hover:bg-teal-50 transition-colors ${selectedProfessional?.therapist_id === pro.id ? 'bg-teal-50' : ''}`}
                          >
                            {pro.avatar_url ? (
                              <img src={pro.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 text-xs font-bold">
                                {(pro.full_name || '?')[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{pro.full_name}</p>
                              <p className="text-xs text-gray-500 truncate">{''}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedProfessional && (
                      <div className="mt-2 flex items-center gap-2 p-2 bg-teal-50 rounded-lg border border-teal-200">
                        <UserPlus className="h-4 w-4 text-teal-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-teal-800 truncate">{selectedProfessional.full_name}</span>
                        <a href={`/profesionales/${selectedProfessional.therapist_id}`} target="_blank" rel="noopener noreferrer" className="ml-auto">
                          <ExternalLink className="h-3.5 w-3.5 text-teal-500" />
                        </a>
                        <button type="button" onClick={() => { setSelectedProfessional(null); setSearchTerm(''); }} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
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
                  <Label className="text-xs text-gray-500">Método de pago</Label>
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
                    <Input
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Hora fin</Label>
                    <Input
                      type="time"
                      value={nextEndTime}
                      onChange={(e) => setNextEndTime(e.target.value)}
                      className="mt-1"
                    />
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
