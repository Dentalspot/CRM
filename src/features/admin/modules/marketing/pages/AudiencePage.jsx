import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Users, Search, Download, RefreshCw, ArrowLeft, Tag, Filter,
  Mail, Phone, MapPin, Crown, UserCheck, X, Plus, CheckCircle,
  MoreHorizontal, Pencil, GitBranch, Save, Merge, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos', color: 'bg-gray-100 text-gray-700' },
  { value: 'new', label: 'Nuevos', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contactados', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'in_conversation', label: 'En Conversación', color: 'bg-purple-100 text-purple-700' },
  { value: 'converted', label: 'Convertidos', color: 'bg-green-100 text-green-700' },
  { value: 'registered', label: 'Registrados', color: 'bg-teal-100 text-teal-700' },
  { value: 'unsubscribed', label: 'No Interesado', color: 'bg-gray-100 text-gray-500' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: 'supersalud', label: 'Supersalud' },
  { value: 'doctoralia', label: 'Doctoralia' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'manual', label: 'Manual' },
  { value: 'csv_import', label: 'CSV Import' },
];

const DATA_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'with_email', label: 'Con Email' },
  { value: 'without_email', label: 'Sin Email' },
  { value: 'with_phone', label: 'Con Teléfono' },
  { value: 'with_purchases', label: 'Con Compras' },
  { value: 'has_doctoralia', label: 'Tiene Doctoralia' },
];

