import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cookie, RefreshCw, Download, CheckCircle, XCircle, Globe, Monitor, User } from 'lucide-react';

const CookieConsentsPage = () => {
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, withMarketing: 0, withAnalytics: 0, essentialOnly: 0 });

  useEffect(() => { fetchConsents(); }, []);

  const fetchConsents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cookie_consents')
      .select('*, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setConsents(data);
      setStats({
        total: data.length,
        withMarketing: data.filter(c => c.marketing).length,
        withAnalytics: data.filter(c => c.analytics).length,
        essentialOnly: data.filter(c => !c.analytics && !c.marketing).length,
      });
    }
    setLoading(false);
  };

  const exportCSV = () => {
    const headers = ['Fecha', 'Usuario', 'Email', 'IP', 'Esenciales', 'Analíticas', 'Marketing', 'Versión', 'URL', 'User Agent'];
    const rows = consents.map(c => [
      new Date(c.created_at).toLocaleString('es-CL'),
      c.profiles?.full_name || 'Anónimo',
      c.profiles?.email || '—',
      c.ip_address || '—',
      c.essential ? 'Sí' : 'No',
      c.analytics ? 'Sí' : 'No',
      c.marketing ? 'Sí' : 'No',
      c.consent_version || '—',
      c.page_url || '—',
      c.user_agent || '—',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookie_consents_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cookie className="h-6 w-6 text-amber-600" /> Registro de Consentimiento de Cookies
          </h1>
          <p className="text-muted-foreground">Trazabilidad de consentimientos para cumplimiento GDPR / Ley 19.628</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchConsents}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={consents.length === 0}>
            <Download className="h-4 w-4 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
          <p className="text-xs text-gray-500">Total registros</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.withMarketing}</p>
          <p className="text-xs text-gray-500">Aceptaron Marketing</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.withAnalytics}</p>
          <p className="text-xs text-gray-500">Aceptaron Analíticas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.essentialOnly}</p>
          <p className="text-xs text-gray-500">Solo esenciales</p>
        </CardContent></Card>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-sm text-blue-800">
          <strong>Ante una supervisión:</strong> Este registro demuestra que cada usuario dio consentimiento explícito
          antes de activar cookies de marketing o analíticas. Los registros incluyen IP, user agent, timestamp y versión
          del documento de consentimiento. Puedes exportar en CSV para auditoría.
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Registros de Consentimiento</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Cargando...</div>
          ) : consents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Cookie className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p>No hay registros de consentimiento aún</p>
              <p className="text-xs mt-1">Los registros aparecerán cuando los usuarios interactúen con el banner de cookies</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Usuario</th>
                    <th className="p-3">IP</th>
                    <th className="p-3 text-center">Esenciales</th>
                    <th className="p-3 text-center">Analíticas</th>
                    <th className="p-3 text-center">Marketing</th>
                    <th className="p-3">Versión</th>
                  </tr>
                </thead>
                <tbody>
                  {consents.map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-xs">
                        {new Date(c.created_at).toLocaleString('es-CL')}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {c.profiles ? (
                            <>
                              <User className="h-3.5 w-3.5 text-gray-400" />
                              <div>
                                <p className="text-xs font-medium">{c.profiles.full_name}</p>
                                <p className="text-[10px] text-gray-400">{c.profiles.email}</p>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Anónimo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Globe className="h-3 w-3" /> {c.ip_address || '—'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                      </td>
                      <td className="p-3 text-center">
                        {c.analytics ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {c.marketing ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">{c.consent_version || '1.0'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CookieConsentsPage;
