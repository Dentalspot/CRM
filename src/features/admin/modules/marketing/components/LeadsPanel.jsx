import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import logger from '@/lib/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import {
  Users, Upload, Search, Download, Filter, MoreVertical,
  UserPlus, Mail, Phone, MapPin, Building, CheckCircle,
  XCircle, Clock, MessageSquare, Loader2
} from 'lucide-react';

const SOURCES = [
  { value: 'all', label: 'Todas', color: 'bg-gray-100 text-gray-700' },
  { value: 'doctoralia', label: 'Doctoralia', color: 'bg-blue-100 text-blue-700' },
  { value: 'rnpi', label: 'RNPI', color: 'bg-green-100 text-green-700' },
  { value: 'daem', label: 'DAEM', color: 'bg-amber-100 text-amber-700' },
  { value: 'supersalud', label: 'Supersalud', color: 'bg-red-100 text-red-700' },
  { value: 'ticket_compra', label: 'Ticket Compra', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'woocommerce', label: 'WooCommerce', color: 'bg-purple-100 text-purple-700' },
  { value: 'instagram', label: 'Instagram', color: 'bg-primary text-primary' },
  { value: 'facebook', label: 'Facebook', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'manual', label: 'Manual', color: 'bg-gray-100 text-gray-600' },
  { value: 'csv_import', label: 'CSV Import', color: 'bg-cyan-100 text-cyan-700' },
];

const SEGMENTS = [
  { value: 'all', label: 'Todos' },
  { value: 'establecido', label: 'Establecido' },
  { value: 'universitario', label: 'Universitario' },
  { value: 'institucional', label: 'Institucional' },
];

