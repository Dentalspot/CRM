import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  ArrowLeft, Search, RefreshCw, Phone, Mail, MapPin,
  ChevronRight, X, CheckCircle, Pencil, Save, Tag, Plus,
  GitBranch, GripVertical, ChevronDown, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const COLUMNS = [
  { id: 'new', label: 'Nuevos', color: 'bg-blue-500', bgLight: 'bg-blue-50 border-blue-200' },
  { id: 'contacted', label: 'Contactados', color: 'bg-yellow-500', bgLight: 'bg-yellow-50 border-yellow-200' },
  { id: 'in_conversation', label: 'En Conversacion', color: 'bg-purple-500', bgLight: 'bg-purple-50 border-purple-200' },
  { id: 'converted', label: 'Convertidos', color: 'bg-green-500', bgLight: 'bg-green-50 border-green-200' },
  { id: 'registered', label: 'Registrados', color: 'bg-teal-500', bgLight: 'bg-teal-50 border-teal-200' },
  { id: 'unsubscribed', label: 'No Interesado', color: 'bg-gray-400', bgLight: 'bg-gray-50 border-gray-200' },
];

const FUNNELS = [
  { id: 'all', label: 'Todos', icon: '📊' },
  { id: 'ados-2', label: 'ADOS-2', icon: '🧩' },
  { id: 'adir', label: 'ADI-R', icon: '📋' },
  { id: 'tea', label: 'TEA', icon: '🧠' },
  { id: 'sensorial', label: 'Sensorial', icon: '👐' },
  { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
  { id: 'membership', label: 'Membresia', icon: '⭐' },
];

const EMAIL_FUNNELS = [
  { id: 'ados-2', label: 'Embudo ADOS-2', icon: '🧩' },
  { id: 'adir', label: 'Embudo ADI-R', icon: '📋' },
  { id: 'tea', label: 'Embudo TEA', icon: '🧠' },
  { id: 'sensorial', label: 'Embudo Sensorial', icon: '👐' },
  { id: 'marketplace', label: 'Embudo Marketplace', icon: '🛒' },
  { id: 'membership', label: 'Embudo Membresia', icon: '⭐' },
  { id: 'newsletter', label: 'Newsletter', icon: '📰' },
  { id: 'onboarding', label: 'Onboarding', icon: '🚀' },
  { id: 'reactivacion', label: 'Reactivacion', icon: '🔄' },
];

const SOURCE_COLORS = {
  doctoralia: 'bg-blue-100 text-blue-700',
  supersalud: 'bg-red-100 text-red-700',
  woocommerce: 'bg-purple-100 text-purple-700',
  communicare: 'bg-amber-100 text-amber-700',
  csv_import: 'bg-cyan-100 text-cyan-700',
  manual: 'bg-gray-100 text-gray-700',
};

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') { try { return JSON.parse(tags); } catch { return []; } }
  return [];
};

