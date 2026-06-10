import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, FileText, X, Pencil, DollarSign, ChevronDown, ChevronUp, Stethoscope, FileDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateBudgetPdf } from '../lib/budgetPdfGenerator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import logger from '@/lib/utils/logger';

import { useBudgets, cancelBudget, updateBudgetStatus } from '../hooks/useBudgets';
import BudgetFormModal from './BudgetFormModal';
import PaymentFormModal from './PaymentFormModal';
import PaymentsList from './PaymentsList';

const STATUS_LABELS = {
  borrador: { label: 'Borrador', color: 'bg-slate-200 text-slate-700' },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  aceptado: { label: 'Aceptado', color: 'bg-emerald-100 text-emerald-700' },
  en_progreso: { label: 'En progreso', color: 'bg-amber-100 text-amber-800' },
  pagado: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

const formatCLP = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n || 0));

const BudgetsTab = ({ patientId, onSwitchToOdontogram }) => {
  const { budgets, loading, error, refresh } = useBudgets(patientId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [paymentBudget, setPaymentBudget] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expandedBudgetId, setExpandedBudgetId] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const handleDownloadPdf = async (budget) => {
    setDownloadingPdfId(budget.budget_id);
    try {
      await generateBudgetPdf({
        budgetId: budget.budget_id,
        patientId: budget.patient_id,
        dentistId: budget.therapist_id || user?.id,
        clinicId: budget.clinic_id || null,
      });
    } catch (err) {
      logger.error('[BudgetsTab] PDF generation failed:', err);
      toast({
        variant: 'destructive',
        title: 'No se pudo generar el PDF',
        description: err.message,
      });
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const openPayment = (budget) => {
    setPaymentBudget(budget);
    setPaymentModalOpen(true);
  };

  const togglePayments = (budgetId) => {
    setExpandedBudgetId(prev => prev === budgetId ? null : budgetId);
  };

  const openCreate = () => {
    setEditingBudgetId(null);
    setModalOpen(true);
  };

  const openEdit = (budgetId) => {
    setEditingBudgetId(budgetId);
    setModalOpen(true);
  };

  const handleModalChange = (next) => {
    setModalOpen(next);
    if (!next) setEditingBudgetId(null);
  };

  const handleCancel = async (budgetId) => {
    if (!window.confirm('¿Cancelar este presupuesto? Esta acción no se puede deshacer.')) return;
    try {
      await cancelBudget(budgetId);
      toast({ title: 'Presupuesto cancelado' });
      refresh();
    } catch (err) {
      logger.error('[BudgetsTab] cancel error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  const handleSend = async (budgetId) => {
    try {
      await updateBudgetStatus(budgetId, 'enviado');
      toast({ title: 'Presupuesto enviado al paciente' });
      refresh();
    } catch (err) {
      logger.error('[BudgetsTab] send error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Presupuestos</h3>
          <p className="text-sm text-muted-foreground">
            Cotizaciones de tratamiento para este paciente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Spec 030 followup: shortcut a Odontograma para crear plan a partir
              del diagnóstico visual. Solo se muestra si el caller cableó el
              callback (en la ficha standalone, no en lugares donde no hay tab). */}
          {onSwitchToOdontogram && (
            <Button
              variant="outline"
              onClick={onSwitchToOdontogram}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Crear desde diagnóstico
            </Button>
          )}
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo presupuesto
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          Error al cargar presupuestos: {error.message}
        </div>
      )}

      {!loading && !error && budgets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aún no hay presupuestos para este paciente.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea uno nuevo con el botón de arriba.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && budgets.length > 0 && (
        <div className="space-y-3">
          {budgets.map((b) => {
            const statusInfo = STATUS_LABELS[b.status] || STATUS_LABELS.borrador;
            const canRegisterPayment = ['enviado', 'aceptado', 'en_progreso'].includes(b.status);
            const isExpanded = expandedBudgetId === b.budget_id;
            const hasPayments = b.payment_count > 0;
            return (
              <Card key={b.budget_id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">
                          Presupuesto #{b.budget_number}
                        </span>
                        <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <p className="text-sm text-foreground truncate">{b.title}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span>Total: <strong className="text-foreground">${formatCLP(b.total)}</strong></span>
                        <span>Pagado: <strong className="text-foreground">${formatCLP(b.total_paid)}</strong></span>
                        <span>Saldo: <strong className={b.balance_due > 0 ? 'text-amber-700' : 'text-green-700'}>${formatCLP(b.balance_due)}</strong></span>
                        {b.discount_percentage > 0 && (
                          <span>Descuento: {b.discount_percentage}%</span>
                        )}
                      </div>

                      {/* Spec 030 followup: progreso clínico (items ejecutados) */}
                      {b.items_total > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Avance clínico</span>
                            <span className="font-medium text-gray-700">
                              {b.progress_percent}% · {b.items_completed} de {b.items_total} intervenciones
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                              style={{ width: `${b.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Chips de dientes incluidos en el presupuesto */}
                      {b.teeth && b.teeth.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Incluye:</span>
                          {b.teeth.map((t) => (
                            <span
                              key={t}
                              className={
                                t === 'General'
                                  ? 'inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium'
                                  : 'inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-xs font-medium'
                              }
                            >
                              {t === 'General' ? 'General' : `Diente ${t}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {b.status === 'borrador' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(b.budget_id)}
                            title="Editar borrador"
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" onClick={() => handleSend(b.budget_id)}>
                            Enviar
                          </Button>
                        </>
                      )}
                      {/* Spec 030 followup: descargar PDF para budgets no borrador */}
                      {b.status !== 'borrador' && b.status !== 'cancelado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPdf(b)}
                          disabled={downloadingPdfId === b.budget_id}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                          title="Descargar PDF del presupuesto"
                        >
                          {downloadingPdfId === b.budget_id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4 mr-1" />
                          )}
                          PDF
                        </Button>
                      )}
                      {canRegisterPayment && (
                        <Button size="sm" onClick={() => openPayment(b)}>
                          <DollarSign className="h-4 w-4 mr-1" /> Registrar pago
                        </Button>
                      )}
                      {b.status !== 'cancelado' && b.status !== 'pagado' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancel(b.budget_id)}
                          className="text-destructive"
                          title="Cancelar presupuesto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Toggle expandir pagos */}
                  {(hasPayments || canRegisterPayment) && (
                    <button
                      type="button"
                      onClick={() => togglePayments(b.budget_id)}
                      className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {isExpanded ? 'Ocultar' : 'Ver'} pagos ({b.payment_count || 0})
                    </button>
                  )}

                  {isExpanded && (
                    <div className="mt-3 pl-3 border-l-2 border-muted">
                      <PaymentsList
                        budgetId={b.budget_id}
                        onChange={refresh}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetFormModal
        open={modalOpen}
        onOpenChange={handleModalChange}
        patientId={patientId}
        budgetId={editingBudgetId}
        onCreated={refresh}
        onUpdated={refresh}
      />

      <PaymentFormModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        budget={paymentBudget}
        patientId={patientId}
        onCreated={refresh}
      />
    </div>
  );
};

export default BudgetsTab;
