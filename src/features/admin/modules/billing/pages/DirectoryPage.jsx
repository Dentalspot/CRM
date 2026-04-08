import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Building, Search, Download, RefreshCw, Crown, User, Mail, Calendar, MapPin } from 'lucide-react';

const PLAN_COLORS = {
  free: 'bg-gray-100 text-gray-700',
  gratis: 'bg-gray-100 text-gray-700',
  individual: 'bg-blue-100 text-blue-700',
  profesional: 'bg-purple-100 text-purple-700',
  centro: 'bg-amber-100 text-amber-700',
};

const DirectoryPage = () => {
  const [therapists, setTherapists] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('therapists');
  const [planFilter, setPlanFilter] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch therapists with their subscription info
    const { data: therapistData } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, avatar_url')
      .eq('role', 'therapist')
      .order('created_at', { ascending: false });

    if (therapistData) {
      // Fetch subscriptions for each therapist
      const ids = therapistData.map(t => t.id);
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id, plan_id, status, current_period_end, membership_plans(name, slug)')
        .in('user_id', ids)
        .eq('status', 'active');

      const subsMap = {};
      (subs || []).forEach(s => { subsMap[s.user_id] = s; });

      setTherapists(therapistData.map(t => ({
        ...t,
        subscription: subsMap[t.id] || null,
        plan: subsMap[t.id]?.membership_plans?.name || 'Sin plan',
        planSlug: subsMap[t.id]?.membership_plans?.slug || 'free',
      })));
    }

    // Fetch clinics
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('id, name, rut_empresa, razon_social, region, city, phone, email, created_at')
      .order('created_at', { ascending: false });

    setClinics(clinicData || []);
    setLoading(false);
  };

  const filteredTherapists = therapists.filter(t => {
    const matchesSearch = !search ||
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'all' || t.planSlug === planFilter;
    return matchesSearch && matchesPlan;
  });

  const filteredClinics = clinics.filter(c => {
    return !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.rut_empresa?.includes(search) ||
      c.razon_social?.toLowerCase().includes(search.toLowerCase());
  });

  const planCounts = {
    all: therapists.length,
    free: therapists.filter(t => t.planSlug === 'free' || t.planSlug === 'gratis').length,
    individual: therapists.filter(t => t.planSlug === 'individual').length,
    profesional: therapists.filter(t => t.planSlug === 'profesional').length,
    centro: therapists.filter(t => t.planSlug === 'centro').length,
  };

  const exportCSV = () => {
    if (tab === 'therapists') {
      const headers = ['Nombre', 'Email', 'Plan', 'Fecha Registro'];
      const rows = filteredTherapists.map(t => [
        t.full_name, t.email, t.plan,
        new Date(t.created_at).toLocaleDateString('es-CL'),
      ]);
      downloadCSV(headers, rows, 'terapeutas');
    } else {
      const headers = ['Nombre', 'RUT', 'Razón Social', 'Región', 'Ciudad', 'Fecha Registro'];
      const rows = filteredClinics.map(c => [
        c.name, c.rut_empresa || '—', c.razon_social || '—',
        c.region || '—', c.city || '—',
        new Date(c.created_at).toLocaleDateString('es-CL'),
      ]);
      downloadCSV(headers, rows, 'clinicas');
    }
  };

  const downloadCSV = (headers, rows, filename) => {
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Directorio
          </h1>
          <p className="text-muted-foreground">Terapeutas registrados, planes activos y clínicas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{therapists.length}</p>
          <p className="text-xs text-gray-500">Terapeutas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{planCounts.free}</p>
          <p className="text-xs text-gray-500">Plan Gratis</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{planCounts.individual}</p>
          <p className="text-xs text-gray-500">Individual</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{planCounts.profesional}</p>
          <p className="text-xs text-gray-500">Profesional</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{planCounts.centro}</p>
          <p className="text-xs text-gray-500">Centro</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button variant={tab === 'therapists' ? 'default' : 'outline'} size="sm" onClick={() => setTab('therapists')}>
            <User className="h-4 w-4 mr-1" /> Terapeutas ({therapists.length})
          </Button>
          <Button variant={tab === 'clinics' ? 'default' : 'outline'} size="sm" onClick={() => setTab('clinics')}>
            <Building className="h-4 w-4 mr-1" /> Clínicas ({clinics.length})
          </Button>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email o RUT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Plan filter (only for therapists tab) */}
      {tab === 'therapists' && (
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'free', label: 'Gratis' },
            { key: 'individual', label: 'Individual' },
            { key: 'profesional', label: 'Profesional' },
            { key: 'centro', label: 'Centro' },
          ].map(f => (
            <Button key={f.key} variant={planFilter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setPlanFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Cargando...</div>
      ) : tab === 'therapists' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-3">Terapeuta</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Vencimiento</th>
                    <th className="p-3">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTherapists.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <span className="font-medium">{t.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-500">{t.email}</td>
                      <td className="p-3">
                        <Badge className={PLAN_COLORS[t.planSlug] || PLAN_COLORS.free}>
                          {t.planSlug === 'centro' && <Crown className="h-3 w-3 mr-1" />}
                          {t.plan}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {t.subscription?.current_period_end
                          ? new Date(t.subscription.current_period_end).toLocaleDateString('es-CL')
                          : '—'}
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(t.created_at).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                  {filteredTherapists.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No se encontraron terapeutas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-3">Clínica</th>
                    <th className="p-3">RUT Empresa</th>
                    <th className="p-3">Razón Social</th>
                    <th className="p-3">Ubicación</th>
                    <th className="p-3">Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClinics.map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Building className="h-4 w-4 text-amber-600" />
                          </div>
                          <span className="font-medium">{c.name || '—'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-xs">{c.rut_empresa || '—'}</td>
                      <td className="p-3 text-gray-500">{c.razon_social || '—'}</td>
                      <td className="p-3 text-xs text-gray-400">
                        {c.region && c.city ? (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.city}, {c.region}</span>
                        ) : '—'}
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(c.created_at).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  ))}
                  {filteredClinics.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No se encontraron clínicas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DirectoryPage;
