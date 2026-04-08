import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Mail, Phone, MessageSquare, UserCheck, Crown, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FUNNEL_STAGES = [
  { key: 'total', label: 'Base Total', icon: Target, color: 'bg-gray-500', lightColor: 'bg-gray-100 text-gray-700' },
  { key: 'with_email', label: 'Con Email', icon: Mail, color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-700' },
  { key: 'with_phone', label: 'Con Teléfono', icon: Phone, color: 'bg-cyan-500', lightColor: 'bg-cyan-100 text-cyan-700' },
  { key: 'contacted', label: 'Contactados', icon: MessageSquare, color: 'bg-yellow-500', lightColor: 'bg-yellow-100 text-yellow-700' },
  { key: 'in_conversation', label: 'En Conversación', icon: MessageSquare, color: 'bg-purple-500', lightColor: 'bg-purple-100 text-purple-700' },
  { key: 'converted', label: 'Convertidos', icon: UserCheck, color: 'bg-green-500', lightColor: 'bg-green-100 text-green-700' },
  { key: 'registered', label: 'Registrados DentalSpot', icon: Crown, color: 'bg-teal-500', lightColor: 'bg-teal-100 text-teal-700' },
];

const ConversionFunnel = ({ sourceFilter = 'all' }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bySource, setBySource] = useState([]);

  useEffect(() => { fetchStats(); }, [sourceFilter]);

  const fetchStats = async () => {
    setLoading(true);

    let baseQuery = supabase.from('marketing_leads').select('*', { count: 'exact', head: true });
    if (sourceFilter !== 'all') baseQuery = baseQuery.eq('source', sourceFilter);

    // Total
    const { count: total } = await baseQuery;

    // With email
    let emailQuery = supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('email', 'is', null);
    if (sourceFilter !== 'all') emailQuery = emailQuery.eq('source', sourceFilter);
    const { count: withEmail } = await emailQuery;

    // With phone
    let phoneQuery = supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).not('phone', 'is', null);
    if (sourceFilter !== 'all') phoneQuery = phoneQuery.eq('source', sourceFilter);
    const { count: withPhone } = await phoneQuery;

    // By status
    const statuses = ['contacted', 'in_conversation', 'converted', 'registered'];
    const statusCounts = {};
    for (const s of statuses) {
      let q = supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('status', s);
      if (sourceFilter !== 'all') q = q.eq('source', sourceFilter);
      const { count } = await q;
      statusCounts[s] = count || 0;
    }

    // By source breakdown - individual counts (avoids 1000 row limit)
    const sources = ['supersalud', 'doctoralia', 'woocommerce', 'csv_import', 'manual', 'ticket_compra'];
    const sourceCounts = [];
    for (const src of sources) {
      const { count } = await supabase
        .from('marketing_leads')
        .select('*', { count: 'exact', head: true })
        .eq('source', src);
      if (count > 0) sourceCounts.push({ source: src, count });
    }
    setBySource(sourceCounts.sort((a, b) => b.count - a.count));

    setStats({
      total: total || 0,
      with_email: withEmail || 0,
      with_phone: withPhone || 0,
      contacted: statusCounts.contacted || 0,
      in_conversation: statusCounts.in_conversation || 0,
      converted: statusCounts.converted || 0,
      registered: statusCounts.registered || 0,
    });

    setLoading(false);
  };

  if (loading || !stats) {
    return <div className="text-center py-8 text-gray-500">Cargando embudo...</div>;
  }

  const funnelData = FUNNEL_STAGES.map(stage => ({
    ...stage,
    count: stats[stage.key] || 0,
    pct: stats.total > 0 ? Math.round((stats[stage.key] / stats.total) * 100) : 0,
  }));

  const captureRate = stats.total > 0 ? Math.round((stats.with_email / stats.total) * 100) : 0;
  const conversionRate = stats.with_email > 0 ? Math.round((stats.converted / stats.with_email) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <p className="text-blue-100 text-sm">Tasa de Captura</p>
            <p className="text-3xl font-bold mt-1">{captureRate}%</p>
            <p className="text-blue-200 text-xs mt-1">{stats.with_email.toLocaleString()} de {stats.total.toLocaleString()} con email</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-5">
            <p className="text-green-100 text-sm">Tasa de Conversión</p>
            <p className="text-3xl font-bold mt-1">{conversionRate}%</p>
            <p className="text-green-200 text-xs mt-1">{stats.converted} convertidos de {stats.with_email.toLocaleString()} con email</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-5">
            <p className="text-purple-100 text-sm">Por Capturar</p>
            <p className="text-3xl font-bold mt-1">{(stats.total - stats.with_email).toLocaleString()}</p>
            <p className="text-purple-200 text-xs mt-1">{100 - captureRate}% sin email — tu oportunidad</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" /> Embudo de Conversión
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchStats}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {funnelData.map((stage, i) => {
            const maxWidth = 100;
            const width = stage.key === 'total' ? maxWidth : Math.max(stage.pct, 3);

            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-40 flex items-center gap-2 shrink-0">
                  <stage.icon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{stage.label}</span>
                </div>
                <div className="flex-1 relative">
                  <div className="h-9 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-lg transition-all duration-700 flex items-center px-3`}
                      style={{ width: `${width}%` }}
                    >
                      <span className="text-white text-xs font-bold whitespace-nowrap">
                        {stage.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-14 text-right shrink-0">
                  <Badge className={stage.lightColor + ' text-xs'}>{stage.pct}%</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Source breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Distribución por Fuente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bySource.map(s => (
              <div key={s.source} className="p-3 border rounded-lg text-center hover:bg-gray-50">
                <p className="text-lg font-bold text-gray-700">{s.count.toLocaleString()}</p>
                <p className="text-xs text-gray-500 capitalize">{s.source?.replace('_', ' ') || 'Sin fuente'}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ConversionFunnel;