const LeadCard = ({ lead, onEdit, onAddToFunnel, isDragging }) => {
  const tags = parseTags(lead.tags);
  const [showFunnelMenu, setShowFunnelMenu] = useState(false);

  return (
    <Card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', lead.id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.5';
      }}
      onDragEnd={(e) => { e.currentTarget.style.opacity = '1'; }}
      className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group ${isDragging ? 'opacity-50' : ''}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <GripVertical className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 shrink-0" />
              <p className="font-medium text-sm truncate">{lead.full_name || 'Sin nombre'}</p>
            </div>
            {lead.specialty && <p className="text-xs text-gray-500 truncate ml-4">{lead.specialty}</p>}
            {lead.is_registered && (
              <Badge className="text-[9px] bg-teal-100 text-teal-700 ml-4 mt-0.5">
                <UserCheck className="h-2.5 w-2.5 mr-0.5" /> En DentalSpot
              </Badge>
            )}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
            className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100">
            <Pencil className="h-3 w-3 text-gray-400" />
          </button>
        </div>

        <div className="space-y-0.5 ml-4">
          {lead.email && <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" /> {lead.email}</p>}
          {lead.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {lead.phone}</p>}
          {lead.city && <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" /> {lead.city}{lead.region ? `, ${lead.region}` : ''}</p>}
        </div>

        <div className="flex flex-wrap gap-1 ml-4">
          {lead.source && (
            <Badge className={`text-[10px] px-1.5 py-0 ${SOURCE_COLORS[lead.source] || SOURCE_COLORS.manual}`}>
              {lead.source}
            </Badge>
          )}
          {tags.slice(0, 2).map(t => (
            <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
          ))}
          {tags.length > 2 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{tags.length - 2}</Badge>}
        </div>

        {/* Add to email funnel button */}
        <div className="relative ml-4">
          <button
            onClick={(e) => { e.stopPropagation(); setShowFunnelMenu(!showFunnelMenu); }}
            className="text-[10px] text-teal-600 hover:text-teal-800 flex items-center gap-1 hover:bg-teal-50 rounded px-1.5 py-0.5"
          >
            <GitBranch className="h-3 w-3" /> Agregar a embudo
          </button>
          {showFunnelMenu && (
            <div className="absolute bottom-full left-0 mb-1 z-30 bg-white border rounded-lg shadow-lg py-1 w-52" onClick={(e) => e.stopPropagation()}>
              {EMAIL_FUNNELS.map(f => {
                const isIn = tags.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => { onAddToFunnel(lead.id, f.id); setShowFunnelMenu(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-gray-50 ${isIn ? 'text-teal-700 bg-teal-50' : ''}`}
                  >
                    <span>{f.icon} {f.label}</span>
                    {isIn && <CheckCircle className="h-3 w-3 text-teal-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LeadsKanbanPage = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [funnelFilter, setFunnelFilter] = useState('all');
  const [dragOverCol, setDragOverCol] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [columnCounts, setColumnCounts] = useState({});
  const [loadMoreLoading, setLoadMoreLoading] = useState({});

  // Edit modal
  const [editLead, setEditLead] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editTag, setEditTag] = useState('');
  const [saving, setSaving] = useState(false);

  // Email history for edited lead
  const [emailHistory, setEmailHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Per-column pagination
  const PAGE_SIZE = 50;
  const [columnPages, setColumnPages] = useState({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);

    // Fetch counts per status first
    const counts = {};
    for (const col of COLUMNS) {
      let q = supabase.from('marketing_leads').select('*', { count: 'exact', head: true }).eq('status', col.id);
      if (sourceFilter !== 'all') q = q.eq('source', sourceFilter);
      if (funnelFilter !== 'all') q = q.contains('tags', JSON.stringify([funnelFilter]));
      const { count } = await q;
      counts[col.id] = count || 0;
    }
    setColumnCounts(counts);
    setTotalCount(Object.values(counts).reduce((a, b) => a + b, 0));

    // Fetch first page of each column
    const allLeads = [];
    for (const col of COLUMNS) {
      let q = supabase.from('marketing_leads')
        .select('*')
        .eq('status', col.id)
        .order('updated_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (sourceFilter !== 'all') q = q.eq('source', sourceFilter);
      if (funnelFilter !== 'all') q = q.contains('tags', JSON.stringify([funnelFilter]));
      const { data } = await q;
      allLeads.push(...(data || []));
    }

    // Cross-reference with registered DentalSpot users
    const emails = allLeads.filter(l => l.email).map(l => l.email);
    let registeredEmails = new Set();
    if (emails.length > 0) {
      // Check in batches of 100
      for (let i = 0; i < emails.length; i += 100) {
        const batch = emails.slice(i, i + 100);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .in('email', batch);
        (profiles || []).forEach(p => { if (p.email) registeredEmails.add(p.email.toLowerCase()); });
      }
    }

    // Mark registered leads
    const enriched = allLeads.map(l => ({
      ...l,
      is_registered: l.email ? registeredEmails.has(l.email.toLowerCase()) : false,
    }));

    setLeads(enriched);
    setColumnPages({});
    setLoading(false);
  }, [sourceFilter, funnelFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const loadMoreForColumn = async (status) => {
    const currentPage = columnPages[status] || 0;
    const nextPage = currentPage + 1;
    setLoadMoreLoading(prev => ({ ...prev, [status]: true }));

    let q = supabase.from('marketing_leads')
      .select('*')
      .eq('status', status)
      .order('updated_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    if (sourceFilter !== 'all') q = q.eq('source', sourceFilter);
    if (funnelFilter !== 'all') q = q.contains('tags', JSON.stringify([funnelFilter]));

    const { data } = await q;
    if (data?.length) {
      setLeads(prev => [...prev, ...data]);
      setColumnPages(prev => ({ ...prev, [status]: nextPage }));
    }
    setLoadMoreLoading(prev => ({ ...prev, [status]: false }));
  };

  // Drag & Drop
  const moveLeadTo = async (leadId, newStatus) => {
    const updates = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'contacted') updates.contacted_at = new Date().toISOString();
    if (newStatus === 'converted') updates.converted_at = new Date().toISOString();

    const { error } = await supabase.from('marketing_leads').update(updates).eq('id', leadId);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
      setColumnCounts(prev => {
        const old = leads.find(l => l.id === leadId)?.status || 'new';
        return { ...prev, [old]: (prev[old] || 1) - 1, [newStatus]: (prev[newStatus] || 0) + 1 };
      });
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) moveLeadTo(leadId, targetStatus);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  // Edit lead
  const openEdit = async (lead) => {
    const tags = parseTags(lead.tags);
    setEditLead(lead);
    setEditForm({ ...lead, tags });
    setEmailHistory([]);

    // Fetch email history for this lead
    if (lead.email) {
      setLoadingHistory(true);
      const { data } = await supabase
        .from('email_notifications')
        .select('id, subject, status, sent_at, opened_at, clicked_at, notification_type, metadata')
        .eq('recipient_email', lead.email.toLowerCase())
        .order('sent_at', { ascending: false })
        .limit(20);
      setEmailHistory(data || []);
      setLoadingHistory(false);
    }
  };

  const saveEdit = async () => {
    if (!editLead) return;
    setSaving(true);
    const updates = {
      full_name: editForm.full_name?.trim() || null,
      email: editForm.email ? editForm.email.toLowerCase().trim() : null,
      phone: editForm.phone?.trim() || null,
      rut: editForm.rut?.trim() || null,
      specialty: editForm.specialty?.trim() || null,
      city: editForm.city?.trim() || null,
      region: editForm.region?.trim() || null,
      notes: editForm.notes?.trim() || null,
      tags: JSON.stringify(editForm.tags || []),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('marketing_leads').update(updates).eq('id', editLead.id);
    if (!error) {
      toast({ title: 'Lead actualizado' });
      setLeads(prev => prev.map(l => l.id === editLead.id ? { ...l, ...updates } : l));
      setEditLead(null);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    setSaving(false);
  };

  const addEditTag = (tag) => {
    const t = tag.trim().toLowerCase();
    if (t && !editForm.tags?.includes(t)) setEditForm(prev => ({ ...prev, tags: [...(prev.tags || []), t] }));
    setEditTag('');
  };

  const removeEditTag = (tag) => setEditForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));

  // Add to funnel
  const addToFunnel = async (leadId, funnelId) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    const tags = parseTags(lead.tags);
    const has = tags.includes(funnelId);
    const newTags = has ? tags.filter(t => t !== funnelId) : [...tags, funnelId];

    await supabase.from('marketing_leads').update({
      tags: JSON.stringify(newTags), updated_at: new Date().toISOString()
    }).eq('id', leadId);

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, tags: JSON.stringify(newTags) } : l));
    toast({ title: has ? `Removido de ${funnelId}` : `Agregado al embudo ${funnelId}` });
  };

  // Filter
  const filteredLeads = leads.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (l.full_name || '').toLowerCase().includes(s) ||
      (l.email || '').toLowerCase().includes(s) ||
      (l.rut || '').includes(s);
  });

  const getColumnLeads = (status) => filteredLeads.filter(l => (l.status || 'new') === status);

  return (
    <div className="space-y-4 h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/marketing"><ArrowLeft className="h-4 w-4 mr-2" /> Marketing</Link>
          </Button>
          <h1 className="text-xl font-bold">Pipeline de Leads</h1>
          <Badge variant="outline">{totalCount.toLocaleString()} leads</Badge>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 w-48" />
          </div>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="all">Todas las fuentes</option>
            {Object.keys(SOURCE_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={fetchLeads}><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Funnel tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FUNNELS.map(f => (
          <button
            key={f.id}
            onClick={() => setFunnelFilter(f.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              funnelFilter === f.id ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{f.icon}</span> {f.label}
            {f.id !== 'all' && (
              <span className="text-xs opacity-75">
                ({leads.filter(l => parseTags(l.tags).includes(f.id)).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Kanban board with drag & drop */}
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {COLUMNS.map(col => {
          const colLeads = getColumnLeads(col.id);
          const totalInCol = columnCounts[col.id] || 0;
          const hasMore = colLeads.length < totalInCol;
          const isOver = dragOverCol === col.id;

          return (
            <div key={col.id} className="flex-shrink-0 w-[280px] flex flex-col"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`rounded-t-lg p-3 border ${col.bgLight}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                    <span className="font-medium text-sm">{col.label}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{totalInCol.toLocaleString()}</Badge>
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto space-y-2 p-2 border-x border-b rounded-b-lg min-h-[200px] transition-colors ${
                isOver ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-300' : 'bg-gray-50/50'
              }`}>
                {loading ? (
                  <div className="text-center py-8 text-xs text-gray-400">Cargando...</div>
                ) : colLeads.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    {isOver ? 'Soltar aqui' : 'Sin leads'}
                  </div>
                ) : (
                  <>
                    {colLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onEdit={openEdit}
                        onAddToFunnel={addToFunnel}
                      />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => loadMoreForColumn(col.id)}
                        disabled={loadMoreLoading[col.id]}
                        className="w-full py-2 text-xs text-teal-600 hover:bg-teal-50 rounded border border-dashed border-teal-300 flex items-center justify-center gap-1"
                      >
                        {loadMoreLoading[col.id] ? 'Cargando...' : (
                          <><ChevronDown className="h-3 w-3" /> Cargar mas ({totalInCol - colLeads.length} restantes)</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Edit Lead */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditLead(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2"><Pencil className="h-5 w-5 text-teal-600" /> Editar Lead</h2>
              <button onClick={() => setEditLead(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nombre</label>
                <Input value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-gray-700 block mb-1">RUT</label>
                  <Input value={editForm.rut || ''} onChange={(e) => setEditForm({ ...editForm, rut: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 block mb-1">Telefono</label>
                  <Input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-gray-700 block mb-1">Especialidad</label>
                  <Input value={editForm.specialty || ''} onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 block mb-1">Ciudad</label>
                  <Input value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
                <div><label className="text-sm font-medium text-gray-700 block mb-1">Region</label>
                  <Input value={editForm.region || ''} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
                <Input value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
              {/* Tags */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Embudos y Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(editForm.tags || []).map(t => (
                    <Badge key={t} variant="outline" className="gap-1 pr-1">{t}
                      <button onClick={() => removeEditTag(t)} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {EMAIL_FUNNELS.filter(f => !(editForm.tags || []).includes(f.id)).map(f => (
                    <button key={f.id} onClick={() => addEditTag(f.id)}
                      className="text-xs px-2 py-1 rounded border border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50">
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Tag personalizado..." value={editTag} onChange={(e) => setEditTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEditTag(editTag)} className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => addEditTag(editTag)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Email History */}
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                  <Mail className="h-4 w-4" /> Historial de emails ({emailHistory.length})
                </label>
                {loadingHistory ? (
                  <p className="text-xs text-gray-400">Cargando historial...</p>
                ) : emailHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded p-3 text-center">No se han enviado emails a este contacto</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {emailHistory.map(e => (
                      <div key={e.id} className="flex items-center gap-2 p-2 rounded border bg-gray-50 text-xs">
                        <div className="shrink-0">
                          {e.opened_at ? (
                            <span title="Abierto" className="text-green-600">👁️</span>
                          ) : e.status === 'sent' || e.status === 'delivered' ? (
                            <span title="Enviado" className="text-blue-500">✉️</span>
                          ) : e.status === 'failed' || e.status === 'bounced' ? (
                            <span title="Fallido" className="text-red-500">❌</span>
                          ) : (
                            <span title={e.status}>📧</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{e.subject}</p>
                          <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                            {e.sent_at && <span>{new Date(e.sent_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                            {e.opened_at && <span className="text-green-600">Abierto {new Date(e.opened_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                            {e.clicked_at && <span className="text-purple-600">Click {new Date(e.clicked_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}</span>}
                            {e.status === 'failed' && <span className="text-red-500">Fallido</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t bg-gray-50 rounded-b-xl">
              <Button variant="outline" onClick={() => setEditLead(null)}>Cancelar</Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={saveEdit} disabled={saving}>
                {saving ? 'Guardando...' : <><Save className="h-4 w-4 mr-1" /> Guardar</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsKanbanPage;