const AudiencePage = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dataFilter, setDataFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Segments stats
  const [segments, setSegments] = useState({});

  // Selected leads for bulk actions
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Available tags
  const [allTags, setAllTags] = useState([]);
  const [bulkTag, setBulkTag] = useState('');

  // Add individual lead
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ full_name: '', email: '', phone: '', rut: '', specialty: '', city: '', region: '', source: 'manual', notes: '' });

  // Supersalud match confirmation
  const [matchStep, setMatchStep] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Inline edit modal
  const [editLead, setEditLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Assign funnel modal
  const [funnelLead, setFunnelLead] = useState(null);

  // Action menu
  const [actionMenu, setActionMenu] = useState(null);

  // Merge modal
  const [mergeSource, setMergeSource] = useState(null); // lead to merge FROM
  const [mergeSearch, setMergeSearch] = useState('');
  const [mergeResults, setMergeResults] = useState([]);
  const [mergeTarget, setMergeTarget] = useState(null); // lead to merge INTO
  const [mergeLoading, setMergeLoading] = useState(false);

  const FUNNELS = [
    { id: 'ados-2', label: 'ADOS-2', icon: '🧩' },
    { id: 'adir', label: 'ADI-R', icon: '📋' },
    { id: 'tea', label: 'TEA', icon: '🧠' },
    { id: 'sensorial', label: 'Sensorial', icon: '👐' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'membership', label: 'Membresia', icon: '⭐' },
  ];

  useEffect(() => { fetchLeads(0); fetchSegments(); }, [statusFilter, sourceFilter, dataFilter, tagFilter, regionFilter]);

  const fetchLeads = async (p = page) => {
    setLoading(true);
    const from = p * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('marketing_leads')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (sourceFilter !== 'all') query = query.eq('source', sourceFilter);
    if (regionFilter) query = query.ilike('region', `%${regionFilter}%`);

    // Data filters
    if (dataFilter === 'with_email') query = query.not('email', 'is', null);
    if (dataFilter === 'without_email') query = query.is('email', null);
    if (dataFilter === 'with_phone') query = query.not('phone', 'is', null);
    if (dataFilter === 'with_purchases') query = query.gt('total_spent', 0);
    if (dataFilter === 'has_doctoralia') query = query.eq('has_doctoralia', true);

    // Search
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,rut.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (!error) {
      setLeads(data || []);
      setTotalCount(count || 0);
      setPage(p);
    }
    setLoading(false);
    setSelected(new Set());
    setSelectAll(false);
  };

  const fetchSegments = async () => {
    // Count by status
    const { data } = await supabase.from('marketing_leads').select('status, source');
    if (data) {
      const statusCounts = {};
      const sourceCounts = {};
      const tagCounts = {};

      data.forEach(l => {
        statusCounts[l.status || 'new'] = (statusCounts[l.status || 'new'] || 0) + 1;
        sourceCounts[l.source || 'unknown'] = (sourceCounts[l.source || 'unknown'] || 0) + 1;
      });

      setSegments({ statusCounts, sourceCounts });
    }
  };

  const handleSearch = () => fetchLeads(0);

  const toggleSelect = (id) => {
    const newSet = new Set(selected);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
    setSelectAll(!selectAll);
  };

  // Bulk actions
  const bulkUpdateStatus = async (newStatus) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from('marketing_leads').update({
      status: newStatus, updated_at: new Date().toISOString()
    }).in('id', ids);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: `${ids.length} leads actualizados a "${newStatus}"` });
      fetchLeads(page);
      fetchSegments();
    }
  };

  const bulkAddTag = async () => {
    if (!bulkTag.trim() || selected.size === 0) return;
    const ids = Array.from(selected);

    for (const id of ids) {
      const lead = leads.find(l => l.id === id);
      const currentTags = Array.isArray(lead?.tags) ? lead.tags :
        (typeof lead?.tags === 'string' ? JSON.parse(lead?.tags || '[]') : []);
      if (!currentTags.includes(bulkTag.trim().toLowerCase())) {
        currentTags.push(bulkTag.trim().toLowerCase());
        await supabase.from('marketing_leads').update({
          tags: JSON.stringify(currentTags), updated_at: new Date().toISOString()
        }).eq('id', id);
      }
    }

    toast({ title: `Tag "${bulkTag}" agregado a ${ids.length} leads` });
    setBulkTag('');
    fetchLeads(page);
  };

  const exportSegment = () => {
    const data = selected.size > 0 ? leads.filter(l => selected.has(l.id)) : leads;
    const headers = ['Nombre', 'Email', 'Teléfono', 'RUT', 'Fuente', 'Estado', 'Región', 'Ciudad', 'Pedidos', 'Gasto'];
    const rows = data.map(l => [
      l.full_name, l.email || '', l.phone || '', l.rut || '',
      l.source, l.status, l.region || '', l.city || '',
      l.total_orders || 0, l.total_spent || 0,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audiencia_${statusFilter}_${sourceFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleAddLead = async () => {
    if (!newLead.full_name && !newLead.email && !newLead.rut) {
      toast({ variant: 'destructive', title: 'Error', description: 'Ingresa al menos nombre, email o RUT' });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const lead = {
      ...newLead,
      email: newLead.email ? newLead.email.toLowerCase().trim() : null,
      rut: newLead.rut ? newLead.rut.trim() : null,
      full_name: newLead.full_name ? newLead.full_name.trim() : null,
      status: 'new',
      created_by: user?.id,
      imported_at: new Date().toISOString(),
    };

    // Check exact duplicates
    if (lead.rut) {
      const { data: existing } = await supabase.from('marketing_leads').select('id, full_name').eq('rut', lead.rut).maybeSingle();
      if (existing) {
        toast({ variant: 'destructive', title: 'RUT ya existe', description: `${existing.full_name} ya esta registrado con ese RUT` });
        return;
      }
    }
    if (lead.email) {
      const { data: existing } = await supabase.from('marketing_leads').select('id, full_name').eq('email', lead.email).maybeSingle();
      if (existing) {
        toast({ variant: 'destructive', title: 'Email ya existe', description: `${existing.full_name} ya esta registrado con ese email` });
        return;
      }
    }

    // Insert the new lead first
    const { data: inserted, error } = await supabase.from('marketing_leads').insert(lead).select().single();
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return;
    }

    // Search for a Supersalud match by name (fuzzy trigram)
    if (lead.full_name && lead.full_name.length > 5) {
      try {
        const { data: fuzzyMatches } = await supabase.rpc('find_supersalud_match', {
          p_name: lead.full_name,
          p_threshold: 0.35,
        });

        if (fuzzyMatches && fuzzyMatches.length > 0) {
          setMatchStep({ lead: inserted, match: fuzzyMatches[0], newLeadId: inserted.id });
          setShowAddModal(false);
          return;
        }
      } catch { /* no match found, continue */ }
    }

    // No match found - just close
    toast({ title: 'Lead agregado', description: `${lead.full_name || lead.email} agregado como nuevo contacto` });
    setShowAddModal(false);
    setNewLead({ full_name: '', email: '', phone: '', rut: '', specialty: '', city: '', region: '', source: 'manual', notes: '' });
    fetchLeads(0);
    fetchSegments();
  };

  const handleAcceptMatch = async () => {
    if (!matchStep) return;
    setMatchLoading(true);

    const { lead, match, newLeadId } = matchStep;

    // Merge: update supersalud record with new lead's data
    const updates = {};
    if (lead.email) updates.email = lead.email;
    if (lead.phone) updates.phone = lead.phone;
    if (lead.city && !match.city) updates.city = lead.city;
    if (lead.notes) updates.notes = lead.notes;
    updates.status = lead.status === 'new' ? 'contacted' : lead.status;
    updates.updated_at = new Date().toISOString();

    await supabase.from('marketing_leads').update(updates).eq('id', match.id);

    // Delete the new duplicate record
    await supabase.from('marketing_leads').delete().eq('id', newLeadId);

    toast({
      title: 'Asociado correctamente',
      description: `${lead.full_name} asociado con ${match.full_name} (RUT: ${match.rut})`,
    });

    setMatchStep(null);
    setMatchLoading(false);
    setNewLead({ full_name: '', email: '', phone: '', rut: '', specialty: '', city: '', region: '', source: 'manual', notes: '' });
    fetchLeads(0);
    fetchSegments();
  };

  const handleRejectMatch = () => {
    toast({ title: 'Lead guardado aparte', description: `${matchStep.lead.full_name} guardado como registro independiente` });
    setMatchStep(null);
    setNewLead({ full_name: '', email: '', phone: '', rut: '', specialty: '', city: '', region: '', source: 'manual', notes: '' });
    fetchLeads(0);
    fetchSegments();
  };

  // Edit existing lead
  const openEditLead = (lead) => {
    setEditLead(lead);
    setEditForm({ ...lead });
    setActionMenu(null);
  };

  const saveEditLead = async () => {
    if (!editLead) return;
    setEditSaving(true);
    const updates = {
      full_name: editForm.full_name?.trim() || null,
      email: editForm.email ? editForm.email.toLowerCase().trim() : null,
      phone: editForm.phone?.trim() || null,
      rut: editForm.rut?.trim() || null,
      specialty: editForm.specialty?.trim() || null,
      city: editForm.city?.trim() || null,
      region: editForm.region?.trim() || null,
      notes: editForm.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('marketing_leads').update(updates).eq('id', editLead.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Lead actualizado' });
      setEditLead(null);
      fetchLeads(page);
    }
    setEditSaving(false);
  };

  // Assign to funnel
  const openFunnelAssign = (lead) => {
    setFunnelLead(lead);
    setActionMenu(null);
  };

  const toggleFunnel = async (funnelId) => {
    if (!funnelLead) return;
    const currentTags = Array.isArray(funnelLead.tags) ? [...funnelLead.tags] :
      (typeof funnelLead.tags === 'string' ? (() => { try { return [...JSON.parse(funnelLead.tags)]; } catch { return []; } })() : []);

    const has = currentTags.includes(funnelId);
    const newTags = has ? currentTags.filter(t => t !== funnelId) : [...currentTags, funnelId];

    const { error } = await supabase.from('marketing_leads').update({
      tags: JSON.stringify(newTags), updated_at: new Date().toISOString()
    }).eq('id', funnelLead.id);

    if (!error) {
      setFunnelLead(prev => ({ ...prev, tags: JSON.stringify(newTags) }));
      setLeads(prev => prev.map(l => l.id === funnelLead.id ? { ...l, tags: JSON.stringify(newTags) } : l));
      toast({ title: has ? `Removido de ${funnelId}` : `Agregado a ${funnelId}` });
    }
  };

  // Merge leads
  const openMerge = (lead) => {
    setMergeSource(lead);
    setMergeTarget(null);
    setMergeSearch('');
    setMergeResults([]);
    setActionMenu(null);
  };

  const searchMergeTarget = async () => {
    if (!mergeSearch || mergeSearch.length < 2) return;
    const { data } = await supabase
      .from('marketing_leads')
      .select('id, full_name, email, rut, phone, source, city, region, tags')
      .neq('id', mergeSource.id)
      .or(`full_name.ilike.%${mergeSearch}%,email.ilike.%${mergeSearch}%,rut.ilike.%${mergeSearch}%`)
      .limit(10);
    setMergeResults(data || []);
  };

  const getMergePreview = () => {
    if (!mergeSource || !mergeTarget) return {};
    const s = mergeSource;
    const t = mergeTarget;
    const preview = { kept: {}, added: {}, combined: {} };

    // Email: keep both if different
    if (t.email && s.email && t.email !== s.email) {
      preview.kept.email = t.email;
      preview.added.additional_email = s.email;
    } else {
      preview.kept.email = t.email || s.email;
    }

    // Phone: keep both if different
    if (t.phone && s.phone && t.phone !== s.phone) {
      preview.kept.phone = t.phone;
      preview.added.additional_phone = s.phone;
    } else {
      preview.kept.phone = t.phone || s.phone;
    }

    // Other fields: fill missing
    preview.kept.rut = t.rut || s.rut;
    preview.kept.city = t.city || s.city;
    preview.kept.region = t.region || s.region;
    preview.kept.specialty = t.specialty || s.specialty;
    if (t.city && s.city && t.city !== s.city) preview.added.additional_city = s.city;
    if (t.specialty && s.specialty && t.specialty !== s.specialty) preview.added.additional_specialty = s.specialty;

    return preview;
  };

  const executeMerge = async () => {
    if (!mergeSource || !mergeTarget) return;
    setMergeLoading(true);

    const s = mergeSource;
    const t = mergeTarget;

    // Combine tags
    const parseTags = (tags) => Array.isArray(tags) ? tags :
      (typeof tags === 'string' ? (() => { try { return JSON.parse(tags); } catch { return []; } })() : []);
    const mergedTags = [...new Set([...parseTags(t.tags), ...parseTags(s.tags)])];

    // Parse existing metadata
    const targetMeta = (typeof t.metadata === 'object' && t.metadata) ? { ...t.metadata } :
      (typeof t.metadata === 'string' ? (() => { try { return JSON.parse(t.metadata); } catch { return {}; } })() : {});

    // Collect all different values (don't discard anything)
    const additionalEmails = targetMeta.additional_emails || [];
    const additionalPhones = targetMeta.additional_phones || [];

    // Email: if both have different emails, store the extra one
    if (s.email && t.email && s.email.toLowerCase() !== t.email.toLowerCase()) {
      if (!additionalEmails.includes(s.email.toLowerCase())) {
        additionalEmails.push(s.email.toLowerCase());
      }
    }

    // Phone: if both have different phones, store the extra one
    if (s.phone && t.phone && s.phone !== t.phone) {
      if (!additionalPhones.includes(s.phone)) {
        additionalPhones.push(s.phone);
      }
    }

    // Build metadata with all preserved data
    const mergedMeta = {
      ...targetMeta,
      ...(additionalEmails.length > 0 ? { additional_emails: additionalEmails } : {}),
      ...(additionalPhones.length > 0 ? { additional_phones: additionalPhones } : {}),
      ...(s.source && s.source !== t.source ? { also_found_in: s.source } : {}),
      merged_from: s.id,
      merged_at: new Date().toISOString(),
    };

    const updates = {
      // Fill missing fields from source
      email: t.email || (s.email ? s.email.toLowerCase().trim() : null),
      phone: t.phone || s.phone,
      rut: t.rut || s.rut,
      city: t.city || s.city,
      region: t.region || s.region,
      specialty: t.specialty || s.specialty,
      // Combine notes
      notes: [t.notes, s.notes].filter(Boolean).join('\n---\n') || null,
      tags: JSON.stringify(mergedTags),
      metadata: mergedMeta,
      updated_at: new Date().toISOString(),
    };

    // Need to remove source email from unique index before updating target
    // (in case source has the email we want to keep as primary)
    const { error: clearErr } = await supabase.from('marketing_leads')
      .update({ email: null }).eq('id', s.id);
    if (clearErr) {
      toast({ variant: 'destructive', title: 'Error', description: clearErr.message });
      setMergeLoading(false);
      return;
    }

    const { error: updateErr } = await supabase.from('marketing_leads').update(updates).eq('id', t.id);
    if (updateErr) {
      toast({ variant: 'destructive', title: 'Error al fusionar', description: updateErr.message });
      setMergeLoading(false);
      return;
    }

    const { error: deleteErr } = await supabase.from('marketing_leads').delete().eq('id', s.id);
    if (deleteErr) {
      toast({ variant: 'destructive', title: 'Error al eliminar duplicado', description: deleteErr.message });
    } else {
      toast({ title: 'Leads fusionados', description: `${s.full_name} fusionado con ${t.full_name}. Todos los datos conservados.` });
    }

    setMergeSource(null);
    setMergeTarget(null);
    setMergeLoading(false);
    fetchLeads(page);
    fetchSegments();
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Gestión de Audiencia
          </h1>
          <Badge variant="outline">{totalCount.toLocaleString()} contactos</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/admin/marketing/import"><Download className="h-4 w-4 mr-1 rotate-180" /> Importar CSV</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchLeads(0)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportSegment}>
            <Download className="h-4 w-4 mr-1" /> Exportar {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </div>
      </div>

      {/* Segment Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => { setStatusFilter(s.value); setPage(0); }}
            className={`p-3 rounded-lg border text-center transition-all ${
              statusFilter === s.value ? 'ring-2 ring-teal-400 border-teal-300' : 'hover:bg-gray-50'
            }`}
          >
            <p className="text-lg font-bold">{s.value === 'all' ? totalCount.toLocaleString() : (segments.statusCounts?.[s.value] || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-500 block mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, email o RUT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Fuente</label>
              <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
                className="border rounded px-3 py-2 text-sm">
                {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Datos</label>
              <select value={dataFilter} onChange={(e) => { setDataFilter(e.target.value); setPage(0); }}
                className="border rounded px-3 py-2 text-sm">
                {DATA_FILTERS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Región</label>
              <Input
                placeholder="Ej: Metropolitana"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLeads(0)}
                className="w-40"
              />
            </div>
            <Button size="sm" onClick={() => fetchLeads(0)}>
              <Filter className="h-4 w-4 mr-1" /> Filtrar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="bg-teal-50 border-teal-200">
          <CardContent className="p-3 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-teal-800">
              <CheckCircle className="h-4 w-4 inline mr-1" /> {selected.size} seleccionados
            </span>
            <div className="flex gap-2 flex-wrap">
              {selected.size === 2 && (
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => {
                  const ids = Array.from(selected);
                  const source = leads.find(l => l.id === ids[0]);
                  const target = leads.find(l => l.id === ids[1]);
                  if (source && target) {
                    setMergeSource(source);
                    setMergeTarget(target);
                  }
                }}>
                  <Merge className="h-3.5 w-3.5 mr-1" /> Fusionar (2)
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('contacted')}>Marcar Contactado</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('in_conversation')}>En Conversacion</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('converted')}>Convertido</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('unsubscribed')}>No Interesado</Button>
              <div className="flex gap-1">
                <Input
                  placeholder="Agregar tag..."
                  value={bulkTag}
                  onChange={(e) => setBulkTag(e.target.value)}
                  className="w-32 h-8"
                />
                <Button size="sm" onClick={bulkAddTag} disabled={!bulkTag.trim()}>
                  <Tag className="h-3 w-3" />
                </Button>
              </div>
              <Button size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setSelectAll(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Cargando...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No se encontraron contactos con estos filtros</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="p-3 w-10">
                      <input type="checkbox" checked={selectAll} onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-teal-600" />
                    </th>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Fuente</th>
                    <th className="p-3">Ciudad</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">Tags</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => {
                    const tags = Array.isArray(l.tags) ? l.tags :
                      (typeof l.tags === 'string' ? JSON.parse(l.tags || '[]') : []);
                    const isSelected = selected.has(l.id);

                    return (
                      <tr key={l.id} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-teal-50' : ''}`}>
                        <td className="p-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(l.id)}
                            className="h-4 w-4 rounded border-gray-300 text-teal-600" />
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-gray-900">{l.full_name || '—'}</p>
                          {l.rut && <p className="text-xs text-gray-400 font-mono">{l.rut}</p>}
                        </td>
                        <td className="p-3 text-xs space-y-0.5">
                          {l.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-gray-400" />{l.email}</p>}
                          {l.metadata?.additional_emails?.map(e => (
                            <p key={e} className="flex items-center gap-1 text-teal-600"><Mail className="h-3 w-3" />{e}</p>
                          ))}
                          {l.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" />{l.phone}</p>}
                          {l.metadata?.additional_phones?.map(p => (
                            <p key={p} className="flex items-center gap-1 text-teal-600"><Phone className="h-3 w-3" />{p}</p>
                          ))}
                          {!l.email && !l.phone && <span className="text-gray-300">Sin datos</span>}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">{l.source}</Badge>
                        </td>
                        <td className="p-3 text-xs text-gray-500">{l.city || '—'}</td>
                        <td className="p-3 text-xs text-gray-500">
                          {l.region ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{l.region}</span> : '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map(t => (
                              <Badge key={t} variant="secondary" className="text-[9px] px-1.5 py-0">{t}</Badge>
                            ))}
                            {tags.length > 3 && <Badge variant="outline" className="text-[9px]">+{tags.length - 3}</Badge>}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={`text-[10px] ${STATUS_OPTIONS.find(s => s.value === l.status)?.color || 'bg-gray-100'}`}>
                            {STATUS_OPTIONS.find(s => s.value === l.status)?.label || l.status}
                          </Badge>
                        </td>
                        <td className="p-3 relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === l.id ? null : l.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreHorizontal className="h-4 w-4 text-gray-400" />
                          </button>
                          {actionMenu === l.id && (
                            <div className="absolute right-0 top-10 z-20 bg-white border rounded-lg shadow-lg py-1 w-48">
                              <button
                                onClick={() => openEditLead(l)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Pencil className="h-3.5 w-3.5 text-gray-500" /> Editar lead
                              </button>
                              <button
                                onClick={() => openFunnelAssign(l)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <GitBranch className="h-3.5 w-3.5 text-gray-500" /> Asignar a embudo
                              </button>
                              <div className="border-t my-1" />
                              <button
                                onClick={() => openMerge(l)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Merge className="h-3.5 w-3.5 text-gray-500" /> Fusionar con otro
                              </button>
                            </div>
                          )}
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
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-gray-500">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount.toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0}
                  onClick={() => fetchLeads(page - 1)}>Anterior</Button>
                <span className="flex items-center text-sm text-gray-500 px-2">
                  {page + 1} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page + 1 >= totalPages}
                  onClick={() => fetchLeads(page + 1)}>Siguiente</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Fusionar Lead */}
      {mergeSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setMergeSource(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Merge className="h-5 w-5 text-orange-600" /> Fusionar Lead
              </h2>
              <button onClick={() => setMergeSource(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* Source lead */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-xs font-medium text-orange-700 mb-1">Lead a fusionar (se eliminara):</p>
                <p className="font-semibold">{mergeSource.full_name || 'Sin nombre'}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                  {mergeSource.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {mergeSource.email}</span>}
                  {mergeSource.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {mergeSource.phone}</span>}
                  {mergeSource.rut && <span>RUT: {mergeSource.rut}</span>}
                  {mergeSource.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {mergeSource.city}</span>}
                  <Badge variant="outline" className="text-[10px]">{mergeSource.source}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRight className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-400 mx-2">se fusionara con</span>
                <ArrowRight className="h-5 w-5 text-gray-400 rotate-180" />
              </div>

              {/* Search target */}
              {!mergeTarget ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar por nombre, email o RUT..."
                      value={mergeSearch}
                      onChange={(e) => setMergeSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchMergeTarget()}
                      className="flex-1"
                    />
                    <Button onClick={searchMergeTarget} size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {mergeResults.length > 0 && (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {mergeResults.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setMergeTarget(r)}
                          className="w-full text-left p-3 rounded-lg border hover:border-teal-400 hover:bg-teal-50 transition-all"
                        >
                          <p className="font-medium text-sm">{r.full_name || 'Sin nombre'}</p>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                            {r.email && <span><Mail className="h-3 w-3 inline mr-0.5" />{r.email}</span>}
                            {r.rut && <span>RUT: {r.rut}</span>}
                            {r.city && <span>{r.city}</span>}
                            <Badge variant="outline" className="text-[10px]">{r.source}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {mergeSearch && mergeResults.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">No se encontraron resultados</p>
                  )}
                </div>
              ) : (
                <div className="bg-teal-50 rounded-lg p-4 border-2 border-teal-300">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-teal-700 mb-1">Lead destino (se conservara):</p>
                    <button onClick={() => setMergeTarget(null)} className="text-gray-400 hover:text-gray-600 text-xs">Cambiar</button>
                  </div>
                  <p className="font-semibold">{mergeTarget.full_name || 'Sin nombre'}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                    {mergeTarget.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {mergeTarget.email}</span>}
                    {mergeTarget.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {mergeTarget.phone}</span>}
                    {mergeTarget.rut && <span>RUT: {mergeTarget.rut}</span>}
                    {mergeTarget.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {mergeTarget.city}</span>}
                    <Badge variant="outline" className="text-[10px]">{mergeTarget.source}</Badge>
                  </div>
                </div>
              )}

              {mergeTarget && (() => {
                const preview = getMergePreview();
                const s = mergeSource;
                const t = mergeTarget;
                return (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1.5">
                    <p className="font-medium text-gray-700 text-sm">Resultado de la fusion:</p>
                    <p>• Nombre: <strong>{t.full_name || s.full_name}</strong></p>
                    {/* Email */}
                    {t.email && s.email && t.email !== s.email ? (
                      <>
                        <p>• Email principal: <strong>{t.email}</strong></p>
                        <p>• Email adicional: <strong className="text-teal-700">{s.email}</strong> <span className="text-teal-600">(conservado)</span></p>
                      </>
                    ) : (
                      <p>• Email: <strong>{t.email || s.email || '—'}</strong></p>
                    )}
                    {/* Phone */}
                    {t.phone && s.phone && t.phone !== s.phone ? (
                      <>
                        <p>• Telefono principal: <strong>{t.phone}</strong></p>
                        <p>• Telefono adicional: <strong className="text-teal-700">{s.phone}</strong> <span className="text-teal-600">(conservado)</span></p>
                      </>
                    ) : (
                      t.phone || s.phone ? <p>• Telefono: <strong>{t.phone || s.phone}</strong></p> : null
                    )}
                    {/* RUT */}
                    <p>• RUT: <strong>{t.rut || s.rut || '—'}</strong></p>
                    {/* City */}
                    {t.city && s.city && t.city !== s.city ? (
                      <p>• Ciudad: <strong>{t.city}</strong> + <strong className="text-teal-700">{s.city}</strong></p>
                    ) : (
                      t.city || s.city ? <p>• Ciudad: <strong>{t.city || s.city}</strong></p> : null
                    )}
                    <p>• Tags: se combinan de ambos registros</p>
                    <p>• Notas: se concatenan si ambos tienen</p>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-green-700">Ningun dato se pierde. Los datos diferentes se guardan en campos adicionales.</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-2 p-5 border-t bg-gray-50 rounded-b-xl">
              <Button variant="outline" className="flex-1" onClick={() => setMergeSource(null)}>Cancelar</Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={executeMerge}
                disabled={!mergeTarget || mergeLoading}
              >
                {mergeLoading ? 'Fusionando...' : <><Merge className="h-4 w-4 mr-1" /> Fusionar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Lead */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditLead(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Pencil className="h-5 w-5 text-teal-600" /> Editar Lead
              </h2>
              <button onClick={() => setEditLead(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
                <Input value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">RUT</label>
                  <Input value={editForm.rut || ''} onChange={(e) => setEditForm({ ...editForm, rut: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Telefono</label>
                  <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Especialidad</label>
                  <Input value={editForm.specialty || ''} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <Input value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Region</label>
                  <Input value={editForm.region || ''} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
                <Input value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t bg-gray-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setEditLead(null)}>Cancelar</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={saveEditLead} disabled={editSaving}>
                {editSaving ? 'Guardando...' : <><Save className="h-4 w-4 mr-1" /> Guardar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar a Embudo */}
      {funnelLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setFunnelLead(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-600" /> Asignar a Embudo
              </h2>
              <button onClick={() => setFunnelLead(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">{funnelLead.full_name}</span>
                {funnelLead.email && <span className="text-gray-400"> ({funnelLead.email})</span>}
              </p>
              <div className="space-y-2">
                {FUNNELS.map(f => {
                  const currentTags = Array.isArray(funnelLead.tags) ? funnelLead.tags :
                    (typeof funnelLead.tags === 'string' ? (() => { try { return JSON.parse(funnelLead.tags); } catch { return []; } })() : []);
                  const isIn = currentTags.includes(f.id);

                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleFunnel(f.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isIn ? 'bg-purple-50 border-purple-300 text-purple-700' : 'hover:bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{f.icon}</span>
                        <span className="font-medium text-sm">{f.label}</span>
                      </span>
                      {isIn && <CheckCircle className="h-4 w-4 text-purple-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-5 border-t bg-gray-50 rounded-b-xl">
              <Button className="w-full" variant="outline" onClick={() => setFunnelLead(null)}>Listo</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Match con Supersalud */}
      {matchStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" /> Match encontrado en Supersalud
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Encontramos un registro similar. Quieres asociarlos?
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* New lead info */}
              <div className="bg-teal-50 rounded-lg p-4">
                <p className="text-xs font-medium text-teal-700 mb-1">Tu ingreso:</p>
                <p className="font-semibold">{matchStep.lead.full_name}</p>
                {matchStep.lead.email && <p className="text-sm text-gray-600 flex items-center gap-1"><Mail className="h-3 w-3" /> {matchStep.lead.email}</p>}
                {matchStep.lead.phone && <p className="text-sm text-gray-600 flex items-center gap-1"><Phone className="h-3 w-3" /> {matchStep.lead.phone}</p>}
              </div>

              <div className="text-center text-sm text-gray-400">se asociara con</div>

              {/* Supersalud match */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <p className="text-xs font-medium text-blue-700 mb-1">Registro Supersalud:</p>
                <p className="font-semibold">{matchStep.match.full_name}</p>
                {matchStep.match.rut && <p className="text-sm text-gray-600">RUT: {matchStep.match.rut}</p>}
                {matchStep.match.region && <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> {matchStep.match.region}</p>}
                {matchStep.match.specialty && <p className="text-sm text-gray-600">{matchStep.match.specialty}</p>}
              </div>

              <p className="text-xs text-gray-500 text-center">
                Al aceptar, el email y telefono se asignaran al registro Supersalud y se eliminara el duplicado.
              </p>
            </div>

            <div className="flex gap-2 p-5 border-t bg-gray-50 rounded-b-xl">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRejectMatch}
              >
                <X className="h-4 w-4 mr-1" /> No, guardar aparte
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleAcceptMatch}
                disabled={matchLoading}
              >
                {matchLoading ? 'Asociando...' : <><CheckCircle className="h-4 w-4 mr-1" /> Si, asociar</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Lead Individual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" /> Agregar Odontologo
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre completo *</label>
                <Input
                  placeholder="Ej: Pamela Villar Salas"
                  value={newLead.full_name}
                  onChange={(e) => setNewLead({ ...newLead, full_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">RUT</label>
                  <Input
                    placeholder="12.345.678-9"
                    value={newLead.rut}
                    onChange={(e) => setNewLead({ ...newLead, rut: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Telefono</label>
                  <Input
                    placeholder="+56 9 1234 5678"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Especialidad</label>
                  <Input
                    placeholder="Odontologo"
                    value={newLead.specialty}
                    onChange={(e) => setNewLead({ ...newLead, specialty: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <Input
                    placeholder="Santiago"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Region</label>
                  <Input
                    placeholder="Region Metropolitana"
                    value={newLead.region}
                    onChange={(e) => setNewLead({ ...newLead, region: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Fuente</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={newLead.source}
                  onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                >
                  {SOURCE_OPTIONS.filter(s => s.value !== 'all').map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
                <Input
                  placeholder="Notas adicionales..."
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-5 border-t bg-gray-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleAddLead}>
                <CheckCircle className="h-4 w-4 mr-1" /> Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudiencePage;
