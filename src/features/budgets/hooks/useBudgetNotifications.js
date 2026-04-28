import { supabase } from '@/lib/supabaseClient';
import logger from '@/lib/utils/logger';

/**
 * Helpers para disparar notificaciones de budgets/payments.
 * Fire-and-forget: si falla la notificación, NO se interrumpe el flujo del usuario.
 */

/**
 * Crear notificación in-app para un usuario (vía RPC SECURITY DEFINER).
 */
export const createInAppNotification = async ({
  userId,
  type,
  title,
  message,
  actionUrl = null,
  data = null,
}) => {
  try {
    const { error } = await supabase.rpc('create_in_app_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_action_url: actionUrl,
      p_data: data,
    });
    if (error) throw error;
  } catch (err) {
    logger.warn('[notifications] in-app failed (non-blocking):', err.message);
  }
};

/**
 * Invocar Edge Function que envía email via Resend.
 */
export const sendBudgetEmail = async ({ eventType, budgetId }) => {
  try {
    const { error } = await supabase.functions.invoke('send-budget-notifications', {
      body: { event_type: eventType, budget_id: budgetId },
    });
    if (error) throw error;
  } catch (err) {
    logger.warn('[notifications] email failed (non-blocking):', err.message);
  }
};

/**
 * Notificar: dentista envió presupuesto al paciente.
 * Email + in-app al paciente.
 */
export const notifyBudgetSent = async ({ budget, patientProfileId }) => {
  if (patientProfileId) {
    createInAppNotification({
      userId: patientProfileId,
      type: 'budget_sent',
      title: 'Tienes un nuevo presupuesto',
      message: `Presupuesto #${budget.budget_number} — ${budget.title}`,
      actionUrl: '/dashboard',
      data: { budget_id: budget.id, budget_number: budget.budget_number },
    });
  }
  sendBudgetEmail({ eventType: 'budget_sent', budgetId: budget.id });
};

/**
 * Notificar: paciente aceptó presupuesto.
 * In-app al dentista (sin email — por decisión MVP).
 */
export const notifyBudgetAccepted = async ({ budget, patientName }) => {
  createInAppNotification({
    userId: budget.therapist_id,
    type: 'budget_accepted',
    title: 'Presupuesto aceptado',
    message: `${patientName || 'Paciente'} aceptó el presupuesto #${budget.budget_number}`,
    actionUrl: `/dashboard/patients/${budget.patient_id}`,
    data: { budget_id: budget.id },
  });
};

/**
 * Notificar: pago registrado en presupuesto.
 * In-app al paciente (sin email — evita spam).
 */
export const notifyPaymentRegistered = async ({ budget, amount, patientProfileId }) => {
  if (!patientProfileId) return;
  createInAppNotification({
    userId: patientProfileId,
    type: 'budget_payment_registered',
    title: 'Pago registrado',
    message: `Se registró un pago de $${new Intl.NumberFormat('es-CL').format(amount)} en el presupuesto #${budget.budget_number}`,
    actionUrl: '/dashboard',
    data: { budget_id: budget.id, amount },
  });
};

/**
 * Notificar: presupuesto pagado completamente.
 * In-app SOLO al paciente (sin email — por decisión MVP).
 */
export const notifyBudgetCompleted = async ({ budget, patientProfileId }) => {
  if (!patientProfileId) return;
  createInAppNotification({
    userId: patientProfileId,
    type: 'budget_completed',
    title: '¡Presupuesto pagado completamente!',
    message: `El presupuesto #${budget.budget_number} ha sido pagado en su totalidad.`,
    actionUrl: '/dashboard',
    data: { budget_id: budget.id },
  });
};
