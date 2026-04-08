/**
 * @file MarketingDashboardPage.jsx
 * @description Dashboard principal para marketing@dentalspot.cl
 */
import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, BarChart3, RefreshCw, AlertTriangle, Database, Facebook, CheckCircle, XCircle, Eye, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

import PermissionGuard from '@/features/admin/permissions/PermissionGuard';
import { useMarketingDashboard } from '../hooks/useMarketingDashboard';
import { DATASET_ID } from '@/lib/metaPixel';

import MarketingMetricsCard from '../components/MarketingMetricsCard';
import CampaignsPanel from '../components/CampaignsPanel';
import SubscribersPanel from '../components/SubscribersPanel';
import MarketingQuickNav from '../components/MarketingQuickNav';
import LeadsPanel from '../components/LeadsPanel';
import ConversionFunnel from '../components/ConversionFunnel';

const MetaStatusPanel = () => {
  const [pixelActive, setPixelActive] = useState(false);

  useEffect(() => {
    setPixelActive(typeof window !== 'undefined' && typeof window.fbq === 'function');
  }, []);

  const events = [
    { name: 'PageView', desc: 'Todas las paginas' },
    { name: 'Lead', desc: 'Registro' },
    { name: 'Purchase', desc: 'Pago membresia' },
    { name: 'CompleteRegistration', desc: 'Post-signup' },
    { name: 'Schedule', desc: 'Agendar cita' },
    { name: 'ViewContent', desc: 'Blog/Marketplace' },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" /> Meta Ads Tracking
          </CardTitle>
          <Link to="/admin/marketing/settings">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Configuracion <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
            {pixelActive ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
            <div>
              <p className="text-xs font-medium">Pixel</p>
              <p className="text-[10px] text-gray-500">{pixelActive ? 'Activo' : 'No detectado'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
            <Zap className="h-4 w-4 text-green-500 shrink-0" />
            <div>
              <p className="text-xs font-medium">CAPI</p>
              <p className="text-[10px] text-gray-500">Edge Function</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
            <Eye className="h-4 w-4 text-blue-500 shrink-0" />
            <div>
              <p className="text-xs font-medium">Dataset</p>
              <p className="text-[10px] text-gray-500 font-mono">{DATASET_ID.slice(0, 8)}...</p>
            </div>
          </div>
        </div>

        {/* Active events */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Eventos activos</p>
          <div className="flex flex-wrap gap-1.5">
            {events.map(evt => (
              <Badge key={evt.name} variant="outline" className="text-[10px] gap-1" title={evt.desc}>
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {evt.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick link */}
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://business.facebook.com/events_manager2/list/dataset/${DATASET_ID}/overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
          >
            Events Manager <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href={`https://developers.facebook.com/tools/explorer/?method=GET&path=${DATASET_ID}%2Fevents`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
          >
            Graph Explorer <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

const MarketingDashboardPage = () => {
  const { stats, campaigns, analytics, loading, error, refresh } = useMarketingDashboard();

  return (
    <PermissionGuard module="marketing" action="read">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Mail className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
              <p className="text-muted-foreground mt-0.5">Email, Meta Ads, leads, segmentacion y automatizacion</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} /> Actualizar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Error al cargar datos de marketing.</span>
            <Button variant="outline" size="sm" onClick={refresh} className="ml-auto">Reintentar</Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MarketingMetricsCard title="Total Leads" value={stats?.totalLeads?.toLocaleString() ?? '—'} icon={Database} color="blue" loading={loading} subtitle="en base de datos" />
          <MarketingMetricsCard title="Con Email" value={stats?.leadsWithEmail?.toLocaleString() ?? '—'} icon={Mail} color="green" loading={loading} subtitle="contactables" />
          <MarketingMetricsCard title="Registrados DentalSpot" value={stats?.therapists ?? '—'} icon={Users} color="purple" loading={loading} subtitle="terapeutas activos" />
          <MarketingMetricsCard title="Pacientes" value={stats?.patients ?? '—'} icon={Users} color="pink" loading={loading} subtitle="usuarios activos" />
          <MarketingMetricsCard title="Campanas" value={stats?.campaigns ?? 0} icon={Send} color="blue" loading={loading} subtitle="enviadas" />
        </div>

        {/* Meta Ads Panel + Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ConversionFunnel />
          </div>
          <MetaStatusPanel />
        </div>

        <MarketingQuickNav />

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CampaignsPanel campaigns={campaigns} loading={loading} />
          <SubscribersPanel stats={stats} loading={loading} />
        </div>

        <Separator />

        <LeadsPanel />
      </div>
    </PermissionGuard>
  );
};

export default MarketingDashboardPage;
