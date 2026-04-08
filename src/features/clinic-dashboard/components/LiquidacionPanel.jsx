import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Plus,
  Trash2,
  Receipt,
  Calculator,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import logger from '@/lib/utils/logger';
import { generateLiquidacionPDF } from '../utils/generateLiquidacionPDF';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount || 0);

const LiquidacionPanel = ({
  therapists = [],
  appointments = [],
  clinicInfo = null,
}) => {
  const { toast } = useToast();
  const now = new Date();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal for adjustments
  const [adjustModal, setAdjustModal] = useState(null); // therapist object or null
  const [discounts, setDiscounts] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [newAdjustConcept, setNewAdjustConcept] = useState('');
  const [newAdjustAmount, setNewAdjustAmount] = useState('');

  // ========== DATA POR TERAPEUTA ==========
  const liquidacionData = useMemo(() => {
    return therapists.map((t) => {
      // Filtrar sesiones completadas del mes seleccionado
      const monthSessions = appointments.filter((a) => {
        if (a.therapist_id !== t.therapist_id) return false;
        if (a.status !== 'completed') return false;
        try {
          const d = parseISO(a.date);
          return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        } catch { return false; }
      });

      const totalRevenue = monthSessions.reduce((sum, a) => {
        const price = a.services?.price_clp || a.services?.[0]?.price_clp || 0;
        return sum + Number(price);
      }, 0);

      const commissionPercent = t.commission_percent ?? 30;
      const commissionAmount = Math.round(totalRevenue * (commissionPercent / 100));
      const netPayment = totalRevenue - commissionAmount;

      // Construir array de sesiones para el PDF
      const sessionsDetail = monthSessions.map((a) => ({
        date: a.date,
        patientName: a.patient_id ? `Paciente` : '-', // no tenemos el nombre directo
        serviceName: 'Sesión de terapia',
        duration: a.duration_minutes || null,
        amount: a.services?.price_clp || a.services?.[0]?.price_clp || 0,
      }));

      return {
        ...t,
        name: t.profiles?.full_name || 'Terapeuta',
        rut: t.profiles?.rut || null,
        email: t.profiles?.email || null,
        sessionsCount: monthSessions.length,
        totalRevenue,
        commissionPercent,
        commissionAmount,
        netPayment,
        sessionsDetail,
      };
    }).filter((t) => t.sessionsCount > 0 || t.is_active)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [therapists, appointments, selectedMonth, selectedYear]);

  // ========== TOTALES ==========
  const totals = useMemo(() => {
    return liquidacionData.reduce(
      (acc, t) => ({
        sessions: acc.sessions + t.sessionsCount,
        revenue: acc.revenue + t.totalRevenue,
        commissions: acc.commissions + t.commissionAmount,
        netPayout: acc.netPayout + t.netPayment,
      }),
      { sessions: 0, revenue: 0, commissions: 0, netPayout: 0 }
    );
  }, [liquidacionData]);

  // ========== GENERAR PDF ==========
  const handleGeneratePDF = (t) => {
    // Buscar adjustments del modal si hay
    const tDiscounts = adjustModal?.id === t.id ? discounts : [];
    const tBonuses = adjustModal?.id === t.id ? bonuses : [];

    try {
      const result = generateLiquidacionPDF({
        clinic: {
          name: clinicInfo?.name || 'Centro Clínico',
          rut: clinicInfo?.rut || null,
          address: clinicInfo?.address || null,
          phone: clinicInfo?.phone || null,
        },
        therapist: {
          name: t.name,
          rut: t.rut,
          email: t.email,
          specialty: 'Fonoaudiólogo/a',
        },
        month: selectedMonth,
        year: selectedYear,
        sessions: t.sessionsDetail,
        commissionPercent: t.commissionPercent,
        discounts: tDiscounts,
        bonuses: tBonuses,
      });

      toast({
        title: 'Liquidación generada',
        description: `${result.filename} · ${result.totalSessions} sesiones · ${formatCLP(result.netAmount)} líquido`,
      });
    } catch (err) {
      logger.error('PDF error:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
    }
  };

  // ========== GENERAR TODOS ==========
  const handleGenerateAll = () => {
    const withSessions = liquidacionData.filter((t) => t.sessionsCount > 0);
    if (withSessions.length === 0) {
      toast({ variant: 'destructive', title: 'Sin datos', description: 'No hay sesiones para generar liquidaciones.' });
      return;
    }
    withSessions.forEach((t) => handleGeneratePDF(t));
    toast({ title: `${withSessions.length} liquidaciones generadas`, description: `Período: ${MONTHS[selectedMonth]} ${selectedYear}` });
  };

  // ========== MODAL: Abrir con ajustes ==========
  const openAdjustModal = (t) => {
    setAdjustModal(t);
    setDiscounts([]);
    setBonuses([]);
    setNewAdjustConcept('');
    setNewAdjustAmount('');
  };

  const addAdjustment = (type) => {
    const amount = parseInt(newAdjustAmount, 10);
    if (!newAdjustConcept.trim() || !amount || amount <= 0) return;

    const item = { concept: newAdjustConcept.trim(), amount };
    if (type === 'discount') setDiscounts((prev) => [...prev, item]);
    else setBonuses((prev) => [...prev, item]);

    setNewAdjustConcept('');
    setNewAdjustAmount('');
  };

  const handleGenerateWithAdjustments = () => {
    if (!adjustModal) return;

    const t = liquidacionData.find((x) => x.id === adjustModal.id) || adjustModal;

    try {
      generateLiquidacionPDF({
        clinic: {
          name: clinicInfo?.name || 'Centro Clínico',
          rut: clinicInfo?.rut || null,
          address: clinicInfo?.address || null,
          phone: clinicInfo?.phone || null,
        },
        therapist: {
          name: t.name,
          rut: t.rut,
          email: t.email,
          specialty: 'Fonoaudiólogo/a',
        },
        month: selectedMonth,
        year: selectedYear,
        sessions: t.sessionsDetail,
        commissionPercent: t.commissionPercent,
        discounts,
        bonuses,
      });

      toast({ title: 'Liquidación con ajustes generada', description: `${t.name} · ${MONTHS[selectedMonth]} ${selectedYear}` });
      setAdjustModal(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    }
  };

  // ========== YEARS ARRAY ==========
  const years = [now.getFullYear() - 1, now.getFullYear()];

  // ========== EMPTY STATE ==========
  if (therapists.length === 0) {
    return (
      <Card className="border border-gray-100">
        <CardContent className="py-8 text-center">
          <Receipt className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Sin terapeutas para liquidar</p>
        </CardContent>
      </Card>
    );
  }

  // ========== RENDER ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Receipt className="h-4 w-4 text-violet-600" />
                </div>
                Liquidación de honorarios
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Genera el documento mensual listo para firma y contabilidad
              </CardDescription>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-2">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yr) => (
                    <SelectItem key={yr} value={String(yr)}>{yr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Summary bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-gray-500 uppercase">Sesiones</p>
              <p className="text-base font-bold text-gray-900">{totals.sessions}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-gray-500 uppercase">Facturado</p>
              <p className="text-base font-bold text-gray-900">{formatCLP(totals.revenue)}</p>
            </div>
            <div className="bg-violet-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-violet-600 uppercase">Retención</p>
              <p className="text-base font-bold text-violet-700">{formatCLP(totals.commissions)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-emerald-600 uppercase">A pagar</p>
              <p className="text-base font-bold text-emerald-700">{formatCLP(totals.netPayout)}</p>
            </div>
          </div>

          {/* Per-therapist rows */}
          <div className="space-y-2">
            {liquidacionData.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <div className="h-9 w-9 rounded-full bg-violet-50 overflow-hidden shrink-0">
                  <ProfileAvatar
                    profile={t.profiles || t}
                    src={t.profiles?.avatar_url}
                    alt={t.name}
                    className="h-9 w-9"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {t.sessionsCount} sesión{t.sessionsCount !== 1 ? 'es' : ''} · {t.commissionPercent}% comisión
                    {t.rut && ` · ${t.rut}`}
                  </p>
                </div>

                {/* Amounts */}
                <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs">
                  <div className="text-right">
                    <p className="text-gray-600">{formatCLP(t.totalRevenue)}</p>
                    <p className="text-[10px] text-gray-400">bruto</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">{formatCLP(t.netPayment)}</p>
                    <p className="text-[10px] text-gray-400">líquido</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {t.sessionsCount > 0 && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] text-gray-500 hover:text-violet-600 px-2 opacity-70 group-hover:opacity-100"
                        onClick={() => openAdjustModal(t)}
                        title="Agregar bonos o descuentos"
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Ajustar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] text-violet-600 hover:text-violet-800 px-2 font-medium opacity-70 group-hover:opacity-100"
                        onClick={() => handleGeneratePDF(t)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </>
                  )}
                  {t.sessionsCount === 0 && (
                    <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200">
                      Sin sesiones
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Generate all button */}
          {totals.sessions > 0 && (
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleGenerateAll}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generar todas las liquidaciones ({MONTHS[selectedMonth]} {selectedYear})
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ========== MODAL DE AJUSTES ========== */}
      <Dialog open={!!adjustModal} onOpenChange={(open) => !open && setAdjustModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              Ajustes para {adjustModal?.name}
            </DialogTitle>
            <p className="text-xs text-gray-500">
              {MONTHS[selectedMonth]} {selectedYear} · {adjustModal?.sessionsCount} sesiones · {formatCLP(adjustModal?.totalRevenue)} bruto
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Input para agregar */}
            <div className="flex gap-2">
              <Input
                placeholder="Concepto (ej: Bono puntualidad)"
                value={newAdjustConcept}
                onChange={(e) => setNewAdjustConcept(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Monto"
                value={newAdjustAmount}
                onChange={(e) => setNewAdjustAmount(e.target.value)}
                className="w-24 h-8 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs border-green-200 text-green-700 hover:bg-green-50" onClick={() => addAdjustment('bonus')}>
                <Plus className="h-3 w-3 mr-1" /> Bono
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs border-red-200 text-red-600 hover:bg-red-50" onClick={() => addAdjustment('discount')}>
                <Plus className="h-3 w-3 mr-1" /> Descuento
              </Button>
            </div>

            {/* Lista de bonos */}
            {bonuses.length > 0 && (
              <div>
                <Label className="text-xs text-green-600 font-medium">Bonos</Label>
                <div className="space-y-1 mt-1">
                  {bonuses.map((b, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 rounded px-2 py-1 text-xs">
                      <span className="text-green-800">{b.concept}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-green-700">+{formatCLP(b.amount)}</span>
                        <button onClick={() => setBonuses(prev => prev.filter((_, idx) => idx !== i))} className="text-green-400 hover:text-red-500">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de descuentos */}
            {discounts.length > 0 && (
              <div>
                <Label className="text-xs text-red-600 font-medium">Descuentos</Label>
                <div className="space-y-1 mt-1">
                  {discounts.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-red-50 rounded px-2 py-1 text-xs">
                      <span className="text-red-800">{d.concept}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-red-700">-{formatCLP(d.amount)}</span>
                        <button onClick={() => setDiscounts(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {adjustModal && (
              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bruto:</span>
                  <span>{formatCLP(adjustModal.totalRevenue)}</span>
                </div>
                {bonuses.map((b, i) => (
                  <div key={`b${i}`} className="flex justify-between text-green-600">
                    <span>+ {b.concept}:</span>
                    <span>{formatCLP(b.amount)}</span>
                  </div>
                ))}
                {discounts.map((d, i) => (
                  <div key={`d${i}`} className="flex justify-between text-red-500">
                    <span>- {d.concept}:</span>
                    <span>-{formatCLP(d.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-red-500">
                  <span>- Comisión ({adjustModal.commissionPercent}%):</span>
                  <span>-{formatCLP(adjustModal.commissionAmount)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-bold text-sm">
                  <span>Líquido:</span>
                  <span className="text-emerald-700">
                    {formatCLP(
                      adjustModal.totalRevenue +
                      bonuses.reduce((s, b) => s + b.amount, 0) -
                      discounts.reduce((s, d) => s + d.amount, 0) -
                      adjustModal.commissionAmount
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAdjustModal(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleGenerateWithAdjustments}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Generar PDF con ajustes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default LiquidacionPanel;