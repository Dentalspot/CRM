import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, Users, CreditCard, Activity } from 'lucide-react';
import { fetchRevenueMetrics } from '../api/analyticsApi';
import logger from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

// --- Custom SVG Chart Components ---

const LineChart = ({ data, height = 200, color = "#0d9488" }) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value));
  const minVal = Math.min(...data.map(d => d.value));
  // Add some padding to the range
  const range = maxVal - minVal || 1; 
  const bottom = Math.max(0, minVal - (range * 0.1));
  const top = maxVal + (range * 0.1);
  const chartHeight = top - bottom;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - bottom) / chartHeight) * 100;
    return `${x},${y}`;
  }).join(' ');

  const fillPath = `0,100 ${points} 100,100`;

  return (
    <div className="w-full h-full flex flex-col justify-end">
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" strokeWidth="0.5" />
          
          {/* Area Fill */}
          <polygon points={fillPath} fill={color} fillOpacity="0.1" />
          
          {/* Line */}
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - bottom) / chartHeight) * 100;
            return (
              <circle 
                key={i} 
                cx={x} 
                cy={y} 
                r="1.5" 
                fill="white" 
                stroke={color} 
                strokeWidth="1"
                className="hover:r-2 transition-all duration-200 cursor-pointer"
              >
                <title>{d.label}: ${d.value.toLocaleString()}</title>
              </circle>
            );
          })}
        </svg>
        
        {/* X Axis Labels */}
        <div className="flex justify-between mt-2 text-[10px] text-slate-400 px-1">
          {data.map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let accumulated = 0;
  
  // Calculate segments
  const segments = data.map(item => {
    const startAngle = (accumulated / total) * 360;
    const angle = (item.value / total) * 360;
    accumulated += item.value;
    
    // Convert polar to cartesian
    const r = 15.9155; // Radius for circumference of 100
    const cx = 21;
    const cy = 21;
    
    // CSS Stroke Dasharray logic for donut segments
    // dasharray = "length, gap"
    // We use a simpler approach: multiple circles with different stroke-dasharray and rotation
    return {
      ...item,
      percentage: (item.value / total) * 100,
      rotation: startAngle
    };
  });

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx="21"
            cy="21"
            r="15.9155"
            fill="transparent"
            stroke={seg.color}
            strokeWidth="5"
            strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
            strokeDashoffset={-seg.rotation + 25} // Offset correction
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        {/* Inner Text */}
        <text 
          x="21" 
          y="21" 
          fill="#334155" 
          fontSize="8" 
          textAnchor="middle" 
          alignmentBaseline="central" 
          transform="rotate(90 21 21)"
          className="font-bold"
        >
          {total}
        </text>
      </svg>
    </div>
  );
};

// --- Main Component ---

const MembershipRevenueChart = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [timeRange, setTimeRange] = useState('6m');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchRevenueMetrics();
      setMetrics(data);
    } catch (error) {
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </Card>
    );
  }

  // Prepare chart data
  const revenueData = metrics?.revenueHistory.map(h => ({
    label: h.name,
    value: h.revenue
  })) || [];

  // Prepare distribution data
  const dist = metrics?.planDistribution || {};
  const donutData = [
    { name: 'Profesional', value: dist.professional || 0, color: '#0d9488' }, // teal-600
    { name: 'Clínica', value: dist.clinic || 0, color: '#7c3aed' }, // violet-600
    { name: 'Básico', value: dist.basic || 0, color: '#3b82f6' }, // blue-500
    { name: 'Gratuito', value: dist.free || 0, color: '#cbd5e1' }, // slate-300
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider">MRR Actual</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(metrics.mrr)}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> 
                +12% vs mes anterior
              </p>
            </div>
            <div className="bg-teal-100 p-2 rounded-lg">
              <CreditCard className="h-6 w-6 text-teal-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ARR Estimado</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(metrics.arr)}</h3>
              <p className="text-xs text-slate-500 mt-1">Ingreso Anual Recurrente</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suscripciones Activas</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeSubscribers}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                +5 nuevos este mes
              </p>
            </div>
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa de Cancelación</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.churnRate.toFixed(1)}%</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                -0.5% vs mes anterior
              </p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <TrendingDown className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>Evolución del MRR en los últimos meses.</CardDescription>
              </div>
              <Tabs value={timeRange} onValueChange={setTimeRange} className="w-[200px]">
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="3m" className="text-xs">3M</TabsTrigger>
                  <TabsTrigger value="6m" className="text-xs">6M</TabsTrigger>
                  <TabsTrigger value="1y" className="text-xs">1A</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4">
              <LineChart data={revenueData} height={250} />
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Planes</CardTitle>
            <CardDescription>Usuarios por tipo de suscripción.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-4">
              <DonutChart data={donutData} />
              <div className="w-full mt-8 space-y-3">
                {donutData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <div className="font-semibold text-slate-900">
                      {item.value} <span className="text-slate-400 font-normal ml-1">({Math.round((item.value / donutData.reduce((a,b)=>a+b.value,0))*100)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipRevenueChart;