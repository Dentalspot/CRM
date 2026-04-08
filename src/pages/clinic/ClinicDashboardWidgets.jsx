import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Calendar, DollarSign, Activity, TrendingUp, Store,
  Clock, Building2, PlusCircle, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================
// SimpleBarChart
// ============================================

export const SimpleBarChart = ({ data, color = "bg-blue-500" }) => {
  if (!data || data.length === 0) return <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Sin datos suficientes</div>;

  const maxVal = Math.max(...data.map(d => d.value));

  return (
    <div className="flex items-end space-x-2 h-32 w-full pt-4">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center group">
          <div className="relative w-full flex items-end justify-center h-full">
             <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`w-4/5 ${color} rounded-t-sm opacity-80 group-hover:opacity-100 transition-opacity`}
            />
            <div className="absolute -top-8 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {item.value}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// CreateClinicBanner
// ============================================

export const CreateClinicBanner = ({ onOpenCreate }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden mb-8"
  >
    {/* Decorative background shapes */}
    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-purple-500 opacity-20 rounded-full blur-xl"></div>

    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex-1 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-3 border border-white/10">
          <Building2 className="h-3 w-3" />
          <span>Configuración Inicial</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">¡Bienvenido a tu Panel Clínico!</h2>
        <p className="text-blue-100 max-w-xl text-sm md:text-base">
          Aún no tienes una clínica registrada. Crea tu primera clínica para gestionar tu equipo, asignar terapeutas y centralizar la información de tus pacientes.
        </p>
      </div>

      <div className="shrink-0">
        <Button
          onClick={onOpenCreate}
          size="lg"
          className="bg-white text-blue-600 hover:bg-blue-50 font-bold shadow-lg border-0 transition-all hover:scale-105 active:scale-95"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Registrar Clínica
        </Button>
      </div>
    </div>
  </motion.div>
);

// ============================================
// MetricCards
// ============================================

const MetricValue = ({ value, emptyHint }) => (
  value > 0
    ? <div className="text-2xl font-bold">{typeof value === 'string' ? value : value}</div>
    : <p className="text-sm text-gray-400 mt-1">{emptyHint}</p>
);

export const MetricCards = ({ metrics }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card className="border-l-4 border-l-blue-500 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Terapeutas</CardTitle>
        <Users className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <MetricValue value={metrics.totalTherapists} emptyHint="Invita a tu primer terapeuta para comenzar" />
        {metrics.totalTherapists > 0 && <p className="text-xs text-muted-foreground mt-1">Profesionales activos</p>}
      </CardContent>
    </Card>

    <Card className="border-l-4 border-l-green-500 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Pacientes Activos</CardTitle>
        <Activity className="h-4 w-4 text-green-500" />
      </CardHeader>
      <CardContent>
        <MetricValue value={metrics.activePatients} emptyHint="Aparecerán aquí cuando registres citas" />
        {metrics.activePatients > 0 && <p className="text-xs text-muted-foreground mt-1">Con citas recientes</p>}
      </CardContent>
    </Card>

    <Card className="border-l-4 border-l-purple-500 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Sesiones Totales</CardTitle>
        <Calendar className="h-4 w-4 text-purple-500" />
      </CardHeader>
      <CardContent>
        <MetricValue value={metrics.totalSessions} emptyHint="Agenda tu primera cita para ver métricas aquí" />
        {metrics.totalSessions > 0 && <p className="text-xs text-muted-foreground mt-1">Realizadas históricamente</p>}
      </CardContent>
    </Card>

    <Card className="border-l-4 border-l-amber-500 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Ingresos Estimados</CardTitle>
        <DollarSign className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        {metrics.revenue > 0 ? (
          <>
            <div className="text-2xl font-bold">${metrics.revenue.toLocaleString('es-CL')}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className={Number(metrics.revenueChange) >= 0 ? "text-green-600" : "text-red-600"}>
                {metrics.revenueChange > 0 ? '+' : ''}{metrics.revenueChange}%
              </span>
              <span className="ml-1">vs mes anterior</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 mt-1">Los ingresos se calcularán con las sesiones completadas</p>
        )}
      </CardContent>
    </Card>
  </div>
);

// ============================================
// WeeklyKPIs
// ============================================

export const WeeklyKPIs = ({ metrics }) => {
  const allZero = !metrics.completedThisWeek && !metrics.scheduledThisWeek && !metrics.cancelledThisWeek && !metrics.noShowRate;

  if (allZero) {
    return (
      <Card className="bg-gray-50 shadow-sm">
        <CardContent className="p-6 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Los indicadores semanales se actualizarán con la actividad de tu clínica</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-emerald-50 border-emerald-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Completadas esta semana</p>
          <p className="text-3xl font-black text-emerald-700 mt-1">{metrics.completedThisWeek || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-blue-50 border-blue-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Agendadas esta semana</p>
          <p className="text-3xl font-black text-blue-700 mt-1">{metrics.scheduledThisWeek || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-amber-50 border-amber-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">Canceladas esta semana</p>
          <p className="text-3xl font-black text-amber-700 mt-1">{metrics.cancelledThisWeek || 0}</p>
        </CardContent>
      </Card>
      <Card className="bg-red-50 border-red-200 shadow-sm">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Tasa No-Show (30 días)</p>
          <p className="text-3xl font-black text-red-700 mt-1">{metrics.noShowRate || 0}%</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================
// VolumeDiscountCard
// ============================================

export const VolumeDiscountCard = ({ discountData }) => {
  if (!discountData) return null;
  const { therapistCount, currentDiscount, discountedPrice, monthlySavings, nextTier } = discountData;

  return (
    <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            🏥 Descuento por Volumen de Clínica
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-xs text-teal-100">Plan base</p>
              <p className="font-semibold text-sm">Individual × {therapistCount} terapeutas</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-xs text-teal-100">Descuento actual</p>
              <p className="font-semibold text-sm">{currentDiscount.label}</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-xs text-teal-100">Precio por terapeuta</p>
              <p className="font-semibold text-sm">${discountedPrice.toLocaleString('es-CL')}/mes</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-3 py-2">
              <p className="text-xs text-teal-100">Ahorro mensual</p>
              <p className="font-semibold text-sm">${monthlySavings.toLocaleString('es-CL')}</p>
            </div>
          </div>
        </div>
        {nextTier && (
          <div className="shrink-0 bg-white/20 backdrop-blur rounded-lg px-4 py-3 text-sm text-center">
            <p className="font-bold">Siguiente nivel</p>
            <p className="text-teal-100 mt-1">
              Invita {nextTier.minTherapists - therapistCount} terapeuta{nextTier.minTherapists - therapistCount !== 1 ? 's' : ''} más
            </p>
            <p className="font-semibold mt-1">→ desbloquea {nextTier.label}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ClinicPlanSidebar
// ============================================

export const ClinicPlanSidebar = ({ discountData }) => {
  if (!discountData) return null;
  const { therapistCount, currentDiscount, discountedPrice, monthlySavings, nextTier } = discountData;

  return (
    <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg border-0">
      <CardContent className="p-6">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <Store className="h-5 w-5" /> Plan Clínica
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="opacity-80">Terapeutas activos</span>
            <span className="font-bold">{therapistCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-80">Descuento actual</span>
            <span className="font-bold">{currentDiscount.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-80">Precio por terapeuta</span>
            <span className="font-bold">${discountedPrice.toLocaleString('es-CL')}/mes</span>
          </div>
          {monthlySavings > 0 && (
            <div className="flex justify-between pt-2 border-t border-white/20">
              <span className="opacity-80">Ahorro mensual total</span>
              <span className="font-bold text-yellow-300">${monthlySavings.toLocaleString('es-CL')}</span>
            </div>
          )}
        </div>
        {nextTier && (
          <div className="mt-4 bg-white/15 backdrop-blur rounded-lg p-3 text-xs">
            Invita <strong>{nextTier.minTherapists - therapistCount}</strong> terapeutas más para desbloquear <strong>{nextTier.label}</strong>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================
// TimeSavedWidget
// ============================================

export const TimeSavedWidget = ({ totalSessions }) => (
  <Card className="shadow-sm border-purple-100 bg-purple-50/50">
    <CardContent className="p-6">
      <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5 text-purple-600" /> Tiempo Ahorrado
      </h3>
      {totalSessions > 0 ? (
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-black text-purple-700">
              {Math.round(totalSessions * 0.25)}h
            </p>
            <p className="text-xs text-purple-600">en gestión administrativa</p>
          </div>
          <p className="text-xs text-purple-500 italic">
            Estimación: 15 min ahorrados por sesión en agendamiento, fichas y reportes vs. métodos manuales.
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Este cálculo se activará con tus primeras sesiones completadas</p>
      )}
    </CardContent>
  </Card>
);

// ============================================
// RecentActivityTimeline
// ============================================

export const RecentActivityTimeline = ({ recentActivity, clinicInfo, onOpenCreate }) => (
  <Card className="shadow-sm">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        Actividad Reciente
      </CardTitle>
      <CardDescription>Últimos movimientos en la clínica</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground italic">No hay actividad reciente.</p>
            {!clinicInfo && (
              <Button variant="link" size="sm" onClick={onOpenCreate} className="mt-2 text-primary">
                Comenzar <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          recentActivity.map((activity, index) => (
            <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {activity.type === 'marketplace' ? (
                  <Store className="h-5 w-5 text-orange-500" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-500" />
                )}
              </div>

              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {activity.type === 'marketplace' ? 'Nuevo Recurso' : 'Nueva Cita'}
                  </div>
                  <time className="font-caveat font-medium text-indigo-500 text-xs">
                    {format(activity.date, "d MMM", { locale: es })}
                  </time>
                </div>
                <div className="text-slate-500 text-xs">
                  {activity.description}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </CardContent>
  </Card>
);