const STATUS_MAP = {
  new: { label: 'Nuevo', color: 'bg-blue-100 text-blue-700', icon: UserPlus },
  contacted: { label: 'Contactado', color: 'bg-yellow-100 text-yellow-700', icon: MessageSquare },
  interested: { label: 'Interesado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  converted: { label: 'Convertido', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: XCircle },
  unsubscribed: { label: 'Desuscrito', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

const LeadsPanel = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;
  const [newLead, setNewLead] = useState({ full_name: '', email: '', phone: '', source: 'manual', segment: 'establecido', city: '', institution: '' });

  useEffect(() => { setPage(0); fetchLeads(0); }, [sourceFilter, segmentFilter, statusFilter]);

  const fetchLeads = async (p = page) => {
    setLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('marketing_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);
    if (segmentFilter !== 'all') query = query.eq('segment', segmentFilter);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);

    const { data, error, count } = await query;
    if (!error) {
      setLeads(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const filteredLeads = leads.filter(l =>
    !search ||
    l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) ||
    l.institution?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLead = async () => {
    if (!newLead.full_name && !newLead.email) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ingresa al menos nombre o email' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('marketing_leads').insert({
      ...newLead,
      created_by: user?.id,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Lead agregado' });
      setNewLead({ full_name: '', email: '', phone: '', source: 'manual', segment: 'establecido', city: '', institution: '' });
      setShowAddForm(false);
      fetchLeads();
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const updates = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'contacted') updates.contacted_at = new Date().toISOString();
    if (newStatus === 'converted') updates.converted_at = new Date().toISOString();

    const { error } = await supabase.from('marketing_leads').update(updates).eq('id', id);
    if (!error) fetchLeads();
  };

  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('El CSV debe tener al menos un encabezado y una fila');

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const nameIdx = headers.findIndex(h => ['nombre', 'name', 'full_name', 'nombre_completo'].includes(h));
      const emailIdx = headers.findIndex(h => ['email', 'correo', 'mail'].includes(h));
      const phoneIdx = headers.findIndex(h => ['telefono', 'phone', 'celular', 'fono'].includes(h));
      const cityIdx = headers.findIndex(h => ['ciudad', 'city', 'comuna'].includes(h));
      const instIdx = headers.findIndex(h => ['institucion', 'institution', 'empresa', 'centro'].includes(h));
      const segIdx = headers.findIndex(h => ['segmento', 'segment', 'tipo'].includes(h));

      const { data: { user } } = await supabase.auth.getUser();
      const sourcePrompt = prompt('¿Fuente de estos leads? (doctoralia, rnpi, daem, woocommerce, csv_import)', 'csv_import');

      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        if (cols.length < 2) continue;

        records.push({
          full_name: nameIdx >= 0 ? cols[nameIdx] : null,
          email: emailIdx >= 0 ? cols[emailIdx] : null,
          phone: phoneIdx >= 0 ? cols[phoneIdx] : null,
          city: cityIdx >= 0 ? cols[cityIdx] : null,
          institution: instIdx >= 0 ? cols[instIdx] : null,
          segment: segIdx >= 0 ? cols[segIdx] : 'establecido',
          source: sourcePrompt || 'csv_import',
          status: 'new',
          created_by: user?.id,
        });
      }

      // Insert in batches of 50
      let imported = 0;
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        const { error } = await supabase.from('marketing_leads').insert(batch);
        if (error) logger.error('Batch error:', error);
        else imported += batch.length;
      }

      toast({ title: `${imported} leads importados`, description: `De ${records.length} registros del CSV` });
      fetchLeads();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error al importar', description: err.message });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportCSV = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Fuente', 'Segmento', 'Estado', 'Ciudad', 'Institución', 'Fecha'];
    const rows = filteredLeads.map(l => [
      l.full_name, l.email, l.phone, l.source, l.segment, l.status,
      l.city, l.institution, new Date(l.created_at).toLocaleDateString('es-CL'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: totalCount || leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Gestión de Leads
          </h2>
          <p className="text-sm text-muted-foreground">Leads externos por fuente y segmento</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleCSVImport}
            className="hidden"
          />
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/marketing/import"><Upload className="h-4 w-4 mr-1" /> Importar CSV</a>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <UserPlus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Leads</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
          <p className="text-xs text-gray-500">Nuevos</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
          <p className="text-xs text-gray-500">Contactados</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
          <p className="text-xs text-gray-500">Convertidos</p>
        </CardContent></Card>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card className="border-primary">
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input placeholder="Nombre" value={newLead.full_name} onChange={e => setNewLead(p => ({ ...p, full_name: e.target.value }))} />
            <Input placeholder="Email" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} />
            <Input placeholder="Teléfono" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Ciudad" value={newLead.city} onChange={e => setNewLead(p => ({ ...p, city: e.target.value }))} />
            <Input placeholder="Institución" value={newLead.institution} onChange={e => setNewLead(p => ({ ...p, institution: e.target.value }))} />
            <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} className="p-2 border rounded text-sm">
              {SOURCES.filter(s => s.value !== 'all').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={newLead.segment} onChange={e => setNewLead(p => ({ ...p, segment: e.target.value }))} className="p-2 border rounded text-sm">
              {SEGMENTS.filter(s => s.value !== 'all').map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddLead}>Guardar</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {SOURCES.map(s => (
            <Button key={s.value} variant={sourceFilter === s.value ? 'default' : 'outline'} size="sm" className="text-xs" onClick={() => setSourceFilter(s.value)}>
              {s.label}
            </Button>
          ))}
        </div>
        <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} className="p-1.5 border rounded text-xs">
          {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Cargando...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p>No hay leads. Importa un CSV o agrega manualmente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Fuente</th>
                    <th className="p-3">Pedidos</th>
                    <th className="p-3">Gasto</th>
                    <th className="p-3">Doctoralia</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Última Act.</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map(l => {
                    const status = STATUS_MAP[l.status] || STATUS_MAP.new;
                    const source = SOURCES.find(s => s.value === l.source) || SOURCES[0];
                    return (
                      <tr key={l.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <p className="font-medium">{l.full_name || '—'}</p>
                          {l.institution && <p className="text-xs text-gray-400 flex items-center gap-1"><Building className="h-3 w-3" />{l.institution}</p>}
                        </td>
                        <td className="p-3 text-xs">
                          {l.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" />{l.email}</p>}
                          {l.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" />{l.phone}</p>}
                          {l.city && <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" />{l.city}</p>}
                        </td>
                        <td className="p-3"><Badge className={source.color + ' text-[10px]'}>{source.label}</Badge></td>
                        <td className="p-3 text-xs text-center">{l.total_orders || '—'}</td>
                        <td className="p-3 text-xs font-mono">{l.total_spent ? `$${Number(l.total_spent).toLocaleString('es-CL')}` : '—'}</td>
                        <td className="p-3 text-center">
                          {l.has_doctoralia ? (
                            l.doctoralia_url ? (
                              <a href={l.doctoralia_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Sí ↗</a>
                            ) : <span className="text-xs text-green-600 font-medium">Sí</span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="p-3">
                          <select
                            value={l.status}
                            onChange={e => handleStatusChange(l.id, e.target.value)}
                            className={`text-xs p-1 rounded border-none ${status.color}`}
                          >
                            {Object.entries(STATUS_MAP).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-xs text-gray-400">{l.last_activity_date ? new Date(l.last_activity_date).toLocaleDateString('es-CL') : l.created_at ? new Date(l.created_at).toLocaleDateString('es-CL') : '—'}</td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalCount > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-gray-500">
                Mostrando {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount.toLocaleString()} leads
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={page === 0}
                  onClick={() => { setPage(p => p - 1); fetchLeads(page - 1); }}
                >
                  Anterior
                </Button>
                <span className="flex items-center text-sm text-gray-500 px-2">
                  Página {page + 1} de {Math.ceil(totalCount / PAGE_SIZE)}
                </span>
                <Button
                  variant="outline" size="sm"
                  disabled={(page + 1) * PAGE_SIZE >= totalCount}
                  onClick={() => { setPage(p => p + 1); fetchLeads(page + 1); }}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsPanel;
