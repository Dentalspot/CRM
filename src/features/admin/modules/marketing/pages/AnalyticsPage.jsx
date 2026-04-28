import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BarChart3, RefreshCw, TrendingUp, Users, Calendar, MapPin, Facebook, Eye, ShoppingCart, UserPlus, Zap, ExternalLink, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DATASET_ID } from '@/lib/metaPixel';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

const COLORS = ['#0d9488', '#2563eb', '#7c3aed', '#ea580c', '#16a34a', '#dc2626', '#ca8a04', '#0891b2'];

const SOURCES = ['supersalud', 'doctoralia', 'woocommerce', 'csv_import', 'manual', 'ticket_compra'];
const STATUSES = ['new', 'contacted', 'in_conversation', 'converted', 'registered', 'unsubscribed'];
const STATUS_LABELS = {
  new: 'Nuevos', contacted: 'Contactados', in_conversation: 'En Conversación',
  converted: 'Convertidos', registered: 'Registrados', unsubscribed: 'No Interesado',
};

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, withEmail: 0, thisWeek: 0, thisMonth: 0, bySource: [], byStatus: [], byRegion: [], funnel: [] });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Total leads
      const { count: total } = await supabase.from('marketing_leads').select('*', { count: 'exact', head: true });

      // With email
      const { count: withEmail } = await supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('email', 'is', null);

      // This week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: thisWeek } = await supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);

      // This month
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: thisMonth } = await supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).gte('created_at', monthStart);

      // By source
      const bySource = [];
      for (const src of SOURCES) {
        const { count } = await supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('source', src);
        if (count > 0) bySource.push({ name: src, value: count });
      }

      // By status
      const byStatus = [];
      for (const sta of STATUSES) {
        const { count } = await supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('status', sta);
        if (count > 0) byStatus.push({ name: STATUS_LABELS[sta] || sta, value: count, pct: total > 0 ? Math.round((count / total) * 100) : 0 });
      }

      // Top regions (use a limited select with distinct-like approach)
      const { data: regionData } = await supabase
        .from('marketing_leads')
        .select('region')
        .not('region', 'is', null)
        .not('region', 'eq', '')
        .limit(5000);

      const regionCounts = {};
      (regionData || []).forEach(r => {
        const reg = r.region || 'Desconocida';
        regionCounts[reg] = (regionCounts[reg] || 0) + 1;
      });
      const byRegion = Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([name, value]) => ({ name, value }));

      // Funnel
      const funnel = STATUSES.filter(s => s !== 'unsubscribed').map(s => ({
        name: STATUS_LABELS[s],
        value: byStatus.find(b => b.name === STATUS_LABELS[s])?.value || 0,
        pct: total > 0 ? Math.round(((byStatus.find(b => b.name === STATUS_LABELS[s])?.value || 0) / total) * 100) : 0,
      }));

      setStats({ total: total || 0, withEmail: withEmail || 0, thisWeek: thisWeek || 0, thisMonth: thisMonth || 0, bySource, byStatus, byRegion, funnel });
    } catch (err) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link></Button>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-teal-600" /> Analytics de Marketing</h1>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Users className="h-8 w-8 text-teal-500" /><div><p className="text-2xl font-bold">{stats.total.toLocaleString()}</p><p className="text-xs text-gray-500">Total Leads</p></div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-blue-500" /><div><p className="text-2xl font-bold">{stats.withEmail.toLocaleString()}</p><p className="text-xs text-gray-500">Con Email</p><p className="text-[10px] text-gray-400">{stats.total > 0 ? Math.round((stats.withEmail / stats.total) * 100) : 0}% del total</p></div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-green-500" /><div><p className="text-2xl font-bold">{stats.thisWeek.toLocaleString()}</p><p className="text-xs text-gray-500">Esta Semana</p></div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-purple-500" /><div><p className="text-2xl font-bold">{stats.thisMonth.toLocaleString()}</p><p className="text-xs text-gray-500">Este Mes</p></div></div>
        </CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Leads por Fuente</CardTitle></CardHeader>
          <CardContent>
            {stats.bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.bySource} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                  <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]}>
                    {stats.bySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-10">Sin datos</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Distribución por Estado</CardTitle></CardHeader>
          <CardContent>
            {stats.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={stats.byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, pct }) => `${name} ${pct}%`}>
                    {stats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-gray-400 py-10">Sin datos</p>}
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Embudo de Conversión</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {stats.funnel.map((stage, i) => (
            <div key={stage.name} className="flex items-center gap-3">
              <div className="w-32 text-sm text-gray-700 text-right shrink-0">{stage.name}</div>
              <div className="flex-1 bg-gray-100 rounded-lg h-8 overflow-hidden">
                <div className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                  style={{ width: `${Math.max(stage.pct, 3)}%`, backgroundColor: COLORS[i % COLORS.length] }}>
                  <span className="text-white text-xs font-bold">{stage.value.toLocaleString()}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs w-12 text-center">{stage.pct}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Regions */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-teal-600" /> Top Regiones</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {stats.byRegion.map(r => (
              <div key={r.name} className="flex items-center justify-between p-2 border rounded-lg">
                <span className="text-sm truncate">{r.name}</span>
                <Badge className="bg-teal-100 text-teal-700 shrink-0 ml-2">{r.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meta Ads Tracking Section */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" /> Meta Ads — Conversion Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Architecture diagram */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-800 mb-3">Arquitectura de Tracking</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="bg-white rounded-lg p-3 shadow-sm text-center min-w-[120px]">
                <Eye className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs font-medium">Meta Pixel</p>
                <p className="text-[10px] text-gray-500">Browser-side</p>
              </div>
              <span className="text-blue-400 text-lg">+</span>
              <div className="bg-white rounded-lg p-3 shadow-sm text-center min-w-[120px]">
                <Zap className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                <p className="text-xs font-medium">CAPI</p>
                <p className="text-[10px] text-gray-500">Server-side</p>
              </div>
              <span className="text-blue-400 text-lg">=</span>
              <div className="bg-white rounded-lg p-3 shadow-sm text-center min-w-[120px] border-2 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-xs font-medium">Dual Tracking</p>
                <p className="text-[10px] text-gray-500">Deduplicado</p>
              </div>
            </div>
          </div>

          {/* Events grid */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Eventos enviados a Meta</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { event: 'PageView', icon: Eye, color: 'bg-blue-100 text-blue-700', desc: 'Todas las paginas' },
                { event: 'Lead', icon: UserPlus, color: 'bg-green-100 text-green-700', desc: 'Registro usuario' },
                { event: 'Purchase', icon: ShoppingCart, color: 'bg-purple-100 text-purple-700', desc: 'Pago CLP' },
                { event: 'CompleteRegistration', icon: CheckCircle, color: 'bg-teal-100 text-teal-700', desc: 'Signup completado' },
                { event: 'Subscribe', icon: Zap, color: 'bg-amber-100 text-amber-700', desc: 'Plan activado' },
                { event: 'Schedule', icon: Calendar, color: 'bg-primary text-primary', desc: 'Cita agendada' },
                { event: 'ViewContent', icon: Eye, color: 'bg-indigo-100 text-indigo-700', desc: 'Blog/Marketplace' },
                { event: 'InitiateCheckout', icon: ShoppingCart, color: 'bg-orange-100 text-orange-700', desc: 'Inicio checkout' },
              ].map(evt => {
                const Icon = evt.icon;
                return (
                  <div key={evt.event} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-gray-600" />
                      <Badge className={`${evt.color} text-[10px]`}>{evt.event}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">{evt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dataset info */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Facebook className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Dataset ID: <span className="font-mono">{DATASET_ID}</span></p>
                <p className="text-xs text-gray-500">Graph API v21.0 — Deduplicacion UUID v4</p>
              </div>
            </div>
            <div className="flex gap-4">
              <a
                href={`https://business.facebook.com/events_manager2/list/dataset/${DATASET_ID}/overview`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
              >
                Events Manager <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href={`https://developers.facebook.com/tools/explorer/?method=GET&path=${DATASET_ID}%2Fevents`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline font-medium"
              >
                Graph API Explorer <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
