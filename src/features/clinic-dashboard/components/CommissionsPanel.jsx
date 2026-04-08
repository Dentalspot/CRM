import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Users,
  Edit2,
  Check,
  X,
  Download,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ProfileAvatar from '@/components/shared/ProfileAvatar';

const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const CommissionsPanel = ({
  therapists = [],
  appointments = [],
  onCommissionUpdated,
}) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  // ========== CÁLCULOS POR TERAPEUTA ==========
  const commissionsData = useMemo(() => {
    return therapists.map((t) => {
      const tApps = appointments.filter(
        (a) => a.therapist_id === t.therapist_id && a.status === 'completed'
      );

      const totalRevenue = tApps.reduce((sum, a) => {
        const price = a.services?.price_clp || a.services?.[0]?.price_clp || 0;
        return sum + Number(price);
      }, 0);

      const commissionPercent = t.commission_percent ?? 30;
      const clinicEarnings = Math.round(totalRevenue * (commissionPercent / 100));
      const therapistEarnings = totalRevenue - clinicEarnings;

      return {
        ...t,
        sessionsCompleted: tApps.length,
        totalRevenue,
        commissionPercent,
        clinicEarnings,
        therapistEarnings,
        name: t.profiles?.full_name || 'Terapeuta',
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [therapists, appointments]);

  // ========== TOTALES ==========
  const totals = useMemo(() => {
    return commissionsData.reduce(
      (acc, t) => ({
        revenue: acc.revenue + t.totalRevenue,
        clinicEarnings: acc.clinicEarnings + t.clinicEarnings,
        therapistPayouts: acc.therapistPayouts + t.therapistEarnings,
        sessions: acc.sessions + t.sessionsCompleted,
      }),
      { revenue: 0, clinicEarnings: 0, therapistPayouts: 0, sessions: 0 }
    );
  }, [commissionsData]);

  // ========== GUARDAR COMISIÓN ==========
  const handleSave = async (clinicTherapistId) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0 || val > 100) {
      toast({ variant: 'destructive', title: 'Error', description: 'El porcentaje debe estar entre 0 y 100.' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clinic_therapists')
        .update({ commission_percent: val })
        .eq('id', clinicTherapistId);

      if (error) throw error;

      toast({ title: 'Comisión actualizada', description: `Nuevo porcentaje: ${val}%` });
      setEditingId(null);
      onCommissionUpdated?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  // ========== EXPORT CSV ==========
  const handleExport = () => {
    if (commissionsData.length === 0) return;

    const headers = ['Terapeuta', 'Sesiones', 'Ingreso Total', '% Comisión', 'Retención Centro', 'Pago Terapeuta'];
    const rows = commissionsData.map((t) => [
      `"${t.name}"`,
      t.sessionsCompleted,
      t.totalRevenue,
      t.commissionPercent,
      t.clinicEarnings,
      t.therapistEarnings,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comisiones_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ========== EMPTY STATE ==========
  if (therapists.length === 0) {
    return (
      <Card className="border border-gray-100">
        <CardContent className="py-8 text-center">
          <DollarSign className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Sin terapeutas para calcular comisiones</p>
          <p className="text-sm text-gray-400 mt-1">Agrega terapeutas a tu centro para ver el desglose.</p>
        </CardContent>
      </Card>
    );
  }

  // ========== RENDER ==========
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.25 }}
    >
      <Card className="border border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                Comisiones por terapeuta
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Basado en sesiones completadas · Haz clic en el % para editar
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={handleExport}
              disabled={commissionsData.length === 0}
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Ingreso total</p>
              <p className="text-lg font-bold text-gray-900">{formatCLP(totals.revenue)}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-xs text-emerald-600">Retención centro</p>
              <p className="text-lg font-bold text-emerald-700">{formatCLP(totals.clinicEarnings)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600">Pago terapeutas</p>
              <p className="text-lg font-bold text-blue-700">{formatCLP(totals.therapistPayouts)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Sesiones</p>
              <p className="text-lg font-bold text-gray-900">{totals.sessions}</p>
            </div>
          </div>

          {/* Per-therapist breakdown */}
          <div className="space-y-2">
            {commissionsData.map((t) => {
              const isEditing = editingId === t.id;

              return (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-teal-50 overflow-hidden shrink-0">
                    <ProfileAvatar
                      profile={t.profiles || t}
                      src={t.profiles?.avatar_url}
                      alt={t.name}
                      className="h-9 w-9"
                    />
                  </div>

                  {/* Name + sessions */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {t.sessionsCompleted} sesión{t.sessionsCompleted !== 1 ? 'es' : ''} · {formatCLP(t.totalRevenue)} facturado
                    </p>
                  </div>

                  {/* Commission % (editable) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 h-7 text-xs text-center"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave(t.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <span className="text-xs text-gray-400">%</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-green-600"
                          onClick={() => handleSave(t.id)}
                          disabled={saving}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-400"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(t.id);
                          setEditValue(String(t.commissionPercent));
                        }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 transition-colors cursor-pointer"
                        title="Editar comisión"
                      >
                        <span className="font-semibold">{t.commissionPercent}%</span>
                        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>

                  {/* Earnings split */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs">
                    <div className="text-right">
                      <p className="text-emerald-600 font-semibold">{formatCLP(t.clinicEarnings)}</p>
                      <p className="text-[10px] text-gray-400">centro</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-600 font-semibold">{formatCLP(t.therapistEarnings)}</p>
                      <p className="text-[10px] text-gray-400">terapeuta</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CommissionsPanel;